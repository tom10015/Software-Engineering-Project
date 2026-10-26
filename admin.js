import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {SUPABASE_URL,SUPABASE_PUBLIC_KEY} from "./config.js";
const $=id=>document.getElementById(id),ready=SUPABASE_URL.startsWith("https://")&&!SUPABASE_PUBLIC_KEY.startsWith("YOUR_");
const db=ready?createClient(SUPABASE_URL,SUPABASE_PUBLIC_KEY):null;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function notice(t){$("adminNotice").textContent=t;$("adminNotice").hidden=false}
function view(mode){$("adminLogin").hidden=mode!=="login";$("adminDenied").hidden=mode!=="denied";$("adminDashboard").hidden=mode!=="dashboard"}
async function refresh(){
 if(!db){view("login");notice("Supabase setup is required before admin sign-in works.");return}
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){view("login");return}
 const role=await db.from("profiles").select("role").eq("id",user.id).single();
 if(role.error||role.data?.role!=="admin"){view("denied");return}
 view("dashboard");
 const result=await db.from("events").select("*,rooms(name)").order("created_at",{ascending:false});
 if(result.error){notice(result.error.message);return}
 $("adminRequests").innerHTML=result.data.length?result.data.map(e=>`<article class="entry"><div><h3>${esc(e.title)} <span class="status">${esc(e.status)}</span></h3><p>${esc(e.event_date)} · ${esc(e.start_time).slice(0,5)}–${esc(e.end_time).slice(0,5)} · ${esc(e.rooms?.name||"Room")}</p><p>${esc(e.description||"")} · ${Number(e.attendees)} attendees</p></div>${e.status==="pending"?`<div class="buttons"><button data-id="${esc(e.id)}" data-status="approved">Approve</button><button class="reject" data-id="${esc(e.id)}" data-status="rejected">Reject</button></div>`:""}</article>`).join(""):"<p>No event requests yet.</p>";
}
$("adminLoginForm").onsubmit=async e=>{
 e.preventDefault();if(!db)return notice("Database not configured.");
 const {error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
 if(error){notice("Sign in failed: "+error.message);return}
 await refresh();
};
async function signOut(){if(db)await db.auth.signOut();$("adminPassword").value="";view("login")}
$("adminSignOut").onclick=signOut;$("deniedSignOut").onclick=signOut;
$("adminRequests").onclick=async e=>{
 const b=e.target.closest("button[data-id]");if(!b)return;b.disabled=true;
 const {error}=await db.rpc("review_event",{event_id:b.dataset.id,new_status:b.dataset.status});
 notice(error?error.message:"Request updated.");await refresh();
};
refresh();