const $=id=>document.getElementById(id),loginPanel=$('login-panel'),dashboard=$('dashboard'),loginForm=$('login-form'),loginMessage=$('login-message'),statusEl=$('admin-status'),logoutBtn=$('logout-btn');
const authKey='mondli_admin_auth';let auth=JSON.parse(localStorage.getItem(authKey)||'null');
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function api(path,o={}){const h={...(o.headers||{})};if(auth?.access_token)h.Authorization='Bearer '+auth.access_token;const r=await fetch(path,{...o,headers:h}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed');return d}
let cmsType='blogs',cmsItems=[],cmsCurrent=null;
const schemas={
 blogs:[['title','Title','text'],['slug','Slug','text'],['published_at','Date','date'],['summary','Summary','textarea'],['content','Article content (HTML supported)','textarea'],['category','Category','text'],['tags','Tags (comma separated)','csv'],['source_name','Source name','text'],['source_url','Source URL','url'],['published','Published','checkbox'],['featured','Featured','checkbox'],['display_order','Display order','number']],
 projects:[['title','Title','text'],['slug','Slug','text'],['description','Description','textarea'],['category','Category filters','text'],['technologies','Technologies (comma separated)','csv'],['bullets','Key points (one per line)','lines'],['github_url','GitHub URL','url'],['case_study','Case study','textarea'],['status','Status','text'],['published','Published','checkbox'],['featured','Featured','checkbox'],['display_order','Display order','number']],
 certifications:[['name','Name','text'],['provider','Provider','text'],['description','Description','textarea'],['status','Status','text'],['credential_url','Credential URL','url'],['published','Published','checkbox'],['display_order','Display order','number']],
 highlights:[['label','Highlight text','text'],['published','Published','checkbox'],['display_order','Display order','number']],
 settings:[['setting_key','Setting key','text'],['setting_value','Value','textarea']]
};
const labels={blogs:'Blog Posts',projects:'Projects',certifications:'Certifications',highlights:'Highlights',settings:'Site Settings'};
const displayName=(x)=>x.title||x.name||x.label||x.setting_key||'Untitled';
function fieldHtml([key,label,type],v){
 const val=v?.[key]??'';
 if(type==='checkbox')return '<label class="cms-check"><input name="'+key+'" type="checkbox" '+(val?'checked':'')+'> '+esc(label)+'</label>';
 if(type==='textarea'||type==='lines')return '<label>'+esc(label)+'<textarea name="'+key+'" rows="'+(key==='content'?10:5)+'">'+esc(type==='lines'&&Array.isArray(val)?val.join('\n'):val)+'</textarea></label>';
 if(type==='csv')return '<label>'+esc(label)+'<input name="'+key+'" value="'+esc(Array.isArray(val)?val.join(', '):val)+'"></label>';
 if(type==='date'){const dateVal=val?String(val).slice(0,10):(cmsType==='blogs'&&key==='published_at'?new Date().toISOString().slice(0,10):'');return '<label>'+esc(label)+'<input name="'+key+'" type="date" value="'+esc(dateVal)+'"></label>';}
 return '<label>'+esc(label)+'<input name="'+key+'" type="'+type+'" value="'+esc(val)+'"></label>';
}
function renderForm(item=null){cmsCurrent=item;$('cms-editor-title').textContent=item?'Edit '+labels[cmsType]:'New '+labels[cmsType];$('cms-state').textContent=item?(item.published===false?'Draft':'Saved'):'Unsaved';$('cms-fields').innerHTML=schemas[cmsType].map(f=>fieldHtml(f,item)).join('');$('cms-delete').hidden=!item}
function renderCmsList(){const el=$('cms-list');el.innerHTML=cmsItems.length?cmsItems.map(x=>'<button class="cms-item '+(cmsCurrent?.id===x.id?'active':'')+'" data-id="'+x.id+'"><span>'+esc(displayName(x))+'</span><small>'+(x.published===false?'Draft':'Published')+'</small></button>').join(''):'<div class="admin-empty">No items yet.</div>';el.querySelectorAll('.cms-item').forEach(b=>b.onclick=()=>{renderForm(cmsItems.find(x=>String(x.id)===b.dataset.id));renderCmsList()})}
async function loadCms(type=cmsType){cmsType=type;$('cms-list-title').textContent=labels[type];$('cms-message').textContent='';try{const d=await api('/.netlify/functions/admin-cms?type='+encodeURIComponent(type));cmsItems=d.items||[];cmsCurrent=null;renderCmsList();renderForm(null)}catch(e){$('cms-list').innerHTML='<div class="admin-empty">'+esc(e.message)+'</div>'}}
function formData(){const out={};for(const [key,,type] of schemas[cmsType]){const el=$('cms-form').elements[key];if(type==='checkbox')out[key]=el.checked;else if(type==='csv')out[key]=el.value.split(',').map(x=>x.trim()).filter(Boolean);else if(type==='lines')out[key]=el.value.split('\n').map(x=>x.trim()).filter(Boolean);else if(type==='number')out[key]=Number(el.value||0);else out[key]=el.value.trim()}return out}
$('cms-form').addEventListener('submit',async e=>{e.preventDefault();$('cms-message').textContent='Saving…';try{const body=formData(),path='/.netlify/functions/admin-cms?type='+encodeURIComponent(cmsType)+(cmsCurrent?'&id='+cmsCurrent.id:'');await api(path,{method:cmsCurrent?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});$('cms-message').textContent='Saved.';await loadCms(cmsType)}catch(e){$('cms-message').textContent=e.message}});
$('cms-delete').addEventListener('click',async()=>{if(!cmsCurrent||!confirm('Delete this item?'))return;try{await api('/.netlify/functions/admin-cms?type='+encodeURIComponent(cmsType)+'&id='+cmsCurrent.id,{method:'DELETE'});await loadCms(cmsType)}catch(e){$('cms-message').textContent=e.message}});
$('cms-new').addEventListener('click',()=>{cmsCurrent=null;renderForm(null);renderCmsList()});
document.querySelectorAll('.cms-tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.cms-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');loadCms(b.dataset.type)}));

function show(){loginPanel.hidden=true;dashboard.hidden=false;logoutBtn.hidden=false;statusEl.textContent='Connected';statusEl.classList.add('online');loadCms(cmsType)}
function logout(){auth=null;localStorage.removeItem(authKey);dashboard.hidden=true;loginPanel.hidden=false;logoutBtn.hidden=true;statusEl.textContent='Disconnected';statusEl.classList.remove('online')}
loginForm.addEventListener('submit',async e=>{e.preventDefault();loginMessage.textContent='Signing in…';try{auth=await api('/.netlify/functions/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value,password:$('password').value})});localStorage.setItem(authKey,JSON.stringify(auth));loginMessage.textContent='';show()}catch(e){loginMessage.textContent=e.message}});
logoutBtn.addEventListener('click',logout);if(auth?.access_token)show();