import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {SUPABASE_URL,SUPABASE_PUBLIC_KEY} from "./config.js";
const $=id=>document.getElementById(id),ready=SUPABASE_URL.startsWith("https://")&&!SUPABASE_PUBLIC_KEY.startsWith("YOUR_");
const db=ready?createClient(SUPABASE_URL,SUPABASE_PUBLIC_KEY):null;
let user=null,isAdmin=false,rooms=[],approved=[],mine=[],all=[],month=new Date();
const escapeHTML=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const alertUser=t=>{$("notice").textContent=t;$("notice").hidden=false};
const fmtTime=t=>String(t||"").slice(0,5);
function card(e,allowReview=false){return `<div class="entry"><div><h3>${escapeHTML(e.title)} <span class="status">${escapeHTML(e.status)}</span></h3><p>${escapeHTML(e.event_date)} · ${fmtTime(e.start_time)}–${fmtTime(e.end_time)} · ${escapeHTML(e.rooms?.name||"Room")}</p><p>${escapeHTML(e.description||"")} · ${Number(e.attendees)} attendees</p></div>${allowReview&&e.status==="pending"?`<div class="buttons"><button class="review-btn" data-id="${escapeHTML(e.id)}" data-status="approved">Approve</button><button class="review-btn reject" data-id="${escapeHTML(e.id)}" data-status="rejected">Reject</button></div>`:""}</div>`}
function render(){
 $("authBtn").textContent=user?"Sign out":"Sign in";$("eventForm").hidden=!user;$("signInHint").hidden=!!user;
 $("roomSelect").innerHTML='<option value="">Choose a room</option>'+rooms.map(r=>`<option value="${escapeHTML(r.id)}">${escapeHTML(r.name)} (${r.capacity} seats)</option>`).join("");
 $("events").innerHTML=approved.filter(e=>e.event_date>=dateKey(new Date())).map(e=>card(e)).join("")||"<p>No upcoming approved events yet.</p>";
 $("myRequests").innerHTML=user?"<h3>My Requests</h3>"+(mine.map(e=>card(e)).join("")||"<p>You have not submitted any requests.</p>"):"";
 $("adminHint").textContent=isAdmin?"Review pending room requests below.":"Only administrators can review event requests.";
 $("adminRequests").innerHTML=isAdmin?(all.map(e=>card(e,true)).join("")||"<p>No requests yet.</p>"):"";
 $("monthLabel").textContent=month.toLocaleDateString(undefined,{month:"long",year:"numeric"});
 let first=new Date(month.getFullYear(),month.getMonth(),1);first.setDate(first.getDate()-first.getDay());
 $("grid").innerHTML=Array.from({length:42},(_,i)=>{let d=new Date(first);d.setDate(first.getDate()+i);const key=dateKey(d),ev=approved.filter(e=>e.event_date===key);return `<div class="day ${d.getMonth()!==month.getMonth()?"out":""} ${key===dateKey(new Date())?"today":""}"><b>${d.getDate()}</b>${ev.slice(0,2).map(e=>`<span class="event-label" title="${escapeHTML(e.title)}">${escapeHTML(e.title)}</span>`).join("")}${ev.length>2?'<span class="event-label">More events…</span>':""}</div>`}).join("");
}
async function refresh(){
 if(!db)return;
 const [r,e]=await Promise.all([db.from("rooms").select("*").eq("active",true),db.from("events").select("*,rooms(name)").eq("status","approved").order("event_date")]);
 if(r.error||e.error){alertUser((r.error||e.error).message);return}rooms=r.data||[];approved=e.data||[];
 if(user){
  const [m,p]=await Promise.all([db.from("events").select("*,rooms(name)").eq("organizer_id",user.id).order("created_at",{ascending:false}),db.from("profiles").select("role").eq("id",user.id).single()]);
  mine=m.data||[];isAdmin=p.data?.role==="admin";
  if(isAdmin){const a=await db.from("events").select("*,rooms(name)").order("created_at",{ascending:false});all=a.data||[]}else all=[];
 }else{mine=[];all=[];isAdmin=false}render();
}
$("authBtn").onclick=async()=>{if(user)await db.auth.signOut();else $("authDialog").showModal()};
$("closeDialog").onclick=()=>$("authDialog").close();
async function auth(register){
 if(!db){alertUser("Supabase must be configured first.");return}
 const email=$("email").value.trim(),password=$("password").value;if(!email||!password){$("authError").textContent="Enter an email and password.";return}
 const {error}=register?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
 $("authError").textContent=error?error.message:register?"Account created. Confirm your email if required, then sign in.":"";
 if(!error&&!register)$("authDialog").close();
}
$("loginBtn").onclick=()=>auth(false);$("registerBtn").onclick=()=>auth(true);
$("prev").onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);render()};
$("next").onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);render()};
$("eventForm").addEventListener("submit",async ev=>{
 ev.preventDefault();if(!user||!db)return;
 const v=Object.fromEntries(new FormData(ev.target)),room=rooms.find(r=>r.id===v.room_id);
 if(!room)return alertUser("Choose a room.");
 if(v.start_time>=v.end_time)return alertUser("End time must be after start time.");
 if(v.event_date<dateKey(new Date()))return alertUser("Choose a current or future date.");
 if(+v.attendees>room.capacity)return alertUser("Expected attendance exceeds room capacity.");
 const {error}=await db.from("events").insert({title:v.title,room_id:v.room_id,event_date:v.event_date,start_time:v.start_time,end_time:v.end_time,attendees:+v.attendees,description:v.description||"",organizer_id:user.id});
 if(error)alertUser("Request failed: "+error.message);else{ev.target.reset();alertUser("Request saved. Waiting for administrator approval.");await refresh()}
});
$("adminRequests").onclick=async ev=>{
 const b=ev.target.closest("button[data-id]");if(!b||!isAdmin)return;b.disabled=true;
 const {error}=await db.rpc("review_event",{event_id:b.dataset.id,new_status:b.dataset.status});
 alertUser(error?"Approval failed: "+error.message:"Reservation updated.");await refresh();
};
$("eventForm").elements.event_date.min=dateKey(new Date());
if(!ready){alertUser("To enable live accounts and saving, connect Supabase in config.js. Instructions are in README.md.");render()}
else{db.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;setTimeout(refresh,0)});db.auth.getUser().then(({data})=>{user=data.user;refresh()})}