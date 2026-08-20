function bookingProgress(status) {
  const order = ["pending", "confirmed", "checked_in", "completed"];
  const current = status === "cancelled" ? -1 : order.indexOf(status);
  return order.map((step, index) => `
    <span class="progress-step ${index <= current ? "done" : ""}">
      ${safe(step.replace("_", " "))}
    </span>
  `).join("");
}

async function loadGuestHome() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (isManagementAccount()) {
    location.href = "owner_home.html";
    return;
  }

  const identity = tokenPayload()?.sub;
  try {
    const [user, bookings, places, notifications] = await Promise.all([
      fetchUser(identity),
      fetchAll("/bookings/"),
      fetchPlaces(),
      fetchAll("/notifications/").catch(() => [])
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
    ` : '<div class="empty-state">No active booking. Your next destination is waiting.</div>';

    document.getElementById("guest-recommendations").innerHTML = places
      .slice(0, 3).map((place, index) => `
        <article class="place-card">
          <div class="cover"><img src="${safe(imageFor(place, index + 1))}" alt="${safe(place.title)}"></div>
          <div class="place-body"><div class="place-meta"><span>${safe(place.number_rooms)} rooms</span><span>${money(place.price)} / night</span></div><h3 class="place-title">${safe(place.title)}</h3><a class="details-button" href="place.html?id=${encodeURIComponent(place.id)}">View Details</a></div>
        </article>
      `).join("") || '<div class="empty-state full-grid">No recommendations available.</div>';
  } catch (error) {
    toast(error.message);
  }
}

document.addEventListener("DOMContentLoaded", loadGuestHome);
