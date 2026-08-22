let placeEditorStep = 0;
let placeEditorId = null;
let editorAmenities = [];

function showPlaceEditorStep(step) {
  placeEditorStep = Math.max(0, Math.min(3, step));
  document.querySelectorAll("[data-form-step]").forEach((section) => {
    section.classList.toggle(
      "active", Number(section.dataset.formStep) === placeEditorStep
    );
  });
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.step) === placeEditorStep);
  });
  document.getElementById("previous-place-step").classList.toggle(
    "hidden", placeEditorStep === 0
  );
  document.getElementById("next-place-step").classList.toggle(
    "hidden", placeEditorStep === 3
  );
  document.getElementById("save-place").classList.toggle(
    "hidden", placeEditorStep !== 3
  );
}

function addRoomRow(room = {}) {
  const row = document.createElement("div");
  row.className = "room-row";
  row.dataset.roomId = room.id || "";
  row.innerHTML = `
    <div class="field"><label>Room name</label><input name="room_name" value="${safe(room.room_name || "")}" required></div>
    <div class="field"><label>Bed type</label><input name="bed_type" value="${safe(room.bed_type || "")}" required></div>
    <div class="field"><label>Beds</label><input name="beds_count" type="number" min="1" value="${safe(room.beds_count || 1)}" required></div>
    <button class="icon-button" type="button" aria-label="Remove room" ${room.id ? "disabled" : ""}>×</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.getElementById("room-builder").appendChild(row);
}

function fillSelect(id, items, placeholder) {
  document.getElementById(id).innerHTML = `<option value="">${placeholder}</option>`
    + items.map((item) => `<option value="${safe(item.id)}">${safe(item.name || item.business_name)}</option>`).join("");
}

function renderAmenityPicker(amenities, selected = []) {
  const selectedIds = new Set(selected);
  document.getElementById("amenity-picker").innerHTML = amenities.map((item) => `
    <label class="check-tile"><input type="checkbox" name="amenities" value="${safe(item.id)}" ${selectedIds.has(item.id) ? "checked" : ""}><span>${safe(item.name)}</span></label>
  `).join("");
}

function setEditorValue(id, value) {
  document.getElementById(id).value = value ?? "";
}

async function loadExistingPlace(id) {
  const [place, rooms] = await Promise.all([
    fetchPlace(id),
    fetchAll("/room-details/")
  ]);
  document.getElementById("place-editor-title").innerHTML = "Edit your<br><em>property.</em>";
  setEditorValue("place-title-input", place.title);
  setEditorValue("place-description-input", place.description);
  setEditorValue("place-type-input", place.place_type_id);
  setEditorValue("place-policy-input", place.cancellation_policy_id);
  setEditorValue("place-business-owner-input", place.business_owner_id);
  setEditorValue("place-rooms-input", place.number_rooms);
  setEditorValue("place-bathrooms-input", place.number_bathrooms);
  setEditorValue("place-guests-input", place.max_guest);
  setEditorValue("place-city-input", place.city_id);
  setEditorValue("place-price-input", place.price);
  setEditorValue("place-latitude-input", place.latitude);
  setEditorValue("place-longitude-input", place.longitude);
  renderAmenityPicker(editorAmenities, (place.amenities || []).map((item) => item.id));
  const roomItems = rooms.filter((room) => room.place_id === place.id);
  document.getElementById("room-builder").innerHTML = "";
  roomItems.forEach(addRoomRow);
  if (!roomItems.length) {
    addRoomRow();
  }
}

async function loadPlaceEditor() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isManagementAccount()) {
    location.href = "user_home.html";
    return;
  }
  placeEditorId = qs("id");
  try {
    const [types, policies, cities, amenities, owners] = await Promise.all([
      fetchAll("/place-types/"),
      fetchAll("/cancellation-policies/"),
      fetchAll("/cities/"),
      fetchAll("/amenities/"),
      isAdminAccount() ? fetchAll("/owners/") : Promise.resolve([])
    ]);
    editorAmenities = amenities;
    fillSelect("place-type-input", types, "Choose property type");
    fillSelect("place-policy-input", policies, "Choose policy");
    fillSelect("place-city-input", cities, "Choose city");
    if (isAdminAccount()) {
      document.getElementById("admin-owner-field").classList.remove("hidden");
      fillSelect("place-business-owner-input", owners, "No business owner");
    }
    renderAmenityPicker(amenities);
    addRoomRow();
    if (placeEditorId) {
      await loadExistingPlace(placeEditorId);
    }
  } catch (error) {
    toast(friendlyError(error, "We could not prepare the property form."));
  }
}

function editorPayload() {
  const payload = {
    title: document.getElementById("place-title-input").value.trim(),
    description: document.getElementById("place-description-input").value.trim(),
    price: Number(document.getElementById("place-price-input").value),
    latitude: Number(document.getElementById("place-latitude-input").value),
    longitude: Number(document.getElementById("place-longitude-input").value),
    city_id: document.getElementById("place-city-input").value,
    place_type_id: document.getElementById("place-type-input").value,
    cancellation_policy_id: document.getElementById("place-policy-input").value,
    number_rooms: Number(document.getElementById("place-rooms-input").value),
    number_bathrooms: Number(document.getElementById("place-bathrooms-input").value),
    max_guest: Number(document.getElementById("place-guests-input").value),
    amenities: [...document.querySelectorAll('input[name="amenities"]:checked')]
      .map((input) => input.value)
  };
  if (isAdminAccount() && document.getElementById("place-business-owner-input").value) {
    payload.business_owner_id = document.getElementById("place-business-owner-input").value;
  }
  return payload;
}

async function saveRooms(placeId) {
  const rows = [...document.querySelectorAll(".room-row")];
  await Promise.all(rows.map((row) => {
    const data = {
      room_name: row.querySelector('[name="room_name"]').value.trim(),
      bed_type: row.querySelector('[name="bed_type"]').value.trim(),
      beds_count: Number(row.querySelector('[name="beds_count"]').value)
    };
    if (row.dataset.roomId) {
      return api(`/room-details/${encodeURIComponent(row.dataset.roomId)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    }
    return api("/room-details/", {
      method: "POST",
      body: JSON.stringify({ place_id: placeId, ...data })
    });
  }));
}

async function savePlace(event) {
  event.preventDefault();
  const errorBox = document.getElementById("place-editor-error");
  errorBox.classList.remove("show");
  const button = document.getElementById("save-place");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    const place = await api(
      placeEditorId ? `/places/${encodeURIComponent(placeEditorId)}` : "/places/",
      {
        method: placeEditorId ? "PUT" : "POST",
        body: JSON.stringify(editorPayload())
      }
    );
    await saveRooms(place.id);
    toast("Property saved.");
    location.href = "manage_places.html";
  } catch (error) {
    errorBox.textContent = friendlyError(error, "We could not save this property.");
    errorBox.classList.add("show");
    showPlaceEditorStep(3);
  } finally {
    button.disabled = false;
    button.textContent = "Save property";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPlaceEditor();
  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => showPlaceEditorStep(Number(button.dataset.step)));
  });
  document.getElementById("previous-place-step")?.addEventListener("click", () => showPlaceEditorStep(placeEditorStep - 1));
  document.getElementById("next-place-step")?.addEventListener("click", () => {
    const section = document.querySelector(`[data-form-step="${placeEditorStep}"]`);
    const invalid = [...section.querySelectorAll("input, select, textarea")]
      .find((input) => !input.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    showPlaceEditorStep(placeEditorStep + 1);
  });
  document.getElementById("add-room-row")?.addEventListener("click", () => addRoomRow());
  document.getElementById("place-editor-form")?.addEventListener("submit", savePlace);
});
