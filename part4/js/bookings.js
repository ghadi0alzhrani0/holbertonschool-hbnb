let guestBookings = [];
let guestReviews = [];

function bookingTimeline(booking, history) {
  const events = history.filter((item) => item.booking_id === booking.id);
  const statuses = ["pending", ...events.map((item) => item.new_status)];
  const order = ["pending", "confirmed", "checked_in", "completed"];
  const current = booking.status === "cancelled" ? -1 : order.indexOf(booking.status);
  return `
    <div class="progress-line">
      ${order.map((status, index) => `
        <span class="progress-step ${index <= current ? "done" : ""}">
          ${safe(status.replace("_", " "))}
        </span>
      `).join("")}
    </div>
    ${booking.status === "cancelled" ? '<div class="muted small">This booking was cancelled.</div>' : ""}
    <div class="muted small">${statuses.length} recorded status event(s)</div>
  `;
}

async function loadBookings() {
  if (!authOrLogin()) {
    return;
  }
  if (isManagementAccount()) {
    location.href = "owner_bookings.html";
    return;
  }

  const list = document.getElementById("booking-list");
  try {
    const [bookings, history, reviewSummaries, guests] = await Promise.all([
      fetchAll("/bookings/"),
      fetchAll("/booking-history/"),
      fetchAll("/reviews/"),
      fetchAll("/booking-guests/").catch(() => [])
    ]);
    const reviews = (await Promise.all(reviewSummaries.map((item) => (
      api(`/reviews/${encodeURIComponent(item.id)}`).catch(() => null)
    )))).filter(Boolean);
    guestBookings = bookings;
    guestReviews = reviews;
    document.getElementById("booking-count").textContent = bookings.length;
    document.getElementById("history-count").textContent = history.length;
    document.getElementById("booking-empty").classList.toggle("hidden", bookings.length > 0);

    list.innerHTML = bookings.map((booking, index) => {
      const guest = guests.find((item) => item.booking_id === booking.id);
      const reviewed = reviews.some((review) => review.place_id === booking.place_id);
      return `
        <article class="booking-card card">
          <img src="${safe(imageFor({}, index))}" alt="${safe(booking.place_title || "Booked stay")}">
          <div class="booking-info">
            <div class="glass-row"><span class="badge ${booking.status === "cancelled" ? "danger" : "green"}">${safe(booking.status)}</span><span class="muted small">#${safe(String(booking.id).slice(0, 8))}</span></div>
            <h3>${safe(booking.place_title || "HBnB stay")}</h3>
            <div class="muted small">${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}</div>
            ${guest ? `<div class="muted small">${safe(guest.adults_count)} adults · ${safe(guest.children_count)} children · ${safe(guest.infants_count)} infants</div>` : ""}
            <div class="booking-total">${money(booking.total_price)}</div>
            ${bookingTimeline(booking, history)}
          </div>
          <div class="booking-actions">
            <a class="btn" href="place.html?id=${encodeURIComponent(booking.place_id)}">Open stay</a>
            ${booking.status === "completed" && !reviewed ? `<button class="btn primary" type="button" data-review-place="${safe(booking.place_id)}">Add review</button>` : ""}
            ${!["cancelled", "completed"].includes(booking.status) ? `<button class="btn danger" type="button" data-cancel="${safe(booking.id)}">Cancel booking</button>` : ""}
          </div>
        </article>
      `;
    }).join("");

    list.querySelectorAll("[data-cancel]").forEach((button) => {
      button.addEventListener("click", () => cancelBooking(button.dataset.cancel));
    });
    list.querySelectorAll("[data-review-place]").forEach((button) => {
      button.addEventListener("click", () => openReviewModal(button.dataset.reviewPlace));
    });
    if (qs("created")) {
      toast("Booking request created successfully.");
    }
  } catch (error) {
    list.innerHTML = `<div class="empty">${safe(error.message)}</div>`;
  }
}

async function cancelBooking(id) {
  if (!window.confirm("Cancel this booking?")) {
    return;
  }
  try {
    await api(`/bookings/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" })
    });
    toast("Booking cancelled.");
    await loadBookings();
  } catch (error) {
    toast(error.message);
  }
}

function openReviewModal(placeId) {
  document.getElementById("review-booking-place").value = placeId;
  document.getElementById("review-modal").classList.remove("hidden");
}

function closeReviewModal() {
  document.getElementById("review-modal").classList.add("hidden");
  document.getElementById("booking-review-form").reset();
}

async function submitBookingReview(event) {
  event.preventDefault();
  const button = document.getElementById("booking-review-submit");
  button.disabled = true;
  try {
    const review = await api("/reviews/", {
      method: "POST",
      body: JSON.stringify({
        place_id: document.getElementById("review-booking-place").value,
        text: document.getElementById("booking-review-text").value.trim(),
        rating: Number(document.getElementById("booking-overall").value)
      })
    });
    await api("/review-ratings/", {
      method: "POST",
      body: JSON.stringify({
        review_id: review.id,
        cleanliness: Number(document.getElementById("booking-cleanliness").value),
        accuracy: Number(document.getElementById("booking-accuracy").value),
        communication: Number(document.getElementById("booking-communication").value),
        location: Number(document.getElementById("booking-location").value),
        check_in: Number(document.getElementById("booking-check-in").value),
        value: Number(document.getElementById("booking-value").value)
      })
    });
    closeReviewModal();
    toast("Review published.");
    await loadBookings();
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBookings();
  document.getElementById("close-review-modal")?.addEventListener("click", closeReviewModal);
  document.getElementById("review-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "review-modal") {
      closeReviewModal();
    }
  });
  document.getElementById("booking-review-form")?.addEventListener("submit", submitBookingReview);
});
