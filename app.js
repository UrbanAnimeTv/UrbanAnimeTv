import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.URBANANIMETV_CONFIG || {};
const SUPABASE_URL = cfg.SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = cfg.SUPABASE_PUBLISHABLE_KEY || "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_"));
const supabase = supabaseReady ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

let currentUser = null;
let signupMode = false;
let activeTitle = "HoodGods";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function showSection(id) {
  document.querySelectorAll(".content-section").forEach(x => {
    if (["my-list-section","history-section","account-section"].includes(x.id)) x.classList.add("hidden");
  });
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    el.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function showInfo(title, text) {
  activeTitle = title;
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = text || `${title} is part of UrbanAnimeTv.`;
  $("#modal").classList.remove("hidden");
}

function openPlayer(title="HoodGods") {
  activeTitle = title;
  $("#playerTitle").textContent = title;
  $("#playerHeading").textContent = title;
  $("#player").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  if (currentUser && supabase) saveHistory(title);
}

function closePlayer() {
  $("#player").classList.add("hidden");
  document.body.style.overflow = "";
}

async function saveHistory(title) {
  if (!currentUser || !supabase) return;
  const { error } = await supabase.from("watch_history").upsert({
    user_id: currentUser.id,
    title,
    content_type: "series",
    progress_seconds: 0,
    duration_seconds: 0,
    updated_at: new Date().toISOString()
  }, {onConflict:"user_id,title"});
  if (error) console.warn("History:", error.message);
}

async function toggleList(title="HoodGods") {
  if (!currentUser || !supabase) {
    showInfo("Sign In Required", "Create a free UrbanAnimeTv account to save shows to My List.");
    return;
  }
  const { data, error } = await supabase.from("user_library").select("id").eq("user_id", currentUser.id).eq("title", title).maybeSingle();
  if (error) { showInfo("My List", error.message); return; }
  if (data) {
    await supabase.from("user_library").delete().eq("id", data.id);
    showInfo("Removed", `${title} was removed from My List.`);
  } else {
    await supabase.from("user_library").insert({user_id:currentUser.id,title,content_type:"series"});
    showInfo("Added to My List", `${title} was added to your account.`);
  }
  await renderAccountData();
}

async function renderAccountData() {
  if (!currentUser || !supabase) return;
  const {data:list} = await supabase.from("user_library").select("title,content_type").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  const {data:history} = await supabase.from("watch_history").select("title,content_type,updated_at").eq("user_id",currentUser.id).order("updated_at",{ascending:false});
  $("#myListContent").innerHTML = (list?.length ? list.map(x=>`<div class="account-tile"><strong>${escapeHtml(x.title)}</strong><p>${escapeHtml(x.content_type)}</p></div>`).join("") : `<div class="empty-panel"><h3>Your list is empty</h3><p>Add shows you want to watch later.</p></div>`);
  $("#historyContent").innerHTML = (history?.length ? history.map(x=>`<div class="account-tile"><strong>${escapeHtml(x.title)}</strong><p>Watched • ${new Date(x.updated_at).toLocaleDateString()}</p></div>`).join("") : `<div class="empty-panel"><h3>No watch history yet</h3><p>Start watching and your history will appear here.</p></div>`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function updateAccountUI() {
  if (currentUser) {
    $("#accountTitle").textContent = `Welcome back`;
    $("#accountStatus").textContent = currentUser.email || "Your UrbanAnimeTv account";
    $("#accountFormWrap").classList.add("hidden");
    $("#signOutBtn").classList.remove("hidden");
    $("#accountBtn").textContent = "Profile";
  } else {
    $("#accountTitle").textContent = "Sign in to your account";
    $("#accountStatus").textContent = "Save shows, keep your watch history, and continue watching across your devices.";
    $("#accountFormWrap").classList.remove("hidden");
    $("#signOutBtn").classList.add("hidden");
    $("#accountBtn").textContent = "Sign In";
  }
}

async function handleAccountSubmit(e) {
  e.preventDefault();
  const email = $("#emailInput").value.trim();
  const password = $("#passwordInput").value;
  const msg = $("#accountMessage");
  msg.textContent = "Working...";
  if (!supabaseReady) {
    msg.textContent = "Supabase is not connected yet. Check config.js.";
    return;
  }
  let result;
  if (signupMode) result = await supabase.auth.signUp({email,password});
  else result = await supabase.auth.signInWithPassword({email,password});
  if (result.error) {
    msg.textContent = result.error.message;
    return;
  }
  if (signupMode && !result.data.session) {
    msg.textContent = "Account created. Check your email if confirmation is required, then sign in.";
  } else {
    currentUser = result.data.user;
    msg.textContent = "Signed in.";
    updateAccountUI();
    await renderAccountData();
  }
}

function setup() {
  $("#watchNowBtn").onclick = () => openPlayer("HoodGods");
  $("#myListHeroBtn").onclick = () => toggleList("HoodGods");
  $("#detailsHeroBtn").onclick = () => showInfo("HoodGods", "HoodGods is an UrbanAnimeTv original series.");
  $("#closePlayer").onclick = closePlayer;

  $("#accountBtn").onclick = () => showSection("account-section");
  $("#toggleSignup").onclick = () => {
    signupMode = !signupMode;
    $("#accountSubmit").textContent = signupMode ? "Create Account" : "Sign In";
    $("#toggleSignup").textContent = signupMode ? "Back to Sign In" : "Create Account";
    $("#accountMessage").textContent = "";
  };
  $("#accountForm").onsubmit = handleAccountSubmit;
  $("#signOutBtn").onclick = async () => {
    if (supabase) await supabase.auth.signOut();
    currentUser = null;
    updateAccountUI();
    showInfo("Signed Out", "You have been signed out of UrbanAnimeTv.");
  };

  $("#searchBtn").onclick = () => { $("#searchPanel").classList.remove("hidden"); $("#searchInput").focus(); };
  $("#closeSearch").onclick = $("#searchCloseBtn").onclick = () => $("#searchPanel").classList.add("hidden");
  $("#searchInput").oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    const results = q ? ["HoodGods","City of Ash","Street Kings"].filter(x=>x.toLowerCase().includes(q)) : [];
    $("#searchResults").innerHTML = results.map(x=>`<div class="search-result" data-search-title="${escapeHtml(x)}"><strong>${escapeHtml(x)}</strong><small>UrbanAnimeTv</small></div>`).join("") || (q ? "<p style='color:#777;padding:20px 5px'>No titles found.</p>" : "");
    $$(".search-result").forEach(el => el.onclick = () => { $("#searchPanel").classList.add("hidden"); showInfo(el.dataset.searchTitle); });
  };

  $("#modalPlay").onclick = () => { $("#modal").classList.add("hidden"); openPlayer(activeTitle); };
  $("#modalList").onclick = () => toggleList(activeTitle);
  $$("[data-close-modal]").forEach(el => el.onclick = () => $("#modal").classList.add("hidden"));

  $$(".featured-card").forEach(card => {
    card.onclick = (e) => { if (e.target.closest(".card-play")) openPlayer(card.dataset.title); else showInfo(card.dataset.title, "UrbanAnimeTv original series."); };
    const play = card.querySelector(".card-play");
    if (play) play.onclick = (e) => { e.stopPropagation(); openPlayer(card.dataset.title); };
  });

  $$("[data-action]").forEach(btn => btn.onclick = () => showInfo("UrbanAnimeTv", "More titles will be added to UrbanAnimeTv as they are released."));

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closePlayer();
      $("#modal").classList.add("hidden");
      $("#searchPanel").classList.add("hidden");
    }
  });
}

async function initAuth() {
  if (!supabaseReady) {
    updateAccountUI();
    return;
  }
  const {data} = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  updateAccountUI();
  if (currentUser) await renderAccountData();
  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    updateAccountUI();
    if (currentUser) await renderAccountData();
  });
}

setup();
initAuth();
