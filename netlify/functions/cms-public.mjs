const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"public, max-age=60"}});
async function sb(url,key,path){
  const r=await fetch(url+"/rest/v1/"+path,{headers:{apikey:key,Authorization:"Bearer "+key}});
  if(!r.ok) throw new Error("CMS read failed");
  return r.json();
}
export default async(req)=>{
  if(req.method!=="GET") return json({error:"Method not allowed"},405);
  const url=Netlify.env.get("SUPABASE_URL"),key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key) return json({error:"CMS not configured"},503);
  try{
    const u=new URL(req.url),type=u.searchParams.get("type")||"all",slug=u.searchParams.get("slug")||"";
    if(type==="blog"&&slug){
      const rows=await sb(url,key,"cms_blog_posts?select=*&published=eq.true&slug=eq."+encodeURIComponent(slug)+"&limit=1");
      return json({item:rows[0]||null});
    }
    const out={};
    if(type==="all"||type==="blogs") out.blogs=await sb(url,key,"cms_blog_posts?select=*&published=eq.true&order=display_order.asc,published_at.desc");
    if(type==="all"||type==="projects") out.projects=await sb(url,key,"cms_projects?select=*&published=eq.true&order=display_order.asc");
    if(type==="all"||type==="certifications") out.certifications=await sb(url,key,"cms_certifications?select=*&published=eq.true&order=display_order.asc");
    if(type==="all"||type==="highlights") out.highlights=await sb(url,key,"cms_highlights?select=*&published=eq.true&order=display_order.asc");
    if(type==="all"||type==="settings") {
      const rows=await sb(url,key,"cms_site_settings?select=setting_key,setting_value");
      out.settings=Object.fromEntries(rows.map(x=>[x.setting_key,x.setting_value]));
    }
    return json(out);
  }catch(e){return json({error:e.message||"CMS read failed"},500)}
};