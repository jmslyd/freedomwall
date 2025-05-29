// Welcome overlay
const welcomeOverlay = document.getElementById("welcomeOverlay");
const mainContent = document.getElementById("mainContent");

setTimeout(() => {
  welcomeOverlay.style.animation = "overlayFadeOut 1.5s ease forwards";
  setTimeout(() => {
    welcomeOverlay.style.display = "none";
    mainContent.style.display = "block";
  }, 1500);
}, 3000);  // Changed from 5000 to 3000

// Theme toggle
const toggleThemeBtn = document.getElementById("toggleTheme");
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
  toggleThemeBtn.textContent = 'Light Mode';
  toggleThemeBtn.classList.remove('light-mode');
  toggleThemeBtn.classList.add('dark-mode');
} else {
  toggleThemeBtn.classList.remove('dark-mode');
  toggleThemeBtn.classList.add('light-mode');
}

toggleThemeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  toggleThemeBtn.textContent = isDark ? "Light Mode" : "Dark Mode";

  if (isDark) {
    toggleThemeBtn.classList.remove('light-mode');
    toggleThemeBtn.classList.add('dark-mode');
  } else {
    toggleThemeBtn.classList.remove('dark-mode');
    toggleThemeBtn.classList.add('light-mode');
  }

  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Particles
const particlesContainer = document.getElementById("particles");
function createParticle() {
  const particle = document.createElement("div");
  particle.classList.add("particle");
  const size = Math.random() * 6 + 4;
  particle.style.width = size + "px";
  particle.style.height = size + "px";
  particle.style.left = Math.random() * window.innerWidth + "px";
  particle.style.animationDuration = (Math.random() * 10 + 5) + "s";
  particlesContainer.appendChild(particle);
  setTimeout(() => particlesContainer.removeChild(particle), 15000);
}
setInterval(createParticle, 300);

// Variables
const toInput = document.getElementById("toInput");
const messageInput = document.getElementById("messageInput");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const submitBtn = document.getElementById("submitBtn");
const wall = document.getElementById("wall");
const filterInput = document.getElementById("filterInput");

let selectedSong = null;
let currentAudio = null;
const STORAGE_KEY = 'freedomWallMessages';

// Load messages
function loadMessages() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const messages = JSON.parse(saved);
    messages.forEach(addMessageToWall);
  } catch (e) {
    console.error("Failed to load saved messages:", e);
  }
}

// Save
function saveMessage(data) {
  let messages = [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      messages = JSON.parse(saved);
    } catch {
      messages = [];
    }
  }
  messages.unshift(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// Search
async function searchSongs(term) {
  if (!term) {
    clearSearchResults();
    return;
  }
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10`);
  const data = await res.json();
  displaySearchResults(data.results);
}

function displaySearchResults(songs) {
  clearSearchResults();
  if (songs.length === 0) {
    searchResults.innerHTML = "<p class='p-2 text-gray-500 dark:text-gray-300'>No results found.</p>";
    return;
  }
  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2";
    div.innerHTML = `
      <img src="${song.artworkUrl60}" alt="Album Art" class="w-12 h-12 rounded" />
      <div class="text-sm flex-1">
        <div class="font-semibold">${song.trackName}</div>
        <div class="text-gray-600 dark:text-gray-400">${song.artistName}</div>
      </div>
    `;
    div.onclick = () => {
      selectedSong = song;
      searchInput.value = `${song.trackName} - ${song.artistName}`;
      clearSearchResults();
    };
    searchResults.appendChild(div);
  });
}

function clearSearchResults() {
  searchResults.innerHTML = "";
}

searchInput.addEventListener("input", () => {
  searchSongs(searchInput.value.trim());
});

submitBtn.addEventListener("click", () => {
  const to = toInput.value.trim();
  if (!to) return alert("Please enter the recipient's name.");
  const message = messageInput.value.trim();
  const song = selectedSong;

  const data = { to, message, song, id: Date.now() };
  addMessageToWall(data);
  saveMessage(data);
  clearForm();
});

function addMessageToWall({to, message, song}) {
  const card = document.createElement("div");
  card.className = "bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative gradient-border";

  const toEl = document.createElement("h3");
  toEl.className = "text-xl font-bold mb-2";
  toEl.textContent = to;
  card.appendChild(toEl);

  if (message) {
    const msgEl = document.createElement("p");
    msgEl.className = "mb-3";
    msgEl.textContent = message;
    card.appendChild(msgEl);
  }

  if (song) {
    const songDiv = document.createElement("div");
    songDiv.className = "flex items-center gap-3 mb-3";
    songDiv.innerHTML = `
      <img src="${song.artworkUrl100}" alt="Album Art" class="w-16 h-16 rounded">
      <div class="flex-1">
        <div class="font-semibold">${song.trackName}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">${song.artistName}</div>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "play-btn";
    btn.textContent = "Play";
    const audio = new Audio(song.previewUrl);
    btn.onclick = () => {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      if (audio.paused) {
        audio.play();
        btn.textContent = "Pause";
        currentAudio = audio;
      } else {
        audio.pause();
        btn.textContent = "Play";
      }
    };
    audio.onended = () => (btn.textContent = "Play");
    songDiv.appendChild(btn);
    card.appendChild(songDiv);
  }

  card.dataset.to = to.toLowerCase();
  wall.prepend(card);
  setTimeout(() => card.classList.add("visible"), 10);
}

function clearForm() {
  toInput.value = "";
  messageInput.value = "";
  searchInput.value = "";
  selectedSong = null;
  clearSearchResults();
}

filterInput.addEventListener("input", () => {
  const filter = filterInput.value.toLowerCase();
  [...wall.children].forEach(card => {
    card.style.display = card.dataset.to.includes(filter) ? "" : "none";
  });
});

loadMessages();
