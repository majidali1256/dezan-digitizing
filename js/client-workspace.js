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
        stitchOutPhoto: null,
        layout: localStorage.getItem('dezan_client_layout') || 'grid'
    };

    const state = window.clientWorkspaceState;

    /**
     * Universal Company Date & Time Formatter
     * Returns explicit readable date and exact time (e.g. Sep 9, 2026 · 09:30 AM)
     */
    function formatOrderDateTime(dateVal) {
        if (!dateVal) return { date: 'Recently', time: 'Just now', full: 'Recently' };
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return { date: 'Recently', time: 'Just now', full: 'Recently' };
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return {
            date: dateStr,
            time: timeStr,
            full: `${dateStr} · ${timeStr}`
        };
    }
    window.formatOrderDateTime = formatOrderDateTime;

    // ----- Initialize Workspace -----
    async function initClientWorkspace() {
        // Ensure InsForge client is loaded
        if (typeof window.insforgeClient === 'undefined') {
            console.warn('insforgeClient not yet ready, waiting...');
            setTimeout(initClientWorkspace, 100);
            return;
        }

        // Check authentication
        const user = window.insforgeClient.requireAuth(['client']);
        if (!user) return;

        state.session = user;
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
            const orders = await window.insforgeClient.fetchOrders();
            state.orders = Array.isArray(orders) ? orders : [];
        } catch (e) {
            console.warn('Failed to load orders from network, using cache:', e);
            const cached = window.insforgeClient.getOrders();
            state.orders = Array.isArray(cached) ? cached : [];
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

    function isQuoteRecord(o) {
        if (!o) return false;
        const num = (o.order_number || '').toUpperCase();
        const status = (o.status || '').toLowerCase();
        const service = (o.service_type || '').toLowerCase();
        return o.is_quote === true ||
               num.startsWith('QUO-') ||
               status === 'quote_requested' ||
               status === 'quote_ready' ||
               status === 'quote_pending' ||
               status.includes('quote') ||
               service.includes('quote');
    }

    function isPaymentDue(o) {
        if (!o || isQuoteRecord(o)) return false;
        return (o.payment_status === 'unpaid' || o.payment_status === 'pending' || o.payment_status === 'payment_due');
    }

    function getFallbackOrders() {
        return [];
    }

    // ----- Metrics Calculation -----
    function updateMetricsAcrossViews() {
        const orders = state.orders || [];
        const allCount = orders.length;
        const quotesCount = orders.filter(o => isQuoteRecord(o)).length;
        const revisionsCount = orders.filter(o => !isQuoteRecord(o) && o.status === 'revision_requested').length;
        const completedCount = orders.filter(o => !isQuoteRecord(o) && o.status === 'completed').length;
        const productionCount = orders.filter(o => !isQuoteRecord(o) && o.status !== 'completed' && o.status !== 'revision_requested').length;
        const dueCount = orders.filter(o => isPaymentDue(o)).length;
        
        let balanceDue = 0;
        orders.forEach(o => {
            if (isPaymentDue(o)) {
                const p = o.price !== undefined ? o.price : (o.amount !== undefined ? o.amount : 0);
                balanceDue += parseFloat(p || 0);
            }
        });

        // Update DOM elements if present
        setElText('metric-open-orders', productionCount + revisionsCount);
        setElText('metric-completed-orders', completedCount);
        setElText('metric-quotes-count', quotesCount);
        setElText('metric-balance-due', `$${balanceDue.toFixed(2)}`);

        // Client orders 6 stage pill counter badges
        setElText('client-pill-count-all', allCount);
        setElText('client-pill-count-production', productionCount);
        setElText('client-pill-count-quotes', quotesCount);
        setElText('client-pill-count-revisions', revisionsCount);
        setElText('client-pill-count-due', dueCount);
        setElText('client-pill-count-completed', completedCount);

        // Dashboard stage pill badges (if present)
        setElText('client-dash-pill-all', allCount);
        setElText('client-dash-pill-production', productionCount);
        setElText('client-dash-pill-quotes', quotesCount);
        setElText('client-dash-pill-revisions', revisionsCount);
        setElText('client-dash-pill-due', dueCount);
        setElText('client-dash-pill-completed', completedCount);

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

        const active = state.orders.filter(o => o.status === 'in_progress' || o.status === 'revision_requested' || o.status === 'pending_review' || o.status === 'assigned');
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
            html += `<div class="mb-4"><h3 class="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-primary mb-2 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> In Production & Active (${active.length})</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">`;
            active.forEach(order => {
                html += renderClientOrderCard(order, false);
            });
            html += `</div></div>`;
        }

        // Recent completed downloads
        if (completed.length > 0) {
            html += `<div><h3 class="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">cloud_download</span> Ready for Download</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">`;
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

        let orders = [...(state.orders || [])];

        // Search query filter
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            orders = orders.filter(o =>
                (o.design_name || '').toLowerCase().includes(q) ||
                (o.project_name || '').toLowerCase().includes(q) ||
                (o.order_number || '').toLowerCase().includes(q) ||
                (o.service_type || '').toLowerCase().includes(q) ||
                (o.plan || '').toLowerCase().includes(q)
            );
        }

        const activeFilter = state.activeFilter || 'all';

        // Categorize into the 5 stages
        const productionOrders = orders.filter(o => !isQuoteRecord(o) && o.status !== 'completed' && o.status !== 'revision_requested');
        const quotesOrders = orders.filter(o => isQuoteRecord(o));
        const revisionOrders = orders.filter(o => !isQuoteRecord(o) && o.status === 'revision_requested');
        const dueOrders = orders.filter(o => isPaymentDue(o));
        const completedOrders = orders.filter(o => !isQuoteRecord(o) && o.status === 'completed');

        // Check if no orders match search at all
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20 shadow-xs">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">search_off</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No orders matching your criteria</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Try adjusting your filters or search keywords.</p>
                    <button onclick="window.clientWorkspace.resetFilter()" class="px-3.5 py-1.5 rounded-xl border border-primary/30 text-primary-dark dark:text-primary font-bold text-xs hover:bg-primary/10 cursor-pointer">Show All Orders</button>
                </div>
            `;
            return;
        }

        function renderStageSection({ id, title, subtitle, icon, badgePillClass, iconColorClass, count, list, emptyText, actionHtml, filterKey }) {
            const isTarget = (activeFilter === 'all' || activeFilter === filterKey);
            const hiddenClass = isTarget ? '' : 'hidden';

            let bodyHtml = '';
            if (list.length === 0) {
                bodyHtml = `
                    <div class="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span class="material-symbols-outlined text-3xl text-slate-400 mb-1">${icon}</span>
                        <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">${emptyText}</p>
                        ${actionHtml ? `<div class="mt-3">${actionHtml}</div>` : ''}
                    </div>
                `;
            } else if (state.layout === 'table') {
                bodyHtml = `
                    <div class="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-primary/20 shadow-2xs">
                        <table class="w-full text-left text-xs min-w-[980px]">
                            <thead class="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-primary/20 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th class="px-4 py-3 w-[145px]">Order #, Date &amp; Time</th>
                                    <th class="px-4 py-3 min-w-[200px]">Design &amp; Service</th>
                                    <th class="px-4 py-3 w-[140px]">Specs &amp; Fabric</th>
                                    <th class="px-4 py-3 w-[110px]">Format</th>
                                    <th class="px-4 py-3 w-[110px]">Price</th>
                                    <th class="px-4 py-3 w-[125px]">Status</th>
                                    <th class="px-4 py-3 w-[260px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-primary/10">
                                ${list.map(o => renderClientOrderTableRow(o, o.status === 'completed')).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                bodyHtml = `
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        ${list.map(o => renderClientOrderCard(o, o.status === 'completed')).join('')}
                    </div>
                `;
            }

            return `
                <section id="${id}" class="stage-sub-section ${hiddenClass}" data-filter-target="${filterKey}">
                    <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-primary/10 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                            <span class="material-symbols-outlined text-xl ${iconColorClass}">${icon}</span>
                            <div>
                                <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>${title}</span>
                                    <span class="text-[11px] px-2 py-0.5 rounded-full font-bold ${badgePillClass}">${count}</span>
                                </h3>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400">${subtitle}</p>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 sm:p-5">
                        ${bodyHtml}
                    </div>
                </section>
            `;
        }

        const sections = [
            renderStageSection({
                id: 'stage-client-production',
                title: 'In Production & Active Jobs',
                subtitle: 'Designs currently in digitizing, stitch optimization, or QA review',
                icon: 'precision_manufacturing',
                iconColorClass: 'text-blue-600 dark:text-blue-400',
                badgePillClass: 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
                count: productionOrders.length,
                list: productionOrders,
                emptyText: 'No active production orders right now.',
                actionHtml: '<button onclick="window.clientWorkspace.openNewOrderModal()" class="px-3.5 py-1.5 bg-primary text-background-dark font-bold text-xs rounded-xl shadow-xs cursor-pointer">Place New Order</button>',
                filterKey: 'in_progress'
            }),
            renderStageSection({
                id: 'stage-client-quotes',
                title: 'Quotes & Estimates',
                subtitle: 'Dedicated custom appraisals and stitch estimations pending review',
                icon: 'request_quote',
                iconColorClass: 'text-sky-600 dark:text-sky-400',
                badgePillClass: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
                count: quotesOrders.length,
                list: quotesOrders,
                emptyText: 'No open custom quotes requested yet.',
                actionHtml: '<button onclick="window.clientWorkspace.openNewQuoteModal()" class="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">Request Free Quote</button>',
                filterKey: 'quotes'
            }),
            renderStageSection({
                id: 'stage-client-revisions',
                title: 'Revisions In Progress',
                subtitle: 'Modifications, stitch density adjustments, or size recalculations requested',
                icon: 'history_edu',
                iconColorClass: 'text-purple-600 dark:text-purple-400',
                badgePillClass: 'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
                count: revisionOrders.length,
                list: revisionOrders,
                emptyText: 'No orders undergoing revisions. All projects are running smoothly!',
                actionHtml: '',
                filterKey: 'revision_requested'
            }),
            renderStageSection({
                id: 'stage-client-due',
                title: 'Payment Due',
                subtitle: 'Orders requiring payment settlement to release final machine stitch files',
                icon: 'pending_actions',
                iconColorClass: 'text-rose-600 dark:text-rose-400',
                badgePillClass: 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
                count: dueOrders.length,
                list: dueOrders,
                emptyText: 'All settled! No pending invoices or payments due.',
                actionHtml: '',
                filterKey: 'unpaid'
            }),
            renderStageSection({
                id: 'stage-client-completed',
                title: 'Delivered & Download Ready',
                subtitle: 'Finished machine stitch files (DST, PES, EMB) and vector redraws ready for production',
                icon: 'verified',
                iconColorClass: 'text-emerald-600 dark:text-emerald-400',
                badgePillClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
                count: completedOrders.length,
                list: completedOrders,
                emptyText: 'No completed orders yet. Ready deliverables will appear here for download.',
                actionHtml: '',
                filterKey: 'completed'
            })
        ];

        container.innerHTML = `
            <div class="stage-sections-flow">
                ${sections.join('')}
            </div>
        `;

        updateLayoutToggleButtons();
    }

    function getFileExtension(filename) {
        if (!filename) return 'ART';
        const clean = filename.split('?')[0].split('#')[0];
        const parts = clean.split('.');
        if (parts.length < 2) return 'ART';
        return parts.pop().toUpperCase();
    }

    function setLayout(mode) {
        state.layout = mode;
        try {
            localStorage.setItem('dezan_client_layout', mode);
        } catch (e) {}
        updateLayoutToggleButtons();
        renderActivePage();
    }

    function updateLayoutToggleButtons() {
        const gridBtn = document.getElementById('client-layout-toggle-grid');
        const tableBtn = document.getElementById('client-layout-toggle-table');
        if (!gridBtn || !tableBtn) return;
        if (state.layout === 'table') {
            tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            tableBtn.setAttribute('aria-pressed', 'true');
            gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            gridBtn.setAttribute('aria-pressed', 'false');
        } else {
            gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            gridBtn.setAttribute('aria-pressed', 'true');
            tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            tableBtn.setAttribute('aria-pressed', 'false');
        }
    }

    // Global card expansion helper for client workspace
    if (!window.toggleOrderCardExpand) {
        window.toggleOrderCardExpand = function(orderNumber, btn) {
            const card = document.getElementById(`client-card-${orderNumber}`)
                || document.getElementById(`digitizer-card-${orderNumber}`)
                || document.getElementById(`admin-card-${orderNumber}`)
                || (btn ? btn.closest('.digitizer-bento-card, .client-order-card, .admin-order-card') : null);
            const tray = document.getElementById(`tray-${orderNumber}`) || (card ? card.querySelector('.card-extended-tray') : null);
            if (!tray) return;

            const isHidden = tray.classList.contains('hidden');
            if (isHidden) {
                tray.classList.remove('hidden');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'true');
                    const textEl = btn.querySelector('.btn-text') || btn.querySelector('span:not(.material-symbols-outlined)');
                    const iconEl = btn.querySelector('.material-symbols-outlined');
                    if (textEl) textEl.textContent = 'Less';
                    if (iconEl) iconEl.textContent = 'expand_less';
                }
            } else {
                tray.classList.add('hidden');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'false');
                    const textEl = btn.querySelector('.btn-text') || btn.querySelector('span:not(.material-symbols-outlined)');
                    const iconEl = btn.querySelector('.material-symbols-outlined');
                    if (textEl) textEl.textContent = 'Details';
                    if (iconEl) iconEl.textContent = 'expand_more';
                }
            }
        };
    }

    /**
     * Compact Bento Card Component for Client Workspace (~220px Matching Digitizer & Admin)
     */
    function renderClientOrderCard(order, isCompleted) {
        const isQuote = isQuoteRecord(order);
        const isPaid = (order.payment_status === 'paid');
        const isRevision = order.status === 'revision_requested';
        const isRush = order.turnaround_speed === 'rush' || order.isRush || order.priority === 'rush';
        const safeOrderNumber = String(order.order_number || (isQuote ? 'QUO-REQ' : 'DZ-ORD')).replace(/-/g, '&#8209;');
        const orderDt = formatOrderDateTime(order.created_at);
        const price = (order.price !== undefined ? order.price : (order.amount !== undefined ? order.amount : (isQuote ? 0 : 15)));
        const priceFormatted = `$${parseFloat(price).toFixed(2)}`;

        // Card styling classes matching stage color themes (distinct 2px border)
        let cardThemeClass = 'border-2 border-amber-500/85 dark:border-primary/85 shadow-xs ring-1 ring-amber-500/20 hover:border-amber-600 dark:hover:border-primary';
        let orderIdClass = 'bg-amber-100 dark:bg-primary/15 text-amber-900 dark:text-primary border-amber-300 dark:border-primary/30';

        if (isCompleted) {
            cardThemeClass = 'border-2 border-emerald-500/85 dark:border-emerald-400/80 shadow-xs ring-1 ring-emerald-500/20 hover:border-emerald-600';
            orderIdClass = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
        } else if (isRevision) {
            cardThemeClass = 'border-2 border-purple-500/85 dark:border-purple-400/80 shadow-xs ring-1 ring-purple-500/20 hover:border-purple-600';
            orderIdClass = 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700/50';
        } else if (isQuote) {
            cardThemeClass = 'border-2 border-sky-500/85 dark:border-sky-400/80 shadow-xs ring-1 ring-sky-500/20 hover:border-sky-600';
            orderIdClass = 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-sky-700/40';
        } else if (!isPaid) {
            cardThemeClass = 'border-2 border-rose-500/85 dark:border-rose-400/80 shadow-xs ring-1 ring-rose-500/20 hover:border-rose-600';
            orderIdClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-700/40';
        } else if (order.status === 'in_progress' || order.status === 'assigned') {
            cardThemeClass = 'border-2 border-blue-500/85 dark:border-blue-400/80 shadow-xs ring-1 ring-blue-500/20 hover:border-blue-600';
            orderIdClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700/40';
        }

        // Badges
        const rushBadge = isRush
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0 whitespace-nowrap shadow-2xs"><span class="material-symbols-outlined text-xs text-rose-600 dark:text-rose-400">bolt</span> ⚡ RUSH · 5–8h</span>`
            : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap"><span class="material-symbols-outlined text-[11px] text-slate-500">schedule</span> Standard · 12–24h</span>`;

        let statusBadge = '';
        if (isCompleted) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">check_circle</span> Completed</span>';
        } else if (isRevision) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50 text-[11px] font-bold whitespace-nowrap animate-pulse"><span class="material-symbols-outlined text-xs">warning</span> Revision</span>';
        } else if (isQuote) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-700/40 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">request_quote</span> Free Quote</span>';
        } else if (!isPaid) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">pending_actions</span> Payment Due</span>';
        } else if (order.status === 'in_progress' || order.status === 'assigned') {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-primary/15 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/30 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> New Order</span>';
        }

        const paymentBadge = isQuote
            ? '<span class="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 text-[10px] font-bold">Free Quote</span>'
            : (isPaid
                ? '<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] font-bold">Paid</span>'
                : '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 text-[10px] font-black flex items-center gap-0.5"><span class="material-symbols-outlined text-[11px]">pending</span> Due</span>');

        // Artwork
        const artUrl = order.artwork_url || order.deliverable_url || '#';
        const artName = order.artwork_name || (order.artwork_url ? order.artwork_url.split('/').pop().split('?')[0] : 'Artwork.png');
        const artExt = (artName.split('.').pop() || 'ART').toUpperCase();
        const clientNotes = (order.special_instructions || order.instructions || order.notes || '').replace(/Standard commercial digitizing standards apply.*$/i, '').trim();
        const deliverables = order.deliverables || [];
        const hasDeliverables = Array.isArray(deliverables) && deliverables.length > 0;

        return `
            <div id="client-card-${order.order_number}" class="client-order-card digitizer-bento-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark ${cardThemeClass} shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <!-- Collapsed Resting Card (~220px) -->
                <div>
                    <!-- Header Bar: ID, Date & Time, Status & Badges -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <span class="px-2.5 py-1 rounded-lg border font-mono text-xs font-black ${orderIdClass} tracking-wide whitespace-nowrap select-all inline-block">#${safeOrderNumber}</span>
                            <div class="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight flex items-center gap-1">
                                <span class="material-symbols-outlined text-[11px] text-slate-400 dark:text-slate-500">schedule</span>
                                <span>${orderDt.date}</span>
                                <span class="text-slate-300 dark:text-slate-600">·</span>
                                <span class="font-bold text-slate-700 dark:text-slate-300">${orderDt.time}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            ${statusBadge}
                            ${isRush ? rushBadge : paymentBadge}
                        </div>
                    </div>

                    <!-- Project Information -->
                    <div class="mb-2">
                        <h4 class="font-black text-slate-900 dark:text-white text-sm group-hover:text-amber-800 dark:group-hover:text-primary transition-colors leading-snug truncate" title="${order.design_name || order.project_name || 'Custom Design'}">${order.design_name || order.project_name || 'Custom Design'}</h4>
                        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span class="font-bold text-slate-700 dark:text-slate-300">${order.service_type || (isQuote ? 'Custom Quote' : 'Digitizing')}</span>
                            <span>·</span>
                            <span class="font-semibold text-slate-800 dark:text-slate-200">${order.placement || 'Left Chest'}</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">${order.sizing || '3.5" W'}</span>
                            ${order.format || order.file_format ? `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black bg-amber-500/20 text-amber-900 dark:text-primary border border-amber-500/30 uppercase">.${order.format || order.file_format}</span>` : '<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black bg-amber-500/20 text-amber-900 dark:text-primary border border-amber-500/30">.DST</span>'}
                        </div>
                    </div>

                    <!-- Compact Due / Turnaround Alert Strip -->
                    <div class="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-primary/15 text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">timer</span>
                            <span>${isRush ? '⚡ 5–8 Hours' : '12–24 Hours'}</span>
                        </span>
                        <span class="text-slate-500 dark:text-slate-400 truncate max-w-[130px] font-medium">Fabric: ${order.fabric_type || order.fabricType || 'Pique Polo'}</span>
                    </div>
                </div>

                <!-- Actions Toolbar (Always Visible on Compact Card) -->
                <div class="pt-2.5 border-t border-slate-100 dark:border-primary/10 flex items-center justify-between gap-2 mt-2">
                    <button type="button" onclick="window.clientWorkspace.openOrderDetailsModal('${order.order_number}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors" title="Open dedicated order detail screen">
                        <span>View Order</span>
                        <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">arrow_forward</span>
                    </button>
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-black text-slate-900 dark:text-white mr-1">${priceFormatted}</span>
                        ${isQuote ? `
                            <button type="button" onclick="window.clientWorkspace.openNewOrderModal('${order.design_name || ''}')" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer">
                                <span>Convert</span>
                            </button>
                        ` : !isPaid ? `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${order.id || order.order_number}')" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer" title="Complete order and settle balance">
                                <span class="material-symbols-outlined text-xs">credit_card</span>
                                <span>Pay</span>
                            </button>
                        ` : isCompleted ? `
                            <a href="${order.deliverable_url || order.artwork_url || '#'}" download class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer" title="Download completed embroidery files">
                                <span class="material-symbols-outlined text-xs">download</span>
                                <span>Files</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Compact 7-Column Table Row Component for Client Orders List View
     */
    function renderClientOrderTableRow(order, isCompleted) {
        const isQuote = isQuoteRecord(order);
        const isPaid = (order.payment_status === 'paid');
        const isRevision = order.status === 'revision_requested';
        const isRush = order.turnaround_speed === 'rush' || order.isRush || order.priority === 'rush';
        const safeOrderNumber = String(order.order_number || (isQuote ? 'QUO-REQ' : 'DZ-ORD')).replace(/-/g, '&#8209;');
        const orderDt = formatOrderDateTime(order.created_at);
        const price = (order.price !== undefined ? order.price : (order.amount !== undefined ? order.amount : (isQuote ? 0 : 15)));
        const priceFormatted = `$${parseFloat(price).toFixed(2)}`;

        let rowBorderClass = 'border-l-4 border-l-amber-500 bg-amber-500/[0.02] hover:bg-amber-500/[0.06]';
        let orderIdClass = 'text-amber-900 dark:text-primary';
        if (isCompleted) {
            rowBorderClass = 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]';
            orderIdClass = 'text-emerald-800 dark:text-emerald-400';
        } else if (isRevision) {
            rowBorderClass = 'border-l-4 border-l-purple-500 bg-purple-500/[0.02] hover:bg-purple-500/[0.06]';
            orderIdClass = 'text-purple-900 dark:text-purple-300';
        } else if (isQuote) {
            rowBorderClass = 'border-l-4 border-l-sky-500 bg-sky-500/[0.02] hover:bg-sky-500/[0.06]';
            orderIdClass = 'text-sky-900 dark:text-sky-300';
        } else if (!isPaid) {
            rowBorderClass = 'border-l-4 border-l-rose-500 bg-rose-500/[0.02] hover:bg-rose-500/[0.06]';
            orderIdClass = 'text-rose-900 dark:text-rose-300';
        } else if (order.status === 'in_progress' || order.status === 'assigned') {
            rowBorderClass = 'border-l-4 border-l-blue-500 bg-blue-500/[0.02] hover:bg-blue-500/[0.06]';
            orderIdClass = 'text-blue-900 dark:text-blue-300';
        }

        let statusBadge = '';
        if (isCompleted) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">check_circle</span> Completed</span>';
        } else if (isRevision) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">warning</span> Revision</span>';
        } else if (isQuote) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-700/40 text-[11px] font-bold whitespace-nowrap">Free Quote</span>';
        } else if (!isPaid) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold whitespace-nowrap">Payment Due</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 text-[11px] font-bold whitespace-nowrap">In Production</span>';
        }

        const paymentBadge = isQuote
            ? '<span class="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30 text-[10px] font-bold">Quote</span>'
            : (isPaid
                ? '<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] font-bold">Paid</span>'
                : '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 text-[10px] font-black">Due</span>');

        return `
            <tr class="transition-colors ${rowBorderClass}">
                <!-- 1. Order #, Date & Time -->
                <td class="px-4 py-3.5 whitespace-nowrap font-mono font-bold w-[145px] min-w-[145px]">
                    <span class="inline-block whitespace-nowrap select-all font-mono font-black ${orderIdClass}">#${safeOrderNumber}</span>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium mt-0.5 leading-tight flex items-center gap-1">
                        <span>${orderDt.date}</span>
                        <span class="text-slate-300 dark:text-slate-600">·</span>
                        <span class="font-bold text-slate-700 dark:text-slate-300">${orderDt.time}</span>
                    </div>
                </td>

                <!-- 2. Design & Service -->
                <td class="px-4 py-3.5 min-w-[200px]">
                    <div class="font-black text-slate-900 dark:text-white text-xs leading-snug truncate max-w-[240px]" title="${order.design_name || order.project_name || 'Custom Design'}">${order.design_name || order.project_name || 'Custom Design'}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <span class="font-semibold text-slate-700 dark:text-slate-300">${order.service_type || (isQuote ? 'Custom Quote' : 'Digitizing')}</span>
                        <span>·</span>
                        <span class="font-mono">${order.plan || order.plan_name || 'Standard'}</span>
                    </div>
                </td>

                <!-- 3. Specs & Fabric -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[140px]">
                    <div class="font-bold text-slate-800 dark:text-slate-200 text-xs">${order.placement || 'Left Chest'}</div>
                    <div class="text-[10px] text-slate-500 truncate max-w-[130px]">${order.fabric_type || order.fabricType || 'Pique Polo'}</div>
                </td>

                <!-- 4. Format -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[110px]">
                    <span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black bg-amber-500/20 text-amber-900 dark:text-primary border border-amber-500/30 uppercase">.${order.format || order.file_format || 'DST'}</span>
                </td>

                <!-- 5. Price & Payment -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[110px]">
                    <span class="font-black text-slate-900 dark:text-slate-100 text-xs block leading-tight">${priceFormatted}</span>
                    <div class="mt-1">${paymentBadge}</div>
                </td>

                <!-- 6. Status -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[125px]">
                    ${statusBadge}
                </td>

                <!-- 7. Actions -->
                <td class="px-4 py-3.5 w-[260px] min-w-[260px] text-right whitespace-nowrap">
                    <div class="inline-flex items-center justify-end gap-1.5 flex-nowrap shrink-0">
                        <button type="button" onclick="window.clientWorkspace.openOrderDetailsModal('${order.order_number}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors" title="View technical specs">
                            <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">description</span>
                            <span>Details</span>
                        </button>
                        ${isQuote ? `
                            <button type="button" onclick="window.clientWorkspace.openNewOrderModal('${order.design_name || ''}')" class="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-slate-950 font-black text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer">
                                <span>Convert</span>
                            </button>
                        ` : !isPaid ? `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${order.id || order.order_number}')" class="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-slate-950 font-black text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer">
                                <span class="material-symbols-outlined text-xs">credit_card</span>
                                <span>Pay</span>
                            </button>
                        ` : isCompleted ? `
                            <a href="${order.deliverable_url || order.artwork_url || '#'}" download class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer">
                                <span class="material-symbols-outlined text-xs">download</span>
                                <span>Files</span>
                            </a>
                            <button type="button" onclick="window.clientWorkspace.openRevisionModal('${order.order_number}')" class="px-2 py-1.5 rounded-lg border border-purple-300 dark:border-purple-600/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-[11px] font-bold cursor-pointer" title="Request revision">
                                <span class="material-symbols-outlined text-xs">history_edu</span>
                            </button>
                        ` : `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${order.id || order.order_number}')" class="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-primary/20 text-slate-600 dark:text-slate-300 hover:text-primary text-[11px] font-bold cursor-pointer" title="Invoice">
                                <span class="material-symbols-outlined text-xs">receipt</span>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }

    // ===================================================================
    //  PAGE 3: CUSTOM QUOTES VIEW (client-quotes.html)
    // ===================================================================
    function renderQuotesView() {
        const container = document.getElementById('quotes-list-container');
        if (!container) return;

        let quotes = (state.orders || []).filter(o => isQuoteRecord(o));

        // Update pill counts
        const totalCount = quotes.length;
        const pendingCount = quotes.filter(q => q.status === 'quote_pending' || !q.price || q.price == 0).length;
        const readyCount = quotes.filter(q => q.status === 'quote_ready' || (q.price && q.price > 0)).length;

        setElText('client-quote-pill-count-all', totalCount);
        setElText('client-quote-pill-count-pending', pendingCount);
        setElText('client-quote-pill-count-ready', readyCount);

        // Search query filter
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            quotes = quotes.filter(o =>
                (o.design_name || '').toLowerCase().includes(q) ||
                (o.project_name || '').toLowerCase().includes(q) ||
                (o.order_number || '').toLowerCase().includes(q) ||
                (o.target_fabric || o.fabric_type || '').toLowerCase().includes(q) ||
                (o.service_type || '').toLowerCase().includes(q)
            );
        }

        // Active tab filter
        const activeFilter = state.activeFilter || 'all';
        if (activeFilter === 'pending') {
            quotes = quotes.filter(q => q.status === 'quote_pending' || !q.price || q.price == 0);
        } else if (activeFilter === 'ready') {
            quotes = quotes.filter(q => q.status === 'quote_ready' || (q.price && q.price > 0));
        }

        if (quotes.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20 shadow-xs">
                    <span class="material-symbols-outlined text-4xl text-sky-500 mb-2">request_quote</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">${state.searchQuery ? 'No matching custom quotes found' : 'No custom quotes in this category'}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">${state.searchQuery ? 'Try adjusting your search terms or clearing your search filter.' : 'Have a jacket back or complex artwork? Request a free 12–24h estimation.'}</p>
                    <div class="flex items-center justify-center gap-2">
                        ${state.searchQuery ? `<button onclick="window.clientWorkspace.resetFilter()" class="px-3.5 py-1.5 rounded-xl border border-primary/30 text-primary-dark dark:text-primary font-bold text-xs hover:bg-primary/10 cursor-pointer">Clear Search</button>` : ''}
                        <button onclick="window.clientWorkspace.openNewQuoteModal()" class="px-4 py-2 rounded-xl bg-primary text-background-dark font-black text-xs shadow-xs hover:brightness-110 cursor-pointer">+ Request Free Quote</button>
                    </div>
                </div>
            `;
            updateLayoutToggleButtons();
            return;
        }

        if (state.layout === 'table') {
            container.innerHTML = `
                <div class="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-primary/20 shadow-2xs">
                    <table class="w-full text-left text-xs min-w-[980px]">
                        <thead class="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-primary/20 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th class="px-4 py-3 w-[145px]">Quote #, Date &amp; Time</th>
                                <th class="px-4 py-3 min-w-[200px]">Design &amp; Service</th>
                                <th class="px-4 py-3 w-[140px]">Specs &amp; Fabric</th>
                                <th class="px-4 py-3 w-[110px]">Format</th>
                                <th class="px-4 py-3 w-[110px]">Est. Price</th>
                                <th class="px-4 py-3 w-[125px]">Status</th>
                                <th class="px-4 py-3 w-[260px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-primary/10">
                            ${quotes.map(q => renderClientOrderTableRow(q, false)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    ${quotes.map(q => renderClientOrderCard(q, false)).join('')}
                </div>
            `;
        }

        updateLayoutToggleButtons();
    }

    // ===================================================================
    //  PAGE 4: INVOICES VIEW (client-invoices.html)
    // ===================================================================
    function renderClientInvoiceCard(inv) {
        const isPaid = (inv.payment_status === 'paid');
        const invDt = formatOrderDateTime(inv.created_at);
        const amount = parseFloat(inv.price !== undefined ? inv.price : (inv.amount || 15)).toFixed(2);
        const invNumber = String(inv.order_number || 'INV-8842').replace(/-/g, '&#8209;');

        const borderClass = isPaid
            ? 'border-2 border-emerald-500/85 dark:border-emerald-400/80 shadow-xs ring-1 ring-emerald-500/20 hover:border-emerald-600'
            : 'border-2 border-rose-500/85 dark:border-rose-400/80 shadow-xs ring-1 ring-rose-500/20 hover:border-rose-600';

        const badgeClass = isPaid
            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-700/40';

        const statusPill = isPaid
            ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">check_circle</span> Settled / Paid</span>'
            : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold whitespace-nowrap animate-pulse"><span class="material-symbols-outlined text-xs">pending_actions</span> Balance Due</span>';

        return `
            <div class="client-order-card digitizer-bento-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark ${borderClass} shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                    <!-- Header Bar -->
                    <div class="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                            <span class="px-2.5 py-1 rounded-lg border font-mono text-xs font-black ${badgeClass} tracking-wide whitespace-nowrap select-all inline-block">#INV-${invNumber}</span>
                            <div class="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight flex items-center gap-1">
                                <span class="material-symbols-outlined text-[11px] text-slate-400 dark:text-slate-500">schedule</span>
                                <span>${invDt.date}</span>
                                <span class="text-slate-300 dark:text-slate-600">·</span>
                                <span class="font-bold text-slate-700 dark:text-slate-300">${invDt.time}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1.5">
                            ${statusPill}
                            <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">${isPaid ? 'PayPal Protected' : 'Due Upon Delivery'}</span>
                        </div>
                    </div>

                    <!-- Project Info -->
                    <div class="mb-3">
                        <h4 class="font-black text-slate-900 dark:text-white text-sm group-hover:text-amber-800 dark:group-hover:text-primary transition-colors leading-snug truncate" title="${inv.design_name || 'Embroidery Deliverable'}">${inv.design_name || 'Embroidery Deliverable'}</h4>
                        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span class="font-bold text-slate-700 dark:text-slate-300">${inv.service_type || 'Digitizing'}</span>
                            <span>·</span>
                            <span class="font-mono text-[11px]">${inv.plan || inv.plan_name || 'Standard Flat Rate'}</span>
                        </div>
                    </div>

                    <!-- Amount Chip -->
                    <div class="flex items-center justify-between p-2.5 rounded-xl ${isPaid ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-500/20'} mb-3 text-xs">
                        <div>
                            <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Billed</span>
                            <strong class="text-base font-black ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">$${amount}</strong>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Terms</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200 text-xs">${isPaid ? 'Settled in Full' : 'Net Immediate'}</span>
                        </div>
                    </div>
                </div>

                <!-- Actions Toolbar -->
                <div class="pt-2.5 border-t border-slate-100 dark:border-primary/10 flex items-center justify-between gap-2 mt-2">
                    <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors" title="Open official invoice document">
                        <span>View Invoice</span>
                        <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">arrow_forward</span>
                    </button>
                    <div>
                        ${isPaid ? `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-black text-xs inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-500/30 cursor-pointer">
                                <span class="material-symbols-outlined text-xs">verified</span>
                                <span>Receipt</span>
                            </button>
                        ` : `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer">
                                <span class="material-symbols-outlined text-xs">credit_card</span>
                                <span>Pay $${amount}</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    function renderClientInvoiceTableRow(inv) {
        const isPaid = (inv.payment_status === 'paid');
        const invDt = formatOrderDateTime(inv.created_at);
        const amount = parseFloat(inv.price !== undefined ? inv.price : (inv.amount || 15)).toFixed(2);
        const invNumber = String(inv.order_number || 'INV-8842').replace(/-/g, '&#8209;');

        const borderLeft = isPaid
            ? 'border-l-4 border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20'
            : 'border-l-4 border-rose-500 hover:bg-rose-50/20 dark:hover:bg-rose-950/20';

        const statusBadge = isPaid
            ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">check_circle</span> Paid</span>'
            : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[10px] font-bold whitespace-nowrap animate-pulse"><span class="material-symbols-outlined text-xs">pending_actions</span> Due</span>';

        return `
            <tr class="${borderLeft} transition-colors">
                <td class="px-4 py-3">
                    <span class="font-mono text-xs font-black text-slate-900 dark:text-white">#INV-${invNumber}</span>
                    <div class="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <span>${invDt.date}</span>
                        <span class="text-slate-300 dark:text-slate-600">·</span>
                        <span class="font-bold text-slate-700 dark:text-slate-300">${invDt.time}</span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <h5 class="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[220px]" title="${inv.design_name || 'Embroidery Deliverable'}">${inv.design_name || 'Embroidery Deliverable'}</h5>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">${inv.service_type || 'Digitizing'}</span>
                </td>
                <td class="px-4 py-3 font-mono font-black text-xs ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
                    $${amount}
                </td>
                <td class="px-4 py-3">
                    ${statusBadge}
                </td>
                <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    <span class="font-semibold">${isPaid ? 'PayPal Protected' : 'Due Upon Delivery'}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">receipt_long</span>
                            <span>Invoice</span>
                        </button>
                        ${!isPaid ? `
                            <button type="button" onclick="window.clientWorkspace.openClientInvoiceModal('${inv.id || inv.order_number}')" class="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer">
                                <span>Pay</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    function renderInvoicesView() {
        const container = document.getElementById('invoices-list-container');
        if (!container) return;

        let invoices = (state.orders || []).filter(o => !isQuoteRecord(o));

        // Update pill counts
        const totalCount = invoices.length;
        const paidCount = invoices.filter(i => i.payment_status === 'paid').length;
        const unpaidCount = invoices.filter(i => i.payment_status !== 'paid').length;

        setElText('client-inv-pill-count-all', totalCount);
        setElText('client-inv-pill-count-paid', paidCount);
        setElText('client-inv-pill-count-due', unpaidCount);

        // Search query filter
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            invoices = invoices.filter(inv =>
                (inv.design_name || '').toLowerCase().includes(q) ||
                (inv.order_number || '').toLowerCase().includes(q) ||
                (inv.service_type || '').toLowerCase().includes(q) ||
                (inv.plan || '').toLowerCase().includes(q)
            );
        }

        // Active tab filter
        const activeFilter = state.activeFilter || 'all';
        if (activeFilter === 'paid') {
            invoices = invoices.filter(i => i.payment_status === 'paid');
        } else if (activeFilter === 'unpaid') {
            invoices = invoices.filter(i => i.payment_status !== 'paid');
        }

        if (invoices.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20 shadow-xs">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">payments</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">${state.searchQuery ? 'No matching invoices found' : 'No invoices on file in this category'}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">${state.searchQuery ? 'Try clearing your search query or adjusting your keyword.' : 'When production orders are confirmed, itemized invoices and PayPal receipts will appear here.'}</p>
                    <div class="flex items-center justify-center gap-2">
                        ${state.searchQuery ? `<button onclick="window.clientWorkspace.resetFilter()" class="px-3.5 py-1.5 rounded-xl border border-primary/30 text-primary-dark dark:text-primary font-bold text-xs hover:bg-primary/10 cursor-pointer">Clear Search</button>` : ''}
                        <button onclick="window.clientWorkspace.openNewOrderModal()" class="px-4 py-2 rounded-xl bg-primary text-background-dark font-black text-xs shadow-xs hover:brightness-110 cursor-pointer">+ Create New Order</button>
                    </div>
                </div>
            `;
            updateLayoutToggleButtons();
            return;
        }

        if (state.layout === 'table') {
            container.innerHTML = `
                <div class="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-primary/20 shadow-2xs">
                    <table class="w-full text-left text-xs min-w-[900px]">
                        <thead class="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-primary/20 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th class="px-4 py-3 w-[155px]">Invoice #, Date &amp; Time</th>
                                <th class="px-4 py-3 min-w-[200px]">Design &amp; Service</th>
                                <th class="px-4 py-3 w-[130px]">Amount</th>
                                <th class="px-4 py-3 w-[150px]">Payment Status</th>
                                <th class="px-4 py-3 w-[150px]">Method / Terms</th>
                                <th class="px-4 py-3 w-[200px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-primary/10">
                            ${invoices.map(inv => renderClientInvoiceTableRow(inv)).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    ${invoices.map(inv => renderClientInvoiceCard(inv)).join('')}
                </div>
            `;
        }

        updateLayoutToggleButtons();
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
        if (typeof window.openOrderQuoteModal === 'function') {
            return window.openOrderQuoteModal({ plan: defaultDesignName, isQuote: false });
        }
        const modal = document.getElementById('new-order-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (defaultDesignName) {
                const input = document.getElementById('dig-job-name') || document.getElementById('adaptive-job-name');
                if (input) input.value = defaultDesignName;
            }
        } else {
            let target = 'client-portal.html?action=new_order';
            if (defaultDesignName) target += '&plan=' + encodeURIComponent(defaultDesignName);
            window.location.href = target;
        }
    }

    function closeNewOrderModal() {
        if (typeof window.closeOrderQuoteModal === 'function') {
            window.closeOrderQuoteModal();
            return;
        }
        const modal = document.getElementById('new-order-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openNewQuoteModal() {
        if (typeof window.openOrderQuoteModal === 'function') {
            return window.openOrderQuoteModal({ isQuote: true });
        }
        const modal = document.getElementById('new-order-modal');
        if (modal) {
            openNewOrderModal();
            if (typeof window.setModalMode === 'function') {
                window.setModalMode(true);
            }
        } else {
            window.location.href = 'client-portal.html?action=request_quote';
        }
    }

    function previewArtworkModal(url, title) {
        let zoomModal = document.getElementById('client-artwork-zoom-modal');
        if (!zoomModal) {
            const zoomHtml = `
                <div id="client-artwork-zoom-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4" onclick="if(event.target === this) this.classList.add('hidden')">
                    <div class="relative max-w-3xl w-full bg-white dark:bg-card-dark rounded-2xl overflow-hidden shadow-2xl p-4">
                        <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-primary/20">
                            <h4 id="client-zoom-modal-title" class="font-bold text-sm text-slate-900 dark:text-white">Artwork Preview</h4>
                            <button onclick="document.getElementById('client-artwork-zoom-modal').classList.add('hidden')" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div class="flex items-center justify-center max-h-[70vh] overflow-hidden rounded-xl bg-slate-950/10">
                            <img id="client-zoom-modal-img" src="" alt="Zoom Preview" class="max-h-[70vh] w-auto object-contain">
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', zoomHtml);
            zoomModal = document.getElementById('client-artwork-zoom-modal');
        }
        const img = document.getElementById('client-zoom-modal-img');
        const titleEl = document.getElementById('client-zoom-modal-title');
        if (img) img.src = url;
        if (titleEl) titleEl.textContent = title || 'Artwork Preview';
        zoomModal.classList.remove('hidden');
    }

    function openOrderDetailsModal(orderNumber) {
        let order = state.orders?.find(o => o.order_number === orderNumber || o.id === orderNumber);
        if (!order && window.insforgeClient && typeof window.insforgeClient.getOrders === 'function') {
            order = window.insforgeClient.getOrders().find(o => o.order_number === orderNumber || o.id === orderNumber);
        }
        if (!order && state.orders && state.orders.length > 0) {
            order = state.orders[0];
        }
        if (!order) return;

        state.currentDrawerOrder = order;

        setElText('drawer-order-id', order.order_number || 'ORD-ACTIVE');
        setElText('drawer-design-name', order.design_name || order.project_name || order.placement || 'Custom Digitizing');
        setElText('drawer-service', order.service_type || 'Digitizing');
        setElText('drawer-plan', order.plan || order.plan_name || 'Standard');
        setElText('drawer-status', (order.status || 'in_progress').replace(/_/g, ' '));
        setElText('drawer-amount', `$${parseFloat(order.amount || order.price || 0).toFixed(2)}`);
        setElText('drawer-fabric', order.target_fabric || order.fabric_type || 'Standard Garment');
        setElText('drawer-dimensions', order.dimensions || order.sizing || 'Standard Size');

        // Deliverables Requirement / Format Box
        const formatStr = order.format || order.file_format || 'DST, EMB';
        setElText('drawer-format-req', `${formatStr.toUpperCase()} · JPG Preview · PDF Worksheet`);

        // Client Instructions (clean, zero boilerplate)
        const notes = (order.instructions || order.special_instructions || order.notes || '').replace(/Standard commercial digitizing standards apply.*$/i, '').trim();
        setElText('drawer-instructions', notes || 'No special instructions provided.');

        // Submitted Artwork List with Lightbox Preview and Download
        const artFiles = (Array.isArray(order.raw_artwork_files) && order.raw_artwork_files.length > 0)
            ? order.raw_artwork_files
            : (Array.isArray(order.rawArtworkFiles) && order.rawArtworkFiles.length > 0)
                ? order.rawArtworkFiles
                : (order.artwork_url ? [{ name: 'artwork.png', url: order.artwork_url }] : []);

        const artContainer = document.getElementById('drawer-artwork-container');
        if (artContainer) {
            if (artFiles.length > 0) {
                artContainer.innerHTML = artFiles.map((rf) => {
                    const ext = getFileExtension(rf.name || rf.url || 'ART') || 'ART';
                    const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(ext);
                    return `
                        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 text-xs">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-amber-500/15 text-amber-900 dark:text-primary border border-amber-500/30">${ext}</span>
                                <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title="${rf.name}">${rf.name}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                ${isImg ? `
                                    <button type="button" onclick="window.clientWorkspace.previewArtworkModal('${rf.url}', '${rf.name}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-900 dark:text-primary border border-slate-200 dark:border-primary/20 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors">
                                        <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">visibility</span>
                                        <span>Preview</span>
                                    </button>
                                ` : ''}
                                <a href="${rf.url}" download="${rf.name}" target="_blank" class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors">
                                    <span class="material-symbols-outlined text-xs">download</span>
                                    <span>Download</span>
                                </a>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                artContainer.innerHTML = '<p class="text-slate-400 italic text-[11px]">No artwork file attached.</p>';
            }
        }

        // Completed Deliverables List
        const deliverables = order.deliverables || (order.deliverable_url ? [{ name: `${order.order_number}.dst`, url: order.deliverable_url, format: 'DST' }] : []);
        const delivCont = document.getElementById('drawer-deliverables-container');
        const delivList = document.getElementById('drawer-deliverables-list');
        const isCompleted = order.status === 'completed' || order.status === 'delivered' || order.status === 'ready';
        if (delivCont && delivList) {
            if (isCompleted && deliverables.length > 0) {
                delivCont.classList.remove('hidden');
                delivList.innerHTML = deliverables.map(del => `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                        <div class="flex items-center gap-1.5 min-w-0">
                            <span class="material-symbols-outlined text-xs text-emerald-600">task_alt</span>
                            <span class="font-mono text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">${del.format || 'FILE'}</span>
                            <span class="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">${del.name}</span>
                        </div>
                        <a href="${del.url}" download="${del.name}" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-xs">download</span>
                            <span>Download</span>
                        </a>
                    </div>
                `).join('');
            } else {
                delivCont.classList.add('hidden');
            }
        }

        // Contextual Buttons: Pay Now & Revision
        const isPaid = (order.payment_status === 'paid');
        const isQuote = (order.is_quote || (order.order_number && order.order_number.startsWith('QUO-')) || order.status === 'quote_requested');
        const payBtn = document.getElementById('drawer-pay-btn');
        if (payBtn) {
            if (!isPaid && !isQuote) {
                payBtn.classList.remove('hidden');
                const amount = parseFloat(order.amount || order.price || 15).toFixed(2);
                setElText('drawer-pay-btn-text', `Pay Now ($${amount})`);
                payBtn.onclick = () => {
                    closeOrderDetailsModal();
                    openClientInvoiceModal(order.id || order.order_number);
                };
            } else {
                payBtn.classList.add('hidden');
            }
        }

        const revBtn = document.getElementById('drawer-request-revision-btn');
        if (revBtn) {
            if (isCompleted) {
                revBtn.classList.remove('hidden');
            } else {
                revBtn.classList.add('hidden');
            }
        }

        const invBtn = document.getElementById('drawer-invoice-btn');
        if (invBtn) {
            invBtn.onclick = () => {
                closeOrderDetailsModal();
                openClientInvoiceModal(order.id || order.order_number);
            };
        }

        const modal = document.getElementById('order-details-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function openRevisionFromDrawer() {
        if (!state.currentDrawerOrder) return;
        const orderNum = state.currentDrawerOrder.order_number;
        closeOrderDetailsModal();
        openRevisionModal(orderNum);
    }

    function closeOrderDetailsModal() {
        const modal = document.getElementById('order-details-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openClientInvoiceModal(orderId) {
        const order = state.orders.find(o => o.id === orderId || o.order_number === orderId) || state.orders[0];
        if (!order) return;

        const rawPrice = order.price !== undefined ? order.price : (order.amount !== undefined ? order.amount : 15);
        const amount = parseFloat(rawPrice || 15).toFixed(2);
        const isPaid = (order.payment_status === 'paid');

        setElText('invoice-number-disp', `INV-${order.order_number || ''}`);
        setElText('invoice-date-disp', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        setElText('invoice-order-ref', order.order_number || '—');
        setElText('invoice-client-name', order.client_name || state.client?.name || 'Customer');
        setElText('invoice-client-company', order.company || state.client?.company || '');
        setElText('invoice-item-desc', `${order.service_type || 'Digitizing'} — ${order.design_name || order.project_name || 'Embroidery Design'}`);
        setElText('invoice-item-rate', `$${amount}`);
        setElText('invoice-item-amount', `$${amount}`);
        setElText('invoice-total-disp', `$${amount}`);

        const paypalLink = document.getElementById('invoice-paypal-link');
        const paypalText = document.getElementById('invoice-paypal-btn-text');

        if (paypalLink) {
            if (isPaid) {
                paypalLink.href = 'javascript:void(0)';
                paypalLink.className = 'px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 cursor-default';
                if (paypalText) paypalText.textContent = 'Paid · Settled via PayPal';
            } else {
                paypalLink.href = `https://paypal.me/dezandigitizing/${amount}USD`;
                paypalLink.className = 'px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background-dark font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-[1.02]';
                if (paypalText) paypalText.textContent = `Settle $${amount} with PayPal`;
            }
        }

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
        clearRevisionPhoto();
        const notesInput = document.getElementById('revision-notes-input');
        if (notesInput) notesInput.value = '';
        const modal = document.getElementById('revision-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeRevisionModal() {
        const modal = document.getElementById('revision-modal');
        if (modal) modal.classList.add('hidden');
        clearRevisionPhoto();
    }

    function handleRevisionPhotoFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        state.stitchOutPhoto = file;
        const previewCard = document.getElementById('revision-photo-preview-card');
        const previewImg = document.getElementById('revision-photo-preview-img');
        const previewName = document.getElementById('revision-photo-preview-name');
        if (previewCard && previewImg && previewName) {
            previewName.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewCard.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    function handleRevisionPhotoSelected(event) {
        const file = event.target.files && event.target.files[0];
        if (file) handleRevisionPhotoFile(file);
    }

    function handleRevisionPhotoDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('border-primary', 'bg-amber-50/20');
        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) handleRevisionPhotoFile(file);
    }

    function clearRevisionPhoto() {
        state.stitchOutPhoto = null;
        const fileInput = document.getElementById('revision-photo-file');
        if (fileInput) fileInput.value = '';
        const previewCard = document.getElementById('revision-photo-preview-card');
        if (previewCard) previewCard.classList.add('hidden');
    }

    async function submitRevision() {
        const orderNumber = state.currentOrderId;
        const notesInput = document.getElementById('revision-notes-input');
        const notes = notesInput ? notesInput.value.trim() : '';

        if (!notes) {
            alert('Please provide specific feedback describing what needs to be revised.');
            return;
        }

        const submitBtn = document.getElementById('revision-modal-submit-btn');
        const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Submitting...';
            }

            let stitchOutPhotos = [];
            if (state.stitchOutPhoto) {
                if (window.insforgeClient && typeof window.insforgeClient.uploadFile === 'function') {
                    const uploaded = await window.insforgeClient.uploadFile('artworks', state.stitchOutPhoto);
                    stitchOutPhotos.push({
                        name: uploaded.name,
                        url: uploaded.url,
                        key: uploaded.key,
                        size: uploaded.size
                    });
                }
            }

            if (window.insforgeClient && typeof window.insforgeClient.submitOrderRevision === 'function') {
                await window.insforgeClient.submitOrderRevision(orderNumber, notes, stitchOutPhotos);
            }

            closeRevisionModal();
            clearRevisionPhoto();
            // Broadcast live notifications
            if (window.dezanNotificationEngine) {
                window.dezanNotificationEngine.broadcastToRole('admin', {
                    orderId: orderNumber,
                    type: 'revision_requested',
                    category: 'revisions',
                    title: 'Customer Requested Stitch Revision',
                    message: `Revision requested on #${orderNumber}: "${notes.substring(0, 80)}${notes.length > 80 ? '...' : ''}"`,
                    meta: 'Urgent Revision · Free Revision Guarantee',
                    actionLabel: 'Review Revision',
                    actionType: 'view_revision',
                    accent: 'purple',
                    icon: 'change_circle'
                });
                window.dezanNotificationEngine.broadcastToRole('digitizer', {
                    orderId: orderNumber,
                    type: 'revision_task',
                    category: 'revisions',
                    title: 'Stitch Revision Assigned',
                    message: `Customer feedback received for #${orderNumber}: "${notes.substring(0, 80)}${notes.length > 80 ? '...' : ''}"`,
                    meta: 'Urgent Revision · Quality Check',
                    actionLabel: 'Open Workbench',
                    actionType: 'open_task',
                    accent: 'purple',
                    icon: 'change_circle'
                });
                window.dezanNotificationEngine.addNotification({
                    orderId: orderNumber,
                    type: 'revision_progress',
                    category: 'production',
                    title: 'Revision Request Received & Queued',
                    message: `Your technical revision notes for #${orderNumber} have been sent to our master digitizer.`,
                    meta: 'Turnaround: 4-8 hours · Zero extra charge',
                    actionLabel: 'View Order',
                    actionType: 'view_order',
                    accent: 'purple',
                    icon: 'change_circle'
                });
            }

            if (notesInput) notesInput.value = '';
            await loadClientData();
            renderActivePage();

            if (window.insforgeClient && typeof window.insforgeClient.showToast === 'function') {
                window.insforgeClient.showToast(
                    'Revision Request Routed',
                    stitchOutPhotos.length > 0 
                        ? `Order #${orderNumber} has been returned to your digitizer with technical notes & reference photo.`
                        : `Order #${orderNumber} has been returned to your digitizer with technical notes.`,
                    'rate_review',
                    'success'
                );
            } else {
                alert('Revision request sent to digitizer studio. Estimated turnaround: 4-8 hours.');
            }
        } catch (err) {
            console.error('Failed to submit revision:', err);
            alert('Failed to submit revision: ' + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origBtnHtml;
            }
        }
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
        const pills = document.querySelectorAll('.client-dist-pill, .client-filter-pill, #order-filter-tabs button, #quote-filter-tabs button, #invoice-filter-tabs button');
        pills.forEach(p => {
            const pFilter = p.getAttribute('data-filter');
            if (pFilter === type) {
                p.classList.add('active');
                p.setAttribute('aria-pressed', 'true');
            } else {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            }
        });
        renderActivePage();
    }

    function resetFilter() {
        state.searchQuery = '';
        ['order-search-input', 'quote-search-input', 'invoice-search-input'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        setFilter('all');
    }

    function handleSearch(e) {
        state.searchQuery = (e && e.target ? e.target.value : (typeof e === 'string' ? e : '')).trim();
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
            if (params.has('order')) {
                const orderNum = params.get('order');
                setTimeout(() => openOrderDetailsModal(orderNum), 350);
            }
            if (params.has('revision')) {
                const orderNum = params.get('revision');
                setTimeout(() => openRevisionModal(orderNum), 350);
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

    async function removeOrder(orderId, orderNumber) {
        if (!confirm(`Are you sure you want to remove and cancel unpaid order #${orderNumber || orderId}? This will clear it from your orders and balance due.`)) {
            return;
        }

        try {
            state.orders = state.orders.filter(o => o.id !== orderId && o.order_number !== orderNumber);
            localStorage.setItem('dezan_orders', JSON.stringify(state.orders));

            if (window.insforgeClient && typeof window.insforgeClient.deleteOrder === 'function') {
                await window.insforgeClient.deleteOrder(orderId);
            }

            updateMetricsAcrossViews();
            renderActivePage();

            if (typeof window.showNotification === 'function') {
                window.showNotification(`Order #${orderNumber || orderId} was removed successfully.`, 'info');
            }
        } catch (err) {
            console.error('Error removing order:', err);
            alert('Could not remove order. Please try again.');
        }
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
        setLayout,
        handleSearch,
        openNewOrderModal,
        closeNewOrderModal,
        openNewQuoteModal,
        openOrderDetailsModal,
        closeOrderDetailsModal,
        previewArtworkModal,
        openRevisionFromDrawer,
        openClientInvoiceModal,
        closeClientInvoiceModal,
        removeOrder,
        openRevisionModal,
        closeRevisionModal,
        handleRevisionPhotoSelected,
        handleRevisionPhotoDrop,
        clearRevisionPhoto,
        submitRevision,
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
