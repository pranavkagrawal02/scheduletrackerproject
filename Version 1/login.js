const SESSION_KEY = "scheduleTracker.session";
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  sessionStorage.removeItem(SESSION_KEY);

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });

    const result = await response.json();
    if (!response.ok) {
      loginError.textContent = result.error || "Login failed";
      return;
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
    window.location.href = "/dashboard.html";
  } catch (error) {
    loginError.textContent = "Unable to connect to the application server";
  }
});
