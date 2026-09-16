// Audit logs module: Admin only view for all system actions
let allLogs = [];

async function loadLogs() {
  const { data, error } = await SUPABASE.from("audit_logs")
    .select("*")
    .order("performed_at", { ascending: false });

  if (error) {
    showToast("Failed to load audit logs: " + (error.message || error.details), "error");
    return;
  }
  
  allLogs = data || [];
  renderLogs();
}

function renderLogs() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fAction = document.getElementById("filter-action").value;

  const rows = allLogs.filter((log) => {
    const haystack = [log.action, log.target_table, log.details].join(" ").toLowerCase();
    const matchQ = !q || haystack.includes(q);
    const matchAction = !fAction || log.action === fAction;
    return matchQ && matchAction;
  });

  const tbody = document.getElementById("audit-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows
    .map(
      (log) => `
      <tr>
        <td>${log.id}</td>
        <td><strong>${escapeHtml(log.action)}</strong></td>
        <td>${escapeHtml(log.target_table)}</td>
        <td>${log.target_id || "—"}</td>
        <td>${escapeHtml(log.details)}</td>
        <td>${fmtDateTime(log.performed_at)}</td>
      </tr>`
    )
    .join("");
}

// Search and filter listeners
["search-input", "filter-action"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderLogs);
});

// Init
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  await loadProfile();

  // BR-B4-10: Only Administrators can view audit logs
  if (!isAdmin()) {
    showToast("Access Denied: Only administrators can view audit logs.", "error");
    document.querySelector("main").innerHTML = `
      <div class="card" style="text-align:center; padding: 40px;">
        <h3 style="color: #d32f2f;">Access Denied</h3>
        <p>You do not have permission to view this page.</p>
        <a href="dashboard.html" class="btn">Return to Dashboard</a>
      </div>
    `;
    return;
  }

  renderShell("Audit Logs");
  await loadLogs();
})();
