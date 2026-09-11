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
let membership = {plan:"free", status:"active"};

const VIDEO_BASE = "https://uatv-video.urbananimetv10.workers.dev";

const SHOWS = {
  "HoodGods": {
    type:"series", premium:false, live:false,
    description:"HoodGods is an UrbanAnimeTv original series following JetBlakk and his crew through power, loyalty, survival, awakenings and the streets.",
    image:"hoodgods-thumbnail.png",
    seasons:[{number:1,episodes:[{number:1,title:"The Beginning",description:"The beginning of the HoodGods story."}]}]
  },
  "City of Ash": {
    type:"series", premium:false, live:false,
    description:"City of Ash is an UrbanAnimeTv original series filled with action, mystery and survival.",
    image:"city-of-ash-thumbnail.png",
    seasons:[{number:1,episodes:[]}]
  },
  "The PJs": {
    type:"series", premium:true, live:true, channel:true,
    description:"The PJs — a neighborhood comedy about family, friends and life in the projects.",
    image:"the-pjs-thumbnail.jpg",
    seasons:[
      {number:1,episodes:Array.from({length:15},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:i===0?`${VIDEO_BASE}/The%20PJs/The.PJs.s01e01.480p.mp4`:null}))},
      {number:2,episodes:Array.from({length:15},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:null}))},
      {number:3,episodes:Array.from({length:13},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:null}))}
    ]
  },
  "The Boondocks": {
    type:"series", premium:true, live:true, channel:true,
    description:"The Boondocks — sharp social commentary, family conflict and life through the eyes of two brothers.",
    image:"boondocks-thumbnail.jpg",
    seasons:[{number:1,episodes:[]}]
  },
  "Afro Samurai": {
    type:"series", premium:true, live:true, channel:true,
    description:"Afro Samurai — a cinematic journey of revenge, honor and survival.",
    image:"afro-samurai-thumbnail.jpg",
    seasons:[{number:1,episodes:[]}]
  },
  "Static Shock": {
    type:"series", premium:true, live:true, channel:true,
    description:"Static Shock — a young hero balancing power, responsibility and life in the city.",
    image:"static-shock-thumbnail.jpg",
    seasons:[{number:1,episodes:[]}]
  },
  "Black Dynamite": {
    type:"series", premium:true, live:true, channel:true,
    description:"Black Dynamite — action, style and comedy with a larger-than-life street legend.",
    image:"black-dynamite-thumbnail.jpg",
    seasons:[{number:1,episodes:[]}]
  },
  "The Cleveland Show": {
    type:"series", premium:true, live:true, channel:true,
    description:"The Cleveland Show — family, neighborhood life and comedy in Stoolbend.",
    image:"cleveland-show-thumbnail.jpg",
    seasons:[{number:1,episodes:[]}]
  }
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function safe(v){return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

let toastTimer = null;
function showToast(message,type="success"){
  const toast=$("#toast");
  if(!toast)return;
  toast.textContent=message;
  toast.className=`toast show ${type}`.trim();
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}

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
    if(id==="watch-history")renderHistory();
  if(id==="live-tv")renderLiveTV();
  if(id==="watch-party")loadWatchPartyRooms();
  if(id==="account"){accountUI();loadMembership();}
  setActiveNav(id);
  el?.scrollIntoView({behavior:"smooth",block:"start"});
}

function showArt(title, cls=""){
  const show=SHOWS[title]||SHOWS.HoodGods;
  return `<div class="art ${cls}"><img src="${show.image||"hoodgods-thumbnail.png"}" alt="${safe(title)}"></div>`;
}

function openDetails(title){
  activeTitle=title;
  const show=SHOWS[title]||SHOWS.HoodGods;
  getNotificationState(activeTitle).then(enabled=>updateNotifyButton(activeTitle,enabled));

  $("#modalTitle").textContent=title;
  $("#modalText").textContent=show.description;
  $("#modalArt").src=show.image||"hoodgods-thumbnail.png";
  $("#modalArt").alt=title;
  $("#modal").dataset.title=title;

  const label=$("#modalKicker");
  if(label)label.textContent=show.premium?"PREMIUM":(show.live?"LIVE TV":"URBANANIMETV ORIGINAL");

  const watch=$("#modalWatch");
  if(watch){
    watch.dataset.title=title;
    watch.innerHTML=`<span class="play-symbol" aria-hidden="true"></span><span>${show.live?"Watch Live":"Watch Now"}</span>`;
  }

  updateListButtons(title,false);
  if(user)refreshSavedState(title);
  loadRating(title);

  const select=$("#seasonSelect");
  select.innerHTML=show.seasons.length
    ? show.seasons.map(s=>`<option value="${s.number}">Season ${s.number}</option>`).join("")
    : `<option value="1">Season 1</option>`;

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
  if(!season || !season.episodes.length){
    list.innerHTML=`
      <div class="episode-empty-premium">
        <div class="episode-empty-icon">▶</div>
        <h3>Season ${Number(seasonNumber)||1} is ready for episodes</h3>
        <p>${show.premium?"Premium episodes will appear here as video sources are connected.":"No episode has been added for this show yet."}</p>
      </div>`;
    return;
  }

  const locked=show.premium && !isPremium();
  list.innerHTML=season.episodes.map(ep=>{
    const hasVideo=Boolean(ep.video);
    const playable=hasVideo && (!show.premium || isPremium());
    const state=locked?"PREMIUM":(hasVideo?"PLAY":"COMING SOON");
    return `<article class="episode-card ${locked?"episode-locked":""}">
      <div class="episode-number">${ep.number}</div>
      <div class="episode-art"><img src="${show.image||'hoodgods-thumbnail.png'}" alt=""></div>
      <div class="episode-info">
        <h4>Episode ${ep.number}</h4>
        <p>${safe(ep.description)}</p>
        ${show.premium?'<span class="premium-chip">PREMIUM</span>':''}
      </div>
      <button class="episode-play" ${playable?'':'disabled'} data-episode-title="${safe(title)}" data-episode-number="${ep.number}" data-episode-season="${season.number}" aria-label="${playable?'Play':'Locked'} episode ${ep.number}">
        <span class="${playable?'play-symbol':'lock-symbol'}" aria-hidden="true">${playable?'':'⌕'}</span>
        <span class="episode-action-label">${state}</span>
      </button>
    </article>`;
  }).join("");

  $$(".episode-play").forEach(btn=>btn.onclick=()=>{
    if(btn.disabled){
      if(show.premium && !isPremium())requirePremium();
      else showToast("This episode is not connected yet.","error");
      return;
    }
    $("#modal").classList.add("hidden");
    play(title,Number(btn.dataset.episodeNumber),Number(btn.dataset.episodeSeason));
  });
}
function isPremium(){
  return membership.plan==="premium" && membership.status==="active";
}

function requirePremium(){
  if(!user){
    showSection("account");
    setAccountMessage("Sign in first to access Premium content.","error");
    return false;
  }
  if(!isPremium()){
    showSection("account");
    setAccountMessage("Premium content is $4.99/month. Upgrade to watch this show or episode.","error");
    return false;
  }
  return true;
}

function episodeFor(title,episode=1,season=1){
  const show=SHOWS[title]||SHOWS.HoodGods;
  return show.seasons.find(s=>s.number===Number(season))?.episodes.find(e=>e.number===Number(episode));
}

function play(title="HoodGods",episode=1,season=1){
  activeTitle=title;
  const show=SHOWS[title]||SHOWS.HoodGods;
  if(show.premium && !requirePremium())return;

  const ep=episodeFor(title,episode,season);
  if(show.premium && !ep?.video){
    showToast("This episode is listed, but its video source has not been connected yet.","error");
    return;
  }

  const label=ep?`${title} — S${season} E${episode} · ${ep.title}`:title;
  $("#playerTitle").textContent=label;
  $("#playerHeading").textContent=label;

  const playerArt=$("#playerArt");
  if(playerArt){playerArt.src=show.image||"hoodgods-thumbnail.png";playerArt.alt=title;}

  const video=$("#playerVideo");
  const placeholder=$("#playerPlaceholder");
  const playerNote=$("#playerNote");

  if(video){
    video.pause();
    video.removeAttribute("src");
    video.load();
    if(ep?.video){
      video.src=ep.video;
      video.classList.remove("hidden");
      placeholder?.classList.add("video-active");
      if(playerNote)playerNote.textContent="Premium playback";
    }else{
      video.classList.add("hidden");
      placeholder?.classList.remove("video-active");
      if(playerNote)playerNote.textContent="Episode playback will start here when video hosting is connected.";
    }
  }

  $("#player").classList.remove("hidden");
  document.body.style.overflow="hidden";

  if(video && ep?.video){
    video.play().catch(()=>{});
    video.addEventListener("timeupdate",()=>{
      if(video.duration)saveHistory(title,video.currentTime,video.duration,video.ended);
    },{once:false});
  }
}
async function closePlayer(){
  const video=$("#playerVideo");
  if(video){video.pause();video.removeAttribute("src");video.load();}
  $("#player").classList.add("hidden");
  document.body.style.overflow="";
}

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
  const {data,error}=await supabase.from("user_library").select("id,title,created_at").eq("user_id",user.id).order("created_at",{ascending:false});
  if(error){console.error("My List read error:",error);return []}
  return data||[];
}

async function refreshSavedState(title){
  if(!supabase||!user)return;
  const {data,error}=await supabase.from("user_library")
    .select("id")
    .eq("user_id",user.id)
    .eq("title",title)
    .order("id",{ascending:true})
    .limit(1);
  if(!error)updateListButtons(title,Boolean(data?.length));
}

function updateListButtons(title,saved){
  $$(`[data-list-title="${CSS.escape(title)}"]`).forEach(btn=>{
    btn.classList.toggle("saved",saved);
    const span=btn.querySelector("span");
    if(span)span.textContent=saved?"In Library":"Add to Library";
  });
}

async function toggleList(title="HoodGods"){
  if(!supabase){
    showToast("UrbanAnimeTv is not connected to Supabase. Check config.js.","error");
    showSection("account");
    setAccountMessage("Supabase is not connected. Check config.js.","error");
    return;
  }
  if(!user){
    showToast("Sign in or create a free account first.","error");
    showSection("account");
    setAccountMessage("Sign in or create a free account first, then tap Add to Library.","error");
    return;
  }

  const buttons=$$(`[data-list-title="${CSS.escape(title)}"]`);
  buttons.forEach(b=>b.disabled=true);

  try{
    const {data,error:selectError}=await supabase
      .from("user_library")
      .select("id")
      .eq("user_id",user.id)
      .eq("title",title)
      .order("id",{ascending:true})
      .limit(1);

    if(selectError)throw selectError;

    const existing=data?.[0]||null;

    if(existing){
      const {error}=await supabase
        .from("user_library")
        .delete()
        .eq("id",existing.id)
        .eq("user_id",user.id);
      if(error)throw error;

      updateListButtons(title,false);
      showToast(`${title} removed from your Library.`);
      setAccountMessage(`${title} removed from your Library.`,"success");
    }else{
      const {error}=await supabase
        .from("user_library")
        .insert({
          user_id:user.id,
          title
        });

      if(error)throw error;

      updateListButtons(title,true);
      showToast(`${title} added to your Library.`);
      setAccountMessage(`${title} added to your Library.`,"success");
    }

    await renderList();
    await refreshProfileDrawerCounts();
  }catch(err){
    console.error("Library error:",err);
    const message=err?.message||"Could not update your Library.";
    showToast(`Library error: ${message}`,"error");
    setAccountMessage(`Library error: ${message}`,"error");
  }finally{
    buttons.forEach(b=>b.disabled=false);
  }
}

async function renderList(){
  const box=$("#myListContent");if(!box)return;
  if(!user||!supabase){box.innerHTML='<div class="empty"><h3>Sign in to use your Saved Library</h3><p>Your saved shows and movies are tied to your account.</p></div>';return;}
  const data=await getList();
  if(!data.length){box.innerHTML='<div class="empty"><h3>Your library is empty</h3><p>Add a show or movie with + My List and it will appear here.</p></div>';Object.keys(SHOWS).forEach(t=>updateListButtons(t,false));return;}
  box.innerHTML=data.map(x=>`
    <article class="library-card">
      ${showArt(x.title,x.title==="HoodGods"?"hood-cast-art":"ash-character-art")}
      <div class="library-card-body"><h3>${safe(x.title)}</h3><p>Saved to My List</p>
      <div class="library-card-actions"><button class="watch-btn" data-library-watch="${safe(x.title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch</span></button><button class="list-btn" data-remove-list="${safe(x.title)}">Remove</button></div></div>
    </article>`).join("");
  $$("[data-remove-list]").forEach(b=>b.onclick=()=>toggleList(b.dataset.removeList));
  $$("[data-library-watch]").forEach(b=>b.onclick=()=>play(b.dataset.libraryWatch));
  const titles=new Set(data.map(x=>x.title));Object.keys(SHOWS).forEach(t=>updateListButtons(t,titles.has(t)));
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

function renderLiveTV(selectedTitle=null){
  const box=$("#liveContent");
  if(!box)return;
  const liveTitles=Object.keys(SHOWS).filter(t=>SHOWS[t].live);

  box.innerHTML=`
    <div class="live-intro">
      <div><span class="live-badge"><i></i> LIVE CHANNELS</span><h3>Choose a channel</h3><p>Premium members can enter live channels and join a Watch Party from their profile.</p></div>
      <button class="list-btn" id="openWatchPartyFromLive">Watch Party</button>
    </div>
    <div class="live-grid">
      ${liveTitles.map(title=>{
        const show=SHOWS[title];
        const active=selectedTitle===title;
        return `<article class="live-card ${active?"active-channel":""}" data-live-card="${safe(title)}">
          <div class="live-art"><img src="${show.image}" alt="${safe(title)}"><span class="live-label">LIVE</span></div>
          <div class="live-info">
            <div class="live-card-title"><h4>${safe(title)}</h4><span class="premium-chip">PREMIUM</span></div>
            <p>Live TV channel</p>
            <div class="live-actions">
              <button class="watch-btn live-watch" data-live-title="${safe(title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch Live</span></button>
              <button class="list-btn live-party" data-party-title="${safe(title)}">Watch Party</button>
              <button class="list-btn live-library" data-list-title="${safe(title)}">＋ <span>Add to Library</span></button>
            </div>
          </div>
        </article>`;
      }).join("")}
    </div>`;

  $("#openWatchPartyFromLive")?.addEventListener("click",()=>showSection("watch-party"));

  $$(".live-watch").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    if(!requirePremium())return;
    openWatchParty(btn.dataset.liveTitle);
  });

  $$(".live-party").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    if(!requirePremium())return;
    openWatchParty(btn.dataset.partyTitle);
  });

  $$(".live-library").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    toggleList(btn.dataset.listTitle);
  });

  $$(".live-card").forEach(card=>card.onclick=e=>{
    if(e.target.closest("button"))return;
    openWatchParty(card.dataset.liveCard);
  });

  liveTitles.forEach(t=>refreshSavedState(t));
}

let watchPartyChannel=null;
let watchPartyTitle=null;
let watchPartySyncing=false;

function updatePartyViewerCount(count){
  const label=`${count} ${count===1?"viewer":"viewers"} watching live`;
  if($("#partyViewerCount"))$("#partyViewerCount").textContent=label;
  if($("#partyVideoCount"))$("#partyVideoCount").textContent=`${count} ${count===1?"watching":"watching"}`;
}

function getLiveVideoSource(title){
  const show=SHOWS[title];
  if(!show)return null;
  const season=show.seasons?.find(s=>s.episodes?.some(e=>e.video));
  const ep=season?.episodes?.find(e=>e.video);
  return ep?.video?{video:ep.video,season:season.number,episode:ep.number,episodeTitle:ep.title}:null;
}

async function loadWatchPartyRooms(){
  const box=$("#watchPartyRooms");
  if(!box)return;
  const liveTitles=Object.keys(SHOWS).filter(t=>SHOWS[t].live);
  box.innerHTML=liveTitles.map(title=>{
    const source=getLiveVideoSource(title);
    return `<article class="party-channel-card">
      <img src="${SHOWS[title].image}" alt="${safe(title)}">
      <div><span class="premium-chip">PREMIUM LIVE</span><h3>${safe(title)}</h3><p>${source?"Watch together in real time.":"Live video source coming soon."}</p></div>
      <button class="watch-btn" data-party-join="${safe(title)}">Watch</button>
    </article>`;
  }).join("");
  $$(`[data-party-join]`).forEach(b=>b.onclick=()=>openWatchParty(b.dataset.partyJoin));
}

async function openWatchParty(title){
  if(!SHOWS[title]?.live)return;
  if(!requirePremium())return;
  if(!supabase||!user){showSection("account");setAccountMessage("Sign in first to join a Watch Party.","error");return;}

  watchPartyTitle=title;
  $("#partyTitle").textContent=title;
  $("#liveChannelTitle")?.textContent=title;
  $("#partyCurrentArt").src=SHOWS[title]?.image||"urbananimetv-logo.png";
  $("#partyCurrentArt").alt=title;
  updatePartyViewerCount(0);
  $("#liveChannelStatus") && ($("#liveChannelStatus").textContent="Connecting to the live watch party…");
  showSection("watch-party");

  const video=$("#partyVideo");
  const wrap=$("#partyVideoWrap");
  const source=getLiveVideoSource(title);
  if(video){
    video.pause();
    video.removeAttribute("src");
    video.load();
    if(source){
      video.src=source.video;
      wrap?.classList.remove("hidden");
    }else{
      wrap?.classList.add("hidden");
    }
  }

  if(watchPartyChannel)try{await supabase.removeChannel(watchPartyChannel);}catch(_){}
  const channelName=`watch-party-${title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
  watchPartyChannel=supabase.channel(channelName,{config:{presence:{key:user.id},broadcast:{self:false}}});

  watchPartyChannel.on("presence",{event:"sync"},()=>{
    const state=watchPartyChannel.presenceState();
    const count=Object.keys(state).length;
    updatePartyViewerCount(count);
  });

  watchPartyChannel.on("broadcast",{event:"party-control"},({payload})=>{
    if(!payload||payload.title!==watchPartyTitle||!video)return;
    watchPartySyncing=true;
    try{
      if(payload.action==="play"){
        if(Number.isFinite(payload.time) && Math.abs((video.currentTime||0)-payload.time)>1.5)video.currentTime=payload.time;
        video.play().catch(()=>{});
      }else if(payload.action==="pause"){
        if(Number.isFinite(payload.time))video.currentTime=payload.time;
        video.pause();
      }else if(payload.action==="seek"){
        if(Number.isFinite(payload.time))video.currentTime=payload.time;
      }
    }finally{setTimeout(()=>watchPartySyncing=false,150);}
  });

  const sendControl=(action)=>{
    if(!watchPartyChannel||watchPartySyncing)return;
    watchPartyChannel.send({type:"broadcast",event:"party-control",payload:{title:watchPartyTitle,action,time:Number(video?.currentTime||0)}}).catch(()=>{});
  };
  if(video){
    video.onplay=()=>sendControl("play");
    video.onpause=()=>sendControl("pause");
    video.onseeked=()=>sendControl("seek");
  }

  watchPartyChannel.subscribe(async status=>{
    if(status==="SUBSCRIBED"){
      await watchPartyChannel.track({user_id:user.id,display_name:profile.display_name||user.email||"Viewer",joined_at:new Date().toISOString()});
      $("#liveChannelStatus") && ($("#liveChannelStatus").textContent=source?"Connected. Everyone in this party watches the same live player.":"Connected. This channel's live video source is not connected yet.");
      if(source&&video){
        setTimeout(()=>video.play().catch(()=>{}),150);
      }
    }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){
      $("#liveChannelStatus") && ($("#liveChannelStatus").textContent="Could not connect to the live party. Try again.");
    }
  });
}

async function leaveWatchParty(){
  const video=$("#partyVideo");
  if(video){video.pause();video.onplay=null;video.onpause=null;video.onseeked=null;video.removeAttribute("src");video.load();}
  $("#partyVideoWrap")?.classList.add("hidden");
  if(watchPartyChannel&&supabase){try{await supabase.removeChannel(watchPartyChannel);}catch(_){}
  }
  watchPartyChannel=null;
  watchPartyTitle=null;
  updatePartyViewerCount(0);
}

function setAccountMessage(text,type=""){const x=$("#accountMessage");if(x){x.textContent=text;x.className=`account-message ${type}`.trim();}}
async function loadMembership(){
  membership={plan:"free",status:"active"};
  if(!supabase||!user){updateMembershipUI();return;}
  try{
    const {data,error}=await supabase.from("memberships")
      .select("plan,status,current_period_end")
      .eq("user_id",user.id)
      .limit(1);
    if(error)throw error;
    if(data?.[0])membership=data[0];
  }catch(err){
    console.warn("Membership read:",err);
  }
  updateMembershipUI();
}

function updateMembershipUI(){
  const plan=$("#membershipPlan"), badge=$("#membershipBadge"), text=$("#membershipText"), btn=$("#upgradeBtn");
  if(!plan||!badge||!text||!btn)return;
  const premium=membership.plan==="premium" && membership.status==="active";
  plan.textContent=premium?"Premium":"Free Plan";
  badge.textContent=premium?"PREMIUM":"FREE";
  badge.classList.toggle("premium",premium);
  text.textContent=premium?"You have access to UrbanAnimeTv premium content.":"Unlock premium shows and episodes for $4.99/month.";
  btn.disabled=premium;
  btn.classList.toggle("active",premium);
  btn.innerHTML=premium?'Premium Active <span aria-hidden="true">✓</span>':'Upgrade to Premium <span aria-hidden="true">›</span>';
  updateProfileDrawer();
}


async function startPremiumCheckout(){
  if(!supabase){
    showSection("account");
    setAccountMessage("UrbanAnimeTv is not connected to Supabase. Check config.js.","error");
    return;
  }
  if(!user){
    showSection("account");
    setAccountMessage("Sign in or create a free account first, then upgrade to Premium.","error");
    return;
  }
  if(membership.plan==="premium" && membership.status==="active")return;

  const btn=$("#upgradeBtn");
  if(btn){btn.disabled=true;btn.innerHTML='Opening secure checkout <span aria-hidden="true">…</span>';}
  try{
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { email: user.email || "" }
    });
    if(error){
      let detail="Could not start checkout.";
      try{
        const ctx=error.context;
        if(ctx?.json){const payload=await ctx.json();detail=payload?.error||detail;}
      }catch(_){}
      throw new Error(detail);
    }
    if(!data?.url)throw new Error("Stripe did not return a checkout URL.");
    window.location.href=data.url;
  }catch(err){
    console.error("Premium checkout:",err);
    showToast(err.message||"Could not start Premium checkout.","error");
    setAccountMessage(err.message||"Could not start Premium checkout. Please try again.","error");
    updateMembershipUI();
  }
}


async function openPaymentMethods(){
  if(!supabase||!user){
    showSection("account");
    setProfileMessage("Sign in first to manage your payment method.","error");
    return;
  }
  const btn=$("#paymentMethodBtn");
  if(btn){btn.disabled=true;btn.textContent="Opening secure billing…";}
  try{
    const {data,error}=await supabase.functions.invoke("create-customer-portal",{
      body:{return_url:"https://urbananimetv.pages.dev/?billing=return"}
    });
    if(error){
      let detail="Could not open secure billing.";
      try{if(error.context?.json){const p=await error.context.json();detail=p?.error||detail;}}catch(_){}
      throw new Error(detail);
    }
    if(!data?.url)throw new Error("Stripe did not return a billing portal URL.");
    window.location.href=data.url;
  }catch(err){
    console.error("Billing portal:",err);
    setProfileMessage(err.message||"Could not open secure billing. Please try again.","error");
  }finally{
    if(btn){btn.disabled=false;btn.textContent="Manage Payment Method";}
  }
}

function setProfileMessage(text,type=""){const x=$("#profileMessage");if(x){x.textContent=text;x.className=`account-message ${type}`.trim();}}

function setTopAvatar(url){
  const wrap=$("#accountAvatarTop");
  if(!wrap)return;
  if(url)wrap.innerHTML=`<img class="account-avatar-img" src="${safe(url)}" alt="Profile">`;
  else wrap.textContent="●";
}

async function loadProfile(){
  if(!user||!supabase)return;
  const meta=user.user_metadata||{};
  let data={display_name:meta.display_name||"",avatar_url:meta.avatar_url||""};

  // Keep the profile table in sync when available, but never make it a blocker
  // for the user's picture/name. Auth metadata is the primary profile store.
  try{
    const {data:row}=await supabase.from("profiles")
      .select("display_name,avatar_url")
      .eq("user_id",user.id)
      .maybeSingle();
    if(row){
      data.display_name=row.display_name||data.display_name||"";
      data.avatar_url=row.avatar_url||data.avatar_url||"";
    }
  }catch(err){
    console.warn("Profile table read skipped:",err);
  }

  profile=data;
  $("#displayName").value=profile.display_name||"";
  $("#profilePreview").src=profile.avatar_url||"urbananimetv-logo.png";
  $("#profileAvatar").src=profile.avatar_url||"urbananimetv-logo.png";
  setTopAvatar(profile.avatar_url);
}

async function saveProfile(){
  if(!user||!supabase)return;
  const displayName=$("#displayName").value.trim();
  try{
    const {data,error}=await supabase.auth.updateUser({
      data:{display_name:displayName,avatar_url:profile.avatar_url||""}
    });
    if(error)throw error;
    user=data.user||user;
    profile.display_name=displayName;
    $("#accountStatus").textContent=displayName||user.email||"Signed in";
    try{
      await supabase.from("profiles").upsert({
        user_id:user.id,
        display_name:displayName,
        avatar_url:profile.avatar_url||"",
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
    }catch(err){console.warn("Profile table sync skipped:",err);}
    setProfileMessage("Profile saved.","success");
  }catch(err){
    setProfileMessage(`Could not save your profile: ${err.message||"Please try again."}`,"error");
  }
}

async function uploadAvatar(file){
  if(!user||!supabase||!file)return;
  if(file.size>10*1024*1024){setProfileMessage("Please choose an image under 10 MB.","error");return;}
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)){setProfileMessage("Please use PNG, JPG or WEBP.","error");return;}
  setProfileMessage("Preparing profile picture...");
  try{
    const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          const size=256,canvas=document.createElement("canvas");
          canvas.width=size;canvas.height=size;
          const ctx=canvas.getContext("2d");
          ctx.fillStyle="#050505";ctx.fillRect(0,0,size,size);
          const scale=Math.max(size/img.width,size/img.height);
          const w=img.width*scale,h=img.height*scale;
          ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
          resolve(canvas.toDataURL("image/jpeg",0.72));
        };
        img.onerror=()=>reject(new Error("Image could not be read."));
        img.src=reader.result;
      };
      reader.onerror=()=>reject(new Error("File could not be read."));
      reader.readAsDataURL(file);
    });

    // Store the compressed avatar in Supabase Auth metadata. This avoids
    // Storage-bucket RLS issues and makes the avatar available on sign-in.
    const {data,error}=await supabase.auth.updateUser({
      data:{display_name:profile.display_name||"",avatar_url:dataUrl}
    });
    if(error)throw error;

    user=data.user||user;
    profile.avatar_url=dataUrl;
    $("#profilePreview").src=dataUrl;
    $("#profileAvatar").src=dataUrl;
    setTopAvatar(dataUrl);

    // Best-effort mirror to the profiles table. The picture is already saved
    // to Auth metadata, so a table-policy issue won't break the upload.
    try{
      await supabase.from("profiles").upsert({
        user_id:user.id,
        display_name:profile.display_name||"",
        avatar_url:dataUrl,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
    }catch(err){console.warn("Profile table avatar sync skipped:",err);}

    setProfileMessage("Profile picture updated.","success");
  }catch(err){
    console.error("Avatar update:",err);
    setProfileMessage(`Could not update the profile picture: ${err.message||"Please try another image."}`,"error");
  }
}


async function getNotificationState(title){
  if(!supabase||!user)return false;
  try{
    const {data,error}=await supabase.from("show_notifications")
      .select("id,enabled")
      .eq("user_id",user.id)
      .eq("title",title)
      .maybeSingle();
    if(error)throw error;
    return !!data?.enabled;
  }catch(err){
    console.warn("Notification state read:",err);
    return false;
  }
}

function updateNotifyButton(title,enabled){
  const btn=$("#modalNotify");
  if(!btn)return;
  btn.dataset.notifyTitle=title;
  btn.classList.toggle("saved",enabled);
  btn.setAttribute("aria-pressed",enabled?"true":"false");
  const label=btn.querySelector(".notify-label");
  if(label)label.textContent=enabled?"Notifications On":"Notify Me";
  btn.title=enabled?"Turn off notifications":"Get notifications for this show";
}

async function toggleShowNotifications(title){
  if(!supabase){
    setAccountMessage("Supabase is not connected. Check config.js.","error");
    return;
  }
  if(!user){
    showSection("account");
    setAccountMessage("Sign in or create a free account first to turn on show notifications.","error");
    return;
  }

  const btn=$("#modalNotify");
  if(btn)btn.disabled=true;

  try{
    const enabled=await getNotificationState(title);
    if(enabled){
      const {error}=await supabase.from("show_notifications").delete()
        .eq("user_id",user.id).eq("title",title);
      if(error)throw error;
      updateNotifyButton(title,false);
      setAccountMessage(`${title} notifications turned off.`,"success");
    }else{
      const {error}=await supabase.from("show_notifications").upsert({
        user_id:user.id,
        title,
        enabled:true,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id,title"});
      if(error)throw error;
      updateNotifyButton(title,true);
      setAccountMessage(`You'll be notified when ${title} has a new episode or season.`,"success");

      // Ask for browser notification permission only after the user explicitly
      // taps the bell. The preference is still saved even if permission is denied.
      if("Notification" in window && Notification.permission==="default"){
        try{await Notification.requestPermission();}catch(_){}
      }
    }
  }catch(err){
    console.error("Show notification error:",err);
    setAccountMessage(`Notification error: ${err.message||"Could not update notifications."}`,"error");
  }finally{
    if(btn)btn.disabled=false;
  }
}


function updateProfileDrawer(){
  const wrap=$("#profileDrawer");
  if(!wrap)return;
  const signed=Boolean(user);
  const name=profile.display_name||"Your Account";
  const email=user?.email||"";
  const premium=membership.plan==="premium" && membership.status==="active";
  $("#drawerName").textContent=signed?name:"Sign In";
  $("#drawerEmail").textContent=signed?email:"Sign in to your account";
  $("#drawerAvatar").src=profile.avatar_url||"urbananimetv-logo.png";
  $("#drawerPlan").textContent=premium?"Premium":"Free";
  $("#drawerPlanBadge").textContent=premium?"PREMIUM":"FREE";
  $("#drawerPlanBadge").classList.toggle("premium",premium);
  $("#drawerUpgrade").classList.toggle("hidden",premium||!signed);
  $("#drawerSignIn").classList.toggle("hidden",signed);
  $("#drawerSignOut").classList.toggle("hidden",!signed);
}

async function refreshProfileDrawerCounts(){
  if(!user||!supabase){
    $("#drawerLibraryCount").textContent="Sign in to view your library";
    $("#drawerHistoryCount").textContent="Sign in to view your history";
    return;
  }
  const [library,history]=await Promise.all([getList(),getHistory()]);
  const lc=library.length, hc=history.length;
  $("#drawerLibraryCount").textContent=lc===1?"1 saved title":`${lc} saved titles`;
  $("#drawerHistoryCount").textContent=hc===1?"1 title watched":`${hc} titles watched`;
  const partyCount=Object.keys(SHOWS).filter(t=>SHOWS[t].live).length;
  $("#drawerPartyCount").textContent=`${partyCount} live channels`;
}

async function openProfileDrawer(){
  await loadMembership();
  updateProfileDrawer();
  await refreshProfileDrawerCounts();
  const wrap=$("#profileDrawer");
  wrap.classList.remove("hidden");
  requestAnimationFrame(()=>wrap.classList.add("open"));
  wrap.setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
}
function closeProfileDrawer(){
  const wrap=$("#profileDrawer");
  if(!wrap)return;
  wrap.classList.remove("open");
  wrap.setAttribute("aria-hidden","true");
  document.body.classList.remove("drawer-open");
  setTimeout(()=>wrap.classList.add("hidden"),220);
}

function accountUI(){
  const signed=Boolean(user);
  $("#accountTitle").textContent=signed?(profile.display_name||"Your Account"):(signup?"Create Account":"Sign In");
  $("#accountStatus").textContent=signed?(profile.display_name||user.email||"Signed in"):"Create a free UrbanAnimeTv account to save shows and keep your library private.";
  $("#authBox").classList.toggle("hidden",signed);
  $("#profileSettings").classList.toggle("hidden",!signed);
  if(!signed){$("#accountSubmit").textContent=signup?"Create Account":"Sign In";}
  updateProfileDrawer();
}

function initHeroCarousel(){
  const hero=$("#heroCarousel");if(!hero)return;
  $$(".hero-watch").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(b.dataset.heroLive==="true"){
      showSection("live-tv");
      return;
    }
    play(b.dataset.heroTitle);
  });
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
  $("#accountBtn").onclick=openProfileDrawer;
  $("#profileDrawerClose").onclick=closeProfileDrawer;
  $("#profileDrawerX").onclick=closeProfileDrawer;
  $("#drawerLibrary").onclick=()=>{closeProfileDrawer();showSection("my-list");};
  $("#drawerHistory").onclick=()=>{closeProfileDrawer();showSection("watch-history");};
  $("#drawerWatchParty").onclick=()=>{closeProfileDrawer();showSection("watch-party");};
  $("#drawerAccount").onclick=()=>{closeProfileDrawer();showSection("account");};
  $("#profileWatchPartyBtn").onclick=()=>{showSection("watch-party");};
  $("#drawerUpgrade").onclick=startPremiumCheckout;
  $("#drawerSignIn").onclick=()=>{closeProfileDrawer();showSection("account");};
  $("#drawerSignOut").onclick=()=>$("#signOut").click();
  $("#signupToggle").onclick=()=>{signup=!signup;accountUI();};
  $("#accountForm").onsubmit=async e=>{
    e.preventDefault();setAccountMessage("Working...");
    if(!supabase){setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
    const email=$("#email").value.trim(),password=$("#password").value;
    const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
    if(r.error){setAccountMessage(r.error.message,"error");return;}
    if(signup&&!r.data.session){setAccountMessage("Account created. Check your email if confirmation is required.","success");return;}
    user=r.data.user;await loadProfile();await loadMembership();accountUI();setAccountMessage("Signed in successfully.","success");await renderList();await renderHistory();await renderContinue();await refreshProfileDrawerCounts();
  };
  $("#signOut").onclick=async()=>{closeProfileDrawer();if(supabase)await supabase.auth.signOut();user=null;profile={display_name:"",avatar_url:""};setTopAvatar("");accountUI();await renderContinue();showHome();};
  $("#historyBtn").onclick=()=>showSection("watch-history");
  $("#saveProfile").onclick=saveProfile;
  $("#upgradeBtn").onclick=startPremiumCheckout;
  $("#paymentMethodBtn").onclick=openPaymentMethods;
  $("#avatarInput").onchange=e=>uploadAvatar(e.target.files?.[0]);
  $("#leaveWatchParty").onclick=async()=>{await leaveWatchParty();showSection("live-tv");};
  $("#closePlayer").onclick=closePlayer;
  $("#modalWatch").onclick=()=>{
    const show=SHOWS[activeTitle]||SHOWS.HoodGods;
    $("#modal").classList.add("hidden");
    if(show.live){showSection("live-tv");setTimeout(()=>openWatchParty(activeTitle),80);}
    else play(activeTitle,1,1);
  };
  $("#modalNotify").onclick=()=>toggleShowNotifications(activeTitle);
  $("#seasonSelect").onchange=e=>renderEpisodes(activeTitle,Number(e.target.value));
  $("#thumbUp").onclick=()=>setRating(activeTitle,"up");
  $("#thumbDown").onclick=()=>setRating(activeTitle,"down");
  $$("[data-close]").forEach(x=>x.onclick=()=>$("#modal").classList.add("hidden"));

  $$(".wide-card").forEach(card=>{if(card.classList.contains("continue-card"))return;card.onclick=()=>openDetails(card.dataset.title);});
  $("#searchBtn").onclick=()=>{$("#search").classList.remove("hidden");setTimeout(()=>$("#searchInput").focus(),50);};
  $("#closeSearch").onclick=$("#searchX").onclick=()=>$("#search").classList.add("hidden");
  $("#searchInput").oninput=e=>{
    const q=e.target.value.trim().toLowerCase(),titles=Object.keys(SHOWS),found=q?titles.filter(x=>x.toLowerCase().includes(q)):[];
    $("#results").innerHTML=found.map(x=>`<div class="result" data-r="${safe(x)}"><strong>${safe(x)}</strong><small>${SHOWS[x]?.premium?"Premium":"UrbanAnimeTv"}${SHOWS[x]?.live?" • Live TV":""}</small></div>`).join("")||(q?"<p style='color:#777;padding:15px'>No titles found.</p>":"");
    $$(".result").forEach(x=>x.onclick=()=>{$("#search").classList.add("hidden");openDetails(x.dataset.r);});
  };
  $$("[data-see-all]").forEach(btn=>btn.onclick=()=>showSection(btn.dataset.seeAll==="continue"?"watch-history":"series"));
  $$('nav[aria-label="Primary navigation"] a').forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.nav);});
  $$('[data-bottom-nav]').forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.bottomNav);});
  $$("footer a").forEach(a=>a.onclick=e=>{if(a.getAttribute("href")==="#home"){e.preventDefault();showHome();}});
  accountUI();
  renderLiveTV();
  loadWatchPartyRooms();
}

async function auth(){
  if(!supabase){await renderContinue();return;}
  const s=await supabase.auth.getSession();user=s.data.session?.user||null;
  if(user)await loadProfile();
  await loadMembership();
  accountUI();
  if(user){await renderList();await renderHistory();await renderContinue();}
  supabase.auth.onAuthStateChange(async(_e,s)=>{
    user=s?.user||null;
    if(user)await loadProfile();else{profile={display_name:"",avatar_url:""};membership={plan:"free",status:"active"};setTopAvatar("");}
    await loadMembership();
    accountUI();if(user){await renderList();await renderHistory();if(!$("#modal").classList.contains("hidden"))await loadRating(activeTitle);}else{Object.keys(SHOWS).forEach(t=>updateListButtons(t,false));paintRating(null);}
    await renderContinue();
    await refreshProfileDrawerCounts();
    updateProfileDrawer();
  });
}


const checkoutState = new URLSearchParams(window.location.search).get("checkout");
if (checkoutState === "success") {
  setTimeout(() => showToast("Payment completed. Your Premium access will update after Stripe confirms the subscription.", "success"), 500);
  window.history.replaceState({}, "", window.location.pathname);
} else if (checkoutState === "cancelled") {
  setTimeout(() => showToast("Checkout cancelled. No payment was made.", "error"), 500);
  window.history.replaceState({}, "", window.location.pathname);
}

init();auth();

document.addEventListener("click",e=>{
  const libraryButton=e.target.closest("[data-list-title]");
  if(libraryButton){
    e.preventDefault();
    e.stopPropagation();
    if(libraryButton.disabled)return;
    toggleList(libraryButton.dataset.listTitle);
    return;
  }

  const b=e.target.closest("#modalNotify");
  if(b)toggleShowNotifications(activeTitle);
});


document.addEventListener("keydown",e=>{if(e.key==="Escape")closeProfileDrawer();});
