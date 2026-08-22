
function passwordScore(value) {
  return [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value)
  ].filter(Boolean).length;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const errorBox = document.getElementById("signup-error");
  const password = document.getElementById("signup-password");
  const strengthBar = document.getElementById("strength-bar");
  const strengthLabel = document.getElementById("strength-label");

  function selectedType() {
    return document.querySelector('input[name="signup-type"]:checked').value;
  }

  function updateAccountFields() {
    const owner = selectedType() === "owner";
    document.getElementById("guest-fields").classList.toggle("hidden", owner);
    document.getElementById("owner-fields").classList.toggle("hidden", !owner);
    ["first-name", "last-name"].forEach((id) => {
      document.getElementById(id).required = !owner;
    });
    ["business-name", "contact-person", "phone-number", "commercial-register"]
      .forEach((id) => {
        document.getElementById(id).required = owner;
      });
  }

  document.querySelectorAll('input[name="signup-type"]').forEach((input) => {
    input.addEventListener("change", updateAccountFields);
  });
  updateAccountFields();

  document.getElementById("toggle-signup-password")?.addEventListener(
    "click",
    () => {
      password.type = password.type === "password" ? "text" : "password";
    }
  );
  password?.addEventListener("input", () => {
    const score = passwordScore(password.value);
    strengthBar.style.width = `${score * 20}%`;
    strengthLabel.textContent = [
      "Too short", "Weak", "Fair", "Good", "Strong", "Excellent"
    ][score];
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("show");
    if (password.value !== document.getElementById("confirm-password").value) {
      errorBox.textContent = "Passwords do not match.";
      errorBox.classList.add("show");
      return;
    }
    if (passwordScore(password.value) < 4) {
      errorBox.textContent = "Please choose a stronger password.";
      errorBox.classList.add("show");
      return;
    }

    const owner = selectedType() === "owner";
    const payload = owner ? {
      business_name: document.getElementById("business-name").value.trim(),
      contact_person: document.getElementById("contact-person").value.trim(),
      email: document.getElementById("signup-email").value.trim(),
      password: password.value,
      phone_number: document.getElementById("phone-number").value.trim(),
      commercial_register: document.getElementById("commercial-register")
        .value.trim()
    } : {
      first_name: document.getElementById("first-name").value.trim(),
      last_name: document.getElementById("last-name").value.trim(),
      email: document.getElementById("signup-email").value.trim(),
      password: password.value
    };
    const button = document.getElementById("signup-submit");
    button.disabled = true;
    button.textContent = "Creating...";
    try {
      const data = await api(owner ? "/auth/register-owner" : "/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (data.access_token) {
        setCookie("token", data.access_token);
        location.href = "user_home.html";
      } else {
        location.href = "login.html?account=owner";
      }
    } catch (error) {
      errorBox.textContent = friendlyError(error, "We could not create this account.");
      errorBox.classList.add("show");
    } finally {
      button.disabled = false;
      button.textContent = "Create account";
    }
  });
});
