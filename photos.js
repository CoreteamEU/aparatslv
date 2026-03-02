document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('albums-container');

    fetch('photos.json?v={{VERSION}}')
        .then(response => {
            if (!response.ok) {
                throw new Error('photos.json could not be loaded.');
            }
            return response.json();
        })
        .then(albums => {
            container.innerHTML = '';

            if (albums.length === 0) {
                container.innerHTML = '<p class="loading-text">Galerijas nav atrastas.</p>';
                return;
            }

            albums.forEach((album) => {
                const albumHTML = createAlbumHTML(album);
                const wrapper = document.createElement('div');
                wrapper.innerHTML = albumHTML;
                container.appendChild(wrapper.firstElementChild);
            });
        })
        .catch(err => {
            container.innerHTML = `<p class="error-text">Failed to load albums: ${err.message}</p>`;
        });

    function createAlbumHTML(album) {
        // Fallback if an album has no cover image
        const coverSrc = album.cover || 'images/placeholder.jpg';
        const count = album.images ? album.images.length : 0;
        const countText = count === 1 ? '1 bilde' : `${count} bildes`;

        return `
            <a href="photos_detail.html?id=${encodeURIComponent(album.id)}" class="album-card" onclick="trackAlbumClick('${album.title}')">
                <div class="album-cover-wrapper">
                    <img src="${coverSrc}" alt="${album.title}" class="album-cover" loading="lazy">
                </div>
                <div class="album-info">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-count">${countText}</p>
                </div>
            </a>
        `;
    }
});

function trackAlbumClick(title) {
    if (typeof gtag === 'function') {
        gtag('event', 'album_view_click', {
            'album_title': title
        });
    }
}
