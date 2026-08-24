function bookingProgress(status) {
  const order = ["pending", "confirmed", "checked_in", "completed"];
  const current = status === "cancelled" ? -1 : order.indexOf(status);
  return order.map((step, index) => `
    <span class="progress-step ${index <= current ? "done" : ""}">
      ${safe(step.replace("_", " "))}
    </span>
  `).join("");
}

function guestRecommendationCard(place, index, cities, reviews) {
  const rating = ratingFor(place.id, reviews);
  const href = placeLink(place.id);
  const saved = isWishlisted(place.id);
  return `
    <article class="place-card" role="link" tabindex="0" data-place-href="${safe(href)}">
      <button class="wishlist-button ${saved ? "saved" : ""}" type="button"
        data-wishlist="${safe(place.id)}" aria-pressed="${saved}"
        aria-label="${saved ? "Remove from wishlist" : "Save to wishlist"}">
        ${lineIcon("heart")}
      </button>
      <div class="cover"><img src="${safe(imageFor(place, index + 1))}" alt="${safe(place.title)}"></div>
      <div class="place-body">
        <div class="place-meta">
          <span>${safe(cities.get(place.city_id) || "Saudi Arabia")}</span>
          <span class="place-card-rating">${lineIcon("star")} ${rating.label}</span>
        </div>
        <h3 class="place-title">${safe(place.title)}</h3>
        <div class="glass-row place-card-actions">
          <span class="place-price">${money(place.price)} <span class="muted small">night</span></span>
          <a class="details-button" href="${safe(href)}">View details</a>
        </div>
      </div>
    </article>
  `;
}

async function loadGuestHome() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (isManagementAccount()) {
    location.href = accountHome();
    return;
  }

  const identity = tokenPayload()?.sub;
  try {
    const [user, bookings, places, notifications, cities, reviews] = await Promise.all([
      fetchUser(identity),
      fetchAll("/bookings/"),
      fetchPlaces(),
      fetchAll("/notifications/").catch(() => []),
      fetchAll("/cities/").catch(() => []),
      fetchReviewsWithDetails().catch(() => [])
    ]);
    document.getElementById("guest-name").textContent = user.first_name;
    document.getElementById("guest-booking-count").textContent = bookings.length;
    document.getElementById("guest-upcoming-count").textContent = bookings
      .filter((item) => ["pending", "confirmed", "checked_in"]
        .includes(item.status)).length;
    document.getElementById("guest-completed-count").textContent = bookings
      .filter((item) => item.status === "completed").length;
    document.getElementById("guest-notification-count").textContent =
      notifications.filter((item) => !item.is_seen).length;

    const active = bookings
      .filter((item) => !["cancelled", "completed"].includes(item.status))
      .sort((left, right) => new Date(left.start_date) - new Date(right.start_date))[0];
    document.getElementById("active-booking").innerHTML = active ? `
      <article class="compact-row">
        <img src="${safe(imageFor({}, 0))}" alt="${safe(active.place_title)}">
        <div>
          <span class="badge green">${safe(active.status)}</span>
          <h3>${safe(active.place_title)}</h3>
          <p class="muted small">${dateFmt(active.start_date)} to ${dateFmt(active.end_date)}</p>
          <div class="progress-line">${bookingProgress(active.status)}</div>
        </div>
        <a class="btn" href="bookings.html">Details</a>
      </article>
    ` : emptyState({
      icon: "suitcase",
      title: "No upcoming trip",
      text: "Your next destination is waiting whenever you are ready.",
      actionHref: "explore.html",
      actionLabel: "Find a stay"
    });

    const recommendations = document.getElementById("guest-recommendations");
    const cityMap = new Map(cities.map((city) => [city.id, city.name]));
    recommendations.innerHTML = places.length
      ? places.slice(0, 3).map((place, index) => (
        guestRecommendationCard(place, index, cityMap, reviews)
      )).join("")
      : emptyState({
        icon: "compass",
        title: "More stays are coming soon",
        text: "New destinations will appear here as hosts add their properties."
      });
    activatePlaceCards(recommendations, () => loadGuestHome());
  } catch (error) {
    toast(friendlyError(error, "We could not load your home page."));
  }
}

document.addEventListener("DOMContentLoaded", loadGuestHome);
