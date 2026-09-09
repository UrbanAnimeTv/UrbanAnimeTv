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
let profile = {display_name:"", avatar_url:""};

const SHOWS = {
  "HoodGods": {
    type:"series",
    description:"HoodGods is an UrbanAnimeTv original series following JetBlakk and his crew through power, loyalty, survival, awakenings and the streets.",
    image:"hoodgods-thumbnail.png",
    seasons:[{number:1,episodes:[{number:1,title:"The Beginning",description:"The beginning of the HoodGods story."}]}]
  },
  "City of Ash": {
    type:"series",
    description:"City of Ash is an UrbanAnimeTv original series filled with action, mystery and survival.",
    image:null,
    seasons:[{number:1,episodes:[]}]
  }
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function safe(v){return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function setActiveNav(id){$$('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.nav===id));$$('[data-bottom-nav]').forEach(a=>a.classList.toggle('active',a.dataset.bottomNav===id));}

function showHome(){
  $$(".page-section").forEach(x=>x.classList.add("hidden"));
  $$(".home-section").forEach(x=>x.classList.remove("hidden"));
  renderContinue();
  window.scrollTo({top:0,behavior:"smooth"});
  setActiveNav("home");
}
function showSection(id){
  if(id==="home"){showHome();return;}
  $$(".home-section,.page-section").forEach(x=>x.classList.add("hidden"));
  const el=$("#"+id); if(el)el.classList.remove("hidden");
  if(id==="my-list")renderList();
  if(id==="live-tv")renderLiveTV();
  if(id==="watch-history")renderHistory();
  if(id==="account")accountUI();
  setActiveNav(id);
  el?.scrollIntoView({behavior:"smooth",block:"start"});
}

function showArt(title, cls=""){
  if(title==="HoodGods")return `<div class="art ${cls}"><img src="hoodgods-thumbnail.png" alt="HoodGods"></div>`;
  return `<div class="art ${cls}"><div class="ash-silhouette" aria-hidden="true"></div><span>CITY OF ASH</span></div>`;
}

function openDetails(title){
  activeTitle=title;
  const show=SHOWS[title]||SHOWS.HoodGods;
  $("#modalTitle").textContent=title;
  $("#modalText").textContent=show.description;
  $("#modalArt").src=show.image||"hoodgods-thumbnail.png";
  $("#modalArt").alt=title;
  updateListButtons(title,false);
  if(user)refreshSavedState(title);
  loadRating(title);
  const select=$("#seasonSelect");
  select.innerHTML=show.seasons.map(s=>`<option value="${s.number}">Season ${s.number}</option>`).join("");
  renderEpisodes(title,Number(select.value)||1);
  $("#modal").classList.remove("hidden");
}

async function getRating(title){
  if(!supabase||!user)return null;
  const {data,error}=await supabase.from("show_ratings").select("rating").eq("user_id",user.id).eq("title",title).maybeSingle();
  if(error){console.error("Rating read error:",error);return null;}
  return data?.rating||null;
}

function paintRating(rating){
  const status=$("#ratingStatus");
  $$(".rating-btn").forEach(b=>b.classList.toggle("active",b.dataset.rating===rating));
  if(!user){status.textContent="Sign in to rate";return;}
  status.textContent=rating==="up"?"You liked this show":rating==="down"?"You disliked this show":"How do you like it?";
}

async function loadRating(title){
  if(!user){paintRating(null);return;}
  paintRating(await getRating(title));
}

async function setRating(title,rating){
  if(!supabase){showSection("account");setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
  if(!user){showSection("account");setAccountMessage("Sign in or create a free account first to rate shows.","error");return;}
  const buttons=$$(".rating-btn");buttons.forEach(b=>b.disabled=true);
  try{
    const current=await getRating(title);
    if(current===rating){
      const {error}=await supabase.from("show_ratings").delete().eq("user_id",user.id).eq("title",title);
      if(error)throw error;
      paintRating(null);
    }else{
      const {error}=await supabase.from("show_ratings").upsert({user_id:user.id,title,rating},{onConflict:"user_id,title"});
      if(error)throw error;
      paintRating(rating);
    }
  }catch(err){console.error(err);setAccountMessage(`Rating error: ${err.message||"Could not save your rating."}`,"error");}
  finally{buttons.forEach(b=>b.disabled=false)}
}

function renderEpisodes(title,seasonNumber){
  const show=SHOWS[title]||SHOWS.HoodGods;
  const season=show.seasons.find(s=>s.number===Number(seasonNumber))||show.seasons[0];
  const list=$("#episodeList");
  if(!season.episodes.length){
    list.innerHTML='<div class="empty"><h3>No episodes yet</h3><p>No episode has been added for this show yet.</p></div>';
    return;
  }
  list.innerHTML=season.episodes.map(ep=>`
    <article class="episode-card">
      <div class="episode-number">${ep.number}</div>
      <div class="episode-art">${title==="HoodGods"?'<img src="hoodgods-thumbnail.png" alt="">':'<div class="episode-ash">CITY OF ASH</div>'}</div>
      <div class="episode-info"><h4>Episode ${ep.number}: ${safe(ep.title)}</h4><p>${safe(ep.description)}</p></div>
      <button class="episode-play" data-episode-title="${safe(title)}" data-episode-number="${ep.number}" aria-label="Play episode ${ep.number}"><span class="play-symbol" aria-hidden="true"></span></button>
    </article>`).join("");
  $$(".episode-play").forEach(btn=>btn.onclick=()=>{$("#modal").classList.add("hidden");play(title,Number(btn.dataset.episodeNumber),seasonNumber);});
}

function play(title="HoodGods",episode=1,season=1){
  activeTitle=title;
  const show=SHOWS[title]||SHOWS.HoodGods;
  const ep=show.seasons.find(s=>s.number===Number(season))?.episodes.find(e=>e.number===Number(episode));
  const label=ep?`${title} — S${season} E${episode} · ${ep.title}`:title;
  $("#playerTitle").textContent=label;$("#playerHeading").textContent=label;
  $("#player").classList.remove("hidden");document.body.style.overflow="hidden";
}

async function closePlayer(){ $("#player").classList.add("hidden");document.body.style.overflow=""; }

async function saveHistory(title,progressSeconds=0,durationSeconds=0,watched=false){
  if(!supabase||!user)return;
  const {error}=await supabase.from("watch_history").upsert({
    user_id:user.id,title,content_type:SHOWS[title]?.type||"series",
    progress_seconds:Number(progressSeconds)||0,duration_seconds:Number(durationSeconds)||0,
    watched:Boolean(watched),updated_at:new Date().toISOString()
  },{onConflict:"user_id,title"});
  if(error){console.error(error);return;}
  await renderHistory();await renderContinue();
}

async function getList(){
  if(!supabase||!user)return [];
  const {data,error}=await supabase.from("user_library").select("id,title,content_type,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error){console.error("My List read error:",error);return []}
  return data||[];
}

async function refreshSavedState(title){
  if(!supabase||!user)return;
  const {data,error}=await supabase.from("user_library").select("id").eq("user_id",user.id).eq("title",title).maybeSingle();
  if(!error)updateListButtons(title,Boolean(data));
}

function updateListButtons(title,saved){
  $$(`[data-list-title="${CSS.escape(title)}"]`).forEach(btn=>{
    btn.classList.toggle("saved",saved);
    const span=btn.querySelector("span");
    if(span)span.textContent=saved?"In My List":"My List";
    if(!span&&btn.id==="modalList")btn.textContent=saved?"✓ In My List":"＋ My List";
  });
}

async function toggleList(title="HoodGods"){
  if(!supabase){showSection("account");setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
  if(!user){showSection("account");setAccountMessage("Sign in or create a free account first. Then tap My List again.","error");return;}
  const buttons=$$(`[data-list-title="${CSS.escape(title)}"]`);buttons.forEach(b=>b.disabled=true);
  try{
    const {data,error:selectError}=await supabase.from("user_library").select("id").eq("user_id",user.id).eq("title",title).maybeSingle();
    if(selectError)throw selectError;
    if(data){
      const {error}=await supabase.from("user_library").delete().eq("id",data.id).eq("user_id",user.id);if(error)throw error;
      updateListButtons(title,false);setAccountMessage(`${title} removed from My List.`,"success");
    }else{
      const {error}=await supabase.from("user_library").insert({user_id:user.id,title,content_type:SHOWS[title]?.type||"series"});if(error)throw error;
      updateListButtons(title,true);setAccountMessage(`${title} added to My List.`,"success");
    }
    await renderList();
  }catch(err){console.error(err);setAccountMessage(`My List error: ${err.message||"Could not update your list."}`,"error");}
  finally{buttons.forEach(b=>b.disabled=false)}
}

async function renderList(){
  const box=$("#myListContent");if(!box)return;
  if(!user||!supabase){box.innerHTML='<div class="empty"><h3>Sign in to use your Saved Library</h3><p>Your saved shows and movies are tied to your account.</p></div>';return;}
  const data=await getList();
  if(!data.length){box.innerHTML='<div class="empty"><h3>Your library is empty</h3><p>Add a show or movie with + My List and it will appear here.</p></div>';updateListButtons("HoodGods",false);updateListButtons("City of Ash",false);return;}
  box.innerHTML=data.map(x=>`
    <article class="library-card">
      ${showArt(x.title,x.title==="HoodGods"?"hood-cast-art":"ash-character-art")}
      <div class="library-card-body"><h3>${safe(x.title)}</h3><p>${safe(x.content_type)} • Saved to My List</p>
      <div class="library-card-actions"><button class="watch-btn" data-library-watch="${safe(x.title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch</span></button><button class="list-btn" data-remove-list="${safe(x.title)}">Remove</button></div></div>
    </article>`).join("");
  $$("[data-remove-list]").forEach(b=>b.onclick=()=>toggleList(b.dataset.removeList));
  $$("[data-library-watch]").forEach(b=>b.onclick=()=>play(b.dataset.libraryWatch));
  const titles=new Set(data.map(x=>x.title));updateListButtons("HoodGods",titles.has("HoodGods"));updateListButtons("City of Ash",titles.has("City of Ash"));
}

async function getHistory(){
  if(!user||!supabase)return [];
  const {data,error}=await supabase.from("watch_history").select("title,content_type,progress_seconds,duration_seconds,watched,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false});
  if(error){console.error(error);return []}return data||[];
}
async function renderHistory(){
  const box=$("#historyContent");if(!box)return;
  if(!user||!supabase){box.innerHTML='<div class="empty"><h3>Sign in to view watch history</h3><p>Your watch history is private to your account.</p></div>';return;}
  const data=await getHistory();
  box.innerHTML=data.length?data.map(x=>`<article class="library-card">${showArt(x.title,x.title==="HoodGods"?"hood-cast-art":"ash-character-art")}<div class="library-card-body"><h3>${safe(x.title)}</h3><p>${x.watched?"Watched":"Started"} • ${new Date(x.updated_at).toLocaleDateString()}</p><button class="watch-btn" data-history-watch="${safe(x.title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch</span></button></div></article>`).join(""):'<div class="empty"><h3>No watch history yet</h3><p>Start watching and your history will appear here.</p></div>';
  $$("[data-history-watch]").forEach(b=>b.onclick=()=>play(b.dataset.historyWatch));
}
async function renderContinue(){
  const section=$("#continue"),content=$("#continueContent");if(!section||!content)return;
  if(!user||!supabase){section.classList.add("hidden");content.innerHTML="";return;}
  const history=await getHistory();const items=history.filter(x=>Boolean(x.watched)||Number(x.progress_seconds)>0);
  if(!items.length){section.classList.add("hidden");content.innerHTML="";return;}
  section.classList.remove("hidden");
  content.innerHTML=items.map(x=>{
    const pct=Number(x.duration_seconds)>0?Math.max(0,Math.min(100,Number(x.progress_seconds)/Number(x.duration_seconds)*100)):(x.watched?100:0);
    const label=x.title==="HoodGods"?"S1 E1 - The Beginning":"";
    return `<article class="wide-card continue-card" data-title="${safe(x.title)}">${showArt(x.title,x.title==="HoodGods"?"hood-trend-art":"ash-trend-art")}<h3>${safe(x.title)}</h3><p>${label}</p><div class="progress"><i style="width:${pct}%"></i></div></article>`;
  }).join("");
  $$(".continue-card").forEach(c=>c.onclick=()=>play(c.dataset.title));
}

function renderLiveTV(){
  const box=$("#liveContent");if(!box)return;
  const ep=SHOWS.HoodGods.seasons[0].episodes[0];
  if(!ep){box.innerHTML='<div class="empty"><h3>Nothing is streaming live right now</h3><p>No episode has been added to the live schedule.</p></div>';return;}
  box.innerHTML=`<article class="live-card" data-live-title="HoodGods">
    <div class="live-art"><img src="hoodgods-thumbnail.png" alt="HoodGods"><span class="live-label">LIVE</span></div>
    <div class="live-info"><h4>HoodGods — S1 E1 · ${safe(ep.title)}</h4><p>Now streaming • The Beginning</p></div>
  </article>`;
  $$(".live-card").forEach(c=>c.onclick=()=>play(c.dataset.liveTitle,1,1));
}

function setAccountMessage(text,type=""){const x=$("#accountMessage");if(x){x.textContent=text;x.className=`account-message ${type}`.trim();}}
function setProfileMessage(text,type=""){const x=$("#profileMessage");if(x){x.textContent=text;x.className=`account-message ${type}`.trim();}}

function setTopAvatar(url){
  const wrap=$("#accountAvatarTop");
  if(!wrap)return;
  if(url)wrap.innerHTML=`<img class="account-avatar-img" src="${safe(url)}" alt="Profile">`;
  else wrap.textContent="●";
}

async function loadProfile(){
  if(!user||!supabase)return;
  let {data,error}=await supabase.from("profiles").select("display_name,avatar_url").eq("user_id",user.id).maybeSingle();
  if(error){console.error("Profile read error:",error);return;}
  if(!data){
    const meta=user.user_metadata||{};
    data={display_name:meta.display_name||"",avatar_url:meta.avatar_url||""};
    await supabase.from("profiles").upsert({user_id:user.id,display_name:data.display_name,avatar_url:data.avatar_url},{onConflict:"user_id"});
  }
  profile=data||{display_name:"",avatar_url:""};
  $("#displayName").value=profile.display_name||"";
  $("#profilePreview").src=profile.avatar_url||"urbananimetv-logo.png";
  $("#profileAvatar").src=profile.avatar_url||"urbananimetv-logo.png";
  setTopAvatar(profile.avatar_url);
}

async function saveProfile(){
  if(!user||!supabase)return;
  const displayName=$("#displayName").value.trim();
  const {error}=await supabase.from("profiles").upsert({user_id:user.id,display_name:displayName,avatar_url:profile.avatar_url||""},{onConflict:"user_id"});
  if(error){setProfileMessage(error.message,"error");return;}
  profile.display_name=displayName;$("#accountStatus").textContent=displayName||user.email||"Signed in";
  setProfileMessage("Profile saved.","success");
}

async function uploadAvatar(file){
  if(!user||!supabase||!file)return;
  if(file.size>5*1024*1024){setProfileMessage("Please choose an image under 5 MB.","error");return;}
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setProfileMessage("Please use PNG, JPG or WEBP.","error");return;}
  setProfileMessage("Preparing profile picture...");
  try{
    const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          const size=256,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext("2d");ctx.fillStyle="#050505";ctx.fillRect(0,0,size,size);
          const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
          ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
          resolve(canvas.toDataURL("image/jpeg",0.82));
        };
        img.onerror=reject;img.src=reader.result;
      };
      reader.onerror=reject;reader.readAsDataURL(file);
    });
    const {error}=await supabase.from("profiles").upsert({user_id:user.id,display_name:profile.display_name||"",avatar_url:dataUrl,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error){setProfileMessage(`Profile picture error: ${error.message}`,"error");return;}
    profile.avatar_url=dataUrl;
    $("#profilePreview").src=dataUrl;$("#profileAvatar").src=dataUrl;setTopAvatar(dataUrl);
    setProfileMessage("Profile picture updated.","success");
  }catch(err){setProfileMessage("Could not process that image. Please try another picture.","error");console.error(err);}
}

function accountUI(){
  const signed=Boolean(user);
  $("#accountTitle").textContent=signed?(profile.display_name||"Your Account"):(signup?"Create Account":"Sign In");
  $("#accountStatus").textContent=signed?(profile.display_name||user.email||"Signed in"):"Create a free UrbanAnimeTv account to save shows and keep your library private.";
  $("#authBox").classList.toggle("hidden",signed);
  $("#profileSettings").classList.toggle("hidden",!signed);
  if(!signed){$("#accountSubmit").textContent=signup?"Create Account":"Sign In";}
}

function initHeroCarousel(){
  const hero=$("#heroCarousel");if(!hero)return;
  $$(".hero-watch").forEach(b=>b.onclick=e=>{e.stopPropagation();play(b.dataset.heroTitle);});
  $$(".hero-list").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleList(b.dataset.listTitle);});
  $("#heroNext").onclick=e=>{e.stopPropagation();nextHero();};$("#heroPrev").onclick=e=>{e.stopPropagation();prevHero();};
  $$(".hero-dot").forEach(d=>d.onclick=e=>{e.stopPropagation();setHero(Number(d.dataset.heroDot),true);});
  hero.addEventListener("touchstart",e=>{const t=e.changedTouches[0];heroTouchStartX=t.clientX;heroTouchStartY=t.clientY;if(heroTimer)clearInterval(heroTimer);},{passive:true});
  hero.addEventListener("touchend",e=>{if(heroTouchStartX===null)return;const t=e.changedTouches[0],dx=t.clientX-heroTouchStartX,dy=t.clientY-heroTouchStartY;heroTouchStartX=null;heroTouchStartY=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2){dx<0?nextHero():prevHero();}else restartHeroTimer();},{passive:true});
  setHero(0);restartHeroTimer();
}
function setHero(index,userInitiated=false){
  const slides=$$(".hero-slide");if(!slides.length)return;heroIndex=(index+slides.length)%slides.length;
  slides.forEach((s,i)=>s.classList.toggle("active",i===heroIndex));$$(".hero-dot").forEach((d,i)=>d.classList.toggle("active",i===heroIndex));
  activeTitle=slides[heroIndex]?.dataset.hero||"HoodGods";if(userInitiated)restartHeroTimer();
}
function nextHero(){setHero(heroIndex+1,true)}function prevHero(){setHero(heroIndex-1,true)}
function restartHeroTimer(){if(heroTimer)clearInterval(heroTimer);heroTimer=setInterval(()=>setHero(heroIndex+1),7000)}

async function init(){
  initHeroCarousel();
  $("#accountBtn").onclick=()=>showSection("account");
  $("#signupToggle").onclick=()=>{signup=!signup;accountUI();};
  $("#accountForm").onsubmit=async e=>{
    e.preventDefault();setAccountMessage("Working...");
    if(!supabase){setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
    const email=$("#email").value.trim(),password=$("#password").value;
    const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
    if(r.error){setAccountMessage(r.error.message,"error");return;}
    if(signup&&!r.data.session){setAccountMessage("Account created. Check your email if confirmation is required.","success");return;}
    user=r.data.user;await loadProfile();accountUI();setAccountMessage("Signed in successfully.","success");await renderList();await renderHistory();await renderContinue();
  };
  $("#signOut").onclick=async()=>{if(supabase)await supabase.auth.signOut();user=null;profile={display_name:"",avatar_url:""};setTopAvatar("");accountUI();await renderContinue();showHome();};
  $("#historyBtn").onclick=()=>showSection("watch-history");
  $("#saveProfile").onclick=saveProfile;
  $("#avatarInput").onchange=e=>uploadAvatar(e.target.files?.[0]);
  $("#closePlayer").onclick=closePlayer;
  $("#modalWatch").onclick=()=>{$("#modal").classList.add("hidden");play(activeTitle,1,1);};
  $("#seasonSelect").onchange=e=>renderEpisodes(activeTitle,Number(e.target.value));
  $("#modalList").onclick=()=>toggleList(activeTitle);
  $("#thumbUp").onclick=()=>setRating(activeTitle,"up");
  $("#thumbDown").onclick=()=>setRating(activeTitle,"down");
  $$("[data-close]").forEach(x=>x.onclick=()=>$("#modal").classList.add("hidden"));

  $$(".wide-card").forEach(card=>{if(card.classList.contains("continue-card"))return;card.onclick=()=>openDetails(card.dataset.title);});
  $("#searchBtn").onclick=()=>{$("#search").classList.remove("hidden");setTimeout(()=>$("#searchInput").focus(),50);};
  $("#closeSearch").onclick=$("#searchX").onclick=()=>$("#search").classList.add("hidden");
  $("#searchInput").oninput=e=>{
    const q=e.target.value.trim().toLowerCase(),titles=["HoodGods","City of Ash"],found=q?titles.filter(x=>x.toLowerCase().includes(q)):[];
    $("#results").innerHTML=found.map(x=>`<div class="result" data-r="${safe(x)}"><strong>${safe(x)}</strong><small>UrbanAnimeTv</small></div>`).join("")||(q?"<p style='color:#777;padding:15px'>No titles found.</p>":"");
    $$(".result").forEach(x=>x.onclick=()=>{$("#search").classList.add("hidden");openDetails(x.dataset.r);});
  };
  $$("[data-see-all]").forEach(btn=>btn.onclick=()=>showSection(btn.dataset.seeAll==="continue"?"watch-history":"series"));
  $$('nav[aria-label="Primary navigation"] a').forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.nav);});
  $$('[data-bottom-nav]').forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.bottomNav);});
  $$("footer a").forEach(a=>a.onclick=e=>{if(a.getAttribute("href")==="#home"){e.preventDefault();showHome();}});
  accountUI();renderLiveTV();
}

async function auth(){
  if(!supabase){await renderContinue();return;}
  const s=await supabase.auth.getSession();user=s.data.session?.user||null;
  if(user)await loadProfile();
  accountUI();
  if(user){await renderList();await renderHistory();await renderContinue();}
  supabase.auth.onAuthStateChange(async(_e,s)=>{
    user=s?.user||null;
    if(user)await loadProfile();else{profile={display_name:"",avatar_url:""};setTopAvatar("");}
    accountUI();if(user){await renderList();await renderHistory();if(!$("#modal").classList.contains("hidden"))await loadRating(activeTitle);}else{updateListButtons("HoodGods",false);updateListButtons("City of Ash",false);paintRating(null);}
    await renderContinue();
  });
}

init();auth();
