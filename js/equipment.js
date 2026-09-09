// Equipment module: CRUD + search + filter.
// Business rules enforced: BR-01 (name required), BR-02 (asset code unique),
// BR-10 (delete confirmation), BR-11 (authenticated users only).

let allEquipment = [];

async function loadEquipment() {
  const { data, error } = await SUPABASE.from("equipment")
    .select("*")
    .order("equipment_name")
    .order("asset_code");
  if (error) {
    console.error(error);
    showToast("Failed to load equipment: " + error.message, "error");
    return;
  }
  allEquipment = data || [];
  renderEquipment();
}

function renderEquipment() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const fAvail = document.getElementById("filter-availability").value;
  const fCat = document.getElementById("filter-category").value;

  const rows = allEquipment.filter((e) => {
    const matchQ =
      !q ||
      e.equipment_name.toLowerCase().includes(q) ||
      e.asset_code.toLowerCase().includes(q);
    const matchAvail = !fAvail || e.availability === fAvail;
    const matchCat = !fCat || e.category === fCat;
    return matchQ && matchAvail && matchCat;
  });

  const tbody = document.getElementById("equipment-tbody");
  document.getElementById("loading").style.display = "none";
  document.getElementById("table-wrap").style.display = "none";
  document.getElementById("empty-state").style.display = "none";

  if (rows.length === 0) {
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  const canManage = currentRole === "officer";
  let actionsCell;
  if (canManage) {
    actionsCell = `<button class="btn btn-outline btn-sm" onclick="editEquipment(${e.id})">Edit</button>
       <button class="btn btn-red btn-sm" onclick="deleteEquipment(${e.id})">Delete</button>`;
  } else if (e.availability === "Available") {
    actionsCell = `<button class="btn btn-sm" onclick="openRequestModal(${e.id})">Request</button>`;
  } else {
    actionsCell = `<span class="muted text-sm">—</span>`;
  }

  document.getElementById("table-wrap").style.display = "block";
  tbody.innerHTML = rows
    .map(
      (e) => `
      <tr>
        <td><strong>${escapeHtml(e.asset_code)}</strong></td>
        <td>${escapeHtml(e.equipment_name)}</td>
        <td>${escapeHtml(e.category)}</td>
        <td>${escapeHtml(e.condition)}</td>
        <td>${statusBadge(e.availability)}</td>
        <td style="text-align:right;">
          ${actionsCell}
        </td>
      </tr>`
    )
    .join("");
}

function populateCategoryFilter() {
  const select = document.getElementById("filter-category");
  const cats = [...new Set(allEquipment.map((e) => e.category))].sort();
  select.innerHTML =
    '<option value="">Category: All</option>' +
    cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

// ----- Modal open / close -----
function openModal(id = null, rec = null) {
  document.getElementById("modal-title").textContent = id ? "Edit Equipment" : "Add Equipment";
  document.getElementById("equipment-id").value = id || "";
  document.getElementById("equipment-name").value = rec ? rec.equipment_name : "";
  document.getElementById("category").value = rec ? rec.category : "";
  document.getElementById("asset-code").value = rec ? rec.asset_code : "";
  document.getElementById("condition").value = rec ? rec.condition : "Good";
  document.getElementById("availability").value = rec ? rec.availability : "Available";
  document.getElementById("err-name").style.display = "none";
  document.getElementById("err-code").style.display = "none";
  document.getElementById("modal-backdrop").classList.add("open");
  document.getElementById("equipment-name").focus();
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

// ----- CRUD -----
document.getElementById("btn-add").addEventListener("click", () => openModal());
document.getElementById("btn-cancel").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function editEquipment(id) {
  const rec = allEquipment.find((e) => e.id === id);
  if (rec) openModal(rec.id, rec);
}

async function saveEquipment(e) {
  e.preventDefault();

  if (currentRole !== "officer") {
    showToast("Only officers can add or edit equipment.", "error");
    return;
  }

  const id = document.getElementById("equipment-id").value;
  const payload = {
    equipment_name: document.getElementById("equipment-name").value.trim(),
    category: document.getElementById("category").value.trim(),
    asset_code: document.getElementById("asset-code").value.trim().toUpperCase(),
    condition: document.getElementById("condition").value,
    availability: document.getElementById("availability").value,
  };

  // BR-01: equipment name cannot be empty
  if (!payload.equipment_name) {
    document.getElementById("err-name").style.display = "block";
    return;
  }
  // BR-02: asset code must be unique
  if (!payload.asset_code) {
    document.getElementById("err-code").style.display = "block";
    return;
  }
  const dup = allEquipment.find((x) => x.asset_code === payload.asset_code && x.id !== Number(id));
  if (dup) {
    document.getElementById("err-code").textContent = "Asset code must be unique (already used).";
    document.getElementById("err-code").style.display = "block";
    showToast("Asset code already exists (BR-02).", "error");
    return;
  }

  let result;
  if (id) {
    result = await SUPABASE.from("equipment").update(payload).eq("id", Number(id));
  } else {
    result = await SUPABASE.from("equipment").insert(payload);
  }

  if (result.error) {
    if (result.error.message && result.error.message.toLowerCase().includes("duplicate")) {
      showToast("Asset code must be unique (BR-02).", "error");
    } else {
      showToast("Save failed: " + result.error.message, "error");
    }
    return;
  }

  showToast(id ? "Equipment updated." : "Equipment added.");
  closeModal();
  await loadEquipment();
  populateCategoryFilter();
}

document.getElementById("equipment-form").addEventListener("submit", saveEquipment);

async function deleteEquipment(id) {
  if (currentRole !== "officer") {
    showToast("Only officers can delete equipment.", "error");
    return;
  }
  const rec = allEquipment.find((e) => e.id === id);
  // BR-10: deletion requires confirmation
  if (!confirm(`Delete "${rec.asset_code} - ${rec.equipment_name}"?\nThis cannot be undone.`)) return;

  const { error } = await SUPABASE.from("equipment").delete().eq("id", id);
  if (error) {
    if (error.message && error.message.toLowerCase().includes("foreign key")) {
      showToast("Cannot delete: equipment has borrowing history.", "error");
    } else {
      showToast("Delete failed: " + error.message, "error");
    }
    return;
  }
  showToast("Equipment deleted.");
  await loadEquipment();
  populateCategoryFilter();
}

// ----- Search / filter events -----
["search-input", "filter-availability", "filter-category"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderEquipment);
});

// ----- Request to borrow modal -----
function openRequestModal(id) {
  const rec = allEquipment.find((e) => e.id === id);
  if (!rec) return;
  document.getElementById("req-equipment-id").value = rec.id;
  document.getElementById("request-asset").textContent = `${rec.asset_code} - ${rec.equipment_name}`;
  document.getElementById("req-borrower-name").value = "";
  document.getElementById("req-borrower-type").value = "Student";
  document.getElementById("req-dept").value = "";
  document.getElementById("req-date-borrowed").value = today();
  document.getElementById("req-due-date").value = "";
  document.getElementById("err-req-name").style.display = "none";
  document.getElementById("err-req-due").style.display = "none";
  document.getElementById("request-backdrop").classList.add("open");
}

function closeRequestModal() {
  document.getElementById("request-backdrop").classList.remove("open");
}

const cancelReqBtn = document.getElementById("btn-cancel-request");
if (cancelReqBtn) {
  cancelReqBtn.addEventListener("click", closeRequestModal);
}

const requestForm = document.getElementById("request-form");
if (requestForm) {
  const requestBackdrop = document.getElementById("request-backdrop");
  if (requestBackdrop) {
    requestBackdrop.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeRequestModal();
    });
  }

  requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("req-borrower-name").value.trim();
  const equipmentId = Number(document.getElementById("req-equipment-id").value);
  const dateBorrowed = document.getElementById("req-date-borrowed").value;
  const dueDate = document.getElementById("req-due-date").value;

  document.getElementById("err-req-name").style.display = name ? "none" : "block";
  if (!name) return;

  document.getElementById("err-req-due").style.display =
    dueDate && dueDate < dateBorrowed ? "block" : "none";
  if (dueDate && dueDate < dateBorrowed) return;

  const btn = document.getElementById("btn-submit-request");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  const { error } = await SUPABASE.rpc("record_borrow", {
    p_equipment_id: equipmentId,
    p_borrower_name: name,
    p_borrower_type: document.getElementById("req-borrower-type").value,
    p_department: document.getElementById("req-dept").value.trim(),
    p_date_borrowed: dateBorrowed,
    p_due_date: dueDate,
  });

  btn.disabled = false;
  btn.textContent = "Submit Request";

  if (error) {
    showToast("Request failed: " + (error.message || error.details), "error");
    return;
  }
  showToast("Request submitted to the admin for approval.");
  closeRequestModal();
  document.getElementById("request-form").reset();
  });
}

// ----- Init -----
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderShell("Equipment");
  await loadProfile();
  if (currentRole !== "officer") {
    const btn = document.getElementById("btn-add");
    if (btn) btn.style.display = "none";
  }
  await loadEquipment();
  populateCategoryFilter();
})();