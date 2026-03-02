let currentImages = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        document.getElementById('album-title').textContent = "Albuma ID nav norādīts";
        document.getElementById('album-title').dataset.text = "Error";
        document.getElementById('photos-grid').innerHTML = '<p class="error-text">Lūdzu, atgriežaties pie visām galerijām.</p>';
        return;
    }

    const grid = document.getElementById('photos-grid');
    const titleEl = document.getElementById('album-title');

    // Smart versioning fallback for local dev
    const version = '{{VERSION}}';
    const fetchUrl = `photos.json?v=${version === '{{VERSION}}' ? Date.now() : version}`;

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) throw new Error('Neizdevās ielādēt json datus.');
            return response.json();
        })
        .then(albums => {
            const album = albums.find(a => a.id === albumId);

            if (!album) {
                titleEl.textContent = "Albums nav atrasts";
                grid.innerHTML = '<p class="error-text">Šāds albums neeksistē.</p>';
                return;
            }

            // Set Title
            titleEl.textContent = album.title;
            titleEl.dataset.text = album.title;
            document.title = `grupa Aparāts - ${album.title}`;

            // Track page view for specific album
            if (typeof gtag === 'function') {
                gtag('event', 'page_view', {
                    page_title: document.title,
                    page_location: location.href,
                    page_path: location.pathname
                });
            }

            // Render Thumbnails
            currentImages = album.images || [];
            grid.innerHTML = '';

            if (currentImages.length === 0) {
                grid.innerHTML = '<p class="loading-text">Šajā albumā nav bilžu.</p>';
                return;
            }

            currentImages.forEach((imgSrc, index) => {
                const imgHTML = `
                    <div class="photo-thumbnail" onclick="openLightbox(${index})">
                        <img src="${imgSrc}" loading="lazy" alt="Photo ${index + 1}">
                    </div>
                `;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = imgHTML;
                grid.appendChild(wrapper.firstElementChild);
            });
        })
        .catch(err => {
            grid.innerHTML = `<p class="error-text">Kļūda ielādējot albumu: ${err.message}</p>`;
        });

    // Close lightbox on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'ArrowRight') changeImage(1);
    });
});

// Lightbox Functions
function openLightbox(index) {
    if (index < 0 || index >= currentImages.length) return;

    currentIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    lightboxImg.src = currentImages[currentIndex];
    caption.textContent = `Bilde ${currentIndex + 1} no ${currentImages.length}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent page scrolling

    // Track Image view event
    if (typeof gtag === 'function') {
        const urlParams = new URLSearchParams(window.location.search);
        gtag('event', 'image_view', {
            'album_id': urlParams.get('id'),
            'image_index': currentIndex
        });
    }
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function changeImage(direction) {
    currentIndex += direction;

    // Loop around
    if (currentIndex >= currentImages.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = currentImages.length - 1;

    const lightboxImg = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    lightboxImg.src = currentImages[currentIndex];
    caption.textContent = `Bilde ${currentIndex + 1} no ${currentImages.length}`;
}

// Close lightbox if clicking outside image
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
    }
});
