let places = [];
let cities = new Map();
let spotlightIndex = 0;

async function loadIndex() {
  const searchForm = document.getElementById("home-search");
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const destination = document.getElementById("home-city").value.trim();
    document.getElementById("where-value").textContent = destination || "Anywhere";
    document.getElementById("stays").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("price-filter")?.addEventListener("change", displayPlaces);
  document.getElementById("home-city")?.addEventListener("input", displayPlaces);
  document.getElementById("spot-prev")?.addEventListener("click", () => moveSpotlight(-1));
  document.getElementById("spot-next")?.addEventListener("click", () => moveSpotlight(1));

  try {
    const [placeList, cityList] = await Promise.all([
      fetchPlaces(),
      fetchAll("/cities/").catch(() => [])
    ]);
    places = placeList;
    cities = new Map(cityList.map((city) => [city.id, city.name]));
  } catch (error) {
    places = [];
    toast(error.message);
  }

  displayPlaces();
  displaySpotlight();
}

function placeLocation(place) {
  return cities.get(place.city_id) || "HBnB destination";
}

function displayPlaces() {
  const listElement = document.getElementById("places-list");
  const priceFilter = document.getElementById("price-filter").value;
  const destination = document.getElementById("home-city").value
    .trim()
    .toLowerCase();

  const filteredPlaces = places.filter((place) => {
    const priceMatches = priceFilter === "all"
      || Number(place.price) <= Number(priceFilter);
    const searchText = `${place.title || ""} ${placeLocation(place)}`.toLowerCase();
    return priceMatches && (!destination || searchText.includes(destination));
  });

  listElement.innerHTML = filteredPlaces.length
    ? filteredPlaces.map((place, index) => `
      <article class="place-card" data-price="${safe(place.price)}">
        <div class="cover">
          <img src="${safe(imageFor(place, index))}" alt="${safe(place.title || "Place")}">
        </div>
        <div class="place-body">
          <div class="place-meta">
            <span>${safe(placeLocation(place))}</span>
            <span>Per night</span>
          </div>
          <h3 class="place-title">${safe(place.title || "Stay")}</h3>
          <div class="glass-row place-card-actions">
            <span class="place-price">${money(place.price)}</span>
            <a class="details-button" href="place.html?id=${encodeURIComponent(place.id)}">
              View Details
            </a>
          </div>
        </div>
      </article>
    `).join("")
    : '<div class="empty places-empty">No stays match these filters.</div>';
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
  const items = places.length ? places.slice(0, 7) : [];

  if (!items.length) {
    stage.innerHTML = '<div class="empty">Places will appear here when the API has data.</div>';
    document.getElementById("spot-count").textContent = "00 / 00";
    return;
  }

  if (spotlightIndex >= items.length) {
    spotlightIndex = 0;
  }

  stage.innerHTML = items.map((place, index) => {
    const position = (index - spotlightIndex + items.length) % items.length;
    const className = position === 0
      ? "is-center"
      : position === 1
        ? "is-right"
        : position === items.length - 1
          ? "is-left"
          : "is-far";

    return `
      <article class="spotlight-card ${className}">
        <img src="${safe(imageFor(place, index))}" alt="${safe(place.title)}">
        <div class="spot-info">
          <div class="eyebrow spotlight-label">Featured stay</div>
          <h3>${safe(place.title)}</h3>
          <p>${safe(placeLocation(place))}</p>
          <div class="glass-row spotlight-actions">
            <span class="badge">${money(place.price)} / night</span>
            <a class="btn sun" href="place.html?id=${encodeURIComponent(place.id)}">
              View Details
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.getElementById("spot-count").textContent =
    `${String(spotlightIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
}

document.addEventListener("DOMContentLoaded", loadIndex);
