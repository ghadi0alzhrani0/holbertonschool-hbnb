const ratingKeys = [
  "cleanliness",
  "accuracy",
  "communication",
  "location",
  "check_in",
  "value"
];

let overallRating = 0;
let detailedRatings = {};

async function loadReviewPage() {
  if (!isAuthenticated()) {
    location.href = "index.html";
    return;
  }
  if (isManagementAccount()) {
    location.href = "owner_home.html";
    return;
  }

  const placeId = qs("place_id") || qs("id");
  if (!placeId) {
    document.getElementById("review-loading").textContent = "No place ID was provided.";
    return;
  }

  document.getElementById("cancel-review").href =
    `place.html?id=${encodeURIComponent(placeId)}`;
  document.getElementById("review-form").dataset.placeId = placeId;

  try {
    const place = await fetchPlace(placeId);
    document.getElementById("review-loading").classList.add("hidden");
    document.getElementById("review-view").classList.remove("hidden");
    document.getElementById("review-place-image").src = imageFor(place);
    document.getElementById("review-place-image").alt = place.title || "Place";
    document.getElementById("review-place-name").textContent = place.title || "Stay";
    document.getElementById("review-place-location").textContent =
      place.city_id ? `City ID: ${place.city_id}` : "HBnB destination";
    document.getElementById("review-place-description").textContent =
      place.description || "Share your experience with future guests.";
  } catch (error) {
    document.getElementById("review-loading").textContent = error.message;
    return;
  }

  renderOverallRating();
  renderDetailedRatings();

  document.getElementById("review-text").addEventListener("input", (event) => {
    document.getElementById("review-counter").textContent =
      `${event.target.value.length} / 1200`;
  });
  document.getElementById("review-form").addEventListener("submit", submitReview);
}

function renderOverallRating() {
  const stars = document.getElementById("overall-stars");
  stars.innerHTML = [1, 2, 3, 4, 5]
    .map((value) => `<button class="star" type="button" data-value="${value}">★</button>`)
    .join("");

  stars.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    overallRating = Number(button.dataset.value);
    stars.querySelectorAll("button").forEach((star, index) => {
      star.classList.toggle("active", index < overallRating);
    });
  });
}

function renderDetailedRatings() {
  const ratingGrid = document.getElementById("rating-grid");
  ratingGrid.innerHTML = ratingKeys.map((key) => `
    <div class="rating-item">
      <strong>${key.replace("_", " ")}</strong>
      <div class="rating-stars" data-key="${key}">
        ${[1, 2, 3, 4, 5]
          .map((value) => `<button type="button" data-value="${value}">★</button>`)
          .join("")}
      </div>
    </div>
  `).join("");

  ratingGrid.querySelectorAll(".rating-stars").forEach((row) => {
    row.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }
      const value = Number(button.dataset.value);
      detailedRatings[row.dataset.key] = value;
      row.querySelectorAll("button").forEach((star, index) => {
        star.classList.toggle("active", index < value);
      });
    });
  });
}

function showReviewError(message) {
  document.getElementById("review-error").innerHTML =
    `<div class="error-box show">${safe(message)}</div>`;
}

function clearReviewForm(form) {
  form.reset();
  overallRating = 0;
  detailedRatings = {};
  document.getElementById("review-counter").textContent = "0 / 1200";
  document.querySelectorAll(".star, .rating-stars button").forEach((star) => {
    star.classList.remove("active");
  });
}

async function submitReview(event) {
  event.preventDefault();
  document.getElementById("review-error").innerHTML = "";

  const form = event.currentTarget;
  const reviewText = document.getElementById("review-text").value.trim();
  if (!overallRating) {
    showReviewError("Choose an overall rating.");
    return;
  }
  if (!reviewText) {
    showReviewError("Write a review before publishing.");
    return;
  }

  const submitButton = document.getElementById("review-submit");
  submitButton.disabled = true;
  submitButton.textContent = "Publishing...";

  try {
    const review = await api("/reviews/", {
      method: "POST",
      body: JSON.stringify({
        place_id: form.dataset.placeId,
        text: reviewText,
        rating: overallRating
      })
    });

    const ratingDetails = { review_id: review.id };
    ratingKeys.forEach((key) => {
      ratingDetails[key] = detailedRatings[key] || overallRating;
    });
    await api("/review-ratings/", {
      method: "POST",
      body: JSON.stringify(ratingDetails)
    });

    clearReviewForm(form);
    toast("Review submitted successfully.");
  } catch (error) {
    showReviewError(error.message || "Failed to submit review.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Publish review";
  }
}

document.addEventListener("DOMContentLoaded", loadReviewPage);
