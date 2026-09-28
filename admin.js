const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const statusEl = document.getElementById('admin-status');
const logoutBtn = document.getElementById('logout-btn');
const rangeSelect = document.getElementById('range-select');

const authKey = 'mondli_admin_auth';
let auth = JSON.parse(localStorage.getItem(authKey) || 'null');

function fmtTime(sec=0){
  sec = Math.max(0, Number(sec)||0);
  if(sec < 60) return sec + 's';
  const m = Math.floor(sec/60), s = sec%60;
  return m + 'm ' + s + 's';
}

function sourceName(ref=''){
  if(!ref) return 'Direct';
  try {
    const h = new URL(ref).hostname.replace('www.','');
    if(h.includes('linkedin')) return 'LinkedIn';
    if(h.includes('github')) return 'GitHub';
    if(h.includes('google')) return 'Google';
    return h;
  } catch { return 'Other'; }
}

function listInto(id, items, labelFn=x=>x.label, valueFn=x=>x.value){
  const el = document.getElementById(id);
  el.innerHTML = items.length ? items.map(x => `
    <div class="admin-list-row">
      <span>${escapeHtml(labelFn(x))}</span>
      <strong>${escapeHtml(String(valueFn(x)))}</strong>
    </div>`).join('') : '<div class="admin-empty">No data yet.</div>';
}

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function api(path, options={}){
  const headers = {...(options.headers||{})};
  if(auth?.access_token) headers.Authorization = 'Bearer ' + auth.access_token;
  const res = await fetch(path, {...options, headers});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

async function signIn(email,password){
  return api('/.netlify/functions/admin-auth', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password})
  });
}

async function loadStats(){
  statusEl.textContent = 'Loading…';
  try{
    const data = await api('/.netlify/functions/admin-stats?days=' + encodeURIComponent(rangeSelect.value));
    document.getElementById('m-visitors').textContent = data.metrics.unique_visitors ?? 0;
    document.getElementById('m-pageviews').textContent = data.metrics.pageviews ?? 0;
    document.getElementById('m-time').textContent = fmtTime(data.metrics.avg_active_seconds);
    document.getElementById('m-scroll').textContent = (data.metrics.avg_scroll_depth ?? 0) + '%';

    listInto('top-pages', data.top_pages || []);
    listInto('sources', (data.sources || []).map(x=>({label:sourceName(x.label),value:x.value})));
    listInto('devices', data.devices || []);
    listInto('clicks', data.clicks || []);

    const rows = data.sessions || [];
    document.getElementById('session-count').textContent = rows.length + ' shown';
    document.getElementById('sessions-body').innerHTML = rows.length ? rows.map(s=>`
      <tr>
        <td>${escapeHtml(new Date(s.created_at).toLocaleString())}</td>
        <td>${escapeHtml(s.page || '/')}</td>
        <td>${escapeHtml(sourceName(s.referrer))}</td>
        <td>${escapeHtml(s.device || '—')}</td>
        <td>${escapeHtml(fmtTime(s.active_seconds))}</td>
        <td>${escapeHtml(String(s.scroll_depth || 0))}%</td>
      </tr>`).join('') : '<tr><td colspan="6">No analytics yet.</td></tr>';

    statusEl.textContent = 'Live';
    statusEl.classList.add('online');
  }catch(err){
    statusEl.textContent = 'Setup required';
    statusEl.classList.remove('online');
    if(String(err.message).toLowerCase().includes('auth')) logout();
  }
}

function showDashboard(){
  loginPanel.hidden = true;
  dashboard.hidden = false;
  logoutBtn.hidden = false;
  loadStats();
}

function logout(){
  auth = null;
  localStorage.removeItem(authKey);
  dashboard.hidden = true;
  loginPanel.hidden = false;
  logoutBtn.hidden = true;
  statusEl.textContent = 'Disconnected';
  statusEl.classList.remove('online');
}

loginForm.addEventListener('submit', async e=>{
  e.preventDefault();
  loginMessage.textContent = 'Signing in…';
  try{
    auth = await signIn(
      document.getElementById('email').value,
      document.getElementById('password').value
    );
    localStorage.setItem(authKey, JSON.stringify(auth));
    loginMessage.textContent = '';
    showDashboard();
  }catch(err){
    loginMessage.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', logout);
rangeSelect.addEventListener('change', loadStats);

if(auth?.access_token) showDashboard();