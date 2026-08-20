let checkoutPlace = null;
let checkoutPricing = [];

function checkoutNights(start, end) {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
}

function checkoutEstimate(start, end) {
  let total = 0;
  const cursor = new Date(`${start}T12:00:00`);
  const finalDate = new Date(`${end}T12:00:00`);
  while (cursor < finalDate) {
    const day = dateInputValue(cursor);
    const special = checkoutPricing.find((item) => (
      day >= item.start_date.slice(0, 10)
      && day <= item.end_date.slice(0, 10)
    ));
    total += Number(special?.special_price ?? checkoutPlace.price);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function updateCheckoutSummary() {
  if (!checkoutPlace) {
    return;
  }
  const start = document.getElementById("checkout-start").value;
  const end = document.getElementById("checkout-end").value;
  const adults = Number(document.getElementById("checkout-adults").value || 0);
  const children = Number(document.getElementById("checkout-children").value || 0);
  const infants = Number(document.getElementById("checkout-infants").value || 0);
  const nights = start && end && end > start ? checkoutNights(start, end) : 0;
  document.getElementById("checkout-rate").textContent = money(checkoutPlace.price);
  document.getElementById("checkout-nights").textContent = nights;
  document.getElementById("checkout-guests").textContent = adults + children + infants;
  document.getElementById("checkout-total").textContent = nights
    ? money(checkoutEstimate(start, end)) : "SAR -";
}

async function loadCheckout() {
  if (!authOrLogin(location.href)) {
    return;
  }
  if (isManagementAccount()) {
    location.href = "owner_home.html";
    return;
  }
  const placeId = qs("place_id");
  if (!placeId) {
    document.getElementById("checkout-loading").textContent = "No place was selected.";
    return;
  }

  try {
    const [place, pricing] = await Promise.all([
      fetchPlace(placeId),
      fetchAll("/seasonal-pricing/").catch(() => [])
    ]);
    checkoutPlace = place;
    checkoutPricing = pricing.filter((item) => item.place_id === place.id);
    document.getElementById("checkout-title").textContent = place.title;
    document.getElementById("checkout-image").src = imageFor(place);
    document.getElementById("checkout-image").alt = place.title;
    document.getElementById("checkout-back").href = `place.html?id=${encodeURIComponent(place.id)}`;
    document.getElementById("checkout-start").value = qs("start_date") || "";
    document.getElementById("checkout-end").value = qs("end_date") || "";
    document.getElementById("checkout-adults").value = qs("adults") || 2;
    document.getElementById("checkout-children").value = qs("children") || 0;
    document.getElementById("checkout-infants").value = qs("infants") || 0;
    const policy = place.cancellation_policy_id
      ? await api(`/cancellation-policies/${encodeURIComponent(place.cancellation_policy_id)}`).catch(() => null)
      : null;
    document.getElementById("checkout-policy-name").textContent =
      policy?.name || "Standard cancellation";
    document.getElementById("checkout-policy-text").textContent =
      policy?.description || "Review the property terms before confirming.";
    document.getElementById("checkout-loading").classList.add("hidden");
    document.getElementById("checkout-view").classList.remove("hidden");
    updateCheckoutSummary();
  } catch (error) {
    document.getElementById("checkout-loading").textContent = error.message;
  }
}

async function submitCheckout(event) {
  event.preventDefault();
  const errorBox = document.getElementById("checkout-error");
  errorBox.classList.remove("show");
  const start = document.getElementById("checkout-start").value;
  const end = document.getElementById("checkout-end").value;
  const adults = Number(document.getElementById("checkout-adults").value);
  const children = Number(document.getElementById("checkout-children").value || 0);
  const infants = Number(document.getElementById("checkout-infants").value || 0);
  if (!start || !end || end <= start) {
    errorBox.textContent = "Check-out must be after check-in.";
    errorBox.classList.add("show");
    return;
  }
  if (adults < 1 || adults + children + infants > checkoutPlace.max_guest) {
    errorBox.textContent = `Choose between 1 and ${checkoutPlace.max_guest} guests.`;
    errorBox.classList.add("show");
    return;
  }
  const button = document.getElementById("checkout-submit");
  button.disabled = true;
  button.textContent = "Confirming...";
  try {
    const booking = await api("/bookings/", {
      method: "POST",
      body: JSON.stringify({
        place_id: checkoutPlace.id,
        start_date: start,
        end_date: end
      })
    });
    await api("/booking-guests/", {
      method: "POST",
      body: JSON.stringify({
        booking_id: booking.id,
        adults_count: adults,
        children_count: children,
        infants_count: infants
      })
    });
    location.href = `bookings.html?created=${encodeURIComponent(booking.id)}`;
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.add("show");
  } finally {
    button.disabled = false;
    button.textContent = "Confirm booking";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCheckout();
  document.getElementById("checkout-form")?.addEventListener("submit", submitCheckout);
  ["checkout-start", "checkout-end", "checkout-adults", "checkout-children", "checkout-infants"]
    .forEach((id) => document.getElementById(id)?.addEventListener("input", updateCheckoutSummary));
});
