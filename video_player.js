document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('videos-container');

    // Using a simple fetch with local dev fallback for JSON versioning
    fetch('videos.json?v={{VERSION}}')
        .then(response => {
            if (!response.ok) {
                // Try without version param in case of local testing if the server complains, though it shouldn't
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
            <div class="playlist-card">
                <h2 class="playlist-title">${video.title}</h2>
                <p class="playlist-desc">${video.description}</p>
                <div class="video-wrapper">
                    <iframe src="https://www.youtube.com/embed/${video.id}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                </div>
            </div>
        `;
    }
});
