function showProfileAccount(account) {
  const owner = isOwnerAccount();
  const first = owner ? account.business_name : account.first_name;
  const last = owner ? account.contact_person : account.last_name;
  document.getElementById("profile-name").textContent = owner
    ? account.business_name : `${account.first_name} ${account.last_name}`;
  document.getElementById("profile-email").textContent = account.email;
  document.getElementById("profile-avatar").textContent =
    `${first?.[0] || "H"}${last?.[0] || ""}`.toUpperCase();
  document.getElementById("profile-first").value = first || "";
  document.getElementById("profile-last").value = last || "";
  document.getElementById("profile-role").textContent = accountLabel();
  if (owner) {
    document.getElementById("profile-first-label").textContent = "Business name";
    document.getElementById("profile-last-label").textContent = "Contact person";
    document.getElementById("profile-phone-field").classList.remove("hidden");
    document.getElementById("profile-phone").value = account.phone_number || "";
  }
}

function profileStatusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "In progress",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  return labels[status] || "Updated";
}

function renderProfileActivity(bookings) {
  const container = document.getElementById("profile-bookings");
  if (!bookings.length) {
    container.innerHTML = emptyState({
      icon: "suitcase",
      title: isManagementAccount() ? "No reservations yet" : "Plan your first stay",
      text: isManagementAccount()
        ? "New guest reservations will appear here."
        : "Explore the collection and save a stay for your next trip.",
      actionHref: isManagementAccount() ? "manage_places.html" : "explore.html",
      actionLabel: isManagementAccount() ? "Manage properties" : "Explore stays"
    });
    return;
  }

  container.innerHTML = bookings.slice(0, 5).map((booking, index) => `
    <a class="booking-row" href="${isManagementAccount()
      ? "owner_bookings.html" : "bookings.html"}">
      <img src="${safe(imageFor({}, index))}" alt="${safe(booking.place_title || "Booked stay")}">
      <span>
        <strong>${safe(booking.place_title || "HBnB stay")}</strong>
        <span class="muted small booking-dates">
          ${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}
        </span>
      </span>
      <span class="badge green">${safe(profileStatusLabel(booking.status))}</span>
    </a>
  `).join("");
}

function renderProfileReviews(reviews, places) {
  const container = document.getElementById("profile-reviews");
  const placeMap = new Map(places.map((place) => [place.id, place]));
  if (!reviews.length) {
    container.innerHTML = emptyState({
      icon: "heart",
      title: isManagementAccount() ? "No guest reviews yet" : "No reviews yet",
      text: isManagementAccount()
        ? "Guest feedback for your properties will appear here."
        : "After a completed stay, you can share your experience here."
    });
    return;
  }

  container.innerHTML = reviews.slice(0, 5).map((review) => {
    const place = placeMap.get(review.place_id);
    return `
      <article class="profile-review">
        <div class="profile-review-head">
          <a href="place.html?id=${encodeURIComponent(review.place_id)}">
            ${safe(place?.title || "HBnB stay")}
          </a>
          <span class="profile-review-rating" aria-label="${safe(review.rating)} out of 5">
            ${lineIcon("heart")} ${safe(review.rating)} / 5
          </span>
        </div>
        <p>${safe(review.text)}</p>
        <span class="muted small">${dateFmt(review.created_at)}</span>
      </article>
    `;
  }).join("");
}

function setAccountView(view) {
  ["activity", "profile"].forEach((name) => {
    const panel = document.getElementById(`${name}-panel`);
    const active = name === view;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  document.querySelectorAll("[data-account-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.accountView === view);
  });
}

function initAccountViews() {
  document.querySelectorAll("[data-account-view]").forEach((item) => {
    item.addEventListener("click", () => {
      setAccountView(item.dataset.accountView);
    });
  });
  setAccountView("activity");
}

function initPasswordVisibility() {
  document.getElementById("show-passwords")?.addEventListener("change", (event) => {
    const type = event.currentTarget.checked ? "text" : "password";
    ["current-password", "new-password", "confirm-password"].forEach((id) => {
      document.getElementById(id).type = type;
    });
  });
}

async function loadProfile() {
  if (!authOrLogin()) {
    return;
  }

  initAccountViews();
  initPasswordVisibility();
  document.getElementById("stat-wishlist").textContent = wishlistIds().length;
  const userId = tokenPayload()?.sub;

  try {
    const account = isOwnerAccount() ? await api("/owners/me") : await fetchUser(userId);
    showProfileAccount(account);
  } catch (error) {
    toast(friendlyError(error, "We could not load your account details."));
  }

  try {
    const bookings = isOwnerAccount()
      ? await fetchAll("/owners/me/bookings") : await fetchAll("/bookings/");
    document.getElementById("stat-bookings").textContent = bookings.length;
    if (isManagementAccount()) {
      document.getElementById("profile-activity-label").textContent = "Reservations";
      document.getElementById("profile-activity-title").textContent = "Recent reservations";
      document.getElementById("profile-activity-link").href = "owner_bookings.html";
    }
    renderProfileActivity(bookings);
  } catch (error) {
    document.getElementById("stat-bookings").textContent = "0";
    renderProfileActivity([]);
  }

  try {
    const [reviews, places] = await Promise.all([
      fetchReviewsWithDetails(),
      fetchPlaces()
    ]);
    let visibleReviews;
    if (isOwnerAccount()) {
      const ownerPlaces = await fetchAll("/owners/me/places");
      const ownerPlaceIds = new Set(ownerPlaces.map((place) => place.id));
      visibleReviews = reviews.filter((review) => ownerPlaceIds.has(review.place_id));
      document.getElementById("profile-reviews-label").textContent = "Guest feedback";
      document.getElementById("profile-reviews-title").textContent = "Property reviews";
    } else if (isAdminAccount()) {
      visibleReviews = reviews;
      document.getElementById("profile-reviews-label").textContent = "Platform activity";
      document.getElementById("profile-reviews-title").textContent = "Recent reviews";
    } else {
      visibleReviews = reviews.filter((review) => review.user_id === userId);
    }
    document.getElementById("stat-reviews").textContent = visibleReviews.length;
    renderProfileReviews(visibleReviews, places);
  } catch (error) {
    document.getElementById("stat-reviews").textContent = "0";
    renderProfileReviews([], []);
  }

  document.getElementById("profile-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = isOwnerAccount() ? {
      business_name: document.getElementById("profile-first").value.trim(),
      contact_person: document.getElementById("profile-last").value.trim(),
      phone_number: document.getElementById("profile-phone").value.trim()
    } : {
      first_name: document.getElementById("profile-first").value.trim(),
      last_name: document.getElementById("profile-last").value.trim()
    };
    try {
      await api(isOwnerAccount() ? "/owners/me" : `/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      toast("Your profile has been updated.");
    } catch (error) {
      toast(friendlyError(error, "We could not update your profile."));
    }
  });

  document.getElementById("password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmation = document.getElementById("confirm-password").value;
    const message = document.getElementById("password-message");
    message.className = "form-message";

    if (newPassword !== confirmation) {
      message.textContent = "The new passwords do not match.";
      message.classList.add("error");
      return;
    }
    if (currentPassword === newPassword) {
      message.textContent = "Choose a password that is different from your current one.";
      message.classList.add("error");
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Updating...";
    try {
      await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      form.reset();
      message.textContent = "Your password has been updated.";
      message.classList.add("success");
    } catch (error) {
      message.textContent = friendlyError(error, "We could not update your password.");
      message.classList.add("error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Update password";
    }
  });
}

document.addEventListener("DOMContentLoaded", loadProfile);
