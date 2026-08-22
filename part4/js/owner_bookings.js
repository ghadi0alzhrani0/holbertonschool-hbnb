let ownerReservations = [];
let reservationGuests = [];
let completedGuestReviews = [];

function reservationActions(booking) {
  const actions = [];
  if (booking.status === "pending") {
    actions.push(["confirmed", "Confirm", "primary"], ["cancelled", "Decline", "danger"]);
  } else if (booking.status === "confirmed") {
    actions.push(["checked_in", "Check in", "mint"], ["cancelled", "Cancel", "danger"]);
  } else if (booking.status === "checked_in") {
    actions.push(["completed", "Complete stay", "primary"]);
  }
  const reviewed = completedGuestReviews.some((item) => item.booking_id === booking.id);
  return actions.map(([status, label, style]) => `
    <button class="btn ${style}" type="button" data-reservation-id="${safe(booking.id)}" data-reservation-status="${status}">${label}</button>
  `).join("") + (booking.status === "completed" && !reviewed && booking.business_owner_id ? `
    <button class="btn" type="button" data-guest-review="${safe(booking.id)}" data-review-owner="${safe(booking.business_owner_id)}">Review guest</button>
  ` : "");
}

function renderOwnerReservations() {
  const selected = document.getElementById("booking-status-filter").value;
  const filtered = ownerReservations.filter((booking) => (
    selected === "all" || booking.status === selected
  ));
  document.getElementById("owner-booking-count").textContent = `${filtered.length} reservations`;
  const table = document.getElementById("owner-booking-table");
  table.innerHTML = filtered.map((booking) => {
    const guests = reservationGuests.find((item) => item.booking_id === booking.id);
    return `
      <tr>
        <td><strong>${safe(booking.guest_name)}</strong><div class="muted small">${safe(booking.user_id.slice(0, 8))}</div></td>
        <td>${safe(booking.place_title)}</td>
        <td>${dateFmt(booking.start_date)}<br><span class="muted small">to ${dateFmt(booking.end_date)}</span></td>
        <td>${guests ? `${safe(guests.adults_count)} ${guests.adults_count === 1 ? "adult" : "adults"}<br><span class="muted small">${safe(guests.children_count)} ${guests.children_count === 1 ? "child" : "children"} · ${safe(guests.infants_count)} ${guests.infants_count === 1 ? "infant" : "infants"}</span>` : "-"}</td>
        <td><span class="badge ${booking.status === "cancelled" ? "danger" : "green"}">${safe(booking.status)}</span><div>${money(booking.total_price)}</div></td>
        <td><div class="table-actions">${reservationActions(booking) || '<span class="muted small">No actions</span>'}</div></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6">${emptyState({
    icon: "calendar",
    title: "No reservations in this view",
    text: "Choose another status to see more reservations."
  })}</td></tr>`;

  table.querySelectorAll("[data-reservation-id]").forEach((button) => {
    button.addEventListener("click", () => updateReservation(button));
  });
  table.querySelectorAll("[data-guest-review]").forEach((button) => {
    button.addEventListener("click", () => openGuestReview(button));
  });
}

async function updateReservation(button) {
  button.disabled = true;
  try {
    await api(`/bookings/${encodeURIComponent(button.dataset.reservationId)}`, {
      method: "PUT",
      body: JSON.stringify({ status: button.dataset.reservationStatus })
    });
    toast("Reservation updated.");
    await loadOwnerReservations();
  } catch (error) {
    toast(friendlyError(error, "We could not update this reservation."));
  } finally {
    button.disabled = false;
  }
}

function openGuestReview(button) {
  document.getElementById("guest-review-booking").value = button.dataset.guestReview;
  document.getElementById("guest-review-owner").value = button.dataset.reviewOwner;
  document.getElementById("guest-review-modal").classList.remove("hidden");
}

function closeGuestReview() {
  document.getElementById("guest-review-modal").classList.add("hidden");
  document.getElementById("guest-review-form").reset();
}

async function submitGuestReview(event) {
  event.preventDefault();
  const button = document.getElementById("guest-review-submit");
  button.disabled = true;
  try {
    await api("/guest-reviews/", {
      method: "POST",
      body: JSON.stringify({
        booking_id: document.getElementById("guest-review-booking").value,
        owner_id: document.getElementById("guest-review-owner").value,
        cleanliness_rating: Number(document.getElementById("guest-cleanliness").value),
        communication_rating: Number(document.getElementById("guest-communication").value),
        respect_rules_rating: Number(document.getElementById("guest-rules").value),
        review_text: document.getElementById("guest-review-text").value.trim()
      })
    });
    closeGuestReview();
    toast("Guest review published.");
    await loadOwnerReservations();
  } catch (error) {
    toast(friendlyError(error, "We could not publish this guest review."));
  } finally {
    button.disabled = false;
  }
}

async function loadOwnerReservations() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isManagementAccount()) {
    location.href = "bookings.html";
    return;
  }
  try {
    const [bookings, guests, reviews] = await Promise.all([
      isOwnerAccount() ? fetchAll("/owners/me/bookings") : fetchAll("/bookings/"),
      fetchAll("/booking-guests/"),
      fetchAll("/guest-reviews/").catch(() => [])
    ]);
    ownerReservations = bookings;
    reservationGuests = guests;
    completedGuestReviews = reviews;
    renderOwnerReservations();
  } catch (error) {
    document.getElementById("owner-booking-table").innerHTML =
      `<tr><td colspan="6">${emptyState({
        icon: "suitcase",
        title: "We could not load reservations",
        text: friendlyError(error),
        actionHref: "owner_bookings.html",
        actionLabel: "Try again"
      })}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadOwnerReservations();
  document.getElementById("booking-status-filter")?.addEventListener("change", renderOwnerReservations);
  document.getElementById("close-guest-review")?.addEventListener("click", closeGuestReview);
  document.getElementById("guest-review-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "guest-review-modal") {
      closeGuestReview();
    }
  });
  document.getElementById("guest-review-form")?.addEventListener("submit", submitGuestReview);
});
