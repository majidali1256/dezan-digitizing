/**
 * ===================================================================
 *  DEZAN DIGITIZING — CLIENT WORKSPACE JS ENGINE (Modularized)
 *  Shared Controller for:
 *    - client-portal.html   (Dashboard Overview)
 *    - client-orders.html   (My Orders Queue)
 *    - client-quotes.html   (Custom Quotes & Estimations)
 *    - client-invoices.html (Invoices & Payments)
 *    - client-profile.html  (Profile, Defaults & Settings)
 * ===================================================================
 */

(function () {
    'use strict';

    // Global client state
    window.clientWorkspaceState = {
        session: null,
        orders: [],
        quotes: [],
        activeFilter: 'all',
        searchQuery: '',
        currentOrderId: null,
        selectedService: 'Digitizing',
        selectedPlan: 'Hat / Left Chest Logos',
        artworkFiles: [],
        stitchOutPhoto: null
    };

    const state = window.clientWorkspaceState;

    // ----- Initialize Workspace -----
    async function initClientWorkspace() {
        // Ensure InsForge client is loaded
        if (typeof window.insforgeClient === 'undefined') {
            console.warn('insforgeClient not yet ready, waiting...');
            setTimeout(initClientWorkspace, 100);
            return;
        }

        // Check authentication
        let user = null;
        try {
            user = window.insforgeClient.getCurrentUser();
        } catch (e) {
            console.warn('Session check warning:', e);
        }

        if (!user || user.role !== 'client') {
            user = {
                id: 'demo-client-1',
                email: 'client@falconapparel.com',
                displayName: 'John Falcon',
                role: 'client',
                company: 'Falcon Apparel Group',
                phone: '+1 (555) 234-8900'
            };
            try {
                if (typeof window.insforgeClient.setSession === 'function') {
                    window.insforgeClient.setSession(user);
                }
            } catch (e) {
                console.warn('Set session warning:', e);
            }
        }

        state.session = user || { displayName: 'John Foster', email: 'john@creativemerch.com', role: 'client' };
        updateHeaderUserUI();
        highlightActiveNavTab();

        // Load data
        await loadClientData();

        // Subscribe to real-time order updates
        if (typeof window.insforgeClient.subscribeToOrders === 'function') {
            window.insforgeClient.subscribeToOrders((event, data) => {
                console.log('Realtime order update:', event, data);
                loadClientData();
            });
        }

        // Render current page view
        renderActivePage();

        // Bind global listeners
        bindGlobalListeners();

        // Handle URL action parameters (e.g. ?action=new_order or ?action=request_quote)
        handleUrlActions();
    }

    // ----- Data Fetching -----
    async function loadClientData() {
        try {
            const orders = await window.insforgeClient.getOrders();
            state.orders = Array.isArray(orders) ? orders : [];
        } catch (e) {
            console.warn('Failed to load orders, using fallback:', e);
            state.orders = getFallbackOrders();
        }

        try {
            if (typeof window.insforgeClient.getQuotes === 'function') {
                const quotes = await window.insforgeClient.getQuotes();
                state.quotes = Array.isArray(quotes) ? quotes : [];
            }
        } catch (e) {
            console.warn('Quotes load warning:', e);
        }

        updateMetricsAcrossViews();
    }

    function getFallbackOrders() {
        return [
            {
                id: 'ord-101',
                order_number: 'ORD-8492',
                design_name: 'Apex Mountain Gear Left Chest',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                amount: 15.00,
                payment_status: 'paid',
                created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Pique Polo Knit',
                dimensions: '3.5" W x 2.2" H',
                format: 'DST (Tajima)'
            },
            {
                id: 'ord-102',
                order_number: 'ORD-8310',
                design_name: 'Golden Eagle Crest Vintage',
                service_type: 'Digitizing',
                plan: 'Larger Designs',
                status: 'completed',
                amount: 30.00,
                payment_status: 'paid',
                created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                artwork_url: 'images/service-vector.png',
                deliverable_url: 'images/service-digitizing.png',
                target_fabric: 'Denim Jacket Back',
                dimensions: '9.0" W x 7.5" H',
                format: 'EMB & DST',
                stitch_count: 28450
            },
            {
                id: 'ord-103',
                order_number: 'ORD-8199',
                design_name: 'Urban Streetwear Vector Redraw',
                service_type: 'Vectorizing',
                plan: 'Simple Vector',
                status: 'completed',
                amount: 10.00,
                payment_status: 'paid',
                created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
                artwork_url: 'images/service-vector.png',
                deliverable_url: 'images/service-vector.png',
                format: 'AI, EPS, SVG'
            }
        ];
    }

    // ----- Metrics Calculation -----
    function updateMetricsAcrossViews() {
        const orders = state.orders || [];
        const openOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'pending' || o.status === 'revision_requested').length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const quotesCount = orders.filter(o => (o.order_number || '').startsWith('QUO-') || o.status === 'quote_pending').length;
        
        let balanceDue = 0;
        orders.forEach(o => {
            if (o.payment_status === 'unpaid' || o.payment_status === 'pending') {
                balanceDue += parseFloat(o.amount || 0);
            }
        });

        // Update DOM elements if present
        setElText('metric-open-orders', openOrders);
        setElText('metric-completed-orders', completedOrders);
        setElText('metric-quotes-count', quotesCount);
        setElText('metric-balance-due', `$${balanceDue.toFixed(2)}`);

        // Badges in navigation
        setElText('nav-badge-orders', orders.length);
        setElText('nav-badge-quotes', quotesCount);
        setElText('nav-badge-invoices', balanceDue > 0 ? `$${Math.round(balanceDue)}` : '0');
    }

    // ----- Active Page Dispatcher -----
    function renderActivePage() {
        const page = document.body.dataset.clientPage || 'dashboard';

        switch (page) {
            case 'dashboard':
                renderDashboardView();
                break;
            case 'orders':
                renderOrdersView();
                break;
            case 'quotes':
                renderQuotesView();
                break;
            case 'invoices':
                renderInvoicesView();
                break;
            case 'profile':
                renderProfileView();
                break;
            default:
                renderDashboardView();
        }
    }

    // ===================================================================
    //  PAGE 1: DASHBOARD VIEW (client-portal.html)
    // ===================================================================
    function renderDashboardView() {
        const recentOrdersContainer = document.getElementById('recent-orders-container');
        if (!recentOrdersContainer) return;

        const active = state.orders.filter(o => o.status === 'in_progress' || o.status === 'revision_requested');
        const completed = state.orders.filter(o => o.status === 'completed');

        if (state.orders.length === 0) {
            recentOrdersContainer.innerHTML = `
                <div class="p-8 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-amber-500 mb-2">inventory_2</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No active orders found</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Start your first custom embroidery digitizing or vector project.</p>
                    <button onclick="window.clientWorkspace.openNewOrderModal()" class="px-4 py-2 rounded-xl bg-primary text-background-dark font-bold text-xs shadow-md hover:brightness-110">Place Your First Order</button>
                </div>
            `;
            return;
        }

        let html = '';

        // Active production section
        if (active.length > 0) {
            html += `<div class="mb-4"><h3 class="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-primary mb-2 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> In Production (${active.length})</h3><div class="space-y-3">`;
            active.forEach(order => {
                html += renderClientOrderCard(order, false);
            });
            html += `</div></div>`;
        }

        // Recent completed downloads
        if (completed.length > 0) {
            html += `<div><h3 class="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">cloud_download</span> Ready for Download</h3><div class="space-y-3">`;
            completed.slice(0, 3).forEach(order => {
                html += renderClientOrderCard(order, true);
            });
            html += `</div></div>`;
        }

        recentOrdersContainer.innerHTML = html;
    }

    // ===================================================================
    //  PAGE 2: MY ORDERS VIEW (client-orders.html)
    // ===================================================================
    function renderOrdersView() {
        const container = document.getElementById('orders-list-container');
        if (!container) return;

        let filtered = [...state.orders];

        // Search query filter
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                (o.design_name || '').toLowerCase().includes(q) ||
                (o.order_number || '').toLowerCase().includes(q) ||
                (o.service_type || '').toLowerCase().includes(q) ||
                (o.plan || '').toLowerCase().includes(q)
            );
        }

        // Filter tab
        if (state.activeFilter === 'in_progress') {
            filtered = filtered.filter(o => o.status === 'in_progress');
        } else if (state.activeFilter === 'completed') {
            filtered = filtered.filter(o => o.status === 'completed');
        } else if (state.activeFilter === 'revision_requested') {
            filtered = filtered.filter(o => o.status === 'revision_requested');
        } else if (state.activeFilter === 'unpaid') {
            filtered = filtered.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'pending');
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">search_off</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No orders matching your criteria</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Try adjusting your filters or search keywords.</p>
                    <button onclick="window.clientWorkspace.resetFilter()" class="px-3.5 py-1.5 rounded-xl border border-primary/30 text-primary-dark dark:text-primary font-bold text-xs hover:bg-primary/10">Show All Orders</button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(o => renderClientOrderCard(o, o.status === 'completed')).join('');
    }

    // Card Component
    function renderClientOrderCard(order, isCompleted) {
        const statusClass = order.status || 'in_progress';
        const formattedDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

        return `
            <div class="client-order-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                        ${order.artwork_url ? `<img src="${order.artwork_url}" alt="Artwork" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-2xl text-amber-600 dark:text-primary">brush</span>`}
                    </div>
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="font-mono text-xs font-extrabold text-amber-900 dark:text-primary">${order.order_number || 'ORD-NEW'}</span>
                            <span class="status-badge ${statusClass}">${(order.status || 'in_progress').replace('_', ' ')}</span>
                            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">• ${formattedDate}</span>
                        </div>
                        <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${order.design_name || 'Custom Design'}</h4>
                        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <span class="font-semibold text-slate-800 dark:text-slate-200">${order.service_type || 'Digitizing'}</span>
                            <span>• Plan: <strong>${order.plan || 'Standard'}</strong></span>
                            ${order.stitch_count ? `<span>• Stitches: <strong>${order.stitch_count.toLocaleString()}</strong></span>` : ''}
                            ${order.format ? `<span>• Format: <strong class="uppercase">${order.format}</strong></span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-primary/10">
                    ${isCompleted ? `
                        <a href="${order.deliverable_url || order.artwork_url || '#'}" download class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer">
                            <span class="material-symbols-outlined text-sm">download</span>
                            <span>Download Files</span>
                        </a>
                        <button onclick="window.clientWorkspace.openRevisionModal('${order.order_number}')" class="px-3 py-2 rounded-xl border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer" title="Request free revision">
                            <span class="material-symbols-outlined text-sm">history_edu</span>
                            <span>Revision</span>
                        </button>
                    ` : `
                        <button onclick="window.clientWorkspace.openOrderDetailsModal('${order.order_number}')" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                            <span>Inspect Specs</span>
                        </button>
                    `}
                    <button onclick="window.clientWorkspace.openClientInvoiceModal('${order.id || order.order_number}')" class="p-2 rounded-xl border border-slate-200 dark:border-primary/20 text-slate-600 dark:text-slate-300 hover:text-amber-800 dark:hover:text-primary transition-colors cursor-pointer" title="View Invoice & Receipt">
                        <span class="material-symbols-outlined text-base">receipt_long</span>
                    </button>
                </div>
            </div>
        `;
    }

    // ===================================================================
    //  PAGE 3: CUSTOM QUOTES VIEW (client-quotes.html)
    // ===================================================================
    function renderQuotesView() {
        const container = document.getElementById('quotes-list-container');
        if (!container) return;

        const quotes = state.orders.filter(o => (o.order_number || '').startsWith('QUO-') || o.status === 'quote_pending' || o.is_quote);

        if (quotes.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-amber-500 mb-2">request_quote</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No custom quotes requested yet</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Have a jacket back or complex artwork? Request a free 12-24h estimation with itemized stitch count.</p>
                    <button onclick="window.clientWorkspace.openNewQuoteModal()" class="px-4 py-2.5 rounded-xl bg-primary text-background-dark font-black text-xs shadow-md hover:brightness-110">Request Custom Quote</button>
                </div>
            `;
            return;
        }

        container.innerHTML = quotes.map(quote => `
            <div class="client-order-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div class="w-14 h-14 rounded-xl bg-amber-500/10 text-amber-800 dark:text-primary flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                        <span class="material-symbols-outlined text-2xl">request_quote</span>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-mono text-xs font-bold text-amber-900 dark:text-primary">${quote.order_number || 'QUO-REQ'}</span>
                            <span class="status-badge quote_pending">Under Review</span>
                        </div>
                        <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${quote.design_name || 'Complex Embroidery Quote'}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Est. Turnaround: 12-24 Hours • Fabric: ${quote.target_fabric || 'Not specified'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button onclick="window.clientWorkspace.openOrderDetailsModal('${quote.order_number}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all flex items-center gap-1 whitespace-nowrap">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                        <span>View Details</span>
                    </button>
                    <button onclick="window.clientWorkspace.openNewOrderModal('${quote.design_name}')" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background-dark font-black text-xs transition-all flex items-center gap-1 shadow-xs whitespace-nowrap">
                        <span>Convert to Order</span>
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ===================================================================
    //  PAGE 4: INVOICES VIEW (client-invoices.html)
    // ===================================================================
    function renderInvoicesView() {
        const container = document.getElementById('invoices-list-container');
        if (!container) return;

        const invoices = state.orders || [];

        if (invoices.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">payments</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No invoices on file</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">When orders are placed, official invoices and receipts will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = invoices.map(inv => {
            const isPaid = inv.payment_status === 'paid';
            return `
                <div class="client-order-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex items-center gap-3.5 min-w-0">
                        <div class="w-12 h-12 rounded-xl ${isPaid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'} border flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-2xl">${isPaid ? 'check_circle' : 'pending'}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">INV-${inv.order_number || '000'}</span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'}">${inv.payment_status || 'unpaid'}</span>
                            </div>
                            <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${inv.design_name || 'Embroidery Deliverable'}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${inv.service_type || 'Digitizing'} &bull; ${inv.plan || 'Flat Rate'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div class="text-right">
                            <span class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">$${parseFloat(inv.amount || 0).toFixed(2)}</span>
                            <span class="text-[11px] text-slate-500 dark:text-slate-400 block">${isPaid ? 'Settled via PayPal' : 'Due Upon Delivery'}</span>
                        </div>
                        <button onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-4 py-2 rounded-xl ${isPaid ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'bg-primary hover:bg-primary-hover text-background-dark font-black'} text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                            <span class="material-symbols-outlined text-sm">receipt</span>
                            <span>${isPaid ? 'View Receipt' : 'Pay Now'}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===================================================================
    //  PAGE 5: PROFILE VIEW (client-profile.html)
    // ===================================================================
    function renderProfileView() {
        const form = document.getElementById('client-profile-form');
        if (!form) return;

        const user = state.session || {};
        setInputValue('profile-name', user.displayName || user.display_name || 'Valued Client');
        setInputValue('profile-email', user.email || 'client@dezan.com');
        setInputValue('profile-company', user.company || '');
        setInputValue('profile-phone', user.phone || '');
        setInputValue('profile-default-format', user.preferredFormat || user.defaultFormat || 'DST');
        setInputValue('profile-default-fabric', user.preferredFabric || user.defaultFabric || 'Pique Knit');
    }

    async function handleProfileSave(e) {
        if (e && e.preventDefault) e.preventDefault();
        const statusEl = document.getElementById('profile-contact-status');
        const saveBtn = document.getElementById('profile-save-btn');
        const nameInput = document.getElementById('profile-name');
        const companyInput = document.getElementById('profile-company');
        const phoneInput = document.getElementById('profile-phone');

        const displayName = (nameInput?.value || '').trim();
        const company = (companyInput?.value || '').trim();
        const phone = (phoneInput?.value || '').trim();

        if (!displayName) {
            showProfileStatus(statusEl, 'Full Name is required.', 'error');
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Saving...</span>';
        }

        const res = await window.insforgeClient.updateUserProfile({
            displayName,
            company,
            phone
        });

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Save Contact Info</span>';
        }

        if (res.success) {
            state.session = res.user;
            setElText('client-display-name', res.user.displayName || 'Client');
            showProfileStatus(statusEl, 'Contact and commercial information saved successfully.', 'success');
            window.insforgeClient.showToast('Profile Updated', 'Your profile details have been saved.', 'check_circle', 'success');
        } else {
            showProfileStatus(statusEl, res.error || 'Failed to update profile.', 'error');
        }
    }

    async function handleDefaultsSave(e) {
        if (e && e.preventDefault) e.preventDefault();
        const statusEl = document.getElementById('profile-defaults-status');
        const saveBtn = document.getElementById('defaults-save-btn');
        const formatSelect = document.getElementById('profile-default-format');
        const fabricSelect = document.getElementById('profile-default-fabric');

        const preferredFormat = formatSelect?.value || 'DST';
        const preferredFabric = fabricSelect?.value || 'Pique Knit';

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Saving...</span>';
        }

        const res = await window.insforgeClient.updateUserProfile({
            preferredFormat,
            preferredFabric,
            defaultFormat: preferredFormat,
            defaultFabric: preferredFabric
        });

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm">tune</span><span>Save Machine Presets</span>';
        }

        if (res.success) {
            state.session = res.user;
            showProfileStatus(statusEl, 'Production defaults and machine presets saved successfully.', 'success');
            window.insforgeClient.showToast('Defaults Saved', 'New orders will automatically use these machine presets.', 'check_circle', 'success');
        } else {
            showProfileStatus(statusEl, res.error || 'Failed to update defaults.', 'error');
        }
    }

    async function handlePasswordChange(e) {
        if (e && e.preventDefault) e.preventDefault();
        const statusEl = document.getElementById('profile-security-status');
        const submitBtn = document.getElementById('profile-password-btn');
        const currentPassInput = document.getElementById('profile-current-password');
        const newPassInput = document.getElementById('profile-new-password');
        const confirmPassInput = document.getElementById('profile-confirm-password');

        const currentPassword = currentPassInput?.value || '';
        const newPassword = newPassInput?.value || '';
        const confirmPassword = confirmPassInput?.value || '';

        if (!currentPassword) {
            showProfileStatus(statusEl, 'Please enter your current password.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showProfileStatus(statusEl, 'New password must be at least 6 characters long.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showProfileStatus(statusEl, 'New password and confirmation do not match.', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Updating...</span>';
        }

        const res = await window.insforgeClient.updatePassword({
            currentPassword,
            newPassword
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">key</span><span>Update Password</span>';
        }

        if (res.success) {
            if (currentPassInput) currentPassInput.value = '';
            if (newPassInput) newPassInput.value = '';
            if (confirmPassInput) confirmPassInput.value = '';
            showProfileStatus(statusEl, 'Account password updated successfully.', 'success');
            window.insforgeClient.showToast('Security Updated', 'Your password has been changed.', 'check_circle', 'success');
        } else {
            showProfileStatus(statusEl, res.error || 'Password update failed.', 'error');
        }
    }

    function showProfileStatus(el, msg, type = 'info') {
        if (!el) return;
        el.classList.remove('hidden');
        if (type === 'success') {
            el.className = 'mb-4 p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold';
            el.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span><span>${msg}</span>`;
        } else {
            el.className = 'mb-4 p-3 rounded-xl text-xs flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 font-semibold';
            el.innerHTML = `<span class="material-symbols-outlined text-sm">error</span><span>${msg}</span>`;
        }
    }

    function togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = isPassword ? 'visibility_off' : 'visibility';
        }
    }
    window.togglePasswordVisibility = togglePasswordVisibility;

    // ----- Modal Controls -----
    function openNewOrderModal(defaultDesignName = '') {
        const modal = document.getElementById('new-order-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (defaultDesignName) {
                const input = document.getElementById('adaptive-job-name');
                if (input) input.value = defaultDesignName;
            }
        } else {
            let target = 'client-portal.html?action=new_order';
            if (defaultDesignName) target += '&plan=' + encodeURIComponent(defaultDesignName);
            window.location.href = target;
        }
    }

    function closeNewOrderModal() {
        const modal = document.getElementById('new-order-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openNewQuoteModal() {
        const modal = document.getElementById('new-order-modal');
        if (modal) {
            openNewOrderModal();
            const quoteRadio = document.querySelector('input[name="order_mode"][value="quote"]');
            if (quoteRadio) {
                quoteRadio.checked = true;
                quoteRadio.dispatchEvent(new Event('change'));
            }
        } else {
            window.location.href = 'client-portal.html?action=request_quote';
        }
    }

    function openOrderDetailsModal(orderNumber) {
        const order = state.orders.find(o => o.order_number === orderNumber);
        if (!order) return;

        setElText('drawer-order-id', order.order_number);
        setElText('drawer-design-name', order.design_name);
        setElText('drawer-service', order.service_type);
        setElText('drawer-plan', order.plan);
        setElText('drawer-status', (order.status || 'in_progress').replace('_', ' '));
        setElText('drawer-amount', `$${parseFloat(order.amount || 0).toFixed(2)}`);
        setElText('drawer-fabric', order.target_fabric || 'Standard Garment');
        setElText('drawer-dimensions', order.dimensions || 'Standard Size');

        const modal = document.getElementById('order-details-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeOrderDetailsModal() {
        const modal = document.getElementById('order-details-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openClientInvoiceModal(orderId) {
        const order = state.orders.find(o => o.id === orderId || o.order_number === orderId) || state.orders[0];
        if (!order) return;

        setElText('invoice-number-disp', `INV-${order.order_number || '8492'}`);
        setElText('invoice-date-disp', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        setElText('invoice-order-ref', order.order_number || 'ORD-8492');
        setElText('invoice-item-desc', `${order.service_type || 'Digitizing'} — ${order.design_name || 'Embroidery Design'}`);
        setElText('invoice-item-rate', `$${parseFloat(order.amount || 15).toFixed(2)}`);
        setElText('invoice-item-amount', `$${parseFloat(order.amount || 15).toFixed(2)}`);
        setElText('invoice-total-disp', `$${parseFloat(order.amount || 15).toFixed(2)}`);

        const modal = document.getElementById('client-invoice-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeClientInvoiceModal() {
        const modal = document.getElementById('client-invoice-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openRevisionModal(orderNumber) {
        state.currentOrderId = orderNumber;
        setElText('revision-order-id-disp', orderNumber);
        const modal = document.getElementById('revision-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeRevisionModal() {
        const modal = document.getElementById('revision-modal');
        if (modal) modal.classList.add('hidden');
    }

    // ----- UI Utilities -----
    function highlightActiveNavTab() {
        const currentPage = document.body.dataset.clientPage || 'dashboard';
        const tabs = document.querySelectorAll('.client-nav-tab');
        tabs.forEach(tab => {
            const tabKey = tab.getAttribute('data-client-link');
            if (tabKey === currentPage) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Highlight mobile bottom dock buttons
        const dockLinks = document.querySelectorAll('nav.fixed a[data-client-link]');
        dockLinks.forEach(link => {
            const linkKey = link.getAttribute('data-client-link');
            if (linkKey === currentPage) {
                link.classList.remove('text-slate-600', 'dark:text-slate-400');
                link.classList.add('text-amber-800', 'dark:text-primary');
            } else {
                link.classList.remove('text-amber-800', 'dark:text-primary');
                link.classList.add('text-slate-600', 'dark:text-slate-400');
            }
        });
    }

    function updateHeaderUserUI() {
        if (!state.session) return;
        const name = state.session.displayName || state.session.email || 'Client';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL';
        
        setElText('header-account-name', name);
        setElText('header-account-avatar', initials);
    }

    function setFilter(type) {
        state.activeFilter = type;
        const pills = document.querySelectorAll('.client-filter-pill');
        pills.forEach(p => {
            if (p.getAttribute('data-filter') === type) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        renderActivePage();
    }

    function resetFilter() {
        state.searchQuery = '';
        const searchInput = document.getElementById('order-search-input');
        if (searchInput) searchInput.value = '';
        setFilter('all');
    }

    function handleSearch(e) {
        state.searchQuery = e.target.value.trim();
        renderActivePage();
    }

    function handleUrlActions() {
        try {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (action === 'new_order') {
                openNewOrderModal();
            } else if (action === 'request_quote') {
                openNewQuoteModal();
            }
        } catch (e) {
            console.warn('URL action parse warning:', e);
        }
    }

    function bindGlobalListeners() {
        // Theme toggle
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        });
    }

    function setElText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function setInputValue(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    // Expose Public API
    window.clientWorkspace = {
        init: initClientWorkspace,
        loadData: loadClientData,
        setFilter,
        resetFilter,
        handleSearch,
        openNewOrderModal,
        closeNewOrderModal,
        openNewQuoteModal,
        openOrderDetailsModal,
        closeOrderDetailsModal,
        openClientInvoiceModal,
        closeClientInvoiceModal,
        openRevisionModal,
        closeRevisionModal,
        handleProfileSave,
        handleDefaultsSave,
        handlePasswordChange
    };

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClientWorkspace);
    } else {
        initClientWorkspace();
    }
})();
