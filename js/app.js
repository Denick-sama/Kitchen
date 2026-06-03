// ============================================================
//  Kitchen App — Shared Utilities (app.js)
// ============================================================

// ── Auth / Session ────────────────────────────────────────────
const SESSION_KEY = 'kitchen_session';

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function requireAuth() {
  const session = getSession();
  if (!session || !session.email) {
    window.location.href = 'auth.html?mode=login';
    return null;
  }
  return session;
}

function signOut() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'landing.html';
}

// ── Per-user storage keys ─────────────────────────────────────
function userDataKey(email) {
  return 'kitchen_data_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getUserData(email) {
  try {
    const raw = localStorage.getItem(userDataKey(email));
    return raw ? JSON.parse(raw) : { fridge: [], pantry: [], grocery: [], bucket: [] };
  } catch { return { fridge: [], pantry: [], grocery: [], bucket: [] }; }
}

function saveUserData(email, data) {
  localStorage.setItem(userDataKey(email), JSON.stringify(data));
}

// ── Storage helpers (per-user) ────────────────────────────────
const STORAGE_KEYS = {
  fridge:  'fridge',
  pantry:  'pantry',
  grocery: 'grocery',
  bucket:  'bucket',
};

let _session = null;

const Storage = {
  _getSession() {
    if (!_session) _session = getSession();
    return _session;
  },
  get(section) {
    const s = this._getSession();
    if (!s) return [];
    const data = getUserData(s.email);
    return data[section] || [];
  },
  set(section, list) {
    const s = this._getSession();
    if (!s) return;
    const data = getUserData(s.email);
    data[section] = list;
    saveUserData(s.email, data);
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

// ── Nav: active state, hamburger, user display & sign out ─────
function initNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('active');
  });

  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target))
        navLinks.classList.remove('open');
    });
  }

  // Inject user info + sign out into nav
  const session = getSession();
  const navEl = document.querySelector('nav');
  if (navEl && session) {
    const existing = navEl.querySelector('.nav-user');
    if (!existing) {
      const userDiv = document.createElement('div');
      userDiv.className = 'nav-user';
      userDiv.innerHTML = `
        <span class="nav-username">👤 ${session.name || session.email}</span>
        <button class="btn-signout" onclick="signOut()">Sign Out</button>
      `;
      navEl.appendChild(userDiv);
    }
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
  const labels = { fridge:'Fridge', pantry:'Pantry', grocery:'Grocery List', bucket:'Bucket List' };
  showToast(`Moved to ${labels[toKey]}`, 'success');
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

// ── Confirm dialog ────────────────────────────────────────────
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

// ── Category options ──────────────────────────────────────────
const FRIDGE_CATEGORIES  = ['Dairy','Meat & Fish','Vegetables','Fruits','Beverages','Leftovers','Condiments','Other'];
const PANTRY_CATEGORIES  = ['Grains & Pasta','Canned Goods','Baking','Spices','Snacks','Oils & Vinegars','Legumes','Other'];
const GROCERY_CATEGORIES = ['Produce','Dairy','Meat','Bakery','Frozen','Pantry','Beverages','Household','Other'];
const BUCKET_CATEGORIES  = ['Ingredient','Dish','Cuisine','Technique','Restaurant','Recipe','Other'];

function categoryOptions(list, selected = '') {
  return list.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

// ── Init on every app page ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pages that don't need auth
  const publicPages = ['landing.html', 'auth.html'];
  const current = location.pathname.split('/').pop() || 'index.html';
  if (!publicPages.includes(current)) {
    _session = requireAuth();
    if (!_session) return; // redirect already happening
  }
  initNav();
});
