// Borrowing transactions module: record borrow, return, overdue, search, filter.
// Business rules: BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-12.

let allTransactions = [];
let equipmentMap = new Map(); // id -> equipment record

async function loadData() {
  // Load equipment first (for join display + borrow dropdown)
  const eq = await SUPABASE.from("equipment").select("*").order("equipment_name");
  if (eq.error) {
    showToast("Failed to load equipment: " + eq.error.message, "error");
    return;
  }
  equipmentMap = new Map((eq.data || []).map((e) => [e.id, e]));

  const tx = await SUPABASE.from("borrow_transactions")
    .select("*")
    .order("date_borrowed", { ascending: false });
  if (tx.error) {
    showToast("Failed to load transactions: " + tx.error.message, "error");
    return;
  }
  allTransactions = tx.data || [];
  renderTransactions();
  populateEquipmentSelect();
}

function renderTransactions() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fStatus = document.getElementById("filter-status").value;

  const rows = allTransactions.filter((t) => {
    const equip = equipmentMap.get(t.equipment_id);
    const equipName = equip ? equip.equipment_name : "";
    const assetCode = equip ? equip.asset_code : "";
    const haystack = [t.borrower_name, equipName, assetCode, t.department]
      .join(" ")
      .toLowerCase();
    const matchQ = !q || haystack.includes(q);
    const status = computedStatus(t); // BR-09 overdue computed at display time
    const matchStatus = !fStatus || status === fStatus;
    return matchQ && matchStatus;
  });

  const tbody = document.getElementById("transactions-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows
    .map((t) => {
      const equip = equipmentMap.get(t.equipment_id);
      const status = computedStatus(t);
      const canReturn = status === "Borrowed" || status === "Overdue"; // BR-12
      let actionHtml = `<span class="muted text-sm">—</span>`;
      if (status === "Pending") {
        // Only Officers can approve or reject a request
        actionHtml =
          currentRole === "officer"
            ? `<button class="btn btn-green btn-sm" onclick="approveBorrow(${t.id})">Approve</button>
               <button class="btn btn-red btn-sm" onclick="rejectBorrow(${t.id})">Reject</button>`
            : `<span class="muted text-sm">Awaiting approval</span>`;
      } else if (canReturn) {
        actionHtml = `<button class="btn btn-green btn-sm" onclick="returnEquipment(${t.id})">Return</button>`;
      }
      return `
      <tr>
        <td>${escapeHtml(equip ? equip.equipment_name : "—")}</td>
        <td>${escapeHtml(equip ? equip.asset_code : "—")}</td>
        <td><strong>${escapeHtml(t.borrower_name)}</strong></td>
        <td>${escapeHtml(t.borrower_type)}</td>
        <td>${escapeHtml(t.department)}</td>
        <td>${fmtDate(t.date_borrowed)}</td>
        <td>${fmtDate(t.due_date)}</td>
        <td>${fmtDateTime(t.claim_date)}</td>
        <td>${fmtDate(t.date_returned)}</td>
        <td>${statusBadge(status)}</td>
        <td style="text-align:right;">
          ${actionHtml}
        </td>
      </tr>`;
    })
    .join("");
}

function populateEquipmentSelect() {
  const select = document.getElementById("borrow-equipment");
  // BR-03: only available equipment appears in the dropdown
  const available = [...equipmentMap.values()].filter((e) => e.availability === "Available");
  select.innerHTML =
    '<option value="">— Select equipment —</option>' +
    available
      .map((e) => `<option value="${e.id}">${escapeHtml(e.asset_code)} - ${escapeHtml(e.equipment_name)}</option>`)
      .join("");
}

// ----- Borrow form toggle -----
document.getElementById("btn-borrow").addEventListener("click", () => {
  const card = document.getElementById("borrow-card");
  const isOpen = card.style.display === "block";
  card.style.display = isOpen ? "none" : "block";
  if (!isOpen) {
    document.getElementById("date-borrowed").value = today();
    document.getElementById("due-date").value = "";
    populateEquipmentSelect();
  }
});
document.getElementById("btn-cancel-borrow").addEventListener("click", () => {
  document.getElementById("borrow-card").style.display = "none";
});

// ----- Create borrowing -----
document.getElementById("borrow-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // BR-04: borrower name must be provided
  const borrower = document.getElementById("borrower-name").value.trim();
  const equipmentId = Number(document.getElementById("borrow-equipment").value);
  const dateBorrowed = document.getElementById("date-borrowed").value;
  const dueDate = document.getElementById("due-date").value;

  document.getElementById("err-borrower").style.display = borrower ? "none" : "block";
  if (!borrower) return;

  // BR-05: due date cannot be earlier than borrowing date
  document.getElementById("err-due").style.display =
    dueDate && dueDate < dateBorrowed ? "block" : "none";
  if (dueDate && dueDate < dateBorrowed) return;

  // BR-03: only available equipment may be borrowed
  document.getElementById("err-equipment").style.display = "none";
  if (!equipmentId) {
    document.getElementById("err-equipment").textContent = "Please select an equipment.";
    document.getElementById("err-equipment").style.display = "block";
    return;
  }

  const btn = document.getElementById("btn-save-borrow");
  btn.disabled = true;
  btn.textContent = "Saving...";

  // Atomic RPC: checks availability (BR-03), inserts a PENDING request (BR-06)
  const { error } = await SUPABASE.rpc("record_borrow", {
    p_equipment_id: equipmentId,
    p_borrower_name: borrower,
    p_borrower_type: document.getElementById("borrower-type").value,
    p_department: document.getElementById("department").value.trim(),
    p_date_borrowed: dateBorrowed,
    p_due_date: dueDate,
  });

  btn.disabled = false;
  btn.textContent = "Save Transaction";

  if (error) {
    const msg = error.message || error.details || "";
    if (msg.includes("BR-03")) {
      document.getElementById("err-equipment").textContent = "Only available equipment may be borrowed.";
      document.getElementById("err-equipment").style.display = "block";
    } else {
      showToast("Borrow failed: " + (error.message || error.details), "error");
    }
    return;
  }

  showToast("Borrow request submitted for approval (Pending).");
  document.getElementById("borrow-card").style.display = "none";
  document.getElementById("borrow-form").reset();
  await loadData();
});

// ----- Approve a pending borrow request (Officer) -----
async function approveBorrow(id) {
  const txn = allTransactions.find((t) => t.id === id);
  const equip = equipmentMap.get(txn.equipment_id);
  if (!confirm(`Approve "${equip.equipment_name}" for ${txn.borrower_name}?`)) return;

  const { error } = await SUPABASE.rpc("approve_borrow", { p_txn_id: id });
  if (error) {
    showToast("Approval failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Borrow request approved. Equipment marked as Borrowed.");
  await loadData();
}

// ----- Reject a pending borrow request (Officer) -----
async function rejectBorrow(id) {
  const txn = allTransactions.find((t) => t.id === id);
  const equip = equipmentMap.get(txn.equipment_id) || {};
  if (!confirm(`Reject the request for "${equip.equipment_name || ""}" by ${txn.borrower_name}?`)) return;

  const { error } = await SUPABASE.rpc("reject_borrow", { p_txn_id: id });
  if (error) {
    showToast("Reject failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Borrow request rejected.");
  await loadData();
}

// ----- Return equipment -----
async function returnEquipment(id) {
  const txn = allTransactions.find((t) => t.id === id);
  const equip = equipmentMap.get(txn.equipment_id);
  if (!confirm(`Confirm return of "${equip.equipment_name}" borrowed by ${txn.borrower_name}?`)) return;

  // RPC: BR-08 (status Returned + date, equipment Available), BR-12 (no double return)
  const { error } = await SUPABASE.rpc("return_equipment", { p_txn_id: id });
  if (error) {
    showToast("Return failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Equipment returned. Transaction marked Returned.");
  await loadData();
}

// ----- Search / filter -----
["search-input", "filter-status"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderTransactions);
});

// ----- Init -----
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderShell("Transactions");
  await loadProfile();
  await loadData();
})();