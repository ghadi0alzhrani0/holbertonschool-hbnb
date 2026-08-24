let adminAccounts = [];

function renderAdminAccounts() {
  const query = document.getElementById("admin-user-search").value
    .trim().toLowerCase();
  const accounts = adminAccounts.filter((account) => (
    `${account.name} ${account.email} ${account.type}`.toLowerCase().includes(query)
  ));
  const body = document.getElementById("admin-user-list");

  if (!accounts.length) {
    body.innerHTML = '<tr><td colspan="3">No matching accounts.</td></tr>';
    return;
  }

  body.innerHTML = accounts.map((account) => `
    <tr>
      <td><strong>${safe(account.name)}</strong></td>
      <td>${safe(account.email)}</td>
      <td><span class="badge admin-account-type">${safe(account.type)}</span></td>
    </tr>
  `).join("");
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
      fetchAll("/reviews/")
    ]);

    const guestUsers = users.filter((user) => !user.is_admin);
    document.getElementById("admin-user-count").textContent = guestUsers.length;
    document.getElementById("admin-owner-count").textContent = owners.length;
    document.getElementById("admin-place-count").textContent = places.length;
    document.getElementById("admin-booking-count").textContent = bookings.length;
    document.getElementById("admin-review-count").textContent = reviews.length;

    adminAccounts = [
      ...users.map((user) => ({
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || "User",
        email: user.email,
        type: user.is_admin ? "Administrator" : "Guest"
      })),
      ...owners.map((owner) => ({
        name: owner.business_name || owner.contact_person || "Owner",
        email: owner.email,
        type: "Owner"
      }))
    ];
    renderAdminAccounts();
  } catch (error) {
    document.getElementById("admin-user-list").innerHTML = `
      <tr><td colspan="3">${safe(friendlyError(error, "We could not load the dashboard."))}</td></tr>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("admin-user-search")
    ?.addEventListener("input", renderAdminAccounts);
  loadAdminDashboard();
});
