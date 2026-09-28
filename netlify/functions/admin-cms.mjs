const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
async function verify(url,anon,token){
  const r=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
  return r.ok?r.json():null;
}
const tables={blogs:"cms_blog_posts",projects:"cms_projects",certifications:"cms_certifications",highlights:"cms_highlights",settings:"cms_site_settings"};
const allowed={
  blogs:["title","slug","summary","content","category","tags","source_name","source_url","published","featured","display_order","published_at"],
  projects:["title","slug","description","category","technologies","bullets","github_url","case_study","status","featured","published","display_order"],
  certifications:["name","provider","description","status","credential_url","completed_at","published","display_order"],
  highlights:["label","published","display_order"],
  settings:["setting_key","setting_value"]
};
const clean=(type,obj)=>Object.fromEntries(Object.entries(obj||{}).filter(([k])=>allowed[type]?.includes(k)));
export default async(req)=>{
  const url=Netlify.env.get("SUPABASE_URL"),anon=Netlify.env.get("SUPABASE_ANON_KEY"),service=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY"),admin=Netlify.env.get("ADMIN_EMAIL");
  if(!url||!anon||!service) return json({error:"CMS not configured"},503);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),user=token&&await verify(url,anon,token);
  if(!user) return json({error:"Authentication required"},401);
  if(admin&&String(user.email||"").toLowerCase()!==admin.toLowerCase()) return json({error:"Not authorized"},403);
  const u=new URL(req.url),type=u.searchParams.get("type")||"",table=tables[type];
  if(!table) return json({error:"Invalid content type"},400);
  const headers={apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"};
  try{
    if(req.method==="GET"){
      const r=await fetch(url+"/rest/v1/"+table+"?select=*&order=display_order.asc,created_at.desc",{headers});
      if(!r.ok) throw new Error("CMS list failed");
      return json({items:await r.json()});
    }
    const body=await req.json().catch(()=>({}));
    if(req.method==="POST"){
      const row={...clean(type,body),updated_at:new Date().toISOString()};
      const r=await fetch(url+"/rest/v1/"+table,{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(row)});
      const d=await r.json().catch(()=>[]);
      if(!r.ok) return json({error:d.message||"Create failed"},400);
      return json({item:d[0]||null},201);
    }
    const id=u.searchParams.get("id");
    if(!id) return json({error:"Missing id"},400);
    if(req.method==="PATCH"){
      const row={...clean(type,body),updated_at:new Date().toISOString()};
      const r=await fetch(url+"/rest/v1/"+table+"?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(row)});
      const d=await r.json().catch(()=>[]);
      if(!r.ok) return json({error:d.message||"Update failed"},400);
      return json({item:d[0]||null});
    }
    if(req.method==="DELETE"){
      const r=await fetch(url+"/rest/v1/"+table+"?id=eq."+encodeURIComponent(id),{method:"DELETE",headers});
      if(!r.ok) return json({error:"Delete failed"},400);
      return json({ok:true});
    }
    return json({error:"Method not allowed"},405);
  }catch(e){return json({error:e.message||"CMS request failed"},500)}
};