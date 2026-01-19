// --- 1. ENTER SITE ---
function enterSite() {
  document.getElementById('welcomeOverlay').classList.add('hidden-overlay');
}

document.addEventListener('DOMContentLoaded', () => {
  // --- VARIABLES ---
  const wall = document.getElementById("wall");
  const submitBtn = document.getElementById("submitBtn");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const toInput = document.getElementById("toInput");
  const messageInput = document.getElementById("messageInput");
  const filterInput = document.getElementById("filterInput");
  const toggleThemeBtn = document.getElementById("toggleTheme");
  
  let selectedSong = null;
  let currentAudio = null;
  let debounceTimer;

  // --- 2. THEME HANDLING ---
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }

  toggleThemeBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // --- 3. PARTICLES ---
  const particlesContainer = document.getElementById("particles");
  setInterval(() => {
    const p = document.createElement("div");
    p.classList.add("particle");
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`; p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}vw`;
    particlesContainer.appendChild(p);
    setTimeout(() => p.remove(), 15000);
  }, 800);

  // --- 4. DATA HANDLING ---
  const STORAGE_KEY = 'fw_final_v4';

  function loadMessages() {
    wall.innerHTML = '';
    const saved = localStorage.getItem(STORAGE_KEY);
    const messages = saved ? JSON.parse(saved) : [];
    
    if (messages.length === 0) {
      wall.innerHTML = `<div class="col-span-full text-center p-10 opacity-50">No messages yet. Write one!</div>`;
      return;
    }
    
    // Sort newest first
    messages.sort((a, b) => b.id - a.id);
    messages.forEach(renderCard);
  }

  function saveMessage(data) {
    const saved = localStorage.getItem(STORAGE_KEY);
    const messages = saved ? JSON.parse(saved) : [];
    messages.unshift(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  // --- 5. RENDER CARD ---
  function renderCard(data) {
    const card = document.createElement("div");
    card.className = `msg-card theme-${data.mood || 'purple'}`;
    card.dataset.to = data.to.toLowerCase();
    card.id = `msg-${data.id}`;

    const likes = data.likes || 0;

    let songHtml = '';
    if (data.song) {
      songHtml = `
        <div class="flex items-center gap-3 mt-4 bg-black/5 p-2 rounded-lg">
          <img src="${data.song.artworkUrl60}" class="w-10 h-10 rounded">
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold truncate">${data.song.trackName}</div>
            <div class="text-xs opacity-60 truncate">${data.song.artistName}</div>
          </div>
          <button class="play-btn w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-xs text-black" onclick="playSong(this, '${data.song.previewUrl}')">
            <i class="fas fa-play ml-0.5"></i>
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="text-xs font-bold uppercase opacity-50 mb-1">To:</div>
      <h3>${data.to}</h3>
      <p class="mt-2 text-sm">${data.message}</p>
      ${songHtml}
      
      <div class="card-actions">
        <button class="react-btn" onclick="toggleLike(${data.id})">
          <i class="fas fa-heart"></i> <span id="like-count-${data.id}">${likes}</span>
        </button>
        <i class="fas fa-trash-alt delete-icon" onclick="deleteMessage(${data.id})"></i>
      </div>
    `;

    wall.append(card);
  }

  // --- 6. ACTIONS ---

  window.toggleLike = (id) => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const msgIndex = saved.findIndex(m => m.id === id);
    
    if (msgIndex !== -1) {
      saved[msgIndex].likes = (saved[msgIndex].likes || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      
      const countSpan = document.getElementById(`like-count-${id}`);
      if(countSpan) countSpan.textContent = saved[msgIndex].likes;
      
      const btn = document.querySelector(`#msg-${id} .react-btn`);
      btn.classList.add('active');
    }
  };
  
  // Search Songs
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const term = searchInput.value.trim();
    if (!term) { searchResults.classList.add('hidden'); return; }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=4`);
        const data = await res.json();
        searchResults.innerHTML = '';
        searchResults.classList.remove('hidden');

        data.results.forEach(song => {
          const item = document.createElement('div');
          item.className = 'search-item';
          item.innerHTML = `
            <img src="${song.artworkUrl60}" class="w-8 h-8 rounded">
            <div class="text-xs">
              <div class="font-bold">${song.trackName}</div>
              <div class="opacity-60">${song.artistName}</div>
            </div>
          `;
          item.onclick = () => {
            selectedSong = song;
            searchInput.value = `${song.trackName} - ${song.artistName}`;
            searchResults.classList.add('hidden');
          };
          searchResults.appendChild(item);
        });
      } catch (e) {}
    }, 500);
  });

  // Submit
  submitBtn.addEventListener("click", () => {
    const to = toInput.value.trim();
    if (!to) return alert("Who is this for?");

    const moodEl = document.querySelector('input[name="mood"]:checked');
    const mood = moodEl ? moodEl.value : 'purple';

    const data = {
      to,
      message: messageInput.value.trim(),
      song: selectedSong,
      mood,
      likes: 0,
      id: Date.now()
    };

    if (wall.querySelector('.text-center')) wall.innerHTML = '';
    renderCard(data);
    saveMessage(data);

    // Confetti removed here

    toInput.value = '';
    messageInput.value = '';
    searchInput.value = '';
    selectedSong = null;
  });

  // Filter
  filterInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    Array.from(wall.children).forEach(card => {
      card.style.display = card.dataset.to.includes(term) ? "flex" : "none";
    });
  });

  window.deleteMessage = (id) => {
    if (!confirm("Delete this?")) return;
    const card = document.getElementById(`msg-${id}`);
    card.remove();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = saved.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (updated.length === 0) loadMessages();
  };

  window.playSong = (btn, url) => {
    const audio = new Audio(url);
    if (currentAudio && currentAudio.src === audio.src) {
      if (currentAudio.paused) {
        currentAudio.play();
        btn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        currentAudio.pause();
        btn.innerHTML = '<i class="fas fa-play ml-0.5"></i>';
      }
    } else {
      if (currentAudio) {
        currentAudio.pause();
        document.querySelectorAll('.play-btn').forEach(b => b.innerHTML = '<i class="fas fa-play ml-0.5"></i>');
      }
      currentAudio = audio;
      audio.play();
      btn.innerHTML = '<i class="fas fa-pause"></i>';
      audio.onended = () => btn.innerHTML = '<i class="fas fa-play ml-0.5"></i>';
    }
  };

  loadMessages();
});
