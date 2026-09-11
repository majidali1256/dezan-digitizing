/**
 * Dezan Digitizing — Shared JavaScript
 * Theme toggle, scroll reveal, active navigation, order system,
 * PayPal payment, and EmailJS notification
 */

document.addEventListener("DOMContentLoaded", () => {

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

    // ===== UNIVERSAL DASHBOARD NAVIGATION & ROLE-BASED REDIRECT ENGINE =====
    function getDashboardUrlForRole(role) {
        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';
        if (role === 'admin') return prefix + 'admin-portal.html';
        if (role === 'digitizer') return prefix + 'worker-portal.html';
        return prefix + 'client-portal.html';
    }
    window.getDashboardUrlForRole = getDashboardUrlForRole;

    window.handleDashboardNavClick = function(e) {
        if (e) e.preventDefault();
        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (err) {
            session = null;
        }

        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';

        if (session && session.role) {
            // Already logged in -> Immediately open their correct role dashboard
            const target = getDashboardUrlForRole(session.role);
            window.location.href = target;
        } else {
            // Visitor is not logged in -> Directly navigate to Dashboard Sign In page without popup
            window.location.href = prefix + 'portal-login.html';
        }
    };

    window.handleLoginBtnClick = function(e) {
        if (e) e.preventDefault();
        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';
        window.location.href = prefix + 'portal-login.html';
    };

    // ===== PORTAL LOGIN MODAL CONTROLLERS =====
    function createPortalLoginModalDOM() {
        if (document.getElementById('portal-login-modal')) return;

        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';

        const modal = document.createElement('div');
        modal.id = 'portal-login-modal';
        modal.className = 'hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-login-title');

        modal.innerHTML = `
            <div class="w-full max-w-md bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto transition-all">
                <!-- Close Button -->
                <button type="button" onclick="window.closePortalLoginModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Close login dialog">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>

                <!-- Brand Header -->
                <div class="flex items-center gap-3 mb-5">
                    <img src="${prefix}logo.webp" alt="Dezan Digitizing" class="w-10 h-10 rounded-full object-cover shadow-sm border border-primary/20">
                    <div>
                        <h3 id="modal-login-title" class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">Sign In to Dashboard</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Access your client, digitizer, or admin workspace</p>
                    </div>
                </div>

                <!-- Error Banner (Hidden by default) -->
                <div id="modal-login-error-banner" class="hidden mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2" role="alert">
                    <span class="material-symbols-outlined text-base shrink-0 text-rose-600 mt-0.5">error</span>
                    <span id="modal-login-error-msg" class="leading-relaxed">Invalid email or password.</span>
                </div>

                <!-- Sign In Form -->
                <form id="modal-login-form" onsubmit="window.handleModalLoginSubmit(event)" class="space-y-4">
                    <div>
                        <label for="modal-login-email" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                            <input type="email" id="modal-login-email" required autocomplete="email" placeholder="name@company.com" class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label for="modal-login-password" class="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <a href="${prefix}portal-login.html?tab=forgot" class="text-[11px] font-semibold text-primary hover:underline">Forgot password?</a>
                        </div>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                            <input type="password" id="modal-login-password" required autocomplete="current-password" placeholder="••••••••" class="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                            <button type="button" onclick="window.toggleModalLoginPasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer" aria-label="Toggle password visibility">
                                <span id="modal-login-pw-icon" class="material-symbols-outlined text-lg">visibility</span>
                            </button>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" id="modal-login-submit-btn" class="w-full py-3 rounded-xl bg-primary hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>Enter Dashboard</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                </form>

                <!-- Divider -->
                <div class="my-4 flex items-center gap-3">
                    <div class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    <span class="text-[11px] text-slate-400 font-medium uppercase tracking-wider">or</span>
                    <div class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <!-- Google / Full Portal Sign In -->
                <a href="${prefix}portal-login.html?redirect=dashboard" class="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                </a>

                <!-- Sign Up Link -->
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Don't have an account? 
                        <a href="${prefix}portal-login.html?tab=register&redirect=dashboard" class="font-bold text-primary hover:underline">Create an account</a>
                    </p>
                </div>
            </div>
        `;

        // Close when clicking overlay backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closePortalLoginModal();
            }
        });

        document.body.appendChild(modal);
    }

    window.openPortalLoginModal = function(destination = 'dashboard') {
        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';
        const destQuery = destination && destination !== 'dashboard' ? `?redirect=${encodeURIComponent(destination)}` : '';
        window.location.href = prefix + 'portal-login.html' + destQuery;
    };

    window.closePortalLoginModal = function() {
        const modal = document.getElementById('portal-login-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    };

    window.toggleModalLoginPasswordVisibility = function() {
        const input = document.getElementById('modal-login-password');
        const icon = document.getElementById('modal-login-pw-icon');
        if (input && icon) {
            const isPw = input.type === 'password';
            input.type = isPw ? 'text' : 'password';
            icon.textContent = isPw ? 'visibility_off' : 'visibility';
        }
    };

    window.handleModalLoginSubmit = async function(e) {
        e.preventDefault();
        const emailInput = document.getElementById('modal-login-email');
        const pwInput = document.getElementById('modal-login-password');
        const errorBanner = document.getElementById('modal-login-error-banner');
        const errorMsg = document.getElementById('modal-login-error-msg');
        const submitBtn = document.getElementById('modal-login-submit-btn');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = pwInput ? pwInput.value : '';

        if (!email || !password) {
            if (errorBanner && errorMsg) {
                errorBanner.classList.remove('hidden');
                errorMsg.textContent = 'Please enter both your email address and password.';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                <span>Signing In...</span>
            `;
        }

        try {
            if (!window.insforgeClient || typeof window.insforgeClient.signIn !== 'function') {
                throw new Error('Authentication client unavailable. Please refresh the page.');
            }

            const { user, error } = await window.insforgeClient.signIn(email, password);
            if (error || !user) {
                if (errorBanner && errorMsg) {
                    errorBanner.classList.remove('hidden');
                    errorMsg.textContent = error || 'Invalid email or password. Please try again.';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `
                        <span>Enter Dashboard</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    `;
                }
                return;
            }

            // Successful authentication -> update header & redirect to role dashboard
            initHeaderAuthState();
            const dashboardUrl = getDashboardUrlForRole(user.role);
            window.location.href = dashboardUrl;
        } catch (err) {
            if (errorBanner && errorMsg) {
                errorBanner.classList.remove('hidden');
                errorMsg.textContent = err.message || 'An error occurred during sign in. Please try again.';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span>Enter Dashboard</span>
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                `;
            }
        }
    };

    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('portal-login-modal');
            if (modal && !modal.classList.contains('hidden')) {
                window.closePortalLoginModal();
            }
        }
    });

    // ===== DYNAMIC HEADER AUTH STATE & UNIVERSAL DASHBOARD NAV INJECTION =====
    function initHeaderAuthState() {
        const slots = document.querySelectorAll('#header-auth-slot, .header-auth-slot');
        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (e) {
            session = null;
        }

        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';
        const dashboardUrl = session && session.role ? getDashboardUrlForRole(session.role) : (prefix + 'portal-login.html');
        const tooltip = session && session.role 
            ? `Return to ${session.role.charAt(0).toUpperCase() + session.role.slice(1)} Dashboard`
            : 'Access Dashboard';

        const profileUrl = session && session.role === 'admin' 
            ? (prefix + 'admin-portal.html') 
            : (session && session.role === 'digitizer' ? (prefix + 'worker-portal.html') : (prefix + 'client-profile.html'));

        slots.forEach(slot => {
            if (session && session.role) {
                // Logged in: show direct Dashboard link + account avatar & dropdown menu
                slot.innerHTML = `
                    <div class="flex items-center gap-1.5 sm:gap-2">
                        <a href="${dashboardUrl}" class="nav-dashboard-link px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs" title="${tooltip}" aria-label="${tooltip}">
                            <span class="material-symbols-outlined text-[17px]">dashboard</span>
                            <span>Dashboard</span>
                        </a>
                        <div class="relative">
                            <button id="user-header-btn" class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-slate-800 dark:text-primary hover:bg-primary/30 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" title="${session.displayName || 'My Account'}" aria-label="User profile and options">
                                <span class="material-symbols-outlined text-lg sm:text-xl">account_circle</span>
                            </button>
                            <div id="user-header-menu" class="hidden absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xl py-2 z-50 transition-all text-xs">
                                <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                            ${(session.displayName || session.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="font-bold text-slate-900 dark:text-white truncate text-sm leading-tight">${session.displayName || 'User'}</p>
                                            <p class="text-[11px] text-slate-500 truncate">${session.email || ''}</p>
                                        </div>
                                    </div>
                                    <span class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/15 text-slate-900 dark:text-primary border border-primary/30">${session.role}</span>
                                </div>
                                <div class="py-1">
                                    <a href="${dashboardUrl}" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                        <span class="material-symbols-outlined text-base text-primary">dashboard</span>
                                        <span>Go to Dashboard</span>
                                    </a>
                                    <a href="${profileUrl}" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                        <span class="material-symbols-outlined text-base text-primary">person</span>
                                        <span>Profile & Settings</span>
                                    </a>
                                    <a href="${prefix}track-order.html" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                        <span class="material-symbols-outlined text-base text-primary">local_shipping</span>
                                        <span>Track Orders</span>
                                    </a>
                                </div>
                                <div class="border-t border-slate-100 dark:border-slate-800 pt-1">
                                    <button id="header-signout-btn" class="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold text-left cursor-pointer">
                                        <span class="material-symbols-outlined text-base">logout</span>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
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
                            window.location.href = prefix + 'portal-login.html';
                        }
                    });
                } 
            } else {
                // Logged out / Guest: Profile button is ALWAYS present and clearly displays "Guest"
                slot.innerHTML = `
                    <div class="flex items-center gap-1.5 sm:gap-2">
                        <a href="${prefix}portal-login.html" onclick="window.handleDashboardNavClick(event)" class="nav-dashboard-link px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs" title="Access Dashboard" aria-label="Access Dashboard">
                            <span class="material-symbols-outlined text-[17px]">dashboard</span>
                            <span>Dashboard</span>
                        </a>
                        <div class="relative">
                            <button id="user-header-btn" class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-slate-800 dark:text-primary hover:bg-primary/30 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" title="Guest (Not Signed In)" aria-label="Guest Profile">
                                <span class="material-symbols-outlined text-lg sm:text-xl">account_circle</span>
                            </button>
                            <div id="user-header-menu" class="hidden absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/25 shadow-2xl py-2 z-50 transition-all text-xs">
                                <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                                                <span class="material-symbols-outlined text-lg">account_circle</span>
                                            </div>
                                            <div>
                                                <p class="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">Guest</p>
                                                <p class="text-[11px] text-slate-500 dark:text-slate-400">Browsing as Guest</p>
                                            </div>
                                        </div>
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Guest
                                        </span>
                                    </div>
                                </div>
                                <div class="p-3">
                                    <div class="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                        Sign in to access your orders, stitch files & free sew-out revisions.
                                    </div>
                                    <a href="${prefix}portal-login.html" onclick="window.handleDashboardNavClick(event)" class="mt-2.5 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary text-slate-950 font-black hover:bg-primary-hover transition-all text-xs shadow-xs cursor-pointer text-center">
                                        <span class="material-symbols-outlined text-base">login</span>
                                        <span>Sign In / Register</span>
                                    </a>
                                </div>
                                <div class="border-t border-slate-100 dark:border-slate-800 pt-1">
                                    <a href="${prefix}track-order.html" class="flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                        <span class="material-symbols-outlined text-base text-primary">local_shipping</span>
                                        <span>Track Order (Guest)</span>
                                    </a>
                                    <button type="button" onclick="if(window.openOrderQuoteModal){window.openOrderQuoteModal('order');} document.querySelectorAll('#user-header-menu').forEach(m => m.classList.add('hidden'));" class="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold text-left cursor-pointer">
                                        <span class="material-symbols-outlined text-base text-primary">add_circle</span>
                                        <span>Place New Order</span>
                                    </button>
                                </div>
                            </div>
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
            }
        });

        // Synchronize and ensure Dashboard navigation option across public navs
        initUniversalDashboardNav(session);
    }

    function initUniversalDashboardNav(session) {
        const isSubdir = window.location.pathname.includes('/embroidery-digitizing/') || 
                         window.location.pathname.includes('/vector-art-conversion/') || 
                         window.location.pathname.includes('/stitch-lab/');
        const prefix = isSubdir ? '/' : '';
        const dashboardUrl = session && session.role ? getDashboardUrlForRole(session.role) : (prefix + 'portal-login.html');
        const tooltip = session && session.role 
            ? `Return to ${session.role.charAt(0).toUpperCase() + session.role.slice(1)} Dashboard`
            : 'Sign In to Access Dashboard';

        // 1. Desktop Navs: Clean up any duplicate .nav-dashboard-link inside middle <nav>
        // because Dashboard now lives in the primary header action slot (#header-auth-slot) replacing Login
        document.querySelectorAll('header nav.hidden.md\\:flex .nav-dashboard-link, header nav.md\\:flex .nav-dashboard-link').forEach(link => {
            link.remove();
        });

        // 2. Mobile Header: Clean up any duplicate .nav-dashboard-mobile-btn
        // because #header-auth-slot is already rendered and visible on all viewports (mobile, tablet, desktop)
        document.querySelectorAll('.nav-dashboard-mobile-btn').forEach(btn => {
            btn.remove();
        });

        // 3. Mobile Bottom Nav: Ensure Dashboard button is present for mobile ergonomics
        document.querySelectorAll('nav.md\\:hidden.fixed.bottom-0').forEach(bottomNav => {
            const container = bottomNav.querySelector('.flex.justify-around, .flex.justify-between');
            if (container) {
                let dashItem = container.querySelector('.bottom-nav-dashboard');
                if (!dashItem) {
                    dashItem = document.createElement('a');
                    dashItem.className = 'bottom-nav-dashboard flex flex-col items-center gap-0.5 text-primary min-w-[50px] cursor-pointer transition-colors';
                    dashItem.innerHTML = `
                        <span class="material-symbols-outlined text-xl">dashboard</span>
                        <span class="text-[10px] font-bold">Dashboard</span>
                    `;
                    container.appendChild(dashItem);
                }
                dashItem.href = dashboardUrl;
                dashItem.onclick = (e) => window.handleDashboardNavClick(e);
                dashItem.title = tooltip;
            }
        });
    }
    window.initUniversalDashboardNav = initUniversalDashboardNav;
    window.initHeaderAuthState = initHeaderAuthState;

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
        if (emailEl) emailEl.textContent = email || (role === 'digitizer' ? 'digitizer@dezandigitizing.com' : 'fdezan91@gmail.com');
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
    initInteractiveElements();
});



// ===== STICKY HEADER LOGIC (60/120 FPS PASSIVE RAF COMPOSITOR) =====
function initStickyHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    let isScrolled = false;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY > 15;
                if (scrolled !== isScrolled) {
                    isScrolled = scrolled;
                    header.classList.toggle('header-scrolled', isScrolled);
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ===================================================================
//  BEFORE / AFTER COMPARISON SLIDER (GPU ACCELERATED & ON-DEMAND LISTENERS)
// ===================================================================
function initCompareSlider() {
    const slider = document.getElementById('hero-compare-slider');
    const divider = document.getElementById('compare-divider');
    const beforeImg = document.getElementById('compare-before-img');
    const beforeDiv = document.getElementById('compare-before');
    if (!slider || !divider || (!beforeImg && !beforeDiv)) return;

    let isDragging = false;
    let rafId = null;

    function updateSlider(clientX) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
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
        });
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        updateSlider(clientX);
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
    }

    // Mouse events: attach to window only when dragging starts to eliminate perpetual cursor lag
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e.clientX);
        e.preventDefault();
        window.addEventListener('mousemove', onPointerMove, { passive: true });
        window.addEventListener('mouseup', onPointerUp, { passive: true });
    });

    // Touch events: attach to window only when touch starts
    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp, { passive: true });
    }, { passive: true });
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

    // If client is not logged in, trigger frictionless guest checkout modal directly
    if (!session || !session.role) {
        if (typeof window.openOrderQuoteModal === 'function') {
            window.openOrderQuoteModal({ service, plan: planName, price, mode: 'order' });
        } else if (typeof window.openGuestCheckoutModal === 'function') {
            window.openGuestCheckoutModal({ service, plan: planName, price });
        }
        return;
    }

    // If logged in as client, route directly to Client Portal with adaptive modal opened
    if (session.role === 'client') {
        window.location.href = `client-portal.html?action=new_order&service=${encodeURIComponent(service)}&plan=${encodeURIComponent(planName)}`;
        return;
    }

    // Staff accounts cannot place client orders
    if (session.role === 'admin' || session.role === 'digitizer') {
        if (typeof window.showStaffOrderBlockModal === 'function') {
            window.showStaffOrderBlockModal(session.role);
        } else {
            alert("Staff accounts cannot place client orders. Please log in with a client account.");
        }
        return;
    }
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
    } else {
        if (loginPromptBanner) loginPromptBanner.classList.remove('hidden');
        if (clientLoggedBanner) clientLoggedBanner.classList.add('hidden');
        if (quotePromptBanner) quotePromptBanner.classList.remove('hidden');
        if (quoteClientBanner) quoteClientBanner.classList.add('hidden');
    }

    // Service type sync with summary if present
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        serviceType.addEventListener("change", () => {
            const summaryService = document.getElementById("summary-service");
            if (summaryService) summaryService.textContent = serviceType.value;
        });
    }
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

    // ===================================================================
    //  GOOGLE TAG MANAGER & GOOGLE ADS CONVERSION TRACKING
    // ===================================================================
    function fireOrderConfirmationTracking() {
        if (!window.dezanTracker) return;
        if (isQuote) {
            window.dezanTracker.trackQuoteLead({
                quoteId: orderId,
                email: email,
                service: service,
                project: project
            });
        } else {
            window.dezanTracker.trackOrderPurchase({
                orderId: orderId,
                txnId: txnId,
                amount: amount,
                service: service,
                plan: plan,
                project: project,
                email: email
            });
        }
    }

    if (window.dezanTracker) {
        fireOrderConfirmationTracking();
    } else {
        // Fallback if tracker script is still loading
        window.addEventListener('DOMContentLoaded', fireOrderConfirmationTracking);
        setTimeout(fireOrderConfirmationTracking, 300);
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
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">lock</span> Save Password & Open My Client Dashboard';
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

    // --- Dynamic Slide Width in Pixels (Eliminates percentage ambiguity across Safari/WebKit & Android) ---
    function getSlideWidth() {
        const containerWidth = wrapper.offsetWidth || track.parentElement.offsetWidth || window.innerWidth;
        if (containerWidth < 640) {
            return Math.round(containerWidth * 0.78); // 78% on mobile for clear center view with subtle side peeks
        } else if (containerWidth < 1024) {
            return Math.round(containerWidth * 0.65);
        } else {
            return Math.min(Math.round(containerWidth * 0.52), 640);
        }
    }

    // --- Build slide images in track ---
    images.forEach((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'flex-shrink-0 h-full flex items-center justify-center p-2';
        slide.style.transition = 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1), opacity 600ms cubic-bezier(0.25, 1, 0.5, 1)';

        const img = document.createElement('img');
        const item = feedbackItems[i] || { alt: 'Client Stitchout ' + (i + 1), title: 'Client Stitchout' };
        img.src = encodeURI(src);
        img.alt = item.alt;
        img.title = item.title;
        img.loading = i < 3 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.className = 'w-full h-full object-contain pointer-events-none drop-shadow-md select-none';
        img.draggable = false;
        img.onerror = () => {
            console.warn('Feedback image failed to load:', src);
        };
        slide.appendChild(img);
        track.appendChild(slide);
    });

    const slides = track.querySelectorAll(':scope > div');

    // --- Apply explicit pixel dimensions to every slide ---
    function updateSlideSizes() {
        const slideWidth = getSlideWidth();
        slides.forEach(slide => {
            slide.style.width = slideWidth + 'px';
            slide.style.minWidth = slideWidth + 'px';
            slide.style.maxWidth = slideWidth + 'px';
            slide.style.flex = `0 0 ${slideWidth}px`;
        });
    }

    // --- Build Thumbnail Strip ---
    images.forEach((src, i) => {
        const thumb = document.createElement('img');
        const item = feedbackItems[i] || { alt: 'Thumbnail ' + (i + 1), title: 'Client Stitchout' };
        thumb.src = encodeURI(src);
        thumb.alt = item.alt + ' - Thumbnail';
        thumb.title = item.title;
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
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
                slide.style.transform = 'scale(1)';
                slide.style.opacity = '1';
                slide.style.zIndex = '2';
            } else {
                slide.style.transform = 'scale(0.88)';
                slide.style.opacity = '0.5';
                slide.style.zIndex = '1';
            }
        });
    }

    // --- Position track in exact pixels so current slide is centered ---
    function updatePosition(animate) {
        const containerWidth = wrapper.offsetWidth || track.parentElement.offsetWidth || window.innerWidth;
        const slideWidth = getSlideWidth();
        const centerOffset = (containerWidth - slideWidth) / 2;
        const targetX = centerOffset - (currentIndex * slideWidth);

        if (!animate) {
            track.style.transition = 'none';
            slides.forEach(s => s.style.transition = 'none');
        } else {
            track.style.transition = 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)';
            slides.forEach(s => s.style.transition = 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1), opacity 600ms cubic-bezier(0.25, 1, 0.5, 1)');
        }

        track.style.transform = `translate3d(${Math.round(targetX)}px, 0, 0)`;
        track.style.webkitTransform = `translate3d(${Math.round(targetX)}px, 0, 0)`;
        updateSlideStyles();

        if (!animate) {
            // Force reflow then re-enable transitions
            track.offsetHeight;
            track.style.transition = 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)';
        }
    }

    // --- Go to a specific slide ---
    function goTo(index, animate = true) {
        if (index === currentIndex && animate) return;

        // Reset transition lock for snappy user interactions
        isTransitioning = false;

        // Update thumbnail borders
        thumbs[currentIndex].style.borderColor = 'transparent';
        currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;
        thumbs[currentIndex].style.borderColor = 'var(--color-primary, #c9a84c)';

        // Scroll active thumb into view only if slider is currently visible
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

    // --- Initial setup ---
    updateSlideSizes();
    updatePosition(false);

    // --- Responsive orientation / window resize listener ---
    window.addEventListener('resize', () => {
        updateSlideSizes();
        updatePosition(false);
    });

    // --- Auto-play (3 seconds) ---
    function startAutoPlay() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            goTo(currentIndex + 1);
        }, 3500);
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
        strip.scrollBy({ left: -260, behavior: 'smooth' });
    });
    if (thumbNext) thumbNext.addEventListener('click', () => {
        strip.scrollBy({ left: 260, behavior: 'smooth' });
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
        if (Math.abs(diff) > 40) {
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
                    <p>Artwork files and digitized production files (.DST, .PES, etc.) are maintained in our secure cloud storage vaults so you can download and retrieve them anytime.</p>
                    
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
}

// Auto-load Cookie Consent & Analytics modules globally
(function loadGlobalUtilities() {
    if (typeof document === 'undefined') return;
    function injectScript(src) {
        if (!document.querySelector('script[src*="' + src + '"]')) {
            const s = document.createElement('script');
            s.src = src;
            s.defer = true;
            document.head.appendChild(s);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectScript('/js/tracking-config.js');
            injectScript('/js/cookie-consent.js');
            injectScript('/js/analytics.js');
        });
    } else {
        injectScript('/js/tracking-config.js');
        injectScript('/js/cookie-consent.js');
        injectScript('/js/analytics.js');
    }
})();

