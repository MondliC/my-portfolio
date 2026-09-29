const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
async function verify(url,anon,token){
  const r=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
  return r.ok?r.json():null;
}
const safeName=name=>String(name||"image").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(-120)||"image";
export default async(req)=>{
  const url=Netlify.env.get("SUPABASE_URL"),anon=Netlify.env.get("SUPABASE_ANON_KEY"),service=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY"),admin=Netlify.env.get("ADMIN_EMAIL");
  if(!url||!anon||!service)return json({error:"Media storage not configured"},503);
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""),user=token&&await verify(url,anon,token);
  if(!user)return json({error:"Authentication required"},401);
  if(admin&&String(user.email||"").toLowerCase()!==admin.toLowerCase())return json({error:"Not authorized"},403);
  const headers={apikey:service,Authorization:"Bearer "+service};
  try{
    if(req.method==="GET"){
      const r=await fetch(url+"/storage/v1/object/list/portfolio-media",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({prefix:"",limit:100,offset:0,sortBy:{column:"created_at",order:"desc"}})});
      const items=await r.json().catch(()=>[]);
      if(!r.ok)return json({error:items.message||"Could not load media"},500);
      return json({items:(items||[]).map(x=>({name:x.name,created_at:x.created_at,updated_at:x.updated_at,metadata:x.metadata||{},url:url+"/storage/v1/object/public/portfolio-media/"+encodeURIComponent(x.name)}))});
    }
    if(req.method==="POST"){
      const form=await req.formData(),file=form.get("file");
      if(!(file instanceof File))return json({error:"Choose an image to upload"},400);
      const allowed=["image/png","image/jpeg","image/webp","image/gif"];
      if(!allowed.includes(file.type))return json({error:"Only PNG, JPG, WEBP, and GIF images are allowed"},400);
      if(file.size>10485760)return json({error:"Image must be 10 MB or smaller"},400);
      const name=Date.now()+"-"+safeName(file.name);
      const r=await fetch(url+"/storage/v1/object/portfolio-media/"+encodeURIComponent(name),{method:"POST",headers:{...headers,"Content-Type":file.type,"x-upsert":"false"},body:await file.arrayBuffer()});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)return json({error:d.message||d.error||"Upload failed"},400);
      return json({item:{name,url:url+"/storage/v1/object/public/portfolio-media/"+encodeURIComponent(name)}},201);
    }
    if(req.method==="DELETE"){
      const {name}=await req.json().catch(()=>({}));
      if(!name)return json({error:"Missing file name"},400);
      const r=await fetch(url+"/storage/v1/object/portfolio-media",{method:"DELETE",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[String(name)]})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)return json({error:d.message||"Delete failed"},400);
      return json({ok:true});
    }
    return json({error:"Method not allowed"},405);
  }catch(e){return json({error:e.message||"Media request failed"},500)}
};