let currentPlaylist = [];
const currentAudio = new Audio();
const songul1 = document.querySelector(".songul");
const cardcontainer = document.querySelector(".cardcontainer");

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
// Formats the time correctly (e.g. 03:12)
function formatTime(currentTime, duration) {
    if (isNaN(duration)) return "00:00 / 00:00";
    let currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    let totalMinutes = Math.floor(duration / 60);
    let totalSeconds = Math.floor(duration % 60);

    if (currentSeconds < 10) currentSeconds = "0" + currentSeconds;
    if (totalSeconds < 10) totalSeconds = "0" + totalSeconds;
    if (currentMinutes < 10) currentMinutes = "0" + currentMinutes;
    if (totalMinutes < 10) totalMinutes = "0" + totalMinutes;

    return `${currentMinutes}:${currentSeconds} / ${totalMinutes}:${totalSeconds}`;
}

// Cleans up the song name for the UI, works on Windows, Mac, and GitHub
function getFileName(path) {
    return decodeURI(path.split("/").pop());
}


// ==========================================
// API & DATA FETCHING
// ==========================================
// Fetches the list of albums from your main albums.json
async function fetchAlbumsList() {
    let a = await fetch(`./hrishisongs/albums.json`);
    return await a.json();
}

// Fetches info for a specific album folder
async function fetchAlbumInfo(folder) {
    let a = await fetch(`./hrishisongs/${folder}/info.json`);
    return await a.json();
}

// Fetches the list of songs inside a specific folder
async function fetchSongsList(folder) {
    let a = await fetch(`./hrishisongs/${folder}/songs.json`);
    let songFiles = await a.json();
    // Maps the raw filenames to full paths the audio player can use
    return songFiles.map(song => `./hrishisongs/${folder}/${song}`);
}


// ==========================================
// AUDIO PLAYER CONTROLS
// ==========================================
// Plays a specific track
function playMusic(track, pause = false) {
    currentAudio.src = track;
    if (!pause) {
        currentAudio.play();
        document.getElementById("play").src = "play.svg";
    }
    // Update the UI text
    document.querySelector(".songinfo").innerHTML = getFileName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Plays the next song
function playNext() {
    let currentDecoded = getFileName(currentAudio.src);
    let index = currentPlaylist.findIndex(s => getFileName(s) === currentDecoded);
    
    if (index + 1 < currentPlaylist.length) {
        playMusic(currentPlaylist[index + 1]);
    } else {
        playMusic(currentPlaylist[0]); // Loop back to the first song
    }
}

// Plays the previous song
function playPrev() {
    let currentDecoded = getFileName(currentAudio.src);
    let index = currentPlaylist.findIndex(s => getFileName(s) === currentDecoded);
    
    if ((index - 1) >= 0) {
        playMusic(currentPlaylist[index - 1]);
    } else {
        currentAudio.currentTime = 0; // Restart current song if at the beginning
        currentAudio.play();
    }
}


// ==========================================
// UI UPDATES
// ==========================================
// Updates the left sidebar with the current album's songs
function renderSongList(songs) {
    songul1.innerHTML = "";
    for (const song of songs) {
        songul1.innerHTML += `<li>
            <img src="music.svg" alt="">
            <div class="info">
                <div>${getFileName(song)}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img src="play.svg" alt="">
            </div>
        </li>`;
    }

    // Attach click events so you can click a song in the sidebar to play it
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(currentPlaylist[index]);
        });
    });
}

// Loads the album cards onto the main screen
async function displayAlbums() {
    let folders = await fetchAlbumsList();
    cardcontainer.innerHTML = "";

    for (let folder of folders) {
        let info = await fetchAlbumInfo(folder);
        
        cardcontainer.innerHTML += `<div class="card" data-folder="${folder}">
            <div class="play">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="40px" height="40px">
                    <circle cx="50" cy="50" r="48" fill="#2EE36A"/>
                    <polygon points="40,30 40,70 70,50" fill="#000000"/>
                </svg>
            </div>
            <img src="./hrishisongs/${folder}/cover.jpg" alt="">
            <h3>${info.title}</h3>
            <h4>${info.description}</h4>
        </div>`;
    }

    // Attach click events so clicking a card loads that album's playlist
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (item) => {
            let folder = item.currentTarget.dataset.folder;
            let songs = await fetchSongsList(folder);
            
            currentPlaylist = songs;
            renderSongList(songs);
            playMusic(songs[0]); // Auto-play the first song when an album is clicked
        });
    });
}


// ==========================================
// MAIN INITIALIZATION & EVENT LISTENERS
// ==========================================
async function main() {
    // 1. Load the 'h1' folder by default when the page first opens
    let initialSongs = await fetchSongsList("h1");
    currentPlaylist = initialSongs;
    renderSongList(initialSongs);
    playMusic(initialSongs[0], true); // true = paused on initial load

    // 2. Load all the album cards UI
    await displayAlbums();

    // Play/Pause button logic
    const playBtn = document.getElementById("play");
    playBtn.addEventListener("click", () => {
        if (currentAudio.paused) {
            currentAudio.play();
            playBtn.src = "play.svg";
        } else {
            currentAudio.pause();
            playBtn.src = "pause.svg";
        }
    });

    // Next / Prev buttons logic
    document.getElementById("next").addEventListener("click", playNext);
    document.getElementById("previous").addEventListener("click", playPrev);

    // Seekbar filling & auto-next logic
    currentAudio.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = formatTime(currentAudio.currentTime, currentAudio.duration);
        document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";

        // Auto play next song when the current one ends
        if (currentAudio.currentTime > 0 && currentAudio.currentTime === currentAudio.duration) {
            playNext();
        }
    });

    // Clicking anywhere on the Seekbar to skip around
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width);
        document.querySelector(".circle").style.left = percent * 100 + "%";
        currentAudio.currentTime = currentAudio.duration * percent;
    });

    // Volume Slider
    document.querySelector(".range").firstElementChild.addEventListener("change", (e) => {
        currentAudio.volume = parseInt(e.target.value) / 100;
        let volIcon = document.querySelector(".volume>img");
        if (currentAudio.volume > 0) {
            volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
        } else {
            volIcon.src = volIcon.src.replace("volume.svg", "mute.svg");
        }
    });

    // Mute Button toggle
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentAudio.volume = 0;
            document.querySelector(".range").firstElementChild.value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentAudio.volume = 0.5; // Default volume when unmuted
            document.querySelector(".range").firstElementChild.value = 50;
        }
    });

    // Mobile Hamburger Menus
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

// Start the app!
main();
