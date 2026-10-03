/**
 * EU / GDPR Compliant Cookie Consent & Google Analytics Manager
 * Band: grupa Aparāts (aparats.lv)
 */
(function () {
    'use strict';

    const GA_MEASUREMENT_ID = 'G-VW5WB2EW5R';
    const STORAGE_KEY = 'aparats_consent_v2';
    const LEGACY_KEYS = ['aparats_cookie_consent', 'aparats_cookie_consent_date'];
    const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
    const CATEGORIES = ['analytics', 'media'];

    // 1. dataLayer and gtag stub so page scripts can call gtag() safely at any time
    window.dataLayer = window.dataLayer || [];
    function pushToDataLayer() {
        window.dataLayer.push(arguments);
    }

    // Events are dropped (not queued) without analytics consent, so they cannot be sent retroactively.
    window.gtag = function () {
        if (arguments[0] === 'event' && !hasConsent('analytics')) return;
        pushToDataLayer.apply(null, arguments);
    };

    // 2. Google Consent Mode v2 defaults (all denied)
    pushToDataLayer('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });

    let gaScriptLoaded = false;
    const listeners = [];

    function loadGoogleAnalytics() {
        if (gaScriptLoaded) return;
        gaScriptLoaded = true;

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
        document.head.appendChild(script);

        pushToDataLayer('js', new Date());
        pushToDataLayer('config', GA_MEASUREMENT_ID);
    }

    function clearAnalyticsCookies() {
        const host = window.location.hostname || '';
        const domains = ['', host, '.' + host];
        const parts = host.split('.');
        if (parts.length > 2) {
            domains.push('.' + parts.slice(-2).join('.'));
        }

        document.cookie.split(';').forEach(function (c) {
            const eqPos = c.indexOf('=');
            const name = (eqPos > -1 ? c.slice(0, eqPos) : c).trim();
            if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
                domains.forEach(function (domain) {
                    const domainAttr = domain ? '; domain=' + domain : '';
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/' + domainAttr;
                });
            }
        });
    }

    // 3. Storage
    function readStoredConsent() {
        try {
            LEGACY_KEYS.forEach(function (k) { localStorage.removeItem(k); });
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            const age = Date.now() - new Date(data.date).getTime();
            if (!(age >= 0 && age < CONSENT_MAX_AGE_MS)) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    let consentState = readStoredConsent();

    function hasConsent(category) {
        return !!(consentState && consentState[category] === true);
    }

    function applyConsent() {
        if (hasConsent('analytics')) {
            pushToDataLayer('consent', 'update', { 'analytics_storage': 'granted' });
            loadGoogleAnalytics();
        } else {
            pushToDataLayer('consent', 'update', { 'analytics_storage': 'denied' });
            clearAnalyticsCookies();
        }
    }

    function saveConsent(choices) {
        consentState = { date: new Date().toISOString() };
        CATEGORIES.forEach(function (cat) {
            consentState[cat] = choices[cat] === true;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consentState));
        } catch (e) {
            // Storage may be unavailable; the choice then lasts for this page view only.
        }
        applyConsent();
        listeners.forEach(function (cb) {
            try { cb(); } catch (e) { /* ignore listener errors */ }
        });
    }

    // Public API for other page scripts (e.g. the video player)
    window.aparatsConsent = {
        has: hasConsent,
        grant: function (category) {
            const choices = {};
            CATEGORIES.forEach(function (cat) { choices[cat] = hasConsent(cat); });
            choices[category] = true;
            saveConsent(choices);
            closeBanner();
        },
        onChange: function (cb) { listeners.push(cb); },
        openSettings: function () { openModal(); }
    };

    if (consentState) {
        applyConsent();
    } else {
        clearAnalyticsCookies();
    }

    // 4. UI: banner, modal, floating trigger
    function createUI() {
        if (!document.getElementById('aparats-cookie-btn')) {
            const floatBtn = document.createElement('button');
            floatBtn.type = 'button';
            floatBtn.id = 'aparats-cookie-btn';
            floatBtn.className = 'cookie-floating-btn';
            floatBtn.setAttribute('aria-label', 'Sīkdatņu iestatījumi');
            floatBtn.setAttribute('title', 'Sīkdatņu iestatījumi');
            floatBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M21.598 11.064a1.006 1.006 0 0 0-.854-.172A3.993 3.993 0 0 1 15.5 7.5a3.996 3.996 0 0 1 1.76-3.328 1.006 1.006 0 0 0-.482-1.838A9.997 9.997 0 1 0 22 12c0-.324-.016-.643-.046-.959a1.006 1.006 0 0 0-.356-.977zM12 20a8 8 0 0 1-7.938-7.065 6.002 6.002 0 0 0 8.003-8.003A8.003 8.003 0 0 1 12 20z"/>
                    <circle cx="8.5" cy="14.5" r="1.5"/>
                    <circle cx="14.5" cy="15.5" r="1"/>
                    <circle cx="10.5" cy="9.5" r="1"/>
                </svg>
                <span class="cookie-floating-text">Sīkdatnes</span>
            `;
            floatBtn.addEventListener('click', openModal);
            document.body.appendChild(floatBtn);
        }

        if (!document.getElementById('aparats-cookie-modal')) {
            const modal = document.createElement('div');
            modal.id = 'aparats-cookie-modal';
            modal.className = 'cookie-modal-overlay';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'cookie-modal-title');
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="cookie-modal-card">
                    <div class="cookie-modal-header">
                        <h2 id="cookie-modal-title">Sīkdatņu iestatījumi</h2>
                        <button type="button" class="cookie-modal-close" id="cookie-modal-close" aria-label="Aizvērt">&times;</button>
                    </div>
                    <div class="cookie-modal-body">
                        <p class="cookie-modal-desc">
                            Jūs varat izvēlēties, kuras neobligātās kategorijas atļaut. Izvēli var mainīt vai atsaukt jebkurā brīdī, un tā tiek saglabāta 12 mēnešus. Sīkāk: <a href="privacy.html">Privātuma politika</a>.
                        </p>

                        <div class="cookie-category">
                            <div class="cookie-cat-header">
                                <div class="cookie-cat-title-wrap">
                                    <strong class="cookie-cat-name">Nepieciešamās</strong>
                                    <span class="cookie-badge cookie-badge-required">Vienmēr aktīvas</span>
                                </div>
                            </div>
                            <p class="cookie-cat-desc">
                                Jūsu sīkdatņu izvēle tiek saglabāta šī pārlūka lokālajā krātuvē (<code>${STORAGE_KEY}</code>). Tā netiek nosūtīta mums vai trešajām pusēm.
                            </p>
                        </div>

                        <div class="cookie-category">
                            <div class="cookie-cat-header">
                                <div class="cookie-cat-title-wrap">
                                    <strong class="cookie-cat-name" id="cookie-cat-analytics">Analītika</strong>
                                    <span class="cookie-badge cookie-badge-optional">Google Analytics</span>
                                </div>
                                <label class="cookie-switch">
                                    <input type="checkbox" id="cookie-toggle-analytics" aria-labelledby="cookie-cat-analytics">
                                    <span class="cookie-slider"></span>
                                </label>
                            </div>
                            <p class="cookie-cat-desc">
                                Apkopo statistiku par apmeklējumiem, skatītajām lapām, fotoalbumiem, video un audio atskaņošanu. Tiek izmantotas sīkdatnes <code>_ga</code> un <code>_ga_VW5WB2EW5R</code> (glabāšanas laiks līdz 2 gadiem) ar pseidonīmu pārlūka identifikatoru. Datus apstrādā Google Ireland Ltd.; tie var tikt nosūtīti uz ASV (Google LLC).
                            </p>
                        </div>

                        <div class="cookie-category">
                            <div class="cookie-cat-header">
                                <div class="cookie-cat-title-wrap">
                                    <strong class="cookie-cat-name" id="cookie-cat-media">Ārējie video</strong>
                                    <span class="cookie-badge cookie-badge-optional">YouTube</span>
                                </div>
                                <label class="cookie-switch">
                                    <input type="checkbox" id="cookie-toggle-media" aria-labelledby="cookie-cat-media">
                                    <span class="cookie-slider"></span>
                                </label>
                            </div>
                            <p class="cookie-cat-desc">
                                Ļauj automātiski ielādēt YouTube video sadaļā “Video”. YouTube (Google) var saglabāt sīkdatnes un savākt datus par jūsu pārlūku un skatīšanos. Bez šīs atļaujas katru video var ielādēt atsevišķi ar klikšķi.
                            </p>
                        </div>
                    </div>
                    <div class="cookie-modal-footer">
                        <button type="button" class="cookie-btn cookie-btn-save" id="cookie-modal-save">Saglabāt izvēli</button>
                        <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-modal-accept-all">Atļaut visas</button>
                        <button type="button" class="cookie-btn cookie-btn-reject" id="cookie-modal-reject-all">Noraidīt visas</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('cookie-modal-close').addEventListener('click', closeModal);
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });

            document.getElementById('cookie-modal-save').addEventListener('click', function () {
                saveConsent({
                    analytics: document.getElementById('cookie-toggle-analytics').checked,
                    media: document.getElementById('cookie-toggle-media').checked
                });
                closeModal();
                closeBanner();
            });

            document.getElementById('cookie-modal-accept-all').addEventListener('click', function () {
                saveConsent({ analytics: true, media: true });
                closeModal();
                closeBanner();
            });

            document.getElementById('cookie-modal-reject-all').addEventListener('click', function () {
                saveConsent({ analytics: false, media: false });
                closeModal();
                closeBanner();
            });

            modal.addEventListener('keydown', trapFocus);
        }

        if (!consentState && !document.getElementById('aparats-cookie-banner')) {
            const banner = document.createElement('div');
            banner.id = 'aparats-cookie-banner';
            banner.className = 'cookie-banner';
            banner.setAttribute('role', 'region');
            banner.setAttribute('aria-label', 'Sīkdatņu izmantošanas paziņojums');
            banner.innerHTML = `
                <div class="cookie-banner-content">
                    <div class="cookie-banner-text">
                        <h3 class="cookie-banner-title">Sīkdatņu izmantošana</h3>
                        <p class="cookie-banner-desc">
                            Ar jūsu piekrišanu izmantosim Google Analytics apmeklējumu statistikai un ielādēsim YouTube video, kas var saglabāt sīkdatnes. Dati var tikt nosūtīti uz ASV. Izvēli var mainīt jebkurā brīdī. <a href="privacy.html">Privātuma politika</a>
                        </p>
                    </div>
                    <div class="cookie-banner-actions">
                        <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-banner-accept">Piekrist visām</button>
                        <button type="button" class="cookie-btn cookie-btn-reject" id="cookie-banner-reject">Noraidīt neobligātās</button>
                        <button type="button" class="cookie-btn cookie-btn-settings" id="cookie-banner-settings">Pielāgot</button>
                    </div>
                </div>
            `;
            document.body.appendChild(banner);

            document.getElementById('cookie-banner-accept').addEventListener('click', function () {
                saveConsent({ analytics: true, media: true });
                closeBanner();
            });

            document.getElementById('cookie-banner-reject').addEventListener('click', function () {
                saveConsent({ analytics: false, media: false });
                closeBanner();
            });

            document.getElementById('cookie-banner-settings').addEventListener('click', openModal);

            requestAnimationFrame(function () {
                banner.classList.add('visible');
            });
        }

        document.querySelectorAll('.cookie-footer-link, [data-cookie-settings]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                openModal();
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('aparats-cookie-modal');
                if (modal && modal.classList.contains('visible')) closeModal();
            }
        });
    }

    let lastFocused = null;

    function getFocusable(container) {
        return Array.prototype.filter.call(
            container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
            function (el) { return el.offsetParent !== null; }
        );
    }

    function trapFocus(e) {
        if (e.key !== 'Tab') return;
        const focusable = getFocusable(e.currentTarget);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function openModal() {
        const modal = document.getElementById('aparats-cookie-modal');
        if (!modal) return;
        document.getElementById('cookie-toggle-analytics').checked = hasConsent('analytics');
        document.getElementById('cookie-toggle-media').checked = hasConsent('media');
        lastFocused = document.activeElement;
        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cookie-modal-open');
        document.getElementById('cookie-modal-close').focus();
    }

    function closeModal() {
        const modal = document.getElementById('aparats-cookie-modal');
        if (!modal || !modal.classList.contains('visible')) return;
        modal.classList.remove('visible');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cookie-modal-open');

        // The banner trigger may have been removed by a choice; fall back to the floating button.
        let target = lastFocused;
        if (!target || !document.body.contains(target) || target.closest('#aparats-cookie-banner')) {
            target = document.getElementById('aparats-cookie-btn');
        }
        if (target && typeof target.focus === 'function') target.focus();
        lastFocused = null;
    }

    function closeBanner() {
        const banner = document.getElementById('aparats-cookie-banner');
        if (!banner) return;
        banner.classList.remove('visible');
        setTimeout(function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
