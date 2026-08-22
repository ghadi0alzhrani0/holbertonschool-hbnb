document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  const toggleButton = document.getElementById("toggle-password");

  toggleButton?.addEventListener("click", () => {
    const passwordInput = document.getElementById("login-password");
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    toggleButton.textContent = passwordInput.type === "password" ? "Show" : "Hide";
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("show");

    const submitButton = document.getElementById("login-submit");
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("login-email").value.trim(),
          password: document.getElementById("login-password").value
        })
      });

      if (!data.access_token) {
        throw new Error("Sign in could not be completed. Please try again.");
      }

      setCookie("token", data.access_token);
      const nextPage = new URLSearchParams(location.search).get("next");
      const destination = data.role === "owner" || data.role === "admin"
        ? "owner_home.html"
        : (nextPage || "user_home.html");
      location.href = destination;
    } catch (error) {
      errorBox.textContent = friendlyError(error, "Sign in could not be completed.");
      errorBox.classList.add("show");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign in";
    }
  });
});
