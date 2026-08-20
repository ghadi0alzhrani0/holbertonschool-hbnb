function showProfileAccount(account) {
  const owner = isOwnerAccount();
  const first = owner ? account.business_name : account.first_name;
  const last = owner ? account.contact_person : account.last_name;
  document.getElementById("profile-name").textContent = owner
    ? account.business_name : `${account.first_name} ${account.last_name}`;
  document.getElementById("profile-email").textContent = account.email;
  document.getElementById("profile-avatar").textContent =
    `${first?.[0] || "H"}${last?.[0] || ""}`.toUpperCase();
  document.getElementById("profile-first").value = first;
  document.getElementById("profile-last").value = last;
  document.getElementById("profile-role").textContent = sessionRole();
  if (owner) {
    document.getElementById("profile-first-label").textContent = "Business name";
    document.getElementById("profile-last-label").textContent = "Contact person";
    document.getElementById("profile-phone-field").classList.remove("hidden");
    document.getElementById("profile-phone").value = account.phone_number;
  }
}

function renderProfileActivity(bookings) {
  document.getElementById("profile-bookings").innerHTML = bookings.slice(0, 5)
    .map((booking, index) => `
      <div class="booking-row">
        <img src="${safe(imageFor({}, index))}" alt="${safe(booking.place_title || "Booked stay")}">
        <div><strong>${safe(booking.place_title || "HBnB stay")}</strong><div class="muted small">${dateFmt(booking.start_date)} to ${dateFmt(booking.end_date)}</div></div>
        <span class="badge green">${safe(booking.status)}</span>
      </div>
    `).join("") || '<div class="empty">No booking activity yet.</div>';
}

async function loadProfile() {
  if (!authOrLogin()) {
    return;
  }
  const userId = tokenPayload()?.sub;
  try {
    const account = isOwnerAccount() ? await api("/owners/me") : await fetchUser(userId);
    showProfileAccount(account);
  } catch (error) {
    toast(error.message);
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
  }

  try {
    const notifications = await fetchAll("/notifications/");
    document.getElementById("stat-notifications").textContent = notifications.length;
  } catch (error) {
    document.getElementById("stat-notifications").textContent = "-";
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
      toast("Profile updated.");
    } catch (error) {
      toast(error.message);
    }
  });

  document.getElementById("password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: document.getElementById("current-password").value,
          new_password: document.getElementById("new-password").value
        })
      });
      event.currentTarget.reset();
      toast("Password updated.");
    } catch (error) {
      toast(error.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadProfile);
