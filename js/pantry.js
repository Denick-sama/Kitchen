// ============================================================
//  Pantry JS
// ============================================================

const KEY = STORAGE_KEYS.pantry;

let items = [];
let editingId = null;
let filterText = '';
let filterCat = '';

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
    return matchText && matchCat;
  });
}

function renderStats() {
  document.getElementById('totalCount').textContent = items.length;
  const cats = [...new Set(items.map(i => i.category))].length;
  document.getElementById('catCount').textContent = cats;
  const lowStock = items.filter(i => i.stockLevel === 'Low').length;
  document.getElementById('lowCount').textContent = lowStock;
}

function render() {
  const list = filtered();
  const container = document.getElementById('itemsGrid');
  const badge = document.getElementById('itemCountBadge');
  if (badge) badge.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🫙</div>
        <p>${items.length === 0 ? 'Your pantry is bare. Start adding items!' : 'No items match your search.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map((item, idx) => {
    const stockCls = item.stockLevel === 'Low' ? 'tag-priority' : 'tag-qty';
    return `
    <div class="item-card" style="animation-delay:${idx * 0.04}s" data-id="${item.id}">
      <div class="item-card-header">
        <div class="item-name">${escHtml(item.name)}</div>
        <div class="item-actions" style="position:relative;">
          <button class="btn btn-ghost btn-sm" onclick="openEdit('${item.id}')" title="Edit">✎</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleMoveMenu('${item.id}')" title="Move">⇄</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteItem('${item.id}')" title="Delete">✕</button>
          <div class="move-menu" id="move-${item.id}">
            <button onclick="doMove('${item.id}', '${STORAGE_KEYS.fridge}')">🧊 Fridge</button>
            <button onclick="doMove('${item.id}', '${STORAGE_KEYS.grocery}')">🛒 Grocery List</button>
            <button onclick="doMove('${item.id}', '${STORAGE_KEYS.bucket}')">✨ Bucket List</button>
          </div>
        </div>
      </div>
      <div class="item-meta">
        <span class="tag tag-category">${item.category || 'Other'}</span>
        ${item.quantity ? `<span class="tag tag-qty">qty: ${escHtml(item.quantity)}</span>` : ''}
        ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
        ${item.stockLevel ? `<span class="tag ${stockCls}">${escHtml(item.stockLevel)} stock</span>` : ''}
      </div>
      ${item.note ? `<div class="tag-note">${escHtml(item.note)}</div>` : ''}
    </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Widget & Drawer ───────────────────────────────────────────
function updateWidget() {
  const badge = document.getElementById('pantryBadge');
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
    body.innerHTML = `<div class="drawer-empty"><div class="empty-icon">🫙</div><p>Pantry is empty.</p></div>`;
    return;
  }
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  body.innerHTML = sorted.map((item, idx) => {
    const stockCls = item.stockLevel === 'Low' ? 'tag-priority' : 'tag-qty';
    return `
    <div class="drawer-item" style="animation-delay:${idx * 0.04}s">
      <div class="item-name">${escHtml(item.name)}</div>
      <div class="item-meta">
        <span class="tag tag-category">${item.category || 'Other'}</span>
        ${item.quantity ? `<span class="tag tag-qty">qty: ${escHtml(item.quantity)}</span>` : ''}
        ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
        ${item.stockLevel ? `<span class="tag ${stockCls}">${escHtml(item.stockLevel)} stock</span>` : ''}
      </div>
      ${item.note ? `<div class="tag-note" style="margin-top:0.35rem;">${escHtml(item.note)}</div>` : ''}
    </div>`;
  }).join('');
}

function openDrawer() {
  renderDrawer();
  document.getElementById('pantryDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('pantryDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

document.getElementById('pantryWidget').addEventListener('click', openDrawer);
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// ── Add / Edit ────────────────────────────────────────────────
function getFormData() {
  return {
    name:       document.getElementById('iName').value.trim(),
    category:   document.getElementById('iCategory').value,
    quantity:   document.getElementById('iQuantity').value.trim(),
    stockLevel: document.getElementById('iStockLevel').value,
    cost:       document.getElementById('iCost').value,
    note:       document.getElementById('iNote').value.trim(),
  };
}

function clearForm() {
  ['iName','iQuantity','iCost','iNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('iCategory').value   = PANTRY_CATEGORIES[0];
  document.getElementById('iStockLevel').value = 'Good';
}

document.getElementById('addForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = getFormData();
  if (!data.name) return showToast('Please enter an item name', 'error');

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx > -1) items[idx] = { ...items[idx], ...data };
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add to Pantry';
    document.getElementById('submitBtn').textContent = '+ Add Item';
    showToast('Item updated', 'success');
  } else {
    items.unshift({ id: uid(), addedAt: Date.now(), ...data });
    showToast(`${data.name} added to pantry`, 'success');
  }

  save(); clearForm(); load();
});

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('iName').value       = item.name || '';
  document.getElementById('iCategory').value   = item.category || PANTRY_CATEGORIES[0];
  document.getElementById('iQuantity').value   = item.quantity || '';
  document.getElementById('iStockLevel').value = item.stockLevel || 'Good';
  document.getElementById('iCost').value       = item.cost || '';
  document.getElementById('iNote').value       = item.note || '';
  document.getElementById('formTitle').textContent = 'Edit Item';
  document.getElementById('submitBtn').textContent = '✓ Save Changes';
  document.getElementById('iName').focus();
  document.getElementById('iName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
  editingId = null;
  clearForm();
  document.getElementById('formTitle').textContent = 'Add to Pantry';
  document.getElementById('submitBtn').textContent = '+ Add Item';
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  confirmDelete(`Remove "${item?.name}" from your pantry?`, () => {
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
  if (!e.target.closest('.item-actions')) {
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

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (items.length === 0) return showToast('Nothing to clear', 'info');
  confirmDelete('This will remove all items from your pantry.', () => {
    items = []; save(); load();
    showToast('Pantry cleared', 'info');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('iCategory').innerHTML = categoryOptions(PANTRY_CATEGORIES);
  const catFilter = document.getElementById('categoryFilter');
  catFilter.innerHTML = `<option value="">All categories</option>` + PANTRY_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  load();
});
