let explorePlaces = [];
let exploreCities = new Map();
let exploreTypes = new Map();
let explorePolicies = new Map();
let exploreMap = null;
let exploreMarkers = [];

function exploreLocation(place) {
  return exploreCities.get(place.city_id) || "Saudi Arabia";
}

function fillFilter(id, items, label) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="all">All ${label}</option>` + items
    .map((item) => `<option value="${safe(item.id)}">${safe(item.name)}</option>`)
    .join("");
}

function currentExplorePlaces() {
  const query = document.getElementById("explore-search").value.trim().toLowerCase();
  const maximum = document.getElementById("explore-price").value;
  const typeId = document.getElementById("explore-type").value;
  const policyId = document.getElementById("explore-policy").value;
  const amenityId = document.getElementById("explore-amenity").value;
  return explorePlaces.filter((place) => {
    const searchText = `${place.title || ""} ${place.description || ""} ${exploreLocation(place)}`
      .toLowerCase();
    return (!query || searchText.includes(query))
      && (maximum === "all" || Number(place.price) <= Number(maximum))
      && (typeId === "all" || place.place_type_id === typeId)
      && (policyId === "all" || place.cancellation_policy_id === policyId)
      && (amenityId === "all" || (place.amenities || [])
        .some((amenity) => amenity.id === amenityId));
  });
}

function renderExploreMap(places) {
  if (!window.L) {
    document.getElementById("explore-map").innerHTML =
      '<div class="empty-state">Map could not be loaded.</div>';
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
  exploreMarkers = places.filter((place) => (
    Number.isFinite(Number(place.latitude))
    && Number.isFinite(Number(place.longitude))
  )).map((place) => L.marker([place.latitude, place.longitude])
    .addTo(exploreMap)
    .bindPopup(`<strong>${safe(place.title)}</strong><br>${money(place.price)} / night<br><a href="place.html?id=${encodeURIComponent(place.id)}">View details</a>`));
  if (exploreMarkers.length) {
    exploreMap.fitBounds(L.featureGroup(exploreMarkers).getBounds().pad(0.18), {
      maxZoom: 11
    });
  }
}

function renderExplorePlaces() {
  const filtered = currentExplorePlaces();
  document.getElementById("explore-count").textContent = `${filtered.length} stays`;
  document.getElementById("explore-grid").innerHTML = filtered
    .map((place, index) => `
      <article class="place-card">
        <div class="cover"><img src="${safe(imageFor(place, index))}" alt="${safe(place.title || "Stay")}"></div>
        <div class="place-body">
          <div class="place-meta"><span>${safe(exploreLocation(place))}</span><span>${money(place.price)} / night</span></div>
          <h3 class="place-title">${safe(place.title || "Stay")}</h3>
          <p class="muted small">${safe((place.description || "").slice(0, 110))}</p>
          <div class="glass-row"><span class="badge">${safe(exploreTypes.get(place.place_type_id) || "Property")}</span><span class="badge green">${safe(explorePolicies.get(place.cancellation_policy_id) || "Standard")}</span></div>
          <a class="details-button" href="place.html?id=${encodeURIComponent(place.id)}">View Details</a>
        </div>
      </article>
    `).join("") || '<div class="empty full-grid">No stays match your filters.</div>';
  renderExploreMap(filtered);
}

async function loadExplorePage() {
  try {
    const [places, cities, types, policies, amenities] = await Promise.all([
      fetchPlaces(),
      fetchAll("/cities/").catch(() => []),
      fetchAll("/place-types/").catch(() => []),
      fetchAll("/cancellation-policies/").catch(() => []),
      fetchAll("/amenities/").catch(() => [])
    ]);
    explorePlaces = places;
    exploreCities = new Map(cities.map((city) => [city.id, city.name]));
    exploreTypes = new Map(types.map((item) => [item.id, item.name]));
    explorePolicies = new Map(policies.map((item) => [item.id, item.name]));
    fillFilter("explore-type", types, "types");
    fillFilter("explore-policy", policies, "policies");
    fillFilter("explore-amenity", amenities, "amenities");
    renderExplorePlaces();
  } catch (error) {
    document.getElementById("explore-grid").innerHTML =
      `<div class="empty full-grid">${safe(error.message)}</div>`;
  }

  ["explore-search", "explore-price", "explore-type", "explore-policy", "explore-amenity"]
    .forEach((id) => {
      document.getElementById(id)?.addEventListener(
        id === "explore-search" ? "input" : "change",
        renderExplorePlaces
      );
    });
}

document.addEventListener("DOMContentLoaded", loadExplorePage);
