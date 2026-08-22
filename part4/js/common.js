const API_BASE = localStorage.getItem("HBnB_API_BASE")
  || "http://127.0.0.1:5001/api/v1";

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=84",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=84"
];

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function setCookie(name, value, maxAge = 604800) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function removeCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function isAuthenticated() {
  return Boolean(getCookie("token"));
}

function tokenPayload() {
  const token = getCookie("token");
  if (!token) {
    return null;
  }

  try {
    const value = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

function sessionRole() {
  return tokenPayload()?.role || "guest";
}

function isOwnerAccount() {
  return sessionRole() === "owner";
}

function isAdminAccount() {
  return sessionRole() === "admin";
}

function isManagementAccount() {
  return isOwnerAccount() || isAdminAccount();
}

function accountLabel() {
  if (isAdminAccount()) {
    return "Administrator";
  }
  return isOwnerAccount() ? "Owner" : "Guest";
}

function authHeaders() {
  const token = getCookie("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
  const headers = {
    ...authHeaders(),
    ...(options.headers || {})
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    data = responseText;
  }

  if (!response.ok) {
    let message = data?.error || data?.message || data?.msg;
    if (response.status === 401) {
      message = path === "/auth/login"
        ? "The email or password is incorrect."
        : "Please sign in again to continue.";
      if (path !== "/auth/login") {
        removeCookie("token");
      }
    } else if (response.status === 403) {
      message = "You do not have permission to complete this action.";
    } else if (response.status === 404) {
      message = "We could not find what you were looking for.";
    } else if (response.status >= 500) {
      message = "Something went wrong on our side. Please try again shortly.";
    }
    message ||= "We could not complete your request. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function friendlyError(error, fallback = "We could not load this page.") {
  if (!navigator.onLine || error instanceof TypeError) {
    return "Check your internet connection, then try again.";
  }
  return error?.message || fallback;
}

function safe(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function lineIcon(name, className = "") {
  const paths = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>',
    compass: '<circle cx="12" cy="12" r="9"></circle><path d="m16 8-2.2 5.8L8 16l2.2-5.8L16 8Z"></path>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z"></path>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"></path>',
    suitcase: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"></path>'
  };
  return `<svg class="line-icon ${safe(className)}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.compass}</svg>`;
}

function emptyState({
  icon = "compass",
  title,
  text,
  actionHref = "",
  actionLabel = ""
}) {
  const action = actionHref && actionLabel
    ? `<a class="btn primary" href="${safe(actionHref)}">${safe(actionLabel)}</a>`
    : "";
  return `
    <div class="empty-state-card">
      <span class="empty-state-icon">${lineIcon(icon)}</span>
      <h3>${safe(title)}</h3>
      <p>${safe(text)}</p>
      ${action}
    </div>
  `;
}

const WISHLIST_KEY = "hbnb_wishlist";

function wishlistIds() {
  try {
    const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch (error) {
    return [];
  }
}

function isWishlisted(placeId) {
  return wishlistIds().includes(String(placeId));
}

function toggleWishlist(placeId) {
  const id = String(placeId);
  const ids = new Set(wishlistIds());
  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  localStorage.setItem(WISHLIST_KEY, JSON.stringify([...ids]));
  return ids.has(id);
}

function ratingFor(placeId, reviews = []) {
  const values = reviews
    .filter((review) => String(review.place_id) === String(placeId))
    .map((review) => Number(review.rating))
    .filter(Number.isFinite);
  if (!values.length) {
    return { value: null, label: "New" };
  }
  const value = values.reduce((sum, rating) => sum + rating, 0) / values.length;
  return { value, label: value.toFixed(1) };
}

function placeLink(placeId, params = {}) {
  const query = new URLSearchParams({ id: placeId });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, value);
    }
  });
  return `place.html?${query}`;
}

function activatePlaceCards(container, rerender) {
  if (!container) {
    return;
  }
  container.querySelectorAll("[data-place-href]").forEach((card) => {
    const open = () => {
      location.href = card.dataset.placeHref;
    };
    card.addEventListener("click", (event) => {
      if (!event.target.closest("button, a")) {
        open();
      }
    });
    card.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ")
          && !event.target.closest("button, a")) {
        event.preventDefault();
        open();
      }
    });
  });
  container.querySelectorAll("[data-wishlist]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const saved = toggleWishlist(button.dataset.wishlist);
      button.classList.toggle("saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", saved ? "Remove from wishlist" : "Save to wishlist");
      button.title = saved ? "Remove from wishlist" : "Save to wishlist";
      toast(saved ? "Saved to your wishlist." : "Removed from your wishlist.");
      if (typeof rerender === "function") {
        rerender();
      }
    });
  });
}

function qs(key) {
  return new URLSearchParams(location.search).get(key);
}

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "SAR -";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  }).format(amount);
}

function dateFmt(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function dateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function imageFor(object = {}, index = 0) {
  return object.image_url
    || object.image
    || object.cover_image
    || IMAGE_POOL[index % IMAGE_POOL.length];
}

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)
      || image.classList.contains("logo")
      || image.dataset.fallbackApplied) {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = IMAGE_POOL[0];
}, true);

function toast(message) {
  const element = document.getElementById("toast");
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => element.classList.remove("show"), 3600);
}

function logout() {
  removeCookie("token");
  location.href = "index.html";
}

function authOrLogin(next) {
  if (isAuthenticated()) {
    return true;
  }
  const target = encodeURIComponent(next || location.href);
  location.href = `login.html?next=${target}`;
  return false;
}

let notificationTimer = null;
let previousUnreadCount = null;

function notificationSymbol(type = "") {
  if (type.includes("booking") || type.includes("trip")) {
    return "B";
  }
  if (type.includes("review")) {
    return "R";
  }
  return "N";
}

function renderNotificationPreview(items) {
  const list = document.getElementById("notification-preview-list");
  if (!list) {
    return;
  }

  const sorted = [...items].sort((left, right) => (
    new Date(right.created_at) - new Date(left.created_at)
  ));
  list.innerHTML = sorted.length
    ? sorted.slice(0, 20).map((item) => `
      <button class="notification-preview-item ${item.is_seen ? "" : "unread"}"
        type="button" data-notification-id="${safe(item.id)}">
        <span class="notification-preview-symbol" aria-hidden="true">
          ${notificationSymbol(item.notification_type)}
        </span>
        <span>
          <strong>${safe(item.notification_type.replaceAll("_", " "))}</strong>
          <small>${safe(item.content)}</small>
        </span>
      </button>
    `).join("")
    : `<div class="notification-preview-empty">
        ${lineIcon("calendar")}
        <strong>You are all caught up</strong>
        <span>New booking and review updates will appear here.</span>
      </div>`;

  list.querySelectorAll("[data-notification-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(
          `/notifications/${encodeURIComponent(button.dataset.notificationId)}/read`,
          { method: "PUT" }
        );
        await refreshNotificationCenter(true);
      } catch (error) {
        toast(friendlyError(error, "We could not update this notification."));
      }
    });
  });
}

async function refreshNotificationCenter(initial = false) {
  const badge = document.getElementById("notification-badge");
  if (!badge || !isAuthenticated()) {
    return;
  }

  try {
    const items = await fetchAll("/notifications/");
    const unread = items.filter((item) => !item.is_seen);
    badge.textContent = unread.length > 9 ? "9+" : String(unread.length);
    badge.classList.toggle("hidden", unread.length === 0);
    renderNotificationPreview(items);

    if (
      !initial
      && previousUnreadCount !== null
      && unread.length > previousUnreadCount
    ) {
      toast(unread[0]?.content || "You have a new notification.");
    }
    previousUnreadCount = unread.length;
  } catch (error) {
    if (error.status === 401) {
      clearInterval(notificationTimer);
    }
  }
}

function initNotificationCenter() {
  if (!isAuthenticated()) {
    return;
  }

  const navActions = document.querySelector(".nav-actions");
  if (!navActions || document.getElementById("notification-center")) {
    return;
  }

  const center = document.createElement("div");
  center.id = "notification-center";
  center.className = "notification-center";
  center.innerHTML = `
    <button id="notification-bell" class="notification-bell" type="button"
      aria-label="Notifications" aria-expanded="false">
      <svg class="notification-bell-icon" aria-hidden="true"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.27 21a2 2 0 0 0 3.46 0"></path>
        <path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"></path>
      </svg>
      <span id="notification-badge" class="notification-badge hidden">0</span>
    </button>
    <section id="notification-popover" class="notification-popover hidden"
      aria-label="Recent notifications">
      <div class="notification-popover-head">
        <strong>Notifications</strong>
        <span>Your latest updates</span>
      </div>
      <div id="notification-preview-list"></div>
    </section>
  `;
  navActions.insertBefore(center, document.getElementById("nav-profile"));

  const bell = document.getElementById("notification-bell");
  const popover = document.getElementById("notification-popover");
  bell.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = popover.classList.contains("hidden");
    popover.classList.toggle("hidden", !opening);
    bell.setAttribute("aria-expanded", String(opening));
    if (opening) {
      refreshNotificationCenter(true);
    }
  });
  popover.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => {
    popover.classList.add("hidden");
    bell.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      popover.classList.add("hidden");
      bell.setAttribute("aria-expanded", "false");
    }
  });

  refreshNotificationCenter(true);
  notificationTimer = setInterval(refreshNotificationCenter, 8000);
  window.addEventListener("focus", () => refreshNotificationCenter(true));
  window.addEventListener("pagehide", () => clearInterval(notificationTimer));
}

function initNav() {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  const loginLink = document.getElementById("login-link");
  const profileLink = document.getElementById("nav-profile");
  const role = sessionRole();
  const navLinks = document.querySelector(".nav-links");

  document.querySelectorAll('[data-nav="notifications.html"]')
    .forEach((link) => link.remove());

  if (navLinks && isAuthenticated()) {
    const links = role === "owner" || role === "admin"
      ? [
        ["owner_home.html", role === "admin" ? "Admin home" : "Owner home"],
        ["manage_places.html", "Properties"],
        ["owner_bookings.html", "Reservations"]
      ]
      : [
        ["user_home.html", "My home"],
        ["explore.html", "Explore"],
        ["bookings.html", "Bookings"]
      ];
    navLinks.innerHTML = links.map(([href, label]) => `
      <a class="nav-link" data-nav="${href}" href="${href}">${label}</a>
    `).join("");
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === currentPage);
  });

  if (loginLink) {
    loginLink.style.display = isAuthenticated() ? "none" : "inline-flex";
  }
  if (profileLink) {
    profileLink.style.display = isAuthenticated() ? "inline-flex" : "none";
    profileLink.href = "profile.html";
    profileLink.textContent = "Profile";
  }

  document.getElementById("logout-btn")?.addEventListener("click", logout);
  initNotificationCenter();
}

async function fetchPlaces() {
  const data = await api("/places/");
  return Array.isArray(data) ? data : (data?.items || data?.places || []);
}

async function fetchPlace(id) {
  return api(`/places/${encodeURIComponent(id)}`);
}

async function fetchUser(id) {
  return api(`/users/${encodeURIComponent(id)}`);
}

async function fetchAll(path) {
  const data = await api(path);
  return Array.isArray(data) ? data : (data?.items || data?.data || []);
}

async function fetchReviewsWithDetails() {
  const reviews = await fetchAll("/reviews/");
  if (reviews.every((review) => review.place_id && review.rating)) {
    return reviews;
  }
  return (await Promise.all(reviews.map((review) => (
    api(`/reviews/${encodeURIComponent(review.id)}`).catch(() => null)
  )))).filter(Boolean);
}

document.addEventListener("DOMContentLoaded", initNav);
