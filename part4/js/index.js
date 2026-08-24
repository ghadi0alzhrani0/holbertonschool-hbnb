let places = [];
let placeReviews = [];
let cities = new Map();
let spotlightIndex = 0;

function placeLocation(place) {
  return cities.get(place.city_id) || "Saudi Arabia";
}

function fillCitySelects(cityList) {
  const options = cityList
    .map((city) => `<option value="${safe(city.id)}">${safe(city.name)}</option>`)
    .join("");
  document.getElementById("hero-destination").innerHTML =
    `<option value="all">Anywhere</option>${options}`;
  document.getElementById("home-city").innerHTML =
    `<option value="all">All destinations</option>${options}`;
}

function updateGuestCount(step) {
  const input = document.getElementById("hero-guests");
  const value = Math.min(16, Math.max(1, Number(input.value) + step));
  input.value = String(value);
  document.getElementById("guest-output").textContent =
    `${value} ${value === 1 ? "guest" : "guests"}`;
  document.getElementById("guest-minus").disabled = value === 1;
  document.getElementById("guest-plus").disabled = value === 16;
}

function setupDateFields() {
  const checkIn = document.getElementById("hero-check-in");
  const checkOut = document.getElementById("hero-check-out");
  const today = dateInputValue(new Date());
  checkIn.min = today;
  checkOut.min = today;
  checkIn.addEventListener("change", () => {
    checkOut.min = checkIn.value || today;
    if (checkOut.value && checkOut.value <= checkIn.value) {
      checkOut.value = "";
    }
  });
}

function submitHomeSearch(event) {
  event.preventDefault();
  const destination = document.getElementById("hero-destination").value;
  const checkIn = document.getElementById("hero-check-in").value;
  const checkOut = document.getElementById("hero-check-out").value;
  const guests = document.getElementById("hero-guests").value;
  const message = document.getElementById("search-message");

  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    message.textContent = "Choose both check-in and check-out dates.";
    return;
  }
  if (checkIn && checkOut && checkOut <= checkIn) {
    message.textContent = "Check-out must be after check-in.";
    return;
  }

  message.textContent = "";
  const query = new URLSearchParams({ destination, guests });
  if (checkIn) {
    query.set("check_in", checkIn);
    query.set("check_out", checkOut);
  }
  location.href = `explore.html?${query}`;
}

function stayCard(place, index) {
  const rating = ratingFor(place.id, placeReviews);
  const href = placeLink(place.id);
  const saved = isWishlisted(place.id);
  return `
    <article class="place-card" role="link" tabindex="0"
      data-place-href="${safe(href)}" data-price="${safe(place.price)}">
      <button class="wishlist-button ${saved ? "saved" : ""}" type="button"
        data-wishlist="${safe(place.id)}" aria-pressed="${saved}"
        aria-label="${saved ? "Remove from wishlist" : "Save to wishlist"}"
        title="${saved ? "Remove from wishlist" : "Save to wishlist"}">
        ${lineIcon("heart")}
      </button>
      <div class="cover"><img src="${safe(imageFor(place, index))}" alt="${safe(place.title || "Stay")}"></div>
      <div class="place-body">
        <div class="place-meta">
          <span>${safe(placeLocation(place))}</span>
          <span class="place-card-rating" aria-label="${rating.value ? `${rating.label} out of 5` : "New listing"}">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9L12 2.8Z"></path></svg>
            ${rating.label}
          </span>
        </div>
        <h3 class="place-title">${safe(place.title || "Stay")}</h3>
        <div class="glass-row place-card-actions">
          <span class="place-price">${money(place.price)} <span class="muted small">night</span></span>
          <a class="details-button" href="${safe(href)}">View details</a>
        </div>
      </div>
    </article>
  `;
}

function displayPlaces() {
  const listElement = document.getElementById("places-list");
  const priceFilter = document.getElementById("price-filter").value;
  const cityFilter = document.getElementById("home-city").value;
  const filteredPlaces = places.filter((place) => (
    (priceFilter === "all" || Number(place.price) <= Number(priceFilter))
    && (cityFilter === "all" || place.city_id === cityFilter)
  ));

  listElement.innerHTML = filteredPlaces.length
    ? filteredPlaces.map(stayCard).join("")
    : emptyState({
      icon: "search",
      title: "No stays match these filters",
      text: "Try another destination or increase your maximum price.",
      actionHref: "explore.html",
      actionLabel: "Explore all stays"
    });
  activatePlaceCards(listElement, displayPlaces);
}

function moveSpotlight(step) {
  if (!places.length) {
    return;
  }
  spotlightIndex = (spotlightIndex + step + places.length) % places.length;
  displaySpotlight();
}

function displaySpotlight() {
  const stage = document.getElementById("spotlight-stage");
  const items = places.slice(0, 7);
  if (!items.length) {
    stage.innerHTML = emptyState({
      icon: "compass",
      title: "New stays are on the way",
      text: "Check back soon for handpicked places and sunny escapes.",
      actionHref: "explore.html",
      actionLabel: "Explore destinations"
    });
    document.getElementById("spot-count").textContent = "00 / 00";
    return;
  }
  if (spotlightIndex >= items.length) {
    spotlightIndex = 0;
  }

  stage.innerHTML = items.map((place, index) => {
    const position = (index - spotlightIndex + items.length) % items.length;
    const className = position === 0 ? "is-center"
      : position === 1 ? "is-right"
        : position === items.length - 1 ? "is-left" : "is-far";
    const href = placeLink(place.id);
    return `
      <article class="spotlight-card ${className}">
        <img src="${safe(imageFor(place, index))}" alt="${safe(place.title || "Stay")}">
        <div class="spot-info">
          <div class="eyebrow spotlight-label">Featured stay</div>
          <h3>${safe(place.title || "Stay")}</h3>
          <p>${safe(placeLocation(place))}</p>
          <div class="glass-row spotlight-actions">
            <span class="badge spotlight-price">${money(place.price)} / night</span>
            <a class="btn sun" href="${safe(href)}">View details</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
  document.getElementById("spot-count").textContent =
    `${String(spotlightIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
}

async function loadIndex() {
  document.getElementById("home-search")?.addEventListener("submit", submitHomeSearch);
  document.getElementById("guest-minus")?.addEventListener("click", () => updateGuestCount(-1));
  document.getElementById("guest-plus")?.addEventListener("click", () => updateGuestCount(1));
  document.getElementById("price-filter")?.addEventListener("change", displayPlaces);
  document.getElementById("home-city")?.addEventListener("change", displayPlaces);
  document.getElementById("spot-prev")?.addEventListener("click", () => moveSpotlight(-1));
  document.getElementById("spot-next")?.addEventListener("click", () => moveSpotlight(1));
  setupDateFields();
  updateGuestCount(0);

  try {
    const [placeList, cityList, reviews] = await Promise.all([
      fetchPlaces(),
      fetchAll("/cities/").catch(() => []),
      fetchReviewsWithDetails().catch(() => [])
    ]);
    places = placeList;
    placeReviews = reviews;
    cities = new Map(cityList.map((city) => [city.id, city.name]));
    fillCitySelects(cityList);
    displayPlaces();
    displaySpotlight();
  } catch (error) {
    const state = emptyState({
      icon: "compass",
      title: "We could not load the stays",
      text: friendlyError(error),
      actionHref: "index.html",
      actionLabel: "Try again"
    });
    document.getElementById("places-list").innerHTML = state;
    document.getElementById("spotlight-stage").innerHTML = state;
  }
}

document.addEventListener("DOMContentLoaded", loadIndex);
