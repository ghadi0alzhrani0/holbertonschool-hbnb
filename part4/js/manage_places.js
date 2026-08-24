let managedPlaces = [];
let managedAvailability = [];
let managedPricing = [];

function propertyPeriods(placeId) {
  return managedAvailability.filter((item) => item.place_id === placeId);
}

function propertyRates(placeId) {
  return managedPricing.filter((item) => item.place_id === placeId);
}

function renderPropertyManager() {
  const query = document.getElementById("property-search").value.trim().toLowerCase();
  const filtered = managedPlaces.filter((place) => (
    !query || `${place.title} ${place.description}`.toLowerCase().includes(query)
  ));
  document.getElementById("property-count").textContent = `${filtered.length} properties`;
  const container = document.getElementById("property-manager");
  container.innerHTML = filtered.map((place, index) => {
    const periods = propertyPeriods(place.id);
    const rates = propertyRates(place.id);
    return `
      <article class="property-row">
        <img src="${safe(imageFor(place, index))}" alt="${safe(place.title)}">
        <div class="property-main">
          <div class="eyebrow">${safe(place.number_rooms)} ${place.number_rooms === 1 ? "room" : "rooms"} · ${safe(place.max_guest)} ${place.max_guest === 1 ? "guest" : "guests"}</div>
          <h3>${safe(place.title)}</h3>
          <p class="muted">${safe(place.description)}</p>
          <div class="glass-row"><strong>${money(place.price)} / night</strong><span>${periods.length} availability ${periods.length === 1 ? "period" : "periods"}</span><span>${rates.length} special ${rates.length === 1 ? "rate" : "rates"}</span></div>
          <div class="table-actions"><a class="btn" href="place.html?id=${encodeURIComponent(place.id)}">Public page</a><a class="btn primary" href="add_place.html?id=${encodeURIComponent(place.id)}">Edit property</a><button class="btn danger" type="button" data-delete-place="${safe(place.id)}">Delete</button></div>
        </div>
        <div class="property-tools">
          <form class="inline-form" data-availability-place="${safe(place.id)}"><div class="field"><label>Available from</label><input name="start_date" type="date" required></div><div class="field"><label>Available until</label><input name="end_date" type="date" required></div><button class="btn" type="submit">Add availability</button></form>
          <form class="inline-form" data-pricing-place="${safe(place.id)}"><div class="field"><label>Special from</label><input name="start_date" type="date" required></div><div class="field"><label>Special until</label><input name="end_date" type="date" required></div><div class="field"><label>Nightly rate</label><input name="special_price" type="number" min="0" step="0.01" required></div><button class="btn" type="submit">Add seasonal price</button></form>
        </div>
      </article>
    `;
  }).join("") || emptyState({
    icon: "search",
    title: managedPlaces.length ? "No properties match this search" : "Add your first property",
    text: managedPlaces.length
      ? "Try another title or clear the search."
      : "Create a property to start managing availability and seasonal prices.",
    actionHref: managedPlaces.length ? "manage_places.html" : "add_place.html",
    actionLabel: managedPlaces.length ? "Clear search" : "Add property"
  });

  container.querySelectorAll("[data-availability-place]").forEach((form) => {
    form.addEventListener("submit", submitAvailability);
  });
  container.querySelectorAll("[data-pricing-place]").forEach((form) => {
    form.addEventListener("submit", submitPricing);
  });
  container.querySelectorAll("[data-delete-place]").forEach((button) => {
    button.addEventListener("click", () => deleteManagedPlace(button.dataset.deletePlace));
  });
}

async function submitAvailability(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await api("/place-availability/", {
      method: "POST",
      body: JSON.stringify({
        place_id: form.dataset.availabilityPlace,
        start_date: form.elements.start_date.value,
        end_date: form.elements.end_date.value,
        is_booked: false
      })
    });
    form.reset();
    toast("Availability added.");
    await loadPropertyManager();
  } catch (error) {
    toast(friendlyError(error, "We could not add this availability."));
  }
}

async function submitPricing(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    await api("/seasonal-pricing/", {
      method: "POST",
      body: JSON.stringify({
        place_id: form.dataset.pricingPlace,
        start_date: form.elements.start_date.value,
        end_date: form.elements.end_date.value,
        special_price: Number(form.elements.special_price.value)
      })
    });
    form.reset();
    toast("Seasonal price added.");
    await loadPropertyManager();
  } catch (error) {
    toast(friendlyError(error, "We could not add this seasonal price."));
  }
}

async function deleteManagedPlace(id) {
  if (!window.confirm("Delete this property and its related records?")) {
    return;
  }
  try {
    await api(`/places/${encodeURIComponent(id)}`, { method: "DELETE" });
    toast("Property deleted.");
    await loadPropertyManager();
  } catch (error) {
    toast(friendlyError(error, "We could not delete this property."));
  }
}

async function loadPropertyManager() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isOwnerAccount()) {
    location.href = accountHome();
    return;
  }
  try {
    const summaries = await fetchAll("/owners/me/places");
    const [details, periods, rates] = await Promise.all([
      Promise.all(summaries.map((place) => fetchPlace(place.id))),
      fetchAll("/place-availability/"),
      fetchAll("/seasonal-pricing/")
    ]);
    managedPlaces = details;
    managedAvailability = periods;
    managedPricing = rates;
    renderPropertyManager();
  } catch (error) {
    document.getElementById("property-manager").innerHTML = emptyState({
      icon: "compass",
      title: "We could not load your properties",
      text: friendlyError(error),
      actionHref: "manage_places.html",
      actionLabel: "Try again"
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPropertyManager();
  document.getElementById("property-search")?.addEventListener("input", renderPropertyManager);
});
