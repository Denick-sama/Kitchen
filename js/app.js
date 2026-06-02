// ============================================================
//  Kitchen App — Shared Utilities (app.js)
// ============================================================

const STORAGE_KEYS = {
  fridge: 'kitchen_fridge',
  pantry: 'kitchen_pantry',
  grocery: 'kitchen_grocery',
  bucket: 'kitchen_bucket',
};

// ── Storage helpers ──────────────────────────────────────────
const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};

// ── ID generator ──────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Toast notifications ───────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: '◆' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '◆'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Expiry helpers ────────────────────────────────────────────
function expiryStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(dateStr);
  const diff = Math.ceil((exp - today) / 86400000);
  if (diff < 0)  return { label: 'expired', cls: 'expired' };
  if (diff === 0) return { label: 'expires today', cls: 'soon' };
  if (diff <= 3)  return { label: `${diff}d left`, cls: 'soon' };
  return { label: `${diff}d left`, cls: '' };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

// ── Nav active state & hamburger ──────────────────────────────
function initNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('active');
  });

  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }
}

// ── Move item between sections ────────────────────────────────
function moveItem(itemId, fromKey, toKey) {
  const fromList = Storage.get(fromKey);
  const idx = fromList.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const [item] = fromList.splice(idx, 1);
  item.movedAt = Date.now();
  const toList = Storage.get(toKey);
  toList.unshift(item);
  Storage.set(fromKey, fromList);
  Storage.set(toKey, toList);
  const labels = {
    kitchen_fridge: 'Fridge',
    kitchen_pantry: 'Pantry',
    kitchen_grocery: 'Grocery List',
    kitchen_bucket: 'Bucket List',
  };
  showToast(`Moved to ${labels[toKey]}`, 'success');
}

// ── Modal helpers ──────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// ── Confirm dialog ─────────────────────────────────────────────
function confirmDelete(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Are you sure?</h2>
      <p style="font-size:0.78rem;color:var(--text-muted);line-height:1.6;">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancelDel">Cancel</button>
        <button class="btn btn-primary" id="confirmDel" style="background:var(--danger);box-shadow:none;">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelDel').onclick = () => overlay.remove();
  overlay.querySelector('#confirmDel').onclick = () => { onConfirm(); overlay.remove(); };
}

// ── Category options ───────────────────────────────────────────
const FRIDGE_CATEGORIES = ['Dairy', 'Meat & Fish', 'Vegetables', 'Fruits', 'Beverages', 'Leftovers', 'Condiments', 'Other'];
const PANTRY_CATEGORIES = ['Grains & Pasta', 'Canned Goods', 'Baking', 'Spices', 'Snacks', 'Oils & Vinegars', 'Legumes', 'Other'];
const GROCERY_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Other'];
const BUCKET_CATEGORIES = ['Ingredient', 'Dish', 'Cuisine', 'Technique', 'Restaurant', 'Recipe', 'Other'];

function categoryOptions(list, selected = '') {
  return list.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

// Init on every page
document.addEventListener('DOMContentLoaded', initNav);
