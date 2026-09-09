import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.URBANANIMETV_CONFIG || {};
const ready = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_"));
const supabase = ready ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
let user = null;
let signup = false;
let activeTitle = "HoodGods";
let heroIndex = 0;
let heroTimer = null;
let heroTouchStartX = null;
let heroTouchStartY = null;

const SHOWS = {
  "HoodGods": {
    type: "series",
    description: "HoodGods is an UrbanAnimeTv original series following JetBlakk and his crew through power, loyalty, survival, awakenings and the streets.",
    seasons: [{ number: 1, episodes: [{ number: 1, title: "The Beginning", description: "The beginning of the HoodGods story." }] }]
  },
  "City of Ash": {
    type: "series",
    description: "City of Ash is an UrbanAnimeTv original series filled with action, mystery and survival.",
    seasons: [{ number: 1, episodes: [] }]
  }
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function safe(v){return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function setActiveNav(id){
  $$(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.nav===id));
}

function showHome(){
  $$(".page-section").forEach(x=>x.classList.add("hidden"));
  $$(".home-section").forEach(x=>x.classList.remove("hidden"));
  renderContinue();
  window.scrollTo({top:0,behavior:"smooth"});
  setActiveNav("home");
}

function showSection(id){
  if(id === "home"){showHome();return;}
  $$(".home-section,.page-section").forEach(x=>x.classList.add("hidden"));
  const el = $("#"+id);
  if(el) el.classList.remove("hidden");
  if(id === "my-list") renderList();
  if(id === "watch-history") renderHistory();
  if(id === "account") accountUI();
  setActiveNav(id);
  el?.scrollIntoView({behavior:"smooth",block:"start"});
}

function openDetails(title){
  activeTitle=title;
  const show=SHOWS[title] || SHOWS["HoodGods"];
  $("#modalTitle").textContent=title;
  $("#modalText").textContent=show.description;
  $("#modalArt").src=title==="HoodGods" ? "hoodgods-thumbnail.png" : "hoodgods-thumbnail.png";
  $("#modalArt").alt=title;
  updateListButtons(title,false);
  if(user) refreshSavedState(title);
  const select=$("#seasonSelect");
  select.innerHTML=show.seasons.map(season=>`<option value="${season.number}">Season ${season.number}</option>`).join("");
  renderEpisodes(title, Number(select.value)||1);
  $("#modal").classList.remove("hidden");
}

function renderEpisodes(title,seasonNumber){
  const show=SHOWS[title] || SHOWS["HoodGods"];
  const season=show.seasons.find(s=>s.number===Number(seasonNumber)) || show.seasons[0];
  const list=$("#episodeList");
  list.innerHTML=season.episodes.map(ep=>`
    <article class="episode-card">
      <div class="episode-number">${ep.number}</div>
      <div class="episode-art">${title==="HoodGods"?'<img src="hoodgods-thumbnail.png" alt="">':'<div class="episode-ash">CITY OF ASH</div>'}</div>
      <div class="episode-info"><h4>Episode ${ep.number}: ${safe(ep.title)}</h4><p>${safe(ep.description)}</p></div>
      <button class="episode-play" data-episode-title="${safe(title)}" data-episode-number="${ep.number}" aria-label="Play episode ${ep.number}">▶</button>
    </article>`).join("");
  $$(".episode-play").forEach(btn=>btn.onclick=()=>{ $("#modal").classList.add("hidden"); play(title, Number(btn.dataset.episodeNumber), seasonNumber); });
}

function play(title="HoodGods", episode=1, season=1){
  activeTitle=title;
  const show=SHOWS[title] || SHOWS["HoodGods"];
  const ep=show.seasons.find(s=>s.number===Number(season))?.episodes.find(e=>e.number===Number(episode));
  const label=ep ? `${title} — S${season} E${episode} · ${ep.title}` : title;
  $("#playerTitle").textContent=label;
  $("#playerHeading").textContent=label;
  $("#player").classList.remove("hidden");
  document.body.style.overflow="hidden";
  // Do not create watch history here. Continue Watching should only appear after real progress/watched data exists.
}
function closePlayer(){$("#player").classList.add("hidden");document.body.style.overflow="";}

async function saveHistory(title,progressSeconds=0,durationSeconds=0,watched=false){
  if(!supabase || !user) return;
  const {error}=await supabase.from("watch_history").upsert({
    user_id:user.id,title,content_type:"series",progress_seconds:Number(progressSeconds)||0,
    duration_seconds:Number(durationSeconds)||0,watched:Boolean(watched),updated_at:new Date().toISOString()
  },{onConflict:"user_id,title"});
  if(error){console.error("Watch history error:",error);setAccountMessage(error.message,"error");return;}
  await renderHistory(); await renderContinue();
}

async function getList(){
  if(!supabase||!user) return [];
  const {data,error}=await supabase.from("user_library").select("id,title,content_type,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error){console.error("My List read error:",error);return []}
  return data||[];
}

async function refreshSavedState(title){
  if(!supabase||!user)return;
  const {data,error}=await supabase.from("user_library").select("id").eq("user_id",user.id).eq("title",title).maybeSingle();
  if(!error) updateListButtons(title,Boolean(data));
}

function updateListButtons(title,saved){
  $$(`[data-list-title="${CSS.escape(title)}"]`).forEach(btn=>{
    btn.classList.toggle("saved",saved);
    const span=btn.querySelector("span");
    if(span) span.textContent=saved?"In My List":"My List";
    if(!span && btn.id==="modalList") btn.textContent=saved?"✓ In My List":"＋ My List";
  });
}

async function toggleList(title="HoodGods"){
  if(!ready||!supabase){
    showSection("account");
    setAccountMessage("Supabase is not connected. Make sure your real publishable key is in config.js.","error");
    return;
  }
  if(!user){
    showSection("account");
    setAccountMessage("Sign in or create a free account first. Then tap My List again.","error");
    return;
  }

  const buttons=$$(`[data-list-title="${CSS.escape(title)}"]`);
  buttons.forEach(b=>b.disabled=true);
  try{
    const {data,error:selectError}=await supabase.from("user_library").select("id").eq("user_id",user.id).eq("title",title).maybeSingle();
    if(selectError)throw selectError;
    if(data){
      const {error}=await supabase.from("user_library").delete().eq("id",data.id).eq("user_id",user.id);
      if(error)throw error;
      updateListButtons(title,false); setAccountMessage(`${title} removed from My List.`,"success");
    }else{
      const {error}=await supabase.from("user_library").insert({user_id:user.id,title,content_type:"series"});
      if(error)throw error;
      updateListButtons(title,true); setAccountMessage(`${title} added to My List.` ,"success");
    }
    await renderList();
  }catch(err){
    console.error("My List error:",err);
    setAccountMessage(`My List error: ${err.message||"Could not update your list."}`,"error");
  }finally{buttons.forEach(b=>b.disabled=false)}
}

async function renderList(){
  if(!user||!supabase){
    $("#myListContent").innerHTML='<div class="empty"><h3>Sign in to use My List</h3><p>Your saved shows are tied to your account.</p></div>';
    updateListButtons("HoodGods",false);updateListButtons("City of Ash",false);return;
  }
  const data=await getList();
  $("#myListContent").innerHTML=data.length?data.map(x=>`<div class="empty"><h3>${safe(x.title)}</h3><p>${safe(x.content_type)} • Saved</p><button class="list-btn" data-remove-list="${safe(x.title)}">Remove</button></div>`).join(""): '<div class="empty"><h3>Your list is empty</h3><p>Add shows you want to watch later.</p></div>';
  $$('[data-remove-list]').forEach(btn=>btn.onclick=()=>toggleList(btn.dataset.removeList));
  const titles=new Set(data.map(x=>x.title));
  updateListButtons("HoodGods",titles.has("HoodGods"));updateListButtons("City of Ash",titles.has("City of Ash"));
}

async function getHistory(){
  if(!user||!supabase)return [];
  const {data,error}=await supabase.from("watch_history").select("title,content_type,progress_seconds,duration_seconds,watched,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false});
  if(error){console.error("History read error:",error);return []}
  return data||[];
}

async function renderHistory(){
  if(!user||!supabase){$("#historyContent").innerHTML='<div class="empty"><h3>Sign in to view watch history</h3><p>Your watch history is private to your account.</p></div>';return;}
  const data=await getHistory();
  $("#historyContent").innerHTML=data.length?data.map(x=>`<div class="empty"><h3>${safe(x.title)}</h3><p>${x.watched?"Watched":"Started"} • ${new Date(x.updated_at).toLocaleDateString()}</p></div>`).join(""): '<div class="empty"><h3>No watch history yet</h3><p>Start watching and your history will appear here.</p></div>';
}

async function renderContinue(){
  const section=$("#continue"),content=$("#continueContent");
  if(!section||!content)return;
  if(!user||!supabase){section.classList.add("hidden");content.innerHTML="";return;}
  const history=await getHistory();
  // Strictly hide the section until an episode/movie has actual progress or is marked watched.
  const items=history.filter(x=>Boolean(x.watched)||Number(x.progress_seconds)>0);
  if(!items.length){section.classList.add("hidden");content.innerHTML="";return;}
  section.classList.remove("hidden");
  content.innerHTML=items.map(x=>{
    const pct=Number(x.duration_seconds)>0?Math.max(0,Math.min(100,Number(x.progress_seconds)/Number(x.duration_seconds)*100)):(x.watched?100:0);
    const label=x.title==="HoodGods"?"S1 E1 - The Beginning":"S1 E1 - Ashes Don't Lie";
    return `<article class="wide-card continue-card" data-title="${safe(x.title)}"><div class="art ${x.title==="HoodGods"?"hood-trend-art":"ash-trend-art"}">${x.title==="HoodGods"?'<img src="hoodgods-thumbnail.png" alt="HoodGods">':'<div class="ash-silhouette" aria-hidden="true"></div><span>CITY OF ASH</span>'}</div><h3>${safe(x.title)}</h3><p>${label}</p><div class="progress"><i style="width:${pct}%"></i></div></article>`;
  }).join("");
  $$(".continue-card").forEach(card=>card.onclick=()=>play(card.dataset.title));
}

function setAccountMessage(text,type=""){$("#accountMessage").textContent=text;$("#accountMessage").className=`account-message ${type}`.trim();}
function accountUI(){
  if(user){
    $("#accountTitle").textContent="Your Account";$("#accountStatus").textContent=user.email||"Signed in";
    $("#accountSubmit").classList.add("hidden");$("#signupToggle").classList.add("hidden");$("#signOut").classList.remove("hidden");$("#historyBtn").classList.remove("hidden");
  }else{
    $("#accountTitle").textContent=signup?"Create Account":"Sign In";$("#accountStatus").textContent="Create a free UrbanAnimeTv account to save shows and keep your watch history.";
    $("#accountSubmit").classList.remove("hidden");$("#signupToggle").classList.remove("hidden");$("#signOut").classList.add("hidden");$("#historyBtn").classList.add("hidden");$("#accountSubmit").textContent=signup?"Create Account":"Sign In";
  }
}

async function accountSubmit(e){
  e.preventDefault();setAccountMessage("Working...");
  if(!supabase){setAccountMessage("Supabase is not connected. Check config.js.","error");return}
  const email=$("#email").value.trim(),password=$("#password").value;
  const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
  if(r.error){setAccountMessage(r.error.message,"error");return}
  if(signup&&!r.data.session){setAccountMessage("Account created. Check your email if confirmation is required.","success");return}
  user=r.data.user;accountUI();setAccountMessage("Signed in successfully.","success");
  await renderList();await renderHistory();await renderContinue();
}

function setHero(index, userInitiated=false){
  const slides=$$(".hero-slide");
  if(!slides.length)return;
  heroIndex=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>slide.classList.toggle("active",i===heroIndex));
  $$(".hero-dot").forEach((dot,i)=>dot.classList.toggle("active",i===heroIndex));
  const active=slides[heroIndex];
  const title=active?.dataset.hero||"HoodGods";
  activeTitle=title;
  if(userInitiated){restartHeroTimer();}
}

function nextHero(){setHero(heroIndex+1,true);}
function prevHero(){setHero(heroIndex-1,true);}
function restartHeroTimer(){
  if(heroTimer)clearInterval(heroTimer);
  heroTimer=setInterval(()=>setHero(heroIndex+1),7000);
}

function initHeroCarousel(){
  const hero=$("#heroCarousel");
  if(!hero)return;
  $$(".hero-watch").forEach(btn=>btn.onclick=e=>{e.stopPropagation();play(btn.dataset.heroTitle);});
  $$(".hero-list").forEach(btn=>btn.onclick=e=>{e.stopPropagation();toggleList(btn.dataset.listTitle);});
  $("#heroNext").onclick=e=>{e.stopPropagation();nextHero();};
  $("#heroPrev").onclick=e=>{e.stopPropagation();prevHero();};
  $$(".hero-dot").forEach(dot=>dot.onclick=e=>{e.stopPropagation();setHero(Number(dot.dataset.heroDot),true);});

  hero.addEventListener("touchstart",e=>{
    const t=e.changedTouches[0];
    heroTouchStartX=t.clientX;heroTouchStartY=t.clientY;
    if(heroTimer)clearInterval(heroTimer);
  },{passive:true});
  hero.addEventListener("touchend",e=>{
    if(heroTouchStartX===null)return;
    const t=e.changedTouches[0];
    const dx=t.clientX-heroTouchStartX,dy=t.clientY-heroTouchStartY;
    heroTouchStartX=null;heroTouchStartY=null;
    if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.2){dx<0?nextHero():prevHero();}
    else restartHeroTimer();
  },{passive:true});
  hero.addEventListener("mouseenter",()=>{if(heroTimer)clearInterval(heroTimer);});
  hero.addEventListener("mouseleave",restartHeroTimer);
  hero.addEventListener("focusin",()=>{if(heroTimer)clearInterval(heroTimer);});
  hero.addEventListener("focusout",restartHeroTimer);
  setHero(0);
  restartHeroTimer();
}

function init(){
  initHeroCarousel();
  $("#accountBtn").onclick=()=>showSection("account");
  $("#signupToggle").onclick=()=>{signup=!signup;accountUI();};
  $("#accountForm").onsubmit=accountSubmit;
  $("#signOut").onclick=async()=>{if(supabase)await supabase.auth.signOut();user=null;accountUI();await renderContinue();setAccountMessage("Signed out.","success");showHome();};
  $("#historyBtn").onclick=()=>showSection("watch-history");
  $("#closePlayer").onclick=closePlayer;
  $("#modalWatch").onclick=()=>{ $("#modal").classList.add("hidden"); play(activeTitle,1,1); };
  $("#seasonSelect").onchange=e=>renderEpisodes(activeTitle,Number(e.target.value));
  $("#modalList").onclick=()=>toggleList(activeTitle);
  $$('[data-close]').forEach(x=>x.onclick=()=>$("#modal").classList.add("hidden"));

  $$(".wide-card").forEach(card=>{
    if(card.classList.contains("continue-card"))return;
    card.onclick=()=>openDetails(card.dataset.title);
  });

  $("#searchBtn").onclick=()=>{$("#search").classList.remove("hidden");setTimeout(()=>$("#searchInput").focus(),50);};
  $("#closeSearch").onclick=$("#searchX").onclick=()=>$("#search").classList.add("hidden");
  $("#searchInput").oninput=e=>{const q=e.target.value.trim().toLowerCase(),titles=["HoodGods","City of Ash"],found=q?titles.filter(x=>x.toLowerCase().includes(q)):[];$("#results").innerHTML=found.map(x=>`<div class="result" data-r="${safe(x)}"><strong>${safe(x)}</strong><small>UrbanAnimeTv</small></div>`).join("")||(q?"<p style='color:#777;padding:15px'>No titles found.</p>":"");$$('.result').forEach(x=>x.onclick=()=>{$("#search").classList.add("hidden");openDetails(x.dataset.r);});};

  $$("[data-see-all]").forEach(btn=>btn.onclick=()=>showSection(btn.dataset.seeAll === "popular" || btn.dataset.seeAll === "trending" ? "series" : "home"));
  $$("nav a").forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.nav);});
  $$('footer a').forEach(a=>a.onclick=e=>{if(a.getAttribute('href')==='#home'){e.preventDefault();showHome();}});
  accountUI();
}

async function auth(){
  if(!supabase){await renderContinue();return;}
  const s=await supabase.auth.getSession();user=s.data.session?.user||null;accountUI();
  if(user){await renderList();await renderHistory();await renderContinue();}
  supabase.auth.onAuthStateChange(async(_e,s)=>{user=s?.user||null;accountUI();if(user){await renderList();await renderHistory();}else{updateListButtons("HoodGods",false);updateListButtons("City of Ash",false);}await renderContinue();});
}

init();auth();
