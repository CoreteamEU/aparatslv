document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('players-container');

    // Custom audio player state
    let currentlyPlayingAudio = null;
    let currentlyPlayingBtn = null;

    fetch('sounds.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('sounds.json not found. Did you run generate_sounds.py?');
            }
            return response.json();
        })
        .then(playlists => {
            container.innerHTML = ''; // Clear loading text

            if (playlists.length === 0) {
                container.innerHTML = '<p class="loading-text">No sounds found. Add them to /mp3 and run script.</p>';
                return;
            }

            playlists.forEach((playlist, index) => {
                const playlistHTML = createPlaylistHTML(playlist, index);
                const wrapper = document.createElement('div');
                wrapper.innerHTML = playlistHTML;
                container.appendChild(wrapper.firstElementChild);
            });

            attachPlayerEvents();
        })
        .catch(err => {
            container.innerHTML = `<p class="error-text">Failed to load sounds: ${err.message}</p>`;
        });

    function createPlaylistHTML(playlist, index) {
        let tracksHTML = playlist.tracks.map((track, trackIndex) => `
            <div class="track-item" data-src="${track.file}">
                <button class="play-btn" aria-label="Play ${track.title}">▶</button>
                <div class="track-info">
                    <span class="track-title">${track.title}</span>
                    <span class="track-length">${track.length}</span>
                </div>
            </div>
        `).join('');

        return `
            <div class="playlist-card">
                <h2 class="playlist-title">${playlist.title}</h2>
                <p class="playlist-desc">${playlist.description}</p>
                
                <div class="custom-audio-player" id="player-${index}">
                    <div class="now-playing">
                        <span class="np-title">Nospied uz kādu dziesmu...</span>
                    </div>
                    <div class="progress-container">
                        <span class="time-current">0:00</span>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="time-total">0:00</span>
                    </div>
                    <audio class="html5-audio" preload="metadata"></audio>
                </div>

                <div class="track-list">
                    ${tracksHTML}
                </div>
            </div>
        `;
    }

    function attachPlayerEvents() {
        const trackItems = document.querySelectorAll('.track-item');

        trackItems.forEach(item => {
            // Updated: Listener now on the whole 'item' (row)
            item.addEventListener('click', () => {
                const playBtn = item.querySelector('.play-btn');
                const src = item.getAttribute('data-src');
                const title = item.querySelector('.track-title').textContent;
                const totalLength = item.querySelector('.track-length').textContent;

                const playlistCard = item.closest('.playlist-card');
                const audioEl = playlistCard.querySelector('.html5-audio');
                const npTitle = playlistCard.querySelector('.np-title');
                const timeTotal = playlistCard.querySelector('.time-total');
                const allBtnsInSite = document.querySelectorAll('.play-btn');
                const allItemsInSite = document.querySelectorAll('.track-item');

                // If clicking the currently playing track (toggle pause)
                if (currentlyPlayingAudio === audioEl && currentlyPlayingBtn === playBtn && !audioEl.paused) {
                    audioEl.pause();
                    playBtn.textContent = '▶';
                    playBtn.classList.remove('playing');
                    item.classList.remove('active-track');
                    return;
                }

                // Global reset for all players/tracks
                if (currentlyPlayingAudio) {
                    currentlyPlayingAudio.pause();
                }
                allBtnsInSite.forEach(btn => {
                    btn.textContent = '▶';
                    btn.classList.remove('playing');
                });
                allItemsInSite.forEach(i => i.classList.remove('active-track'));

                // Set new track
                if (audioEl.src !== window.location.origin + '/' + src) {
                    audioEl.src = src;
                    audioEl.load(); // Ensure metadata is loaded for new src
                    npTitle.textContent = title;
                    timeTotal.textContent = totalLength;

                    const progressFill = playlistCard.querySelector('.progress-fill');
                    const timeCurrent = playlistCard.querySelector('.time-current');
                    progressFill.style.width = '0%';
                    timeCurrent.textContent = '0:00';
                }

                audioEl.play()
                    .then(() => {
                        playBtn.textContent = '⏸';
                        playBtn.classList.add('playing');
                        item.classList.add('active-track');
                        currentlyPlayingAudio = audioEl;
                        currentlyPlayingBtn = playBtn;

                        // GA4 Event: Audio Play
                        if (typeof gtag === 'function') {
                            gtag('event', 'audio_play', {
                                'track_title': title,
                                'playlist': playlistCard.querySelector('.playlist-title').textContent
                            });
                        }
                    })
                    .catch(e => console.error("Audio play failed:", e));
            });
        });

        // Setup time updates and Autoplay for each player
        const players = document.querySelectorAll('.custom-audio-player');
        players.forEach(player => {
            const audio = player.querySelector('.html5-audio');
            const progressFill = player.querySelector('.progress-fill');
            const timeCurrent = player.querySelector('.time-current');
            const progressBar = player.querySelector('.progress-bar');

            // GA4 Event: Audio Pause
            audio.addEventListener('pause', () => {
                if (audio.currentTime > 0 && !audio.ended && typeof gtag === 'function') {
                    const playlistCard = player.closest('.playlist-card');
                    const activeItem = playlistCard.querySelector('.track-item.active-track');
                    const title = activeItem ? activeItem.querySelector('.track-title').textContent : 'Unknown';

                    gtag('event', 'audio_pause', {
                        'track_title': title,
                        'current_time': Math.floor(audio.currentTime)
                    });
                }
            });

            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const percent = (audio.currentTime / audio.duration) * 100;
                    progressFill.style.width = percent + '%';

                    const currentMins = Math.floor(audio.currentTime / 60);
                    const currentSecs = Math.floor(audio.currentTime % 60);
                    timeCurrent.textContent = `${currentMins}:${currentSecs.toString().padStart(2, '0')}`;
                }
            });

            audio.addEventListener('ended', () => {
                // Find current track item to find the next one
                const playlistCard = player.closest('.playlist-card');
                const activeItem = playlistCard.querySelector('.track-item.active-track');

                if (activeItem) {
                    const nextItem = activeItem.nextElementSibling;
                    if (nextItem && nextItem.classList.contains('track-item')) {
                        // Autoplay next track
                        nextItem.click();
                    } else {
                        // End of playlist
                        if (currentlyPlayingBtn) {
                            currentlyPlayingBtn.textContent = '▶';
                            currentlyPlayingBtn.classList.remove('playing');
                        }
                        activeItem.classList.remove('active-track');
                        progressFill.style.width = '0%';
                        timeCurrent.textContent = '0:00';
                    }
                }
            });

            progressBar.addEventListener('click', (e) => {
                if (audio.duration) {
                    const rect = progressBar.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    audio.currentTime = percent * audio.duration;
                }
            });
        });
    }
});
