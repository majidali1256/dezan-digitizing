/**
 * ===================================================================
 *  DEZAN DIGITIZING — WORKER STUDIO WORKSPACE JS ENGINE (Modularized)
 *  Shared Controller for:
 *    - worker-portal.html   (Studio Dashboard Overview)
 *    - worker-tasks.html    (Active Production Workbench)
 *    - worker-archive.html  (Completed Deliverables Archive)
 *    - worker-specs.html    (Machine Formats & Production Standards)
 *    - worker-settings.html (Workstation & Capacity Settings)
 * ===================================================================
 */

(function () {
    'use strict';

    window.workerWorkspaceState = {
        session: null,
        tasks: [],
        activeFilter: 'all',
        searchQuery: '',
        currentTaskNumber: null,
        selectedFiles: []
    };

    const state = window.workerWorkspaceState;

    // ----- Initialize Workspace -----
    async function initWorkerWorkspace() {
        if (typeof window.insforgeClient === 'undefined') {
            console.warn('insforgeClient not yet ready, waiting...');
            setTimeout(initWorkerWorkspace, 100);
            return;
        }

        let user = null;
        try {
            user = window.insforgeClient.getCurrentUser();
        } catch (e) {
            console.warn('Worker session check warning:', e);
        }

        if (!user || user.role !== 'digitizer') {
            user = {
                id: 'demo-worker-1',
                email: 'alex@dezan.com',
                displayName: 'Alex Miller',
                role: 'digitizer',
                company: 'Dezan Digitizing Studio',
                phone: '+1 (555) 987-6543'
            };
            try {
                if (typeof window.insforgeClient.setSession === 'function') {
                    window.insforgeClient.setSession(user);
                }
            } catch (e) {
                console.warn('Worker set session warning:', e);
            }
        }

        state.session = user || { displayName: 'Alex Miller', email: 'alex@dezan.com', role: 'digitizer' };
        updateHeaderUserUI();
        highlightActiveNavTab();

        // Load tasks
        await loadWorkerTasks();

        // Render current page
        renderActivePage();

        // Global listeners
        bindGlobalListeners();
    }

    // ----- Data Fetching & Masking -----
    async function loadWorkerTasks() {
        try {
            let tasks = [];
            if (typeof window.insforgeClient.getTasks === 'function') {
                tasks = await window.insforgeClient.getTasks();
            } else if (typeof window.insforgeClient.getOrders === 'function') {
                tasks = await window.insforgeClient.getOrders();
            }

            // Apply strict masking to all records
            state.tasks = (Array.isArray(tasks) ? tasks : getFallbackTasks()).map(applyWorkerMasking);
        } catch (e) {
            console.warn('Tasks load error, using fallback:', e);
            state.tasks = getFallbackTasks().map(applyWorkerMasking);
        }

        updateMetricsAcrossViews();
    }

    // Strict PII & Price Masking Rule
    function applyWorkerMasking(task) {
        const idSuffix = (task.order_number || task.id || '9999').replace(/[^0-9]/g, '').slice(-4) || '1234';
        return {
            ...task,
            client_name: `Client #CLI-${idSuffix}`,
            client_email: `client-${idSuffix}@confidential.masked`,
            customer_phone: '[Protected PII]',
            amount: '[Confidential - Admin Only]',
            pricing_notes: '[Masked from Worker Studio]'
        };
    }

    function getFallbackTasks() {
        return [
            {
                id: 'task-201',
                order_number: 'ORD-8492',
                design_name: 'Apex Mountain Gear Left Chest',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                priority: 'normal',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Pique Polo Knit',
                dimensions: '3.5" W x 2.2" H',
                target_format: 'DST & EMB',
                special_instructions: 'Keep stitch density balanced for pique polo; minimal jump stitches on lettering.'
            },
            {
                id: 'task-202',
                order_number: 'ORD-8488',
                design_name: 'Timberline Tactical Cap Emblem',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                priority: 'rush',
                created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Structured 6-Panel Cap (Twill)',
                dimensions: '2.25" H x 4.0" W',
                target_format: 'DST',
                special_instructions: 'Center out sequence for structured cap frame. Add extra pull comp for cap seam.'
            },
            {
                id: 'task-203',
                order_number: 'ORD-8310',
                design_name: 'Golden Eagle Crest Vintage',
                service_type: 'Digitizing',
                plan: 'Larger Designs',
                status: 'completed',
                created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                artwork_url: 'images/service-vector.png',
                deliverable_url: 'images/service-digitizing.png',
                target_fabric: 'Denim Jacket Back',
                dimensions: '9.0" W x 7.5" H',
                stitch_count: 28450,
                target_format: 'EMB, DST, PES'
            }
        ];
    }

    // ----- Metrics Calculation -----
    function updateMetricsAcrossViews() {
        const tasks = state.tasks || [];
        const active = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending' || t.status === 'revision_requested');
        const completed = tasks.filter(t => t.status === 'completed');
        const rush = tasks.filter(t => t.priority === 'rush' && t.status === 'in_progress');

        setElText('metric-active-tasks', active.length);
        setElText('metric-completed-tasks', completed.length);
        setElText('metric-rush-tasks', rush.length);
        setElText('metric-quality-score', '99.4%');

        setElText('nav-badge-tasks', active.length);
        setElText('nav-badge-archive', completed.length);
    }

    // ----- Active Page Dispatcher -----
    function renderActivePage() {
        const page = document.body.dataset.workerPage || 'dashboard';

        switch (page) {
            case 'dashboard':
                renderDashboardView();
                break;
            case 'tasks':
                renderTasksWorkbenchView();
                break;
            case 'archive':
                renderArchiveView();
                break;
            case 'specs':
                // Static interactive guide
                break;
            case 'settings':
                renderSettingsView();
                break;
            default:
                renderDashboardView();
        }
    }

    // ===================================================================
    //  PAGE 1: WORKER DASHBOARD (worker-portal.html)
    // ===================================================================
    function renderDashboardView() {
        const container = document.getElementById('studio-queue-container');
        if (!container) return;

        const active = state.tasks.filter(t => t.status === 'in_progress' || t.status === 'revision_requested');

        if (active.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">Production Queue Clean!</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">All assigned digitizing and vector tasks have been fulfilled.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = active.map(t => renderWorkerTaskCard(t, false)).join('');
    }

    // ===================================================================
    //  PAGE 2: TASKS WORKBENCH (worker-tasks.html)
    // ===================================================================
    function renderTasksWorkbenchView() {
        const container = document.getElementById('tasks-workbench-container');
        if (!container) return;

        let filtered = state.tasks.filter(t => t.status === 'in_progress' || t.status === 'revision_requested');

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                (t.design_name || '').toLowerCase().includes(q) ||
                (t.order_number || '').toLowerCase().includes(q) ||
                (t.target_fabric || '').toLowerCase().includes(q)
            );
        }

        if (state.activeFilter === 'digitizing') {
            filtered = filtered.filter(t => (t.service_type || '').toLowerCase().includes('digit'));
        } else if (state.activeFilter === 'vectorizing') {
            filtered = filtered.filter(t => (t.service_type || '').toLowerCase().includes('vector'));
        } else if (state.activeFilter === 'rush') {
            filtered = filtered.filter(t => t.priority === 'rush');
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">search_off</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No active tasks match this filter</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Check back soon or view all tasks.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(t => renderWorkerTaskCard(t, false)).join('');
    }

    // ===================================================================
    //  PAGE 3: COMPLETED ARCHIVE (worker-archive.html)
    // ===================================================================
    function renderArchiveView() {
        const container = document.getElementById('archive-list-container');
        if (!container) return;

        const completed = state.tasks.filter(t => t.status === 'completed');

        if (completed.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/20">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">No completed tasks yet</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Delivered machine stitch files and vector packages will be cataloged here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = completed.map(t => renderWorkerTaskCard(t, true)).join('');
    }

    // Worker Card Component
    function renderWorkerTaskCard(task, isCompleted) {
        const isRush = task.priority === 'rush';
        return `
            <div class="worker-task-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs cursor-pointer" onclick="window.workerWorkspace.openStitchOutZoomModal('${task.artwork_url || 'images/service-digitizing.png'}', '${task.design_name}')" title="Click to enlarge artwork">
                        <img src="${task.artwork_url || 'images/service-digitizing.png'}" alt="Source Artwork" class="w-full h-full object-cover">
                    </div>
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <span class="font-mono text-xs font-black text-amber-900 dark:text-primary">${task.order_number}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">${task.client_name}</span>
                            ${isRush ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">bolt</span> RUSH (<12h)</span>` : ''}
                        </div>
                        <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${task.design_name}</h4>
                        <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                            <span class="format-tag">${task.target_format || 'DST'}</span>
                            <span>• Fabric: <strong class="text-slate-800 dark:text-slate-200">${task.target_fabric || 'Standard'}</strong></span>
                            <span>• Size: <strong class="text-slate-800 dark:text-slate-200">${task.dimensions || 'Chest Size'}</strong></span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-primary/10">
                    <button onclick="window.workerWorkspace.openTaskDetailsModal('${task.order_number}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap">
                        <span class="material-symbols-outlined text-sm">assignment</span>
                        <span>Specs</span>
                    </button>
                    ${!isCompleted ? `
                        <button onclick="window.workerWorkspace.openDeliverableUploadModal('${task.order_number}')" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background-dark font-black text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap">
                            <span class="material-symbols-outlined text-sm">upload_file</span>
                            <span>Upload & Complete</span>
                        </button>
                    ` : `
                        <a href="${task.deliverable_url || task.artwork_url}" download class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-xs whitespace-nowrap">
                            <span class="material-symbols-outlined text-sm">file_download</span>
                            <span>Verify Archive</span>
                        </a>
                    `}
                </div>
            </div>
        `;
    }

    // ===================================================================
    //  PAGE 5: WORKER SETTINGS (worker-settings.html)
    // ===================================================================
    function renderSettingsView() {
        const form = document.getElementById('worker-settings-form');
        if (!form) return;

        setInputValue('worker-name', 'Alex Miller');
        setInputValue('worker-specialty', 'Embroidery Digitizing (3D Puff & Left Chest)');
        setInputValue('worker-software', 'Wilcom EmbroideryStudio e4.5');
        setInputValue('worker-daily-capacity', '6');
    }

    // ----- Modals -----
    function openDeliverableUploadModal(taskNumber) {
        state.currentTaskNumber = taskNumber;
        const task = state.tasks.find(t => t.order_number === taskNumber);
        setElText('upload-task-id', taskNumber);
        setElText('upload-design-name', task ? task.design_name : 'Custom Embroidery');
        const modal = document.getElementById('deliverable-upload-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeDeliverableUploadModal() {
        const modal = document.getElementById('deliverable-upload-modal');
        if (modal) modal.classList.add('hidden');
    }

    async function handleDeliverableSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const taskNumber = state.currentTaskNumber;
        const stitchCount = parseInt(document.getElementById('deliverable-stitch-count')?.value) || 12500;
        const notes = document.getElementById('deliverable-notes')?.value || 'Completed high quality machine stitch file.';

        try {
            if (typeof window.insforgeClient.completeTask === 'function') {
                await window.insforgeClient.completeTask(taskNumber, {
                    stitch_count: stitchCount,
                    notes: notes,
                    status: 'completed'
                });
            } else {
                // Update in memory
                const idx = state.tasks.findIndex(t => t.order_number === taskNumber);
                if (idx !== -1) {
                    state.tasks[idx].status = 'completed';
                    state.tasks[idx].stitch_count = stitchCount;
                }
            }
            alert(`Deliverables for ${taskNumber} uploaded successfully! Order marked as completed.`);
            closeDeliverableUploadModal();
            loadWorkerTasks();
            renderActivePage();
        } catch (err) {
            alert('Failed to submit deliverables: ' + err.message);
        }
    }

    function openTaskDetailsModal(taskNumber) {
        const task = state.tasks.find(t => t.order_number === taskNumber);
        if (!task) return;

        setElText('detail-task-id', task.order_number);
        setElText('detail-client-id', task.client_name);
        setElText('detail-design-name', task.design_name);
        setElText('detail-fabric', task.target_fabric || 'Standard Fabric');
        setElText('detail-dimensions', task.dimensions || 'Left Chest Standard');
        setElText('detail-format', task.target_format || 'DST');
        setElText('detail-instructions', task.special_instructions || 'None specified. Follow standard production guidelines.');

        const modal = document.getElementById('task-details-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeTaskDetailsModal() {
        const modal = document.getElementById('task-details-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openStitchOutZoomModal(url, title) {
        const img = document.getElementById('zoom-modal-img');
        const titleEl = document.getElementById('zoom-modal-title');
        if (img) img.src = url;
        if (titleEl) titleEl.textContent = title;
        const modal = document.getElementById('stitch-zoom-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeStitchOutZoomModal() {
        const modal = document.getElementById('stitch-zoom-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openFormatSpecsModal() {
        const modal = document.getElementById('format-specs-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeFormatSpecsModal() {
        const modal = document.getElementById('format-specs-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openWorkerAccountModal() {
        const modal = document.getElementById('worker-account-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeWorkerAccountModal() {
        const modal = document.getElementById('worker-account-modal');
        if (modal) modal.classList.add('hidden');
    }

    // ----- UI Utilities -----
    function highlightActiveNavTab() {
        const currentPage = document.body.dataset.workerPage || 'dashboard';
        const tabs = document.querySelectorAll('.worker-nav-tab');
        tabs.forEach(tab => {
            const tabKey = tab.getAttribute('data-worker-link');
            if (tabKey === currentPage) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Highlight mobile bottom dock buttons
        const dockLinks = document.querySelectorAll('nav.fixed a[data-worker-link]');
        dockLinks.forEach(link => {
            const linkKey = link.getAttribute('data-worker-link');
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
        setElText('header-worker-name', state.session.displayName || 'Alex Miller');
    }

    function setFilter(type) {
        state.activeFilter = type;
        const pills = document.querySelectorAll('.worker-filter-pill');
        pills.forEach(p => {
            if (p.getAttribute('data-filter') === type) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        renderActivePage();
    }

    function handleSearch(e) {
        state.searchQuery = e.target.value.trim();
        renderActivePage();
    }

    function bindGlobalListeners() {
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
    window.workerWorkspace = {
        init: initWorkerWorkspace,
        setFilter,
        handleSearch,
        openDeliverableUploadModal,
        closeDeliverableUploadModal,
        handleDeliverableSubmit,
        openTaskDetailsModal,
        closeTaskDetailsModal,
        openStitchOutZoomModal,
        closeStitchOutZoomModal,
        openFormatSpecsModal,
        closeFormatSpecsModal,
        openWorkerAccountModal,
        closeWorkerAccountModal
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkerWorkspace);
    } else {
        initWorkerWorkspace();
    }
})();
