function ownerBookingActions(booking) {
  if (booking.status === "pending") {
    return `
      <button class="btn primary" type="button"
        data-booking-action="confirmed" data-booking-id="${safe(booking.id)}">
        Confirm
      </button>
      <button class="btn danger" type="button"
        data-booking-action="cancelled" data-booking-id="${safe(booking.id)}">
        Cancel
      </button>
    `;
  }
  if (booking.status === "confirmed") {
    return `
      <button class="btn mint" type="button"
        data-booking-action="checked_in" data-booking-id="${safe(booking.id)}">
        Check in
      </button>
      <button class="btn danger" type="button"
        data-booking-action="cancelled" data-booking-id="${safe(booking.id)}">
        Cancel
      </button>
    `;
  }
  return '<span class="muted small">No action required</span>';
}

function renderOwnerProperties(properties) {
  const container = document.getElementById("owner-properties");
  container.innerHTML = properties.map((property, index) => `
    <article class="card owner-property-card">
      <img src="${safe(imageFor(property, index))}"
        alt="${safe(property.title)}">
      <div class="owner-property-body">
        <div class="owner-property-meta">
          <span>${safe(property.number_rooms)} rooms</span>
          <span>${safe(property.max_guest)} guests</span>
        </div>
        <h3>${safe(property.title)}</h3>
        <div class="owner-property-meta">
          <span>${money(property.price)} / night</span>
          <span>${safe(property.booking_count)} bookings</span>
        </div>
        <a class="btn full" href="place.html?id=${encodeURIComponent(property.id)}">
          View property
        </a>
      </div>
    </article>
  `).join("") || emptyState({
    icon: "compass",
    title: "Add your first property",
    text: "Your listed properties will appear here.",
    actionHref: "add_place.html",
    actionLabel: "Add property"
  });
}

function renderOwnerBookings(bookings) {
  const container = document.getElementById("owner-bookings");
  container.innerHTML = bookings.map((booking) => `
    <article class="card owner-booking">
      <div>
        <span class="badge status-${safe(booking.status)}">
          ${safe(booking.status)}
        </span>
        <h3>${safe(booking.place_title || "HBnB property")}</h3>
        <div class="muted small">
          Guest: ${safe(booking.guest_name || "HBnB guest")}
        </div>
      </div>
      <div>
        <strong>${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}</strong>
        <div class="muted small">${money(booking.total_price)}</div>
      </div>
      <div class="owner-booking-actions">
        ${ownerBookingActions(booking)}
      </div>
    </article>
  `).join("") || emptyState({
    icon: "calendar",
    title: "No reservations yet",
    text: "New guest reservations will appear here."
  });

  container.querySelectorAll("[data-booking-action]").forEach((button) => {
    button.addEventListener("click", () => updateOwnerBooking(button));
  });
}

async function updateOwnerBooking(button) {
  button.disabled = true;
  try {
    await api(`/bookings/${encodeURIComponent(button.dataset.bookingId)}`, {
      method: "PUT",
      body: JSON.stringify({ status: button.dataset.bookingAction })
    });
    toast("Reservation updated.");
    await loadOwnerDashboard();
  } catch (error) {
    toast(friendlyError(error, "We could not update this reservation."));
  } finally {
    button.disabled = false;
  }
}

async function loadOwnerDashboard() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isOwnerAccount()) {
    location.href = "profile.html";
    return;
  }

  try {
    const [owner, properties, bookings] = await Promise.all([
      api("/owners/me"),
      fetchAll("/owners/me/places"),
      fetchAll("/owners/me/bookings")
    ]);
    document.getElementById("owner-business").textContent = owner.business_name;
    document.getElementById("owner-contact").textContent =
      `${owner.contact_person} - ${owner.email} - ${owner.phone_number}`;
    document.getElementById("owner-property-count").textContent = properties.length;
    document.getElementById("owner-booking-count").textContent = bookings.length;
    document.getElementById("owner-pending-count").textContent =
      bookings.filter((booking) => booking.status === "pending").length;
    document.getElementById("owner-review-count").textContent = properties
      .reduce((total, property) => total + property.review_count, 0);
    renderOwnerProperties(properties);
    renderOwnerBookings(bookings);
  } catch (error) {
    toast(friendlyError(error, "We could not load the owner dashboard."));
    const state = emptyState({
      icon: "compass",
      title: "We could not load the dashboard",
      text: friendlyError(error),
      actionHref: "owner_dashboard.html",
      actionLabel: "Try again"
    });
    document.getElementById("owner-properties").innerHTML = state;
    document.getElementById("owner-bookings").innerHTML = state;
  }
}

document.addEventListener("DOMContentLoaded", loadOwnerDashboard);
