let adminAccounts = [];
let adminReviews = [];
let adminUsersById = new Map();
let adminPlacesById = new Map();

function renderAdminAccounts() {
  const query = document.getElementById("admin-user-search").value
    .trim().toLowerCase();
  const accounts = adminAccounts.filter((account) => (
    `${account.name} ${account.email} ${account.type}`.toLowerCase().includes(query)
  ));
  const body = document.getElementById("admin-user-list");

  if (!accounts.length) {
    body.innerHTML = '<tr><td colspan="4">No matching accounts.</td></tr>';
    return;
  }

  body.innerHTML = accounts.map((account) => `
    <tr>
      <td><strong>${safe(account.name)}</strong></td>
      <td>${safe(account.email)}</td>
      <td><span class="badge admin-account-type">${safe(account.type)}</span></td>
      <td class="admin-account-actions">
        ${account.canDelete ? `
          <button class="btn danger" type="button"
            data-admin-delete-account="${safe(account.id)}"
            data-admin-account-kind="${safe(account.kind)}">
            Delete
          </button>
        ` : '<span class="admin-account-protected">Protected</span>'}
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-admin-delete-account]").forEach((button) => {
    button.addEventListener("click", async () => {
      const account = adminAccounts.find((item) => (
        item.id === button.dataset.adminDeleteAccount
        && item.kind === button.dataset.adminAccountKind
      ));
      if (!account) {
        return;
      }
      const warning = account.kind === "owner"
        ? `Delete ${account.name} and all properties managed by this owner?`
        : `Delete the guest account for ${account.name}?`;
      if (!window.confirm(warning)) {
        return;
      }
      button.disabled = true;
      button.textContent = "Deleting...";
      try {
        const resource = account.kind === "owner" ? "owners" : "users";
        await api(`/${resource}/${encodeURIComponent(account.id)}`, {
          method: "DELETE"
        });
        toast(`${account.name} was deleted.`);
        await loadAdminDashboard();
      } catch (error) {
        button.disabled = false;
        button.textContent = "Delete";
        toast(friendlyError(error, "We could not delete this account."));
      }
    });
  });
}

function renderAdminReviews() {
  const container = document.getElementById("admin-review-list");
  if (!adminReviews.length) {
    container.innerHTML = emptyState({
      icon: "heart",
      title: "No reviews to moderate",
      text: "New guest reviews will appear here for the administration team."
    });
    return;
  }

  container.innerHTML = adminReviews.map((review) => {
    const user = adminUsersById.get(review.user_id);
    const place = adminPlacesById.get(review.place_id);
    const userName = user
      ? `${user.first_name} ${user.last_name}`
      : "HBnB guest";
    return `
      <article class="card admin-review-card">
        <div class="admin-review-head">
          <div>
            <strong>${safe(userName)}</strong>
            <a href="place.html?id=${encodeURIComponent(review.place_id)}">
              ${safe(place?.title || "HBnB stay")}
            </a>
          </div>
          <span class="admin-review-rating">
            ${lineIcon("heart")} ${safe(review.rating)} / 5
          </span>
        </div>
        <p>${safe(review.text)}</p>
        <div class="admin-review-actions">
          <span class="muted small">${dateFmt(review.created_at)}</span>
          <button class="btn primary" type="button"
            data-admin-delete-review="${safe(review.id)}">
            Delete review
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-admin-delete-review]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const reviewId = button.dataset.adminDeleteReview;
        const review = adminReviews.find((item) => item.id === reviewId);
        if (!window.confirm("Delete this review from HBnB?")) {
          return;
        }
        button.disabled = true;
        button.textContent = "Deleting...";
        try {
          await api(`/reviews/${encodeURIComponent(reviewId)}`, {
            method: "DELETE"
          });
          adminReviews = adminReviews.filter((item) => item.id !== reviewId);
          document.getElementById("admin-review-count").textContent =
            adminReviews.length;
          renderAdminReviews();
          toast(`Review by ${adminUsersById.get(review?.user_id)?.first_name || "guest"} was deleted.`);
        } catch (error) {
          button.disabled = false;
          button.textContent = "Delete review";
          toast(friendlyError(error, "We could not delete this review."));
        }
      });
    });
}

async function loadAdminDashboard() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (!isAdminAccount()) {
    location.href = isOwnerAccount() ? "owner_home.html" : "user_home.html";
    return;
  }

  try {
    const [users, owners, places, bookings, reviews] = await Promise.all([
      fetchAll("/users/"),
      fetchAll("/owners/"),
      fetchAll("/places/"),
      fetchAll("/bookings/"),
      fetchReviewsWithDetails()
    ]);

    const guestUsers = users.filter((user) => !user.is_admin && !user.place_count);
    document.getElementById("admin-user-count").textContent = guestUsers.length;
    document.getElementById("admin-owner-count").textContent = owners.length;
    document.getElementById("admin-place-count").textContent = places.length;
    document.getElementById("admin-booking-count").textContent = bookings.length;
    document.getElementById("admin-review-count").textContent = reviews.length;

    adminAccounts = [
      ...users.map((user) => ({
        id: user.id,
        kind: "user",
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || "User",
        email: user.email,
        type: user.is_admin
          ? "Administrator"
          : user.place_count ? "Host record" : "Guest",
        canDelete: !user.is_admin && !user.place_count
      })),
      ...owners.map((owner) => ({
        id: owner.id,
        kind: "owner",
        name: owner.business_name || owner.contact_person || "Owner",
        email: owner.email,
        type: "Owner",
        canDelete: true
      }))
    ];
    adminUsersById = new Map(users.map((user) => [user.id, user]));
    adminPlacesById = new Map(places.map((place) => [place.id, place]));
    adminReviews = reviews;
    renderAdminAccounts();
    renderAdminReviews();
  } catch (error) {
    document.getElementById("admin-user-list").innerHTML = `
      <tr><td colspan="4">${safe(friendlyError(error, "We could not load the dashboard."))}</td></tr>
    `;
    document.getElementById("admin-review-list").innerHTML = emptyState({
      icon: "heart",
      title: "Reviews are unavailable",
      text: friendlyError(error, "We could not load the reviews.")
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-user-search")
    ?.addEventListener("input", renderAdminAccounts);
  loadAdminDashboard();
});
