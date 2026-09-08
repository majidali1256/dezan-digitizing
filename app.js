/**
 * Dezan Digitizing — Shared JavaScript
 * Theme toggle, scroll reveal, active navigation, order system,
 * PayPal payment, and EmailJS notification
 */

document.addEventListener("DOMContentLoaded", () => {

    // ===== ADAPTIVE ENVIRONMENT ROUTING (LOCAL ONLY) =====
    // If running locally, rewrite actions pointing to process_form.php back to Web3Forms
    // so the user can test email delivery and uploads without a local PHP server.
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    if (isLocal) {
        document.querySelectorAll('form[action="process_form.php"]').forEach(form => {
            form.setAttribute("action", "https://api.web3forms.com/submit");
        });
    }

    // ===== THEME TOGGLE =====
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    // Apply saved theme or default to light
    if (savedTheme === "dark") {
        html.classList.add("dark");
    } else {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }

    // Update all theme toggle icons
    function updateThemeIcons() {
        const isDark = html.classList.contains("dark");
        document.querySelectorAll(".theme-toggle-icon").forEach(icon => {
            icon.textContent = isDark ? "light_mode" : "dark_mode";
        });
    }
    updateThemeIcons();

    // Bind click to all toggle buttons
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            html.classList.toggle("dark");
            const isDark = html.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcons();
        });
    });

    // ===== DYNAMIC HEADER AUTH STATE (LOGIN BUTTON vs PREVIOUS ACCOUNT ICON) =====
    function initHeaderAuthState() {
        const slots = document.querySelectorAll('#header-auth-slot, .header-auth-slot');
        if (!slots.length) return;        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (e) {
            session = null;
        }

        slots.forEach(slot => {
            if (session && session.role) {
                // Logged in: show previous account_circle icon!
                let dashboardUrl = 'client-portal.html';
                if (session.role === 'admin') dashboardUrl = 'admin-portal.html';
                else if (session.role === 'digitizer') dashboardUrl = 'worker-portal.html';

                slot.innerHTML = `
                    <div class="relative">
                        <button id="user-header-btn" class="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-slate-800 dark:text-primary hover:bg-primary/30 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" title="${session.displayName || 'My Account'}">
                            <span class="material-symbols-outlined text-xl">account_circle</span>
                        </button>
                        <div id="user-header-menu" class="hidden absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xl py-2 z-50 transition-all text-xs">
                            <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                <p class="font-bold text-slate-900 dark:text-white truncate">${session.displayName || 'User'}</p>
                                <p class="text-[11px] text-slate-500 truncate">${session.email || ''}</p>
                                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/15 text-slate-900 dark:text-primary">${session.role}</span>
                            </div>
                            <a href="${dashboardUrl}" class="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                <span class="material-symbols-outlined text-base">dashboard</span>
                                <span>Go to Dashboard</span>
                            </a>
                            <button id="header-signout-btn" class="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold text-left">
                                <span class="material-symbols-outlined text-base">logout</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                `;

                const btn = slot.querySelector('#user-header-btn');
                const menu = slot.querySelector('#user-header-menu');
                if (btn && menu) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        menu.classList.toggle('hidden');
                    });
                }

                const signOutBtn = slot.querySelector('#header-signout-btn');
                if (signOutBtn) {
                    signOutBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('dezan_session');
                        if (typeof localStorage !== 'undefined') localStorage.removeItem('dezan_session');
                        initHeaderAuthState();
                        if (window.location.pathname.includes('-portal.html')) {
                            window.location.href = 'portal-login.html';
                        }
                    });
                } 
            } else {
                // Logged out: show Login button!
                slot.innerHTML = `
                    <a href="portal-login.html" class="header-login-btn px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/15 hover:bg-primary hover:text-background-dark dark:hover:bg-primary dark:hover:text-background-dark text-primary border border-primary/25 dark:border-primary/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                        <span class="material-symbols-outlined text-sm">login</span>
                        <span>Login</span>
                    </a>
                `;
            }
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
        document.querySelectorAll('#user-header-menu').forEach(menu => {
            if (!menu.contains(e.target) && !menu.previousElementSibling?.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    });

    // Listen for storage changes across tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'dezan_session') {
            initHeaderAuthState();
        }
    });

    initHeaderAuthState();

    // ===== STAFF ORDER RESTRICTION MODAL =====
    // Disallows admin or digitizer staff accounts from placing customer orders or requesting quotes.
    window.showStaffOrderBlockModal = function(role, email) {
        let modal = document.getElementById('staff-order-blocked-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'staff-order-blocked-modal';
            modal.className = 'fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto';
            modal.setAttribute('role', 'alertdialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'staff-block-title');

            modal.innerHTML = `
                <div class="w-full max-w-md bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden transform transition-all">
                    <!-- Subtle Glow Background Accent -->
                    <div class="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 dark:bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>

                    <!-- Close button -->
                    <button type="button" onclick="window.closeStaffOrderBlockModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Close">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>

                    <!-- Icon Banner -->
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4.5 shrink-0 shadow-inner">
                        <span class="material-symbols-outlined text-3xl">shield_lock</span>
                    </div>

                    <!-- Primary Message -->
                    <h3 id="staff-block-title" class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        You can't place orders from this account
                    </h3>

                    <!-- Body Description -->
                    <div class="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                        <p>
                            You are currently signed in as a <span id="staff-block-role" class="font-bold text-slate-900 dark:text-white uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"></span> staff member (<span id="staff-block-email" class="font-semibold text-primary"></span>).
                        </p>
                        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Orders and quote requests can only be placed by client accounts or guest customers. Staff roles are reserved for production management and digitizing workflow.
                        </p>
                    </div>

                    <!-- Actions Stack -->
                    <div class="mt-6 flex flex-col gap-2.5">
                        <button type="button" id="staff-sign-out-order-btn" onclick="window.signOutStaffToGuestOrder()" class="w-full py-3 px-4 rounded-xl bg-primary hover:bg-[#c49f28] text-background-dark font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <span class="material-symbols-outlined text-base">logout</span>
                            <span>Sign Out to Order as Guest</span>
                        </button>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <a id="staff-portal-btn" href="admin-portal.html" class="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-primary/25 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center">
                                <span class="material-symbols-outlined text-sm">dashboard</span>
                                <span>My Dashboard</span>
                            </a>

                            <button type="button" onclick="window.closeStaffOrderBlockModal()" class="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer">
                                <span>Dismiss</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const roleText = (role || 'Staff').toUpperCase();
        const roleEl = modal.querySelector('#staff-block-role');
        const emailEl = modal.querySelector('#staff-block-email');
        const portalBtn = modal.querySelector('#staff-portal-btn');

        if (roleEl) roleEl.textContent = roleText;
        if (emailEl) emailEl.textContent = email || (role === 'digitizer' ? 'digitizer@dezandigitizing.com' : 'admin@dezandigitizing.com');
        if (portalBtn) {
            portalBtn.href = (role === 'digitizer') ? 'worker-portal.html' : 'admin-portal.html';
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeStaffOrderBlockModal = function() {
        const modal = document.getElementById('staff-order-blocked-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
    };

    window.signOutStaffToGuestOrder = function() {
        window.closeStaffOrderBlockModal();
        try {
            if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('dezan_session');
            if (typeof localStorage !== 'undefined') localStorage.removeItem('dezan_session');
            if (window.insforgeClient && typeof window.insforgeClient.logout === 'function') {
                window.insforgeClient.logout();
            }
        } catch (e) {}

        if (typeof window.initHeaderAuthState === 'function') {
            window.initHeaderAuthState();
        }

        setTimeout(() => {
            if (typeof window.openOrderQuoteModal === 'function') {
                window.openOrderQuoteModal({ isQuote: false });
            } else if (typeof window.openGuestCheckoutModal === 'function') {
                window.openGuestCheckoutModal();
            }
        }, 150);
    };

    // ===== GLOBAL AUTHENTICATED ORDER & QUOTE DISPATCHER =====
    // Directs unauthenticated users to portal-login.html before ordering or requesting quotes.
    // Directs authenticated clients directly to client-portal.html?action=new_order or action=request_quote
    window.handleOrderClick = function(e, service = null, plan = null) {
        if (e && e.preventDefault) e.preventDefault();

        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (err) {
            session = null;
        }

        if (session && (session.role === 'admin' || session.role === 'digitizer')) {
            window.showStaffOrderBlockModal(session.role, session.email);
            return;
        } else {
            // Open the unified Order modal directly on current page
            if (typeof window.openOrderQuoteModal === 'function') {
                window.openOrderQuoteModal({ service, plan, isQuote: false });
            } else if (typeof window.openNewOrderModal === 'function') {
                window.openNewOrderModal({ service, plan });
            } else if (typeof window.openGuestCheckoutModal === 'function') {
                window.openGuestCheckoutModal({ service, plan });
            }
        }
    };

    // ===================================================================
    //  INSTANT GUEST CHECKOUT MODAL SYSTEM
    // ===================================================================
    const guestOrderState = {
        isQuote: false,
        service: 'Digitizing',
        plan: 'Left Chest / Hat',
        price: 15.00,
        paymentMethod: 'Credit Card',
        file: null,
        fileDataUrl: null
    };

    function ensureInsforgeClient() {
        if (typeof window !== 'undefined' && !window.insforgeClient) {
            const existing = document.querySelector('script[src*="insforge-client.js"]');
            if (!existing) {
                const s = document.createElement('script');
                s.src = 'js/insforge-client.js';
                s.async = false;
                document.head.appendChild(s);
            }
        }
    }
    ensureInsforgeClient();

    function ensurePayPalConfig() {
        if (typeof window !== 'undefined' && !window.PayPalConfig) {
            const existing = document.querySelector('script[src*="paypal-config.js"]');
            if (!existing) {
                const s = document.createElement('script');
                s.src = 'js/paypal-config.js';
                s.async = false;
                document.head.appendChild(s);
            }
        }
    }
    ensurePayPalConfig();

    function createGuestCheckoutModalElement() {
        const wrap = document.createElement('div');
        wrap.id = 'guest-checkout-modal';
        wrap.className = 'fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto hidden';
        wrap.innerHTML = `
            <div class="relative w-full max-w-xl bg-white dark:bg-[#16140c] border border-slate-200 dark:border-primary/25 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-900 dark:text-slate-100">
                <!-- Modal Header -->
                <div class="px-5 py-4 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between bg-background-light/60 dark:bg-card-dark/60 backdrop-blur-xs shrink-0">
                    <div class="flex items-center gap-2.5">
                        <img src="logo.png" alt="Dezan Digitizing" class="w-8 h-8 rounded-full object-cover">
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 id="guest-modal-title" class="font-black text-base text-slate-900 dark:text-white">Instant Guest Checkout</h3>
                                <span id="guest-modal-badge" class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/20">No Signup Needed</span>
                            </div>
                            <p id="guest-modal-sub" class="text-xs text-slate-500 dark:text-slate-400">Receive your production-ready files within 12-24 hours</p>
                        </div>
                    </div>
                    <button type="button" onclick="window.closeGuestCheckoutModal()" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-primary/10 text-slate-400 hover:text-slate-600 dark:hover:text-primary transition-colors cursor-pointer" aria-label="Close modal">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <!-- Scrollable Form Body -->
                <form id="guest-checkout-form" onsubmit="window.handleGuestCheckoutSubmit(event)" class="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
                    <!-- Order vs Quote Mode Switcher -->
                    <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-primary/20">
                        <button type="button" id="guest-mode-order-btn" onclick="window.setGuestMode(false)" class="py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer">
                            <span class="material-symbols-outlined text-sm">bolt</span>
                            <span>Place Flat-Rate Order</span>
                        </button>
                        <button type="button" id="guest-mode-quote-btn" onclick="window.setGuestMode(true)" class="py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer">
                            <span class="material-symbols-outlined text-sm">request_quote</span>
                            <span>Request Free Quote ($0)</span>
                        </button>
                    </div>

                    <!-- Existing Account Notice -->
                    <div class="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <span class="text-xs text-slate-700 dark:text-slate-300">Have an account with us?</span>
                        <a href="portal-login.html" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <span>Sign In to Save History</span>
                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </a>
                    </div>

                    <!-- 1. Service & Plan Selection -->
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">1. Select Service &amp; Specifications</label>
                        <div class="grid grid-cols-2 gap-2 mb-2.5">
                            <button type="button" id="guest-svc-digitizing" onclick="window.setGuestService('Digitizing')" class="py-2 px-3 rounded-xl border-2 border-primary bg-primary/10 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                                <span class="material-symbols-outlined text-base text-primary">texture</span>
                                <span>Embroidery Digitizing</span>
                            </button>
                            <button type="button" id="guest-svc-vector" onclick="window.setGuestService('Vector Art')" class="py-2 px-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                                <span class="material-symbols-outlined text-base">brush</span>
                                <span>Vector Art Redraw</span>
                            </button>
                        </div>

                        <!-- Digitizing & Vector Plans Container (Order Mode) -->
                        <div id="guest-plans-section">
                            <!-- Digitizing Plans -->
                            <div id="guest-digitizing-plans" class="grid grid-cols-3 gap-2">
                                <label class="relative flex flex-col p-2.5 rounded-xl border-2 border-primary bg-primary/10 cursor-pointer transition-all guest-plan-option text-center" data-plan="Left Chest / Hat" data-price="15.00">
                                    <input type="radio" name="guest_plan" value="Left Chest / Hat" checked class="sr-only" onchange="window.updateGuestPrice('Left Chest / Hat', 15)">
                                    <span class="text-[11px] font-bold uppercase text-slate-900 dark:text-white">Left Chest / Hat</span>
                                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Up to 5.5"</span>
                                    <span class="text-sm font-black text-primary mt-1">$15</span>
                                </label>
                                <label class="relative flex flex-col p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark cursor-pointer transition-all guest-plan-option text-center" data-plan="Jacket Back" data-price="25.00">
                                    <input type="radio" name="guest_plan" value="Jacket Back" class="sr-only" onchange="window.updateGuestPrice('Jacket Back', 25)">
                                <span class="text-[11px] font-bold uppercase text-slate-900 dark:text-white">Jacket Back</span>
                                <span class="text-[10px] text-slate-500 dark:text-slate-400">Over 5.5"</span>
                                <span class="text-sm font-black text-primary mt-1">$25</span>
                            </label>
                            <label class="relative flex flex-col p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark cursor-pointer transition-all guest-plan-option text-center" data-plan="Realistic / Pet Portrait" data-price="25.00">
                                <input type="radio" name="guest_plan" value="Realistic / Pet Portrait" class="sr-only" onchange="window.updateGuestPrice('Realistic / Pet Portrait', 25)">
                                <span class="text-[11px] font-bold uppercase text-slate-900 dark:text-white">Pet Portrait</span>
                                <span class="text-[10px] text-slate-500 dark:text-slate-400">Complex</span>
                                <span class="text-sm font-black text-primary mt-1">$25</span>
                            </label>
                        </div>

                            <!-- Vector Plans -->
                            <div id="guest-vector-plans" class="grid grid-cols-2 gap-2 hidden">
                                <label class="relative flex flex-col p-2.5 rounded-xl border-2 border-primary bg-primary/10 cursor-pointer transition-all guest-vector-option text-center" data-plan="Simple Vector Redraw" data-price="15.00">
                                    <input type="radio" name="guest_vector_plan" value="Simple Vector Redraw" checked class="sr-only" onchange="window.updateGuestPrice('Simple Vector Redraw', 15)">
                                    <span class="text-[11px] font-bold uppercase text-slate-900 dark:text-white">Simple Redraw</span>
                                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Basic / 1-2 Colors</span>
                                    <span class="text-sm font-black text-primary mt-1">$15</span>
                                </label>
                                <label class="relative flex flex-col p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark cursor-pointer transition-all guest-vector-option text-center" data-plan="Complex Vector Redraw" data-price="25.00">
                                    <input type="radio" name="guest_vector_plan" value="Complex Vector Redraw" class="sr-only" onchange="window.updateGuestPrice('Complex Vector Redraw', 25)">
                                    <span class="text-[11px] font-bold uppercase text-slate-900 dark:text-white">Complex Redraw</span>
                                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Detailed / Mascot</span>
                                    <span class="text-sm font-black text-primary mt-1">$25</span>
                                </label>
                            </div>
                        </div>

                        <!-- Quote Notice (Quote Mode) -->
                        <div id="guest-quote-notice" class="hidden p-3 rounded-xl bg-primary/10 border border-primary/25 text-slate-700 dark:text-slate-300 text-xs">
                            <div class="flex items-center gap-2 font-bold text-primary mb-1">
                                <span class="material-symbols-outlined text-base">verified</span>
                                <span>100% Free Stitch Appraisal &amp; Estimation</span>
                            </div>
                            <p class="text-[11px] text-slate-600 dark:text-slate-400">
                                Upload your artwork and specify dimensions/garment fabric below. Our master digitizers will analyze thread pathways, estimate exact stitch count, and quote a fair flat price within 1 hour.
                            </p>
                        </div>
                    </div>

                    <!-- Project Name & Dimensions -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Project / Design Name *</label>
                            <input type="text" id="guest-project-name" required placeholder="e.g. Apex Gym Hat Logo" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Target Size / Dimensions</label>
                            <input type="text" id="guest-dimensions" placeholder="e.g. 3.5 inches wide, or 2.25 inch cap" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                        </div>
                    </div>

                    <!-- Deliverable Format & Fabric -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Deliverable Format</label>
                            <select id="guest-file-format" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                                <option value="DST, EMB">DST, EMB (Standard Embroidery)</option>
                                <option value="DST, PES">DST, PES (Brother / Babylock)</option>
                                <option value="DST, JEF">DST, JEF (Janome)</option>
                                <option value="DST, EXP">DST, EXP (Melco / Bernina)</option>
                                <option value="DST, VP3">DST, VP3 (Husqvarna / Pfaff)</option>
                                <option value="AI, EPS, PDF, SVG">AI, EPS, PDF, SVG (Vector Only)</option>
                                <option value="All Formats">All Standard Formats</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fabric / Material</label>
                            <input type="text" id="guest-fabric" placeholder="e.g. Structured Cap, Pique Cotton, Denim" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                        </div>
                    </div>

                    <!-- 2. Drag & Drop Artwork Upload -->
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">2. Upload Artwork / Logo *</label>
                        <div id="guest-dropzone" class="border-2 border-dashed border-slate-300 dark:border-primary/30 hover:border-primary rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-card-dark/40 relative">
                            <input type="file" id="guest-file-input" accept="image/*,.pdf,.ai,.eps,.dst,.emb" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="window.handleGuestFileSelect(this)">
                            
                            <div id="guest-upload-prompt" class="flex flex-col items-center justify-center gap-1.5">
                                <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                    <span class="material-symbols-outlined text-xl">cloud_upload</span>
                                </div>
                                <div class="font-bold text-xs text-slate-800 dark:text-slate-200">
                                    <span class="text-primary underline">Click to upload</span> or drag and drop artwork
                                </div>
                                <p class="text-[11px] text-slate-400">PNG, JPG, PDF, AI, EPS, PSD (Max 25MB)</p>
                            </div>

                            <div id="guest-upload-preview" class="hidden flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-primary/20 text-left">
                                <div class="flex items-center gap-3 overflow-hidden">
                                    <img id="guest-preview-thumb" src="" alt="Thumbnail" class="w-12 h-12 rounded object-cover border border-slate-200 dark:border-primary/20 shrink-0">
                                    <div class="min-w-0">
                                        <p id="guest-preview-name" class="font-bold text-xs truncate text-slate-900 dark:text-white">logo.png</p>
                                        <p id="guest-preview-size" class="text-[10px] text-slate-500">1.2 MB</p>
                                    </div>
                                </div>
                                <button type="button" onclick="window.clearGuestFile(event)" class="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Remove file">
                                    <span class="material-symbols-outlined text-base">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Delivery Contact -->
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">3. Your Delivery Email &amp; Name</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Your Full Name *</label>
                                <input type="text" id="guest-name" required placeholder="e.g. Sarah Jenkins" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Delivery Email Address *</label>
                                <input type="email" id="guest-email" required placeholder="name@company.com" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm">
                                <span class="text-[10px] text-slate-500 block mt-0.5">Files &amp; proof are sent here directly</span>
                            </div>
                        </div>
                        <div class="mt-2.5">
                            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Special Instructions (Optional)</label>
                            <textarea id="guest-instructions" rows="2" placeholder="e.g. 3D puff on initials, underlay for pique polo, cap center-out sequencing..." class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary text-xs"></textarea>
                        </div>
                    </div>

                    <!-- 4. Payment Section (Order Mode) -->
                    <div id="guest-payment-section" class="pt-2 border-t border-slate-200 dark:border-primary/20">
                        <div class="flex items-center justify-between mb-3 bg-primary/10 dark:bg-primary/15 p-3 rounded-xl border border-primary/25">
                            <div>
                                <span class="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Total Due (Flat-Rate)</span>
                                <span id="guest-summary-plan" class="text-xs font-bold text-slate-900 dark:text-white">Digitizing · Left Chest / Hat</span>
                            </div>
                            <div class="text-right">
                                <span id="guest-summary-price" class="text-2xl font-black text-primary">$15.00</span>
                                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Zero Hidden Fees</span>
                            </div>
                        </div>

                        <!-- Payment Method Tabs -->
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">4. Payment Method</label>
                        <div class="grid grid-cols-2 gap-2 mb-3">
                            <button type="button" id="guest-tab-card" onclick="window.setGuestPaymentMethod('Credit Card')" class="p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer">
                                <span class="material-symbols-outlined text-sm text-primary">credit_card</span>
                                <span>Credit / Debit Card</span>
                            </button>
                            <button type="button" id="guest-tab-paypal" onclick="window.setGuestPaymentMethod('PayPal')" class="p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer">
                                <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
                                <span>PayPal</span>
                            </button>
                        </div>

                        <!-- Card Form Panel -->
                        <div id="guest-panel-card" class="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-primary/15">
                            <div>
                                <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Card Number</label>
                                <input type="text" placeholder="4532 •••• •••• 8821" value="•••• •••• •••• 8821" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-primary/20 text-xs font-mono text-slate-900 dark:text-white">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Expires</label>
                                    <input type="text" placeholder="MM/YY" value="08/28" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-primary/20 text-xs font-mono text-slate-900 dark:text-white">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">CVC</label>
                                    <input type="text" placeholder="CVC" value="982" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-primary/20 text-xs font-mono text-slate-900 dark:text-white">
                                </div>
                            </div>
                            
                            <button type="submit" id="guest-card-submit-btn" class="w-full py-3 rounded-xl bg-primary hover:brightness-110 text-background-dark font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2">
                                <span class="material-symbols-outlined text-base">lock</span>
                                <span id="guest-card-submit-text">Pay $15.00 Now &amp; Place Order</span>
                            </button>
                        </div>

                        <!-- PayPal Panel -->
                        <div id="guest-panel-paypal" class="hidden text-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-primary/15 space-y-3">
                            <p class="text-xs text-slate-600 dark:text-slate-400">Fast, secure checkout via PayPal balance or linked card.</p>
                            <button type="submit" id="guest-paypal-submit-btn" class="w-full py-3 rounded-xl bg-[#ffc439] hover:bg-[#f6b92a] text-[#003087] font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
                                <span class="material-symbols-outlined text-base">payments</span>
                                <span id="guest-paypal-submit-text">Complete with PayPal ($15.00)</span>
                            </button>
                        </div>

                        <div class="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span class="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">verified_user</span>
                            <span>256-Bit SSL Encrypted · 100% Quality Guaranteed · Free Revisions</span>
                        </div>
                    </div>

                    <!-- 4. Quote Submit Section (Quote Mode) -->
                    <div id="guest-quote-submit-section" class="hidden pt-2 border-t border-slate-200 dark:border-primary/20 space-y-3">
                        <div class="flex items-center justify-between p-3 rounded-xl bg-primary/10 dark:bg-primary/15 border border-primary/25">
                            <div>
                                <span class="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Upfront Payment</span>
                                <span class="text-xs font-bold text-slate-900 dark:text-white">Zero Charge Today</span>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                                <span class="text-[10px] text-slate-500 dark:text-slate-400 block">Pay only after price approval</span>
                            </div>
                        </div>

                        <button type="submit" id="guest-quote-submit-btn" class="w-full py-3 rounded-xl bg-primary hover:brightness-110 text-background-dark font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
                            <span class="material-symbols-outlined text-base">send</span>
                            <span id="guest-quote-submit-text">Submit Free Custom Quote Request</span>
                        </button>

                        <div class="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span class="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">verified_user</span>
                            <span>No credit card needed · 100% Free Appraisal · Fast 1-hour response</span>
                        </div>
                    </div>
                </form>
            </div>
        `;

        wrap.addEventListener('click', (e) => {
            if (e.target === wrap) window.closeGuestCheckoutModal();
        });

        return wrap;
    }

    window.setGuestMode = function(isQuote) {
        guestOrderState.isQuote = isQuote;
        const orderModeBtn = document.getElementById('guest-mode-order-btn');
        const quoteModeBtn = document.getElementById('guest-mode-quote-btn');
        const modalTitle = document.getElementById('guest-modal-title');
        const modalBadge = document.getElementById('guest-modal-badge');
        const modalSub = document.getElementById('guest-modal-sub');
        const plansSection = document.getElementById('guest-plans-section');
        const quoteNotice = document.getElementById('guest-quote-notice');
        const paymentSection = document.getElementById('guest-payment-section');
        const quoteSubmitSection = document.getElementById('guest-quote-submit-section');

        if (isQuote) {
            if (orderModeBtn) orderModeBtn.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer';
            if (quoteModeBtn) quoteModeBtn.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer';
            if (modalTitle) modalTitle.textContent = 'Request a Free Custom Quote';
            if (modalBadge) {
                modalBadge.textContent = '100% Free · No Signup Needed';
                modalBadge.className = 'px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold tracking-wide uppercase border border-amber-500/20';
            }
            if (modalSub) modalSub.textContent = 'Upload artwork for stitch estimation & flat price appraisal within 1 hour';
            if (plansSection) plansSection.classList.add('hidden');
            if (quoteNotice) quoteNotice.classList.remove('hidden');
            if (paymentSection) paymentSection.classList.add('hidden');
            if (quoteSubmitSection) quoteSubmitSection.classList.remove('hidden');
        } else {
            if (orderModeBtn) orderModeBtn.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer';
            if (quoteModeBtn) quoteModeBtn.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer';
            if (modalTitle) modalTitle.textContent = 'Instant Guest Checkout';
            if (modalBadge) {
                modalBadge.textContent = 'No Signup Needed';
                modalBadge.className = 'px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/20';
            }
            if (modalSub) modalSub.textContent = 'Receive your production-ready files within 12-24 hours';
            if (plansSection) plansSection.classList.remove('hidden');
            if (quoteNotice) quoteNotice.classList.add('hidden');
            if (paymentSection) paymentSection.classList.remove('hidden');
            if (quoteSubmitSection) quoteSubmitSection.classList.add('hidden');
        }
    };

    window.openGuestCheckoutModal = function(options = {}) {
        if (typeof window.openOrderQuoteModal === 'function') {
            return window.openOrderQuoteModal(options);
        }
        let modal = document.getElementById('guest-checkout-modal');
        if (!modal) {
            modal = createGuestCheckoutModalElement();
            document.body.appendChild(modal);
        }

        window.setGuestMode(!!options.isQuote);

        const reqService = (options.service || 'Digitizing').toLowerCase().includes('vector') ? 'Vector Art' : 'Digitizing';
        window.setGuestService(reqService);

        let reqPlan = options.plan;
        if (reqPlan) {
            const lower = reqPlan.toLowerCase();
            if (reqService === 'Vector Art') {
                if (lower.includes('complex')) {
                    reqPlan = 'Complex Vector Redraw';
                } else {
                    reqPlan = 'Simple Vector Redraw';
                }
            } else {
                if (lower.includes('pet') || lower.includes('portrait') || lower.includes('realistic')) {
                    reqPlan = 'Realistic / Pet Portrait';
                } else if (lower.includes('large') || lower.includes('jacket') || lower.includes('back')) {
                    reqPlan = 'Jacket Back';
                } else {
                    reqPlan = 'Left Chest / Hat';
                }
            }
        } else {
            reqPlan = reqService === 'Vector Art' ? 'Simple Vector Redraw' : 'Left Chest / Hat';
        }

        if (reqPlan) {
            const digitizingInput = modal.querySelector(`input[name="guest_plan"][value="${reqPlan}"]`);
            const vectorInput = modal.querySelector(`input[name="guest_vector_plan"][value="${reqPlan}"]`);
            if (digitizingInput) {
                digitizingInput.checked = true;
                const price = parseFloat(digitizingInput.closest('label').getAttribute('data-price')) || 15;
                window.updateGuestPrice(reqPlan, price);
            } else if (vectorInput) {
                vectorInput.checked = true;
                const price = parseFloat(vectorInput.closest('label').getAttribute('data-price')) || 15;
                window.updateGuestPrice(reqPlan, price);
            }
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const firstInput = document.getElementById('guest-project-name');
            if (firstInput) firstInput.focus();
        }, 100);
    };

    window.closeGuestCheckoutModal = function() {
        if (typeof window.closeOrderQuoteModal === 'function') {
            window.closeOrderQuoteModal();
            return;
        }
        const modal = document.getElementById('guest-checkout-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        const orderModal = document.getElementById('new-order-modal');
        if (orderModal) {
            orderModal.classList.add('hidden');
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeGuestCheckoutModal();
        }
    });

    window.setGuestService = function(serviceType) {
        guestOrderState.service = serviceType;
        const digitizingBtn = document.getElementById('guest-svc-digitizing');
        const vectorBtn = document.getElementById('guest-svc-vector');
        const digitizingPlans = document.getElementById('guest-digitizing-plans');
        const vectorPlans = document.getElementById('guest-vector-plans');
        const formatSelect = document.getElementById('guest-file-format');

        if (serviceType === 'Vector Art') {
            if (digitizingBtn) digitizingBtn.className = 'py-2 px-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
            if (vectorBtn) vectorBtn.className = 'py-2 px-3 rounded-xl border-2 border-primary bg-primary/10 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
            if (digitizingPlans) digitizingPlans.classList.add('hidden');
            if (vectorPlans) vectorPlans.classList.remove('hidden');
            if (formatSelect) formatSelect.value = 'AI, EPS, PDF, SVG';
            
            const activeVector = document.querySelector('input[name="guest_vector_plan"]:checked');
            const plan = activeVector ? activeVector.value : 'Simple Vector Redraw';
            const price = activeVector ? parseFloat(activeVector.closest('label').getAttribute('data-price')) : 15;
            window.updateGuestPrice(plan, price);
        } else {
            if (digitizingBtn) digitizingBtn.className = 'py-2 px-3 rounded-xl border-2 border-primary bg-primary/10 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
            if (vectorBtn) vectorBtn.className = 'py-2 px-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
            if (digitizingPlans) digitizingPlans.classList.remove('hidden');
            if (vectorPlans) vectorPlans.classList.add('hidden');
            if (formatSelect) formatSelect.value = 'DST, EMB';

            const activeDigitizing = document.querySelector('input[name="guest_plan"]:checked');
            const plan = activeDigitizing ? activeDigitizing.value : 'Left Chest / Hat';
            const price = activeDigitizing ? parseFloat(activeDigitizing.closest('label').getAttribute('data-price')) : 15;
            window.updateGuestPrice(plan, price);
        }
    };

    window.updateGuestPrice = function(planName, price) {
        guestOrderState.plan = planName;
        guestOrderState.price = price;

        document.querySelectorAll('.guest-plan-option, .guest-vector-option').forEach(card => {
            const input = card.querySelector('input');
            if (input && input.checked) {
                card.classList.remove('border-slate-200', 'bg-slate-50', 'dark:bg-card-dark');
                card.classList.add('border-2', 'border-primary', 'bg-primary/10');
            } else {
                card.classList.remove('border-2', 'border-primary', 'bg-primary/10');
                card.classList.add('border', 'border-slate-200', 'bg-slate-50', 'dark:bg-card-dark');
            }
        });

        const summaryPlan = document.getElementById('guest-summary-plan');
        const summaryPrice = document.getElementById('guest-summary-price');
        const cardSubmitText = document.getElementById('guest-card-submit-text');
        const paypalSubmitText = document.getElementById('guest-paypal-submit-text');

        const formatted = `$${price.toFixed(2)}`;
        if (summaryPlan) summaryPlan.textContent = `${guestOrderState.service} · ${planName}`;
        if (summaryPrice) summaryPrice.textContent = formatted;
        if (cardSubmitText) cardSubmitText.textContent = `Pay ${formatted} Now & Place Order`;
        if (paypalSubmitText) paypalSubmitText.textContent = `Complete with PayPal (${formatted})`;
    };

    window.setGuestPaymentMethod = function(method) {
        guestOrderState.paymentMethod = method;
        const tabCard = document.getElementById('guest-tab-card');
        const tabPaypal = document.getElementById('guest-tab-paypal');
        const panelCard = document.getElementById('guest-panel-card');
        const panelPaypal = document.getElementById('guest-panel-paypal');

        if (method === 'PayPal') {
            if (tabPaypal) tabPaypal.className = 'p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer';
            if (tabCard) tabCard.className = 'p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer';
            if (panelPaypal) panelPaypal.classList.remove('hidden');
            if (panelCard) panelCard.classList.add('hidden');
        } else {
            if (tabCard) tabCard.className = 'p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer';
            if (tabPaypal) tabPaypal.className = 'p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-card-dark text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer';
            if (panelCard) panelCard.classList.remove('hidden');
            if (panelPaypal) panelPaypal.classList.add('hidden');
        }
    };

    window.handleGuestFileSelect = function(input) {
        if (!input || !input.files || input.files.length === 0) return;
        const file = input.files[0];
        guestOrderState.file = file;

        const prompt = document.getElementById('guest-upload-prompt');
        const preview = document.getElementById('guest-upload-preview');
        const thumb = document.getElementById('guest-preview-thumb');
        const nameEl = document.getElementById('guest-preview-name');
        const sizeEl = document.getElementById('guest-preview-size');

        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = (file.size / 1024 < 1024) ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                guestOrderState.fileDataUrl = e.target.result;
                if (thumb) thumb.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            guestOrderState.fileDataUrl = null;
            if (thumb) thumb.src = 'logo.png';
        }

        if (prompt) prompt.classList.add('hidden');
        if (preview) preview.classList.remove('hidden');
    };

    window.clearGuestFile = function(e) {
        if (e) e.stopPropagation();
        guestOrderState.file = null;
        guestOrderState.fileDataUrl = null;
        const input = document.getElementById('guest-file-input');
        if (input) input.value = '';

        const prompt = document.getElementById('guest-upload-prompt');
        const preview = document.getElementById('guest-upload-preview');
        if (prompt) prompt.classList.remove('hidden');
        if (preview) preview.classList.add('hidden');
    };

    window.handleGuestCheckoutSubmit = async function(e) {
        if (e) e.preventDefault();

        const name = (document.getElementById('guest-name')?.value || '').trim();
        const email = (document.getElementById('guest-email')?.value || '').trim();
        const projectName = (document.getElementById('guest-project-name')?.value || '').trim();
        const dimensions = (document.getElementById('guest-dimensions')?.value || '').trim();
        const format = (document.getElementById('guest-file-format')?.value || 'DST, EMB').trim();
        const fabric = (document.getElementById('guest-fabric')?.value || '').trim();
        const instructions = (document.getElementById('guest-instructions')?.value || '').trim();

        if (!name) {
            alert('Please enter your full name.');
            document.getElementById('guest-name')?.focus();
            return;
        }
        if (!email || !email.includes('@')) {
            alert('Please provide a valid delivery email address.');
            document.getElementById('guest-email')?.focus();
            return;
        }
        if (!projectName) {
            alert('Please provide a project or logo name.');
            document.getElementById('guest-project-name')?.focus();
            return;
        }

        const isQuote = guestOrderState.isQuote === true;
        const cardBtn = document.getElementById('guest-card-submit-btn');
        const paypalBtn = document.getElementById('guest-paypal-submit-btn');
        const quoteBtn = document.getElementById('guest-quote-submit-btn');

        if (isQuote) {
            if (quoteBtn) {
                quoteBtn.disabled = true;
                quoteBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Submitting Quote Request...';
            }
        } else {
            if (cardBtn) {
                cardBtn.disabled = true;
                cardBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Processing Secure Payment...';
            }
            if (paypalBtn) {
                paypalBtn.disabled = true;
                paypalBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Processing PayPal...';
            }
        }

        let rawArtworkFiles = [];
        if (guestOrderState.file) {
            try {
                if (window.insforgeClient && typeof window.insforgeClient.uploadFile === 'function') {
                    const uploadResult = await window.insforgeClient.uploadFile('artworks', guestOrderState.file);
                    rawArtworkFiles.push({
                        name: uploadResult.name || guestOrderState.file.name,
                        url: uploadResult.url,
                        size: uploadResult.size || guestOrderState.file.size,
                        key: uploadResult.key
                    });
                }
            } catch (upErr) {
                console.warn('Storage upload notice (falling back to direct file reference):', upErr.message);
                rawArtworkFiles.push({
                    name: guestOrderState.file.name,
                    url: guestOrderState.fileDataUrl || 'logo.png',
                    size: guestOrderState.file.size
                });
            }
        }

        const combinedInstructions = [
            dimensions ? `Dimensions: ${dimensions}` : '',
            fabric ? `Fabric: ${fabric}` : '',
            instructions ? `Instructions: ${instructions}` : ''
        ].filter(Boolean).join('\n');

        const orderPayload = {
            isQuote: isQuote,
            is_quote: isQuote,
            status: isQuote ? 'quote_requested' : 'pending_review',
            serviceType: guestOrderState.service,
            planName: isQuote ? (guestOrderState.service + ' Custom Quote') : guestOrderState.plan,
            projectName: projectName,
            placement: dimensions || 'Standard Placement',
            sizing: dimensions || 'Standard',
            fileFormat: format,
            fabricType: fabric,
            instructions: combinedInstructions,
            rawArtworkFiles: rawArtworkFiles,
            price: isQuote ? 0 : guestOrderState.price,
            paymentStatus: isQuote ? 'unpaid' : 'paid',
            paymentMethod: isQuote ? 'Quote Request' : guestOrderState.paymentMethod,
            transactionId: isQuote ? null : ('PAYPAL_' + Math.random().toString(36).substring(2, 10).toUpperCase()),
            clientName: name,
            clientEmail: email
        };

        try {
            let createdOrder = null;
            if (window.insforgeClient && typeof window.insforgeClient.createOrder === 'function') {
                createdOrder = await window.insforgeClient.createOrder(orderPayload);
            } else {
                const orderNum = (isQuote ? 'QUO-' : 'DZ-') + Math.floor(1000 + Math.random() * 9000);
                const isAutoAssign = !isQuote && (localStorage.getItem('dezan_auto_assign_worker') === 'true');
                const primaryWorker = {
                    id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    name: 'Digitizer'
                };
                const assignedAt = isAutoAssign ? new Date().toISOString() : null;
                createdOrder = {
                    id: (isQuote ? 'quo_' : 'guest_') + Date.now(),
                    order_number: orderNum,
                    ...orderPayload,
                    assigned_digitizer_id: isAutoAssign ? primaryWorker.id : null,
                    assigned_digitizer_name: isAutoAssign ? primaryWorker.name : null,
                    assigned_at: assignedAt,
                    status: isQuote ? 'quote_requested' : (isAutoAssign ? 'in_progress' : 'pending_review'),
                    is_quote: isQuote,
                    deliverables: [],
                    created_at: new Date().toISOString()
                };
                const existing = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                existing.unshift(createdOrder);
                localStorage.setItem('dezan_orders', JSON.stringify(existing));

                if (isAutoAssign) {
                    const taskNumber = 'TSK-' + orderNum.replace('ORD-', '').replace('DZ-', '');
                    const sanitizedTask = {
                        id: 'tsk_' + Date.now(),
                        task_number: taskNumber,
                        order_number: orderNum,
                        order_id: createdOrder.id,
                        assigned_digitizer_id: primaryWorker.id,
                        service_type: createdOrder.service_type || 'Digitizing',
                        placement: createdOrder.placement || 'Standard',
                        sizing: createdOrder.sizing || 'Standard',
                        file_format: createdOrder.file_format || 'DST, EMB',
                        instructions: createdOrder.instructions || '',
                        raw_artwork_files: createdOrder.rawArtworkFiles || [],
                        status: 'in_progress',
                        deliverables: [],
                        assigned_at: assignedAt
                    };
                    const tasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
                    tasks.unshift(sanitizedTask);
                    localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(tasks));
                }
            }

            sessionStorage.setItem('dezan_last_guest_order', JSON.stringify(createdOrder));

            const targetUrl = `order-success.html?orderId=${encodeURIComponent(createdOrder.order_number)}&txn=${encodeURIComponent(createdOrder.id ? createdOrder.id.slice(0, 8) : (isQuote ? 'QUO-' : 'TXN-') + Math.floor(100000 + Math.random() * 900000))}&plan=${encodeURIComponent(createdOrder.plan_name)}&project=${encodeURIComponent(createdOrder.project_name)}&service=${encodeURIComponent(createdOrder.service_type)}&amount=${encodeURIComponent(createdOrder.price)}&email=${encodeURIComponent(email)}&guest=true${isQuote ? '&quote=true' : ''}`;
            window.location.href = targetUrl;
        } catch (err) {
            console.error('Order/Quote creation error:', err);
            alert('There was an issue processing your request: ' + err.message);
            if (cardBtn) {
                cardBtn.disabled = false;
                cardBtn.innerHTML = `<span class="material-symbols-outlined text-base">lock</span> Pay $${guestOrderState.price.toFixed(2)} Now & Place Order`;
            }
            if (paypalBtn) {
                paypalBtn.disabled = false;
                paypalBtn.innerHTML = `<span class="material-symbols-outlined text-base">payments</span> Complete with PayPal ($${guestOrderState.price.toFixed(2)})`;
            }
            if (quoteBtn) {
                quoteBtn.disabled = false;
                quoteBtn.innerHTML = `<span class="material-symbols-outlined text-base">send</span> Submit Free Custom Quote Request`;
            }
        }
    };

    window.handleQuoteClick = function(e, service = null) {
        if (e && e.preventDefault) e.preventDefault();

        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (err) {
            session = null;
        }

        if (session && (session.role === 'admin' || session.role === 'digitizer')) {
            window.showStaffOrderBlockModal(session.role, session.email);
            return;
        } else {
            // Open the unified Quote modal directly on current page
            if (typeof window.openOrderQuoteModal === 'function') {
                window.openOrderQuoteModal({ service, isQuote: true });
            } else if (typeof window.openNewQuoteModal === 'function') {
                window.openNewQuoteModal({ service });
            } else if (typeof window.openGuestCheckoutModal === 'function') {
                window.openGuestCheckoutModal({ isQuote: true, service });
            }
        }
    };

    // Global click listener to intercept any "Order Now" / "Place Order" or Quote links
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button, [data-action="order-now"], [data-action="request-quote"]');
        if (!target) return;

        // Elements explicitly tagged with data-action="order-now"
        if (target.getAttribute('data-action') === 'order-now') {
            e.preventDefault();
            const service = target.getAttribute('data-service');
            const plan = target.getAttribute('data-plan');
            window.handleOrderClick(e, service, plan);
            return;
        }

        // Elements explicitly tagged with data-action="request-quote"
        if (target.getAttribute('data-action') === 'request-quote') {
            e.preventDefault();
            const service = target.getAttribute('data-service');
            window.handleQuoteClick(e, service);
            return;
        }

        // Links leading to pricing.html#order-section
        const href = target.getAttribute('href');
        if (href && (href === 'pricing.html#order-section' || href.endsWith('/pricing.html#order-section'))) {
            e.preventDefault();
            window.handleOrderClick(e);
            return;
        }

        // Links leading to contact.html#custom-quote-section or #custom-quote-section
        if (href && (href === 'contact.html#custom-quote-section' || href.endsWith('/contact.html#custom-quote-section') || href === '#custom-quote-section')) {
            e.preventDefault();
            window.handleQuoteClick(e);
            return;
        }
    });

    // ===== FAQ ACCORDION ENGINE =====
    window.toggleFaq = function(button) {
        if (!button) return;
        const card = button.closest('.faq-item');
        if (!card) return;
        const content = card.querySelector('.faq-content');
        const chevron = card.querySelector('.faq-chevron');
        const isCurrentlyOpen = button.getAttribute('aria-expanded') === 'true' || (content && content.classList.contains('open'));

        // Close all other items in the same FAQ container
        const container = card.closest('#faq-accordion') || document;
        container.querySelectorAll('.faq-item').forEach(item => {
            if (item !== card) {
                const btn = item.querySelector('button');
                const cnt = item.querySelector('.faq-content');
                const chv = item.querySelector('.faq-chevron');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                if (cnt) cnt.classList.remove('open');
                if (chv) chv.classList.remove('rotate-180', 'bg-primary/20', 'text-primary');
                item.classList.remove('border-primary/60', 'dark:border-primary/50', 'ring-1', 'ring-primary/20');
            }
        });

        // Toggle clicked item
        if (isCurrentlyOpen) {
            button.setAttribute('aria-expanded', 'false');
            if (content) content.classList.remove('open');
            if (chevron) chevron.classList.remove('rotate-180', 'bg-primary/20', 'text-primary');
            card.classList.remove('border-primary/60', 'dark:border-primary/50', 'ring-1', 'ring-primary/20');
        } else {
            button.setAttribute('aria-expanded', 'true');
            if (content) content.classList.add('open');
            if (chevron) chevron.classList.add('rotate-180', 'bg-primary/20', 'text-primary');
            card.classList.add('border-primary/60', 'dark:border-primary/50', 'ring-1', 'ring-primary/20');
        }
    };


    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length > 0) {
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: "150px 0px 150px 0px", threshold: 0.01 });
            revealElements.forEach(el => observer.observe(el));
            // Safety fallback so content never gets stuck invisible
            setTimeout(() => {
                revealElements.forEach(el => el.classList.add("revealed"));
            }, 1000);
        } else {
            revealElements.forEach(el => el.classList.add("revealed"));
        }
    }


    // ===== ACTIVE NAVIGATION STATE =====
    // Detect current page from the URL
    const currentPath = window.location.pathname;
    let currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";
    if (currentPage === "embroidery-digitizing.html" || currentPage === "vector-art-conversion.html") {
        currentPage = "services.html";
    }

    // Highlight active link in desktop header nav
    document.querySelectorAll("nav a[data-nav]").forEach(link => {
        const linkPage = link.getAttribute("data-nav");
        if (linkPage === currentPage) {
            link.classList.add("text-primary");
            link.classList.remove("hover:text-primary");
        }
    });

    // Highlight active link in bottom mobile nav
    document.querySelectorAll("a[data-page]").forEach(link => {
        const linkPage = link.getAttribute("data-page");
        if (linkPage === currentPage) {
            link.classList.remove("text-slate-400");
            link.classList.add("text-primary");
        }
    });


    // ===================================================================
    //  ORDER SYSTEM (pricing.html only)
    // ===================================================================
    if (currentPage === "pricing.html" || currentPage === "pricing") {
        initOrderSystem();
    }

    // ===================================================================
    //  ORDER SUCCESS PAGE (order-success.html only)
    // ===================================================================
    if (currentPage === "order-success.html" || currentPage === "order-success") {
        initSuccessPage();
    }
    
    // ===================================================================
    //  LIGHTBOX FOR FEEDBACK IMAGES
    // ===================================================================
    initLightbox();
    initFeedbackSlider();

    // ===================================================================
    if (document.getElementById('hero-compare-slider')) {
        initCompareSlider();
    }

    initStickyHeader();
    initFileUploads();
    initInteractiveElements();
});

// ===================================================================
// FILE UPLOAD SYSTEM
// ===================================================================
function initFileUploads() {
    // Reusable Multi-File Uploader Setup
    function setupMultiUploader(containerId, formId, inputPrefix = "attachment") {
        const container = document.getElementById(containerId);
        const form = document.getElementById(formId);
        if (!container || !form) return;

        const dropZone = container.querySelector(".upload-zone");
        const rawInput = container.querySelector(".raw-file-input");
        const fileListContainer = container.querySelector(".file-list");
        if (!dropZone || !rawInput || !fileListContainer) return;

        let filesArray = [];
        let isSubmitting = false;

        // Ensure form supports multipart/form-data for files
        form.setAttribute("enctype", "multipart/form-data");

        // Click on drop zone opens file picker
        dropZone.addEventListener("click", () => {
            rawInput.click();
        });

        // Prevent click events on input from bubbling up to dropZone
        rawInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Drag and drop listeners
        ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ["dragenter", "dragover"].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add("border-primary", "bg-primary/10", "scale-[1.01]");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove("border-primary", "bg-primary/10", "scale-[1.01]");
            }, false);
        });

        dropZone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files.length > 0) {
                handleFiles(Array.from(dt.files));
            }
        });

        rawInput.addEventListener("change", () => {
            if (rawInput.files.length > 0) {
                handleFiles(Array.from(rawInput.files));
                rawInput.value = ""; // Clear value so same file can be chosen again
            }
        });

        function handleFiles(newFiles) {
            newFiles.forEach(file => {
                // Size validation: max 10MB (10 * 1024 * 1024 bytes)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File "${file.name}" is too large. Max file size is 10MB.`);
                    return;
                }

                // Duplicate check
                const isDuplicate = filesArray.some(f => f.name === file.name && f.size === file.size);
                if (isDuplicate) return;

                // Max limit check: 5 files
                if (filesArray.length >= 5) {
                    alert("You can upload a maximum of 5 artwork files.");
                    return;
                }

                filesArray.push(file);
            });

            updateUI();
            updateFormInputs();
        }

        function removeFile(index) {
            filesArray.splice(index, 1);
            updateUI();
            updateFormInputs();
        }

        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                return 'image';
            }
            if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
                return 'folder_zip';
            }
            if (['pdf'].includes(ext)) {
                return 'picture_as_pdf';
            }
            if (['dst', 'pes', 'exp', 'ofm', 'jef', 'hus', 'vip', 'vp3', 'xxx'].includes(ext)) {
                return 'architecture';
            }
            return 'description';
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        function updateUI() {
            if (filesArray.length === 0) {
                fileListContainer.classList.add("hidden");
                fileListContainer.innerHTML = "";
                return;
            }

            fileListContainer.classList.remove("hidden");
            fileListContainer.innerHTML = "";

            filesArray.forEach((file, index) => {
                const icon = getFileIcon(file.name);
                const sizeStr = formatBytes(file.size);

                const fileItem = document.createElement("div");
                fileItem.className = "flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/80 border border-primary/10 rounded-xl text-left hover:border-primary/30 transition-all animate-fade-in";
                fileItem.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden pr-2">
                        <span class="material-symbols-outlined text-primary text-2xl flex-shrink-0">${icon}</span>
                        <div class="overflow-hidden">
                            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${file.name}</p>
                            <p class="text-xs text-slate-400 dark:text-slate-500">${sizeStr}</p>
                        </div>
                    </div>
                    <button type="button" class="remove-btn p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                `;

                fileItem.querySelector(".remove-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeFile(index);
                });

                fileListContainer.appendChild(fileItem);
            });
        }

        function updateFormInputs() {
            // Remove existing dynamic inputs in this form
            const existingInputs = form.querySelectorAll(`.dynamic-${containerId}-input`);
            existingInputs.forEach(input => input.remove());

            const action = form.getAttribute("action") || "";
            const isWeb3Forms = action.includes("web3forms.com");

            // Create and append a hidden input for each file
            filesArray.forEach((file, index) => {
                const dynamicInput = document.createElement("input");
                dynamicInput.type = "file";
                dynamicInput.name = isWeb3Forms ? `${inputPrefix}${index + 1}` : `${inputPrefix}[]`;
                dynamicInput.className = `dynamic-${containerId}-input hidden`;

                const dt = new DataTransfer();
                dt.items.add(file);
                dynamicInput.files = dt.files;

                form.appendChild(dynamicInput);
            });
        }

        // Intercept form submission to upload files via CORS first
        form.addEventListener("submit", async (e) => {
            const action = form.getAttribute("action") || "";
            const isWeb3Forms = action.includes("web3forms.com");
            if (!isWeb3Forms) {
                // If it's a native submit (PHP process_form.php), let it proceed natively with files
                return;
            }

            if (isSubmitting) return;
            if (filesArray.length === 0) return; // Native submit without attachments is allowed on free tier

            e.preventDefault();
            isSubmitting = true;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;

            const uploadUrls = [];

            try {
                for (let i = 0; i < filesArray.length; i++) {
                    const file = filesArray[i];
                    submitBtn.innerHTML = `
                        <span class="inline-block animate-spin mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4"></span>
                        Uploading File ${i + 1}/${filesArray.length}...
                    `;

                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("expire", "172800"); // 48 hours

                    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
                        method: "POST",
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`Upload failed with status ${response.status}`);
                    }

                    const json = await response.json();
                    if (json.status !== "success" || !json.data || !json.data.url) {
                        throw new Error("Invalid response from upload service");
                    }

                    // Convert to direct download link
                    const directUrl = json.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
                    uploadUrls.push(directUrl);
                }

                submitBtn.innerHTML = `
                    <span class="inline-block animate-spin mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4"></span>
                    Submitting Request...
                `;

                // Remove file fields from form to bypass Web3Forms file upload (Pro feature) check
                const fileInputs = form.querySelectorAll(`.dynamic-${containerId}-input`);
                fileInputs.forEach(input => input.remove());

                if (rawInput) {
                    rawInput.removeAttribute("name");
                }

                // Add links as hidden text inputs
                uploadUrls.forEach((url, index) => {
                    const urlInput = document.createElement("input");
                    urlInput.type = "hidden";
                    urlInput.name = `Artwork_File_${index + 1}_Link`;
                    urlInput.className = `dynamic-${containerId}-input`;
                    urlInput.value = url;
                    form.appendChild(urlInput);
                });

                const countInput = document.createElement("input");
                countInput.type = "hidden";
                countInput.name = "Total_Artwork_Files";
                countInput.className = `dynamic-${containerId}-input`;
                countInput.value = filesArray.length;
                form.appendChild(countInput);

                // Submit form natively
                form.submit();

            } catch (error) {
                console.error("Submission error:", error);
                alert(`Upload failed: ${error.message}. Please try again, or submit the form without files and email them to fdezan91@gmail.com.`);
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }

    // Initialize both uploaders
    setupMultiUploader("quote-upload-container", "quote-form", "attachment");
    setupMultiUploader("order-upload-container", "order-form", "attachment");
}

// ===== STICKY HEADER LOGIC =====
function initStickyHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });
}

// ===================================================================
//  BEFORE / AFTER COMPARISON SLIDER
// ===================================================================
function initCompareSlider() {
    const slider = document.getElementById('hero-compare-slider');
    const divider = document.getElementById('compare-divider');
    const beforeImg = document.getElementById('compare-before-img');
    const beforeDiv = document.getElementById('compare-before');
    if (!slider || !divider || (!beforeImg && !beforeDiv)) return;

    let isDragging = false;

    function updateSlider(clientX) {
        const rect = slider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;

        if (beforeImg) {
            const rightInset = 100 - pct;
            beforeImg.style.clipPath = `inset(0 ${rightInset}% 0 0)`;
            beforeImg.style.webkitClipPath = `inset(0 ${rightInset}% 0 0)`;
        } else if (beforeDiv) {
            beforeDiv.style.width = pct + '%';
        }
        divider.style.left = pct + '%';
    }

    // Mouse events
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e.clientX);
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    });
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events
    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateSlider(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

//  LIGHTBOX FUNCTIONALITY
// ===================================================================
function initLightbox() {
    const feedbackImages = document.querySelectorAll('.marquee-item, .carousel-track img, .portfolio-card img, #feedback-slide-track img, .columns-1 img');
    if (feedbackImages.length === 0) return;

    // Create lightbox HTML structure
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    
    const imgEl = document.createElement('img');
    imgEl.className = 'lightbox-image';
    imgEl.alt = 'Enlarged embroidery artwork stitchout preview';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    
    overlay.appendChild(imgEl);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Open lightbox (using pointerdown because CSS animation moves the element, breaking 'click')
    feedbackImages.forEach(img => {
        img.addEventListener('pointerdown', (e) => {
            // Ignore right-clicks
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            
            imgEl.src = img.src;
            overlay.style.display = 'flex';
            // Force reflow for transition
            overlay.offsetHeight;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close lightbox
    function closeLightbox() {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300); // Matches CSS transition duration
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
}


// ===================================================================
//  GLOBAL — Plan Selection (called from onclick in pricing.html)
// ===================================================================
function selectPlan(planName, price) {
    let session = null;
    try {
        const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (raw) session = JSON.parse(raw);
    } catch (err) {
        session = null;
    }

    const service = planName.toLowerCase().includes('vector') ? 'Vectorizing' : 'Digitizing';

    // If client is not logged in, trigger frictionless guest checkout modal directly (sign-in is not required)
    if (!session || !session.role) {
        if (typeof window.openGuestCheckoutModal === 'function') {
            window.openGuestCheckoutModal({ service, plan: planName, price });
        } else {
            const orderSection = document.getElementById("order-section");
            if (orderSection) orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
    }

    // If logged in as client, route directly to Client Portal with adaptive modal opened
    if (session.role === 'client') {
        window.location.href = `client-portal.html?action=new_order&service=${encodeURIComponent(service)}&plan=${encodeURIComponent(planName)}`;
        return;
    }

    // Admin / Worker fallback
    if (session.role === 'admin') {
        window.location.href = 'admin-portal.html';
        return;
    }
    if (session.role === 'digitizer') {
        window.location.href = 'worker-portal.html';
        return;
    }

    const planInput = document.getElementById("order-plan");
    const amountInput = document.getElementById("order-amount");
    const banner = document.getElementById("selected-plan-banner");
    const nameEl = document.getElementById("selected-plan-name");
    const priceEl = document.getElementById("selected-plan-price");
    const summary = document.getElementById("order-summary");
    const summaryPlan = document.getElementById("summary-plan");
    const summaryTotal = document.getElementById("summary-total");

    if (planInput) planInput.value = planName;
    if (amountInput) amountInput.value = price;

    if (banner) {
        banner.classList.remove("hidden");
        if (nameEl) nameEl.textContent = planName;
        if (priceEl) priceEl.textContent = "$" + price;
    }

    if (summary) {
        summary.classList.remove("hidden");
        if (summaryPlan) summaryPlan.textContent = planName + " ($" + price + ")";
        if (summaryTotal) summaryTotal.textContent = "$" + price;
    }

    const serviceType = document.getElementById("service-type");
    if (serviceType && document.getElementById("summary-service")) {
        document.getElementById("summary-service").textContent = serviceType.value;
    }

    const orderSection = document.getElementById("order-section");
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    hideFormError();
}


// ===================================================================
//  ORDER SYSTEM INIT
// ===================================================================
function initOrderSystem() {
    let session = null;
    try {
        const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (raw) session = JSON.parse(raw);
    } catch (err) {
        session = null;
    }

    const loginPromptBanner = document.getElementById('pricing-login-prompt');
    const clientLoggedBanner = document.getElementById('pricing-client-banner');
    const quotePromptBanner = document.getElementById('quote-login-prompt');
    const quoteClientBanner = document.getElementById('quote-client-banner');
    const orderForm = document.getElementById('order-form');

    if (session && session.role) {
        if (loginPromptBanner) loginPromptBanner.classList.add('hidden');
        if (clientLoggedBanner) {
            clientLoggedBanner.classList.remove('hidden');
            const nameEl = document.getElementById('pricing-client-name');
            if (nameEl) nameEl.textContent = session.displayName || session.email;
        }
        if (quotePromptBanner) quotePromptBanner.classList.add('hidden');
        if (quoteClientBanner) {
            quoteClientBanner.classList.remove('hidden');
            const quoteNameEl = document.getElementById('quote-client-name');
            if (quoteNameEl) quoteNameEl.textContent = session.displayName || session.email;
        }
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');
        if (nameInput && !nameInput.value) nameInput.value = session.displayName || '';
        if (emailInput && !emailInput.value) emailInput.value = session.email || '';
    } else {
        if (loginPromptBanner) loginPromptBanner.classList.remove('hidden');
        if (clientLoggedBanner) clientLoggedBanner.classList.add('hidden');
        if (quotePromptBanner) quotePromptBanner.classList.remove('hidden');
        if (quoteClientBanner) quoteClientBanner.classList.add('hidden');
    }

    // Intercept form submission if user is not logged in
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            let currentSession = null;
            try {
                const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                            (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
                if (raw) currentSession = JSON.parse(raw);
            } catch (err) {
                currentSession = null;
            }

            if (!currentSession || !currentSession.role) {
                // Sign-in is not required: route through frictionless guest checkout modal
                e.preventDefault();
                e.stopPropagation();
                const plan = document.getElementById('order-plan')?.value || 'Hat / Left Chest Logos';
                const service = document.getElementById('service-type')?.value || 'Digitizing';
                const price = parseFloat(document.getElementById('order-amount')?.value) || 15;
                if (typeof window.openGuestCheckoutModal === 'function') {
                    window.openGuestCheckoutModal({ service, plan, price });
                }
                return false;
            }
        });
    }

    // ----- EmailJS Init -----
    if (typeof emailjs !== "undefined") {
        emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");
    }

    // ----- Service type sync with summary -----
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        serviceType.addEventListener("change", () => {
            const summaryService = document.getElementById("summary-service");
            if (summaryService) summaryService.textContent = serviceType.value;
        });
    }
}


// ===================================================================
//  FORM VALIDATION
// ===================================================================
function validateOrderForm() {
    const plan = document.getElementById("order-plan").value;
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    const project = document.getElementById("project-name").value.trim();

    if (!plan) {
        showFormError("Please select a plan above before proceeding to payment.");
        return false;
    }
    if (!name) {
        showFormError("Please enter your name.");
        return false;
    }
    if (!email || !email.includes("@")) {
        showFormError("Please enter a valid email address.");
        return false;
    }
    if (!project) {
        showFormError("Please enter a project name.");
        return false;
    }

    const placement = document.getElementById("design-placement").value.trim();
    const sizing = document.getElementById("design-sizing").value.trim();
    const fileFormat = document.getElementById("file-format").value.trim();

    if (!placement) {
        showFormError("Please enter the style/location (e.g. Left Chest, Hat, Jacket Back).");
        return false;
    }
    if (!sizing) {
        showFormError("Please enter the sizing details.");
        return false;
    }
    if (!fileFormat) {
        showFormError("Please enter the required file format (e.g. DST, PES, EXP).");
        return false;
    }

    hideFormError();
    return true;
}

function showFormError(message) {
    const errorDiv = document.getElementById("form-error");
    const errorText = document.getElementById("form-error-text");
    if (errorDiv) {
        errorDiv.classList.remove("hidden");
        errorText.textContent = message;
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function hideFormError() {
    const errorDiv = document.getElementById("form-error");
    if (errorDiv) {
        errorDiv.classList.add("hidden");
    }
}


// ===================================================================
//  EMAIL NOTIFICATION (EmailJS)
// ===================================================================
function sendOrderEmail(orderData) {
    if (typeof emailjs === "undefined") {
        console.warn("EmailJS not loaded — skipping email notification.");
        return;
    }

    // *** REPLACE these with your actual EmailJS Service ID and Template ID ***
    const SERVICE_ID = "YOUR_SERVICE_ID";
    const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

    const templateParams = {
        to_email: "fdezan91@gmail.com",
        from_name: orderData.customerName,
        from_email: orderData.customerEmail,
        transaction_id: orderData.transactionId,
        plan: orderData.planName,
        amount: "$" + orderData.amount,
        project_name: orderData.projectName,
        service_type: orderData.serviceType,
        placement: orderData.placement,
        sizing: orderData.sizing,
        file_format: orderData.fileFormat,
        notes: orderData.notes,
        order_date: new Date().toLocaleString()
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(() => {
            console.log("Order notification email sent successfully.");
        })
        .catch((error) => {
            console.error("Email sending failed:", error);
        });
}


// ===================================================================
//  ORDER SUCCESS PAGE
// ===================================================================
function initSuccessPage() {
    const params = new URLSearchParams(window.location.search);

    let guestOrder = null;
    try {
        const stored = sessionStorage.getItem('dezan_last_guest_order');
        if (stored) guestOrder = JSON.parse(stored);
    } catch (_) {}

    const orderId = params.get("orderId") || (guestOrder ? guestOrder.order_number : "DZ-" + Math.floor(1000 + Math.random() * 9000));
    const txnId = params.get("txn") || (guestOrder ? (guestOrder.id ? guestOrder.id.slice(0, 8) : 'TXN-884192') : "TXN-" + Math.floor(100000 + Math.random() * 900000));
    const plan = params.get("plan") || (guestOrder ? guestOrder.plan_name : "Left Chest / Hat");
    const project = params.get("project") || (guestOrder ? guestOrder.project_name : "Custom Embroidery Design");
    const service = params.get("service") || (guestOrder ? guestOrder.service_type : "Digitizing");
    const amount = params.get("amount") || (guestOrder ? guestOrder.price : "15.00");
    const email = params.get("email") || (guestOrder ? guestOrder.client_email : "");

    const headerOrderEl = document.getElementById("success-header-order-id");
    const orderIdEl = document.getElementById("success-order-id");
    const txnEl = document.getElementById("success-txn-id");
    const planEl = document.getElementById("success-plan");
    const projectEl = document.getElementById("success-project");
    const serviceEl = document.getElementById("success-service");
    const amountEl = document.getElementById("success-amount");
    const emailEl = document.getElementById("success-email");

    if (headerOrderEl) headerOrderEl.textContent = orderId.startsWith('#') ? orderId : '#' + orderId;
    if (orderIdEl) orderIdEl.textContent = orderId;
    if (txnEl) txnEl.textContent = txnId;
    if (planEl) planEl.textContent = plan;
    if (projectEl) projectEl.textContent = project;
    if (serviceEl) serviceEl.textContent = service;
    if (amountEl) amountEl.textContent = "$" + parseFloat(amount).toFixed(2);
    if (emailEl) emailEl.textContent = email || "Delivered to your email";

    const isQuote = params.get("quote") === "true" || orderId.startsWith("QUO-");
    const prefixEl = document.getElementById("success-header-prefix");
    const subheadEl = document.getElementById("success-subhead");
    const summaryTitleEl = document.getElementById("success-summary-title");
    const statusBadgeEl = document.getElementById("success-status-badge");
    const idLabelEl = document.getElementById("success-id-label");
    const amountLabelEl = document.getElementById("success-amount-label");
    const claimCardTitleEl = document.getElementById("claim-card-title");
    const claimCardSubEl = document.getElementById("claim-card-sub");
    const fallbackNoteEl = document.getElementById("claim-fallback-note");

    if (isQuote) {
        if (prefixEl) prefixEl.textContent = "Quote requested!";
        if (subheadEl) subheadEl.textContent = "Your request has been submitted. Our master digitizers will review your artwork and estimate stitch counts within 1 hour.";
        if (summaryTitleEl) summaryTitleEl.textContent = "Quote Summary";
        if (idLabelEl) idLabelEl.textContent = "Quote Number";
        if (statusBadgeEl) {
            statusBadgeEl.className = "px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1 border border-amber-500/20";
            statusBadgeEl.innerHTML = '<span class="material-symbols-outlined text-sm">schedule</span> Quote Submitted · Free Review';
        }
        if (amountLabelEl) amountLabelEl.textContent = "Estimated Price";
        if (amountEl) amountEl.textContent = "Free · Pending Appraisal";
        if (claimCardTitleEl) claimCardTitleEl.textContent = "Create a password to access your quotes & orders anytime";
        if (claimCardSubEl) claimCardSubEl.textContent = "Track status, view digitizer price appraisal, and approve with 1 click.";
        if (fallbackNoteEl) fallbackNoteEl.textContent = "Or keep this Quote ID for reference — your custom stitch appraisal will arrive in your email within 1 hour.";
    } else {
        if (prefixEl) prefixEl.textContent = "Order confirmed!";
        if (subheadEl) subheadEl.textContent = "Your payment was successful and your order has been submitted.";
        if (summaryTitleEl) summaryTitleEl.textContent = "Order Summary";
        if (idLabelEl) idLabelEl.textContent = "Order Number";
        if (statusBadgeEl) {
            statusBadgeEl.className = "px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/20";
            statusBadgeEl.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Paid &amp; Confirmed';
        }
        if (amountLabelEl) amountLabelEl.textContent = "Amount Paid";
        if (amountEl) amountEl.textContent = "$" + parseFloat(amount).toFixed(2);
        if (claimCardTitleEl) claimCardTitleEl.textContent = "Create a password to access your orders anytime";
        if (claimCardSubEl) claimCardSubEl.textContent = "Track status, download files, and view your complete order history.";
        if (fallbackNoteEl) fallbackNoteEl.textContent = "Or keep this Order ID for reference — finished files will arrive in your email.";
    }

    // Handle Account Claiming Widget vs Logged-In User
    let session = null;
    try {
        const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (raw) session = JSON.parse(raw);
    } catch (_) {}

    const claimCard = document.getElementById("guest-claim-account-card");
    const loggedInCard = document.getElementById("logged-in-portal-shortcut");
    const claimEmailInput = document.getElementById("claim-email");

    if (session && session.role === 'client') {
        if (claimCard) claimCard.classList.add("hidden");
        if (loggedInCard) loggedInCard.classList.remove("hidden");
    } else {
        if (claimCard) claimCard.classList.remove("hidden");
        if (loggedInCard) loggedInCard.classList.add("hidden");
        if (claimEmailInput) claimEmailInput.value = email;
    }
}

window.submitGuestAccountClaim = async function() {
    const email = (document.getElementById("claim-email")?.value || '').trim();
    const pass = document.getElementById("claim-password")?.value || '';
    const confirm = document.getElementById("claim-password-confirm")?.value || '';
    const errEl = document.getElementById("claim-error-msg");
    const succEl = document.getElementById("claim-success-msg");
    const submitBtn = document.getElementById("claim-submit-btn");

    if (errEl) errEl.classList.add("hidden");
    if (succEl) succEl.classList.add("hidden");

    if (!email) {
        if (errEl) {
            errEl.textContent = "Please enter an email address.";
            errEl.classList.remove("hidden");
        }
        return;
    }
    if (pass.length < 6) {
        if (errEl) {
            errEl.textContent = "Password must be at least 6 characters long.";
            errEl.classList.remove("hidden");
        }
        return;
    }
    if (pass !== confirm) {
        if (errEl) {
            errEl.textContent = "Passwords do not match. Please re-enter.";
            errEl.classList.remove("hidden");
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Creating Your Account...';
    }

    try {
        const displayName = email.split('@')[0];
        if (window.insforgeClient && typeof window.insforgeClient.signUp === 'function') {
            const res = await window.insforgeClient.signUp({
                email: email,
                password: pass,
                displayName: displayName,
                role: 'client'
            });
            if (res.error) throw new Error(res.error);
        } else {
            const user = {
                id: 'usr_' + Date.now(),
                email: email,
                displayName: displayName,
                role: 'client',
                created_at: new Date().toISOString()
            };
            localStorage.setItem('dezan_session', JSON.stringify(user));
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
        }

        if (succEl) succEl.classList.remove("hidden");
        if (submitBtn) {
            submitBtn.className = 'w-full py-3 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2';
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span> Welcome to Dezan Digitizing!';
        }

        setTimeout(() => {
            window.location.href = 'client-portal.html?welcome=new_account';
        }, 1200);
    } catch (err) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">lock</span> Save Password & Open My Client Portal';
        }
        if (errEl) {
            errEl.textContent = err.message || "Could not create account. Please try again.";
            errEl.classList.remove("hidden");
        }
    }
};

// ===================================================================
//  FEEDBACK SLIDER (index.html — matches dezandigitizing.com design)
//  Horizontal slide with peeking prev/next images
// ===================================================================
function initFeedbackSlider() {
    const track = document.getElementById('feedback-slide-track');
    const strip = document.getElementById('feedback-thumb-strip');
    const wrapper = document.getElementById('feedback-slider-wrapper');
    if (!track || !strip) return;

        // All feedback image paths and rich SEO metadata
    const feedbackItems = [
        {
            src: 'Client FeedBack/boxer-dog-pet-portrait-embroidery-digitizing.webp',
            alt: 'Boxer Dog Pet Portrait Custom Embroidery Digitizing Stitch Preview and Thread Map',
            title: 'Boxer Dog Pet Portrait Digitizing'
        },
        {
            src: 'Client FeedBack/boxer-dog-embroidered-tote-bag-stitchout.webp',
            alt: 'Realistic Boxer Dog Pet Portrait Embroidered onto Canvas Tote Bag Stitchout',
            title: 'Boxer Dog Embroidered Tote Bag Stitchout'
        },
        {
            src: 'Client FeedBack/donas-tacos-mexican-dancer-jacket-back-embroidery-digitizing.webp',
            alt: 'Doña\'s Tacos Mexican Folkloric Dancer Custom Jacket Back Embroidery Digitizing Run Sheet',
            title: 'Doña\'s Tacos Jacket Back Digitizing'
        },
        {
            src: 'Client FeedBack/donas-tacos-mexican-folkloric-jacket-back-embroidery-stitchout.webp',
            alt: 'Doña\'s Tacos Mexican Folkloric Dancer Detailed Jacket Back Embroidery Stitchout on Black Fleece',
            title: 'Doña\'s Tacos Jacket Back Embroidery Stitchout'
        },
        {
            src: 'Client FeedBack/retro-astros-rainbow-3d-puff-cap-embroidery-digitizing.webp',
            alt: 'Retro Astros Rainbow Striped Letter A with Star 3D Puff Cap Embroidery Digitizing Stitch Layout',
            title: 'Retro Astros Rainbow 3D Puff Cap Digitizing'
        },
        {
            src: 'Client FeedBack/3d-puff-cap-embroidery-stitchout.webp',
            alt: 'High-Density 3D Puff Cap Embroidery Stitchout on Orange Brim Snapback Hat',
            title: '3D Puff Cap Embroidery Stitchout'
        },
        {
            src: 'Client FeedBack/houston-skyline-space-city-cap-embroidery-digitizing.webp',
            alt: 'Houston Space City Skyline and Orbiting Craft Cap Logo Embroidery Digitizing File',
            title: 'Houston Skyline Cap Digitizing'
        },
        {
            src: 'Client FeedBack/houston-cityscape-trucker-hat-embroidery-stitchout.webp',
            alt: 'Houston Skyline Space City Custom Embroidery Stitchout on Black Mesh Trucker Hat',
            title: 'Houston Cityscape Trucker Hat Stitchout'
        },
        {
            src: 'Client FeedBack/mill-creek-kennels-left-chest-embroidery-stitchout.webp',
            alt: 'Mill Creek Farm Kennels Hunting Dog Left Chest Logo Embroidery Stitchout on Heather Polo',
            title: 'Mill Creek Kennels Left Chest Stitchout'
        },
        {
            src: 'Client FeedBack/mill-creek-kennels-dog-left-chest-embroidery-digitizing.webp',
            alt: 'Mill Creek Farm Kennels Hunting Dog Pointer Left Chest Embroidery Digitizing Run Sheet',
            title: 'Mill Creek Kennels Left Chest Digitizing'
        },
        {
            src: 'Client FeedBack/reds-world-melting-heart-hat-embroidery-digitizing.webp',
            alt: 'Red\'s World Melting Dripping Heart Cartoon Cap Front Embroidery Digitizing Run Sheet',
            title: 'Red\'s World Melting Heart Hat Digitizing'
        },
        {
            src: 'Client FeedBack/reds-world-dripping-heart-cap-embroidery-stitchout.webp',
            alt: 'Red\'s World Dripping Melting Heart Embroidered Snapback and Trucker Hats Stitchout',
            title: 'Red\'s World Dripping Heart Cap Stitchout'
        },
        {
            src: 'Client FeedBack/good-jawns-motocross-circular-embroidered-patch.webp',
            alt: 'Good Jawns Motocross Dirt Bike Racer Circular Custom Embroidered Patch with Merrowed Edge',
            title: 'Good Jawns Motocross Embroidered Patch'
        },
        {
            src: 'Client FeedBack/black-terrier-dog-pet-portrait-embroidery-digitizing.webp',
            alt: 'Black Schnauzer Terrier Dog Pet Portrait Embroidery Digitizing Stitch Plan with Blue Collar',
            title: 'Black Terrier Pet Portrait Digitizing'
        },
        {
            src: 'Client FeedBack/beau-dog-pet-portrait-embroidered-sweatshirt-stitchout.webp',
            alt: 'Beau Custom Pet Dog Portrait and Paw Prints Embroidered Sweatshirt Stitchout',
            title: 'Beau Dog Portrait Embroidered Sweatshirt'
        },
        {
            src: 'Client FeedBack/french-bulldogs-pet-portrait-embroidery-digitizing.webp',
            alt: 'French Bulldog Puppies Multi-Pet Portrait Embroidery Digitizing Stitch Simulation',
            title: 'French Bulldogs Pet Portrait Digitizing'
        },
        {
            src: 'Client FeedBack/french-bulldog-custom-embroidered-crewneck-stitchout.webp',
            alt: 'French Bulldog Custom Embroidered Pet Portrait on Heather Grey Crewneck Sweatshirt',
            title: 'French Bulldog Embroidered Crewneck Stitchout'
        },
        {
            src: 'Client FeedBack/suave-cuts-barbershop-anchor-patch-digitizing.webp',
            alt: 'Suave Cuts Barbershop Nautical Anchor Circular Patch Embroidery Digitizing Run Sheet',
            title: 'Suave Cuts Barbershop Patch Digitizing'
        },
        {
            src: 'Client FeedBack/suave-cuts-barbershop-hoodie-embroidery-stitchout.webp',
            alt: 'Suave Cuts Barbershop Seaside Oregon Embroidered Crest on Snap Collar Fleece Hoodie',
            title: 'Suave Cuts Barbershop Fleece Stitchout'
        },
        {
            src: 'Client FeedBack/architectural-estate-lakehouse-jacket-back-embroidery-digitizing.webp',
            alt: 'Architectural Estate Waterfront Lakehouse Jacket Back Embroidery Digitizing Run Sheet',
            title: 'Architectural Estate Jacket Back Digitizing'
        },
        {
            src: 'Client FeedBack/architectural-estate-custom-embroidery-stitchout.webp',
            alt: 'Architectural Estate Custom Home Embroidery Stitchouts with Date on Linen Swatches',
            title: 'Architectural Estate Custom Embroidery Stitchout'
        },
        {
            src: 'Client FeedBack/houston-sports-hybrid-3d-puff-hat-embroidery-digitizing.webp',
            alt: 'Houston Sports Hybrid Bull and Star Logo 3D Puff Cap Embroidery Digitizing Run Sheet',
            title: 'Houston Sports Hybrid 3D Puff Hat Digitizing'
        },
        {
            src: 'Client FeedBack/houston-sports-hybrid-3d-puff-cap-embroidery-stitchout.webp',
            alt: 'Houston Sports Hybrid Logo High-Density 3D Puff Cap Embroidery Stitchout on Black Snapback',
            title: 'Houston Sports Hybrid 3D Puff Cap Stitchout'
        },
        {
            src: 'Client FeedBack/good-jawns-dirt-bike-rider-patch-digitizing.webp',
            alt: 'Good Jawns #6 Motocross Dirt Bike Racer Circular Patch Embroidery Digitizing File',
            title: 'Good Jawns Dirt Bike Rider Patch Digitizing'
        },
        {
            src: 'Client FeedBack/good-jawns-motocross-embroidered-patch-stitchout.webp',
            alt: 'Good Jawns #6 Motocross Dirt Bike Racer High-Density Custom Embroidered Patch Stitchout',
            title: 'Good Jawns Motocross Embroidered Patch Stitchout'
        },
        {
            src: 'Client FeedBack/junes-league-basketball-patch-embroidery-digitizing.webp',
            alt: 'Junes League Basketball Championship Shield Emblem Cap Embroidery Digitizing Run Sheet',
            title: 'Junes League Basketball Patch Digitizing'
        },
        {
            src: 'Client FeedBack/junes-league-basketball-embroidered-patch-stitchout.webp',
            alt: 'Junes League Basketball Tournament Custom Embroidered Shield Patch with Satin Border',
            title: 'Junes League Basketball Patch Stitchout'
        },
        {
            src: 'Client FeedBack/custom-couple-cartoon-sketch-jacket-back-embroidery-digitizing.webp',
            alt: 'Custom Romantic Couple Cartoon Sketch to Jacket Back Embroidery Digitizing Stitch Layout',
            title: 'Couple Cartoon Sketch Jacket Back Digitizing'
        },
        {
            src: 'Client FeedBack/custom-couple-line-art-embroidered-hoodie-stitchout.webp',
            alt: 'Custom Couple Line Art Caricature Embroidered on Matching Neon Pink Hoodies',
            title: 'Custom Couple Line Art Embroidered Hoodies'
        },
        {
            src: 'Client FeedBack/suave-cuts-anchor-emblem-embroidery-patch-digitizing.webp',
            alt: 'Suave Cuts Barbershop Anchor and Rope Emblem Circular Patch Embroidery Digitizing Run Sheet',
            title: 'Suave Cuts Anchor Emblem Patch Digitizing'
        },
        {
            src: 'Client FeedBack/suave-cuts-barbershop-embroidered-caps-stitchout.webp',
            alt: 'Suave Cuts Barbershop Nautical Logo Embroidered Dad Hats in Burgundy and Navy Twill',
            title: 'Suave Cuts Barbershop Embroidered Caps Stitchout'
        },
        {
            src: 'Client FeedBack/bull-silhouette-tree-branches-cap-embroidery-digitizing.webp',
            alt: 'Bull Silhouette with Forest Tree Branches Wildlife Cap Front Embroidery Digitizing File',
            title: 'Bull Tree Branches Cap Digitizing'
        },
        {
            src: 'Client FeedBack/bull-tree-branches-embroidered-hoodie-and-hat-stitchout.webp',
            alt: 'Bull Forest Tree Branches Wildlife Embroidery Stitchout on Red Hoodie and Two-Tone Hat',
            title: 'Bull Tree Branches Embroidered Hoodie and Hat'
        },
        {
            src: 'Client FeedBack/american-flag-mountain-hiker-cap-embroidery-digitizing.webp',
            alt: 'American Flag Outdoor Mountain Hiker and Pine Trees Cap Embroidery Digitizing Run Sheet',
            title: 'American Flag Mountain Hiker Cap Digitizing'
        },
        {
            src: 'Client FeedBack/american-flag-outdoor-hiker-embroidered-hat-stitchout.webp',
            alt: 'American Flag and Wilderness Hiker White Thread Embroidery Stitchout on Washed Denim Cap',
            title: 'American Flag Outdoor Hiker Embroidered Cap'
        },
        {
            src: 'Client FeedBack/barbacoa-bandits-bull-skull-hat-embroidery-digitizing.webp',
            alt: 'Barbacoa Bandits Steer Bull Skull and Paisley Bandana Hat Front Embroidery Digitizing Run Sheet',
            title: 'Barbacoa Bandits Bull Skull Hat Digitizing'
        },
        {
            src: 'Client FeedBack/barbacoa-bandits-trucker-hat-embroidery-stitchout.webp',
            alt: 'Barbacoa Bandits Horned Steer Bull Skull Embroidered Trucker Hat Stitchout',
            title: 'Barbacoa Bandits Trucker Hat Stitchout'
        },
        {
            src: 'Client FeedBack/sevenailz-barbershop-greek-key-jacket-back-embroidery-digitizing.webp',
            alt: 'Sevenailz Barbershop Pole Circular Emblem with Greek Key Border Jacket Back Embroidery Digitizing File',
            title: 'Sevenailz Barbershop Greek Key Jacket Back Digitizing'
        },
        {
            src: 'Client FeedBack/sevenailz-barbershop-jacket-back-embroidery-stitchout.webp',
            alt: 'Sevenailz Barbershop Circular Greek Key Emblem Custom Jacket Back Embroidery Stitchout on Red Shirt',
            title: 'Sevenailz Barbershop Jacket Back Stitchout'
        }
    ];

    const images = feedbackItems.map(item => item.src);

    const totalSlides = images.length;
    let currentIndex = 0;
    let autoTimer = null;
    let isTransitioning = false;

    // --- Slide width percentage (center panel takes ~65%, sides peek) ---
    const SLIDE_WIDTH_PERCENT = 65; // center image width (sides peek smaller)

    // --- Build slide images in track ---
    images.forEach((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'flex-shrink-0 h-full flex items-center justify-center';
        slide.style.width = SLIDE_WIDTH_PERCENT + '%';
        slide.style.transition = 'transform 600ms ease-in-out, opacity 600ms ease-in-out';

        const img = document.createElement('img');
        const item = feedbackItems[i] || { alt: 'Client Stitchout ' + (i + 1), title: 'Client Stitchout' };
        img.src = src;
        img.alt = item.alt;
        img.title = item.title;
        img.className = 'w-full h-full object-contain';
        img.draggable = false;
        slide.appendChild(img);
        track.appendChild(slide);
    });

    const slides = track.querySelectorAll(':scope > div');

    // --- Build Thumbnail Strip ---
    images.forEach((src, i) => {
        const thumb = document.createElement('img');
        const item = feedbackItems[i] || { alt: 'Thumbnail ' + (i + 1), title: 'Client Stitchout' };
        thumb.src = src;
        thumb.alt = item.alt + ' - Thumbnail';
        thumb.title = item.title;
        thumb.className = 'h-14 w-20 md:h-16 md:w-24 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all duration-300 hover:border-primary';
        thumb.style.borderColor = i === 0 ? 'var(--color-primary, #c9a84c)' : 'transparent';
        thumb.addEventListener('click', () => goTo(i));
        strip.appendChild(thumb);
    });

    const thumbs = strip.querySelectorAll('img');

    // --- Apply scale/opacity to slides based on distance from center ---
    function updateSlideStyles() {
        slides.forEach((slide, i) => {
            if (i === currentIndex) {
                slide.style.transform = 'scale(1) translateX(0)';
                slide.style.opacity = '1';
                slide.style.zIndex = '2';
            } else if (i < currentIndex) {
                slide.style.transform = 'scale(0.85) translateX(20%)';
                slide.style.opacity = '0.6';
                slide.style.zIndex = '1';
            } else {
                slide.style.transform = 'scale(0.85) translateX(-20%)';
                slide.style.opacity = '0.6';
                slide.style.zIndex = '1';
            }
        });
    }

    // --- Position track so current slide is centered ---
    function updatePosition(animate) {
        if (!animate) {
            track.style.transition = 'none';
            slides.forEach(s => s.style.transition = 'none');
        } else {
            track.style.transition = 'transform 600ms ease-in-out';
            slides.forEach(s => s.style.transition = 'transform 600ms ease-in-out, opacity 600ms ease-in-out');
        }
        // Offset: center the current slide
        const offset = (50 - SLIDE_WIDTH_PERCENT / 2) - (currentIndex * SLIDE_WIDTH_PERCENT);
        track.style.transform = 'translateX(' + offset + '%)';
        updateSlideStyles();

        if (!animate) {
            // Force reflow then re-enable transitions
            track.offsetHeight;
            track.style.transition = 'transform 600ms ease-in-out';
        }
    }

    // --- Go to a specific slide ---
    function goTo(index, animate = true) {
        if (isTransitioning && animate) return;
        if (index === currentIndex && animate) return;

        // Update thumbnail borders
        thumbs[currentIndex].style.borderColor = 'transparent';
        currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;
        thumbs[currentIndex].style.borderColor = 'var(--color-primary, #c9a84c)';

        // Scroll active thumb into view, but only if the user is actually looking at the slider section.
        // This prevents the page from auto-scrolling down to the slider on load when the auto-play timer ticks.
        const sliderRect = wrapper.getBoundingClientRect();
        const isSliderVisible = (
            sliderRect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            sliderRect.bottom > 0
        );

        if (isSliderVisible) {
            thumbs[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        if (animate) {
            isTransitioning = true;
            updatePosition(true);
            setTimeout(() => { isTransitioning = false; }, 650);
        } else {
            updatePosition(false);
        }

        resetAutoPlay();
    }

    // --- Initial position ---
    updatePosition(false);

    // --- Auto-play (3 seconds) ---
    function startAutoPlay() {
        autoTimer = setInterval(() => {
            goTo(currentIndex + 1);
        }, 3000);
    }

    function resetAutoPlay() {
        clearInterval(autoTimer);
        startAutoPlay();
    }

    startAutoPlay();

    // --- Main viewer prev/next buttons ---
    const mainPrev = document.getElementById('fb-main-prev');
    const mainNext = document.getElementById('fb-main-next');

    if (mainPrev) mainPrev.addEventListener('click', () => goTo(currentIndex - 1));
    if (mainNext) mainNext.addEventListener('click', () => goTo(currentIndex + 1));

    // --- Thumbnail strip scroll buttons ---
    const thumbPrev = document.getElementById('fb-thumb-prev');
    const thumbNext = document.getElementById('fb-thumb-next');

    if (thumbPrev) thumbPrev.addEventListener('click', () => {
        strip.scrollBy({ left: -300, behavior: 'smooth' });
    });
    if (thumbNext) thumbNext.addEventListener('click', () => {
        strip.scrollBy({ left: 300, behavior: 'smooth' });
    });

    // Pause auto-play on hover over entire slider area
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
        wrapper.addEventListener('mouseleave', () => startAutoPlay());
    }

    // --- Touch/swipe support for mobile ---
    let touchStartX = 0;
    let touchEndX = 0;
    const sliderContainer = track.parentElement;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoTimer);
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goTo(currentIndex + 1);
            else goTo(currentIndex - 1);
        }
        startAutoPlay();
    }, { passive: true });
}

// ===================================================================
//  GLOBAL INTERACTIVE ELEMENTS (TOASTS, MODALS, newsletter, profile)
// ===================================================================
function initInteractiveElements() {
    // 1. Toast Notification Helper
    window.showToast = function(message, type = 'success') {
        const existingToast = document.querySelector('.global-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `global-toast fixed top-20 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border transition-all duration-300 transform translate-y-[-20px] opacity-0 pointer-events-none`;
        
        if (type === 'success') {
            toast.className += ' bg-white dark:bg-card-dark border-green-500/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-green-500 text-xl filled-icon">check_circle</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        } else if (type === 'error') {
            toast.className += ' bg-white dark:bg-card-dark border-red-500/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-red-500 text-xl filled-icon">error</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        } else {
            toast.className += ' bg-white dark:bg-card-dark border-primary/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-primary text-xl">info</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
            toast.classList.add('translate-y-0', 'opacity-100');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 2. Custom Dialog Modal Helper
    window.showModalDialog = function(title, contentHTML, actionsHTML = '') {
        const existingModal = document.querySelector('.global-dialog-modal');
        if (existingModal) existingModal.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'global-dialog-modal fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-card-dark border border-primary/25 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-transform duration-300 transform scale-95 flex flex-col max-h-[85vh]';
        
        modal.innerHTML = `
            <div class="flex items-center justify-between px-6 py-4 border-b border-primary/15 bg-slate-50/80 dark:bg-card-dark">
                <h3 class="font-black text-gradient-gold text-lg">${title}</h3>
                <button class="close-modal-btn text-slate-400 hover:text-red-500 transition-colors text-2xl font-light leading-none">&times;</button>
            </div>
            <div class="p-6 text-sm text-slate-700 dark:text-slate-200 overflow-y-auto space-y-4 flex-1">
                ${contentHTML}
            </div>
            <div class="px-6 py-4 bg-slate-50/80 dark:bg-black/40 flex justify-end gap-3 border-t border-primary/15">
                ${actionsHTML || `<button class="close-modal-btn bg-primary text-background-dark font-bold text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all">Close</button>`}
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            backdrop.classList.add('opacity-100');
            modal.classList.add('scale-100');
            modal.classList.remove('scale-95');
        }, 50);

        const closeBtns = backdrop.querySelectorAll('.close-modal-btn');
        const closeModal = () => {
            backdrop.classList.remove('opacity-100');
            modal.classList.remove('scale-100');
            modal.classList.add('scale-95');
            document.body.style.overflow = '';
            setTimeout(() => backdrop.remove(), 300);
        };

        closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    };

    // 3. Newsletter Submission Interceptor
    document.querySelectorAll('footer form, main form').forEach(form => {
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (emailInput && submitBtn && submitBtn.textContent.trim().toLowerCase() === 'join') {
            form.removeAttribute('onsubmit');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                if (!email) return;
                
                showToast(`Thank you! "${email}" has been added to our list.`, 'success');
                emailInput.value = '';
            });
        }
    });

    // 4. Privacy & Terms Modals (Intercept # clicks containing Privacy or Terms)
    document.querySelectorAll('a[href="#"]').forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('privacy')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const privacyContent = `
                    <p class="font-bold text-slate-800 dark:text-slate-200">1. Information Collection</p>
                    <p>We collect only the name, email address, project names, sizing, format requests, and artwork files uploaded via our order and quote forms. We do not use persistent cookies or trackers.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">2. Uploaded Artworks</p>
                    <p>All client designs and logo files uploaded to Dezan Digitizing are held in absolute confidentiality. They are used solely to perform the embroidery digitizing and vector conversion services you request.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">3. File Retention</p>
                    <p>Temporary file uploads (via tmpfiles.org) expire within 48 hours. Digitized production files (.DST, .PES, etc.) are kept in our secure cloud vaults for 5 years so you can retrieve them if lost.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">4. Third-Party Sharing</p>
                    <p>We do not share, lease, sell, or distribute your artwork, designs, or personal details with any external organizations or third parties.</p>
                `;
                showModalDialog("Privacy Policy", privacyContent);
            });
        } else if (text.includes('terms')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const termsContent = `
                    <p class="font-bold text-slate-800 dark:text-slate-200">1. Ordering & Approvals</p>
                    <p>By placing an order, you confirm you own the legal rights or licenses to reproduce the uploaded artwork/logo designs.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">2. Free Review & Invoicing</p>
                    <p>No upfront payment is required when submitting files. We will review your artwork and placement specs, verify if there are complex edits needed, and email you a direct invoice via PayPal or card processor.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">3. Delivery & Turnaround</p>
                    <p>Standard delivery is 12-24 hours for Left Chest, Hat, and Simple Vector designs. Jacket Backs and Pet Portraits take up to 2-3 days depending on complexity.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">4. Free Edits & Revisions</p>
                    <p>We offer unlimited minor edits/revisions (such as minor size adjustments, minor stitch adjustments, density edits) for 30 days after order delivery to guarantee perfect sewout results.</p>
                `;
                showModalDialog("Terms of Service", termsContent);
            });
        }
    });

    // 5. Profile settings buttons (profile.html only)
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";
    if (currentPage === "profile.html" || currentPage === "profile") {
        
        // Load saved profile data
        const profileNameEl = document.getElementById("profile-name");
        const profileEmailEl = document.getElementById("profile-email");
        if (profileNameEl && profileEmailEl) {
            const savedName = localStorage.getItem("profileName");
            const savedEmail = localStorage.getItem("profileEmail");
            if (savedName) profileNameEl.textContent = savedName;
            if (savedEmail) profileEmailEl.textContent = savedEmail;
        }

        // Edit Profile
        const editProfileBtn = document.getElementById("btn-edit-profile");
        if (editProfileBtn) {
            editProfileBtn.addEventListener("click", () => {
                const currentName = profileNameEl ? profileNameEl.textContent : "John Doe";
                const currentEmail = profileEmailEl ? profileEmailEl.textContent : "john@example.com";
                
                const editHTML = `
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Full Name</label>
                            <input id="edit-name-input" type="text" class="w-full h-11 bg-white dark:bg-background-dark border border-primary/30 rounded-lg px-4 focus:ring-1 focus:ring-primary text-slate-800 dark:text-white" value="${currentName}">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Email Address</label>
                            <input id="edit-email-input" type="email" class="w-full h-11 bg-white dark:bg-background-dark border border-primary/30 rounded-lg px-4 focus:ring-1 focus:ring-primary text-slate-800 dark:text-white" value="${currentEmail}">
                        </div>
                    </div>
                `;
                
                const actionsHTML = `
                    <button class="close-modal-btn border border-primary/20 hover:bg-primary/5 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg transition-all">Cancel</button>
                    <button id="save-profile-btn" class="bg-primary text-background-dark font-bold text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all">Save Changes</button>
                `;
                
                showModalDialog("Edit Profile Details", editHTML, actionsHTML);
                
                // Save button handler
                const saveBtn = document.getElementById("save-profile-btn");
                if (saveBtn) {
                    saveBtn.addEventListener("click", () => {
                        const newName = document.getElementById("edit-name-input").value.trim();
                        const newEmail = document.getElementById("edit-email-input").value.trim();
                        
                        if (!newName || !newEmail) {
                            showToast("Name and email are required.", "error");
                            return;
                        }
                        
                        localStorage.setItem("profileName", newName);
                        localStorage.setItem("profileEmail", newEmail);
                        
                        if (profileNameEl) profileNameEl.textContent = newName;
                        if (profileEmailEl) profileEmailEl.textContent = newEmail;
                        
                        showToast("Profile details updated successfully!", "success");
                        
                        // Close modal by clicking any close button
                        const closeBtn = document.querySelector('.global-dialog-modal .close-modal-btn');
                        if (closeBtn) closeBtn.click();
                    });
                }
            });
        }

        // Notifications
        const notifBtn = document.getElementById("btn-notifications");
        if (notifBtn) {
            notifBtn.addEventListener("click", () => {
                showToast("You have no new notifications.", "info");
            });
        }

        // Password & Security
        const securityBtn = document.getElementById("btn-security");
        if (securityBtn) {
            securityBtn.addEventListener("click", () => {
                showToast("Password and security settings are locked in demo mode.", "error");
            });
        }

        // Log Out
        const logoutBtn = document.getElementById("btn-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                const logoutHTML = `<p>Are you sure you want to log out of your profile account?</p>`;
                const actionsHTML = `
                    <button class="close-modal-btn border border-primary/20 hover:bg-primary/5 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg transition-all">Cancel</button>
                    <button id="confirm-logout-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all">Log Out</button>
                `;
                
                showModalDialog("Confirm Log Out", logoutHTML, actionsHTML);
                
                const confirmBtn = document.getElementById("confirm-logout-btn");
                if (confirmBtn) {
                    confirmBtn.addEventListener("click", () => {
                        localStorage.removeItem("profileName");
                        localStorage.removeItem("profileEmail");
                        showToast("Logging out...", "info");
                        
                        // Close modal
                        const closeBtn = document.querySelector('.global-dialog-modal .close-modal-btn');
                        if (closeBtn) closeBtn.click();
                        
                        setTimeout(() => {
                            window.location.href = "index.html";
                        }, 1200);
                    });
                }
            });
        }
    }
}
