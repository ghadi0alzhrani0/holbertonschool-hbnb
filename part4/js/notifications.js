function notificationTitle(type = "notification") {
  return type.replaceAll("_", " ");
}

async function loadNotifications() {
  if (!authOrLogin()) {
    return;
  }

  const list = document.getElementById("notification-list");
  try {
    const items = await fetchAll("/notifications/");
    items.sort((left, right) => (
      new Date(right.created_at) - new Date(left.created_at)
    ));
    document.getElementById("notification-count").textContent = items.length;
    list.innerHTML = items.map((item) => `
      <article class="notification ${item.is_seen ? "" : "unread"}">
        <div class="nicon">${notificationSymbol(item.notification_type)}</div>
        <div>
          <strong>${safe(notificationTitle(item.notification_type))}</strong>
          <div class="muted notification-copy">${safe(item.content)}</div>
          <div class="muted small notification-date">
            ${dateFmt(item.created_at)}
          </div>
        </div>
        <div class="n-actions">
          ${item.is_seen
            ? '<span class="badge green">Read</span>'
            : `<button class="read-btn" type="button"
                data-read="${safe(item.id)}">Mark as read</button>`}
        </div>
      </article>
    `).join("") || emptyState({
      icon: "calendar",
      title: "You are all caught up",
      text: "New booking and review updates will appear here."
    });

    list.querySelectorAll("[data-read]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(
            `/notifications/${encodeURIComponent(button.dataset.read)}/read`,
            { method: "PUT" }
          );
          toast("Marked as read.");
          loadNotifications();
        } catch (error) {
          toast(friendlyError(error, "We could not update this notification."));
        }
      });
    });
  } catch (error) {
    list.innerHTML = emptyState({
      icon: "calendar",
      title: "We could not load notifications",
      text: friendlyError(error)
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  const timer = setInterval(loadNotifications, 8000);
  window.addEventListener("pagehide", () => clearInterval(timer));
});
