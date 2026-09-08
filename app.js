// UrbanAnimeTv — app.js v3
// Front-end interactions for navigation, search, player, My List, details, catalog, and demo sign-in.

document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('player');
  const video = document.getElementById('video');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody =
    document.getElementById('modalBody') ||
    modal?.querySelector('.modal-body, .modal-content p, p');

  const searchPanel = document.getElementById('searchPanel');
  const searchInput = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const listLabel = document.getElementById('listLabel');

  const MY_LIST_KEY = 'urbananimetv-my-list';
  const SIGN_IN_KEY = 'urbananimetv-demo-profile';

  // ---------- Helpers ----------
  const getMyList = () => {
    try {
      return JSON.parse(localStorage.getItem(MY_LIST_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setMyList = (list) => {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
  };

  const scrollToSection = (selector) => {
    if (selector === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const section = document.querySelector(selector);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Video player ----------
  document.querySelectorAll('[data-play]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const source = button.dataset.play;
      if (!source || !player || !video) return;

      video.src = source;
      player.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      video.play().catch(() => {});
    });
  });

  window.closePlayer = function closePlayer() {
    if (!player || !video) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    player.classList.add('hidden');
    document.body.style.overflow = '';
  };

  document.getElementById('closePlayer')?.addEventListener('click', window.closePlayer);

  // ---------- Modal ----------
  window.showInfo = function showInfo(title, message) {
    if (!modal) return;

    if (modalTitle) modalTitle.textContent = title || 'UrbanAnimeTv';

    if (modalBody) {
      modalBody.textContent =
        message ||
        (title === 'Profile'
          ? 'Account sign-in is coming soon. The current site is the first front-end version of UrbanAnimeTv.'
          : 'More information will be added here as UrbanAnimeTv grows.');
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  // Make Sign In useful without pretending there is a real account backend yet.
  const signInButton = Array.from(document.querySelectorAll('button, a')).find(
    (el) => el.textContent.trim().toLowerCase() === 'sign in'
  );

  if (signInButton) {
    signInButton.addEventListener('click', (event) => {
      event.preventDefault();
      window.showInfo(
        'Sign In',
        'UrbanAnimeTv accounts are not connected to a database yet. Sign-in will be activated when the account system is added.'
      );
    });
  }

  // Details buttons
  document.querySelectorAll('.card button, [data-details]').forEach((button) => {
    if (button.hasAttribute('data-play')) return;
    if (!button.textContent.toLowerCase().includes('detail') && !button.hasAttribute('data-details')) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const card = button.closest('.card');
      const title = card?.querySelector('h3')?.textContent?.trim() || 'Title Details';
      const description =
        card?.querySelector('p')?.textContent?.trim() ||
        'Full title details, episodes, cast, and release information will appear here.';
      window.showInfo(title, description);
    });
  });

  // Clicking outside the modal closes it.
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) window.closeModal();
  });

  // ---------- My List ----------
  const updateListLabel = () => {
    if (!listLabel) return;
    const list = getMyList();
    listLabel.textContent = list.includes('HoodGods') ? 'Added ✓' : 'My List';
  };

  window.toggleMyList = function toggleMyList(title = 'HoodGods') {
    const list = getMyList();
    const index = list.indexOf(title);

    if (index === -1) {
      list.push(title);
    } else {
      list.splice(index, 1);
    }

    setMyList(list);
    updateListLabel();
  };

  updateListLabel();

  // ---------- Navigation ----------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target =
        href === '#home' ? document.body : document.querySelector(href);

      if (target) {
        event.preventDefault();
        scrollToSection(href);
      }
    });
  });

  // Home button/link fallback
  Array.from(document.querySelectorAll('a, button')).forEach((element) => {
    if (element.textContent.trim().toLowerCase() === 'home' && !element.getAttribute('href')) {
      element.addEventListener('click', () => scrollToSection('#home'));
    }
  });

  // View All: scroll to the full Series section if it exists.
  Array.from(document.querySelectorAll('a, button')).forEach((element) => {
    const text = element.textContent.trim().toLowerCase();
    if (text === 'view all' || text === 'view all →') {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        scrollToSection('#series');
      });
    }
  });

  // ---------- Search ----------
  const searchButton = document.getElementById('searchBtn');

  searchButton?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!searchPanel) return;

    searchPanel.classList.toggle('hidden');

    if (!searchPanel.classList.contains('hidden')) {
      setTimeout(() => searchInput?.focus(), 50);
    }
  });

  window.closeSearch = function closeSearch() {
    if (!searchPanel) return;
    searchPanel.classList.add('hidden');
    if (searchInput) searchInput.value = '';
    if (results) results.innerHTML = '';
  };

  const searchableTitles = () => {
    return Array.from(document.querySelectorAll('.card')).map((card) => ({
      card,
      title: card.querySelector('h3')?.textContent?.trim() || '',
      text: card.innerText.toLowerCase()
    }));
  };

  searchInput?.addEventListener('input', () => {
    if (!results) return;

    const query = searchInput.value.toLowerCase().trim();
    results.innerHTML = '';

    if (!query) return;

    const matches = searchableTitles().filter((item) => item.text.includes(query));

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'result';
      empty.textContent = 'No titles found.';
      results.appendChild(empty);
      return;
    }

    matches.forEach((item) => {
      const result = document.createElement('button');
      result.type = 'button';
      result.className = 'result';
      result.textContent = item.title || 'Untitled';
      result.addEventListener('click', () => {
        item.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.closeSearch();
      });
      results.appendChild(result);
    });
  });

  // ---------- Keyboard controls ----------
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (player && !player.classList.contains('hidden')) window.closePlayer();
    if (modal && !modal.classList.contains('hidden')) window.closeModal();
    if (searchPanel && !searchPanel.classList.contains('hidden')) window.closeSearch();
  });

  // ---------- Active navigation ----------
  const sections = ['series', 'movies', 'new-releases']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        document.querySelectorAll('nav a[href^="#"]').forEach((link) => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${visible.target.id}`
          );
        });
      },
      { threshold: [0.2, 0.5, 0.8] }
    );

    sections.forEach((section) => observer.observe(section));
  }
});
