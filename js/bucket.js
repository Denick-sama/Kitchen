// ============================================================
//  Bucket List JS
// ============================================================

const KEY = STORAGE_KEYS.bucket;

const EMOJIS = ['🍜','🍕','🌮','🍣','🍛','🥘','🫕','🍝','🥗','🍱','🦞','🥩','🍰','🧁','🍫','🫙','🌿','🧄','🧅','🍊','🍋','🍇','🫐','🥭','🌶️','🫚','🍵','☕','🍷','🫖'];

let items = [];
let editingId = null;
let filterText = '';
let filterCat = '';
let showAchieved = true;

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
    const matchText = !filterText || i.name.toLowerCase().includes(filterText.toLowerCase()) || (i.note || '').toLowerCase().includes(filterText.toLowerCase());
    const matchCat  = !filterCat  || i.category === filterCat;
    const matchDone = showAchieved || !i.achieved;
    return matchText && matchCat && matchDone;
  });
}

function renderStats() {
  const total    = items.length;
  const achieved = items.filter(i => i.achieved).length;
  const dreaming = total - achieved;
  document.getElementById('totalCount').textContent    = total;
  document.getElementById('achievedCount').textContent = achieved;
  document.getElementById('dreamCount').textContent    = dreaming;
}

function render() {
  const list = filtered();
  const container = document.getElementById('itemsGrid');
  const badge = document.getElementById('itemCountBadge');
  if (badge) badge.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">✨</div>
        <p>${items.length === 0 ? 'Dream big — add an ingredient or dish you want to try!' : 'No items match your filters.'}</p>
      </div>`;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.achieved ? 1 : 0) - (b.achieved ? 1 : 0));

  container.innerHTML = sorted.map((item, idx) => `
    <div class="bucket-item ${item.achieved ? 'achieved' : ''}" style="animation-delay:${idx * 0.04}s" data-id="${item.id}">
      <div class="bucket-icon">${item.emoji || '✨'}</div>
      <div class="bucket-content">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;">
          <div class="item-name">${escHtml(item.name)}</div>
          <div class="item-actions" style="position:relative;flex-shrink:0;display:flex;gap:0.15rem;">
            <button class="btn btn-ghost btn-sm" onclick="toggleAchieved('${item.id}')" title="${item.achieved ? 'Mark undone' : 'Mark achieved'}">${item.achieved ? '↩' : '✓'}</button>
            <button class="btn btn-ghost btn-sm" onclick="openEdit('${item.id}')" title="Edit">✎</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleMoveMenu('${item.id}')" title="Move">⇄</button>
            <button class="btn btn-ghost btn-sm" onclick="deleteItem('${item.id}')" title="Remove">✕</button>
            <div class="move-menu" id="move-${item.id}">
              <button onclick="doMove('${item.id}', '${STORAGE_KEYS.fridge}')">🧊 Move to Fridge</button>
              <button onclick="doMove('${item.id}', '${STORAGE_KEYS.pantry}')">🫙 Move to Pantry</button>
              <button onclick="doMove('${item.id}', '${STORAGE_KEYS.grocery}')">🛒 Grocery List</button>
            </div>
          </div>
        </div>
        <div class="item-meta" style="margin-top:0.35rem;">
          <span class="tag tag-category">${item.category || 'Other'}</span>
          ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
          ${item.achieved ? `<span class="tag tag-expiry">✓ achieved</span>` : ''}
        </div>
        ${item.note ? `<div class="tag-note">${escHtml(item.note)}</div>` : ''}
      </div>
    </div>`).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Widget & Drawer ───────────────────────────────────────────
function updateWidget() {
  const badge = document.getElementById('bucketWidgetBadge');
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
    body.innerHTML = `<div class="drawer-empty"><div class="empty-icon">✨</div><p>Your bucket list is empty.</p></div>`;
    return;
  }
  const sorted = [...items].sort((a, b) => (a.achieved ? 1 : 0) - (b.achieved ? 1 : 0));
  body.innerHTML = sorted.map((item, idx) => `
    <div class="drawer-bucket-item ${item.achieved ? 'achieved' : ''}" style="animation-delay:${idx * 0.04}s">
      <div class="drawer-bucket-icon">${item.emoji || '✨'}</div>
      <div class="drawer-bucket-info">
        <div class="item-name">${escHtml(item.name)}</div>
        <div class="item-meta">
          <span class="tag tag-category">${item.category || 'Other'}</span>
          ${item.cost ? `<span class="tag tag-qty">₵${parseFloat(item.cost).toFixed(2)}</span>` : ''}
          ${item.achieved ? `<span class="tag tag-expiry">✓ achieved</span>` : ''}
        </div>
        ${item.note ? `<div class="tag-note" style="margin-top:0.35rem;">${escHtml(item.note)}</div>` : ''}
      </div>
    </div>`).join('');
}

function openDrawer() {
  renderDrawer();
  document.getElementById('bucketDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('bucketDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

document.getElementById('bucketWidget').addEventListener('click', openDrawer);
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// ── Add / Edit ────────────────────────────────────────────────
function toggleAchieved(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item.achieved = !item.achieved;
  if (item.achieved) showToast(`"${item.name}" marked as achieved! 🎉`, 'success');
  save(); load();
}

function getFormData() {
  return {
    name:     document.getElementById('iName').value.trim(),
    category: document.getElementById('iCategory').value,
    emoji:    document.getElementById('iEmoji').value || '✨',
    cost:     document.getElementById('iCost').value,
    note:     document.getElementById('iNote').value.trim(),
  };
}

function clearForm() {
  ['iName','iCost','iNote'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('iCategory').value = BUCKET_CATEGORIES[0];
  document.getElementById('iEmoji').value    = '✨';
  renderEmojiPreview();
}

function renderEmojiPreview() {
  const val = document.getElementById('iEmoji').value || '✨';
  document.getElementById('emojiPreview').textContent = val;
}

document.getElementById('addForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = getFormData();
  if (!data.name) return showToast('Please enter a name', 'error');

  if (editingId) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx > -1) items[idx] = { ...items[idx], ...data };
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add to Bucket List';
    document.getElementById('submitBtn').textContent = '+ Add Dream';
    showToast('Item updated', 'success');
  } else {
    items.unshift({ id: uid(), addedAt: Date.now(), achieved: false, ...data });
    showToast(`"${data.name}" added to your bucket list`, 'success');
  }

  save(); clearForm(); load();
});

document.getElementById('iEmoji').addEventListener('input', renderEmojiPreview);

function pickEmoji(e) {
  document.getElementById('iEmoji').value = e;
  renderEmojiPreview();
  document.getElementById('emojiPicker').classList.remove('open');
}

document.getElementById('emojiPreview').addEventListener('click', () => {
  const picker = document.getElementById('emojiPicker');
  if (!picker.classList.contains('open')) {
    picker.innerHTML = EMOJIS.map(e => `<button type="button" class="emoji-btn" onclick="pickEmoji('${e}')">${e}</button>`).join('');
  }
  picker.classList.toggle('open');
});

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('iName').value     = item.name || '';
  document.getElementById('iCategory').value = item.category || BUCKET_CATEGORIES[0];
  document.getElementById('iEmoji').value    = item.emoji || '✨';
  document.getElementById('iCost').value     = item.cost || '';
  document.getElementById('iNote').value     = item.note || '';
  renderEmojiPreview();
  document.getElementById('formTitle').textContent = 'Edit Item';
  document.getElementById('submitBtn').textContent = '✓ Save Changes';
  document.getElementById('iName').focus();
  document.getElementById('iName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
  editingId = null;
  clearForm();
  document.getElementById('formTitle').textContent = 'Add to Bucket List';
  document.getElementById('submitBtn').textContent = '+ Add Dream';
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  confirmDelete(`Remove "${item?.name}" from your bucket list?`, () => {
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
  if (!e.target.closest('.item-actions') && !e.target.closest('#emojiPicker') && e.target.id !== 'emojiPreview') {
    document.querySelectorAll('.move-menu').forEach(m => m.classList.remove('open'));
    document.getElementById('emojiPicker').classList.remove('open');
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

document.getElementById('toggleAchieved').addEventListener('click', () => {
  showAchieved = !showAchieved;
  document.getElementById('toggleAchieved').textContent = showAchieved ? 'Hide achieved' : 'Show achieved';
  render();
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (items.length === 0) return showToast('Nothing to clear', 'info');
  confirmDelete('Clear your entire bucket list?', () => {
    items = []; save(); load();
    showToast('Bucket list cleared', 'info');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('iCategory').innerHTML = categoryOptions(BUCKET_CATEGORIES);
  const catFilter = document.getElementById('categoryFilter');
  catFilter.innerHTML = `<option value="">All categories</option>` + BUCKET_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  renderEmojiPreview();
  load();
});
