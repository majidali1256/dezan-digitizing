/**
 * Dezan Digitizing - Lightweight Cookie & Privacy Consent Banner
 * Compliant with GDPR, CCPA, and modern web accessibility standards.
 */
(function () {
    const CONSENT_KEY = 'dezan_cookie_consent';

    function initCookieConsent() {
        if (localStorage.getItem(CONSENT_KEY)) {
            return; // Consent already decided
        }

        const banner = document.createElement('div');
        banner.id = 'dezan-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie and privacy choices');
        banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] bg-white/95 dark:bg-[#16140c]/95 backdrop-blur-md border border-primary/30 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all duration-500 transform translate-y-0 text-slate-800 dark:text-slate-100';

        banner.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <span class="material-symbols-outlined text-xl">cookie</span>
                </div>
                <div class="flex-1 text-left">
                    <h4 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1">Privacy &amp; Cookie Preferences</h4>
                    <p class="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        We use essential cookies to maintain your login session and secure orders. View our 
                        <a href="privacy.html" class="text-primary font-bold hover:underline">Privacy Policy</a> to learn more.
                    </p>
                    <div class="flex items-center gap-2">
                        <button id="dezan-cookie-accept" class="flex-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-[#bfa030] text-black text-xs font-bold transition-all shadow-xs cursor-pointer">
                            Accept All
                        </button>
                        <button id="dezan-cookie-essential" class="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer">
                            Essential Only
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        function dismissBanner(choice) {
            localStorage.setItem(CONSENT_KEY, choice);
            banner.classList.add('opacity-0', 'translate-y-8');
            setTimeout(() => {
                banner.remove();
            }, 500);
        }

        const acceptBtn = document.getElementById('dezan-cookie-accept');
        const essentialBtn = document.getElementById('dezan-cookie-essential');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => dismissBanner('accepted'));
        }
        if (essentialBtn) {
            essentialBtn.addEventListener('click', () => dismissBanner('essential_only'));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        initCookieConsent();
    }
})();
