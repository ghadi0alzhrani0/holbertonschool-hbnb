let guestBookings = [];
let guestReviews = [];
let bookingHistoryItems = [];
let bookingGuests = [];
let activeBookingFilter = "all";

const UPCOMING_STATUSES = ["pending", "confirmed", "checked_in"];

function statusLabel(status = "") {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookingGroup(booking) {
  if (booking.status === "completed") {
    return "completed";
  }
  if (booking.status === "cancelled") {
    return "cancelled";
  }
  return UPCOMING_STATUSES.includes(booking.status) ? "upcoming" : "upcoming";
}

function bookingTimeline(booking, history) {
  if (booking.status === "cancelled") {
    return '<p class="booking-note">This trip was cancelled.</p>';
  }
  const order = ["pending", "confirmed", "checked_in", "completed"];
  const current = order.indexOf(booking.status);
  return `
    <div class="progress-line" aria-label="Booking progress">
      ${order.map((status, index) => `
        <span class="progress-step ${index <= current ? "done" : ""}">
          ${safe(statusLabel(status))}
        </span>
      `).join("")}
    </div>
  `;
}

function updateBookingStats() {
  const count = (group) => guestBookings.filter((booking) => bookingGroup(booking) === group).length;
  document.getElementById("upcoming-count").textContent = count("upcoming");
  document.getElementById("completed-count").textContent = count("completed");
  document.getElementById("cancelled-count").textContent = count("cancelled");
  document.getElementById("booking-count").textContent = guestBookings.length;
}

function currentBookings() {
  if (activeBookingFilter === "all") {
    return guestBookings;
  }
  return guestBookings.filter((booking) => bookingGroup(booking) === activeBookingFilter);
}

function bookingEmptyState() {
  if (!guestBookings.length) {
    return emptyState({
      icon: "suitcase",
      title: "No trips planned yet",
      text: "Your upcoming and past stays will appear here after you make a booking.",
      actionHref: "explore.html",
      actionLabel: "Find your first stay"
    });
  }
  const messages = {
    upcoming: ["No upcoming trips", "When your next stay is booked, it will appear here."],
    completed: ["No completed trips yet", "Past stays will move here after checkout."],
    cancelled: ["No cancelled trips", "Trips you cancel will be kept here for reference."]
  };
  const [title, text] = messages[activeBookingFilter] || ["Nothing here yet", "Try another booking filter."];
  return emptyState({ icon: "calendar", title, text });
}

function renderBookings() {
  const list = document.getElementById("booking-list");
  const filtered = currentBookings();
  if (!filtered.length) {
    list.innerHTML = bookingEmptyState();
    return;
  }

  list.innerHTML = filtered.map((booking, index) => {
    const guest = bookingGuests.find((item) => item.booking_id === booking.id);
    const reviewed = guestReviews.some((review) => review.place_id === booking.place_id);
    const statusClass = booking.status === "cancelled" ? "danger" : "green";
    return `
      <article class="booking-card card">
        <a class="booking-image-link" href="place.html?id=${encodeURIComponent(booking.place_id)}" aria-label="Open ${safe(booking.place_title || "stay")}">
          <img src="${safe(imageFor({}, index))}" alt="${safe(booking.place_title || "Booked stay")}">
        </a>
        <div class="booking-info">
          <div class="glass-row"><span class="badge ${statusClass}">${safe(statusLabel(booking.status))}</span></div>
          <h3>${safe(booking.place_title || "HBnB stay")}</h3>
          <p class="booking-dates">${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}</p>
          ${guest ? `<p class="muted small">${safe(guest.adults_count)} adults · ${safe(Number(guest.children_count || 0) + Number(guest.infants_count || 0))} children</p>` : ""}
          <div class="booking-total">${money(booking.total_price)}</div>
          ${bookingTimeline(booking, bookingHistoryItems)}
        </div>
        <div class="booking-actions">
          <a class="btn" href="place.html?id=${encodeURIComponent(booking.place_id)}">View stay</a>
          ${booking.status === "completed" && !reviewed ? `<button class="btn primary" type="button" data-review-place="${safe(booking.place_id)}">Add review</button>` : ""}
          ${!['cancelled', 'completed'].includes(booking.status) ? `<button class="btn danger" type="button" data-cancel="${safe(booking.id)}">Cancel booking</button>` : ""}
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
}

function setupBookingTabs() {
  document.querySelectorAll("[data-booking-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeBookingFilter = button.dataset.bookingFilter;
      document.querySelectorAll("[data-booking-filter]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      renderBookings();
    });
  });
}

async function loadBookings() {
  const list = document.getElementById("booking-list");
  if (!isAuthenticated()) {
    document.getElementById("booking-summary").classList.add("hidden");
    document.getElementById("booking-tabs").classList.add("hidden");
    list.innerHTML = emptyState({
      icon: "lock",
      title: "Sign in to see your bookings",
      text: "Keep upcoming trips, completed stays, and booking updates together in your account.",
      actionHref: "login.html?next=bookings.html",
      actionLabel: "Sign in"
    });
    return;
  }
  if (isManagementAccount()) {
    location.href = isAdminAccount() ? "admin_home.html" : "owner_bookings.html";
    return;
  }

  try {
    const [bookings, history, reviewSummaries, guests] = await Promise.all([
      fetchAll("/bookings/"),
      fetchAll("/booking-history/"),
      fetchAll("/reviews/"),
      fetchAll("/booking-guests/").catch(() => [])
    ]);
    guestReviews = (await Promise.all(reviewSummaries.map((item) => (
      api(`/reviews/${encodeURIComponent(item.id)}`).catch(() => null)
    )))).filter(Boolean);
    guestBookings = bookings;
    bookingHistoryItems = history;
    bookingGuests = guests;
    updateBookingStats();
    renderBookings();
    if (qs("created")) {
      toast("Your booking request has been sent.");
    }
  } catch (error) {
    list.innerHTML = emptyState({
      icon: "suitcase",
      title: "We could not load your trips",
      text: friendlyError(error),
      actionHref: "bookings.html",
      actionLabel: "Try again"
    });
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
    toast("Your booking has been cancelled.");
    await loadBookings();
  } catch (error) {
    toast(friendlyError(error, "We could not cancel this booking."));
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
    toast("Thank you. Your review is now published.");
    await loadBookings();
  } catch (error) {
    toast(friendlyError(error, "We could not publish your review."));
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupBookingTabs();
  loadBookings();
  document.getElementById("close-review-modal")?.addEventListener("click", closeReviewModal);
  document.getElementById("review-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "review-modal") {
      closeReviewModal();
    }
  });
  document.getElementById("booking-review-form")?.addEventListener("submit", submitBookingReview);
});
