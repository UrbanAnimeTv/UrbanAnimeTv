const player = document.getElementById('player');
const video = document.getElementById('video');

document.querySelectorAll('[data-play]').forEach(button => {
  button.addEventListener('click', () => {
    video.src = button.dataset.play;
    player.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    video.play().catch(() => {});
  });
});

document.getElementById('closePlayer').addEventListener('click', closePlayer);

function closePlayer(){
  video.pause();
  video.removeAttribute('src');
  video.load();
  player.classList.add('hidden');
  document.body.style.overflow = '';
}

function showInfo(title){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal(){
  document.getElementById('modal').classList.add('hidden');
}

function toggleMyList(title){
  const key = 'urbananimetv-my-list';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const index = list.indexOf(title);
  if(index === -1){
    list.push(title);
    document.getElementById('listLabel').textContent = 'Added';
  }else{
    list.splice(index,1);
    document.getElementById('listLabel').textContent = 'My List';
  }
  localStorage.setItem(key, JSON.stringify(list));
}

const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');

document.getElementById('searchBtn').addEventListener('click', () => {
  searchPanel.classList.toggle('hidden');
  if(!searchPanel.classList.contains('hidden')) searchInput.focus();
});

function closeSearch(){
  searchPanel.classList.add('hidden');
  searchInput.value = '';
  results.innerHTML = '';
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  results.innerHTML = '';
  if(!q) return;

  document.querySelectorAll('.card').forEach(card => {
    if(card.innerText.toLowerCase().includes(q)){
      const result = document.createElement('div');
      result.className = 'result';
      result.textContent = card.querySelector('h3').textContent;
      result.addEventListener('click', () => {
        card.scrollIntoView({behavior:'smooth', block:'center'});
        closeSearch();
      });
      results.appendChild(result);
    }
  });

  if(!results.children.length){
    const empty = document.createElement('div');
    empty.className = 'result';
    empty.textContent = 'No titles found.';
    results.appendChild(empty);
  }
});

document.getElementById('modal').addEventListener('click', event => {
  if(event.target.id === 'modal') closeModal();
});

document.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
    if(!player.classList.contains('hidden')) closePlayer();
    if(!document.getElementById('modal').classList.contains('hidden')) closeModal();
    if(!searchPanel.classList.contains('hidden')) closeSearch();
  }
});
