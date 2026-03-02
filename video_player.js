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
        })
        .catch(err => {
            container.innerHTML = `<p class="error-text">Failed to load videos: ${err.message}</p>`;
        });

    function createVideoHTML(video) {
        return `
            <div class="playlist-card" onclick="trackVideoClick('${video.title}')">
                <h2 class="playlist-title">${video.title}</h2>
                <p class="playlist-desc">${video.description}</p>
                <div class="video-wrapper">
                    <iframe src="https://www.youtube.com/embed/${video.id}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                </div>
            </div>
        `;
    }
});

function trackVideoClick(title) {
    if (typeof gtag === 'function') {
        gtag('event', 'video_view_click', {
            'video_title': title
        });
    }
}
