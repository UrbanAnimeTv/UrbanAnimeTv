const player=document.getElementById('player'),video=document.getElementById('video');
document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{video.src=b.dataset.play;player.classList.remove('hidden');video.play().catch(()=>{})});
document.getElementById('closePlayer').onclick=()=>{video.pause();video.removeAttribute('src');video.load();player.classList.add('hidden')};
function showInfo(t){document.getElementById('modalTitle').textContent=t;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
const panel=document.getElementById('searchPanel'),input=document.getElementById('searchInput'),results=document.getElementById('results');
document.getElementById('searchBtn').onclick=()=>{panel.classList.toggle('hidden');if(!panel.classList.contains('hidden'))input.focus()};
input.oninput=()=>{let q=input.value.toLowerCase().trim();results.innerHTML='';if(!q)return;document.querySelectorAll('.card').forEach(c=>{if(c.innerText.toLowerCase().includes(q)){let r=document.createElement('div');r.className='result';r.textContent=c.querySelector('h3').textContent;r.onclick=()=>{c.scrollIntoView({behavior:'smooth'});panel.classList.add('hidden')};results.appendChild(r)}})};