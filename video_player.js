document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('videos-container');

    // Smart versioning: use {{VERSION}} in production, fallback to timestamp in local dev
    const version = '{{VERSION}}';
    const fetchUrl = `videos_list.json?v=${version === '{{VERSION}}' ? Date.now() : version}`;

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('videos.json not found.');
            }
            return response.json();
        })
        .then(videos => {
            container.innerHTML = '';

            if (videos.length === 0) {
                container.innerHTML = '<p class="loading-text">Video nav atrasti.</p>';
                return;
            }

            videos.forEach((video) => {
                const videoHTML = createVideoHTML(video);
                const wrapper = document.createElement('div');
                wrapper.innerHTML = videoHTML;
                container.appendChild(wrapper.firstElementChild);
            });

            if (hasMediaConsent()) loadAllVideos();
        })
        .catch(err => {
            container.innerHTML = `<p class="error-text">Failed to load videos: ${err.message}</p>`;
        });

    function createVideoHTML(video) {
        return `
            <div class="playlist-card" onclick="trackVideoClick('${video.title}')">
                <h2 class="playlist-title">${video.title}</h2>
                <p class="playlist-desc">${video.description}</p>
                <div class="video-wrapper" data-video-id="${video.id}" data-video-title="${video.title}">
                    ${placeholderHTML()}
                </div>
            </div>
        `;
    }

    // YouTube is only contacted after consent: per video on click, or for all once "media" is granted.
    function hasMediaConsent() {
        return !!(window.aparatsConsent && window.aparatsConsent.has('media'));
    }

    function placeholderHTML() {
        return `
            <div class="video-consent">
                <p class="video-consent-text">Video tiek rādīts no YouTube. Ielādējot to, YouTube (Google) var saglabāt sīkdatnes un savākt datus par jūsu pārlūku. <a href="privacy.html">Privātuma politika</a></p>
                <div class="video-consent-actions">
                    <button type="button" class="cookie-btn cookie-btn-accept" data-video-load>Ielādēt video</button>
                    <button type="button" class="cookie-btn cookie-btn-reject" data-video-load-all>Vienmēr rādīt YouTube video</button>
                </div>
            </div>
        `;
    }

    function loadVideo(wrapper) {
        if (wrapper.querySelector('iframe')) return;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(wrapper.dataset.videoId)}`;
        iframe.title = wrapper.dataset.videoTitle || 'YouTube video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        wrapper.innerHTML = '';
        wrapper.appendChild(iframe);
    }

    function loadAllVideos() {
        container.querySelectorAll('.video-wrapper[data-video-id]').forEach(loadVideo);
    }

    function unloadAllVideos() {
        container.querySelectorAll('.video-wrapper[data-video-id]').forEach(wrapper => {
            if (wrapper.querySelector('iframe')) wrapper.innerHTML = placeholderHTML();
        });
    }

    container.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.video-wrapper[data-video-id]');
        if (!wrapper) return;
        if (e.target.closest('[data-video-load]')) {
            loadVideo(wrapper);
        } else if (e.target.closest('[data-video-load-all]') && window.aparatsConsent) {
            window.aparatsConsent.grant('media');
        }
    });

    if (window.aparatsConsent) {
        window.aparatsConsent.onChange(() => {
            if (hasMediaConsent()) {
                loadAllVideos();
            } else {
                unloadAllVideos();
            }
        });
    }
});

function trackVideoClick(title) {
    if (typeof gtag === 'function') {
        gtag('event', 'video_view_click', {
            'video_title': title
        });
    }
}
