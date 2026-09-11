        // Global taskNumber declaration to guarantee zero ReferenceErrors across all browser cache states
        var taskNumber = '';
        if (typeof window !== 'undefined') {
            window.taskNumber = '';
        }

        // Guard check: admin role only
        const currentUser = window.insforgeClient.requireAuth(['admin']);

        // Default to white/light theme; check if user explicitly chose dark
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        function updateThemeIcon() {
            const isDark = document.documentElement.classList.contains('dark');
            const icon = document.querySelector('.theme-toggle-icon');
            if (icon) {
                icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            }
        }
        updateThemeIcon();

        const themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                updateThemeIcon();
            });
        }

        // State Management
        let activeAdminFilter = 'all';
        let currentAdminView = 'orders';
        // DEFAULT LAYOUT TO BENTO CARDS GRID (Modern, clean, and spacious)
        let currentAdminLayout = localStorage.getItem('dezan_admin_layout') || 'grid';
        let currentModalClientEmail = null;
        let modalHistoryFilter = 'all';
        let currentCatalogCategory = 'all';

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        let isProgrammaticScrolling = false;

        /**
         * Update visual active highlights across sticky nav tabs, quick cards, and mobile dock
         */
        function updateActiveNavIndicators(viewKey) {
            currentAdminView = viewKey;
            document.querySelectorAll('[data-admin-link]').forEach(link => {
                if (link.dataset.adminLink === viewKey) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });

            // Highlight top sticky nav tabs
            document.querySelectorAll('.admin-nav-tab').forEach(tab => {
                const tabKey = tab.id.replace('nav-tab-', '');
                if (tabKey === viewKey || (viewKey === 'overview' && tabKey === 'orders')) {
                    tab.className = 'admin-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400/40';
                } else {
                    tab.className = 'admin-nav-tab px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400';
                }
            });

            // Highlight quick action cards
            document.querySelectorAll('.quick-action-card').forEach(card => {
                const cardKey = card.id.replace('quick-action-card-', '');
                if (cardKey === viewKey) {
                    card.classList.add('ring-2', 'ring-amber-500', 'border-amber-500');
                } else {
                    card.classList.remove('ring-2', 'ring-amber-500', 'border-amber-500');
                }
            });

            // Highlight mobile dock buttons
            const mobileDockMap = {
                'overview': 'mobile-dock-dashboard',
                'dashboard': 'mobile-dock-dashboard',
                'orders': 'mobile-dock-orders',
                'clients': 'mobile-dock-clients',
                'catalog': 'mobile-dock-catalog',
                'team': 'mobile-dock-team'
            };
            document.querySelectorAll('nav.fixed a').forEach(b => {
                b.classList.remove('text-amber-800', 'dark:text-primary');
                b.classList.add('text-slate-600', 'dark:text-slate-400');
            });
            const activeDockId = mobileDockMap[viewKey] || 'mobile-dock-orders';
            const activeDockBtn = document.getElementById(activeDockId);
            if (activeDockBtn) {
                activeDockBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
                activeDockBtn.classList.add('text-amber-800', 'dark:text-primary');
            }
        }

        const adminPages = { dashboard: 'admin-portal.html', orders: 'admin-orders.html', clients: 'admin-clients.html', catalog: 'admin-catalog.html', team: 'admin-team.html' };
        const adminPage = document.body.dataset.adminPage || 'orders';

        function switchAdminView(viewKey) {
            const key = viewKey === 'overview' ? 'dashboard' : viewKey;
            if (adminPages[key]) {
                if (key === adminPage) scrollToTop();
                else window.location.href = adminPages[key];
            } else if (adminPage !== 'orders') {
                window.location.href = adminPages.orders + '?stage=' + encodeURIComponent(viewKey);
            } else {
                setFilter(viewKey);
            }
        }

        let currentStageScope = 'all';

        /**
         * Smoothly jump directly to one of the 4 operational stage subsections
         */
        function jumpToStage(stageSubId) {
            setStageScope('all');

            setTimeout(() => {
                const el = document.getElementById(stageSubId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight pulse
                    el.classList.add('ring-2', 'ring-amber-500/80');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-amber-500/80');
                    }, 1400);
                }
            }, 60);
        }

        /**
         * Filter / isolate a specific stage or view all continuous stages
         */
        function setStageScope(scopeKey) {
            currentStageScope = scopeKey;
            window.currentStageScope = scopeKey;

            // Target all stage sub-sections dynamically so none can ever escape
            const sections = document.querySelectorAll('.stage-sub-section');
            if (sections && sections.length > 0) {
                sections.forEach(el => {
                    if (scopeKey === 'all' || el.id === scopeKey) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                });
            } else {
                const stageIds = ['stage-new-sub', 'stage-revisions-sub', 'stage-incomplete-sub', 'stage-in-progress-sub', 'stage-completed-sub'];
                stageIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (scopeKey === 'all' || scopeKey === id) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                });
            }

            document.querySelectorAll('.stage-jump-pill').forEach(btn => {
                const target = btn.dataset.stageTarget;
                const isSelected = (scopeKey === 'all' && target === 'all') || (target === scopeKey);
                btn.setAttribute('aria-pressed', String(isSelected));
            });
            renderAdminOrders();

            // If scrolled far down below orders, bring top of orders section into view
            const ordersSection = document.getElementById('master-orders-section');
            if (ordersSection && window.scrollY > ordersSection.offsetTop + 150) {
                ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        window.setStageScope = setStageScope;

        function setFilter(filterName) {
            if (adminPage !== 'orders') { window.location.href = adminPages.orders + '?stage=' + encodeURIComponent(filterName); return; }
            activeAdminFilter = filterName;
            const select = document.getElementById('filter-status');
            if (select) select.value = filterName;

            if (filterName === 'pending_review') {
                setStageScope('stage-new-sub');
            } else if (filterName === 'revision_requested') {
                setStageScope('stage-revisions-sub');
            } else if (filterName === 'in_progress') {
                setStageScope('stage-in-progress-sub');
            } else if (filterName === 'unpaid' || filterName === 'quote') {
                setStageScope('stage-incomplete-sub');
            } else if (filterName === 'completed') {
                setStageScope('stage-completed-sub');
            } else {
                setStageScope('all');
            }
        }

        function setFilterAndScroll(filterName) {
            if (adminPage !== 'orders') { switchAdminView(filterName); return; }
            switchAdminView('orders');
            setFilter(filterName);
        }

        function filterByUnpaid() {
            if (adminPage !== 'orders') { switchAdminView('unpaid'); return; }
            switchAdminView('orders');
            jumpToStage('stage-incomplete-sub');
        }

        function setAdminLayout(mode) {
            currentAdminLayout = mode;
            ['grid', 'table'].forEach(key => document.getElementById('layout-toggle-' + key)?.setAttribute('aria-pressed', String(key === mode)));
            localStorage.setItem('dezan_admin_layout', mode);

            const tableBtn = document.getElementById('layout-toggle-table');
            const gridBtn = document.getElementById('layout-toggle-grid');
            const cardContainers = document.querySelectorAll('.stage-cards-container');
            const tableContainers = document.querySelectorAll('.stage-table-container');

            if (mode === 'grid') {
                tableContainers.forEach(el => el.classList.add('hidden'));
                cardContainers.forEach(el => el.classList.remove('hidden'));
                if (gridBtn) {
                    gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer';
                }
                if (tableBtn) {
                    tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer';
                }
            } else {
                tableContainers.forEach(el => el.classList.remove('hidden'));
                cardContainers.forEach(el => el.classList.add('hidden'));
                if (tableBtn) {
                    tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer';
                }
                if (gridBtn) {
                    gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer';
                }
            }

            renderAdminOrders();
        }

        function focusAdminSearch() {
            if (adminPage !== 'orders') {
                window.location.href = adminPages.orders + '?focus=search';
                return;
            }
            switchAdminView('orders');
            const input = document.getElementById('admin-search-input');
            if (input) {
                input.focus();
                input.select();
            }
        }

        function handleSearchInput() {
            const input = document.getElementById('admin-search-input');
            const clearBtn = document.getElementById('admin-search-clear-btn');
            if (clearBtn) {
                if (input && input.value.trim().length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            renderAdminOrders();
        }

        function clearAdminSearch() {
            const input = document.getElementById('admin-search-input');
            const clearBtn = document.getElementById('admin-search-clear-btn');
            if (input) {
                input.value = '';
                input.focus();
            }
            if (clearBtn) clearBtn.classList.add('hidden');
            renderAdminOrders();
        }

        function filterByDigitizer(workerId, workerName) {
            if (adminPage !== 'orders') {
                window.location.href = adminPages.orders + '?q=' + encodeURIComponent(workerName);
                return;
            }
            setStageScope('all');
            switchAdminView('orders');
            const input = document.getElementById('admin-search-input');
            if (input) {
                input.value = workerName;
                handleSearchInput();
            }
            scrollToSection('master-orders-section');
        }

        function filterOrdersByClient(clientName) {
            if (adminPage !== 'orders') {
                window.location.href = adminPages.orders + '?q=' + encodeURIComponent(clientName);
                return;
            }
            setStageScope('all');
            switchAdminView('orders');
            const input = document.getElementById('admin-search-input');
            if (input) {
                input.value = clientName;
                handleSearchInput();
            }
            scrollToSection('master-orders-section');
        }

        function isolateCurrentClientInQueue() {
            closeClientHistoryModal();
            const nameEl = document.getElementById('modal-client-name');
            if (nameEl) {
                filterOrdersByClient(nameEl.textContent);
            }
        }

        // Global Keyboard Shortcut: '/' or Cmd/Ctrl+K to focus search; Escape to clear/close
        window.addEventListener('keydown', (e) => {
            if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
                document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                focusAdminSearch();
            }
            if (e.key === 'Escape') {
                closeAssignModal();
                closePaymentReminderModal();
                closeInvoiceModal();
                closeAdminRevisionModal();
                closeAdminAccountModal();
                closeClientHistoryModal();
                if (document.activeElement.id === 'admin-search-input') {
                    clearAdminSearch();
                    document.activeElement.blur();
                }
            }
        });

        // Initialize & Realtime Subscriptions
        document.addEventListener('DOMContentLoaded', async () => {
            setAdminLayout(currentAdminLayout);
            await renderAllAdminData();
            updateActiveNavIndicators(adminPage);
            updateAdminAutoAssignUI();
            if (adminPage === 'orders') {
                const params = new URLSearchParams(window.location.search);
                if (params.has('q') || params.has('search')) {
                    const searchVal = params.get('q') || params.get('search');
                    const searchInput = document.getElementById('admin-search-input');
                    if (searchInput) {
                        searchInput.value = searchVal;
                        handleSearchInput();
                    }
                }
                if (params.has('stage')) {
                    const stage = params.get('stage');
                    if (['new','revisions','in-progress','incomplete','completed','unassigned'].some(key => stage === 'stage-' + key + '-sub')) setStageScope(stage);
                    else setFilter(stage);
                }
                if (params.get('focus') === 'search') focusAdminSearch();

                // Direct modal deep-linking from notifications
                if (params.has('assign')) {
                    const orderNum = params.get('assign');
                    setTimeout(() => { if (typeof openAssignModal === 'function') openAssignModal(orderNum); }, 350);
                }
                if (params.has('quote')) {
                    const orderNum = params.get('quote');
                    setTimeout(() => { if (typeof openSetQuotePriceModal === 'function') openSetQuotePriceModal(orderNum); }, 350);
                }
                if (params.has('revision')) {
                    const orderNum = params.get('revision');
                    setTimeout(() => { if (typeof openAdminRevisionModal === 'function') openAdminRevisionModal(orderNum); }, 350);
                }
                if (params.has('invoice')) {
                    const orderNum = params.get('invoice');
                    setTimeout(() => { if (typeof openInvoiceModal === 'function') openInvoiceModal(orderNum); }, 350);
                }
                if (params.has('order')) {
                    const orderNum = params.get('order');
                    setTimeout(() => { if (typeof openAdminOrderDetailsModal === 'function') openAdminOrderDetailsModal(orderNum); }, 350);
                }
            }

            // Register Realtime Listener for Instant Admin Updates
            window.insforgeClient.onRealtimeEvent(async ({ type, payload, isLocal }) => {
                if (isLocal) return;
                console.log('Admin Portal received realtime event:', type, payload);

                if (type === 'order_created') {
                    const isQuote = payload.isQuote || (payload.orderNumber && payload.orderNumber.startsWith('QUO-'));
                    window.insforgeClient.showToast(
                        isQuote ? 'New Quote Requested' : 'New Order Submitted',
                        isQuote
                            ? `${payload.clientName || 'Customer'} requested a quote: ${payload.orderNumber}. Ready for price estimation.`
                            : `${payload.clientName || 'Customer'} placed ${payload.orderNumber} ($${(payload.price || 0).toFixed(2)}).`,
                        isQuote ? 'request_quote' : 'inventory_2',
                        'info'
                    );
                    await renderAllAdminData();
                } else if (type === 'order_completed') {
                    window.insforgeClient.showToast(
                        'Deliverables Ready',
                        `Stitch files for ${payload.orderNumber} were uploaded by digitizer.`,
                        'task_alt',
                        'success'
                    );
                    await renderAllAdminData();
                } else if (type === 'order_paid') {
                    window.insforgeClient.showToast(
                        'Invoice Settled Live',
                        `Order ${payload.orderNumber} ($${(payload.price || 0).toFixed(2)}) was settled via ${payload.paymentMethod}.`,
                        'payments',
                        'success'
                    );
                    await renderAllAdminData();
                } else if (type === 'order_revision_requested') {
                    window.insforgeClient.showToast(
                        '⚠️ Revision Requested',
                        `Client submitted stitch-out feedback on ${payload.orderNumber}.`,
                        'warning',
                        'warning'
                    );
                    await renderAllAdminData();
                } else if (type === 'auto_assign_toggled') {
                    updateAdminAutoAssignUI();
                    window.insforgeClient.showToast(
                        payload.enabled ? '⚡ Auto-Assign Enabled' : 'Auto-Assign Disabled',
                        payload.enabled ? 'New orders directly route to Digitizer.' : 'Orders now require manual admin approval.',
                        payload.enabled ? 'smart_toy' : 'tune',
                        'info'
                    );
                } else if (type === 'task_viewed') {
                    // Digitizer viewed an assigned order
                    await renderAllAdminData();
                } else if (type === 'task_started' || type === 'order_started') {
                    window.insforgeClient.showToast(
                        'Production Started',
                        `Digitizer started work on order ${payload.orderNumber || payload.taskId || ''}.`,
                        'play_circle',
                        'info'
                    );
                    await renderAllAdminData();
                } else if (type === 'order_assigned' || type === 'payment_reminder_sent' || type === 'remote_db_change') {
                    await renderAllAdminData();
                }
            });
        });

        /**
         * Master Data Refresh & Synchronization
         */
        async function renderAllAdminData() {
            const syncText = document.getElementById('admin-db-sync-text');
            if (syncText) syncText.textContent = 'Syncing...';

            const [allOrders, digitizers, clients] = await Promise.all([
                window.insforgeClient.fetchOrders(),
                window.insforgeClient.fetchDigitizers(),
                window.insforgeClient.fetchClients()
            ]);

            if (syncText) {
                const status = window.insforgeClient.getDatabaseSyncStatus();
                syncText.textContent = `Data updated (${status.lastSynced})`;
            }

            const catalogDesigns = window.insforgeClient.getCatalogDesigns();

            // 1. Executive Metrics Calculation
            const totalRev = allOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
            const completedRev = allOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.price) || 0), 0);
            const unpaidOrders = allOrders.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'pending');
            const unpaidRev = unpaidOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
            const activeOrders = allOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'pending_review' || o.status === 'revision_requested');
            const unassignedOrders = allOrders.filter(o => !o.assigned_digitizer_id || o.status === 'pending_review');

            if (document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = '$' + totalRev.toFixed(2);
            if (document.getElementById('stat-revenue-completed')) {
                document.getElementById('stat-revenue-completed').textContent = `Completed: $${completedRev.toFixed(2)}`;
            }
            const unpaidStat = document.getElementById('stat-revenue-unpaid');
            if (unpaidStat) {
                if (unpaidRev > 0) {
                    unpaidStat.textContent = `Due: $${unpaidRev.toFixed(2)} (${unpaidOrders.length} Due)`;
                    unpaidStat.className = 'font-bold text-rose-600 dark:text-rose-400 cursor-pointer hover:underline';
                } else {
                    unpaidStat.textContent = 'Due: $0.00 (Settled)';
                    unpaidStat.className = 'font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:underline';
                }
            }

            if (document.getElementById('stat-active-orders')) document.getElementById('stat-active-orders').textContent = activeOrders.length;
            if (document.getElementById('stat-unassigned-sub')) document.getElementById('stat-unassigned-sub').textContent = `${unassignedOrders.length} need worker`;
            if (document.getElementById('stat-clients-count')) document.getElementById('stat-clients-count').textContent = clients.length;
            if (document.getElementById('stat-catalog-count')) document.getElementById('stat-catalog-count').textContent = catalogDesigns.length;

            // 2. Badges in Sticky Nav & Quick Action Cards
            if (document.getElementById('nav-badge-orders')) document.getElementById('nav-badge-orders').textContent = allOrders.length;
            if (document.getElementById('nav-badge-clients')) document.getElementById('nav-badge-clients').textContent = clients.length;
            if (document.getElementById('nav-badge-catalog')) document.getElementById('nav-badge-catalog').textContent = catalogDesigns.length;
            if (document.getElementById('nav-badge-team')) document.getElementById('nav-badge-team').textContent = digitizers.length;

            if (document.getElementById('quick-badge-orders')) document.getElementById('quick-badge-orders').textContent = allOrders.length;
            if (document.getElementById('quick-badge-clients')) document.getElementById('quick-badge-clients').textContent = clients.length;
            if (document.getElementById('quick-badge-catalog')) document.getElementById('quick-badge-catalog').textContent = catalogDesigns.length;
            if (document.getElementById('quick-badge-team')) document.getElementById('quick-badge-team').textContent = digitizers.length;

            if (document.getElementById('clients-total-badge')) document.getElementById('clients-total-badge').textContent = `${clients.length} Registered Clients`;
            if (document.getElementById('catalog-total-badge')) document.getElementById('catalog-total-badge').textContent = `${catalogDesigns.length} Designs`;

            // 3. Render Views
            window.dezanAdminClients = clients;
            window.dezanAdminCatalog = catalogDesigns;
            renderAdminOrders();
            renderClientsDirectory(clients);
            renderDesignCatalog(catalogDesigns);
            renderDigitizerTeamHub(allOrders, digitizers);
            updateAdminAutoAssignUI();
        }

        /**
         * Render Master Orders across dedicated operational stages:
         * 1. New Orders (Awaiting Digitizer Dispatch)
         * 2. Revisions (Active Client Revision Requests)
         * 3. Quotes & Payment Due (Pending payment or quote approval)
         * 4. In Production (Actively being digitized / in QA)
         * 5. Completed (Delivered and verified archive)
         */
        function renderAdminOrders() {
            const allOrders = window.insforgeClient.getOrders();
            const searchInput = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();

            const isQuote = (o) => Boolean(
                o.is_quote === true ||
                o.status === 'quote_requested' ||
                o.status === 'quote_ready' ||
                (typeof o.order_number === 'string' && o.order_number.toUpperCase().startsWith('QUO-')) ||
                o.order_type === 'quote' ||
                o.service_type === 'quote' ||
                o.payment_method === 'Pending Quote' ||
                (o.status === 'pending' && (!o.price || Number(o.price) === 0))
            );

            const isPaymentDue = (o) => Boolean(
                o.payment_status === 'unpaid' ||
                o.payment_status === 'pending' ||
                o.payment_status === 'payment_due'
            );

            // 5. Stage 5: Completed Production Archive
            const stageCompletedOrders = allOrders.filter(o => o.status === 'completed');

            // 2. Stage 2: Revisions (urgent rework requests)
            const stageRevisionOrders = allOrders.filter(o => {
                if (stageCompletedOrders.includes(o) || o.status === 'cancelled') return false;
                return (o.status === 'revision_requested' || o.is_revision === true) && !isQuote(o);
            });

            // 3. Stage 3: Quotes & Incomplete Payment Due (dedicated stage for all quotes and unpaid bookings)
            const stageQuotesOrders = allOrders.filter(o => {
                if (stageCompletedOrders.includes(o) || stageRevisionOrders.includes(o) || o.status === 'cancelled') return false;
                return isQuote(o) || isPaymentDue(o);
            });

            // 1. Stage 1: New Incoming Orders (paid, confirmed bookings awaiting digitizer dispatch OR assigned awaiting digitizer start; strictly NO quotes and NO unpaid)
            const stageNewOrders = allOrders.filter(o => {
                if (stageCompletedOrders.includes(o) || stageRevisionOrders.includes(o) || stageQuotesOrders.includes(o) || o.status === 'cancelled') return false;
                if (o.status === 'in_progress' || o.status === 'in_production') return false;
                return true;
            });

            // 4. Stage 4: In Production (paid, assigned, actively being digitized)
            const stageProductionOrders = allOrders.filter(o => {
                if (stageCompletedOrders.includes(o) || stageRevisionOrders.includes(o) || stageQuotesOrders.includes(o) || stageNewOrders.includes(o) || o.status === 'cancelled') return false;
                return o.status === 'in_progress' || o.status === 'in_production';
            });

            // Compatibility union for legacy unassigned stage references
            const stageUnassignedUnion = [...stageNewOrders, ...stageRevisionOrders];

            renderAdminInsights(allOrders, [stageNewOrders, stageRevisionOrders, stageQuotesOrders, stageProductionOrders, stageCompletedOrders]);

            // Update Header & Pill Counts
            const totalCount = stageNewOrders.length + stageRevisionOrders.length + stageQuotesOrders.length + stageProductionOrders.length + stageCompletedOrders.length;
            if (document.getElementById('pill-count-all')) document.getElementById('pill-count-all').textContent = totalCount;
            if (document.getElementById('pill-count-new')) document.getElementById('pill-count-new').textContent = stageNewOrders.length;
            if (document.getElementById('pill-count-revisions')) document.getElementById('pill-count-revisions').textContent = stageRevisionOrders.length;
            if (document.getElementById('pill-count-unassigned')) document.getElementById('pill-count-unassigned').textContent = stageUnassignedUnion.length;
            if (document.getElementById('pill-count-unpaid')) document.getElementById('pill-count-unpaid').textContent = stageQuotesOrders.length;
            if (document.getElementById('pill-count-in-progress')) document.getElementById('pill-count-in-progress').textContent = stageProductionOrders.length;
            if (document.getElementById('pill-count-completed')) document.getElementById('pill-count-completed').textContent = stageCompletedOrders.length;
            if (document.getElementById('quick-badge-orders')) document.getElementById('quick-badge-orders').textContent = totalCount;

            // Section Badges
            if (document.getElementById('badge-stage-new')) document.getElementById('badge-stage-new').textContent = `${stageNewOrders.length} Orders`;
            if (document.getElementById('badge-stage-revisions')) document.getElementById('badge-stage-revisions').textContent = `${stageRevisionOrders.length} Orders`;
            if (document.getElementById('badge-stage-unassigned')) document.getElementById('badge-stage-unassigned').textContent = `${stageUnassignedUnion.length} Orders`;
            if (document.getElementById('badge-stage-incomplete')) document.getElementById('badge-stage-incomplete').textContent = `${stageQuotesOrders.length} Quotes & Unpaid`;
            if (document.getElementById('badge-stage-in-progress')) document.getElementById('badge-stage-in-progress').textContent = `${stageProductionOrders.length} In Progress`;
            if (document.getElementById('badge-stage-completed')) document.getElementById('badge-stage-completed').textContent = `${stageCompletedOrders.length} Completed`;

            // Auto-assign batch button in Stage 1
            const assignAllBtn = document.getElementById('assign-all-pending-btn');
            if (assignAllBtn) {
                if (stageNewOrders.length > 0) {
                    assignAllBtn.classList.remove('hidden');
                } else {
                    assignAllBtn.classList.add('hidden');
                }
            }

            // Instant Search Filtering across all stages
            const filterBySearch = (orders) => {
                if (!searchInput) return orders;
                return orders.filter(o => {
                    return (o.order_number && o.order_number.toLowerCase().includes(searchInput)) ||
                        (o.client_name && o.client_name.toLowerCase().includes(searchInput)) ||
                        (o.client_email && o.client_email.toLowerCase().includes(searchInput)) ||
                        (o.client_company && o.client_company.toLowerCase().includes(searchInput)) ||
                        (o.project_name && o.project_name.toLowerCase().includes(searchInput)) ||
                        (o.assigned_digitizer_name && o.assigned_digitizer_name.toLowerCase().includes(searchInput));
                });
            };

            const scopedOrders = {
                'stage-new-sub': stageNewOrders,
                'stage-revisions-sub': stageRevisionOrders,
                'stage-unassigned-sub': stageUnassignedUnion,
                'stage-incomplete-sub': stageQuotesOrders,
                'stage-in-progress-sub': stageProductionOrders,
                'stage-completed-sub': stageCompletedOrders
            };
            const visibleOrders = scopedOrders[currentStageScope] || [...stageNewOrders, ...stageRevisionOrders, ...stageQuotesOrders, ...stageProductionOrders, ...stageCompletedOrders];
            const result = document.getElementById('admin-search-results');
            if (result) {
                const stageLabels = {
                    'all': 'All stages',
                    'stage-new-sub': 'New Orders',
                    'stage-revisions-sub': 'Revisions',
                    'stage-incomplete-sub': 'Quotes & payment',
                    'stage-in-progress-sub': 'In production',
                    'stage-completed-sub': 'Completed'
                };
                const currentLabel = stageLabels[currentStageScope] || 'All stages';
                const count = filterBySearch(visibleOrders).length;
                if (currentStageScope === 'all') {
                    result.textContent = `${count} orders across all stages${searchInput ? ' matching your search' : ''}`;
                } else {
                    result.textContent = `Showing only ${currentLabel} (${count} order${count === 1 ? '' : 's'})${searchInput ? ' matching your search' : ''}`;
                }
            }

            // Render each stage independently with custom empty states
            renderStageSection('new', filterBySearch(stageNewOrders), searchInput, 'No new incoming or unstarted orders awaiting production.');
            renderStageSection('revisions', filterBySearch(stageRevisionOrders), searchInput, 'No active client revision requests pending.');
            renderStageSection('incomplete', filterBySearch(stageQuotesOrders), searchInput, 'All client balances and invoices are settled. No incomplete bookings or unpaid quotes.');
            renderStageSection('in-progress', filterBySearch(stageProductionOrders), searchInput, 'No orders actively in production undergoing digitization at this moment.');
            renderStageSection('completed', filterBySearch(stageCompletedOrders), searchInput, 'No completed production orders archived yet.');

            // Compatibility Bridge for Legacy Selectors (#stage-unassigned-cards and #admin-orders-tbody)
            renderStageSection('unassigned', filterBySearch(stageUnassignedUnion), searchInput, 'All incoming orders have assigned digitizers, with no active revision requests pending.');
            const legacyTbody = document.getElementById('admin-orders-tbody');
            if (legacyTbody) {
                const combined = filterBySearch(allOrders);
                if (combined.length === 0) {
                    legacyTbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">No matching orders found.</td></tr>`;
                } else {
                    legacyTbody.innerHTML = combined.map(o => renderAdminOrderTableRow(o, 'all')).join('');
                }
            }

            updateAdminAutoAssignUI();
        }

        /**
         * Render a specific Stage Subsection (Cards and Table)
         */
        function renderStageSection(stageKey, orders, searchInput, emptyMessage) {
            const cardsContainer = document.getElementById(`stage-${stageKey}-cards`);
            const tbody = document.getElementById(`stage-${stageKey}-tbody`);

            // Render Bento Visual Cards
            if (cardsContainer) {
                if (orders.length === 0) {
                    const msg = searchInput
                        ? `No matching orders in this stage. Try another search or reset filters.`
                        : emptyMessage;
                    cardsContainer.innerHTML = `
                        <div class="col-span-full text-center py-8 px-4 rounded-xl border border-dashed border-slate-300 dark:border-primary/20 bg-white/60 dark:bg-card-dark/60 text-slate-500 dark:text-slate-400 text-xs">
                            <span class="material-symbols-outlined text-2xl text-slate-400 dark:text-slate-500 block mb-1">info</span>
                            <span class="font-medium">${msg}</span>
                        </div>
                    `;
                } else {
                    cardsContainer.innerHTML = orders.map(o => renderAdminOrderCard(o, stageKey)).join('');
                }
            }

            // Render Table Rows
            if (tbody) {
                if (orders.length === 0) {
                    const msg = searchInput
                        ? `No matching orders in this stage. Try another search or reset filters.`
                        : emptyMessage;
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center py-10 px-4 text-slate-500 dark:text-slate-400 font-medium text-xs bg-slate-50/40 dark:bg-slate-900/30">
                                <div class="flex flex-col items-center justify-center gap-1.5 py-2">
                                    <span class="material-symbols-outlined text-xl text-slate-400 dark:text-slate-500">inbox</span>
                                    <span>${msg}</span>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = orders.map(o => renderAdminOrderTableRow(o, stageKey)).join('');
                }
            }
        }

        /**
         * Dynamic Order Color Theme System
         * Gives distinct, identifiable background tints and accents based on order type:
         * - Completed: Fresh Emerald Green
         * - Revisions: High-visibility Purple/Violet
         * - Quotes: Crisp Sky Blue / Cyan
         * - Payment Due / Unpaid: Gentle Rose / Coral
         * - In Production / Assigned: Cool Royal Blue
         * - New Work / Needs Attention: Warm Amber / Gold
         */
        function getOrderColorTheme(order) {
            const isCompleted = order.status === 'completed';
            const isRevision = order.status === 'revision_requested';
            const isQuote = order.is_quote === true || order.status === 'quote_requested' || (order.order_number && order.order_number.startsWith('QUO-'));
            const isUnpaid = (order.payment_status === 'unpaid' || order.payment_status === 'pending') && !isQuote && !isCompleted;
            const isInProgress = order.status === 'in_progress' || order.status === 'in_production';
            const isAssigned = order.status === 'assigned' || (order.assigned_digitizer_id && !isInProgress && !isRevision && !isCompleted);

            if (isCompleted) {
                return {
                    type: 'completed',
                    label: 'Completed',
                    rowClass: 'bg-emerald-50/70 hover:bg-emerald-100/75 dark:bg-emerald-950/25 dark:hover:bg-emerald-900/40 border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
                    cardClass: 'border-2 border-emerald-500/85 dark:border-emerald-400/80 shadow-xs ring-1 ring-emerald-500/20 hover:border-emerald-600',
                    orderIdClass: 'text-emerald-800 dark:text-emerald-300',
                    accentBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                };
            }

            if (isRevision) {
                return {
                    type: 'revision',
                    label: 'Revision',
                    rowClass: 'bg-purple-50/80 hover:bg-purple-100/85 dark:bg-purple-950/30 dark:hover:bg-purple-900/45 border-l-4 border-l-purple-500 dark:border-l-purple-400',
                    cardClass: 'border-2 border-purple-500/85 dark:border-purple-400/80 shadow-xs ring-1 ring-purple-500/20 hover:border-purple-600',
                    orderIdClass: 'text-purple-900 dark:text-purple-300',
                    accentBadge: 'bg-purple-100 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200 border-purple-300 dark:border-purple-500/40'
                };
            }

            if (isQuote) {
                return {
                    type: 'quote',
                    label: 'Quote',
                    rowClass: 'bg-sky-50/75 hover:bg-sky-100/80 dark:bg-sky-950/25 dark:hover:bg-sky-900/40 border-l-4 border-l-sky-500 dark:border-l-sky-400',
                    cardClass: 'border-2 border-sky-500/85 dark:border-sky-400/80 shadow-xs ring-1 ring-sky-500/20 hover:border-sky-600',
                    orderIdClass: 'text-sky-800 dark:text-sky-300',
                    accentBadge: 'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-300 border-sky-300 dark:border-sky-500/35'
                };
            }

            if (isUnpaid) {
                return {
                    type: 'unpaid',
                    label: 'Payment Due',
                    rowClass: 'bg-rose-50/75 hover:bg-rose-100/80 dark:bg-rose-950/25 dark:hover:bg-rose-900/40 border-l-4 border-l-rose-500 dark:border-l-rose-400',
                    cardClass: 'border-2 border-rose-500/85 dark:border-rose-400/80 shadow-xs ring-1 ring-rose-500/20 hover:border-rose-600',
                    orderIdClass: 'text-rose-800 dark:text-rose-300',
                    accentBadge: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/35'
                };
            }

            if (isInProgress) {
                return {
                    type: 'in_progress',
                    label: 'In Production',
                    rowClass: 'bg-blue-50/70 hover:bg-blue-100/75 dark:bg-blue-950/25 dark:hover:bg-blue-900/40 border-l-4 border-l-blue-500 dark:border-l-blue-400',
                    cardClass: 'border-2 border-blue-500/85 dark:border-blue-400/80 shadow-xs ring-1 ring-blue-500/20 hover:border-blue-600',
                    orderIdClass: 'text-blue-800 dark:text-blue-300',
                    accentBadge: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-500/35'
                };
            }

            if (isAssigned) {
                return {
                    type: 'assigned',
                    label: 'Assigned (New)',
                    rowClass: 'bg-amber-50/80 hover:bg-amber-100/85 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border-l-4 border-l-amber-500 dark:border-l-amber-400',
                    cardClass: 'border-2 border-amber-500/85 dark:border-amber-400/80 shadow-xs ring-1 ring-amber-500/20 hover:border-amber-600',
                    orderIdClass: 'text-amber-800 dark:text-amber-300',
                    accentBadge: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/35'
                };
            }

            // Default: New Work / Needs Attention / Unassigned
            return {
                type: 'new_work',
                label: 'New Work',
                rowClass: 'bg-amber-50/75 hover:bg-amber-100/80 dark:bg-amber-950/25 dark:hover:bg-amber-900/40 border-l-4 border-l-amber-500 dark:border-l-amber-400',
                cardClass: 'border-2 border-amber-500/85 dark:border-primary/85 shadow-xs ring-1 ring-amber-500/20 hover:border-amber-600 dark:hover:border-primary',
                orderIdClass: 'text-amber-800 dark:text-primary',
                accentBadge: 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/35'
            };
        }

        // ===== ARTWORK & MULTI-FILE PREVIEW UTILITIES =====
        function escapeHtml(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getFileExtension(filename) {
            if (!filename || typeof filename !== 'string') return '';
            const clean = filename.split('?')[0].split('#')[0];
            const parts = clean.split('.');
            return parts.length > 1 ? parts.pop().toLowerCase() : '';
        }

        function isBrowserPreviewable(url, name) {
            const ext = getFileExtension(name) || getFileExtension(url);
            const previewable = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico', 'pdf'];
            return previewable.includes(ext);
        }

        function formatFileSize(bytes) {
            if (!bytes || isNaN(bytes) || bytes <= 0) return '';
            const kb = bytes / 1024;
            if (kb < 1024) return kb.toFixed(1) + ' KB';
            return (kb / 1024).toFixed(1) + ' MB';
        }

        function getOrderArtworkFiles(order) {
            if (!order) return [];
            if (Array.isArray(order.raw_artwork_files) && order.raw_artwork_files.length > 0) {
                return order.raw_artwork_files.map((f, idx) => ({
                    name: f.name || (typeof f === 'string' ? f.split('/').pop() : `Artwork_${idx + 1}`),
                    url: f.url || (typeof f === 'string' ? f : '#'),
                    size: f.size || 0,
                    type: f.mimeType || f.type || ''
                }));
            }
            if (order.artwork_url) {
                return [{
                    name: order.artwork_url.split('/').pop().split('?')[0] || `Artwork_${order.order_number || '1'}`,
                    url: order.artwork_url,
                    size: 0,
                    type: ''
                }];
            }
            return [];
        }

        function renderAdminArtworkChips(order) {
            const files = getOrderArtworkFiles(order);
            if (!files || files.length === 0) return '';

            if (files.length === 1) {
                const file = files[0];
                const ext = (getFileExtension(file.name) || getFileExtension(file.url) || 'file').toUpperCase();
                const canPreview = isBrowserPreviewable(file.url, file.name);

                if (canPreview) {
                    return `
                        <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', 0)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-primary border border-amber-500/30 text-[10px] font-black hover:bg-amber-500/25 transition-colors cursor-pointer shadow-2xs" title="Preview artwork inside dashboard without leaving page">
                            <span class="material-symbols-outlined text-xs">visibility</span>
                            <span>Artwork (${ext})</span>
                        </button>
                    `;
                } else {
                    return `
                        <a href="${file.url}" download="${file.name}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs" title="Download source file">
                            <span class="material-symbols-outlined text-xs">download</span>
                            <span>${ext} File</span>
                        </a>
                    `;
                }
            }

            return `
                <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', 0)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/40 text-[10px] font-black hover:bg-amber-500/30 transition-colors cursor-pointer shadow-2xs" title="Preview all ${files.length} artwork files inside dashboard">
                    <span class="material-symbols-outlined text-xs">collections</span>
                    <span>📎 ${files.length} Files · Preview</span>
                </button>
            `;
        }

        // Global card expansion helper for admin workspace
        if (!window.toggleOrderCardExpand) {
            window.toggleOrderCardExpand = function(orderNumber, btn) {
                const card = document.getElementById(`admin-card-${orderNumber}`)
                    || document.getElementById(`client-card-${orderNumber}`)
                    || document.getElementById(`digitizer-card-${orderNumber}`)
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
         * Streamlined Admin Quick Order Summary Card
         * Displays essential production summary immediately at a glance:
         * Logo thumbnail (click to enlarge), prominent bold placement, exact size,
         * visible rush status, 3D puff / special options badge, clamped customer notes (first 2-3 lines with ...),
         * order status, and View Order button.
         * Technical formats (DST, PES, EMB) and fabric strips are kept exclusively inside View Order.
         */
        function renderAdminOrderCard(order, stageKey) {
            const isPaid = order.payment_status === 'paid';
            const isRevision = order.status === 'revision_requested';
            const isUnassigned = !order.assigned_digitizer_id;
            const isRush = order.turnaround_speed === 'rush' || order.priority === 'rush' || order.is_rush || order.isRush || (order.turnaround && String(order.turnaround).toLowerCase().includes('rush'));
            const isQuote = order.is_quote || (order.order_number && order.order_number.startsWith('QUO-')) || order.status === 'quote_requested';
            const theme = getOrderColorTheme(order);
            const safeOrderNumber = String(order.order_number || '').replace(/-/g, '&#8209;');
            const orderDt = formatOrderDateTime(order.created_at);

            // 1. HEADER: RUSH STATUS BADGE (Very visible if rush)
            const rushBadge = isRush
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0 whitespace-nowrap shadow-2xs animate-pulse">⚡ RUSH · 5–8 HOURS</span>`
                : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap"><span class="material-symbols-outlined text-[11px] text-slate-400">schedule</span> Standard · 12–24h</span>`;

            // 2. LOGO / ARTWORK THUMBNAIL (Small preview of uploaded file, click to enlarge)
            const artworkFiles = getOrderArtworkFiles(order);
            const primaryArt = artworkFiles[0] || { name: 'artwork.png', url: order.artwork_url || 'images/service-digitizing.png' };
            const artUrl = primaryArt.url || order.artwork_url || 'images/service-digitizing.png';
            const artName = primaryArt.name || 'artwork.png';
            const artExt = (getFileExtension(artName) || getFileExtension(artUrl) || 'PNG').toUpperCase();
            const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'BMP', 'ICO'].includes(artExt);

            // 3. PLACEMENT (Hero production detail - very prominent and bold)
            let placement = order.placement || order.target_placement || order.targetPlacement;
            if (!placement || placement.toLowerCase().includes('digitizing') || placement.toLowerCase() === 'standard' || placement.toLowerCase() === 'custom') {
                const pName = (order.project_name || order.design_name || '').toLowerCase();
                if (pName.includes('cap') || pName.includes('hat')) placement = 'Cap Front';
                else if (pName.includes('jacket') || pName.includes('back')) placement = 'Jacket Back';
                else if (pName.includes('sleeve')) placement = 'Sleeve';
                else if (pName.includes('left chest') || pName.includes('chest')) placement = 'Left Chest';
                else placement = order.placement || 'Left Chest';
            }
            const placementUpper = String(placement).trim().toUpperCase();
            const designTitle = order.project_name || order.design_name || '';

            // 4. SIZE (Exact submitted size in bold)
            const sizeVal = order.sizing || order.dimensions || order.size || '4.0" WIDE';
            const sizeUpper = String(sizeVal).trim().toUpperCase();

            // 5. 3D PUFF / SPECIAL OPTIONS (Bold badge, omitted entirely if flat embroidery)
            const allOptionsStr = `${order.special_options || ''} ${order.specialOptions || ''} ${order.embroidery_type || ''} ${order.embroideryType || ''} ${order.instructions || ''} ${order.special_instructions || ''} ${order.notes || ''}`.toLowerCase();
            const is3dPuff = allOptionsStr.includes('3d puff') || allOptionsStr.includes('puff') || allOptionsStr.includes('foam');
            const isApplique = allOptionsStr.includes('appliqu');
            const isTrims = allOptionsStr.includes('trim');

            let specialOptionBadge = '';
            if (is3dPuff) {
                specialOptionBadge = `
                    <div class="mb-2.5">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/40 font-black text-xs tracking-wider shadow-2xs">
                            <span class="text-amber-600 dark:text-primary font-bold">⚡</span>
                            <span>3D PUFF</span>
                        </span>
                    </div>
                `;
            } else if (isApplique) {
                specialOptionBadge = `
                    <div class="mb-2.5">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-950 dark:text-purple-200 border border-purple-500/40 font-black text-xs tracking-wider shadow-2xs">
                            <span>🧵</span>
                            <span>APPLIQUÉ</span>
                        </span>
                    </div>
                `;
            } else if (isTrims) {
                specialOptionBadge = `
                    <div class="mb-2.5">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 border border-indigo-500/40 font-black text-xs tracking-wider shadow-2xs">
                            <span>✂️</span>
                            <span>TRIMS</span>
                        </span>
                    </div>
                `;
            }

            // 6. CUSTOMER NOTES / DESCRIPTION (First 2-3 lines only with ... truncation)
            const clientNotes = (order.special_instructions || order.instructions || order.notes || order.description || '')
                .replace(/Standard commercial digitizing standards apply.*$/i, '')
                .trim();

            // 7. ASSIGNED WORKER / DISPATCH & DIGITIZER ACTIVITY
            let assignedStatusDetail = '';
            if (order.assigned_digitizer_name) {
                if (order.status === 'in_progress' || order.status === 'in_production' || order.started_at) {
                    const startTime = order.started_at ? formatOrderDateTime(order.started_at).time : orderDt.time;
                    assignedStatusDetail = `<div class="text-[10px] font-bold text-blue-700 dark:text-blue-300 flex items-center justify-end gap-1 mt-0.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production · Started ${startTime}</div>`;
                } else if (order.digitizer_viewed_at) {
                    assignedStatusDetail = `<div class="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1 mt-0.5"><span class="material-symbols-outlined text-[12px] text-emerald-600">visibility</span> Seen ${formatTimeAgo(order.digitizer_viewed_at)}</div>`;
                } else {
                    assignedStatusDetail = `<div class="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1 mt-0.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Not Viewed Yet</div>`;
                }
            }

            const assignedText = order.assigned_digitizer_name
                ? `<div class="text-right"><span class="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200"><span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">badge</span> ${escapeHtml(order.assigned_digitizer_name.split('(')[0].trim())}</span>${assignedStatusDetail}</div>`
                : '<span class="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Unassigned</span>';

            return `
                <div id="admin-card-${order.order_number}" class="admin-order-card digitizer-bento-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark ${theme.cardClass} shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                        <!-- Header Bar: ID, Date/Time, Rush Status -->
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <span class="px-2.5 py-1 rounded-lg border font-mono text-xs font-black ${theme.orderIdClass} tracking-wide whitespace-nowrap select-all inline-block bg-slate-100/80 dark:bg-slate-800/80">#${safeOrderNumber}</span>
                                <div class="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-tight flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[11px] text-slate-400 dark:text-slate-500">schedule</span>
                                    <span>${orderDt.date}</span>
                                    <span class="text-slate-300 dark:text-slate-600">·</span>
                                    <span class="font-bold text-slate-700 dark:text-slate-300">${orderDt.time}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                ${rushBadge}
                                ${order.client_name ? `
                                    <button type="button" onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="btn-inline text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-amber-800 dark:hover:text-primary transition-colors cursor-pointer truncate max-w-[130px] flex items-center gap-0.5" title="Client: ${escapeHtml(order.client_name)}">
                                        <span class="material-symbols-outlined text-xs">person</span>
                                        <span class="truncate">${escapeHtml(order.client_name)}</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Logo / Artwork Thumbnail (Click to view larger preview) -->
                        <div class="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                            <div onclick="openArtworkPreviewModal('${order.order_number}', 0)" class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group/art hover:ring-2 hover:ring-amber-500/70 transition-all shadow-2xs" title="Click to view large preview">
                                ${isImage ? `
                                    <img src="${artUrl}" alt="${escapeHtml(artName)}" class="w-full h-full object-contain p-1 group-hover/art:scale-105 transition-transform" loading="lazy" />
                                    <div class="absolute inset-0 bg-black/0 group-hover/art:bg-black/30 transition-colors flex items-center justify-center">
                                        <span class="material-symbols-outlined text-white text-base opacity-0 group-hover/art:opacity-100 transition-opacity drop-shadow">zoom_in</span>
                                    </div>
                                ` : `
                                    <div class="flex flex-col items-center justify-center text-center p-1">
                                        <span class="material-symbols-outlined text-base text-amber-600 dark:text-primary">description</span>
                                        <span class="font-mono text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">${artExt}</span>
                                    </div>
                                `}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Logo / Artwork</div>
                                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${escapeHtml(artName)}">${escapeHtml(artName)}</div>
                                <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', 0)" class="btn-inline text-[11px] font-bold text-amber-700 dark:text-primary hover:underline cursor-pointer inline-flex items-center gap-1 mt-1">
                                    <span class="material-symbols-outlined text-[13px]">visibility</span>
                                    <span>Tap to enlarge</span>
                                </button>
                            </div>
                        </div>

                        <!-- Placement (Hero production detail - very prominent and bold) -->
                        <div class="mb-1">
                            <div class="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-primary">Placement</div>
                            <div class="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-snug">
                                ${escapeHtml(placementUpper)}
                            </div>
                            ${designTitle && designTitle.toUpperCase() !== placementUpper ? `
                                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5" title="${escapeHtml(designTitle)}">
                                    ${escapeHtml(designTitle)}
                                </div>
                            ` : ''}
                        </div>

                        <!-- Size (Exact submitted size in bold) -->
                        <div class="mb-2 flex items-baseline gap-1.5">
                            <span class="text-xs font-black text-slate-500 dark:text-slate-400 tracking-wider">SIZE:</span>
                            <span class="text-sm font-black text-slate-900 dark:text-white uppercase">${escapeHtml(sizeUpper)}</span>
                        </div>

                        <!-- 3D Puff / Special Options Badge (Omitted if flat embroidery) -->
                        ${specialOptionBadge}

                        <!-- Customer Notes (First 2-3 lines only, truncated with ...) -->
                        <div class="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                            <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">chat</span>
                                <span>Customer Notes:</span>
                            </div>
                            <p class="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(clientNotes)}">
                                ${clientNotes ? `“${escapeHtml(clientNotes)}”` : '<span class="italic text-slate-400 dark:text-slate-500">No specific notes submitted.</span>'}
                            </p>
                        </div>

                        <!-- Order Status & Dispatch -->
                        <div class="flex items-center justify-between gap-2 mb-3 pt-0.5">
                            <div class="flex items-center gap-1.5">
                                <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">Status:</span>
                                ${getStatusBadge(order.status)}
                            </div>
                            <div class="text-[11px] font-mono">
                                ${assignedText}
                            </div>
                        </div>
                    </div>

                    <!-- Actions Toolbar: View Order Button + Quick Actions -->
                    <div class="pt-3 border-t border-slate-100 dark:border-primary/10 flex items-center justify-between gap-2 mt-auto">
                        <button type="button" onclick="openAdminOrderDetailsModal('${order.order_number}')" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-hover text-white dark:text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs" title="View order details and files">
                            <span>View Order</span>
                            <span class="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-slate-900 dark:text-white mr-1">$${Number(order.price || 0).toFixed(2)}</span>
                            ${(!order.is_quote && order.status !== 'quote_requested' && !(order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button type="button" onclick="openAssignModal('${order.order_number}')" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 dark:hover:bg-primary/20 text-slate-800 dark:text-slate-200 hover:text-amber-800 dark:hover:text-primary font-bold text-xs inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors" title="Assign or Reassign Digitizer">
                                    <span class="material-symbols-outlined text-xs">person_add</span>
                                    <span>${order.assigned_digitizer_id ? 'Reassign' : 'Assign'}</span>
                                </button>
                            ` : (order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button type="button" onclick="openSetQuotePriceModal('${order.order_number}')" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer transition-colors" title="Set or Update Quote Price">
                                    <span class="material-symbols-outlined text-xs">price_change</span>
                                    <span>${order.price ? 'Update Price' : 'Give Price'}</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Modular Table Row Renderer
         * Enforces strict non-wrapping layout, dedicated color shades, and responsive single-row action toolbars.
         */
        function renderAdminOrderTableRow(order, stageKey) {
            const isPaid = order.payment_status === 'paid';
            const isRevision = order.status === 'revision_requested';
            const isRush = order.turnaround_speed === 'rush';
            const theme = getOrderColorTheme(order);
            const orderDt = formatOrderDateTime(order.created_at);
            
            // Format worker display (Primary name + secondary specialty subtitle or neat unassigned pill + activity status)
            let assignedMarkup = '';
            if (order.assigned_digitizer_name) {
                const match = order.assigned_digitizer_name.match(/^(.*?)\s*\((.*?)\)$/);
                const workerName = match ? match[1] : order.assigned_digitizer_name;
                const workerSub = match ? match[2] : '';

                // Activity / Started status indicator
                let progressStatus = '';
                if (order.status === 'in_progress' || order.status === 'in_production' || order.started_at) {
                    const startTime = order.started_at ? formatOrderDateTime(order.started_at).time : orderDt.time;
                    progressStatus = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 mt-0.5 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production · Started ${startTime}</span>`;
                } else if (order.digitizer_viewed_at) {
                    progressStatus = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap"><span class="material-symbols-outlined text-[11px] text-emerald-600">visibility</span> Seen ${formatTimeAgo(order.digitizer_viewed_at)}</span>`;
                } else {
                    progressStatus = `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-0.5 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Not Viewed Yet</span>`;
                }

                assignedMarkup = `
                    <div class="leading-tight">
                        <span class="text-slate-800 dark:text-slate-200 font-bold block text-xs whitespace-nowrap">${escapeHtml(workerName)}</span>
                        ${workerSub ? `<span class="text-slate-500 dark:text-slate-400 text-[10px] font-medium block whitespace-nowrap">${escapeHtml(workerSub)}</span>` : ''}
                        ${progressStatus}
                    </div>
                `;
            } else {
                assignedMarkup = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap leading-none">Unassigned</span>`;
            }

            // Clean Non-Breaking Order Number (prevents breaking at hyphens across multiple lines)
            const safeOrderNumber = String(order.order_number || '').replace(/-/g, '&#8209;');

            return `
                <tr class="transition-colors ${theme.rowClass}">
                    <td class="px-4 py-3.5 w-[145px] min-w-[145px] whitespace-nowrap font-mono font-bold">
                        <span class="inline-block whitespace-nowrap select-all font-mono font-black ${theme.orderIdClass}" style="white-space: nowrap !important; word-break: keep-all !important; letter-spacing: -0.01em;">
                            ${safeOrderNumber}
                        </span>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium mt-0.5 leading-tight flex items-center gap-1">
                            <span>${orderDt.date}</span>
                            <span class="text-slate-300 dark:text-slate-600">·</span>
                            <span class="font-bold text-slate-700 dark:text-slate-300">${orderDt.time}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3.5 w-[180px] min-w-[180px]">
                        <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="group/client inline-flex items-center gap-1.5 text-left cursor-pointer hover:text-amber-700 dark:hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                            <strong class="text-slate-900 dark:text-white font-bold group-hover/client:text-amber-700 dark:group-hover/client:text-primary leading-tight">${order.client_name}</strong>
                            <span class="material-symbols-outlined text-[13px] text-amber-700 dark:text-primary opacity-70 group-hover/client:opacity-100 shrink-0">history</span>
                        </button>
                        <span class="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mt-0.5 whitespace-nowrap truncate max-w-[170px]" title="${order.client_company || 'Independent'} · ${order.client_email}">${order.client_company || 'Independent'} · ${order.client_email}</span>
                    </td>
                    <td class="px-4 py-3.5 w-[220px] min-w-[220px]">
                        <div class="flex items-center justify-between gap-1.5">
                            <span class="text-slate-900 dark:text-white font-semibold block leading-tight truncate max-w-[155px]" title="${order.project_name}">${order.project_name}</span>
                            ${isRush ? `
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0 whitespace-nowrap shadow-2xs" title="Expedited 5-8h delivery (+$5 rush fee included)">
                                    <span class="material-symbols-outlined text-xs text-rose-600 dark:text-rose-400">bolt</span> ⚡ RUSH · 5–8 HOURS
                                </span>
                            ` : `
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap">
                                    Standard · 12–24h
                                </span>
                            `}
                        </div>
                        <span class="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mt-0.5 mb-1 whitespace-nowrap">${order.placement || 'Standard'} (${order.sizing || 'Default'})</span>
                        <div class="flex flex-wrap items-center gap-1.5 mt-1">
                            ${renderAdminArtworkChips(order)}
                            ${order.deliverables && order.deliverables.length > 0 ? order.deliverables.map(d => `
                                <a href="${d.url}" target="_blank" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-200 shadow-2xs shrink-0">
                                    <span class="material-symbols-outlined text-[11px]">download</span> ${d.format}
                                </a>
                            `).join('') : ''}
                        </div>
                    </td>
                    <td class="px-4 py-3.5 w-[110px] min-w-[110px] whitespace-nowrap">
                        <span class="font-black text-slate-900 dark:text-slate-100 text-sm block leading-tight">$${Number(order.price || 0).toFixed(2)}</span>
                        <div class="mt-1">${getPaymentBadge(order.payment_status)}</div>
                    </td>
                    <td class="px-4 py-3.5 w-[125px] min-w-[125px] whitespace-nowrap">
                        ${getStatusBadge(order.status)}
                    </td>
                    <td class="px-4 py-3.5 w-[145px] min-w-[145px] whitespace-nowrap text-xs">
                        ${assignedMarkup}
                    </td>
                    <td class="px-4 py-3.5 w-[360px] min-w-[360px] text-right whitespace-nowrap">
                        <div class="inline-flex items-center justify-end gap-1 flex-nowrap shrink-0">
                            <button onclick="openAdminOrderDetailsModal('${order.order_number}')" class="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Inspect complete client specifications, production notes, and artwork">
                                <span class="material-symbols-outlined text-xs">visibility</span>
                                <span>Details</span>
                            </button>
                            <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="px-2 py-1.5 rounded-lg bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="View lifetime client order history">
                                <span class="material-symbols-outlined text-xs text-slate-500 dark:text-slate-400">history</span>
                                <span>History</span>
                            </button>
                            ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openSetQuotePriceModal('${order.order_number}')" class="px-2 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0" title="Give or update price quote">
                                    <span class="material-symbols-outlined text-xs">price_change</span>
                                    <span>${order.price ? 'Update Price' : 'Give Price'}</span>
                                </button>
                            ` : ''}
                            ${isRevision ? `
                                <button onclick="openAdminRevisionModal('${order.order_number}')" class="px-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Review revision specs & defect photos">
                                    <span class="material-symbols-outlined text-xs">rate_review</span>
                                    <span>Specs</span>
                                </button>
                            ` : ''}
                            ${(!isPaid && !order.is_quote && !(order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openPaymentReminderModal('${order.order_number}')" class="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Send payment reminder">
                                    <span class="material-symbols-outlined text-xs">forward_to_inbox</span>
                                    <span>Remind</span>
                                </button>
                            ` : ''}
                            <button onclick="openInvoiceModal('${order.order_number}')" class="px-2 py-1.5 rounded-lg bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="View printable tax invoice">
                                <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">receipt</span>
                                <span>Invoice</span>
                            </button>
                            ${(!order.is_quote && order.status !== 'quote_requested' && !(order.order_number && order.order_number.startsWith('QUO-'))) ? `
                            <button onclick="openAssignModal('${order.order_number}')" class="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/40 font-black text-[11px] transition-all cursor-pointer shadow-2xs shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                ${order.assigned_digitizer_id ? 'Reassign' : 'Assign'}
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }

        /**
         * SECTION 2: RENDER CLIENTS DIRECTORY
         */
        function renderClientsDirectory(clientsData) {
            const container = document.getElementById('clients-directory-cards');
            if (!container) return;

            const allClients = clientsData || window.dezanAdminClients || window.insforgeClient.getClients();
            const searchInput = (document.getElementById('client-search-input')?.value || '').toLowerCase().trim();
            const sortMode = document.getElementById('client-sort-select')?.value || 'ltv';

            // Filter
            let filtered = allClients.filter(c => {
                if (!searchInput) return true;
                return (c.clientName && c.clientName.toLowerCase().includes(searchInput)) ||
                    (c.clientCompany && c.clientCompany.toLowerCase().includes(searchInput)) ||
                    (c.clientEmail && c.clientEmail.toLowerCase().includes(searchInput));
            });

            // Sort
            filtered.sort((a, b) => {
                if (sortMode === 'ltv') return (b.totalSpent || 0) - (a.totalSpent || 0);
                if (sortMode === 'orders') return (b.totalOrders || 0) - (a.totalOrders || 0);
                if (sortMode === 'due') return (b.balanceDue || 0) - (a.balanceDue || 0);
                if (sortMode === 'recent') return new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0);
                return 0;
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-primary/20 p-8">
                        <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">person_search</span>
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">No clients match "${searchInput}"</h4>
                        <p class="text-xs text-slate-500 mt-1">Try another search term or reset the filter.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(client => {
                const initials = (client.clientName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const hasDue = (client.balanceDue || 0) > 0;
                const memberDate = client.firstOrderDate ? new Date(client.firstOrderDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026';
                const lastDate = client.lastOrderDate ? formatTimeAgo(client.lastOrderDate) : 'Recently';

                return `
                    <div class="p-5 rounded-2xl bg-white dark:bg-card-dark border border-primary/20 dark:border-primary/25 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                        <div>
                            <!-- Client Header -->
                            <div class="flex items-start justify-between gap-3 mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-primary flex items-center justify-center font-black text-lg flex-shrink-0">
                                        ${initials}
                                    </div>
                                    <div>
                                        <h4 class="font-black text-slate-900 dark:text-white text-base group-hover:text-amber-800 dark:group-hover:text-primary transition-colors">${client.clientName}</h4>
                                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 block">${client.clientCompany}</span>
                                        <span class="text-[11px] text-slate-500 font-mono">${client.clientEmail}</span>
                                    </div>
                                </div>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    Since ${memberDate}
                                </span>
                            </div>

                            <!-- Key Metrics Grid -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
                                <div class="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-200/60 dark:border-primary/10">
                                    <span class="text-base font-black text-amber-800 dark:text-primary block">$${(client.totalSpent || 0).toFixed(0)}</span>
                                    <span class="text-[9px] font-bold uppercase text-slate-500">Lifetime (LTV)</span>
                                </div>
                                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-primary/10 dark:border-primary/15">
                                    <span class="text-base font-black text-slate-900 dark:text-white block">${client.totalOrders || 0}</span>
                                    <span class="text-[9px] font-bold uppercase text-slate-500">Orders</span>
                                </div>
                                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-primary/10 dark:border-primary/15">
                                    <span class="text-base font-black text-emerald-700 dark:text-emerald-400 block">${client.completedOrders || 0}</span>
                                    <span class="text-[9px] font-bold uppercase text-slate-500">Completed</span>
                                </div>
                                <div class="p-3 rounded-xl ${hasDue ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-primary/10 dark:border-primary/15'} border">
                                    <span class="text-base font-black ${hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'} block">$${(client.balanceDue || 0).toFixed(0)}</span>
                                    <span class="text-[9px] font-bold uppercase ${hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}">Balance Due</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="pt-3 border-t border-primary/15 dark:border-primary/20 flex items-center gap-2">
                            <button onclick="openClientHistoryModal('${client.clientEmail || client.clientId}')" class="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                <span class="material-symbols-outlined text-sm">folder_open</span>
                                <span>Order Dossier (${client.totalOrders})</span>
                            </button>
                            <button onclick="filterOrdersByClient('${client.clientName}')" class="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Filter orders in master queue">
                                <span class="material-symbols-outlined text-sm text-amber-700 dark:text-primary">filter_alt</span>
                                <span class="hidden sm:inline">Queue</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function handleClientSearch() {
            renderClientsDirectory();
        }

        /**
         * CLIENT ORDER HISTORY DOSSIER MODAL LOGIC
         */
        function openClientHistoryModal(clientIdOrEmail) {
            const client = window.insforgeClient.getClientHistory(clientIdOrEmail);
            if (!client) {
                alert('Client history not found.');
                return;
            }

            currentModalClientEmail = client.clientEmail;
            modalHistoryFilter = 'all';

            // Populate Client Details
            const initials = (client.clientName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            document.getElementById('modal-client-avatar').textContent = initials;
            document.getElementById('modal-client-name').textContent = client.clientName;
            document.getElementById('modal-client-company').textContent = `${client.clientCompany || 'Direct Customer'} · ${client.clientEmail}`;
            document.getElementById('modal-client-ltv').textContent = `$${(client.totalSpent || 0).toFixed(2)}`;
            document.getElementById('modal-client-total-orders').textContent = client.totalOrders || 0;
            document.getElementById('modal-client-completed-orders').textContent = client.completedOrders || 0;

            const dueEl = document.getElementById('modal-client-balance-due');
            if (dueEl) {
                dueEl.textContent = `$${(client.balanceDue || 0).toFixed(2)}`;
                if ((client.balanceDue || 0) > 0) {
                    dueEl.className = 'text-xl font-black text-rose-600 dark:text-rose-400';
                } else {
                    dueEl.className = 'text-xl font-black text-slate-900 dark:text-white';
                }
            }

            if (document.getElementById('modal-first-order-date')) {
                const fDate = client.firstOrderDate ? new Date(client.firstOrderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                document.getElementById('modal-first-order-date').textContent = `Customer since: ${fDate}`;
            }

            // Update Tab Counts
            const completedCount = client.orders.filter(o => o.status === 'completed').length;
            const activeCount = client.orders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'pending_review' || o.status === 'revision_requested').length;
            const unpaidCount = client.orders.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'pending').length;

            if (document.getElementById('modal-count-all')) document.getElementById('modal-count-all').textContent = client.orders.length;
            if (document.getElementById('modal-count-completed')) document.getElementById('modal-count-completed').textContent = completedCount;
            if (document.getElementById('modal-count-active')) document.getElementById('modal-count-active').textContent = activeCount;
            if (document.getElementById('modal-count-unpaid')) document.getElementById('modal-count-unpaid').textContent = unpaidCount;

            renderModalClientOrders(client);
            document.getElementById('client-history-modal').classList.remove('hidden');
        }

        function closeClientHistoryModal() {
            const modal = document.getElementById('client-history-modal');
            if (modal) modal.classList.add('hidden');
            currentModalClientEmail = null;
        }

        function setModalHistoryFilter(filter) {
            modalHistoryFilter = filter;
            document.querySelectorAll('.modal-filter-pill').forEach(btn => {
                if (btn.getAttribute('data-modal-filter') === filter) {
                    btn.className = 'modal-filter-pill px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-xs cursor-pointer';
                } else {
                    btn.className = 'modal-filter-pill px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer';
                }
            });

            if (currentModalClientEmail) {
                const client = window.insforgeClient.getClientHistory(currentModalClientEmail);
                if (client) renderModalClientOrders(client);
            }
        }

        function renderModalClientOrders(client) {
            const container = document.getElementById('modal-client-orders-container');
            if (!container) return;

            let orders = client.orders || [];
            if (modalHistoryFilter === 'completed') {
                orders = orders.filter(o => o.status === 'completed');
            } else if (modalHistoryFilter === 'active') {
                orders = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'pending_review' || o.status === 'revision_requested');
            } else if (modalHistoryFilter === 'unpaid') {
                orders = orders.filter(o => o.payment_status === 'unpaid' || o.payment_status === 'pending');
            }

            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No orders match filter "${modalHistoryFilter}".
                    </div>
                `;
                return;
            }

            container.innerHTML = orders.map(order => {
                const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                const isPaid = order.payment_status === 'paid';
                const isRevision = order.status === 'revision_requested';

                return `
                    <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border ${isRevision ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/20' : 'border-primary/10 dark:border-primary/15'} transition-all text-xs">
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <div>
                                <span class="font-mono font-black text-amber-800 dark:text-primary text-sm">${order.order_number}</span>
                                <span class="text-slate-500 text-[11px] block font-medium">Placed ${orderDate} · ${order.service_type || 'Digitizing'}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                ${getStatusBadge(order.status)}
                                ${getPaymentBadge(order.payment_status)}
                            </div>
                        </div>

                        <div class="mb-3">
                            <h5 class="font-black text-slate-900 dark:text-white text-sm">${order.project_name}</h5>
                            <p class="text-slate-600 dark:text-slate-400 text-xs mt-0.5">${order.placement || 'Standard'} · ${order.sizing || 'Standard Dimensions'}</p>
                            ${order.fabric_type ? `<span class="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Target Fabric: ${order.fabric_type}</span>` : ''}
                        </div>

                        <!-- Technical Specs & Deliverable Download Chips -->
                        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-primary/10 dark:border-primary/15">
                            <div class="flex flex-wrap items-center gap-1.5">
                                ${renderAdminArtworkChips(order)}
                                ${order.deliverables && order.deliverables.length > 0 ? order.deliverables.map(d => `
                                    <a href="${d.url}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                        <span class="material-symbols-outlined text-xs">download</span> ${d.format} (${d.name || 'Stitch'})
                                    </a>
                                `).join('') : '<span class="text-[10px] text-slate-400 italic">No deliverables uploaded yet</span>'}
                            </div>

                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="font-black text-slate-900 dark:text-white text-sm mr-1">$${Number(order.price || 0).toFixed(2)}</span>
                                <button onclick="openAdminOrderDetailsModal('${order.order_number}')" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer inline-flex items-center gap-1 shadow-xs">
                                    <span class="material-symbols-outlined text-xs">visibility</span> Details
                                </button>
                                <button onclick="openInvoiceModal('${order.order_number}')" class="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">receipt</span> Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        /**
         * SECTION 3: RENDER MASTER DESIGN CATALOG
         */
        function renderDesignCatalog(catalogData) {
            const container = document.getElementById('catalog-grid');
            if (!container) return;

            const allDesigns = catalogData || window.dezanAdminCatalog || window.insforgeClient.getCatalogDesigns();
            const searchInput = (document.getElementById('catalog-search-input')?.value || '').toLowerCase().trim();

            let filtered = allDesigns.filter(d => {
                // Category filter
                let matchesCategory = true;
                const placementLower = (d.placement || '').toLowerCase();
                const serviceLower = (d.serviceType || '').toLowerCase();

                if (currentCatalogCategory === 'cap') {
                    matchesCategory = placementLower.includes('cap') || placementLower.includes('hat');
                } else if (currentCatalogCategory === 'chest') {
                    matchesCategory = placementLower.includes('chest');
                } else if (currentCatalogCategory === 'jacket') {
                    matchesCategory = placementLower.includes('jacket') || placementLower.includes('back');
                } else if (currentCatalogCategory === 'vector') {
                    matchesCategory = serviceLower.includes('vector');
                }

                // Search query matching
                let matchesSearch = true;
                if (searchInput) {
                    matchesSearch = (d.projectName && d.projectName.toLowerCase().includes(searchInput)) ||
                        (d.orderNumber && d.orderNumber.toLowerCase().includes(searchInput)) ||
                        (d.placement && d.placement.toLowerCase().includes(searchInput)) ||
                        (d.fabricType && d.fabricType.toLowerCase().includes(searchInput)) ||
                        (d.clientName && d.clientName.toLowerCase().includes(searchInput)) ||
                        (d.clientCompany && d.clientCompany.toLowerCase().includes(searchInput));
                }

                return matchesCategory && matchesSearch;
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-primary/20 p-8">
                        <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">palette</span>
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">No designs found</h4>
                        <p class="text-xs text-slate-500 mt-1">Try switching categories or clearing your search term.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(item => {
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                const hasDeliverables = item.deliverables && item.deliverables.length > 0;

                return `
                    <div class="p-5 rounded-2xl bg-white dark:bg-card-dark border border-primary/20 dark:border-primary/25 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                        <div>
                            <!-- Design Preview Box -->
                            <div class="relative w-full h-44 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden mb-4 border border-primary/15 dark:border-primary/20 flex items-center justify-center">
                                <img src="${item.previewUrl}" alt="${item.projectName}" onerror="this.src='logo.png'" class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                                <span class="absolute top-2 left-2 px-3 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                                    ${item.orderNumber}
                                </span>
                                <span class="absolute top-2 right-2 px-3 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black">
                                    ${item.fileFormat || 'DST, EMB'}
                                </span>
                            </div>

                            <!-- Design Specs -->
                            <div class="mb-3">
                                <h4 class="font-black text-slate-900 dark:text-white text-base group-hover:text-amber-800 dark:group-hover:text-primary transition-colors">${item.projectName}</h4>
                                <p class="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">${item.placement || 'Standard'} · ${item.sizing || 'Standard Dimensions'}</p>
                                <div class="flex flex-wrap gap-1.5 mt-2">
                                    <span class="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-primary/10 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/20 text-[10px] font-bold">
                                        ${item.fabricType || 'Standard Garment'}
                                    </span>
                                    <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                        ${item.serviceType || 'Digitizing'}
                                    </span>
                                </div>
                            </div>

                            <!-- Client Attribution -->
                            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-primary/10 dark:border-primary/15 mb-4 text-xs flex items-center justify-between">
                                <div>
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Client:</span>
                                    <button onclick="openClientHistoryModal('${item.clientEmail || item.clientName}')" class="font-bold text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-primary text-left cursor-pointer underline decoration-dotted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                        ${item.clientName}
                                    </button>
                                </div>
                                <span class="text-[10px] text-slate-500">${dateStr}</span>
                            </div>
                        </div>

                        <!-- 1-Click Deliverable Downloads -->
                        <div class="pt-3 border-t border-primary/15 dark:border-primary/20 space-y-2">
                            ${hasDeliverables ? `
                                <div class="flex flex-wrap items-center gap-1.5">
                                    ${item.deliverables.map(d => `
                                        <a href="${d.url}" target="_blank" class="flex-1 py-2 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-black transition-all flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                            <span class="material-symbols-outlined text-xs">download</span> ${d.format}
                                        </a>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 text-[11px] text-center font-medium">
                                    Machine files being prepped
                                </div>
                            `}

                            <div class="flex items-center gap-2">
                                <button onclick="openClientHistoryModal('${item.clientEmail || item.clientName}')" class="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">history</span>
                                    <span>Client Dossier</span>
                                </button>
                                <button onclick="openInvoiceModal('${item.orderNumber}')" class="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">receipt</span>
                                    <span>Invoice</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setCatalogCategory(cat) {
            currentCatalogCategory = cat;
            document.querySelectorAll('.catalog-cat-pill').forEach(btn => {
                if (btn.getAttribute('data-cat') === cat) {
                    btn.className = 'catalog-cat-pill px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-xs cursor-pointer whitespace-nowrap';
                } else {
                    btn.className = 'catalog-cat-pill px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer whitespace-nowrap';
                }
            });
            renderDesignCatalog();
        }

        function handleCatalogSearch() {
            renderDesignCatalog();
        }

        /**
         * SECTION 4: RENDER DIGITIZER TEAM & CAPACITY
         */
        function renderDigitizerTeamHub(allOrders, digitizers) {
            const container = document.getElementById('digitizer-team-cards');
            if (!container) return;

            const specs = {
                'Digitizer': { title: 'Lead Embroidery & Vector Digitizer', specialty: 'Industrial Machine & Vector Master', icon: 'military_tech' }
            };

            const teamActiveCount = document.getElementById('team-active-count');
            if (teamActiveCount) teamActiveCount.textContent = digitizers.length === 1 ? '1 Digitizer On Duty' : `${digitizers.length} Digitizers On Duty`;

            container.innerHTML = digitizers.map(d => {
                const assignedOrders = allOrders.filter(o => o.assigned_digitizer_id === d.id && !o.is_quote && o.status !== 'quote_requested' && !(o.order_number && o.order_number.startsWith('QUO-')));
                const activeOrders = assignedOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'revision_requested');
                const completedOrders = assignedOrders.filter(o => o.status === 'completed');
                const spec = specs[d.displayName] || { title: 'Lead Embroidery & Vector Digitizer', specialty: 'Industrial Machine & Vector Master', icon: 'military_tech' };
                const initials = d.displayName === 'Digitizer' ? 'DZ' : d.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                return `
                    <div class="p-5 rounded-2xl bg-white dark:bg-card-dark border border-primary/20 dark:border-primary/25 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                            <div class="admin-team-identity flex items-start justify-between gap-3 mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-primary flex items-center justify-center font-black text-lg">
                                        ${initials}
                                    </div>
                                    <div>
                                        <h4 class="font-black text-slate-900 dark:text-white text-sm">${d.displayName}</h4>
                                        <span class="text-xs text-amber-800 dark:text-primary font-semibold block">${spec.title}</span>
                                        <span class="text-[11px] text-slate-500 font-mono">${d.email}</span>
                                    </div>
                                </div>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                                </span>
                            </div>

                            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-primary/10 dark:border-primary/15 mb-4 text-xs">
                                <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Core Specialization:</span>
                                <strong class="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm text-amber-600">${spec.icon}</span>
                                    <span>${spec.specialty}</span>
                                </strong>
                            </div>

                            <!-- Workload Metrics -->
                            <div class="grid grid-cols-2 gap-2 mb-4 text-center">
                                <div class="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-200/60 dark:border-primary/10">
                                    <span class="text-lg font-black text-amber-800 dark:text-primary block">${activeOrders.length}</span>
                                    <span class="text-[10px] font-bold uppercase text-slate-500">Active Tasks</span>
                                </div>
                                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-primary/10 dark:border-primary/15">
                                    <span class="text-lg font-black text-emerald-700 dark:text-emerald-400 block">${completedOrders.length}</span>
                                    <span class="text-[10px] font-bold uppercase text-slate-500">Completed</span>
                                </div>
                            </div>
                        </div>

                        <!-- 1-Click Action Buttons -->
                        <div class="pt-3 border-t border-primary/15 dark:border-primary/20 flex items-center gap-2">
                            <button onclick="filterByDigitizer('${d.id}', '${d.displayName}')" class="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="View tickets assigned to ${d.displayName}">
                                <span class="material-symbols-outlined text-sm text-amber-700 dark:text-primary">filter_alt</span>
                                <span>View Orders (${assignedOrders.length})</span>
                            </button>
                            <button onclick="openAssignModal(null, '${d.id}')" class="py-2 px-3 rounded-xl bg-amber-100 dark:bg-primary/15 hover:bg-amber-200 dark:hover:bg-primary text-amber-900 dark:text-primary hover:text-amber-950 dark:hover:text-background-dark border border-amber-300 dark:border-primary/30 font-bold text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Assign a ticket directly to ${d.displayName}">
                                Assign
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getPaymentBadge(status) {
            if (status === 'paid') {
                return '<span class="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold leading-none shrink-0" style="white-space: nowrap !important;"><span class="material-symbols-outlined text-[12px]">check_circle</span> Paid</span>';
            } else {
                return '<span class="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[10px] font-black leading-none shrink-0" style="white-space: nowrap !important;"><span class="material-symbols-outlined text-[12px]">schedule</span> Payment Due</span>';
            }
        }

        function formatTimeAgo(isoString) {
            if (!isoString) return '';
            const diffMs = Date.now() - new Date(isoString).getTime();
            const diffSec = Math.floor(diffMs / 1000);
            if (diffSec < 60) return 'just now';
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 60) return `${diffMin} min ago`;
            const diffHr = Math.floor(diffMin / 60);
            if (diffHr < 24) return `${diffHr}h ago`;
            return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

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

        function getStatusBadge(status) {
            switch(status) {
                case 'completed':
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/35 text-[11px] font-bold leading-none shrink-0" style="white-space: nowrap !important;">Completed</span>';
                case 'in_progress':
                case 'in_production':
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-500/35 text-[11px] font-bold leading-none shrink-0" style="white-space: nowrap !important;"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production</span>';
                case 'assigned':
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/35 text-[11px] font-black leading-none shrink-0" style="white-space: nowrap !important;"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Assigned (New)</span>';
                case 'revision_requested':
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/25 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 text-[11px] font-black leading-none shrink-0" style="white-space: nowrap !important;"><span class="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping mr-0.5"></span> Revision</span>';
                case 'quote_requested':
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-500/35 text-[11px] font-bold leading-none shrink-0" style="white-space: nowrap !important;">Quote Requested</span>';
                case 'new':
                case 'pending_review':
                default:
                    return '<span class="whitespace-nowrap inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-500/35 text-[11px] font-bold leading-none shrink-0" style="white-space: nowrap !important;">New Order</span>';
            }
        }

        // ===== ADMIN REVISION DETAILS MODAL LOGIC =====
        function openAdminRevisionModal(orderNumber) {
            const allOrders = window.insforgeClient.getOrders();
            const order = allOrders.find(o => o.order_number === orderNumber);
            if (!order) return;

            document.getElementById('admin-revision-subtitle').textContent = `Order #${order.order_number} · ${order.client_name} (${order.project_name})`;
            document.getElementById('admin-revision-notes').textContent = order.revision_notes || order.revisionNotes || 'No specific notes recorded.';
            document.getElementById('admin-revision-worker').textContent = order.assigned_digitizer_name || 'Unassigned';

            const reassignBtn = document.getElementById('admin-revision-reassign-btn');
            if (reassignBtn) {
                reassignBtn.onclick = () => {
                    closeAdminRevisionModal();
                    openAssignModal(order.order_number);
                };
            }

            const photosContainer = document.getElementById('admin-revision-photos');
            if (order.stitch_out_photos && order.stitch_out_photos.length > 0) {
                photosContainer.innerHTML = order.stitch_out_photos.map(p => `
                    <div class="relative group">
                        <a href="${p.url}" target="_blank">
                            <img src="${p.url}" alt="${p.name || 'Stitch out photo'}" class="w-24 h-24 object-cover rounded-xl border border-amber-300 dark:border-amber-500/40 shadow-xs hover:scale-105 transition-transform" />
                        </a>
                        <span class="text-[10px] text-slate-500 block mt-1">${p.name || 'Photo'}</span>
                    </div>
                `).join('');
            } else {
                photosContainer.innerHTML = '<p class="text-xs text-slate-400 italic">No garment photo attached by client.</p>';
            }

            document.getElementById('admin-revision-modal').classList.remove('hidden');
        }

        function closeAdminRevisionModal() {
            const modal = document.getElementById('admin-revision-modal');
            if (modal) modal.classList.add('hidden');
        }

        function openAdminAccountModal() {
            document.getElementById('admin-account-modal').classList.remove('hidden');
        }

        function closeAdminAccountModal() {
            document.getElementById('admin-account-modal').classList.add('hidden');
        }

        // ===== SEND PAYMENT REMINDER MODAL LOGIC =====
        let currentReminderOrderNumber = null;

        function openPaymentReminderModal(orderNumber) {
            const allOrders = window.insforgeClient.getOrders();
            const order = allOrders.find(o => o.order_number === orderNumber);
            if (!order) return;

            currentReminderOrderNumber = orderNumber;
            document.getElementById('reminder-order-number').value = orderNumber;
            document.getElementById('reminder-order-display').textContent = orderNumber;
            document.getElementById('reminder-project-display').textContent = `${order.project_name} · ${order.placement || 'Standard'}`;
            const price = Number(order.price || 15).toFixed(2);
            document.getElementById('reminder-amount-display').textContent = `$${price}`;
            document.getElementById('reminder-recipient-display').textContent = `${order.client_name} <${order.client_email}>`;

            document.getElementById('reminder-subject').value = `Payment Reminder: Outstanding Invoice for Order #${orderNumber} - Dezan Digitizing`;
            document.getElementById('reminder-message').value =
`Dear ${order.client_name},

This is a friendly reminder from Dezan Digitizing regarding your pending invoice for Order #${orderNumber} (${order.project_name}) in the amount of $${price}.

Your digitized stitch files are being prepped for production. Please log into your Dezan Client Portal to settle this invoice securely via PayPal or Credit Card:
https://dezan-digitizing.vercel.app/client-portal.html

Order Details:
• Order Number: #${orderNumber}
• Design Name: ${order.project_name}
• Total Balance Due: $${price} USD

If you have already submitted payment or have any questions regarding your stitch specs, please let us know.

Warm regards,
Felix Dezan
Master Digitizer & Founder, Dezan Digitizing
Email: fdezan91@gmail.com`;

            const historyEl = document.getElementById('reminder-history-status');
            if (historyEl) {
                if (order.last_payment_reminder_at) {
                    historyEl.textContent = `Sent ${formatTimeAgo(order.last_payment_reminder_at)} (Total: ${order.reminder_count || 1} reminder${(order.reminder_count || 1) > 1 ? 's' : ''})`;
                    historyEl.className = 'font-bold text-amber-700 dark:text-primary';
                } else {
                    historyEl.textContent = 'Never reminded';
                    historyEl.className = 'font-semibold text-slate-500';
                }
            }

            document.getElementById('payment-reminder-modal').classList.remove('hidden');
        }

        function closePaymentReminderModal() {
            const modal = document.getElementById('payment-reminder-modal');
            if (modal) modal.classList.add('hidden');
            currentReminderOrderNumber = null;
        }

        async function handleSendReminderSubmit(e) {
            e.preventDefault();
            const sendBtn = document.getElementById('reminder-send-btn');
            const originalText = sendBtn ? sendBtn.innerHTML : '';
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Sending Email...';
            }

            const orderNumber = document.getElementById('reminder-order-number').value;
            const customNote = document.getElementById('reminder-message').value;

            try {
                const result = await window.insforgeClient.sendPaymentReminder(orderNumber, customNote);
                closePaymentReminderModal();
                await renderAllAdminData();

                window.insforgeClient.showToast(
                    'Reminder Email Dispatched',
                    `Payment reminder sent to ${result.clientEmail} for ${orderNumber}.`,
                    'mark_email_read',
                    'success'
                );
            } catch (err) {
                console.error('Reminder error:', err);
                alert(`⚠️ Failed to send reminder: ${err.message}`);
            } finally {
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = originalText;
                }
            }
        }

        // ===== SET QUOTE PRICE MODAL LOGIC =====
        let currentQuoteOrderNumber = null;

        function openSetQuotePriceModal(orderNumber) {
            const allOrders = window.insforgeClient.getOrders();
            const order = allOrders.find(o => o.order_number === orderNumber || o.id === orderNumber);
            if (!order) return;

            currentQuoteOrderNumber = order.order_number;
            document.getElementById('quote-modal-order-number').value = order.order_number;
            document.getElementById('quote-modal-order-display').textContent = order.order_number;
            document.getElementById('quote-modal-project-display').textContent = order.project_name || 'Custom Project';
            document.getElementById('quote-modal-client-display').textContent = `${order.client_name || 'Client'} (${order.client_email || 'No email'})`;
            document.getElementById('quote-modal-service-display').textContent = order.service_type || 'Digitizing';

            document.getElementById('quote-modal-placement').textContent = order.placement || 'Standard';
            document.getElementById('quote-modal-size').textContent = order.sizing || 'Standard';
            document.getElementById('quote-modal-fabric').textContent = order.fabric_type || 'Standard';
            document.getElementById('quote-modal-formats').textContent = order.file_format || 'DST, EMB';
            document.getElementById('quote-modal-instructions').textContent = order.instructions || 'None provided';

            // Artwork links
            const artworkContainer = document.getElementById('quote-modal-artwork-link-container');
            if (artworkContainer) {
                if (order.raw_artwork_files && order.raw_artwork_files.length > 0) {
                    artworkContainer.innerHTML = order.raw_artwork_files.map(f => `
                        <a href="${f.url}" target="_blank" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 text-[10px] font-bold hover:underline">
                            <span class="material-symbols-outlined text-[12px]">download</span> Artwork
                        </a>
                    `).join(' ');
                } else {
                    artworkContainer.innerHTML = '<span class="text-[10px] text-slate-400">No artwork attached</span>';
                }
            }

            // Default price or existing price
            const priceInput = document.getElementById('quote-modal-price-input');
            if (priceInput) {
                priceInput.value = (order.price && Number(order.price) > 0) ? Number(order.price).toFixed(2) : '15.00';
            }

            // Existing notes if any
            const notesInput = document.getElementById('quote-modal-notes-input');
            if (notesInput) {
                notesInput.value = order.quote_admin_notes || '';
            }

            document.getElementById('set-quote-price-modal').classList.remove('hidden');
        }

        function closeSetQuotePriceModal() {
            const modal = document.getElementById('set-quote-price-modal');
            if (modal) modal.classList.add('hidden');
            currentQuoteOrderNumber = null;
        }

        async function handleSetQuotePriceSubmit(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('quote-modal-submit-btn');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Saving & Notifying Client...';
            }

            const orderNumber = document.getElementById('quote-modal-order-number').value;
            const priceVal = parseFloat(document.getElementById('quote-modal-price-input').value);
            const notesVal = document.getElementById('quote-modal-notes-input').value.trim();

            try {
                const success = await window.insforgeClient.updateQuotePrice(orderNumber, priceVal, notesVal);
                if (success) {
                    closeSetQuotePriceModal();
                    await renderAllAdminData();
                    window.insforgeClient.showToast(
                        'Quote Price Assigned',
                        `Price of $${priceVal.toFixed(2)} set for ${orderNumber}. Client notified live.`,
                        'price_change',
                        'success'
                    );
                } else {
                    alert('Could not update quote price. Please check console for details.');
                }
            } catch (err) {
                console.error('Error updating quote price:', err);
                alert('Error updating quote price: ' + err.message);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        }

        function openAssignModal(orderNumber, preselectedWorkerId) {
            const allOrders = window.insforgeClient.getOrders();
            let targetOrder = null;

            if (orderNumber) {
                targetOrder = allOrders.find(o => o.order_number === orderNumber);
                if (targetOrder && (targetOrder.is_quote || targetOrder.status === 'quote_requested' || (targetOrder.order_number && targetOrder.order_number.startsWith('QUO-')))) {
                    alert('Quotes can only be sent to and reviewed by Admin. Digitizers only receive approved production orders.');
                    return;
                }
            } else {
                targetOrder = allOrders.find(o => !o.is_quote && o.status !== 'quote_requested' && !(o.order_number && o.order_number.startsWith('QUO-')) && (!o.assigned_digitizer_id || o.status === 'pending_review')) 
                    || allOrders.find(o => !o.is_quote && o.status !== 'quote_requested' && !(o.order_number && o.order_number.startsWith('QUO-')));
            }

            if (!targetOrder) {
                alert('No production orders available to assign.');
                return;
            }

            document.getElementById('assign-order-number').value = targetOrder.order_number;
            document.getElementById('assign-order-display').textContent = targetOrder.order_number;
            document.getElementById('assign-order-desc').textContent = `${targetOrder.project_name} (${targetOrder.placement || 'Standard'}) · Client: ${targetOrder.client_name}`;

            const select = document.getElementById('assign-worker-select');
            const digitizers = window.insforgeClient.getDigitizers();

            select.innerHTML = digitizers.map(d => {
                const isSelected = preselectedWorkerId ? (d.id === preselectedWorkerId) : (targetOrder.assigned_digitizer_id === d.id);
                return `
                    <option value="${d.id}" data-name="${d.displayName}" ${isSelected ? 'selected' : ''}>
                        ${d.displayName} (${d.email})
                    </option>
                `;
            }).join('');

            document.getElementById('assign-modal').classList.remove('hidden');
        }

        function closeAssignModal() {
            document.getElementById('assign-modal').classList.add('hidden');
        }

        async function handleAssignSubmit(e) {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xs">sync</span> Assigning...';
            }

            const orderNumber = document.getElementById('assign-order-number').value;

            // Strict protection: quotes cannot be assigned to digitizers
            if (orderNumber && orderNumber.startsWith('QUO-')) {
                alert('Quotes cannot be assigned to digitizers. Only approved orders can be assigned.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            const select = document.getElementById('assign-worker-select');
            const selectedOpt = select.options[select.selectedIndex];
            const workerId = selectedOpt.value;
            const workerName = selectedOpt.getAttribute('data-name');

            // Global safeguard against stale cached scripts:
            const computedTaskNumber = 'TSK-' + (orderNumber || '').replace('ORD-', '').replace('DZ-', '');
            if (typeof window !== 'undefined') {
                window.taskNumber = computedTaskNumber;
            }

            try {
                await window.insforgeClient.assignDigitizer(orderNumber, workerId, workerName);
                closeAssignModal();
                await renderAllAdminData();
                window.insforgeClient.showToast('Worker Dispatched', `Order ${orderNumber} assigned to ${workerName}.`, 'person_check', 'success');

                // Broadcast live notifications to Digitizer and Client
                if (window.dezanNotificationEngine) {
                    window.dezanNotificationEngine.broadcastToRole('digitizer', {
                        orderId: orderNumber,
                        type: 'task_assigned',
                        category: 'assigned',
                        title: 'New Digitizing Task Assigned',
                        message: `Order #${orderNumber} assigned to your workbench by Admin. Turnaround 12-24h.`,
                        meta: 'Active Task · Needle 75/11 · Format: DST, EMB',
                        actionLabel: 'Open Workbench',
                        actionType: 'open_task',
                        accent: 'blue',
                        icon: 'precision_manufacturing'
                    });
                    window.dezanNotificationEngine.broadcastToRole('client', {
                        orderId: orderNumber,
                        type: 'in_production',
                        category: 'production',
                        title: 'Your Order is Now in Production',
                        message: `Master digitizer assigned to #${orderNumber}. Stitch simulation in progress.`,
                        meta: 'In Production · Turnaround 12-24h',
                        actionLabel: 'Track Progress',
                        actionType: 'track_order',
                        accent: 'blue',
                        icon: 'pending_actions'
                    });
                }
            } catch (err) {
                console.error('Assignment error:', err);
                // Self-healing fallback if any stale cached script threw a taskNumber ReferenceError
                if (err && err.message && (err.message.includes('taskNumber') || err.message.includes('variable'))) {
                    try {
                        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                        const order = allOrders.find(o => o.order_number === orderNumber);
                        const assignedAt = new Date().toISOString();
                        if (order) {
                            order.assigned_digitizer_id = workerId;
                            order.assigned_digitizer_name = workerName;
                            order.assigned_at = assignedAt;
                            order.status = 'in_progress';
                            localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
                        }
                        const allTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
                        const taskIdx = allTasks.findIndex(t => t.order_number === orderNumber || t.orderNumber === orderNumber);
                        if (taskIdx >= 0) {
                            allTasks[taskIdx].assigned_digitizer_id = workerId;
                            allTasks[taskIdx].status = 'in_progress';
                            allTasks[taskIdx].assigned_at = assignedAt;
                            allTasks[taskIdx].task_number = computedTaskNumber;
                        } else {
                            allTasks.unshift({
                                id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'tsk-' + Date.now(),
                                task_number: computedTaskNumber,
                                order_number: orderNumber,
                                assigned_digitizer_id: workerId,
                                status: 'in_progress',
                                assigned_at: assignedAt
                            });
                        }
                        localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));

                        closeAssignModal();
                        await renderAllAdminData();
                        if (window.insforgeClient && typeof window.insforgeClient.showToast === 'function') {
                            window.insforgeClient.showToast('Worker Dispatched', `Order ${orderNumber} assigned to ${workerName}.`, 'person_check', 'success');
                        }
                        return;
                    } catch (fallbackErr) {
                        console.error('Fallback assignment error:', fallbackErr);
                    }
                }
                alert(`⚠️ Error assigning worker: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        }

        // ===== AUTO-ASSIGN WORKER ENGINE (1-WORKER DIRECT ROUTING) =====
        function updateAdminAutoAssignUI() {
            if (!window.insforgeClient) return;
            const isEnabled = window.insforgeClient.isAutoAssignWorkerEnabled();
            const primaryWorker = window.insforgeClient.getPrimaryWorker ? window.insforgeClient.getPrimaryWorker() : { displayName: 'Digitizer' };

            // 1. Top bar button (#admin-auto-assign-btn)
            const topBtn = document.getElementById('admin-auto-assign-btn');
            const topIcon = document.getElementById('admin-auto-assign-icon');
            const topLabel = document.getElementById('admin-auto-assign-label');
            if (topBtn && topIcon && topLabel) {
                if (isEnabled) {
                    topBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20';
                    topIcon.textContent = 'smart_toy';
                    topIcon.className = 'material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400';
                    topLabel.textContent = 'Auto-Assign: ON';
                    topBtn.setAttribute('title', `Auto-assignment is ON. New bookings automatically route to ${primaryWorker.displayName}. Click to turn OFF.`);
                } else {
                    topBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700';
                    topIcon.textContent = 'toggle_off';
                    topIcon.className = 'material-symbols-outlined text-sm text-slate-500 dark:text-slate-400';
                    topLabel.textContent = 'Auto-Assign: OFF';
                    topBtn.setAttribute('title', 'Auto-assignment is OFF. New bookings wait for manual admin review. Click to turn ON.');
                }
            }

            // 2. Header bar button (#header-auto-assign-btn)
            const headerBtn = document.getElementById('header-auto-assign-btn');
            const headerIcon = document.getElementById('header-auto-assign-icon');
            const headerText = document.getElementById('header-auto-assign-text');
            if (headerBtn && headerIcon && headerText) {
                if (isEnabled) {
                    headerBtn.className = 'px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
                    headerIcon.textContent = 'bolt';
                    headerIcon.className = 'material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400';
                    headerText.textContent = 'Auto-Assign: ON';
                } else {
                    headerBtn.className = 'px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
                    headerIcon.textContent = 'bolt';
                    headerIcon.className = 'material-symbols-outlined text-sm text-slate-500 dark:text-slate-400';
                    headerText.textContent = 'Auto-Assign: OFF';
                }
            }

            // 3. Stage 1 Banner (#stage-auto-assign-strip)
            const stripIcon = document.getElementById('auto-assign-strip-icon');
            const stripText = document.getElementById('auto-assign-strip-text');
            const stripBtnText = document.getElementById('auto-assign-strip-btn-text');
            if (stripIcon && stripText && stripBtnText) {
                if (isEnabled) {
                    stripIcon.textContent = 'bolt';
                    stripIcon.className = 'material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400';
                    stripText.textContent = `Auto-assignment is ACTIVE. New bookings skip admin approval and route directly to ${primaryWorker.displayName}.`;
                    stripBtnText.textContent = 'Turn OFF';
                } else {
                    stripIcon.textContent = 'toggle_off';
                    stripIcon.className = 'material-symbols-outlined text-sm text-amber-600 dark:text-primary';
                    stripText.textContent = 'Auto-assignment: OFF — Incoming bookings require admin approval before reaching worker.';
                    stripBtnText.textContent = 'Turn ON Auto-Assign';
                }
            }

            // 4. Batch Assign Button (#assign-all-pending-btn)
            const allOrders = (window.insforgeClient.getOrders ? window.insforgeClient.getOrders() : []);
            const unassignedOrders = allOrders.filter(o => !o.is_quote && o.status !== 'completed' && o.status !== 'cancelled' && (!o.assigned_digitizer_id || o.status === 'pending_review'));
            const batchBtn = document.getElementById('assign-all-pending-btn');
            const batchLabel = document.getElementById('assign-all-pending-label');
            if (batchBtn && batchLabel) {
                if (unassignedOrders.length > 0) {
                    batchBtn.classList.remove('hidden');
                    batchLabel.textContent = unassignedOrders.length > 1 ? `Assign ${unassignedOrders.length} to Digitizer` : 'Assign All to Digitizer';
                } else {
                    batchBtn.classList.add('hidden');
                }
            }
        }

        function toggleAdminAutoAssign() {
            if (!window.insforgeClient) return;
            const current = window.insforgeClient.isAutoAssignWorkerEnabled();
            const next = !current;
            window.insforgeClient.setAutoAssignWorkerEnabled(next);
            updateAdminAutoAssignUI();
            const worker = window.insforgeClient.getPrimaryWorker ? window.insforgeClient.getPrimaryWorker() : { displayName: 'Digitizer' };
            if (next) {
                window.insforgeClient.showToast(
                    '⚡ Auto-Assign Activated',
                    `New bookings will now be assigned directly to ${worker.displayName} without requiring admin review.`,
                    'smart_toy',
                    'success'
                );
            } else {
                window.insforgeClient.showToast(
                    'Auto-Assign Disabled',
                    'New orders will now pause in "Needs attention" until manually approved and assigned by an admin.',
                    'tune',
                    'info'
                );
            }
        }

        async function autoAssignAllPendingOrders() {
            if (!window.insforgeClient) return;
            const btn = document.getElementById('assign-all-pending-btn');
            const origHTML = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xs">sync</span> Assigning...';
            }

            try {
                const count = await window.insforgeClient.autoAssignAllPendingOrders();
                const worker = window.insforgeClient.getPrimaryWorker ? window.insforgeClient.getPrimaryWorker() : { displayName: 'Digitizer' };
                if (count > 0) {
                    window.insforgeClient.showToast(
                        'Orders Dispatched',
                        `Assigned ${count} pending order${count > 1 ? 's' : ''} directly to ${worker.displayName}.`,
                        'bolt',
                        'success'
                    );
                } else {
                    window.insforgeClient.showToast(
                        'All Caught Up',
                        'No unassigned pending orders found.',
                        'check_circle',
                        'info'
                    );
                }
                await renderAllAdminData();
            } catch (err) {
                console.error('Error auto-assigning pending orders:', err);
                window.insforgeClient.showToast('Assignment Error', err.message, 'error', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHTML;
                }
            }
        }

        window.updateAdminAutoAssignUI = updateAdminAutoAssignUI;
        window.toggleAdminAutoAssign = toggleAdminAutoAssign;
        window.autoAssignAllPendingOrders = autoAssignAllPendingOrders;

        // ===== 1-CLICK OFFICIAL TAX INVOICE GENERATOR =====
        function openInvoiceModal(orderNumber) {
            const allOrders = window.insforgeClient.getOrders();
            const order = allOrders.find(o => o.order_number === orderNumber);
            if (!order) return;

            const invoiceDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const isCompleted = order.status === 'completed';
            const deliverables = order.deliverables || [];

            const container = document.getElementById('invoice-dynamic-content');
            container.innerHTML = `
                <!-- Invoice Header -->
                <div class="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
                    <div>
                        <div class="flex items-center gap-2.5 mb-1.5">
                            <div class="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">D</div>
                            <h2 class="text-xl font-black tracking-tight text-slate-950">DEZAN DIGITIZING</h2>
                        </div>
                        <p class="text-xs font-semibold text-amber-800 tracking-wide uppercase">Premium Embroidery Digitizing & Vector Conversion</p>
                        <p class="text-[11px] text-slate-500 mt-1">Operating since 2016 · Worldwide Service</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">PAID · PayPal</span>
                        <div class="font-mono text-sm font-black text-slate-900">INV-${order.order_number.replace('ORD-', '')}</div>
                        <p class="text-xs text-slate-500 mt-0.5">Date: ${invoiceDate}</p>
                    </div>
                </div>

                <!-- Addresses / Metadata Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                    <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed From</span>
                        <strong class="font-bold text-slate-900 block text-sm">Dezan Digitizing Global Studio</strong>
                        <p class="text-slate-600 mt-0.5">Bahria Town Phase 7, Rawalpindi</p>
                        <p class="text-slate-600">Email: fdezan91@gmail.com</p>
                        <p class="text-slate-600">Website: https://dezan-digitizing.vercel.app</p>
                    </div>
                    <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To (Customer)</span>
                        <strong class="font-bold text-slate-900 block text-sm">${order.client_name || 'Valued Customer'}</strong>
                        <p class="text-slate-600 mt-0.5">${order.client_company ? order.client_company + ' · ' : ''}${order.client_email}</p>
                        <p class="text-slate-500 mt-0.5 font-mono text-[11px]">Client ID: #${order.client_id ? order.client_id.slice(-6).toUpperCase() : 'DEZAN-CLIENT'}</p>
                        <p class="text-slate-500 font-mono text-[11px]">Ticket ID: ${order.order_number}</p>
                    </div>
                </div>

                <!-- Itemized Service Table -->
                <div class="py-6 border-b border-slate-200">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th class="pb-2">Description & Technical Specifications</th>
                                <th class="pb-2 text-center">Format</th>
                                <th class="pb-2 text-right">Qty</th>
                                <th class="pb-2 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr>
                                <td class="py-3">
                                    <strong class="text-slate-900 block font-bold text-xs">${order.project_name}</strong>
                                    <p class="text-slate-600 text-[11px] mt-0.5">${order.service_type || 'Custom Digitizing'} · ${order.placement || 'Left Chest'} (${order.sizing || 'Standard'})</p>
                                    <p class="text-slate-500 text-[10px] italic mt-1">${order.instructions ? `Specs: "${order.instructions}"` : 'Standard high-density industrial stitch count specs.'}</p>
                                </td>
                                <td class="py-3 text-center font-mono font-semibold text-slate-700">${order.file_format || 'DST, EMB'}</td>
                                <td class="py-3 text-right font-medium text-slate-600">1</td>
                                <td class="py-3 text-right font-bold text-slate-900">$${(order.price || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Financial Calculation Summary -->
                <div class="py-6 border-b border-slate-200 flex justify-end">
                    <div class="w-full sm:w-64 space-y-1.5 text-xs">
                        <div class="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span class="font-semibold text-slate-900">$${(order.price || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Tax / Export Duty (0%)</span>
                            <span class="font-semibold text-slate-900">$0.00</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Payment Method</span>
                            <span class="font-semibold text-slate-900">${order.payment_method || 'PayPal Secure'}</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-950">
                            <span>Total Paid</span>
                            <span class="text-amber-700 font-bold">$${(order.price || 0).toFixed(2)} USD</span>
                        </div>
                    </div>
                </div>

                <!-- Deliverables & Quality Certification -->
                <div class="pt-6 text-xs">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Production Deliverables & Quality Audit</span>
                    ${isCompleted && deliverables.length > 0 ? `
                        <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                            <div class="flex items-center gap-1.5 text-emerald-900 font-bold mb-2">
                                <span class="material-symbols-outlined text-sm text-emerald-700">verified</span>
                                <span>Production Machine Files Verified & Ready</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${deliverables.map(d => `
                                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-[11px] font-bold">
                                        <span class="material-symbols-outlined text-xs text-emerald-600">download</span>
                                        <span>${d.name} (${d.format})</span>
                                    </span>
                                `).join('')}
                            </div>
                            <p class="text-[10px] text-emerald-700 mt-2">Tested against industrial Tajima & Barudan thread tension parameters.</p>
                        </div>
                    ` : `
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-slate-600 text-[11px]">
                            <span class="font-bold text-slate-800">Status: ${order.status === 'in_progress' ? 'In Production with Digitizer' : 'Pending Digitizer Assignment'}</span>
                            <p class="text-[10px] text-slate-500 mt-0.5">Deliverable stitch files will appear on this official receipt once quality inspection is passed.</p>
                        </div>
                    `}

                    <div class="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                        <span>Thank you for choosing Dezan Digitizing for your embroidery artwork!</span>
                        <span class="font-mono font-semibold">Authorized By: Felix Dezan (Head Digitizer)</span>
                    </div>
                </div>
            `;

            document.getElementById('invoice-modal').classList.remove('hidden');
        }

        function closeInvoiceModal() {
            document.getElementById('invoice-modal').classList.add('hidden');
        }

        // ===== COMPREHENSIVE ADMIN ORDER DETAILS & IN-DASHBOARD ARTWORK LIGHTBOX =====
        let currentPreviewOrder = null;
        let currentPreviewFileIndex = 0;
        let currentPreviewFiles = [];
        let currentPreviewSourceType = 'artwork';

        function openArtworkPreviewModal(orderNumber, fileIndex = 0, sourceType = 'artwork') {
            const allOrders = window.insforgeClient ? window.insforgeClient.getOrders() : [];
            const order = allOrders.find(o => o.order_number === orderNumber);
            if (!order) {
                console.warn('Order not found for preview:', orderNumber);
                return;
            }

            let files = [];
            if (sourceType === 'deliverables') {
                files = order.deliverables || [];
            } else {
                files = getOrderArtworkFiles(order);
            }

            if (!files || files.length === 0) {
                const title = sourceType === 'deliverables' ? 'No Deliverables' : 'No Artwork';
                const msg = sourceType === 'deliverables' ? 'No deliverables are attached to this order yet.' : 'No artwork files are attached to this order.';
                if (window.insforgeClient && typeof window.insforgeClient.showToast === 'function') {
                    window.insforgeClient.showToast(title, msg, 'info', 'info');
                } else {
                    alert(msg);
                }
                return;
            }

            currentPreviewOrder = order;
            currentPreviewFiles = files;
            currentPreviewSourceType = sourceType;
            currentPreviewFileIndex = Math.max(0, Math.min(fileIndex, files.length - 1));

            updateArtworkLightboxDisplay();

            const modal = document.getElementById('admin-artwork-preview-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }

        function updateArtworkLightboxDisplay() {
            if (!currentPreviewFiles || currentPreviewFiles.length === 0) return;
            const file = currentPreviewFiles[currentPreviewFileIndex];
            if (!file) return;

            const fileName = file.name || ('Artwork_' + (currentPreviewFileIndex + 1));
            const fileUrl = file.url || '#';
            const ext = (getFileExtension(fileName) || getFileExtension(fileUrl) || 'FILE').toUpperCase();
            const fileSizeText = file.size ? formatFileSize(file.size) : '';

            // Update UI elements
            const modalFilename = document.getElementById('artwork-preview-modal-filename');
            const modalFilesize = document.getElementById('artwork-preview-modal-filesize');
            const formatBadge = document.getElementById('artwork-preview-format-badge');
            const counter = document.getElementById('artwork-preview-counter');
            const prevBtn = document.getElementById('artwork-preview-prev-btn');
            const nextBtn = document.getElementById('artwork-preview-next-btn');
            const downloadBtn = document.getElementById('artwork-preview-download-btn');
            const navControls = document.getElementById('artwork-preview-nav-controls');

            const imgContainer = document.getElementById('artwork-preview-image-container');
            const previewImg = document.getElementById('artwork-preview-img');
            const pdfContainer = document.getElementById('artwork-preview-pdf-container');
            const pdfIframe = document.getElementById('artwork-preview-pdf-iframe');
            const fallbackContainer = document.getElementById('artwork-preview-fallback-container');
            const fallbackFilename = document.getElementById('artwork-fallback-filename');
            const fallbackExt = document.getElementById('artwork-fallback-ext');
            const fallbackBtnExt = document.getElementById('artwork-fallback-btn-ext');
            const fallbackDownloadBtn = document.getElementById('artwork-fallback-download-btn');

            if (modalFilename) modalFilename.textContent = fileName;
            if (modalFilesize) {
                const typeLabel = currentPreviewSourceType === 'deliverables' ? 'Production Deliverable' : 'Artwork Asset';
                const orderInfo = currentPreviewOrder?.order_number ? ` · Order ${currentPreviewOrder.order_number}` : '';
                modalFilesize.textContent = (fileSizeText ? `${fileSizeText} · ${typeLabel}${orderInfo}` : `${typeLabel}${orderInfo}`);
            }
            if (formatBadge) formatBadge.textContent = ext;
            if (downloadBtn) {
                downloadBtn.href = fileUrl;
                downloadBtn.download = fileName;
            }

            // Pager controls
            if (currentPreviewFiles.length > 1) {
                if (navControls) navControls.classList.remove('hidden');
                if (counter) counter.textContent = `${currentPreviewFileIndex + 1} / ${currentPreviewFiles.length}`;
                if (prevBtn) prevBtn.disabled = currentPreviewFileIndex === 0;
                if (nextBtn) nextBtn.disabled = currentPreviewFileIndex === currentPreviewFiles.length - 1;
            } else {
                if (navControls) navControls.classList.add('hidden');
            }

            // Decide renderer
            const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF', 'BMP', 'ICO'].includes(ext);
            const isPdf = ext === 'PDF';

            if (imgContainer) imgContainer.classList.add('hidden');
            if (pdfContainer) pdfContainer.classList.add('hidden');
            if (fallbackContainer) fallbackContainer.classList.add('hidden');

            if (isImg) {
                if (previewImg) {
                    previewImg.src = fileUrl;
                    previewImg.alt = fileName;
                }
                if (imgContainer) imgContainer.classList.remove('hidden');
            } else if (isPdf) {
                if (pdfIframe) {
                    pdfIframe.src = fileUrl;
                }
                if (pdfContainer) pdfContainer.classList.remove('hidden');
            } else {
                // Non-previewable formats (AI, EPS, CDR, PSD, ZIP, DST, EMB, PES, etc.)
                if (fallbackFilename) fallbackFilename.textContent = fileName;
                if (fallbackExt) fallbackExt.textContent = ext;
                if (fallbackBtnExt) fallbackBtnExt.textContent = ext;
                if (fallbackDownloadBtn) {
                    fallbackDownloadBtn.href = fileUrl;
                    fallbackDownloadBtn.download = fileName;
                }
                if (fallbackContainer) fallbackContainer.classList.remove('hidden');
            }
        }

        function navigateArtworkPreview(direction) {
            if (!currentPreviewFiles || currentPreviewFiles.length <= 1) return;
            const newIndex = currentPreviewFileIndex + direction;
            if (newIndex >= 0 && newIndex < currentPreviewFiles.length) {
                currentPreviewFileIndex = newIndex;
                updateArtworkLightboxDisplay();
            }
        }

        function closeArtworkPreviewModal() {
            const modal = document.getElementById('admin-artwork-preview-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
            const pdfIframe = document.getElementById('artwork-preview-pdf-iframe');
            if (pdfIframe) pdfIframe.src = '';
            const previewImg = document.getElementById('artwork-preview-img');
            if (previewImg) previewImg.src = '';

            const orderModal = document.getElementById('admin-order-details-modal');
            if (!orderModal || orderModal.classList.contains('hidden')) {
                document.body.style.overflow = '';
            }
        }

        function openAdminOrderDetailsModal(orderNumber) {
            const allOrders = window.insforgeClient ? window.insforgeClient.getOrders() : [];
            const order = allOrders.find(o => o.order_number === orderNumber);
            if (!order) {
                console.warn('Order not found for details modal:', orderNumber);
                return;
            }

            const modal = document.getElementById('admin-order-details-modal');
            if (!modal) return;

            const isPaid = order.payment_status === 'paid';
            const isRush = order.turnaround_speed === 'rush';
            const orderPrice = Number(order.price || 0);
            const basePrice = isRush ? Math.max(0, orderPrice - 5) : orderPrice;

            // Header Elements
            const titleEl = document.getElementById('order-details-modal-title');
            if (titleEl) titleEl.textContent = order.order_number || 'Order Details';

            const statusBadgeEl = document.getElementById('order-details-status-badge');
            if (statusBadgeEl) statusBadgeEl.innerHTML = getStatusBadge(order.status);

            const paymentBadgeEl = document.getElementById('order-details-payment-badge');
            if (paymentBadgeEl) paymentBadgeEl.innerHTML = getPaymentBadge(order.payment_status);

            const turnaroundBadgeEl = document.getElementById('order-details-turnaround-badge');
            if (turnaroundBadgeEl) {
                if (isRush) {
                    turnaroundBadgeEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-500/40 inline-flex items-center gap-1"><span class="material-symbols-outlined text-xs text-amber-600 dark:text-amber-400">bolt</span> Rush (5–8h) · +$5</span>`;
                } else {
                    turnaroundBadgeEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1"><span class="material-symbols-outlined text-xs text-slate-500">schedule</span> Standard (12–24h)</span>`;
                }
            }

            const subtitleEl = document.getElementById('order-details-subtitle');
            if (subtitleEl) {
                const orderDate = order.created_at ? new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent Submission';
                subtitleEl.textContent = `Submitted ${orderDate} · ${order.service_type || 'Digitizing'}`;
            }

            // Section 1: Specifications Bento
            const servicePlanEl = document.getElementById('order-details-service-plan');
            if (servicePlanEl) servicePlanEl.textContent = `${order.service_type || 'Digitizing'}${order.plan_name ? ' — ' + order.plan_name : ''}`;

            const projectNameEl = document.getElementById('order-details-project-name');
            if (projectNameEl) projectNameEl.textContent = order.project_name || 'Embroidery Design';

            const placementEl = document.getElementById('order-details-placement');
            if (placementEl) placementEl.textContent = order.placement || 'Standard / Left Chest';

            const sizingEl = document.getElementById('order-details-sizing');
            if (sizingEl) sizingEl.textContent = order.sizing || 'Standard Dimensions';

            const fabricEl = document.getElementById('order-details-fabric');
            if (fabricEl) fabricEl.textContent = order.fabric_type || 'Standard Garment Fabric';

            // Required Machine Formats
            const formatsContainer = document.getElementById('order-details-formats-container');
            if (formatsContainer) {
                let rawFormats = order.file_format || '.DST, .EMB';
                let formatsList = [];
                if (Array.isArray(rawFormats)) {
                    formatsList = rawFormats;
                } else if (typeof rawFormats === 'string') {
                    formatsList = rawFormats.split(/[,/ ]+/).map(s => s.trim()).filter(Boolean);
                }
                if (formatsList.length === 0) formatsList = ['.DST'];
                formatsContainer.innerHTML = formatsList.map(f => {
                    const cleanF = f.startsWith('.') ? f : ('.' + f);
                    return `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-black border border-slate-200 dark:border-slate-700 shadow-2xs">${cleanF}</span>`;
                }).join('');
            }

            // Special Options (3D Puff, Trims Between Letters, Applique, etc.)
            const specialContainer = document.getElementById('order-details-special-options-container');
            if (specialContainer) {
                let opts = [];
                if (Array.isArray(order.special_options)) {
                    opts = order.special_options;
                } else if (typeof order.special_options === 'string' && order.special_options.trim()) {
                    try {
                        const parsed = JSON.parse(order.special_options);
                        opts = Array.isArray(parsed) ? parsed : [order.special_options];
                    } catch(e) {
                        opts = order.special_options.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (opts.length > 0) {
                    specialContainer.innerHTML = opts.map(opt => `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[11px] font-bold shadow-2xs">
                            <span class="material-symbols-outlined text-[13px] text-amber-600 dark:text-primary">check_circle</span>
                            <span>${opt}</span>
                        </span>
                    `).join('');
                } else {
                    specialContainer.innerHTML = `<span class="text-slate-400 italic text-[11px]">None specified (Standard Flat Stitch)</span>`;
                }
            }

            // Section 2: Turnaround Priority & Rush Fee Box
            const turnaroundDisplay = document.getElementById('order-details-turnaround-display');
            if (turnaroundDisplay) {
                if (isRush) {
                    turnaroundDisplay.innerHTML = `
                        <div class="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-950 dark:text-amber-100">
                            <div class="flex items-center gap-1.5 font-black text-xs">
                                <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">bolt</span>
                                <span>⚡ Rush Service (5–8 Hours Priority Delivery)</span>
                            </div>
                            <p class="text-[11px] text-amber-900 dark:text-amber-300 mt-1 leading-snug">Dispatched directly to the priority express digitizing queue.</p>
                        </div>
                    `;
                } else {
                    turnaroundDisplay.innerHTML = `
                        <div class="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            <div class="flex items-center gap-1.5 font-bold text-xs">
                                <span class="material-symbols-outlined text-slate-500 text-base">schedule</span>
                                <span>Standard Turnaround (12–24 Hours)</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">Standard queue timeline for precision digitizing review.</p>
                        </div>
                    `;
                }
            }

            const rushFeeBox = document.getElementById('order-details-rush-fee-box');
            if (rushFeeBox) {
                if (isRush) {
                    rushFeeBox.classList.remove('hidden');
                } else {
                    rushFeeBox.classList.add('hidden');
                }
            }

            // Client instructions & notes
            const instructionsBox = document.getElementById('order-details-instructions-box');
            if (instructionsBox) {
                if (order.instructions && order.instructions.trim()) {
                    instructionsBox.textContent = order.instructions;
                    instructionsBox.classList.remove('italic', 'text-slate-400');
                } else {
                    instructionsBox.innerHTML = '<span class="text-slate-400 italic">No specific production notes or custom instructions entered by client.</span>';
                }
            }

            // Section 3: Uploaded Artwork Assets Hub
            const files = getOrderArtworkFiles(order);
            const filesCountEl = document.getElementById('order-details-files-count');
            if (filesCountEl) filesCountEl.textContent = files.length;

            const filesGrid = document.getElementById('order-details-artwork-files-grid');
            if (filesGrid) {
                if (files.length === 0) {
                    filesGrid.innerHTML = `
                        <div class="col-span-full p-6 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            <span class="material-symbols-outlined text-2xl text-slate-400 mb-1 block">image_not_supported</span>
                            <span class="text-xs">No artwork files were attached to this order.</span>
                        </div>
                    `;
                } else {
                    filesGrid.innerHTML = files.map((file, idx) => {
                        const ext = (getFileExtension(file.name) || getFileExtension(file.url) || 'FILE').toUpperCase();
                        const canPreview = isBrowserPreviewable(file.url, file.name);
                        const isPdf = ext === 'PDF';
                        const fileSizeText = file.size ? formatFileSize(file.size) : '';

                        let thumbMarkup = '';
                        if (['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF'].includes(ext)) {
                            thumbMarkup = `
                                <div onclick="openArtworkPreviewModal('${order.order_number}', ${idx})" class="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 cursor-pointer flex-shrink-0 group/th relative shadow-2xs" title="Click to view large preview">
                                    <img src="${file.url}" alt="${file.name}" class="w-full h-full object-cover group-hover/th:scale-105 transition-transform" />
                                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/th:opacity-100 flex items-center justify-center transition-opacity">
                                        <span class="material-symbols-outlined text-white text-base">visibility</span>
                                    </div>
                                </div>
                            `;
                        } else if (isPdf) {
                            thumbMarkup = `
                                <div onclick="openArtworkPreviewModal('${order.order_number}', ${idx})" class="w-14 h-14 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 flex flex-col items-center justify-center cursor-pointer flex-shrink-0 group/th shadow-2xs" title="Click to preview PDF document">
                                    <span class="material-symbols-outlined text-xl">picture_as_pdf</span>
                                    <span class="text-[9px] font-black uppercase">PDF</span>
                                </div>
                            `;
                        } else {
                            thumbMarkup = `
                                <div class="w-14 h-14 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                                    <span class="material-symbols-outlined text-xl">folder_zip</span>
                                    <span class="text-[9px] font-black uppercase">${ext}</span>
                                </div>
                            `;
                        }

                        return `
                            <div class="p-3 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/15 flex items-center justify-between gap-3 shadow-2xs">
                                <div class="flex items-center gap-3 min-w-0">
                                    ${thumbMarkup}
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-1.5">
                                            <span class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black font-mono uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${ext}</span>
                                            <h5 class="text-xs font-bold text-slate-900 dark:text-white truncate" title="${file.name}">${file.name}</h5>
                                        </div>
                                        <span class="text-[11px] text-slate-500 block mt-0.5">${fileSizeText ? fileSizeText + ' · ' : ''}${canPreview ? 'Interactive Preview Available' : 'Vector / Production Source'}</span>
                                    </div>
                                </div>

                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                    ${canPreview ? `
                                        <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', ${idx})" class="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-2xs cursor-pointer" title="Preview inside dashboard">
                                            <span class="material-symbols-outlined text-xs">visibility</span>
                                            <span>Preview</span>
                                        </button>
                                    ` : ''}
                                    <a href="${file.url}" download="${file.name}" class="px-2.5 py-1.5 rounded-lg ${canPreview ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700' : 'bg-primary hover:bg-primary-hover text-slate-950 font-black'} text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer" title="Download directly to disk">
                                        <span class="material-symbols-outlined text-xs">download</span>
                                        <span>${canPreview ? '' : 'Download ' + ext}</span>
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // Section 4: Client Profile & Financials
            const clientNameEl = document.getElementById('order-details-client-name');
            if (clientNameEl) clientNameEl.textContent = order.client_name || 'Guest User';

            const clientEmailEl = document.getElementById('order-details-client-email');
            if (clientEmailEl) {
                clientEmailEl.textContent = order.client_email || 'No email';
                clientEmailEl.href = order.client_email ? `mailto:${order.client_email}` : '#';
            }

            const clientCompanyEl = document.getElementById('order-details-client-company');
            if (clientCompanyEl) clientCompanyEl.textContent = order.client_company || 'Independent Business / Individual';

            const clientHistoryBtn = document.getElementById('order-details-client-history-btn');
            if (clientHistoryBtn) {
                clientHistoryBtn.onclick = () => openClientHistoryModal(order.client_email || order.client_name);
            }

            // Financial Breakdown
            const basePriceEl = document.getElementById('order-details-base-price');
            if (basePriceEl) basePriceEl.textContent = `$${basePrice.toFixed(2)}`;

            const rushLineEl = document.getElementById('order-details-rush-line');
            if (rushLineEl) {
                if (isRush) {
                    rushLineEl.classList.remove('hidden');
                } else {
                    rushLineEl.classList.add('hidden');
                }
            }

            const totalPriceEl = document.getElementById('order-details-total-price');
            if (totalPriceEl) totalPriceEl.textContent = `$${orderPrice.toFixed(2)}`;

            const paymentMethodEl = document.getElementById('order-details-payment-method');
            if (paymentMethodEl) {
                paymentMethodEl.textContent = order.payment_method || (isPaid ? 'PayPal / Card' : 'Pending Invoice');
            }

            const transactionIdEl = document.getElementById('order-details-transaction-id');
            if (transactionIdEl) {
                transactionIdEl.textContent = order.paypal_order_id || order.transaction_id || order.stripe_session_id || 'Direct / Pending';
            }

            // Section 5: Digitizer Assignment & Deliverables
            const digitizerNameEl = document.getElementById('order-details-digitizer-name');
            if (digitizerNameEl) {
                if (order.assigned_digitizer_name) {
                    let statusPill = '';
                    if (order.status === 'in_progress' || order.status === 'in_production' || order.started_at) {
                        const startTime = order.started_at ? formatOrderDateTime(order.started_at).time : 'In Progress';
                        statusPill = `<span class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production · Started ${startTime}</span>`;
                    } else if (order.digitizer_viewed_at) {
                        statusPill = `<span class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"><span class="material-symbols-outlined text-[11px] text-emerald-600">visibility</span> Seen ${formatTimeAgo(order.digitizer_viewed_at)}</span>`;
                    } else {
                        statusPill = `<span class="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Not Viewed Yet</span>`;
                    }
                    digitizerNameEl.innerHTML = `<span class="font-bold text-slate-900 dark:text-white">${escapeHtml(order.assigned_digitizer_name)}</span> ${statusPill}`;
                } else {
                    digitizerNameEl.textContent = 'Unassigned (Awaiting Assignment)';
                }
            }

            const assignmentActionsEl = document.getElementById('order-details-assignment-actions');
            if (assignmentActionsEl) {
                assignmentActionsEl.innerHTML = `
                    <button type="button" onclick="openAssignModal('${order.order_number}')" class="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs border border-amber-500/40 cursor-pointer shadow-2xs">
                        ${order.assigned_digitizer_id ? 'Reassign Digitizer' : 'Assign Digitizer'}
                    </button>
                `;
            }

            const deliverablesContainer = document.getElementById('order-details-deliverables-container');
            if (deliverablesContainer) {
                if (order.deliverables && order.deliverables.length > 0) {
                    deliverablesContainer.innerHTML = `
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Production Deliverables (${order.deliverables.length}):</span>
                                <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', 0, 'deliverables')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors cursor-pointer" title="Preview all deliverables in lightbox">
                                    <span class="material-symbols-outlined text-[14px]">visibility</span>
                                    <span>Preview In Lightbox</span>
                                </button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                ${order.deliverables.map((d, idx) => {
                                    const fileName = d.name || `Deliverable_${idx + 1}`;
                                    const ext = (d.format || getFileExtension(fileName) || getFileExtension(d.url) || 'FILE').toUpperCase();
                                    const isPreviewable = ['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext);
                                    const sizeStr = d.size ? formatFileSize(d.size) : '';

                                    let badgeClass = 'bg-slate-700/20 text-slate-300 border-slate-600/40';
                                    if (ext === 'PDF') badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                                    else if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                                    else if (['DST', 'EMB', 'PES', 'EXP', 'JEF', 'VP3'].includes(ext)) badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                                    else if (ext === 'ZIP') badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';

                                    return `
                                        <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                                            <div class="flex items-center gap-2.5 min-w-0">
                                                <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-black border uppercase tracking-wider flex-shrink-0 ${badgeClass}">
                                                    ${ext}
                                                </span>
                                                <div class="min-w-0">
                                                    <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title="${fileName}">${fileName}</p>
                                                    <p class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">${sizeStr || 'Stitch File'}</p>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1.5 flex-shrink-0">
                                                ${isPreviewable ? `
                                                    <button type="button" onclick="openArtworkPreviewModal('${order.order_number}', ${idx}, 'deliverables')" class="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors" title="Preview ${ext} in lightbox">
                                                        <span class="material-symbols-outlined text-xs">visibility</span>
                                                        <span>Preview</span>
                                                    </button>
                                                ` : ''}
                                                <a href="${d.url}" download="${fileName}" target="_blank" class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors" title="Download ${fileName}">
                                                    <span class="material-symbols-outlined text-xs">download</span>
                                                    <span>Download</span>
                                                </a>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    deliverablesContainer.innerHTML = `
                        <div class="p-3 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            No deliverables uploaded by digitizer yet. Production is ${order.status === 'completed' ? 'ready' : 'in progress'}.
                        </div>
                    `;
                }
            }

            // Modal footer dynamic actions
            const footerActionsEl = document.getElementById('order-details-footer-status-actions');
            if (footerActionsEl) {
                let actions = [];
                if (!isPaid && !order.is_quote && !(order.order_number && order.order_number.startsWith('QUO-'))) {
                    actions.push(`
                        <button type="button" onclick="openPaymentReminderModal('${order.order_number}')" class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer">
                            <span class="material-symbols-outlined text-xs">forward_to_inbox</span>
                            <span>Send Payment Reminder</span>
                        </button>
                    `);
                }
                if (order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) {
                    actions.push(`
                        <button type="button" onclick="openSetQuotePriceModal('${order.order_number}')" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer">
                            <span class="material-symbols-outlined text-xs">price_change</span>
                            <span>${order.price ? 'Update Quote Price' : 'Provide Quote Price'}</span>
                        </button>
                    `);
                }
                if (order.status === 'revision_requested') {
                    actions.push(`
                        <button type="button" onclick="openAdminRevisionModal('${order.order_number}')" class="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer">
                            <span class="material-symbols-outlined text-xs">rate_review</span>
                            <span>Review Revision Specs</span>
                        </button>
                    `);
                }
                actions.push(`
                    <button type="button" onclick="openInvoiceModal('${order.order_number}')" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer">
                        <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">receipt</span>
                        <span>Tax Invoice</span>
                    </button>
                `);
                footerActionsEl.innerHTML = actions.join('');
            }

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeAdminOrderDetailsModal() {
            const modal = document.getElementById('admin-order-details-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
            const artworkModal = document.getElementById('admin-artwork-preview-modal');
            if (!artworkModal || artworkModal.classList.contains('hidden')) {
                document.body.style.overflow = '';
            }
        }

        // ===== 1-CLICK FINANCIAL LEDGER CSV EXPORTER =====
        function exportOrdersCSV() {
            const allOrders = window.insforgeClient.getOrders();
            if (!allOrders || allOrders.length === 0) {
                alert('No orders available to export.');
                return;
            }

            const filter = document.getElementById('filter-status').value;
            const ordersToExport = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);

            const headers = [
                'Order Number',
                'Date',
                'Client Name',
                'Client Email',
                'Company',
                'Service Type',
                'Project Name',
                'Placement',
                'Sizing',
                'Required Formats',
                'Price (USD)',
                'Payment Status',
                'Payment Method',
                'Order Status',
                'Assigned Digitizer',
                'Deliverables Count',
                'Instructions'
            ];

            const rows = ordersToExport.map(o => {
                const escapeCsv = (val) => {
                    if (val === null || val === undefined) return '""';
                    const str = String(val).replace(/"/g, '""');
                    return `"${str}"`;
                };

                const dateStr = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '';
                const deliverablesCount = (o.deliverables || []).length;

                return [
                    escapeCsv(o.order_number),
                    escapeCsv(dateStr),
                    escapeCsv(o.client_name),
                    escapeCsv(o.client_email),
                    escapeCsv(o.client_company || 'Independent'),
                    escapeCsv(o.service_type || 'Digitizing'),
                    escapeCsv(o.project_name),
                    escapeCsv(o.placement || ''),
                    escapeCsv(o.sizing || ''),
                    escapeCsv(o.file_format || 'DST, EMB'),
                    (o.price || 0).toFixed(2),
                    escapeCsv(o.payment_status || 'paid'),
                    escapeCsv(o.payment_method || 'PayPal'),
                    escapeCsv(o.status),
                    escapeCsv(o.assigned_digitizer_name || 'Unassigned'),
                    deliverablesCount,
                    escapeCsv(o.instructions || '')
                ].join(',');
            });

            const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const nowStr = new Date().toISOString().split('T')[0];
            const a = document.createElement('a');
            a.href = url;
            a.download = `dezan_financial_ledger_${filter}_${nowStr}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.insforgeClient.showToast(
                'Financial Ledger Exported',
                `Exported ${ordersToExport.length} records to CSV successfully.`,
                'download_done',
                'success'
            );
        }

        // Close modals on escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAssignModal();
                closePaymentReminderModal();
                closeInvoiceModal();
                closeAdminRevisionModal();
                closeAdminAccountModal();
                closeClientHistoryModal();
            }
        });

// Lightweight, accessible charts use the same stage groups as the order queue.
function renderAdminInsights(orders, stages) {
    if (!document.getElementById('admin-insights')) return;
    const labels = ['New Orders', 'Revisions', 'Quotes & payment', 'In production', 'Completed'];
    const keys = ['new', 'revisions', 'incomplete', 'in-progress', 'completed'];
    const total = stages.reduce((n, group) => n + group.length, 0);
    document.getElementById('admin-stage-chart').innerHTML = stages.map((group, i) => `
        <button class="admin-bar-row" onclick="openAdminChartStage('stage-${keys[i]}-sub')" aria-label="${labels[i]}: ${group.length} orders. Open this stage.">
            <span>${labels[i]}</span><strong>${group.length}</strong>
            <span class="admin-bar-track" aria-hidden="true"><span style="width:${total ? group.length / total * 100 : 0}%"></span></span>
        </button>`).join('') + (!total ? '<p class="admin-chart-note">No orders to show yet.</p>' : '');

    const days = Number(document.getElementById('admin-chart-period').value) === 30 ? 30 : 14;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dates = Array.from({length: days}, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - days + 1 + i); return d; });
    const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const counts = new Map(dates.map(d => [dayKey(d), 0]));
    orders.forEach(order => { if (!order.created_at) return; const d = new Date(order.created_at); if (!Number.isNaN(d.getTime()) && counts.has(dayKey(d))) counts.set(dayKey(d), counts.get(dayKey(d)) + 1); });
    const values = [...counts.values()];
    const max = Math.max(1, ...values), sum = values.reduce((a,b) => a+b, 0);
    const label = d => d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
    const x = i => 36 + i * 500 / (days - 1), y = value => 150 - value / max * 112;
    const points = values.map((v,i) => `${x(i)},${y(v)}`).join(' ');
    document.getElementById('admin-activity-chart').innerHTML = `
        <div class="admin-chart-total"><strong>${sum}</strong><span>created in the last ${days} days</span></div>
        <svg viewBox="0 0 560 184" role="img" aria-label="${sum} orders and quotes created in the last ${days} days. Daily counts are available below.">
            <path d="M36 38H536 M36 150H536" class="admin-chart-gridline"/>
            <text x="8" y="42">${max}</text><text x="8" y="154">0</text>
            <polygon points="36,150 ${points} 536,150" class="admin-chart-area"/>
            <polyline points="${points}" class="admin-chart-line"/>
            ${values.map((v,i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" class="admin-chart-dot"><title>${label(dates[i])}: ${v}</title></circle>`).join('')}
            <text x="36" y="177">${label(dates[0])}</text><text x="536" y="177" text-anchor="end">${label(today)}</text>
        </svg>${sum ? '' : '<p class="admin-chart-note">No activity in this period.</p>'}`;
    document.getElementById('admin-activity-data').innerHTML = '<table><caption>Daily order and quote counts (local dates)</caption><thead><tr><th>Date</th><th>Created</th></tr></thead><tbody>' + dates.map((d,i) => `<tr><td>${label(d)}</td><td>${values[i]}</td></tr>`).join('') + '</tbody></table>';

    const amounts = [0,0,0];
    orders.filter(o => o.status !== 'cancelled' && !o.is_quote && o.status !== 'quote_requested').forEach(o => {
        const value = Number(o.price); if (!Number.isFinite(value) || value < 0) return;
        const index = o.payment_status === 'paid' ? 0 : ['pending','unpaid'].includes(o.payment_status) ? 1 : 2;
        amounts[index] += value;
    });
    const money = value => '$' + value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    const paymentTotal = amounts.reduce((a,b) => a+b, 0);
    document.getElementById('admin-payment-chart').innerHTML = `
        <div class="admin-chart-total"><strong>${money(paymentTotal)}</strong><span>total order value</span></div>
        <div class="admin-payment-track" aria-hidden="true">${amounts.map((v,i) => `<span class="admin-payment-${i}" style="width:${paymentTotal ? v/paymentTotal*100 : 0}%"></span>`).join('')}</div>
        <dl class="admin-payment-legend">${['Marked paid','Unpaid / pending','Other status'].map((name,i) => `<div><dt><span class="admin-payment-${i}" aria-hidden="true"></span>${name}</dt><dd>${money(amounts[i])}</dd></div>`).join('')}</dl>
        ${paymentTotal ? '' : '<p class="admin-chart-note">No priced orders to show yet.</p>'}`;
}

function openAdminChartStage(stage) {
    window.location.href = adminPages.orders + '?stage=' + encodeURIComponent(stage);
}

// Global Window Exposures for Testing & Inline HTML Callbacks
window.setAdminLayout = setAdminLayout;
window.renderAdminOrders = renderAdminOrders;
window.renderAllAdminData = renderAllAdminData;
window.openClientHistoryModal = openClientHistoryModal;
window.openSetQuotePriceModal = openSetQuotePriceModal;
window.openAdminRevisionModal = openAdminRevisionModal;
window.closeAdminRevisionModal = closeAdminRevisionModal;
window.openPaymentReminderModal = openPaymentReminderModal;
window.openInvoiceModal = openInvoiceModal;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.toggleAdminAutoAssign = toggleAdminAutoAssign;
window.openAdminOrderDetailsModal = openAdminOrderDetailsModal;
window.closeAdminOrderDetailsModal = closeAdminOrderDetailsModal;
window.openArtworkPreviewModal = openArtworkPreviewModal;
window.closeArtworkPreviewModal = closeArtworkPreviewModal;
window.navigateArtworkPreview = navigateArtworkPreview;

// Global Keyboard & Backdrop Listeners for Admin Modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const artworkModal = document.getElementById('admin-artwork-preview-modal');
        if (artworkModal && !artworkModal.classList.contains('hidden')) {
            closeArtworkPreviewModal();
            return;
        }
        const orderModal = document.getElementById('admin-order-details-modal');
        if (orderModal && !orderModal.classList.contains('hidden')) {
            closeAdminOrderDetailsModal();
            return;
        }
    }
    if (e.key === 'ArrowLeft') {
        const artworkModal = document.getElementById('admin-artwork-preview-modal');
        if (artworkModal && !artworkModal.classList.contains('hidden')) {
            navigateArtworkPreview(-1);
        }
    }
    if (e.key === 'ArrowRight') {
        const artworkModal = document.getElementById('admin-artwork-preview-modal');
        if (artworkModal && !artworkModal.classList.contains('hidden')) {
            navigateArtworkPreview(1);
        }
    }
});

// Setup Backdrop Click-To-Close for Modals
function attachModalBackdropListeners() {
    const artworkModal = document.getElementById('admin-artwork-preview-modal');
    if (artworkModal) {
        artworkModal.addEventListener('click', (e) => {
            if (e.target === artworkModal) {
                closeArtworkPreviewModal();
            }
        });
    }
    const orderModal = document.getElementById('admin-order-details-modal');
    if (orderModal) {
        orderModal.addEventListener('click', (e) => {
            if (e.target === orderModal) {
                closeAdminOrderDetailsModal();
            }
        });
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachModalBackdropListeners);
} else {
    attachModalBackdropListeners();
}
