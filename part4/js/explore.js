let explorePlaces = [];
let exploreReviews = [];
let exploreCities = new Map();
let exploreTypes = new Map();
let explorePolicies = new Map();
let exploreMap = null;
let exploreMarkers = [];

function exploreLocation(place) {
  return exploreCities.get(place.city_id) || "Saudi Arabia";
}

function fillExploreSelect(id, items, firstLabel) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="all">${safe(firstLabel)}</option>` + items
    .map((item) => `<option value="${safe(item.id)}">${safe(item.name)}</option>`)
    .join("");
}

function currentExploreParams() {
  return {
    check_in: document.getElementById("explore-check-in").value,
    check_out: document.getElementById("explore-check-out").value,
    guests: document.getElementById("explore-guests").value
  };
}

function currentExplorePlaces() {
  const cityId = document.getElementById("explore-destination").value;
  const maximum = document.getElementById("explore-price").value;
  const typeId = document.getElementById("explore-type").value;
  const policyId = document.getElementById("explore-policy").value;
  const amenityId = document.getElementById("explore-amenity").value;
  const guests = Math.max(1, Number(document.getElementById("explore-guests").value || 1));

  return explorePlaces.filter((place) => (
    (cityId === "all" || String(place.city_id) === cityId)
    && (maximum === "all" || Number(place.price) <= Number(maximum))
    && (typeId === "all" || String(place.place_type_id) === typeId)
    && (policyId === "all" || String(place.cancellation_policy_id) === policyId)
    && (!place.max_guest || Number(place.max_guest) >= guests)
    && (amenityId === "all" || (place.amenities || [])
      .some((amenity) => String(amenity.id) === amenityId))
  ));
}

function exploreCard(place, index) {
  const rating = ratingFor(place.id, exploreReviews);
  const href = placeLink(place.id, currentExploreParams());
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
          <span>${safe(exploreLocation(place))}</span>
          <span class="place-rating" aria-label="${rating.value ? `${rating.label} out of 5` : "New listing"}">
            ${lineIcon("star")} ${rating.label}
          </span>
        </div>
        <h3 class="place-title">${safe(place.title || "Stay")}</h3>
        <p class="muted small">${safe((place.description || "A comfortable HBnB stay.").slice(0, 105))}</p>
        <div class="glass-row">
          <span class="badge">${safe(exploreTypes.get(place.place_type_id) || "Property")}</span>
          <span class="badge green">${safe(explorePolicies.get(place.cancellation_policy_id) || "Standard")}</span>
        </div>
        <div class="glass-row place-card-actions">
          <span class="place-price">${money(place.price)} <span class="muted small">night</span></span>
          <a class="details-button" href="${safe(href)}">View details</a>
        </div>
      </div>
    </article>
  `;
}

function renderExploreMap(places) {
  const mapElement = document.getElementById("explore-map");
  if (!window.L) {
    mapElement.innerHTML = emptyState({
      icon: "compass",
      title: "Map unavailable",
      text: "You can still browse every stay in the list."
    });
    return;
  }

  if (!exploreMap) {
    exploreMap = L.map("explore-map", { scrollWheelZoom: false })
      .setView([24.2, 43.8], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18
    }).addTo(exploreMap);
  }

  exploreMarkers.forEach((marker) => marker.remove());
  const params = currentExploreParams();
  exploreMarkers = places.filter((place) => (
    Number.isFinite(Number(place.latitude))
    && Number.isFinite(Number(place.longitude))
  )).map((place) => {
    const href = placeLink(place.id, params);
    return L.marker([place.latitude, place.longitude])
      .addTo(exploreMap)
      .bindPopup(`<strong>${safe(place.title)}</strong><br>${money(place.price)} / night<br><a href="${safe(href)}">View details</a>`);
  });

  if (exploreMarkers.length) {
    exploreMap.fitBounds(L.featureGroup(exploreMarkers).getBounds().pad(0.18), {
      maxZoom: 11
    });
  }
}

function renderExplorePlaces() {
  const message = document.getElementById("explore-message");
  const checkIn = document.getElementById("explore-check-in").value;
  const checkOut = document.getElementById("explore-check-out").value;
  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    message.textContent = "Choose both check-in and check-out dates.";
  } else if (checkIn && checkOut && checkOut <= checkIn) {
    message.textContent = "Check-out must be after check-in.";
  } else {
    message.textContent = "";
  }

  const filtered = currentExplorePlaces();
  const grid = document.getElementById("explore-grid");
  document.getElementById("explore-count").textContent =
    `${filtered.length} ${filtered.length === 1 ? "stay" : "stays"}`;
  grid.innerHTML = filtered.length
    ? filtered.map(exploreCard).join("")
    : `<div class="explore-grid-empty">${emptyState({
      icon: "search",
      title: "No stays match these filters",
      text: "Try another destination, fewer guests, or a higher price.",
      actionHref: "explore.html",
      actionLabel: "Clear search"
    })}</div>`;
  activatePlaceCards(grid, renderExplorePlaces);
  renderExploreMap(filtered);
}

function applySearchFromURL() {
  const destination = qs("destination");
  const guests = Number(qs("guests"));
  if (destination && document.querySelector(`#explore-destination option[value="${CSS.escape(destination)}"]`)) {
    document.getElementById("explore-destination").value = destination;
  }
  if (Number.isFinite(guests) && guests >= 1) {
    document.getElementById("explore-guests").value = String(Math.min(16, guests));
  }
  document.getElementById("explore-check-in").value = qs("check_in") || "";
  document.getElementById("explore-check-out").value = qs("check_out") || "";
}

function setupExploreControls() {
  const checkIn = document.getElementById("explore-check-in");
  const checkOut = document.getElementById("explore-check-out");
  const today = dateInputValue(new Date());
  checkIn.min = today;
  checkOut.min = today;
  checkIn.addEventListener("change", () => {
    checkOut.min = checkIn.value || today;
    if (checkOut.value && checkOut.value <= checkIn.value) {
      checkOut.value = "";
    }
    renderExplorePlaces();
  });

  ["explore-destination", "explore-check-out", "explore-guests", "explore-price",
    "explore-type", "explore-policy", "explore-amenity"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", renderExplorePlaces);
  });

  document.getElementById("explore-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  document.getElementById("clear-explore")?.addEventListener("click", () => {
    document.getElementById("explore-form").reset();
    document.getElementById("explore-guests").value = "1";
    renderExplorePlaces();
  });
}

async function loadExplorePage() {
  try {
    const [places, cities, types, policies, amenities, reviews] = await Promise.all([
      fetchPlaces(),
      fetchAll("/cities/").catch(() => []),
      fetchAll("/place-types/").catch(() => []),
      fetchAll("/cancellation-policies/").catch(() => []),
      fetchAll("/amenities/").catch(() => []),
      fetchReviewsWithDetails().catch(() => [])
    ]);
    explorePlaces = places;
    exploreReviews = reviews;
    exploreCities = new Map(cities.map((city) => [city.id, city.name]));
    exploreTypes = new Map(types.map((item) => [item.id, item.name]));
    explorePolicies = new Map(policies.map((item) => [item.id, item.name]));
    fillExploreSelect("explore-destination", cities, "All destinations");
    fillExploreSelect("explore-type", types, "All types");
    fillExploreSelect("explore-policy", policies, "All policies");
    fillExploreSelect("explore-amenity", amenities, "All amenities");
    applySearchFromURL();
    setupExploreControls();
    renderExplorePlaces();
  } catch (error) {
    document.getElementById("explore-grid").innerHTML = emptyState({
      icon: "compass",
      title: "We could not load the stays",
      text: friendlyError(error),
      actionHref: "explore.html",
      actionLabel: "Try again"
    });
    document.getElementById("explore-count").textContent = "Unavailable";
  }
}

document.addEventListener("DOMContentLoaded", loadExplorePage);
