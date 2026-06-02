// ============================================================
//  Grocery List JS
// ============================================================

const KEY = STORAGE_KEYS.grocery;

let items = [];
let editingId = null;
let filterText = '';
let filterCat = '';
let showChecked = true;

function load() {
  items = Storage.get(KEY);
  render();
  renderStats();
  updateWidget();
}

function save() {
  Storage.set(KEY, items);
}

function filtered() {
  return items.filter(i => {
    const matchText = !filterText || i.name.toLowerCase().includes(filterText.toLowerCase());
    const matchCat  = !filterCat  || i.category === filterCat;
    const matchDone = showChecked || !i.checked;
    return matchText && matchCat && matchDone;
  });
}

function renderStats() {
  const total   = items.length;
  const checked = items.filter(i => i.checked).length;
  const pending = total - checked;
  document.getElementById('totalCount').textContent   = total;
  document.getElementById('checkedCount').textContent = checked;
  document.getElementById('pendingCount').textContent = pending;

  const totalCostVal = items.reduce((sum, i) => sum + (parseFloat(i.cost) || 0), 0);
  const costEl = document.getElementById('totalCost');
  if (costEl) costEl.textContent = `₵${totalCostVal.toFixed(2)}`;

  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${pct}% done`;
}

function render() {
  const list = filtered();
  const container = document.getElementById('itemsGrid');
  const badge = document.getElementById('itemCountBadge');
  if (badge) badge.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <p>${items.length === 0 ? 'Your grocery list is empty. Add what you need!' : 'No items match your filters.'}</p>
      </div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.checked ? 1 : 0) - (b.checked ? 1 : 0));

  container.innerHTML = sorted.map((item, idx) => `
    <div class="check-item ${item.checked ? 'checked' : ''}" style="animation-delay:${idx * 0.03}s" data-id="${item.id}">
      <div class="custom-checkbox ${item.checked ? 'checked' : ''}" onclick="toggleCheck('${item.id}')">
        ${item.checked ? '✓' : ''}
      </div>
      <div class="check-item-content">
        <div class="item-name">${escHtml(item.name)}</div>
        <div class="item-meta" style="margin-top:0.35rem;">
          <span class="tag tag-category">${item.category || 'Other'}</span>
          ${item.quantity ? `<span class="tag tag-qty">qty: ${escHtml(item.quantity)}</span>` : ''}
          ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
          ${item.priority === 'High' ? `<span class="tag tag-priority">urgent</span>` : ''}
        </div>
        ${item.note ? `<div class="tag-note">${escHtml(item.note)}</div>` : ''}
      </div>
      <div class="check-item-actions" style="position:relative;">
        <button class="btn btn-ghost btn-sm" onclick="openEdit('${item.id}')" title="Edit">✎</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleMoveMenu('${item.id}')" title="Move to…">⇄</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteItem('${item.id}')" title="Remove">✕</button>
        <div class="move-menu" id="move-${item.id}">
          <button onclick="doMove('${item.id}', '${STORAGE_KEYS.fridge}')">🧊 Move to Fridge</button>
          <button onclick="doMove('${item.id}', '${STORAGE_KEYS.pantry}')">🫙 Move to Pantry</button>
          <button onclick="doMove('${item.id}', '${STORAGE_KEYS.bucket}')">✨ Bucket List</button>
        </div>
      </div>
    </div>`).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Widget & Drawer ───────────────────────────────────────────
function updateWidget() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const prev = parseInt(badge.textContent) || 0;
    badge.textContent = items.length;
    if (items.length !== prev) {
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
  }
}

function renderDrawer() {
  const body = document.getElementById('drawerBody');
  if (!body) return;

  if (items.length === 0) {
    body.innerHTML = `<div class="drawer-empty"><div class="empty-icon">🛒</div><p>Your grocery list is empty.</p></div>`;
    return;
  }

  const sorted = [...items].sort((a, b) => (a.checked ? 1 : 0) - (b.checked ? 1 : 0));
  const totalCost = items.reduce((sum, i) => sum + (parseFloat(i.cost) || 0), 0);
  const pendingCost = items.filter(i => !i.checked).reduce((sum, i) => sum + (parseFloat(i.cost) || 0), 0);
  const hasCosts = items.some(i => i.cost);

  const totalStrip = hasCosts ? `
    <div class="drawer-total-strip">
      <span>Estimated total</span>
      <strong>₵${totalCost.toFixed(2)}</strong>
    </div>
    <div class="drawer-total-strip" style="opacity:0.75;">
      <span>Still to buy</span>
      <strong>₵${pendingCost.toFixed(2)}</strong>
    </div>` : '';

  body.innerHTML = totalStrip + sorted.map((item, idx) => `
    <div class="drawer-cart-item ${item.checked ? 'checked' : ''}" style="animation-delay:${idx * 0.03}s">
      <div class="drawer-check ${item.checked ? 'checked' : ''}">${item.checked ? '✓' : ''}</div>
      <div class="drawer-cart-info">
        <div class="item-name">${escHtml(item.name)}</div>
        <div class="item-meta">
          <span class="tag tag-category">${item.category || 'Other'}</span>
          ${item.quantity ? `<span class="tag tag-qty">qty: ${escHtml(item.quantity)}</span>` : ''}
          ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
          ${item.priority === 'High' ? `<span class="tag tag-priority">urgent</span>` : ''}
        </div>
        ${item.note ? `<div class="tag-note" style="margin-top:0.35rem;">${escHtml(item.note)}</div>` : ''}
      </div>
    </div>`).join('');
}

function openDrawer() {
  renderDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

document.getElementById('cartWidget').addEventListener('click', openDrawer);
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// ── Add / Edit ────────────────────────────────────────────────
function toggleCheck(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item.checked = !item.checked;
  save(); load();
}

function getFormData() {
  return {
    name:     document.getElementById('iName').value.trim(),
    category: document.getElementById('iCategory').value,
    quantity: document.getElementById('iQuantity').value.trim(),
    priority: document.getElementById('iPriority').value,
    cost:     document.getElementById('iCost').value,
    note:     document.getElementById('iNote').value.trim(),
  };
}

function clearForm() {
  ['iName','iQuantity','iCost','iNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('iCategory').value = GROCERY_CATEGORIES[0];
  document.getElementById('iPriority').value = 'Normal';
}

document.getElementById('addForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = getFormData();
  if (!data.name) return showToast('Please enter an item name', 'error');

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx > -1) items[idx] = { ...items[idx], ...data };
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add to Grocery List';
    document.getElementById('submitBtn').textContent = '+ Add Item';
    showToast('Item updated', 'success');
  } else {
    items.unshift({ id: uid(), addedAt: Date.now(), checked: false, ...data });
    showToast(`${data.name} added`, 'success');
  }

  save(); clearForm(); load();
});

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('iName').value     = item.name || '';
  document.getElementById('iCategory').value = item.category || GROCERY_CATEGORIES[0];
  document.getElementById('iQuantity').value = item.quantity || '';
  document.getElementById('iPriority').value = item.priority || 'Normal';
  document.getElementById('iCost').value     = item.cost || '';
  document.getElementById('iNote').value     = item.note || '';
  document.getElementById('formTitle').textContent = 'Edit Item';
  document.getElementById('submitBtn').textContent = '✓ Save Changes';
  document.getElementById('iName').focus();
  document.getElementById('iName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
  editingId = null;
  clearForm();
  document.getElementById('formTitle').textContent = 'Add to Grocery List';
  document.getElementById('submitBtn').textContent = '+ Add Item';
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  confirmDelete(`Remove "${item?.name}" from your grocery list?`, () => {
    items = items.filter(i => i.id !== id);
    save(); load();
    showToast('Item removed', 'info');
  });
}

function toggleMoveMenu(id) {
  document.querySelectorAll('.move-menu').forEach(m => {
    if (m.id !== `move-${id}`) m.classList.remove('open');
  });
  document.getElementById(`move-${id}`).classList.toggle('open');
}

function doMove(id, toKey) {
  moveItem(id, KEY, toKey);
  load();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.check-item-actions')) {
    document.querySelectorAll('.move-menu').forEach(m => m.classList.remove('open'));
  }
});

document.getElementById('searchInput').addEventListener('input', e => {
  filterText = e.target.value;
  render();
});

document.getElementById('categoryFilter').addEventListener('change', e => {
  filterCat = e.target.value;
  render();
});

document.getElementById('toggleChecked').addEventListener('click', () => {
  showChecked = !showChecked;
  document.getElementById('toggleChecked').textContent = showChecked ? 'Hide checked' : 'Show checked';
  render();
});

document.getElementById('clearCheckedBtn').addEventListener('click', () => {
  const checked = items.filter(i => i.checked);
  if (checked.length === 0) return showToast('No checked items to clear', 'info');
  confirmDelete(`Remove ${checked.length} checked item(s)?`, () => {
    items = items.filter(i => !i.checked);
    save(); load();
    showToast('Checked items cleared', 'info');
  });
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (items.length === 0) return showToast('Nothing to clear', 'info');
  confirmDelete('Clear your entire grocery list?', () => {
    items = []; save(); load();
    showToast('List cleared', 'info');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('iCategory').innerHTML = categoryOptions(GROCERY_CATEGORIES);
  const catFilter = document.getElementById('categoryFilter');
  catFilter.innerHTML = `<option value="">All categories</option>` + GROCERY_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  load();
});
