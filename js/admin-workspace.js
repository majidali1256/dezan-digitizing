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
                'overview': 'mobile-dock-overview',
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

        const adminPages = { orders: 'admin-portal.html', clients: 'admin-clients.html', catalog: 'admin-catalog.html', team: 'admin-team.html' };
        const adminPage = document.body.dataset.adminPage || 'orders';

        function switchAdminView(viewKey) {
            const key = viewKey === 'overview' ? 'orders' : viewKey;
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
         * Filter / isolate a specific stage or view all 4 continuous stages
         */
        function setStageScope(scopeKey) {
            currentStageScope = scopeKey;
            const stageIds = ['stage-unassigned-sub', 'stage-in-progress-sub', 'stage-incomplete-sub', 'stage-completed-sub'];

            stageIds.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (scopeKey === 'all' || scopeKey === id) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            document.querySelectorAll('.stage-jump-pill').forEach(btn => {
                btn.setAttribute('aria-pressed', String(btn.dataset.stageTarget === scopeKey));
            });
            renderAdminOrders();
        }

        function setFilter(filterName) {
            activeAdminFilter = filterName;
            const select = document.getElementById('filter-status');
            if (select) select.value = filterName;

            if (filterName === 'pending_review' || filterName === 'revision_requested') {
                jumpToStage('stage-unassigned-sub');
            } else if (filterName === 'in_progress') {
                jumpToStage('stage-in-progress-sub');
            } else if (filterName === 'unpaid') {
                jumpToStage('stage-incomplete-sub');
            } else if (filterName === 'completed') {
                jumpToStage('stage-completed-sub');
            } else {
                setStageScope('all');
            }

            renderAdminOrders();
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
            if (adminPage === 'orders') {
                const params = new URLSearchParams(window.location.search);
                if (params.has('q')) {
                    document.getElementById('admin-search-input').value = params.get('q');
                    handleSearchInput();
                }
                if (params.has('stage')) setFilter(params.get('stage'));
                if (params.get('focus') === 'search') focusAdminSearch();
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
                } else if (type === 'payment_reminder_sent' || type === 'remote_db_change') {
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
        }

        /**
         * Render Master Orders across 4 dedicated operational stages
         */
        function renderAdminOrders() {
            const allOrders = window.insforgeClient.getOrders();
            const searchInput = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();

            // 4. Stage 4: Completed Production Archive
            // Criteria: completed status
            const stage4Orders = allOrders.filter(o => o.status === 'completed');

            // 3. Stage 3: Incomplete Bookings, Payment Due & Quotes
            // Criteria: Unpaid or pending checkout, or quotes (mutually exclusive from Stage 4)
            const stage3Orders = allOrders.filter(o => {
                return o.status !== 'completed' && o.status !== 'cancelled' && (o.payment_status === 'unpaid' || o.payment_status === 'pending' || o.is_quote === true || o.status === 'quote_requested');
            });

            // 1. Stage 1: Action Required / Needs Assignment & Revisions
            // Criteria: Paid, not completed, not cancelled, and needs worker or active revision
            const stage1Orders = allOrders.filter(o => {
                if (stage4Orders.includes(o) || stage3Orders.includes(o) || o.status === 'cancelled') return false;
                const isNeedsWorker = !o.assigned_digitizer_id || o.status === 'pending_review';
                const isRevision = o.status === 'revision_requested';
                return isNeedsWorker || isRevision;
            });

            // 2. Stage 2: Active Pipeline / In Production
            // Criteria: Paid, assigned, no revision requested, not completed
            const stage2Orders = allOrders.filter(o => {
                if (stage4Orders.includes(o) || stage3Orders.includes(o) || stage1Orders.includes(o) || o.status === 'cancelled') return false;
                return true;
            });

            renderAdminInsights(allOrders, [stage1Orders, stage2Orders, stage3Orders, stage4Orders]);

            // Update Header & Pill Counts
            const totalCount = stage1Orders.length + stage2Orders.length + stage3Orders.length + stage4Orders.length;
            if (document.getElementById('pill-count-all')) document.getElementById('pill-count-all').textContent = totalCount;
            if (document.getElementById('pill-count-unassigned')) document.getElementById('pill-count-unassigned').textContent = stage1Orders.length;
            if (document.getElementById('pill-count-in-progress')) document.getElementById('pill-count-in-progress').textContent = stage2Orders.length;
            if (document.getElementById('pill-count-unpaid')) document.getElementById('pill-count-unpaid').textContent = stage3Orders.length;
            if (document.getElementById('pill-count-completed')) document.getElementById('pill-count-completed').textContent = stage4Orders.length;
            if (document.getElementById('quick-badge-orders')) document.getElementById('quick-badge-orders').textContent = totalCount;

            if (document.getElementById('badge-stage-unassigned')) document.getElementById('badge-stage-unassigned').textContent = `${stage1Orders.length} Orders`;
            if (document.getElementById('badge-stage-in-progress')) document.getElementById('badge-stage-in-progress').textContent = `${stage2Orders.length} In Progress`;
            if (document.getElementById('badge-stage-incomplete')) document.getElementById('badge-stage-incomplete').textContent = `${stage3Orders.length} Pending Payment`;
            if (document.getElementById('badge-stage-completed')) document.getElementById('badge-stage-completed').textContent = `${stage4Orders.length} Completed`;

            // Instant Search Filtering across all 4 stages
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
                'stage-unassigned-sub': stage1Orders, 'stage-in-progress-sub': stage2Orders,
                'stage-incomplete-sub': stage3Orders, 'stage-completed-sub': stage4Orders
            };
            const visibleOrders = scopedOrders[currentStageScope] || [...stage1Orders, ...stage2Orders, ...stage3Orders, ...stage4Orders];
            const result = document.getElementById('admin-search-results');
            if (result) result.textContent = `${filterBySearch(visibleOrders).length} orders${searchInput ? ' matching your search' : ''} · ${currentStageScope === 'all' ? 'All stages' : 'Selected stage'}`;

            // Render each stage independently with custom empty states
            renderStageSection('unassigned', filterBySearch(stage1Orders), searchInput, 'All incoming orders have assigned digitizers, with no active revision requests pending.');
            renderStageSection('in-progress', filterBySearch(stage2Orders), searchInput, 'No orders actively in production undergoing digitization at this moment.');
            renderStageSection('incomplete', filterBySearch(stage3Orders), searchInput, 'All client balances and invoices are settled. No incomplete bookings or unpaid quotes.');
            renderStageSection('completed', filterBySearch(stage4Orders), searchInput, 'No completed production orders archived yet.');

            // Compatibility Bridge for Legacy Selectors (#admin-orders-tbody)
            const legacyTbody = document.getElementById('admin-orders-tbody');
            if (legacyTbody) {
                const combined = filterBySearch(allOrders);
                if (combined.length === 0) {
                    legacyTbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">No matching orders found.</td></tr>`;
                } else {
                    legacyTbody.innerHTML = combined.map(o => renderAdminOrderTableRow(o, 'all')).join('');
                }
            }
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
                            <td colspan="7" class="text-center py-8 text-slate-500 dark:text-slate-400 font-medium text-xs">
                                ${msg}
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = orders.map(o => renderAdminOrderTableRow(o, stageKey)).join('');
                }
            }
        }

        /**
         * Modular Visual Bento Card Renderer
         */
        function renderAdminOrderCard(order, stageKey) {
            const isPaid = order.payment_status === 'paid';
            const isRevision = order.status === 'revision_requested';
            const isUnassigned = !order.assigned_digitizer_id;

            const assignedText = order.assigned_digitizer_name
                ? `<span class="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200"><span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">badge</span> ${order.assigned_digitizer_name}</span>`
                : '<span class="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Unassigned</span>';

            // Border styling based on stage context
            let borderStyle = 'border-primary/20 dark:border-primary/25 bg-white dark:bg-card-dark';
            if (isRevision) {
                borderStyle = 'border-orange-300 dark:border-orange-500/40 bg-orange-50/20 dark:bg-orange-950/15 ring-1 ring-orange-400/40';
            } else if (stageKey === 'incomplete' || !isPaid) {
                borderStyle = 'border-rose-300/80 dark:border-rose-500/30 bg-rose-50/15 dark:bg-rose-950/10';
            }

            return `
                <div class="admin-order-card p-5 rounded-2xl ${borderStyle} shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                        <!-- Header Bar: ID, Date, Status & Payment Badges -->
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <span class="font-mono text-xs font-black text-amber-800 dark:text-primary tracking-wide">${order.order_number}</span>
                                <span class="text-[11px] text-slate-500 block font-medium">${order.created_at ? formatTimeAgo(order.created_at) : 'Recent'}</span>
                            </div>
                            <div class="flex flex-col items-end gap-1.5">
                                ${getStatusBadge(order.status)}
                                ${getPaymentBadge(order.payment_status)}
                            </div>
                        </div>

                        <!-- Project Information -->
                        <div class="mb-3">
                            <h4 class="font-black text-slate-900 dark:text-white text-sm group-hover:text-amber-800 dark:group-hover:text-primary transition-colors">${order.project_name}</h4>
                            <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">${order.placement || 'Standard'} · ${order.sizing || 'Default Size'}</p>
                            ${order.fabric_type ? `<span class="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Fabric: ${order.fabric_type}</span>` : ''}
                        </div>

                        <!-- STAGE 3 SPECIAL: Outstanding Payment / Quote Alert Box -->
                        ${(!isPaid || order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                            <div class="p-3 rounded-xl ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30' : 'bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30'} mb-3 flex items-center justify-between text-xs">
                                <div>
                                    <span class="text-[10px] font-black uppercase tracking-wider ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? 'text-blue-800 dark:text-blue-400' : 'text-rose-800 dark:text-rose-400'} block">
                                        ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? (order.price ? 'Quote Priced: $' + Number(order.price).toFixed(2) : 'Pending Quote Review') : 'Checkout Unsettled'}
                                    </span>
                                    <span class="font-black ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? 'text-blue-950 dark:text-blue-200' : 'text-rose-950 dark:text-rose-200'}">
                                        ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? (order.price ? 'Awaiting client payment' : 'Needs admin pricing estimation') : ('$' + Number(order.price || 0).toFixed(2) + ' due (' + (order.payment_method || 'Invoice') + ')')}
                                    </span>
                                </div>
                                ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                    <button onclick="openSetQuotePriceModal('${order.order_number}')" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer" title="Set or Update Quote Price">
                                        <span class="material-symbols-outlined text-xs">price_change</span>
                                        <span>${order.price ? 'Update Price' : 'Give Price'}</span>
                                    </button>
                                ` : `
                                    <button onclick="openPaymentReminderModal('${order.order_number}')" class="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="Send 1-Click Payment Reminder Email">
                                        <span class="material-symbols-outlined text-xs">forward_to_inbox</span>
                                        <span>Remind</span>
                                    </button>
                                `}
                            </div>
                        ` : ''}

                        <!-- STAGE 1 SPECIAL: Active Revision Request Specs Banner -->
                        ${isRevision ? `
                            <div class="p-3 rounded-xl bg-orange-50/90 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-500/40 mb-3 flex items-center justify-between text-xs">
                                <div>
                                    <span class="text-[10px] font-black uppercase text-orange-900 dark:text-orange-300 block">Stitch-Out Revision</span>
                                    <span class="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Client requested adjustment</span>
                                </div>
                                <button onclick="openAdminRevisionModal('${order.order_number}')" class="px-2 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">rate_review</span>
                                    <span>Specs</span>
                                </button>
                            </div>
                        ` : ''}

                        <!-- Interactive Client Box (Click to open full historical dossier) -->
                        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-primary/10 dark:border-primary/15 mb-3 text-xs">
                            <div class="flex items-center justify-between">
                                <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-primary transition-colors cursor-pointer text-left group/c focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-sm text-slate-400 group-hover/c:text-amber-700 dark:group-hover/c:text-primary">person</span>
                                    <span class="underline decoration-dotted underline-offset-2">${order.client_name}</span>
                                </button>
                                <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="text-[10px] font-bold text-amber-700 dark:text-primary flex items-center gap-0.5 hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span>History</span>
                                    <span class="material-symbols-outlined text-[12px]">history</span>
                                </button>
                            </div>
                            <p class="text-[11px] text-slate-500 ml-5 mt-0.5">${order.client_company || 'Independent'} · ${order.client_email}</p>
                        </div>

                        <!-- Worker Assignment Chip -->
                        <div class="mb-3 flex items-center justify-between text-xs px-1">
                            <span class="text-[10px] font-bold uppercase text-slate-400">Worker:</span>
                            <div>${assignedText}</div>
                        </div>

                        <!-- Attachments & Deliverables -->
                        <div class="flex flex-wrap items-center gap-1.5 mb-4">
                            ${order.raw_artwork_files && order.raw_artwork_files.length > 0 ? `
                                <a href="${order.raw_artwork_files[0].url}" target="_blank" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-primary/10 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/20 text-[10px] font-bold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">attach_file</span> Artwork
                                </a>
                            ` : ''}
                            ${order.deliverables && order.deliverables.length > 0 ? order.deliverables.map(d => `
                                <a href="${d.url}" target="_blank" class="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">download</span> ${d.format}
                                </a>
                            `).join('') : ''}
                        </div>
                    </div>

                    <!-- Actions Toolbar -->
                    <div class="pt-3 border-t border-primary/15 dark:border-primary/20 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
                            <span class="text-base font-black text-slate-900 dark:text-white">$${Number(order.price || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="View client's complete historical dossier">
                                <span class="material-symbols-outlined text-xs">history</span>
                                <span>History</span>
                            </button>
                            ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openSetQuotePriceModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-black text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs" title="Give or update price quote">
                                    <span class="material-symbols-outlined text-xs">price_change</span>
                                    <span>${order.price ? 'Update Price' : 'Give Price'}</span>
                                </button>
                            ` : ''}
                            ${isRevision ? `
                                <button onclick="openAdminRevisionModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 text-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 font-black text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">rate_review</span>
                                    <span>Specs</span>
                                </button>
                            ` : ''}
                            ${(!isPaid && !order.is_quote && !(order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openPaymentReminderModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">forward_to_inbox</span>
                                    <span>Remind</span>
                                </button>
                            ` : ''}
                            <button onclick="openInvoiceModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                <span class="material-symbols-outlined text-xs text-amber-700 dark:text-primary">receipt</span>
                                <span>Invoice</span>
                            </button>
                            <button onclick="openAssignModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-amber-100 dark:bg-primary/15 hover:bg-amber-200 text-amber-900 dark:text-primary font-bold text-[11px] border border-amber-300 dark:border-primary/30 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                ${order.assigned_digitizer_id ? 'Reassign' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Modular Table Row Renderer
         */
        function renderAdminOrderTableRow(order, stageKey) {
            const isPaid = order.payment_status === 'paid';
            const isRevision = order.status === 'revision_requested';
            const assignedText = order.assigned_digitizer_name
                ? `<span class="text-slate-800 dark:text-slate-200 font-semibold">${order.assigned_digitizer_name}</span>`
                : '<span class="text-amber-800 dark:text-amber-400 font-bold">Unassigned</span>';

            return `
                <tr class="hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition-colors ${isRevision ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}">
                    <td class="px-5 py-4 font-mono font-bold text-amber-800 dark:text-primary">${order.order_number}</td>
                    <td class="px-5 py-4">
                        <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="group/client flex items-center gap-1.5 text-left cursor-pointer hover:text-amber-700 dark:hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                            <strong class="text-slate-900 dark:text-white font-bold group-hover/client:text-amber-700 dark:group-hover/client:text-primary">${order.client_name}</strong>
                            <span class="material-symbols-outlined text-[13px] text-amber-700 dark:text-primary opacity-70 group-hover/client:opacity-100">history</span>
                        </button>
                        <span class="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mt-0.5">${order.client_company || 'Independent'} · ${order.client_email}</span>
                    </td>
                    <td class="px-5 py-4">
                        <span class="text-slate-900 dark:text-white font-semibold block">${order.project_name}</span>
                        <span class="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mb-1">${order.placement || 'Standard'} (${order.sizing || 'Default'})</span>
                        <div class="flex flex-wrap items-center gap-1.5 mt-1">
                            ${order.raw_artwork_files && order.raw_artwork_files.length > 0 ? `
                                <a href="${order.raw_artwork_files[0].url}" target="_blank" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-primary/10 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/20 text-[10px] font-bold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-[12px]">attach_file</span> Artwork
                                </a>
                            ` : ''}
                            ${order.deliverables && order.deliverables.length > 0 ? order.deliverables.map(d => `
                                <a href="${d.url}" target="_blank" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-[11px]">download</span> ${d.format}
                                </a>
                            `).join('') : ''}
                        </div>
                    </td>
                    <td class="px-5 py-4">
                        <span class="font-black text-slate-900 dark:text-slate-100 text-sm block">$${Number(order.price || 0).toFixed(2)}</span>
                        <div class="mt-1">${getPaymentBadge(order.payment_status)}</div>
                    </td>
                    <td class="px-5 py-4">${getStatusBadge(order.status)}</td>
                    <td class="px-5 py-4 text-xs">${assignedText}</td>
                    <td class="px-5 py-4 text-right">
                        <div class="flex items-center justify-end gap-1.5 flex-wrap">
                            <button onclick="openClientHistoryModal('${order.client_email || order.client_name}')" class="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" title="View complete lifetime client order history">
                                <span class="material-symbols-outlined text-xs">history</span>
                                <span>History</span>
                            </button>
                            ${(order.is_quote || (order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openSetQuotePriceModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-black text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs" title="Give or update price quote">
                                    <span class="material-symbols-outlined text-xs">price_change</span>
                                    <span>${order.price ? 'Update Price' : 'Give Price'}</span>
                                </button>
                            ` : ''}
                            ${isRevision ? `
                                <button onclick="openAdminRevisionModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40 font-black text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs text-orange-600 dark:text-orange-400">rate_review</span>
                                    <span>Specs</span>
                                </button>
                            ` : ''}
                            ${(!isPaid && !order.is_quote && !(order.order_number && order.order_number.startsWith('QUO-'))) ? `
                                <button onclick="openPaymentReminderModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                    <span class="material-symbols-outlined text-xs">forward_to_inbox</span>
                                    <span>Remind</span>
                                </button>
                            ` : ''}
                            <button onclick="openInvoiceModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                <span class="material-symbols-outlined text-sm text-amber-700 dark:text-primary">receipt</span>
                                <span>Invoice</span>
                            </button>
                            <button onclick="openAssignModal('${order.order_number}')" class="px-3 py-2 rounded-lg bg-amber-100 dark:bg-primary/15 hover:bg-amber-200 dark:hover:bg-primary text-amber-900 dark:text-primary hover:text-amber-950 dark:hover:text-background-dark border border-amber-300 dark:border-primary/30 font-bold text-[11px] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                ${order.assigned_digitizer_id ? 'Reassign' : 'Assign'}
                            </button>
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
                                ${order.raw_artwork_files && order.raw_artwork_files.length > 0 ? `
                                    <a href="${order.raw_artwork_files[0].url}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 dark:bg-primary/10 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/20 text-[10px] font-bold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                        <span class="material-symbols-outlined text-xs">attach_file</span> Artwork
                                    </a>
                                ` : ''}
                                ${order.deliverables && order.deliverables.length > 0 ? order.deliverables.map(d => `
                                    <a href="${d.url}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                                        <span class="material-symbols-outlined text-xs">download</span> ${d.format} (${d.name || 'Stitch'})
                                    </a>
                                `).join('') : '<span class="text-[10px] text-slate-400 italic">No deliverables uploaded yet</span>'}
                            </div>

                            <div class="flex items-center gap-2">
                                <span class="font-black text-slate-900 dark:text-white text-sm">$${Number(order.price || 0).toFixed(2)}</span>
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
                'Alex Miller': { title: 'Lead Digitizer', specialty: 'Tajima & Barudan Master', icon: 'military_tech' },
                'Sam Chen': { title: 'Vector Specialist', specialty: 'SVG & CorelDraw AI', icon: 'brush' },
                'Maria Garcia': { title: '3D Puff Master', specialty: 'Heavy Fabric & Foam 3D', icon: 'layers' }
            };

            const teamActiveCount = document.getElementById('team-active-count');
            if (teamActiveCount) teamActiveCount.textContent = `${digitizers.length} Digitizers On Duty`;

            container.innerHTML = digitizers.map(d => {
                const assignedOrders = allOrders.filter(o => o.assigned_digitizer_id === d.id);
                const activeOrders = assignedOrders.filter(o => o.status === 'in_progress' || o.status === 'assigned' || o.status === 'revision_requested');
                const completedOrders = assignedOrders.filter(o => o.status === 'completed');
                const shortName = d.displayName.split(' ')[0] + ' ' + (d.displayName.split(' ')[1] || '');
                const spec = specs[shortName] || { title: 'Embroidery Specialist', specialty: 'Industrial Machine Files', icon: 'badge' };
                const initials = d.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
                return '<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold"><span class="material-symbols-outlined text-[11px]">check_circle</span> Paid</span>';
            } else {
                return '<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-[10px] font-black"><span class="material-symbols-outlined text-[11px]">schedule</span> Payment Due</span>';
            }
        }

        function formatTimeAgo(isoString) {
            if (!isoString) return '';
            const diffMs = Date.now() - new Date(isoString).getTime();
            const diffSec = Math.floor(diffMs / 1000);
            if (diffSec < 60) return 'just now';
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 60) return `${diffMin}m ago`;
            const diffHr = Math.floor(diffMin / 60);
            if (diffHr < 24) return `${diffHr}h ago`;
            return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        function getStatusBadge(status) {
            switch(status) {
                case 'completed':
                    return '<span class="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-bold">Completed</span>';
                case 'in_progress':
                    return '<span class="px-3 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 text-[11px] font-bold">In Production</span>';
                case 'assigned':
                    return '<span class="px-3 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 text-[11px] font-bold">Assigned</span>';
                case 'revision_requested':
                    return '<span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-black animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Revision</span>';
                default:
                    return '<span class="px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[11px] font-bold">Needs Review</span>';
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
Faisal Dezan
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
            } else {
                targetOrder = allOrders.find(o => !o.assigned_digitizer_id || o.status === 'pending_review') || allOrders[0];
            }

            if (!targetOrder) {
                alert('No orders available to assign.');
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
            const select = document.getElementById('assign-worker-select');
            const selectedOpt = select.options[select.selectedIndex];
            const workerId = selectedOpt.value;
            const workerName = selectedOpt.getAttribute('data-name');

            try {
                await window.insforgeClient.assignDigitizer(orderNumber, workerId, workerName);
                closeAssignModal();
                await renderAllAdminData();
                window.insforgeClient.showToast('Worker Dispatched', `Order ${orderNumber} assigned to ${workerName}.`, 'person_check', 'success');
            } catch (err) {
                console.error('Assignment error:', err);
                alert(`⚠️ Error assigning worker: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        }

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
                        <span class="font-mono font-semibold">Authorized By: Faisal Dezan (Head Digitizer)</span>
                    </div>
                </div>
            `;

            document.getElementById('invoice-modal').classList.remove('hidden');
        }

        function closeInvoiceModal() {
            document.getElementById('invoice-modal').classList.add('hidden');
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
    const labels = ['Needs attention', 'In production', 'Quotes & payment', 'Completed'];
    const keys = ['unassigned', 'in-progress', 'incomplete', 'completed'];
    const total = stages.reduce((n, group) => n + group.length, 0);
    document.getElementById('admin-stage-chart').innerHTML = stages.map((group, i) => `
        <button class="admin-bar-row" onclick="setStageScope('stage-${keys[i]}-sub'); scrollToSection('master-orders-section')" aria-label="${labels[i]}: ${group.length} orders. Open this stage.">
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
