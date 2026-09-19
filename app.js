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
let activeProfile = {id:"default",name:"Main",type:"adult",pinHash:""};
let profileList = [];
const KIDS_SHOWS = new Set(["Just Jordan"]);

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
      {number:1,episodes:Array.from({length:15},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:i===0?`${VIDEO_BASE}/The%20PJs/The.PJs.s01e01.480p.mp4`:i===1?`${VIDEO_BASE}/The%20PJs/The.PJs.s01e02.480p.mp4`:i===2?`${VIDEO_BASE}/The%20PJs/The.PJs.s01e03.480p.mp4`:null}))},
      {number:2,episodes:Array.from({length:15},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:null}))},
      {number:3,episodes:Array.from({length:13},(_,i)=>({number:i+1,title:`Episode ${i+1}`,description:"Premium episode",video:null}))}
    ]
  },
  "The Boondocks": {
    type:"series", premium:true, live:true, channel:true,
    description:"The Boondocks — sharp social commentary, family conflict and life through the eyes of two brothers.",
    image:"boondocks-thumbnail.jpg",
    seasons:[{number:1,episodes:[
      {number:1,title:"Episode 1",description:"The Boondocks Season 1 Episode 1.",video:`${VIDEO_BASE}/The%20Boondocks/The.Boondocks.s01e01.1080p.mp4?v=20260915-1080p-full`},
      {number:2,title:"Episode 2",description:"The Boondocks Season 1 Episode 2.",video:`${VIDEO_BASE}/The%20Boondocks/The.Boondocks.s01e02.1080p.mp4?v=20260915-s1e2`},
      {number:3,title:"Episode 3",description:"The Boondocks Season 1 Episode 3.",video:`${VIDEO_BASE}/The%20Boondocks/The.Boondocks.s01e03.1080p.mp4?v=20260915-s1e3`},
      {number:6,title:"Episode 6",description:"The Boondocks Season 1 Episode 6.",video:`${VIDEO_BASE}/The%20Boondocks/The.Boondocks.s01e06.1080p.mp4?v=20260916-s1e6`}
    ]}]
  },
  "Afro Samurai": {
    type:"series", premium:true, live:true, channel:true,
    description:"Afro Samurai — a cinematic journey of revenge, honor and survival.",
    image:"afro-samurai-thumbnail.jpg",
    seasons:[{number:1,episodes:[
      {number:1,title:"Episode 1",description:"Afro Samurai Season 1 Episode 1.",video:`${VIDEO_BASE}/Afro%20Samurai/Afro.Samurai.S01E01.2007.DC.1080p.HEVC.H265.10-BIT.5.1.BONE.mp4`},
      {number:2,title:"Episode 2",description:"Afro Samurai Season 1 Episode 2.",video:`${VIDEO_BASE}/Afro%20Samurai/Afro.Samurai.S01E02.2007.DC.1080p.HEVC.H265.10-BIT.5.1.BONE.mp4`},
      {number:3,title:"Episode 3",description:"Afro Samurai Season 1 Episode 3.",video:`${VIDEO_BASE}/Afro%20Samurai/Afro.Samurai.S01E03.2007.DC.1080p.HEVC.H265.10-BIT.5.1.BONE.mp4`},
      {number:4,title:"Episode 4",description:"Afro Samurai Season 1 Episode 4.",video:`${VIDEO_BASE}/Afro%20Samurai/Afro.Samurai.S01E04.2007.DC.1080p.HEVC.H265.10-BIT.5.1.BONE.mp4`},
      {number:5,title:"Episode 5",description:"Afro Samurai Season 1 Episode 5.",video:`${VIDEO_BASE}/Afro%20Samurai/Afro.Samurai.S01E05.2007.DC.1080p.HEVC.H265.10-BIT.5.1.BONE.mp4`}
    ]}]
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
    seasons:[{number:1,episodes:[
      {number:1,title:"Episode 1",description:"Black Dynamite Season 1 Episode 1.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e01.1080p.bluray.x264-rovers.mkv`},
      {number:2,title:"Episode 2",description:"Black Dynamite Season 1 Episode 2.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e02.1080p.bluray.x264-rovers.mkv`},
      {number:3,title:"Episode 3",description:"Black Dynamite Season 1 Episode 3.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e03.1080p.bluray.x264-rovers.mkv`},
      {number:4,title:"Episode 4",description:"Black Dynamite Season 1 Episode 4.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e04.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:5,title:"Episode 5",description:"Black Dynamite Season 1 Episode 5.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e05.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:6,title:"Episode 6",description:"Black Dynamite Season 1 Episode 6.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e06.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:7,title:"Episode 7",description:"Black Dynamite Season 1 Episode 7.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e07.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:8,title:"Episode 8",description:"Black Dynamite Season 1 Episode 8.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e08.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:9,title:"Episode 9",description:"Black Dynamite Season 1 Episode 9.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e09.1080p.bluray.x264-rovers.mkv.mp4`},
      {number:10,title:"Episode 10",description:"Black Dynamite Season 1 Episode 10.",video:`${VIDEO_BASE}/Black%20Dynamite/black.dynamite.s01e10.1080p.bluray.x264-rovers.mkv.mp4`}
    ]}]
  },
  "The Cleveland Show": {
    type:"series", premium:true, live:true, channel:true,
    description:"The Cleveland Show — family, neighborhood life and comedy in Stoolbend.",
    image:"cleveland-show-thumbnail.jpg",
    seasons:[{number:1,episodes:[
      {number:1,title:"Pilot",description:"The Cleveland Show Season 1 Episode 1.",video:`${VIDEO_BASE}/The%20Cleveland%20Show/The.Cleveland.Show.S01E01.Pilot.1080p.WEB-DL.x265.10bit.AAC.5.1-1ME%5BUTR%5D.mkv.mp4`},
      {number:2,title:"Da Daggone Daddy-Daughter Dinner Dance",description:"The Cleveland Show Season 1 Episode 2.",video:`${VIDEO_BASE}/The%20Cleveland%20Show/The.Cleveland.Show.S01E02.Da.Daggone.Daddy-Daughter.Dinner.Dance.1080p.WEB-DL.x265.10bit.AAC.5.1-1ME%5BUTR%5D.mkv.mp4`}
    ]}]
  },
  "Just Jordan": {
    type:"series", premium:true, live:true, channel:true, kid:true,
    description:"Just Jordan — a young man navigating family, friendship, school and everyday life in South Los Angeles.",
    image:"just-jordan-thumbnail.png",
    seasons:[{number:1,episodes:[
      {number:1,title:"Episode 1",description:"Just Jordan Season 1 Episode 1.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E01.360p.mp4`},
      {number:2,title:"Episode 2",description:"Just Jordan Season 1 Episode 2.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E02.360p.mp4`},
      {number:3,title:"Episode 3",description:"Just Jordan Season 1 Episode 3.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E03.360p.mp4`},
      {number:4,title:"Episode 4",description:"Just Jordan Season 1 Episode 4.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E04.360p.mp4`},
      {number:5,title:"Episode 5",description:"Just Jordan Season 1 Episode 5.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E05.360p.mp4`},
      {number:6,title:"Episode 6",description:"Just Jordan Season 1 Episode 6.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E06.360p.mp4`},
      {number:7,title:"Episode 7",description:"Just Jordan Season 1 Episode 7.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E07.360p.mp4`},
      {number:8,title:"Episode 8",description:"Just Jordan Season 1 Episode 8.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E08.360p.mp4`},
      {number:9,title:"Episode 9",description:"Just Jordan Season 1 Episode 9.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E09.360p.mp4`},
      {number:10,title:"Episode 10",description:"Just Jordan Season 1 Episode 10.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E10.360p.mp4`},
      {number:11,title:"Episode 11",description:"Just Jordan Season 1 Episode 11.",video:`${VIDEO_BASE}/Just%20Jordan/Just.Jordan.S01E11.360p.mp4`}
    ]}]
  },
  "Aqua Teen Hunger Force": {
    type:"series", premium:true, live:true, channel:true,
    description:"Aqua Teen Hunger Force — bizarre neighborhood comedy, chaos and late-night animated madness.",
    image:"aqua-teen-hunger-force-thumbnail.png",
    seasons:[{number:1,episodes:[
      {number:1,title:"Rabbot",description:"Aqua Teen Hunger Force Season 1 Episode 1.",video:`${VIDEO_BASE}/Aqua%20Teen%20Hunger%20Force/Aqua.Teen.Hunger.Force.S01E01.Rabbot.720p.mkv.mp4`},
      {number:2,title:"Escape from Leprechaunpolis",description:"Aqua Teen Hunger Force Season 1 Episode 2.",video:`${VIDEO_BASE}/Aqua%20Teen%20Hunger%20Force/Aqua.Teen.Hunger.Force.S01E02.Escape.from.Leprechaunpolis.720p.mkv.mp4`}
    ]}]
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
  if(isKidsProfile()){
    $$(".home-section,.page-section").forEach(x=>x.classList.add("hidden"));
    $("#kids-section")?.classList.remove("hidden");
    renderKidsSection();
    window.scrollTo({top:0,behavior:"smooth"});
    setActiveNav("home");
    return;
  }
  $$(".page-section").forEach(x=>x.classList.add("hidden"));
  $$(".home-section").forEach(x=>x.classList.remove("hidden"));
  renderContinue();
  window.scrollTo({top:0,behavior:"smooth"});
  setActiveNav("home");
}
function showSection(id){
  if(isKidsProfile() && !["home","kids-section","kids-series","my-list","live-tv","watch-party","watch-history","account"].includes(id)){showToast("This area is locked for the Kids profile.","error");return;}
  if(id==="home"){showHome();return;}
  $$(".home-section,.page-section").forEach(x=>x.classList.add("hidden"));
  const el=$("#"+id); if(el)el.classList.remove("hidden");
  if(id==="my-list")renderList();
  if(id==="kids-series")renderKidsSeries();
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
  if(isKidsProfile() && !isKidsAllowed(title)){showToast("This show is not available on UATV Kids.","error");return;}
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
  const modalLibrary=$("#modalLibrary");
  if(modalLibrary){
    modalLibrary.dataset.listTitle=title;
    modalLibrary.innerHTML=`＋ <span>Add to Library</span>`;
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

  $$(".episode-play").forEach(btn=>btn.onclick=e=>{e.stopPropagation();
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
  return String(membership?.plan||"").trim().toLowerCase()==="premium"
    && String(membership?.status||"").trim().toLowerCase()==="active";
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

function getPlayableEpisodes(title,seasonNumber=1){
  const show=SHOWS[title];
  const season=show?.seasons?.find(s=>s.number===Number(seasonNumber));
  return season?.episodes?.filter(ep=>Boolean(ep.video))||[];
}

function getNextPlayableEpisode(title,seasonNumber,episodeNumber){
  const episodes=getPlayableEpisodes(title,seasonNumber);
  const index=episodes.findIndex(ep=>ep.number===Number(episodeNumber));
  if(index>=0 && episodes[index+1])return {season:Number(seasonNumber),episode:episodes[index+1].number};
  const show=SHOWS[title];
  const nextSeason=show?.seasons?.find(s=>s.number===Number(seasonNumber)+1 && s.episodes?.some(ep=>ep.video));
  if(nextSeason){
    const first=nextSeason.episodes.find(ep=>ep.video);
    if(first)return {season:nextSeason.number,episode:first.number};
  }
  return null;
}

function getPreviousPlayableEpisode(title,seasonNumber,episodeNumber){
  const episodes=getPlayableEpisodes(title,seasonNumber);
  const index=episodes.findIndex(ep=>ep.number===Number(episodeNumber));
  if(index>0)return {season:Number(seasonNumber),episode:episodes[index-1].number};
  const show=SHOWS[title];
  const previousSeason=show?.seasons?.find(s=>s.number===Number(seasonNumber)-1 && s.episodes?.some(ep=>ep.video));
  if(previousSeason){
    const list=previousSeason.episodes.filter(ep=>ep.video);
    const last=list[list.length-1];
    if(last)return {season:previousSeason.number,episode:last.number};
  }
  return null;
}

function ensureEpisodeNavigationButtons(){
  const meta=document.querySelector('.player-meta');
  if(!meta)return null;
  let box=document.getElementById('playerEpisodeControls');
  if(!box){
    box=document.createElement('div');
    box.id='playerEpisodeControls';
    box.style.display='flex';
    box.style.flexWrap='wrap';
    box.style.gap='10px';
    box.style.marginTop='14px';
    let prev=document.createElement('button');
    prev.id='playerPreviousEpisode'; prev.type='button'; prev.className='list-btn'; prev.textContent='← Previous Episode';
    let next=document.createElement('button');
    next.id='playerNextEpisode'; next.type='button'; next.className='watch-btn'; next.textContent='Next Episode →';
    box.append(prev,next); meta.appendChild(box);
    prev.addEventListener('click',()=>{const x=prev._previousEpisode;if(x)play(prev.dataset.title,x.episode,x.season);});
    next.addEventListener('click',()=>{const x=next._nextEpisode;if(x)play(next.dataset.title,x.episode,x.season);});
  }
  return {box,prev:document.getElementById('playerPreviousEpisode'),next:document.getElementById('playerNextEpisode')};
}

function updateEpisodeNavigationButtons(title,season,episode){
  const controls=ensureEpisodeNavigationButtons();
  if(!controls)return;
  const previous=getPreviousPlayableEpisode(title,season,episode);
  const next=getNextPlayableEpisode(title,season,episode);
  controls.prev._previousEpisode=previous; controls.prev.dataset.title=title;
  controls.next._nextEpisode=next; controls.next.dataset.title=title;
  controls.prev.disabled=!previous; controls.next.disabled=!next;
  controls.prev.classList.toggle('hidden',!previous);
  controls.next.classList.toggle('hidden',!next);
  if(previous)controls.prev.textContent=`← Previous Episode · S${previous.season} E${previous.episode}`;
  if(next)controls.next.textContent=`Next Episode → S${next.season} E${next.episode}`;
}

function ensureWatchPartyEpisodeControls(){
  const current=document.querySelector('.party-current');
  if(!current)return null;
  let box=document.getElementById('partyEpisodeControls');
  if(!box){
    box=document.createElement('div');
    box.id='partyEpisodeControls';
    box.style.marginTop='16px';
    box.style.display='flex';
    box.style.flexWrap='wrap';
    box.style.gap='10px';
    box.innerHTML=`<label style="width:100%;font-weight:700">Choose Episode</label><select id="partyEpisodeSelect" aria-label="Choose episode" style="min-width:220px;padding:10px;border-radius:10px;background:#181818;color:#fff;border:1px solid #444"></select><button id="partyPreviousEpisode" class="list-btn" type="button">← Previous</button><button id="partyNextEpisode" class="watch-btn" type="button">Next Episode →</button>`;
    const anchor=document.getElementById('partyVideoWrap');
    current.insertBefore(box,anchor||null);
    $('#partyEpisodeSelect').addEventListener('change',e=>{
      const n=Number(e.target.value);
      if(Number.isFinite(n))changeWatchPartyEpisode(watchPartySeason,n,true);
    });
    $('#partyPreviousEpisode').addEventListener('click',()=>{
      const prev=getPreviousPlayableEpisode(watchPartyTitle,watchPartySeason,watchPartyEpisode);
      if(prev)changeWatchPartyEpisode(prev.season,prev.episode,true);
    });
    $('#partyNextEpisode').addEventListener('click',()=>{
      const next=getNextPlayableEpisode(watchPartyTitle,watchPartySeason,watchPartyEpisode);
      if(next)changeWatchPartyEpisode(next.season,next.episode,true);
    });
  }
  return box;
}

function renderWatchPartyEpisodeControls(title,seasonNumber=1,episodeNumber=1){
  const box=ensureWatchPartyEpisodeControls();
  if(!box)return;
  const episodes=getPlayableEpisodes(title,seasonNumber);
  const select=$('#partyEpisodeSelect');
  const prev=$('#partyPreviousEpisode');
  const next=$('#partyNextEpisode');
  if(!select)return;
  select.innerHTML=episodes.map(ep=>`<option value="${ep.number}">S${seasonNumber} E${ep.number} — ${safe(ep.title)}</option>`).join('');
  if(!episodes.some(ep=>ep.number===Number(episodeNumber))){
    episodeNumber=episodes[0]?.number||1;
  }
  select.value=String(episodeNumber);
  const previous=getPreviousPlayableEpisode(title,seasonNumber,episodeNumber);
  const following=getNextPlayableEpisode(title,seasonNumber,episodeNumber);
  if(prev)prev.disabled=!previous;
  if(next)next.disabled=!following;
}

function setWatchPartyVideo(seasonNumber,episodeNumber,announce=true){
  const video=$('#partyVideo');
  const ep=episodeFor(watchPartyTitle,episodeNumber,seasonNumber);
  if(!video||!ep?.video)return false;
  watchPartySeason=Number(seasonNumber);
  watchPartyEpisode=Number(episodeNumber);
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.src=ep.video;
  $('#partyVideoWrap')?.classList.remove('hidden');
  if($('#partyTitle'))$('#partyTitle').textContent=`${watchPartyTitle} — S${watchPartySeason} E${watchPartyEpisode}`;
  if($('#liveChannelStatus'))$('#liveChannelStatus').textContent=`Watching S${watchPartySeason} E${watchPartyEpisode} together.`;
  renderWatchPartyEpisodeControls(watchPartyTitle,watchPartySeason,watchPartyEpisode);
  if(announce&&watchPartyChannel&&!watchPartySyncing){
    watchPartyChannel.send({type:'broadcast',event:'party-control',payload:{title:watchPartyTitle,action:'episode',season:watchPartySeason,episode:watchPartyEpisode,time:0}}).catch(()=>{});
  }
  video.play().catch(()=>{});
  return true;
}

function changeWatchPartyEpisode(seasonNumber,episodeNumber,announce=true){
  if(!setWatchPartyVideo(seasonNumber,episodeNumber,announce))return;
}

function play(title="HoodGods",episode=1,season=1){
  if(isKidsProfile() && !isKidsAllowed(title)){showToast("This show is not available on UATV Kids.","error");return;}
  activeTitle=title;
  const show=SHOWS[title]||SHOWS.HoodGods;
  if(show.premium && !isKidsProfile() && !requirePremium())return;

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

  updateEpisodeNavigationButtons(title,season,episode);
  if(video && ep?.video){
    saveHistory(title,0,0,false);
    video.onended=()=>{
      updateEpisodeNavigationButtons(title,season,episode);
      saveHistory(title,video.duration||0,video.duration||0,true);
    };
    video.ontimeupdate=()=>{
      if(video.duration)saveHistory(title,video.currentTime,video.duration,video.ended);
    };
    video.play().catch(()=>{});
  }
}
async function closePlayer(){
  const video=$("#playerVideo");
  if(video){video.pause();video.onended=null;video.ontimeupdate=null;video.removeAttribute("src");video.load();}
  $("#player").classList.add("hidden");
  document.body.style.overflow="";
}

let lastHistorySaveAt=0;
let historySaveTimer=null;
async function saveHistory(title,progressSeconds=0,durationSeconds=0,watched=false){
  if(!supabase||!user)return;
  const now=Date.now();
  // Avoid hammering Supabase on every video timeupdate; save at most every 15s,
  // while always saving a completed episode immediately.
  if(!watched && now-lastHistorySaveAt<15000){
    clearTimeout(historySaveTimer);
    historySaveTimer=setTimeout(()=>saveHistory(title,progressSeconds,durationSeconds,false),15000-(now-lastHistorySaveAt));
    return;
  }
  lastHistorySaveAt=now;
  const {error}=await supabase.from("watch_history").upsert({
    user_id:user.id,title,content_type:SHOWS[title]?.type||"series",
    progress_seconds:Number(progressSeconds)||0,duration_seconds:Number(durationSeconds)||0,
    watched:Boolean(watched),updated_at:new Date().toISOString()
  },{onConflict:"user_id,title"});
  if(error){console.error("Watch history save:",error);return;}
  if(watched){await renderHistory();await renderContinue();}
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
  if(isKidsProfile() && !isKidsAllowed(title)){
    showToast("This show is not available on UATV Kids.","error");
    return;
  }
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
  const allData=await getList();
  const data=isKidsProfile()?allData.filter(x=>isKidsAllowed(x.title)):allData;
  if(!data.length){box.innerHTML='<div class="empty"><h3>Your library is empty</h3><p>Add a show or movie with + My List and it will appear here.</p></div>';Object.keys(SHOWS).forEach(t=>updateListButtons(t,false));return;}
  box.innerHTML=data.map(x=>`
    <article class="library-card">
      ${showArt(x.title,x.title==="HoodGods"?"hood-cast-art":"ash-character-art")}
      <div class="library-card-body"><h3>${safe(x.title)}</h3><p>Saved to My List</p>
      <div class="library-card-actions"><button class="watch-btn" data-library-watch="${safe(x.title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch</span></button><button class="list-btn" data-library-details="${safe(x.title)}">Details & Rating</button><button class="list-btn" data-remove-list="${safe(x.title)}">Remove</button></div></div>
    </article>`).join("");
  $$("[data-remove-list]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleList(b.dataset.removeList);});
  $$("[data-library-watch]").forEach(b=>b.onclick=e=>{e.stopPropagation();play(b.dataset.libraryWatch);});
  $$("[data-library-details]").forEach(b=>b.onclick=e=>{e.stopPropagation();openDetails(b.dataset.libraryDetails);});
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
  const visibleData=isKidsProfile()?data.filter(x=>isKidsAllowed(x.title)):data;
  box.innerHTML=visibleData.length?visibleData.map(x=>`<article class="library-card">${showArt(x.title,x.title==="HoodGods"?"hood-cast-art":"ash-character-art")}<div class="library-card-body"><h3>${safe(x.title)}</h3><p>${x.watched?"Watched":"Started"} • ${new Date(x.updated_at).toLocaleDateString()}</p><button class="watch-btn" data-history-watch="${safe(x.title)}"><span class="play-symbol" aria-hidden="true"></span><span>Watch</span></button></div></article>`).join(""):'<div class="empty"><h3>No watch history yet</h3><p>Start watching and your history will appear here.</p></div>';
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
  const liveTitles=Object.keys(SHOWS).filter(t=>SHOWS[t].live && (!isKidsProfile() || isKidsAllowed(t)));

  box.innerHTML=`
    <div class="live-intro">
      <div><span class="live-badge"><i></i> LIVE CHANNELS</span><h3>Choose a channel</h3><p>${isKidsProfile()?"UATV Kids live channels are available to Kids profiles.":"Premium members can enter live channels and join a Watch Party from their profile."}</p></div>
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
              <button class="list-btn live-details" data-show-details="${safe(title)}">Details & Rating</button>
              <button class="list-btn live-library" data-list-title="${safe(title)}">＋ <span>Add to Library</span></button>
            </div>
          </div>
        </article>`;
      }).join("")}
    </div>`;

  $("#openWatchPartyFromLive")?.addEventListener("click",()=>showSection("watch-party"));

  $$(".live-watch").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    if(!isKidsProfile() && !requirePremium())return;
    openWatchParty(btn.dataset.liveTitle);
  });

  $$(".live-party").forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    if(!isKidsProfile() && !requirePremium())return;
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
let watchPartySeason=1;
let watchPartyEpisode=1;

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
  const liveTitles=Object.keys(SHOWS).filter(t=>SHOWS[t].live && (!isKidsProfile() || isKidsAllowed(t)));
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
  if(isKidsProfile() && !isKidsAllowed(title)){showToast("This live channel is not available on UATV Kids.","error");return;}
  if(SHOWS[title].premium && !requirePremium())return;
  if(!supabase||!user){showSection("account");setAccountMessage("Sign in first to join a Watch Party.","error");return;}

  watchPartyTitle=title;
  $("#partyTitle").textContent=title;
  const liveChannelTitle = $("#liveChannelTitle");
  if(liveChannelTitle) liveChannelTitle.textContent=title;
  $("#partyCurrentArt").src=SHOWS[title]?.image||"urbananimetv-logo.png";
  $("#partyCurrentArt").alt=title;
  updatePartyViewerCount(0);
  $("#liveChannelStatus") && ($("#liveChannelStatus").textContent="Connecting to the live watch party…");
  showSection("watch-party");

  const video=$("#partyVideo");
  const wrap=$("#partyVideoWrap");
  const source=getLiveVideoSource(title);
  const initialSeason=source?.season||1;
  const initialEpisode=source?.episode||1;
  watchPartySeason=initialSeason;
  watchPartyEpisode=initialEpisode;
  renderWatchPartyEpisodeControls(title,initialSeason,initialEpisode);
  if(video){
    video.pause();
    video.removeAttribute("src");
    video.load();
    if(source){
      video.src=source.video;
      wrap?.classList.remove("hidden");
      if($('#partyTitle'))$('#partyTitle').textContent=`${title} — S${initialSeason} E${initialEpisode}`;
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
      }else if(payload.action==="episode"){
        if(Number.isFinite(payload.season)&&Number.isFinite(payload.episode)){
          setWatchPartyVideo(payload.season,payload.episode,false);
        }
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
    video.onended=()=>{
      const next=getNextPlayableEpisode(watchPartyTitle,watchPartySeason,watchPartyEpisode);
      if(next)changeWatchPartyEpisode(next.season,next.episode,true);
    };
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
  if(video){video.pause();video.onplay=null;video.onpause=null;video.onseeked=null;video.onended=null;video.removeAttribute("src");video.load();}
  $("#partyVideoWrap")?.classList.add("hidden");
  if(watchPartyChannel&&supabase){try{await supabase.removeChannel(watchPartyChannel);}catch(_){}
  }
  watchPartyChannel=null;
  watchPartyTitle=null;
  updatePartyViewerCount(0);
}

function setAccountMessage(text,type=""){const x=$("#accountMessage");if(x){x.textContent=text;x.className=`account-message ${type}`.trim();}}
async function loadMembership(){
  const previous=membership;
  const normalize=v=>String(v??"").trim().toLowerCase();
  membership={plan:"free",status:"active"};
  if(!supabase||!user){updateMembershipUI();return;}
  try{
    const {data,error}=await supabase.from("memberships")
      .select("plan,status,current_period_end")
      .eq("user_id",user.id);
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    const premiumRow=rows.find(r=>normalize(r.plan)==="premium" && normalize(r.status)==="active");
    if(premiumRow){
      membership={...premiumRow,plan:"premium",status:"active"};
    }else if(rows[0]){
      membership={...rows[0],plan:normalize(rows[0].plan),status:normalize(rows[0].status)};
    }
  }catch(err){
    console.warn("Membership read:",err);
    if(normalize(previous?.plan)==="premium" && normalize(previous?.status)==="active"){
      membership=previous;
    }
  }
  updateMembershipUI();
}

function updateMembershipUI(){
  const plan=$("#membershipPlan"), badge=$("#membershipBadge"), text=$("#membershipText"), btn=$("#upgradeBtn");
  if(!plan||!badge||!text||!btn)return;
  const premium=isPremium();
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
  if(isPremium())return;

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

async function hashProfilePin(pin){
  if(!pin)return "";
  const data=new TextEncoder().encode(pin);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function normalizeProfiles(raw){
  const arr=Array.isArray(raw)?raw:[];
  return arr.slice(0,3).map((p,i)=>({
    id:String(p?.id||`profile-${i+1}`),
    name:String(p?.name||`Profile ${i+1}`).slice(0,30),
    type:p?.type==="kid"?"kid":"adult",
    pinHash:String(p?.pinHash||"")
  }));
}
function ensureDefaultProfileList(){
  if(profileList.length)return;
  profileList=[{id:"default",name:profile.display_name||"Main",type:"adult",pinHash:""}];
}
function isKidsProfile(){return activeProfile?.type==="kid";}
function isKidsAllowed(title){return KIDS_SHOWS.has(title) || Boolean(SHOWS[title]?.kid);}
function applyProfileMode(){
  const kids=isKidsProfile();
  document.body.classList.toggle("kids-mode",kids);
  const kidsSection=$("#kids-section");
  if(kidsSection)kidsSection.classList.remove("hidden");
  $$(".home-section,#heroCarousel,#continue").forEach(el=>el.classList.toggle("profile-hidden",kids));
  $$(".nav-link").forEach(a=>{
    const nav=a.dataset.nav;
    const kidsAllowedNav=["home","kids-section","kids-series","live-tv","my-list","watch-party"];
    a.classList.toggle("profile-hidden",(kids && !kidsAllowedNav.includes(nav)) || (!kids && ["kids-section","kids-series","live-tv","watch-party"].includes(nav)));
  });
  const kidNav=$("#kidsNav");
  if(kidNav)kidNav.classList.toggle("hidden",!kids && false);
  $$("[data-bottom-nav=\"series\"]").forEach(a=>a.classList.toggle("profile-hidden",kids));
  $$("[data-bottom-nav=\"kids-series\"]").forEach(a=>a.classList.toggle("profile-hidden",!kids));
  $$("[data-bottom-nav=\"movies\"],[data-bottom-nav=\"my-list\"]").forEach(a=>a.classList.toggle("profile-hidden",kids));
  if(kids)renderKidsSection();
}

function renderAdultCatalog(){
  const section=$("#series"); if(!section)return;
  const row=section.querySelector(".poster-row"); if(!row)return;
  const titles=Object.keys(SHOWS);
  row.innerHTML=titles.map(title=>{
    const show=SHOWS[title];
    return `<article class="wide-card" data-title="${safe(title)}" data-type="series"><div class="art addon-card-art"><img src="${show.image}" alt="${safe(title)}"></div><h3>${safe(title)}</h3><p>${show.premium?"Premium":"UrbanAnimeTv"}${show.live?" • Live TV":" • Series"}</p></article>`;
  }).join("");
}

function renderKidsSection(){
  const kidTitles=Object.keys(SHOWS).filter(t=>isKidsAllowed(t));
  const featured=$("#kidsHomeFeatured");
  const just=SHOWS["Just Jordan"];
  if(featured && just){
    const justEpisodeCount=(just.seasons||[]).reduce((total,season)=>total+(season.episodes||[]).length,0);
    featured.innerHTML=`<article class="kids-feature-card" data-title="Just Jordan"><div class="kids-feature-art"><img src="${just.image}" alt="Just Jordan"></div><div class="kids-feature-copy"><span class="kids-kicker">FEATURED KIDS SHOW</span><h2>JUST JORDAN</h2><p>Season 1 • ${justEpisodeCount} episodes • Family Comedy</p><div class="kids-feature-actions"><button type="button" class="watch-btn" id="kidsFeaturedWatch">▶ Watch Now</button><button type="button" class="list-btn" id="kidsFeaturedList">＋ My List</button></div></div></article>`;
    $("#kidsFeaturedWatch")?.addEventListener("click",e=>{e.stopPropagation();openDetails("Just Jordan");});
    $("#kidsFeaturedList")?.addEventListener("click",e=>{e.stopPropagation();toggleList("Just Jordan");});
  }
  const box=$("#kidsContent");
  if(box)box.innerHTML=kidTitles.length?kidTitles.map(t=>{const episodeCount=(SHOWS[t].seasons||[]).reduce((total,season)=>total+(season.episodes||[]).length,0);return `<article class="wide-card kids-card" data-title="${safe(t)}"><div class="art"><img src="${SHOWS[t].image}" alt="${safe(t)}"></div><h3>${safe(t)}</h3><p>Kids • ${episodeCount} episodes${SHOWS[t].live?" • Live TV":""}</p></article>`;}).join(""):`<div class="kids-empty"><div class="kids-empty-mark">UATV KIDS</div><h3>No kids shows yet</h3><p>More kid-friendly shows will appear here when you add them.</p></div>`;
  $$(".kids-card").forEach(c=>c.onclick=()=>openDetails(c.dataset.title));
  const live=$("#kidsLiveContent");
  const liveTitles=kidTitles.filter(t=>SHOWS[t].live);
  if(live)live.innerHTML=liveTitles.length?liveTitles.map(t=>`<article class="wide-card kids-card" data-title="${safe(t)}"><div class="art"><img src="${SHOWS[t].image}" alt="${safe(t)}"></div><h3>${safe(t)}</h3><p>Kids Live TV</p><button class="watch-btn kids-live-watch" data-kids-live="${safe(t)}" type="button"><span class="play-symbol" aria-hidden="true"></span><span>Watch Live</span></button><button class="list-btn kids-live-party" data-kids-party="${safe(t)}" type="button">Watch Party</button></article>`).join(""): `<div class="kids-empty"><h3>No kids live shows yet</h3><p>Kids live channels you add later will appear here.</p></div>`;
  $$(".kids-live-watch").forEach(b=>b.onclick=e=>{e.stopPropagation();openWatchParty(b.dataset.kidsLive);});
  $$(".kids-live-party").forEach(b=>b.onclick=e=>{e.stopPropagation();openWatchParty(b.dataset.kidsParty);});
  renderKidsSeries();
}
function renderKidsSeries(){
  const box=$("#kidsSeriesContent"); if(!box)return;
  const titles=Object.keys(SHOWS).filter(t=>isKidsAllowed(t));
  box.innerHTML=titles.length?titles.map(t=>{const episodeCount=(SHOWS[t].seasons||[]).reduce((total,season)=>total+(season.episodes||[]).length,0);return `<article class="library-card kids-series-card" data-title="${safe(t)}"><div class="art"><img src="${SHOWS[t].image}" alt="${safe(t)}"></div><div class="library-card-copy"><h3>${safe(t)}</h3><p>Kids • ${episodeCount} episodes${SHOWS[t].live?" • Live TV":""}</p><button type="button" class="watch-btn kids-series-view" data-kids-series-title="${safe(t)}">View Show</button></div></article>`;}).join(""):`<div class="kids-empty"><h3>No kids shows yet</h3><p>More kid-friendly shows will appear here when you add them.</p></div>`;
  $$(".kids-series-card").forEach(c=>c.onclick=e=>{if(e.target.closest("button"))return;openDetails(c.dataset.title);});
  $$(".kids-series-view").forEach(b=>b.onclick=e=>{e.stopPropagation();openDetails(b.dataset.kidsSeriesTitle);});
}
function openProfileManager(){
  const modal=$("#profileManager"); if(!modal)return;
  renderProfileManager(); modal.classList.remove("hidden");
}
function closeProfileManager(){$("#profileManager")?.classList.add("hidden");}
function renderProfileManager(){
  ensureDefaultProfileList();
  const box=$("#profileManagerList"); if(!box)return;
  box.innerHTML=`<div class="profile-switch-grid">${profileList.map(p=>`<button type="button" class="profile-switch-card ${p.id===activeProfile.id?"active":""}" data-switch-profile="${safe(p.id)}"><span class="profile-switch-avatar">${p.type==="kid"?"K":"A"}</span><strong>${safe(p.name)}</strong><small>${p.type==="kid"?"Kids":"Adult"}${p.pinHash?" • PIN protected":""}</small>${p.id===activeProfile.id?"<em>Current</em>":"<em>Switch</em>"}</button>`).join("")}
  ${profileList.length<3?`<button type="button" class="profile-switch-card add-profile-card" id="profileQuickAdd"><span class="profile-switch-avatar">＋</span><strong>Add Profile</strong><small>Create another Adult or Kids profile</small><em>Create</em></button>`:""}</div>
  <div class="profile-manager-edit-title">Edit Profiles</div>
  ${profileList.map(p=>`<div class="profile-edit-row" data-profile-id="${safe(p.id)}"><div class="profile-edit-avatar">${p.type==="kid"?"K":"A"}</div><div class="profile-edit-fields"><input class="profile-name-input" value="${safe(p.name)}" maxlength="30" aria-label="Profile name"><select class="profile-type-input" aria-label="Profile type"><option value="adult" ${p.type==="adult"?"selected":""}>Adult</option><option value="kid" ${p.type==="kid"?"selected":""}>Kids</option></select><input class="profile-pin-input" type="password" inputmode="numeric" maxlength="12" placeholder="New password/PIN (optional)" autocomplete="new-password"></div><button class="list-btn profile-delete-btn" type="button" data-delete-profile="${safe(p.id)}">Delete</button></div>`).join("")}`;
  $("#profileManagerNote").textContent=`${profileList.length}/3 profiles • Maximum 2 Adult profiles and 1 Kids profile.`;
  $("#profileQuickAdd")?.addEventListener("click",()=>addProfile());
}
function addProfile(){
  if(!user){showSection("account");return;}
  if(profileList.length>=3){showToast("You can have up to 3 profiles.","error");return;}
  const adults=profileList.filter(p=>p.type!=="kid").length;
  const kids=profileList.filter(p=>p.type==="kid").length;
  const type=adults<2?"adult":"kid";
  if(type==="kid"&&kids>=1){showToast("You already have the maximum 1 Kids profile.","error");return;}
  profileList.push({id:`profile-${Date.now()}`,name:type==="kid"?"Kids":"Profile ${profileList.length+1}",type,pinHash:""});
  renderProfileManager();
}

async function saveProfiles(){
  if(!user||!supabase)return;
  const rows=[...document.querySelectorAll(".profile-edit-row")];
  const next=[]; let adults=0,kids=0;
  for(const row of rows){
    const id=row.dataset.profileId; const old=profileList.find(p=>p.id===id)||{};
    const name=row.querySelector(".profile-name-input")?.value.trim()||"Profile";
    const type=row.querySelector(".profile-type-input")?.value==="kid"?"kid":"adult";
    const pin=row.querySelector(".profile-pin-input")?.value||"";
    if(type==="kid")kids++; else adults++;
    if(adults>2||kids>1){showToast("You can have up to 2 adult profiles and 1 kid profile.","error");return;}
    next.push({id,name:name.slice(0,30),type,pinHash:pin?await hashProfilePin(pin):(old.pinHash||"")});
  }
  if(!next.length){next.push({id:"default",name:"Main",type:"adult",pinHash:""});}
  try{
    const {data,error}=await supabase.auth.updateUser({data:{uatv_profiles:next}});
    if(error)throw error;
    user=data.user||user; profileList=next;
    if(!profileList.some(p=>p.id===activeProfile.id))activeProfile=profileList[0];
    localStorage.setItem(`uatv-active-profile:${user.id}`,activeProfile.id);
    applyProfileMode(); updateProfileDrawer(); renderProfileManager(); showToast("Profiles saved.","success");
  }catch(err){showToast(err.message||"Could not save profiles.","error");}
}
async function switchProfile(id){
  if(!user)return;
  const p=profileList.find(x=>x.id===id); if(!p)return;
  if(p.pinHash){
    const entered=prompt(`Enter the password/PIN for ${p.name}`);
    if(entered===null)return;
    const hash=await hashProfilePin(entered);
    if(hash!==p.pinHash){showToast("Incorrect profile password.","error");return;}
  }
  activeProfile=p;
  localStorage.setItem(`uatv-active-profile:${user.id}`,p.id);
  closeProfileManager(); closeProfileDrawer();
  applyProfileMode();
  showHome();
  showToast(`Switched to ${p.name}.`,"success");
}
function loadProfilesFromUser(){
  ensureDefaultProfileList();
  profileList=normalizeProfiles(user?.user_metadata?.uatv_profiles);
  if(!profileList.length)profileList=[{id:"default",name:profile.display_name||"Main",type:"adult",pinHash:""}];
  const saved=user?localStorage.getItem(`uatv-active-profile:${user.id}`):null;
  activeProfile=profileList.find(p=>p.id===saved)||profileList[0];
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

  // Auth metadata is the source of truth for the user's custom name/photo.
  // Refresh the user first so a recently saved profile is not replaced by a
  // stale in-memory auth object.
  try{
    const fresh=await supabase.auth.getUser();
    if(fresh?.data?.user)user=fresh.data.user;
  }catch(err){
    console.warn("Auth user refresh skipped:",err);
  }

  const meta=user.user_metadata||{};
  let data={
    display_name:meta.display_name||"",
    avatar_url:meta.avatar_url||""
  };

  // The profiles table is only a fallback for older accounts that do not yet
  // have profile metadata. Never let an older/stale table row overwrite a
  // custom name or picture already stored in Auth metadata.
  if(!data.display_name || !data.avatar_url){
    try{
      const {data:row}=await supabase.from("profiles")
        .select("display_name,avatar_url")
        .eq("user_id",user.id)
        .maybeSingle();
      if(row){
        if(!data.display_name && row.display_name)data.display_name=row.display_name;
        if(!data.avatar_url && row.avatar_url)data.avatar_url=row.avatar_url;
      }
    }catch(err){
      console.warn("Profile table read skipped:",err);
    }
  }

  profile={
    display_name:data.display_name||"",
    avatar_url:data.avatar_url||""
  };

  loadProfilesFromUser();
  if($("#displayName"))$("#displayName").value=profile.display_name;
  if($("#profilePreview"))$("#profilePreview").src=profile.avatar_url||"urbananimetv-logo.png";
  if($("#profileAvatar"))$("#profileAvatar").src=profile.avatar_url||"urbananimetv-logo.png";
  setTopAvatar(profile.avatar_url);
  updateProfileDrawer();
}

async function saveProfile(){
  if(!supabase){setProfileMessage("Supabase is not connected. Check config.js.","error");return;}
  if(!user){setProfileMessage("Please sign in before saving your profile.","error");return;}

  const input=$("#displayName");
  const saveButton=$("#saveProfile");
  const displayName=(input?.value||"").trim().slice(0,40);
  if(saveButton){saveButton.disabled=true;saveButton.textContent="Saving…";}
  setProfileMessage("Saving profile…");

  try{
    // Keep the existing custom avatar exactly as-is while changing the name.
    const avatarUrl=profile.avatar_url||user.user_metadata?.avatar_url||"";
    const {data,error}=await supabase.auth.updateUser({
      data:{
        ...user.user_metadata,
        display_name:displayName,
        avatar_url:avatarUrl
      }
    });
    if(error)throw error;

    user=data?.user||user;
    profile={display_name:displayName,avatar_url:avatarUrl};

    // Mirror to the existing profiles table when available. This is best
    // effort and never prevents Auth from being the saved profile source.
    try{
      const {error:profileError}=await supabase.from("profiles").upsert({
        user_id:user.id,
        display_name:displayName,
        avatar_url:avatarUrl,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
      if(profileError)console.warn("Profile table sync skipped:",profileError);
    }catch(err){
      console.warn("Profile table sync skipped:",err);
    }

    if(input)input.value=displayName;
    if($("#profilePreview"))$("#profilePreview").src=avatarUrl||"urbananimetv-logo.png";
    if($("#profileAvatar"))$("#profileAvatar").src=avatarUrl||"urbananimetv-logo.png";
    setTopAvatar(avatarUrl);
    accountUI();
    updateProfileDrawer();
    setProfileMessage("Profile saved successfully.","success");
    showToast("Profile saved.","success");
  }catch(err){
    console.error("Save profile:",err);
    setProfileMessage(`Could not save your profile: ${err?.message||"Please try again."}`,"error");
  }finally{
    if(saveButton){saveButton.disabled=false;saveButton.textContent="Save Profile";}
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
  const premium=isPremium();
  $("#drawerName").textContent=signed?name:"Sign In";
  $("#drawerEmail").textContent=signed?email:"Sign in to your account";
  $("#drawerAvatar").src=profile.avatar_url||"urbananimetv-logo.png";
  $("#drawerPlan").textContent=premium?"Premium":"Free";
  $("#drawerPlanBadge").textContent=premium?"PREMIUM":"FREE";
  $("#drawerPlanBadge").classList.toggle("premium",premium);
  const profileLine=$("#drawerProfileLine"); if(profileLine)profileLine.textContent=`${activeProfile.name} • ${activeProfile.type==="kid"?"Kids":"Adult"}`;
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
  const visibleHistory=isKidsProfile()?history.filter(x=>isKidsAllowed(x.title)):history;
  const visibleLibrary=isKidsProfile()?library.filter(x=>isKidsAllowed(x.title)):library;
  const lc=visibleLibrary.length, hc=visibleHistory.length;
  $("#drawerLibraryCount").textContent=lc===1?"1 saved title":`${lc} saved titles`;
  $("#drawerHistoryCount").textContent=hc===1?"1 title watched":`${hc} titles watched`;
  const partyCount=Object.keys(SHOWS).filter(t=>SHOWS[t].live).length;
  $("#drawerPartyCount").textContent=`${partyCount} live channels`;
}

function openProfileDrawer(){
  const wrap=$("#profileDrawer");
  if(!wrap)return;
  // Open immediately on the first tap. Network/database refreshes happen after the drawer is visible.
  updateProfileDrawer();
  wrap.classList.remove("hidden");
  requestAnimationFrame(()=>wrap.classList.add("open"));
  wrap.setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
  Promise.resolve(loadMembership()).then(()=>{
    updateProfileDrawer();
    return refreshProfileDrawerCounts();
  }).catch(()=>{});
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
  $("#accountTitle").textContent=signed?(profile.display_name||"Your Account"):"Sign In or Sign Up";
  $("#accountStatus").textContent=signed?(profile.display_name||user.email||"Signed in"):"Sign in to your UrbanAnimeTv account or create a free account.";
  $("#authBox").classList.toggle("hidden",signed);
  $("#profileSettings").classList.toggle("hidden",!signed);
  if(!signed){
    $("#accountSubmit").textContent="Sign In";
    $("#signupToggle").textContent="Sign Up";
  }
  updateProfileDrawer();
}

async function submitSignUp(){
  if(!supabase){setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
  const email=$("#email").value.trim(),password=$("#password").value;
  if(!email||!password){$("#accountForm").reportValidity();return;}
  setAccountMessage("Creating your account…");
  try{
    const r=await supabase.auth.signUp({email,password});
    if(r.error)throw r.error;
    if(!r.data.session){setAccountMessage("Account created. Check your email if confirmation is required.","success");return;}
    user=r.data.user; signup=false;
    await loadProfile(); loadProfilesFromUser(); await loadMembership(); accountUI();
    setAccountMessage("Account created and signed in successfully.","success");
    await renderList(); await renderHistory(); await renderContinue(); await refreshProfileDrawerCounts();
  }catch(err){setAccountMessage(err.message||"Could not create your account.","error");}
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
  renderAdultCatalog();
  $("#accountBtn").onclick=e=>{e.stopPropagation();openProfileDrawer();};
  $("#profileDrawerClose").onclick=closeProfileDrawer;
  $("#profileDrawerX").onclick=closeProfileDrawer;
  $("#drawerLibrary").onclick=()=>{closeProfileDrawer();showSection("my-list");};
  $("#drawerHistory").onclick=()=>{closeProfileDrawer();showSection("watch-history");};
  $("#drawerWatchParty").onclick=()=>{closeProfileDrawer();showSection("watch-party");};
  $("#drawerAccount").onclick=()=>{closeProfileDrawer();showSection("account");};
  $("#drawerProfiles").onclick=()=>{closeProfileDrawer();openProfileManager();};
  $("#profileManagerClose").onclick=closeProfileManager;
  $("#profileManagerX").onclick=closeProfileManager;
  $("#profileManagerSave").onclick=saveProfiles;
  $("#profileManagerAdd").onclick=addProfile;
  $("#profileManagerList")?.addEventListener("click",e=>{const use=e.target.closest("[data-switch-profile]");if(use){switchProfile(use.dataset.switchProfile);return;} const b=e.target.closest("[data-delete-profile]");if(!b)return; if(profileList.length<=1){showToast("Keep at least one profile.","error");return;} profileList=profileList.filter(p=>p.id!==b.dataset.deleteProfile);renderProfileManager();});
  $("#profileWatchPartyBtn").onclick=()=>{showSection("watch-party");};
  $("#drawerUpgrade").onclick=startPremiumCheckout;
  $("#drawerSignIn").onclick=()=>{closeProfileDrawer();showSection("account");};
  $("#drawerSignOut").onclick=()=>$("#signOut").click();
  $("#signupToggle").onclick=submitSignUp;
  $("#accountForm").onsubmit=async e=>{
    e.preventDefault();
    if(!supabase){setAccountMessage("Supabase is not connected. Check config.js.","error");return;}
    const email=$("#email").value.trim(),password=$("#password").value;
    if(!email||!password){$("#accountForm").reportValidity();return;}
    const submit=$("#accountSubmit");
    if(submit)submit.disabled=true;
    setAccountMessage("Signing in…");
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email,password});
      if(error)throw error;
      user=data?.user||null;
      signup=false;
      // Update the UI immediately. Profile/history refreshes are best-effort so
      // a non-critical table/RLS issue cannot make a successful login look broken.
      accountUI();
      setAccountMessage("Signed in successfully.","success");
      try{await loadProfile();}catch(err){console.warn("Profile load after sign-in skipped:",err);}
      loadProfilesFromUser();
      try{await loadMembership();}catch(err){console.warn("Membership load after sign-in skipped:",err);}
      accountUI();
      try{await renderList();}catch(err){console.warn("Library refresh after sign-in skipped:",err);}
      try{await renderHistory();}catch(err){console.warn("History refresh after sign-in skipped:",err);}
      try{await renderContinue();}catch(err){console.warn("Continue refresh after sign-in skipped:",err);}
      try{await refreshProfileDrawerCounts();}catch(err){console.warn("Drawer counts refresh after sign-in skipped:",err);}
    }catch(err){
      console.error("Sign-in error:",err);
      setAccountMessage(err?.message||"Could not sign in. Please check your email and password and try again.","error");
    }finally{
      if(submit)submit.disabled=false;
    }
  };
  $("#signOut").onclick=async()=>{closeProfileDrawer();if(supabase)await supabase.auth.signOut();user=null;profile={display_name:"",avatar_url:""};setTopAvatar("");accountUI();await renderContinue();showHome();};
  $("#historyBtn").onclick=()=>showSection("watch-history");
  $("#saveProfile").onclick=saveProfile;
  $("#profileManageBtn")?.addEventListener("click",()=>openProfileManager());
  $("#upgradeBtn").onclick=startPremiumCheckout;
  $("#paymentMethodBtn").onclick=openPaymentMethods;
  $("#avatarInput").onchange=e=>uploadAvatar(e.target.files?.[0]);
  $("#leaveWatchParty").onclick=async()=>{await leaveWatchParty();showSection("live-tv");};
  $("#closePlayer").onclick=e=>{e.stopPropagation();closePlayer();};
  $("#playerPlayButton").onclick=e=>{
    e.stopPropagation();
    const video=$("#playerVideo");
    if(video && !video.classList.contains("hidden") && video.src){video.play().catch(()=>{});}
    else showToast("This episode does not have a connected video source yet.","error");
  };
  $("#modalWatch").onclick=e=>{e.stopPropagation();
    const show=SHOWS[activeTitle]||SHOWS.HoodGods;
    $("#modal").classList.add("hidden");
    if(show.live){showSection("live-tv");setTimeout(()=>openWatchParty(activeTitle),80);}
    else play(activeTitle,1,1);
  };
  $("#modalNotify").onclick=e=>{e.stopPropagation();toggleShowNotifications(activeTitle);};
  $("#modalLibrary").onclick=e=>{e.stopPropagation();toggleList(activeTitle);};
  $("#seasonSelect").onchange=e=>{e.stopPropagation();renderEpisodes(activeTitle,Number(e.target.value));};
  $("#thumbUp").onclick=e=>{e.stopPropagation();setRating(activeTitle,"up");};
  $("#thumbDown").onclick=e=>{e.stopPropagation();setRating(activeTitle,"down");};
  $$("[data-close]").forEach(x=>x.onclick=e=>{e.stopPropagation();$("#modal").classList.add("hidden");});

  $$(".wide-card").forEach(card=>{if(card.classList.contains("continue-card"))return;card.onclick=e=>{e.stopPropagation();openDetails(card.dataset.title);};});
  $("#searchBtn").onclick=e=>{e.stopPropagation();$("#search").classList.remove("hidden");setTimeout(()=>$("#searchInput").focus(),50);};
  $("#closeSearch").onclick=$("#searchX").onclick=()=>$("#search").classList.add("hidden");
  $("#searchInput").oninput=e=>{
    const q=e.target.value.trim().toLowerCase(),titles=Object.keys(SHOWS).filter(x=>!isKidsProfile()||isKidsAllowed(x)),found=q?titles.filter(x=>x.toLowerCase().includes(q)):[];
    $("#results").innerHTML=found.map(x=>`<div class="result" data-r="${safe(x)}"><strong>${safe(x)}</strong><small>${SHOWS[x]?.premium?"Premium":"UrbanAnimeTv"}${SHOWS[x]?.live?" • Live TV":""}</small></div>`).join("")||(q?"<p style='color:#777;padding:15px'>No titles found.</p>":"");
    $$(".result").forEach(x=>x.onclick=()=>{$("#search").classList.add("hidden");openDetails(x.dataset.r);});
  };
  $$("[data-see-all]").forEach(btn=>btn.onclick=()=>{const target=btn.dataset.seeAll;showSection(target==="continue"?"watch-history":target==="live-tv"?"live-tv":"series");});
  $$('nav[aria-label="Primary navigation"] a').forEach(a=>a.onclick=e=>{e.preventDefault();showSection(a.dataset.nav);});
  $$('[data-bottom-nav]').forEach(a=>a.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    const destination=a.dataset.bottomNav;
    if(destination==="profile"){openProfileDrawer();return;}
    if(isKidsProfile() && destination==="home"){showHome();return;}
    showSection(destination);
  });
  $$("footer a").forEach(a=>a.onclick=e=>{if(a.getAttribute("href")==="#home"){e.preventDefault();showHome();}});
  accountUI();
  applyProfileMode();
  renderLiveTV();
  loadWatchPartyRooms();
}

async function auth(){
  if(!supabase){await renderContinue();return;}
  const s=await supabase.auth.getSession();user=s.data.session?.user||null;
  if(user)await loadProfile();
  loadProfilesFromUser();
  await loadMembership();
  accountUI();
  if(user){await renderList();await renderHistory();await renderContinue();}
  // Do not perform database work directly inside Supabase's auth callback.
  // Deferring the refresh avoids auth-lock races that can make Sign In appear
  // stuck even though the credentials were accepted.
  supabase.auth.onAuthStateChange((_e,s)=>{
    user=s?.user||null;
    if(!user){
      profile={display_name:"",avatar_url:""};
      profileList=[];
      activeProfile={id:"default",name:"Main",type:"adult",pinHash:""};
      membership={plan:"free",status:"active"};
      setTopAvatar("");
      accountUI();
      Object.keys(SHOWS).forEach(t=>updateListButtons(t,false));
      paintRating(null);
      setTimeout(()=>{renderContinue().catch(err=>console.warn("Signed-out refresh skipped:",err));refreshProfileDrawerCounts().catch(err=>console.warn("Signed-out drawer refresh skipped:",err));},0);
      return;
    }
    accountUI();
    setTimeout(async()=>{
      try{await loadProfile();}catch(err){console.warn("Auth profile refresh skipped:",err);}
      loadProfilesFromUser();
      try{await loadMembership();}catch(err){console.warn("Auth membership refresh skipped:",err);}
      accountUI();
      try{await renderList();}catch(err){console.warn("Auth library refresh skipped:",err);}
      try{await renderHistory();}catch(err){console.warn("Auth history refresh skipped:",err);}
      if(!$("#modal").classList.contains("hidden")){try{await loadRating(activeTitle);}catch(err){console.warn("Auth rating refresh skipped:",err);}}
      try{await renderContinue();}catch(err){console.warn("Auth continue refresh skipped:",err);}
      try{await refreshProfileDrawerCounts();}catch(err){console.warn("Auth drawer refresh skipped:",err);}
      updateProfileDrawer();
    },0);
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

// Global interaction fallback: keeps the main controls working even when a dynamically-rendered card replaces its markup.
document.addEventListener("click",e=>{
  const target=e.target;
  if(!(target instanceof Element))return;

  const bottom=target.closest("[data-bottom-nav]");
  if(bottom){
    e.preventDefault();
    const destination=bottom.dataset.bottomNav;
    if(destination==="profile")openProfileDrawer();
    else showSection(destination);
    return;
  }

  const profileButton=target.closest("#accountBtn");
  if(profileButton){e.preventDefault();openProfileDrawer();return;}

  const searchButton=target.closest("#searchBtn");
  if(searchButton){e.preventDefault();$("#search")?.classList.remove("hidden");setTimeout(()=>$("#searchInput")?.focus(),40);return;}

  const seeAll=target.closest("[data-see-all]");
  if(seeAll){e.preventDefault();const targetId=seeAll.dataset.seeAll;showSection(targetId==="continue"?"watch-history":targetId==="live-tv"?"live-tv":"series");return;}

  const card=target.closest(".wide-card[data-title]");
  if(card && isKidsProfile() && !isKidsAllowed(card.dataset.title)){e.preventDefault();showToast("This show is not available on UATV Kids.","error");return;}
  if(card && !target.closest("button,a,input,select")){e.preventDefault();openDetails(card.dataset.title);return;}

  const heroWatch=target.closest(".hero-watch");
  if(heroWatch && isKidsProfile()){e.preventDefault();showToast("The Kids profile can only watch UATV Kids shows.","error");return;}
  if(heroWatch){e.preventDefault();if(heroWatch.dataset.heroLive==="true")openWatchParty(heroWatch.dataset.heroTitle);else play(heroWatch.dataset.heroTitle);return;}

  const libraryButton=target.closest("[data-list-title]");
  if(libraryButton){e.preventDefault();if(libraryButton.disabled)return;toggleList(libraryButton.dataset.listTitle);return;}

  const playerPlay=target.closest("#playerPlayButton");
  if(playerPlay){e.preventDefault();const video=$("#playerVideo");if(video && !video.classList.contains("hidden") && video.src)video.play().catch(()=>{});else showToast("This episode does not have a connected video source yet.","error");return;}

  const modalWatch=target.closest("#modalWatch");
  if(modalWatch){e.preventDefault();const title=modalWatch.dataset.title||activeTitle;$("#modal")?.classList.add("hidden");const show=SHOWS[title]||SHOWS.HoodGods;if(show.live){showSection("live-tv");setTimeout(()=>openWatchParty(title),60);}else play(title,1,1);return;}

  const close=target.closest("[data-close],#closePlayer,#profileDrawerX,#profileDrawerClose,#searchX,#closeSearch");
  if(close){
    if(close.matches("#closePlayer"))closePlayer();
    else if(close.matches("#profileDrawerX,#profileDrawerClose"))closeProfileDrawer();
    else if(close.matches("#searchX,#closeSearch"))$("#search")?.classList.add("hidden");
    else $("#modal")?.classList.add("hidden");
    return;
  }

  const episode=target.closest(".episode-play");
  if(episode){
    e.preventDefault();
    const title=episode.dataset.episodeTitle,season=Number(episode.dataset.episodeSeason||1),num=Number(episode.dataset.episodeNumber||1);
    if(episode.disabled){const show=SHOWS[title];if(show?.premium&&!isPremium())requirePremium();else showToast("This episode is not connected yet.","error");}
    else {$("#modal")?.classList.add("hidden");play(title,num,season);}
    return;
  }

  const details=target.closest("[data-show-details]");
  if(details){e.preventDefault();openDetails(details.dataset.showDetails);return;}

  const addon=target.closest("[data-party-join]");
  if(addon){e.preventDefault();openWatchParty(addon.dataset.partyJoin);return;}

  const liveWatch=target.closest("[data-live-title]");
  if(liveWatch){e.preventDefault();if(isKidsProfile() || requirePremium())openWatchParty(liveWatch.dataset.liveTitle);return;}

  const liveParty=target.closest("[data-party-title]");
  if(liveParty){e.preventDefault();if(isKidsProfile() || requirePremium())openWatchParty(liveParty.dataset.partyTitle);return;}
});

init();auth();


document.addEventListener("keydown",e=>{if(e.key==="Escape")closeProfileDrawer();});
