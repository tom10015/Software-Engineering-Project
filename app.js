const ROOMS=[{name:"Student Center A",capacity:50},{name:"Library Meeting Room",capacity:20},{name:"Auditorium",capacity:150},{name:"Science Hall 201",capacity:35}];
const KEY="campus-event-demo-v1";
const initial=[
{id:"sample-1",organizer:"Student Activities",title:"Welcome Week Social",room:"Student Center A",date:"2026-11-05",start:"15:00",end:"17:00",attendees:40,description:"Meet students and learn about campus clubs.",status:"approved"},
{id:"sample-2",organizer:"Computer Science Club",title:"Coding Club Meetup",room:"Science Hall 201",date:"2026-11-09",start:"16:00",end:"17:30",attendees:22,description:"Practice coding and share project ideas.",status:"approved"},
{id:"sample-3",organizer:"Campus Events Team",title:"Movie Night",room:"Auditorium",date:"2026-11-12",start:"19:00",end:"21:00",attendees:90,description:"Join us for a campus movie night.",status:"approved"}
];
let entries;
try {const saved=JSON.parse(localStorage.getItem(KEY));entries=Array.isArray(saved)?saved:structuredClone(initial)}catch{entries=structuredClone(initial)}
const $=id=>document.getElementById(id);
const save=()=>localStorage.setItem(KEY,JSON.stringify(entries));
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateText=s=>new Date(s+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
const timeText=s=>{let [h,m]=s.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`};
const overlaps=(a,b)=>a.room===b.room&&a.date===b.date&&a.start<b.end&&b.start<a.end;
function render(){
 const approved=entries.filter(e=>e.status==="approved").sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
 const pending=entries.filter(e=>e.status==="pending");
 $("eventCount").textContent=approved.length;$("pendingCount").textContent=pending.length;$("roomCount").textContent=ROOMS.length;
 const q=$("search").value.toLowerCase();
 const shown=approved.filter(e=>(e.title+" "+e.room+" "+e.description).toLowerCase().includes(q));
 $("eventList").innerHTML=shown.length?shown.map(e=>`<article class="card"><span class="date-badge">${escapeHTML(dateText(e.date))}</span><h3>${escapeHTML(e.title)}</h3><p>${escapeHTML(e.description||"Campus event")}</p><div class="meta">📍 ${escapeHTML(e.room)}</div><div class="meta">🕒 ${timeText(e.start)} – ${timeText(e.end)}</div><div class="meta">👤 ${escapeHTML(e.organizer)}</div></article>`).join(""):'<p class="empty">No approved events match your search.</p>';
 $("requestList").innerHTML=entries.filter(e=>e.status!=="approved").length?entries.filter(e=>e.status!=="approved").slice().reverse().map(e=>`<article class="request-card"><div><h3>${escapeHTML(e.title)} <span class="status ${e.status}">${e.status}</span></h3><p>${escapeHTML(e.organizer)} · ${escapeHTML(e.room)} · ${escapeHTML(dateText(e.date))}</p><p>${timeText(e.start)} – ${timeText(e.end)} · ${e.attendees} attendees</p></div><div class="request-actions">${e.status==="pending"?`<button class="approve" data-action="approve" data-id="${escapeHTML(e.id)}">Approve</button><button class="reject" data-action="reject" data-id="${escapeHTML(e.id)}">Reject</button>`:""}</div></article>`).join(""):'<p class="empty">No pending or rejected requests yet.</p>';
}
$("roomSelect").innerHTML='<option value="">Select a room</option>'+ROOMS.map(r=>`<option value="${escapeHTML(r.name)}">${escapeHTML(r.name)} (capacity ${r.capacity})</option>`).join("");
$("date").min=new Date().toLocaleDateString("en-CA");
$("requestForm").addEventListener("submit",ev=>{
 ev.preventDefault();const values=Object.fromEntries(new FormData(ev.target));const room=ROOMS.find(r=>r.name===values.room);const msg=$("formMessage");
 if(values.start>=values.end){msg.textContent="End time must be after start time.";return}
 if(Number(values.attendees)>room.capacity){msg.textContent=`That room holds only ${room.capacity} people.`;return}
 if(values.date<new Date().toLocaleDateString("en-CA")){msg.textContent="Choose a future date.";return}
 const entry={...values,id:"req-"+Date.now(),attendees:Number(values.attendees),status:"pending"};
 entries.push(entry);save();render();ev.target.reset();msg.textContent="Request submitted! An administrator can review it below.";
});
$("requestList").addEventListener("click",ev=>{
 const btn=ev.target.closest("button[data-action]");if(!btn)return;
 const entry=entries.find(e=>e.id===btn.dataset.id);if(!entry||entry.status!=="pending")return;
 if(btn.dataset.action==="approve"){
  const conflict=entries.find(e=>e.status==="approved"&&overlaps(entry,e));
  if(conflict){alert(`Cannot approve: "${conflict.title}" already reserves ${entry.room} at that time.`);return}
  entry.status="approved";
 }else entry.status="rejected";
 save();render();
});
$("search").addEventListener("input",render);
$("resetDemo").addEventListener("click",()=>{if(confirm("Reset all demo events and requests?")){entries=structuredClone(initial);save();render();$("formMessage").textContent=""}});
render();