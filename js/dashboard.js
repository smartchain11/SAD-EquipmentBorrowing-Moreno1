// Dashboard: summary statistics + recent transactions.
// Stats: Total Equipment, Available, Borrowed, Returned Transactions, Overdue (BR-09).

let equipmentCount = 0;

async function loadDashboard() {
  const eq = await SUPABASE.from("equipment").select("*");
  const tx = await SUPABASE.from("borrow_transactions").select("*").order("date_borrowed", { ascending: false });

  if (eq.error || tx.error) {
    const err = (eq.error || tx.error).message;
    showToast("Failed to load dashboard: " + err, "error");
    return;
  }

  const equipment = eq.data || [];
  const transactions = tx.data || [];
  equipmentCount = equipment.length;

  document.getElementById("stat-total").textContent = equipment.length;
  document.getElementById("stat-available").textContent = equipment.filter((e) => e.availability === "Available").length;
  document.getElementById("stat-borrowed").textContent = equipment.filter((e) => e.availability === "Borrowed").length;

  const returnedTx = transactions.filter((t) => t.status === "Returned").length;
  // BR-09: overdue = not returned AND due date passed
  const overdue = transactions.filter((t) => computedStatus(t) === "Overdue").length;
  document.getElementById("stat-returned").textContent = returnedTx;
  document.getElementById("stat-overdue").textContent = overdue;

  // Recent transactions (join equipment name)
  const equipmentMap = new Map(equipment.map((e) => [e.id, e]));
  const recent = transactions.slice(0, 8);

  const tbody = document.getElementById("recent-tbody");
  document.getElementById("loading").style.display = "none";
  if (recent.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = recent
    .map((t) => {
      const name = equipmentMap.get(t.equipment_id);
      return `
      <tr>
        <td>${escapeHtml(name ? name.equipment_name : "—")}</td>
        <td>${escapeHtml(name ? name.asset_code : "—")}</td>
        <td><strong>${escapeHtml(t.borrower_name)}</strong></td>
        <td>${fmtDate(t.date_borrowed)}</td>
        <td>${fmtDate(t.due_date)}</td>
        <td>${statusBadge(computedStatus(t))}</td>
      </tr>`;
    })
    .join("");
}

(async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderShell("Dashboard");
  const notice = sessionStorage.getItem("system_notice");
  if (notice) {
    sessionStorage.removeItem("system_notice");
    showToast(notice);
  }
  await loadDashboard();
})();