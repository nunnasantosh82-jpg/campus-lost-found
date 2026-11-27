const API = '/api';
const token = () => localStorage.getItem('campusToken');
const headers = (extra = {}) => ({ ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...extra });
async function api(url, options = {}) {
  const response = await fetch(`${API}${url}`, { ...options, headers: headers(options.headers || {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}
function message(el, text, error = false) { if (el) { el.textContent = text; el.className = `form-message ${error ? 'error' : 'success'}`; } }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function requireLogin() { if (!token()) { location.href = '/login.html'; return false; } return true; }
function itemCard(item) {
  return `<article class="item-card">${item.image ? `<img class="item-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">` : `<div class="item-placeholder">${item.type === 'lost' ? '⌕' : '✓'}</div>`}<div class="item-body"><div class="card-meta"><span class="pill ${item.type}">${item.type}</span><span class="pill status">${escapeHTML(item.status)}</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p><div class="item-details"><span>⌖ ${escapeHTML(item.location)}</span><span>${escapeHTML(item.category)}</span><span>${new Date(item.date).toLocaleDateString()}</span></div><div class="card-footer"><small>Reported by ${escapeHTML(item.owner?.name || 'Campus user')}</small>${token() && item.status === 'open' ? `<button class="small-btn" data-claim="${item._id}">Submit claim</button>` : ''}</div></div></article>`;
}
async function loadItems() {
  const grid = document.querySelector('#items-grid'); if (!grid) return;
  const params = new URLSearchParams();
  for (const key of ['search','category','location','type','sort']) { const el = document.getElementById(key); if (el?.value) params.set(key, el.value); }
  try { const { items } = await api(`/items?${params}`); grid.innerHTML = items.length ? items.map(itemCard).join('') : '<p class="empty">No matching reports found. Try changing your filters.</p>'; }
  catch (e) { grid.innerHTML = `<p class="error">${escapeHTML(e.message)}</p>`; }
}
function bindHome() {
  if (!document.querySelector('#items-grid')) return;
  ['search','category','location','type','sort'].forEach(id => document.getElementById(id).addEventListener(id === 'search' || id === 'location' ? 'input' : 'change', loadItems));
  document.getElementById('clear-filters').addEventListener('click', () => { ['search','category','location','type'].forEach(id => document.getElementById(id).value = ''); document.getElementById('sort').value = 'newest'; loadItems(); });
  document.querySelector('#items-grid').addEventListener('click', async e => {
    const btn = e.target.closest('[data-claim]'); if (!btn) return;
    if (!requireLogin()) return;
    const detail = prompt('Tell the owner why this item belongs to you (at least 10 characters):');
    if (!detail) return;
    try { await api('/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: btn.dataset.claim, message: detail }) }); alert('Claim submitted for review.'); }
    catch (err) { alert(err.message); }
  });
  loadItems();
}
function bindAuth() {
  const login = document.querySelector('#login-form');
  const register = document.querySelector('#register-form');
  [login, register].filter(Boolean).forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault(); const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await api(`/auth/${login ? 'login' : 'register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      localStorage.setItem('campusToken', result.token); localStorage.setItem('campusUser', JSON.stringify(result.user)); location.href = '/dashboard.html';
    } catch (err) { message(document.querySelector('#form-message'), err.message, true); }
  }));
}
function bindReport() {
  const form = document.querySelector('#report-form'); if (!form) return;
  if (!requireLogin()) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const result = await api('/items', { method: 'POST', body: new FormData(form) });
      message(document.querySelector('#form-message'), result.message);
      form.reset();
    } catch (err) { message(document.querySelector('#form-message'), err.message, true); }
  });
}
function smallItem(item, admin = false) {
  return `<article class="list-card"><div><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.type)} · ${escapeHTML(item.location)} · <span class="pill status">${escapeHTML(item.status)}</span></p></div>${admin ? `<select data-item-status="${item._id}"><option ${item.status==='open'?'selected':''}>open</option><option ${item.status==='claimed'?'selected':''}>claimed</option><option ${item.status==='returned'?'selected':''}>returned</option><option ${item.status==='closed'?'selected':''}>closed</option></select>` : `<small>${new Date(item.date).toLocaleDateString()}</small>`}</article>`;
}
function claimCard(claim, canReview = false) {
  return `<article class="list-card"><div><b>${escapeHTML(claim.item?.title || 'Item')}</b><p>${escapeHTML(claim.message)}<br><small>By ${escapeHTML(claim.claimant?.name || 'You')} · ${escapeHTML(claim.status)}</small></p></div>${canReview && claim.status === 'pending' ? `<div class="actions"><button class="small-btn" data-review="${claim._id}" data-status="approved">Approve</button><button class="small-btn danger" data-review="${claim._id}" data-status="rejected">Reject</button></div>` : ''}</article>`;
}
async function bindDashboard() {
  if (!document.querySelector('.dashboard')) return;
  if (!requireLogin()) return;
  try {
    const [me, items, claims, received] = await Promise.all([api('/auth/me'), api('/items/mine'), api('/claims/mine'), api('/claims/received')]);
    document.querySelector('#welcome').textContent = `Welcome, ${me.user.name}.`;
    if (me.user.role === 'admin') document.querySelector('#admin-nav')?.classList.remove('hidden');
    document.querySelector('#my-items').innerHTML = items.items.length ? items.items.map(x => smallItem(x)).join('') : '<p class="empty">No reports yet.</p>';
    document.querySelector('#my-claims').innerHTML = claims.claims.length ? claims.claims.map(x => claimCard(x)).join('') : '<p class="empty">No claims submitted yet.</p>';
    document.querySelector('#received-claims').innerHTML = received.claims.length ? received.claims.map(x => claimCard(x, true)).join('') : '<p class="empty">No claims on your reports.</p>';
    document.querySelector('#received-claims').addEventListener('click', reviewHandler);
  } catch (e) { alert(e.message); localStorage.removeItem('campusToken'); location.href = '/login.html'; }
}
async function reviewHandler(e) {
  const btn = e.target.closest('[data-review]'); if (!btn) return;
  try { await api(`/claims/${btn.dataset.review}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: btn.dataset.status }) }); location.reload(); }
  catch (err) { alert(err.message); }
}
async function bindAdmin() {
  if (!document.querySelector('#admin-stats')) return;
  if (!requireLogin()) return;
  try {
    const [stats, items, claims] = await Promise.all([api('/admin/stats'), api('/admin/items'), api('/claims/all')]);
    document.querySelector('#admin-stats').innerHTML = Object.entries(stats.stats).map(([k,v]) => `<div class="stat-card"><strong>${v}</strong><span>${escapeHTML(k.replace(/[A-Z]/g, x => ' '+x.toLowerCase()))}</span></div>`).join('');
    document.querySelector('#admin-items').innerHTML = items.items.map(x => smallItem(x, true)).join('') || '<p class="empty">No reports.</p>';
    document.querySelector('#admin-claims').innerHTML = claims.claims.map(x => claimCard(x)).join('') || '<p class="empty">No claims.</p>';
    document.querySelector('#admin-items').addEventListener('change', async e => {
      const select = e.target.closest('[data-item-status]'); if (!select) return;
      try { await api(`/admin/items/${select.dataset.itemStatus}/status`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:select.value}) }); }
      catch(err) { alert(err.message); }
    });
  } catch (e) { alert(e.message); location.href = '/dashboard.html'; }
}
function bindLogout() {
  document.querySelectorAll('#logout-btn').forEach(btn => btn.addEventListener('click', () => { localStorage.removeItem('campusToken'); localStorage.removeItem('campusUser'); location.href = '/'; }));
  if (token()) { document.querySelector('#nav-login')?.classList.add('hidden'); document.querySelectorAll('.auth-link').forEach(x => x.classList.remove('hidden')); }
}
document.addEventListener('DOMContentLoaded', () => { bindHome(); bindAuth(); bindReport(); bindDashboard(); bindAdmin(); bindLogout(); });