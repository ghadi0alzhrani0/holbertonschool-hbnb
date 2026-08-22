let managementProperties = [];
let managementBookings = [];

function managementBookingActions(booking) {
  if (booking.status !== "pending") {
    return `<span class="badge green">${safe(booking.status)}</span>`;
  }
  return `
    <button class="btn primary" type="button" data-home-status="confirmed" data-home-booking="${safe(booking.id)}">Confirm</button>
    <button class="btn danger" type="button" data-home-status="cancelled" data-home-booking="${safe(booking.id)}">Decline</button>
  `;
}

async function loadManagementData() {
  if (isOwnerAccount()) {
    const [owner, properties, bookings] = await Promise.all([
      api("/owners/me"),
      fetchAll("/owners/me/places"),
      fetchAll("/owners/me/bookings")
    ]);
    return {
      name: owner.business_name,
      contact: `${owner.contact_person} · ${owner.email} · ${owner.phone_number}`,
      properties,
      bookings
    };
  }
  const identity = tokenPayload()?.sub;
  const [admin, properties, bookings] = await Promise.all([
    fetchUser(identity),
    fetchPlaces(),
    fetchAll("/bookings/")
  ]);
  return {
    name: `${admin.first_name} ${admin.last_name}`,
    contact: `${admin.email} · Full administrator access`,
    properties,
    bookings
  };
}

function renderManagementProperties() {
  document.getElementById("management-properties").innerHTML = managementProperties
    .slice(0, 6).map((place, index) => `
      <article class="place-card">
        <div class="cover"><img src="${safe(imageFor(place, index))}" alt="${safe(place.title)}"></div>
        <div class="place-body"><div class="place-meta"><span>${safe(place.number_rooms ?? 0)} ${(place.number_rooms ?? 0) === 1 ? "room" : "rooms"}</span><span>${money(place.price)} / night</span></div><h3 class="place-title">${safe(place.title)}</h3><a class="details-button" href="add_place.html?id=${encodeURIComponent(place.id)}">Edit property</a></div>
      </article>
    `).join("") || emptyState({
      icon: "compass",
      title: "Add your first property",
      text: "Published properties and their performance will appear here.",
      actionHref: "add_place.html",
      actionLabel: "Add property"
    });
}

function renderPendingBookings() {
  const pending = managementBookings.filter((booking) => booking.status === "pending");
  const container = document.getElementById("management-pending");
  container.innerHTML = pending.map((booking, index) => `
    <article class="compact-row">
      <img src="${safe(imageFor({}, index))}" alt="${safe(booking.place_title)}">
      <div><h3>${safe(booking.place_title)}</h3><p class="muted small">${safe(booking.guest_name)} · ${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}</p><strong>${money(booking.total_price)}</strong></div>
      <div class="table-actions">${managementBookingActions(booking)}</div>
    </article>
  `).join("") || emptyState({
    icon: "calendar",
    title: "No pending reservations",
    text: "New booking requests will appear here for your review."
  });
  container.querySelectorAll("[data-home-booking]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await api(`/bookings/${encodeURIComponent(button.dataset.homeBooking)}`, {
          method: "PUT",
          body: JSON.stringify({ status: button.dataset.homeStatus })
        });
        toast("Reservation updated.");
        await loadManagementHome();
      } catch (error) {
        toast(friendlyError(error, "We could not update this reservation."));
      } finally {
        button.disabled = false;
      }
    });
  });
}

async function renderManagementReviews() {
  const placeIds = new Set(managementProperties.map((place) => place.id));
  const [summaries, responses] = await Promise.all([
    fetchAll("/reviews/").catch(() => []),
    fetchAll("/review-responses/").catch(() => [])
  ]);
  const details = await Promise.all(summaries.map((item) => (
    api(`/reviews/${encodeURIComponent(item.id)}`).catch(() => null)
  )));
  const reviews = details.filter((item) => item && placeIds.has(item.place_id));
  const container = document.getElementById("management-reviews");
  container.innerHTML = reviews.slice(0, 6).map((review) => {
    const response = responses.find((item) => item.review_id === review.id);
    const place = managementProperties.find((item) => item.id === review.place_id);
    return `
      <article class="review-card">
        <div class="review-head"><strong>${safe(place?.title || "Property")}</strong><span class="review-rating">${safe(review.rating)} / 5</span></div>
        <p class="place-info">${safe(review.text)}</p>
        ${response ? `<div class="muted small"><strong>Response:</strong> ${safe(response.response_text)}</div>` : `<form class="form" data-response-review="${safe(review.id)}" data-response-owner="${safe(place?.business_owner_id || "")}"><div class="field"><label>Reply to guest</label><textarea required></textarea></div><button class="btn" type="submit">Publish response</button></form>`}
      </article>
    `;
  }).join("") || emptyState({
    icon: "star",
    title: "No guest reviews yet",
    text: "Reviews and your responses will appear here after completed stays."
  });
  container.querySelectorAll("[data-response-review]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api("/review-responses/", {
          method: "POST",
          body: JSON.stringify({
            review_id: form.dataset.responseReview,
            owner_id: form.dataset.responseOwner,
            response_text: form.querySelector("textarea").value.trim()
          })
        });
        toast("Response published.");
        await renderManagementReviews();
      } catch (error) {
        toast(friendlyError(error, "We could not publish this response."));
      }
    });
  });
}

async function loadManagementHome() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isManagementAccount()) {
    location.href = "user_home.html";
    return;
  }
  try {
    const data = await loadManagementData();
    managementProperties = data.properties;
    managementBookings = data.bookings;
    document.getElementById("management-role").textContent = isAdminAccount()
      ? "Administrator operations" : "Property operations";
    document.getElementById("management-name").textContent = data.name;
    document.getElementById("management-contact").textContent = data.contact;
    document.getElementById("management-property-count").textContent = data.properties.length;
    document.getElementById("management-booking-count").textContent = data.bookings.length;
    document.getElementById("management-pending-count").textContent = data.bookings
      .filter((booking) => booking.status === "pending").length;
    document.getElementById("management-revenue").textContent = money(data.bookings
      .filter((booking) => ["confirmed", "checked_in", "completed"].includes(booking.status))
      .reduce((total, booking) => total + Number(booking.total_price), 0));
    renderManagementProperties();
    renderPendingBookings();
    await renderManagementReviews();
  } catch (error) {
    toast(friendlyError(error, "We could not load the management dashboard."));
  }
}

document.addEventListener("DOMContentLoaded", loadManagementHome);
