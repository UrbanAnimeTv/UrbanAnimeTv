import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg=window.URBANANIMETV_CONFIG||{};
const ready=Boolean(cfg.SUPABASE_URL&&cfg.SUPABASE_PUBLISHABLE_KEY&&!cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_"));
const supabase=ready?createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY):null;
let user=null,signup=false,activeTitle="HoodGods";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function showSection(id){
  $$("#continue,#series,#movies,#my-list,#watch-history,#account").forEach(x=>x.classList.add("hidden"));
  const el=$("#"+id); if(el){el.classList.remove("hidden");el.scrollIntoView({behavior:"smooth"});}
}
function info(title,text){
  activeTitle=title;$("#modalTitle").textContent=title;$("#modalText").textContent=text||`${title} is available on UrbanAnimeTv.`;$("#modal").classList.remove("hidden");
}
function play(title="HoodGods"){
  activeTitle=title;$("#playerTitle").textContent=title;$("#playerHeading").textContent=title;$("#player").classList.remove("hidden");document.body.style.overflow="hidden";
  if(user)saveHistory(title);
}
function closePlayer(){$("#player").classList.add("hidden");document.body.style.overflow="";}
async function saveHistory(title){
  if(!supabase||!user)return;
  await supabase.from("watch_history").upsert({user_id:user.id,title,content_type:"series",progress_seconds:0,duration_seconds:0,updated_at:new Date().toISOString()},{onConflict:"user_id,title"});
  await renderHistory();
}
async function toggleList(title="HoodGods"){
  if(!user){info("Sign In Required","Create a free UrbanAnimeTv account to save shows to My List.");return;}
  const {data}=await supabase.from("user_library").select("id").eq("user_id",user.id).eq("title",title).maybeSingle();
  if(data)await supabase.from("user_library").delete().eq("id",data.id);
  else await supabase.from("user_library").insert({user_id:user.id,title,content_type:"series"});
  await renderList();
}
async function renderList(){
  if(!user||!supabase)return;
  const {data}=await supabase.from("user_library").select("title,content_type,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
  $("#myListContent").innerHTML=data?.length?data.map(x=>`<div class="empty"><h3>${safe(x.title)}</h3><p>${safe(x.content_type)} • Saved</p></div>`).join(""):`<div class="empty"><h3>Your list is empty</h3><p>Add shows you want to watch later.</p></div>`;
}
async function renderHistory(){
  if(!user||!supabase)return;
  const {data}=await supabase.from("watch_history").select("title,content_type,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false});
  $("#historyContent").innerHTML=data?.length?data.map(x=>`<div class="empty"><h3>${safe(x.title)}</h3><p>Watched • ${new Date(x.updated_at).toLocaleDateString()}</p></div>`).join(""):`<div class="empty"><h3>No watch history yet</h3><p>Start watching and your history will appear here.</p></div>`;
}
function safe(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function accountUI(){
  if(user){
    $("#accountTitle").textContent="Your Account";$("#accountStatus").textContent=user.email;
    $("#accountSubmit").classList.add("hidden");$("#signupToggle").classList.add("hidden");$("#signOut").classList.remove("hidden");
  }else{
    $("#accountTitle").textContent=signup?"Create Account":"Sign In";
    $("#accountStatus").textContent="Create a free UrbanAnimeTv account to save shows and keep your watch history.";
    $("#accountSubmit").classList.remove("hidden");$("#signupToggle").classList.remove("hidden");$("#signOut").classList.add("hidden");
    $("#accountSubmit").textContent=signup?"Create Account":"Sign In";
  }
}
async function accountSubmit(e){
  e.preventDefault();const msg=$("#accountMessage");msg.textContent="Working...";
  if(!supabase){msg.textContent="Supabase is not connected. Check config.js.";return;}
  const email=$("#email").value.trim(),password=$("#password").value;
  const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
  if(r.error){msg.textContent=r.error.message;return}
  if(signup&&!r.data.session){msg.textContent="Account created. Check your email if confirmation is required.";return}
  user=r.data.user;msg.textContent="Signed in.";accountUI();await renderList();await renderHistory();
}
function init(){
  $("#heroWatch").onclick=()=>play("HoodGods");
  $("#heroList").onclick=()=>toggleList("HoodGods");
  $("#accountBtn").onclick=()=>showSection("account");
  $("#signupToggle").onclick=()=>{signup=!signup;accountUI();};
  $("#accountForm").onsubmit=accountSubmit;
  $("#signOut").onclick=async()=>{await supabase?.auth.signOut();user=null;accountUI();info("Signed Out","You have been signed out of UrbanAnimeTv.");};
  $("#closePlayer").onclick=closePlayer;
  $("#modalWatch").onclick=()=>{$("#modal").classList.add("hidden");play(activeTitle)};
  $("#modalList").onclick=()=>toggleList(activeTitle);
  $$("[data-close]").forEach(x=>x.onclick=()=>$("#modal").classList.add("hidden"));
  $$(".wide-card").forEach(card=>card.onclick=()=>info(card.dataset.title,card.dataset.title==="HoodGods"?"HoodGods is an UrbanAnimeTv original series.":"City of Ash is an UrbanAnimeTv original."));
  $("#searchBtn").onclick=()=>{$("#search").classList.remove("hidden");$("#searchInput").focus()};
  $("#closeSearch").onclick=$("#searchX").onclick=()=>$("#search").classList.add("hidden");
  $("#searchInput").oninput=e=>{
    const q=e.target.value.trim().toLowerCase(),titles=["HoodGods","City of Ash"];
    const found=q?titles.filter(x=>x.toLowerCase().includes(q)):[];
    $("#results").innerHTML=found.map(x=>`<div class="result" data-r="${safe(x)}"><strong>${safe(x)}</strong><small>UrbanAnimeTv</small></div>`).join("")||(q?"<p style='color:#777;padding:15px'>No titles found.</p>":"");
    $$(".result").forEach(x=>x.onclick=()=>{$("#search").classList.add("hidden");info(x.dataset.r)});
  };
  $$("[data-see-all]").forEach(x=>x.onclick=()=>info("UrbanAnimeTv","More titles will be added as UrbanAnimeTv releases new originals."));
  accountUI();
}
async function auth(){
  if(!supabase)return;
  const s=await supabase.auth.getSession();user=s.data.session?.user||null;accountUI();
  if(user){await renderList();await renderHistory();}
  supabase.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;accountUI();if(user){renderList();renderHistory();}});
}
init();auth();
