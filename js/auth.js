// Authentication logic (login / sign-up / logout).

const loginTab = document.getElementById("tab-login");
const signupTab = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const note = document.getElementById("form-note");

document.querySelectorAll("[data-toggle-pw]").forEach((cb) => {
  cb.addEventListener("change", () => {
    const input = document.getElementById(cb.dataset.togglePw);
    if (input) input.type = cb.checked ? "text" : "password";
  });
});

function switchTab(which) {
  const isLogin = which === "login";
  loginTab.classList.toggle("active", isLogin);
  signupTab.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  note.textContent = isLogin ? "First time? Create an account above." : "Already have an account? Log in.";
}

loginTab.addEventListener("click", () => switchTab("login"));
signupTab.addEventListener("click", () => switchTab("signup"));

// Redirect if already logged in.
SUPABASE.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "dashboard.html";
});

// Show a pending notice (e.g. "You have been logged out.")
const pendingNotice = sessionStorage.getItem("system_notice");
if (pendingNotice) {
  sessionStorage.removeItem("system_notice");
  showToast(pendingNotice);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const btn = loginForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Signing in...";

  const { data, error } = await SUPABASE.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = "Sign In";

  if (error) {
    showToast(error.message, "error");
    return;
  }
  sessionStorage.setItem("system_notice", "Login successful. Welcome back!");
  window.location.href = "dashboard.html";
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value;
  const btn = signupForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Creating account...";

  const { data, error } = await SUPABASE.auth.signUp({ email, password });
  btn.disabled = false;
  btn.textContent = "Create Account";

  if (error) {
    showToast(error.message, "error");
    return;
  }
  if (data.session) {
    sessionStorage.setItem("system_notice", "Account created successfully! Welcome!");
    window.location.href = "dashboard.html";
  } else {
    // Email confirmation enabled
    showToast("Registration successful! Check your email to confirm your account.", "success");
  }
});