let place = null;
let availability = [];
let pricing = [];

async function loadPlacePage() {
  const placeId = qs("id");
  if (!placeId) {
    document.getElementById("place-loading").innerHTML = emptyState({
      icon: "search",
      title: "Choose a stay to continue",
      text: "Open a property from the Explore page to see its full details.",
      actionHref: "explore.html",
      actionLabel: "Explore stays"
    });
    return;
  }

  const reviewLinks = [
    document.getElementById("review-link"),
    document.getElementById("review-link-secondary")
  ];
  reviewLinks.forEach((link) => {
    if (!link) {
      return;
    }
    link.href = `add_review.html?place_id=${encodeURIComponent(placeId)}`;
    link.classList.toggle(
      "hidden", !isAuthenticated() || isManagementAccount()
    );
  });

  if (isManagementAccount()) {
    const bookingForm = document.getElementById("booking-form");
    bookingForm.innerHTML = `
      ${emptyState({
        icon: "lock",
        title: "Guest booking only",
        text: "Switch to a guest account to reserve a stay."
      })}
      <a class="btn primary full" href="owner_home.html">
        Open management dashboard
      </a>
    `;
  }

  try {
    place = await fetchPlace(placeId);
    displayPlaceDetails(place);
    await Promise.all([
      loadLocationAndType(place),
      loadExtendedDetails(placeId),
      loadReviews(placeId)
    ]);
    updateTotal();
  } catch (error) {
    document.getElementById("place-loading").innerHTML = emptyState({
      icon: "compass",
      title: "We could not open this stay",
      text: friendlyError(error),
      actionHref: "explore.html",
      actionLabel: "Back to Explore"
    });
  }
}

function displayPlaceDetails(currentPlace) {
  document.getElementById("place-loading").classList.add("hidden");
  document.getElementById("place-view").classList.remove("hidden");

  const title = currentPlace.title || "Stay";
  const owner = currentPlace.owner || {};
  const hostName = [owner.first_name, owner.last_name].filter(Boolean).join(" ");

  const cover = document.getElementById("place-cover");
  cover.src = imageFor(currentPlace);
  cover.alt = title;
  document.getElementById("place-name").textContent = title;
  document.getElementById("place-location").textContent = "HBnB destination";
  document.getElementById("place-rating").textContent = "Guest reviews";
  document.getElementById("place-type").textContent = "Property";
  document.getElementById("place-host").textContent = hostName
    ? `Hosted by ${hostName}`
    : "Hosted by an HBnB member";
  document.getElementById("place-description").textContent =
    currentPlace.description || "No description has been added yet.";
  document.getElementById("place-price").textContent = money(currentPlace.price);

  const facts = [
    ["Rooms", currentPlace.number_rooms],
    ["Bathrooms", currentPlace.number_bathrooms],
    ["Max guests", currentPlace.max_guest]
  ];
  document.getElementById("place-facts").innerHTML = facts.map(([label, value]) => `
    <div class="feature">
      <strong>${safe(value ?? "-")}</strong>
      <div class="muted small">${label}</div>
    </div>
  `).join("");

  const amenities = currentPlace.amenities || [];
  document.getElementById("amenities").innerHTML = amenities.length
    ? amenities.map((amenity) => `
      <div class="feature">
        <strong>${safe(amenity.name)}</strong>
      </div>
    `).join("")
    : emptyState({
      icon: "compass",
      title: "Amenities coming soon",
      text: "The host has not added the amenity list yet."
    });

  document.getElementById("place-gallery").innerHTML = IMAGE_POOL.slice(0, 4)
    .map((image, index) => `
      <img class="${index === 0 ? "main" : ""}" src="${safe(image)}"
        alt="${safe(title)} view ${index + 1}">
    `).join("");
}

async function loadLocationAndType(currentPlace) {
  const cityPromise = currentPlace.city_id
    ? api(`/cities/${encodeURIComponent(currentPlace.city_id)}`)
    : Promise.resolve(null);
  const typePromise = currentPlace.place_type_id
    ? api(`/place-types/${encodeURIComponent(currentPlace.place_type_id)}`)
    : Promise.resolve(null);

  const [city, placeType] = await Promise.all([
    cityPromise.catch(() => null),
    typePromise.catch(() => null)
  ]);

  if (placeType) {
    document.getElementById("place-type").textContent = placeType.name;
  }

  if (!city) {
    return;
  }

  const state = await api(`/states/${encodeURIComponent(city.state_id)}`)
    .catch(() => null);
  const country = state
    ? await api(`/countries/${encodeURIComponent(state.country_id)}`).catch(() => null)
    : null;
  const locationParts = [city.name, state?.name, country?.name].filter(Boolean);
  document.getElementById("place-location").textContent = locationParts.join(", ");
}

async function loadExtendedDetails(placeId) {
  const [rooms, periods, rates, policy] = await Promise.all([
    fetchAll("/room-details/").catch(() => []),
    fetchAll("/place-availability/").catch(() => []),
    fetchAll("/seasonal-pricing/").catch(() => []),
    place.cancellation_policy_id
      ? api(`/cancellation-policies/${encodeURIComponent(place.cancellation_policy_id)}`)
        .catch(() => null)
      : Promise.resolve(null)
  ]);

  const roomList = rooms.filter((item) => item.place_id === placeId);
  availability = periods.filter((item) => item.place_id === placeId);
  pricing = rates.filter((item) => item.place_id === placeId);

  document.getElementById("room-details").innerHTML = roomList.length
    ? roomList.map((room) => `
      <article class="card pad">
        <strong>${safe(room.room_name)}</strong>
        <div class="muted small room-note">
          ${safe(room.bed_type)} - ${safe(room.beds_count)} bed(s)
        </div>
      </article>
    `).join("")
    : emptyState({
      icon: "compass",
      title: "Room details coming soon",
      text: "The host has not added a room breakdown yet."
    });

  document.getElementById("availability").innerHTML = availability.length
    ? availability.map((period) => `
      <article class="card pad">
        <div class="glass-row availability-row">
          <strong>${dateFmt(period.start_date)} to ${dateFmt(period.end_date)}</strong>
          <span class="badge ${period.is_booked ? "danger" : "green"}">
            ${period.is_booked ? "Booked" : "Available"}
          </span>
        </div>
      </article>
    `).join("")
    : emptyState({
      icon: "calendar",
      title: "Choose your dates",
      text: "Use the booking form to check the dates you want."
    });

  document.getElementById("seasonal-pricing").innerHTML = pricing.length
    ? pricing.map((rate) => `
      <article class="card pad">
        <div class="eyebrow">Seasonal pricing</div>
        <strong>${money(rate.special_price)} / night</strong>
        <div class="muted small rate-note">
          ${dateFmt(rate.start_date)} to ${dateFmt(rate.end_date)}
        </div>
      </article>
    `).join("")
    : emptyState({
      icon: "calendar",
      title: "Standard price applies",
      text: "There are no special seasonal rates for this stay."
    });

  if (policy) {
    const section = document.getElementById("cancellation-policy");
    section.classList.remove("hidden");
    section.innerHTML = `
      <div class="eyebrow">Cancellation policy</div>
      <h3>${safe(policy.name)}</h3>
      <p class="place-info">${safe(policy.description)}</p>
    `;
  }
}

async function loadReviews(placeId) {
  const [reviews, ratingDetails, responses] = await Promise.all([
    api(`/places/${encodeURIComponent(placeId)}/reviews`).catch(() => []),
    fetchAll("/review-ratings/").catch(() => []),
    fetchAll("/review-responses/").catch(() => [])
  ]);

  const reviewsWithUsers = await Promise.all(reviews.map(async (review) => {
    const user = await fetchUser(review.user_id).catch(() => null);
    return {
      ...review,
      user,
      details: ratingDetails.find((item) => item.review_id === review.id),
      response: responses.find((item) => item.review_id === review.id)
    };
  }));

  const values = reviewsWithUsers
    .map((review) => Number(review.rating))
    .filter(Number.isFinite);
  document.getElementById("place-rating").textContent = values.length
    ? `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)} from ${values.length} ${values.length === 1 ? "review" : "reviews"}`
    : "New stay";

  document.getElementById("reviews").innerHTML = reviewsWithUsers.length
    ? reviewsWithUsers.map((review) => {
      const userName = review.user
        ? `${review.user.first_name} ${review.user.last_name}`
        : "HBnB guest";
      return `
        <article class="review-card">
          <div class="review-head">
            <strong>${safe(userName)}</strong>
            <span class="review-rating">Rating: ${safe(review.rating)} / 5</span>
          </div>
          <p class="place-info">${safe(review.text)}</p>
          ${review.details ? `
            <div class="muted small">
              Cleanliness ${safe(review.details.cleanliness)}/5 ·
              Accuracy ${safe(review.details.accuracy)}/5 ·
              Communication ${safe(review.details.communication)}/5 ·
              Location ${safe(review.details.location)}/5 ·
              Check in ${safe(review.details.check_in)}/5 ·
              Value ${safe(review.details.value)}/5
            </div>
          ` : ""}
          ${review.response ? `
            <div class="card pad" style="margin-top:12px">
              <strong>Host response</strong>
              <p class="place-info">${safe(review.response.response_text)}</p>
            </div>
          ` : ""}
        </article>
      `;
    }).join("")
    : emptyState({
      icon: "star",
      title: "No reviews yet",
      text: "Be the first guest to share an experience after a completed stay."
    });
}

function datesOverlap(start, end) {
  return availability.some((period) => {
    if (!period.is_booked) {
      return false;
    }
    const bookedStart = period.start_date.slice(0, 10);
    const bookedEnd = period.end_date.slice(0, 10);
    return start < bookedEnd && end > bookedStart;
  });
}

function numberOfNights(start, end) {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
}

function nightlyPrice(start) {
  const specialRate = pricing.find((rate) => (
    start >= rate.start_date.slice(0, 10)
    && start <= rate.end_date.slice(0, 10)
  ));
  return specialRate ? Number(specialRate.special_price) : Number(place.price);
}

function updateTotal() {
  if (!place) {
    return;
  }

  const start = document.getElementById("check-in").value;
  const end = document.getElementById("check-out").value;
  if (!start || !end) {
    document.getElementById("estimated-total").textContent = "SAR -";
    document.getElementById("price-breakdown").textContent =
      "Choose dates to calculate your stay.";
    return;
  }

  const nights = numberOfNights(start, end);
  const guests = ["adults-count", "children-count", "infants-count"]
    .reduce((total, id) => total + Number(document.getElementById(id).value || 0), 0);

  if (end <= start || nights < 1) {
    document.getElementById("estimated-total").textContent = "SAR -";
    document.getElementById("price-breakdown").textContent =
      "Check-out must be after check-in.";
    return;
  }

  const price = nightlyPrice(start);
  document.getElementById("estimated-total").textContent = money(price * nights);
  document.getElementById("price-breakdown").textContent =
    `${nights} night(s) x ${money(price)} - ${guests} guest(s)`;

  const unavailable = datesOverlap(start, end);
  const status = document.getElementById("booking-status");
  status.textContent = unavailable ? "Dates are unavailable" : "Dates look available";
  status.classList.toggle("unavailable", unavailable);
}

async function createBooking(event) {
  event.preventDefault();
  if (!authOrLogin(location.href)) {
    return;
  }

  const startDate = document.getElementById("check-in").value;
  const endDate = document.getElementById("check-out").value;
  const adults = Number(document.getElementById("adults-count").value);
  const children = Number(document.getElementById("children-count").value || 0);
  const infants = Number(document.getElementById("infants-count").value || 0);
  const guestCount = adults + children + infants;

  if (!startDate || !endDate || endDate <= startDate) {
    toast("Please choose valid dates.");
    return;
  }
  if (datesOverlap(startDate, endDate)) {
    toast("The selected dates are unavailable.");
    return;
  }
  if (adults < 1) {
    toast("At least one adult is required.");
    return;
  }
  if (place.max_guest && guestCount > place.max_guest) {
    toast(`This place allows up to ${place.max_guest} guests.`);
    return;
  }

  const query = new URLSearchParams({
    place_id: place.id,
    start_date: startDate,
    end_date: endDate,
    adults: String(adults),
    children: String(children),
    infants: String(infants)
  });
  location.href = `checkout.html?${query}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const checkIn = document.getElementById("check-in");
  const checkOut = document.getElementById("check-out");
  if (checkIn && checkOut) {
    checkIn.min = dateInputValue(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkOut.min = dateInputValue(tomorrow);
    checkIn.value = qs("check_in") || "";
    checkOut.value = qs("check_out") || "";
    const guests = Number(qs("guests"));
    if (Number.isFinite(guests) && guests >= 1) {
      document.getElementById("adults-count").value = String(Math.min(16, guests));
    }
  }

  loadPlacePage();
  ["check-in", "check-out", "adults-count", "children-count", "infants-count"]
    .forEach((id) => document.getElementById(id)?.addEventListener("input", updateTotal));
  document.getElementById("booking-form")?.addEventListener("submit", createBooking);
});
