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
          <button class="btn btn-outline btn-sm" onclick="editEquipment(${e.id})">Edit</button>
          <button class="btn btn-red btn-sm" onclick="deleteEquipment(${e.id})">Delete</button>
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

// ----- Init -----
(async function init() {
  const session = await requireAuth();
  if (!session) return;
  renderShell("Equipment");
  await loadEquipment();
  populateCategoryFilter();
})();