// Shared helpers: toast notifications, auth guard, nav rendering, formatting.

// Current user's role (loaded from the profiles table, falls back to "borrower")
let currentRole = "borrower";

async function loadProfile() {
  try {
    const { data } = await SUPABASE.auth.getUser();
    if (!data.user) return;
    const { data: prof } = await SUPABASE.from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (prof && prof.role) currentRole = prof.role;
  } catch (e) {
    // keep default role
  }
}

function showToast(message, type = "success") {
  const wrap = document.getElementById("toast-wrap");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = message;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Overdue business rule (BR-09):
// IF current date > due date AND status is not Returned THEN status = Overdue
function computedStatus(txn) {
  if (txn.status !== "Returned" && txn.due_date && txn.due_date < today()) {
    return "Overdue";
  }
  return txn.status;
}

function statusBadge(status) {
  const map = {
    Available: "avail",
    Pending: "pending",
    Borrowed: "borrowed",
    Returned: "returned",
    Overdue: "overdue",
  };
  return `<span class="badge ${map[status] || "default"}">${escapeHtml(status)}</span>`;
}

// Auth guard: redirect to login page when there is no session.
async function requireAuth() {
  try {
    const { data, error } = await SUPABASE.auth.getSession();
    if (error || !data.session) {
      window.location.href = "index.html";
      return null;
    }
    return data.session;
  } catch (e) {
    window.location.href = "index.html";
    return null;
  }
}

async function logout() {
  await SUPABASE.auth.signOut();
  sessionStorage.setItem("system_notice", "You have been logged out.");
  window.location.href = "index.html";
}

// Render topbar with user name + nav with active link.
async function renderShell(active = "") {
  const { data } = await SUPABASE.auth.getUser();
  const user = data.user;
  if (user) {
    document.getElementById("user-name").textContent = user.email;
  }
  const nav = document.getElementById("main-nav");
  const links = [
    ["dashboard.html", "Dashboard"],
    ["equipment.html", "Equipment"],
    ["transactions.html", "Transactions"],
  ];
  nav.innerHTML = links
    .map(
      ([href, label]) =>
        `<a href="${href}" class="${active === label ? "active" : ""}">${label}</a>`
    )
    .join("");
}