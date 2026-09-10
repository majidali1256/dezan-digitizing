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
        layout: (function() {
            try { return localStorage.getItem('dezan_worker_layout') || 'grid'; } catch(e) { return 'grid'; }
        })(),
        currentTaskNumber: null,
        selectedFiles: []
    };

    const state = window.workerWorkspaceState;

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ----- Universal Date & Time Formatter -----
    function formatOrderDateTime(dateVal) {
        if (!dateVal) return { date: 'Sep 9, 2026', time: '09:00 AM', full: 'Sep 9, 2026 · 09:00 AM' };
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return { date: 'Sep 9, 2026', time: '09:00 AM', full: 'Sep 9, 2026 · 09:00 AM' };
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dateStr = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
            return { date: dateStr, time: timeStr, full: `${dateStr} · ${timeStr}` };
        } catch (e) {
            return { date: 'Sep 9, 2026', time: '09:00 AM', full: 'Sep 9, 2026 · 09:00 AM' };
        }
    }

    function parseRequestedFormats(fmtString, instructionsText) {
        const formats = new Set();
        const primary = (fmtString || 'DST').toUpperCase();
        if (primary.includes(',')) {
            primary.split(',').forEach(f => {
                const clean = f.trim().replace(/^\./, '').toUpperCase();
                if (clean) formats.add(clean);
            });
        } else {
            formats.add(primary.replace(/^\./, ''));
        }
        if (instructionsText && /emb(\b|\.)/i.test(instructionsText)) {
            formats.add('EMB');
        }
        if (formats.size === 0) formats.add('DST');
        return Array.from(formats);
    }

    function getFileExtension(filename) {
        if (!filename) return 'ART';
        const parts = filename.split('.');
        if (parts.length < 2) return 'ART';
        return parts.pop().toUpperCase();
    }

    // ----- Workbench Layout Switcher (Cards vs Table) -----
    function setDigitizerLayout(mode) {
        state.layout = mode;
        try { localStorage.setItem('dezan_worker_layout', mode); } catch (e) {}
        ['grid', 'table'].forEach(key => {
            const btn = document.getElementById('digitizer-layout-toggle-' + key);
            if (btn) btn.setAttribute('aria-pressed', String(key === mode));
        });
        const tableBtn = document.getElementById('digitizer-layout-toggle-table');
        const gridBtn = document.getElementById('digitizer-layout-toggle-grid');
        const cardContainers = document.querySelectorAll('.digitizer-cards-container');
        const tableContainers = document.querySelectorAll('.digitizer-table-container');

        if (mode === 'grid') {
            tableContainers.forEach(el => el.classList.add('hidden'));
            cardContainers.forEach(el => el.classList.remove('hidden'));
            if (gridBtn) {
                gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            }
            if (tableBtn) {
                tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            }
        } else {
            tableContainers.forEach(el => el.classList.remove('hidden'));
            cardContainers.forEach(el => el.classList.add('hidden'));
            if (tableBtn) {
                tableBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            }
            if (gridBtn) {
                gridBtn.className = 'px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            }
        }
    }

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
                id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                email: 'digitizer@dezandigitizing.com',
                displayName: 'Digitizer',
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

        state.session = user || { displayName: 'Digitizer', email: 'digitizer@dezandigitizing.com', role: 'digitizer' };
        updateHeaderUserUI();
        highlightActiveNavTab();

        // Load tasks
        await loadWorkerTasks();

        // Render current page
        renderActivePage();
        setDigitizerLayout(state.layout);

        // Check for deep-linked task from notification
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.has('task')) {
                const taskNum = params.get('task');
                setTimeout(() => openTaskDetailsModal(taskNum), 350);
            }
        } catch (e) {}

        // Global listeners
        bindGlobalListeners();
    }

    // ----- Data Fetching & Masking -----
    async function loadWorkerTasks() {
        try {
            let tasks = [];
            if (typeof window.insforgeClient.fetchDigitizerTasks === 'function') {
                tasks = await window.insforgeClient.fetchDigitizerTasks();
            } else if (typeof window.insforgeClient.getDigitizerTasks === 'function') {
                tasks = window.insforgeClient.getDigitizerTasks();
            } else if (typeof window.insforgeClient.getTasks === 'function') {
                tasks = await window.insforgeClient.getTasks();
            } else if (typeof window.insforgeClient.getOrders === 'function') {
                tasks = await window.insforgeClient.getOrders();
            }

            // Fall back to comprehensive demo tasks if array is empty
            if (!Array.isArray(tasks) || tasks.length === 0) {
                tasks = getFallbackTasks();
            }

            // Apply strict masking and deep field normalization
            state.tasks = tasks.map(applyWorkerMasking);
        } catch (e) {
            console.warn('Tasks load notice, using rich fallback queue:', e);
            state.tasks = getFallbackTasks().map(applyWorkerMasking);
        }

        updateMetricsAcrossViews();
    }

    // Strict PII & Price Masking Rule with Universal Field Normalization
    function applyWorkerMasking(task) {
        const orderNumber = task.order_number || task.orderNumber || (task.taskId ? task.taskId.replace('TSK-', 'ORD-') : 'ORD-8492');
        const idSuffix = String(orderNumber).replace(/[^0-9]/g, '').slice(-4) || '1234';
        const designName = task.design_name || task.designName || task.project_name || task.projectName || 'Custom Embroidery';
        
        let placement = task.placement || task.target_placement || task.targetPlacement;
        if (!placement || placement.toLowerCase().includes('digitizing') || placement.toLowerCase().includes('custom') || placement === 'Standard') {
            const dName = (designName || '').toLowerCase();
            if (dName.includes('cap') || dName.includes('hat')) placement = 'Cap Front';
            else if (dName.includes('jacket') || dName.includes('back')) placement = 'Jacket Back';
            else if (dName.includes('sleeve')) placement = 'Sleeve';
            else placement = 'Left Chest';
        }

        const targetFabric = task.target_fabric || task.targetFabric || task.fabric_type || task.fabricType || 'Pique Polo Knit';
        const targetFormat = task.target_format || task.targetFormat || task.file_format || task.fileFormat || 'DST + PES';
        const dimensions = task.dimensions || task.sizing || '4.0" WIDE';
        const instructions = task.special_instructions || task.instructions || task.revision_notes || task.revisionNotes || 'Keep stitch density balanced for pique polo; minimal jump stitches on lettering.';
        const serviceType = task.service_type || task.serviceType || 'Digitizing';
        const artworkUrl = task.artwork_url || (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles[0]?.url) || (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files[0]?.url) || 'images/service-digitizing.png';
        const deliverableUrl = task.deliverable_url || (Array.isArray(task.deliverables) && task.deliverables[0]?.url) || artworkUrl;

        const isRush = task.turnaround_speed === 'rush' || task.turnaroundSpeed === 'rush' || task.priority === 'rush' || task.is_rush === true || task.isRush === true;
        const specialOptions = Array.isArray(task.special_options) ? task.special_options : (Array.isArray(task.specialOptions) ? task.specialOptions : []);
        const rawArtworkFiles = (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles.length > 0)
            ? task.rawArtworkFiles
            : (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files.length > 0)
                ? task.raw_artwork_files
                : [{ name: 'artwork.png', url: artworkUrl }];

        return {
            ...task,
            order_number: orderNumber,
            orderNumber: orderNumber,
            design_name: designName,
            placement: placement,
            service_type: serviceType,
            serviceType: serviceType,
            target_fabric: targetFabric,
            fabric_type: targetFabric,
            fabricType: targetFabric,
            target_format: targetFormat,
            file_format: targetFormat,
            fileFormat: targetFormat,
            dimensions: dimensions,
            sizing: dimensions,
            special_instructions: instructions,
            instructions: instructions,
            special_options: specialOptions,
            specialOptions: specialOptions,
            artwork_url: artworkUrl,
            raw_artwork_files: rawArtworkFiles,
            rawArtworkFiles: rawArtworkFiles,
            deliverable_url: deliverableUrl,
            status: task.status || 'in_progress',
            priority: isRush ? 'rush' : 'normal',
            turnaround_speed: isRush ? 'rush' : 'standard',
            is_rush: isRush,
            isRush: isRush,
            revision_notes: task.revision_notes || task.revisionNotes || '',
            stitch_count: task.stitch_count || (task.status === 'completed' ? 14200 : null),
            // STRICT WORKER PRIVACY MASKING: Client name, email, phone, and price are 100% masked
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
                design_name: 'Apex Mountain Gear',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                priority: 'normal',
                placement: 'Left Chest',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Pique Polo',
                dimensions: '4.0" WIDE',
                target_format: 'DST + PES',
                special_instructions: 'Keep the small text clear and add trims between all letters. Avoid excessive density on small satin borders.'
            },
            {
                id: 'task-202',
                order_number: 'ORD-8488',
                design_name: 'Timberline Tactical Cap',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                priority: 'rush',
                placement: 'Cap Front',
                created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Structured 6-Panel Cap',
                dimensions: '3.5" W × 2.2" H',
                target_format: 'DST',
                special_options: ['3D Puff', 'Trims Between All Letters'],
                special_instructions: '3D Puff cap design. Center out sequence for structured cap frame. Add extra pull comp for cap center seam.'
            },
            {
                id: 'task-204',
                order_number: 'ORD-8482',
                design_name: 'Metro Fire Rescue Shield',
                service_type: 'Digitizing',
                plan: 'Jacket Backs',
                status: 'in_progress',
                priority: 'normal',
                placement: 'Jacket Back',
                created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Heavy Twill',
                dimensions: '11.0" W × 9.5" H',
                target_format: 'DST + EMB',
                special_instructions: 'Clean tatami fills on the shield background with satin outlines. Group color stops logically.'
            },
            {
                id: 'task-205',
                order_number: 'ORD-8475',
                design_name: 'Summit Ridge Athletic Club',
                service_type: 'Digitizing',
                plan: 'Jacket Backs',
                status: 'revision_requested',
                priority: 'rush',
                placement: 'Jacket Back',
                created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
                artwork_url: 'images/service-digitizing.png',
                target_fabric: 'Fleece Pullover',
                dimensions: '6.5" W × 4.5" H',
                target_format: 'DST + PES',
                special_instructions: 'Increase tatami underlay density by +0.05mm to stop looping on thick fleece substrate.',
                revision_notes: 'Lettering sank slightly into the fleece pile. Please thicken satin columns and add double tatami grid underlay.'
            },
            {
                id: 'task-203',
                order_number: 'ORD-8310',
                design_name: 'Golden Eagle Crest Vintage',
                service_type: 'Digitizing',
                plan: 'Larger Designs',
                status: 'completed',
                created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                artwork_url: 'images/wilcom-embroidery-digitizing-software-stitch-simulation.jpeg',
                deliverable_url: 'images/jacket-backs.png',
                target_fabric: 'Denim Jacket Back',
                dimensions: '9.0" W x 7.5" H',
                stitch_count: 28450,
                target_format: 'EMB, DST, PES'
            },
            {
                id: 'task-206',
                order_number: 'ORD-8280',
                design_name: 'Silver Creek Golf Classic',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'completed',
                created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
                artwork_url: 'images/scenic-mountain-landscape-embroidered-patch.jpeg',
                deliverable_url: 'images/left-chest-logos.png',
                target_fabric: 'Performance Poly Knit',
                dimensions: '3.2" W x 2.0" H',
                stitch_count: 14200,
                target_format: 'DST, EXP'
            }
        ];
    }

    // ----- Metrics Calculation -----
    function updateMetricsAcrossViews() {
        const tasks = state.tasks || [];
        const active = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending' || t.status === 'assigned' || t.status === 'pending_review' || t.status === 'revision_requested');
        const completed = tasks.filter(t => t.status === 'completed');
        const rush = tasks.filter(t => (t.priority === 'rush' || t.status === 'revision_requested') && t.status !== 'completed');

        const newCount = tasks.filter(t => t.status === 'pending' || t.status === 'assigned' || t.status === 'pending_review').length;
        const revisionCount = tasks.filter(t => t.status === 'revision_requested').length;
        const inProgressCount = tasks.filter(t => t.status === 'in_progress' || (t.status !== 'completed' && t.status !== 'revision_requested' && t.status !== 'pending' && t.status !== 'assigned' && t.status !== 'pending_review')).length;
        const completedCount = completed.length;
        const allCount = tasks.length;

        setElText('metric-active-tasks', active.length);
        setElText('metric-completed-tasks', completed.length);
        setElText('metric-rush-tasks', rush.length);
        setElText('metric-quality-score', '99.4%');

        setElText('nav-badge-tasks', active.length);
        setElText('nav-badge-archive', completed.length);

        // 5-stage distribution counters (Strictly NO quotes for digitizer)
        setElText('worker-pill-count-all', allCount);
        setElText('worker-pill-count-new', newCount);
        setElText('worker-pill-count-revisions', revisionCount);
        setElText('worker-pill-count-production', inProgressCount);
        setElText('worker-pill-count-completed', completedCount);
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

        let allTasks = state.tasks || [];

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            allTasks = allTasks.filter(t =>
                (t.design_name || '').toLowerCase().includes(q) ||
                (t.order_number || '').toLowerCase().includes(q) ||
                (t.target_fabric || '').toLowerCase().includes(q)
            );
        }

        const newTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'assigned' || t.status === 'pending_review');
        const revisionTasks = allTasks.filter(t => t.status === 'revision_requested');
        const productionTasks = allTasks.filter(t => t.status === 'in_progress' || (t.status !== 'completed' && t.status !== 'revision_requested' && t.status !== 'pending' && t.status !== 'assigned' && t.status !== 'pending_review'));
        const completedTasks = allTasks.filter(t => t.status === 'completed');

        // Helper to render a subsection card
        const renderSubSection = (id, icon, title, badgeColor, count, items, emptyTitle, emptyDesc, isCompletedSection = false) => `
            <section id="${id}" class="stage-sub-section">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-primary/10">
                    <h2 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg ${badgeColor.icon}">${icon}</span>
                        <span>${title}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full ${badgeColor.badge} font-bold">${count}</span>
                    </h2>
                </div>
                <div class="p-4 sm:p-5">
                    ${items.length === 0 ? `
                        <div class="p-6 text-center rounded-2xl ${badgeColor.emptyBg} border ${badgeColor.emptyBorder}">
                            <span class="material-symbols-outlined text-3xl ${badgeColor.emptyIcon} mb-1">${icon}</span>
                            <h4 class="text-xs font-bold text-slate-900 dark:text-white">${emptyTitle}</h4>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${emptyDesc}</p>
                        </div>
                    ` : `
                        <!-- Visual Bento Cards View -->
                        <div class="digitizer-cards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${state.layout === 'table' ? 'hidden' : ''}">
                            ${items.map(t => renderWorkerTaskCard(t, isCompletedSection)).join('')}
                        </div>

                        <!-- Compact 8-Column Table View -->
                        <div class="digitizer-table-container overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-primary/20 shadow-xs bg-white dark:bg-card-dark ${state.layout === 'grid' ? 'hidden' : ''}">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-primary/20 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <th class="px-4 py-3 w-[145px]">Order # · Date</th>
                                        <th class="px-4 py-3 min-w-[200px]">Design &amp; Service</th>
                                        <th class="px-4 py-3 w-[140px]">Placement &amp; Size</th>
                                        <th class="px-4 py-3 w-[110px]">Formats</th>
                                        <th class="px-4 py-3 w-[130px]">Fabric</th>
                                        <th class="px-4 py-3 w-[125px]">Stage</th>
                                        <th class="px-4 py-3 w-[120px]">Speed</th>
                                        <th class="px-4 py-3 text-right w-[210px]">Production Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-primary/10 font-sans">
                                    ${items.map(t => renderWorkerTaskTableRow(t, isCompletedSection)).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </section>
        `;

        const filter = state.activeFilter;

        if (filter === 'new') {
            container.innerHTML = `
                <div class="stage-sections-flow">
                    ${renderSubSection(
                        'stage-worker-tasks-new',
                        'fiber_new',
                        'New Orders / Assigned Work',
                        { icon: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-primary/15 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/30', emptyBg: 'bg-amber-50/40 dark:bg-amber-950/15', emptyBorder: 'border-amber-200/60 dark:border-primary/15', emptyIcon: 'text-amber-600/70 dark:text-primary/70' },
                        newTasks.length,
                        newTasks,
                        'No pending new orders',
                        'All incoming jobs have been accepted and dispatched to production.'
                    )}
                </div>
            `;
        } else if (filter === 'revisions') {
            container.innerHTML = `
                <div class="stage-sections-flow">
                    ${renderSubSection(
                        'stage-worker-tasks-revisions',
                        'warning',
                        'Stitch Revisions (Priority)',
                        { icon: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50', emptyBg: 'bg-purple-50/40 dark:bg-purple-950/15', emptyBorder: 'border-purple-200/60 dark:border-purple-800/20', emptyIcon: 'text-purple-500/70' },
                        revisionTasks.length,
                        revisionTasks,
                        'No revision requests',
                        'All stitch files and vector deliverables passed quality control.'
                    )}
                </div>
            `;
        } else if (filter === 'in_progress') {
            container.innerHTML = `
                <div class="stage-sections-flow">
                    ${renderSubSection(
                        'stage-worker-tasks-production',
                        'precision_manufacturing',
                        'In Production Tasks',
                        { icon: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50', emptyBg: 'bg-blue-50/40 dark:bg-blue-950/15', emptyBorder: 'border-blue-200/60 dark:border-blue-800/20', emptyIcon: 'text-blue-500/70' },
                        productionTasks.length,
                        productionTasks,
                        'No tasks in production',
                        'Select a new order from your queue to begin digitizing.'
                    )}
                </div>
            `;
        } else if (filter === 'completed') {
            container.innerHTML = `
                <div class="stage-sections-flow">
                    ${renderSubSection(
                        'stage-worker-tasks-completed',
                        'task_alt',
                        'Completed Deliverables Archive',
                        { icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20', emptyBg: 'bg-emerald-50/40 dark:bg-emerald-950/15', emptyBorder: 'border-emerald-200/60 dark:border-emerald-800/20', emptyIcon: 'text-emerald-500/70' },
                        completedTasks.length,
                        completedTasks,
                        'No completed deliverables',
                        'Uploaded production files will appear here.',
                        true
                    )}
                </div>
            `;
        } else {
            // 'all': Display all 4 stages in a .stage-sections-flow with 28px gaps
            container.innerHTML = `
                <div class="stage-sections-flow">
                    ${renderSubSection(
                        'stage-worker-tasks-new',
                        'fiber_new',
                        'New Orders / Assigned Work',
                        { icon: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-primary/15 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/30', emptyBg: 'bg-amber-50/40 dark:bg-amber-950/15', emptyBorder: 'border-amber-200/60 dark:border-primary/15', emptyIcon: 'text-amber-600/70 dark:text-primary/70' },
                        newTasks.length,
                        newTasks,
                        'No pending new orders',
                        'All incoming jobs have been accepted and dispatched to production.'
                    )}
                    ${renderSubSection(
                        'stage-worker-tasks-revisions',
                        'warning',
                        'Stitch Revisions (Priority)',
                        { icon: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50', emptyBg: 'bg-purple-50/40 dark:bg-purple-950/15', emptyBorder: 'border-purple-200/60 dark:border-purple-800/20', emptyIcon: 'text-purple-500/70' },
                        revisionTasks.length,
                        revisionTasks,
                        'Zero revision rework requests',
                        'All stitch files and vector deliverables passed quality control.'
                    )}
                    ${renderSubSection(
                        'stage-worker-tasks-production',
                        'precision_manufacturing',
                        'In Production Tasks',
                        { icon: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50', emptyBg: 'bg-blue-50/40 dark:bg-blue-950/15', emptyBorder: 'border-blue-200/60 dark:border-blue-800/20', emptyIcon: 'text-blue-500/70' },
                        productionTasks.length,
                        productionTasks,
                        'Workstation queue clear',
                        'No tasks currently under active digitization.'
                    )}
                    ${renderSubSection(
                        'stage-worker-tasks-completed',
                        'task_alt',
                        'Completed Deliverables Archive',
                        { icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20', emptyBg: 'bg-emerald-50/40 dark:bg-emerald-950/15', emptyBorder: 'border-emerald-200/60 dark:border-emerald-800/20', emptyIcon: 'text-emerald-500/70' },
                        completedTasks.length,
                        completedTasks,
                        'No completed deliverables',
                        'Uploaded production files will appear here.',
                        true
                    )}
                </div>
            `;
        }
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

        container.innerHTML = `
            <!-- Visual Bento Cards View -->
            <div class="digitizer-cards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${state.layout === 'table' ? 'hidden' : ''}">
                ${completed.map(t => renderWorkerTaskCard(t, true)).join('')}
            </div>

            <!-- Compact 8-Column Table View -->
            <div class="digitizer-table-container overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-primary/20 shadow-xs bg-white dark:bg-card-dark ${state.layout === 'grid' ? 'hidden' : ''}">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="border-b border-slate-200 dark:border-primary/20 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th class="px-4 py-3 w-[145px]">Order # · Date</th>
                            <th class="px-4 py-3 min-w-[200px]">Design &amp; Service</th>
                            <th class="px-4 py-3 w-[140px]">Placement &amp; Size</th>
                            <th class="px-4 py-3 w-[110px]">Formats</th>
                            <th class="px-4 py-3 w-[130px]">Fabric</th>
                            <th class="px-4 py-3 w-[125px]">Stage</th>
                            <th class="px-4 py-3 w-[120px]">Speed</th>
                            <th class="px-4 py-3 text-right w-[210px]">Archive Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-primary/10 font-sans">
                        ${completed.map(t => renderWorkerTaskTableRow(t, true)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Worker Bento Card Component (Production First: Prominent Placement, Exact Size, Requested Formats, 3D Puff, Artwork Thumbnail, Verbatim Notes)
    function renderWorkerTaskCard(task, isCompleted) {
        const isRevision = task.status === 'revision_requested' || !!task.revision_notes;
        const isRush = task.isRush || task.turnaround_speed === 'rush' || task.priority === 'rush';
        const orderNum = task.order_number || task.orderNumber || 'ORD-8492';
        const safeOrderNumber = String(orderNum).replace(/-/g, '&#8209;');

        // Stage color classes (distinct 2px border with respective color theme)
        let cardThemeClass = 'border-2 border-amber-500/85 dark:border-primary/85 shadow-xs ring-1 ring-amber-500/20 hover:border-amber-600 dark:hover:border-primary';
        let orderIdClass = 'bg-amber-100 dark:bg-primary/15 text-amber-900 dark:text-primary border-amber-300 dark:border-primary/30';
        if (isCompleted) {
            cardThemeClass = 'border-2 border-emerald-500/85 dark:border-emerald-400/80 shadow-xs ring-1 ring-emerald-500/20 hover:border-emerald-600';
            orderIdClass = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
        } else if (isRevision) {
            cardThemeClass = 'border-2 border-purple-500/85 dark:border-purple-400/80 shadow-xs ring-1 ring-purple-500/20 hover:border-purple-600';
            orderIdClass = 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-700/50';
        } else if (task.status === 'in_progress') {
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
        } else if (task.status === 'in_progress') {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Production</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-primary/15 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/30 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> New Order</span>';
        }

        // Date and Time
        const orderDt = formatOrderDateTime(task.created_at);

        // 1. PLACEMENT (Hero production detail - largest text on card)
        let placement = task.placement || task.target_placement || task.targetPlacement;
        if (!placement || placement.toLowerCase().includes('digitizing') || placement.toLowerCase().includes('custom') || placement === 'Standard') {
            const dName = (task.design_name || task.designName || '').toLowerCase();
            if (dName.includes('cap') || dName.includes('hat')) placement = 'Cap Front';
            else if (dName.includes('jacket') || dName.includes('back')) placement = 'Jacket Back';
            else if (dName.includes('sleeve')) placement = 'Sleeve';
            else placement = 'Left Chest';
        }
        const placementUpper = String(placement).trim().toUpperCase();

        const designTitle = task.design_name || task.designName || '';

        // 2. SIZE
        const sizeVal = task.dimensions || task.sizing || '4.0" WIDE';

        // 3. FILE FORMAT
        const instructionsText = `${task.instructions || ''} ${task.special_instructions || ''} ${task.specialOptions || ''} ${task.notes || ''}`;
        const reqFormats = parseRequestedFormats(task.target_format || task.fileFormat || task.file_format || 'DST', instructionsText);
        const machineFormats = reqFormats.filter(f => !['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP', 'EMB', 'ZIP'].includes(f));
        if (machineFormats.length === 0) machineFormats.push('DST');
        const formatDisplay = machineFormats.join(' + ') + (reqFormats.includes('EMB') ? ' (+EMB opt)' : '');

        // 4. EMBROIDERY TYPE / SPECIAL OPTION (3D Puff, Appliqué, Trims)
        const allNotesLower = `${task.special_options || ''} ${task.specialOptions || ''} ${task.embroidery_type || ''} ${task.special_instructions || ''} ${task.instructions || ''} ${task.notes || ''} ${task.revision_notes || ''}`.toLowerCase();
        const is3dPuff = allNotesLower.includes('3d puff') || allNotesLower.includes('puff') || allNotesLower.includes('foam');
        const isApplique = allNotesLower.includes('appliqu');
        const hasTrims = allNotesLower.includes('trim');

        let typeText = 'FLAT EMBROIDERY';
        let specialBadgeHtml = '';
        if (is3dPuff) {
            typeText = '3D PUFF';
            specialBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/25 text-amber-950 dark:text-primary border border-amber-500/50 font-black text-[11px] tracking-wide shrink-0 shadow-2xs">
                    <span class="text-amber-600 dark:text-primary font-bold">⚡</span>
                    <span>3D PUFF</span>
                </span>
            `;
        } else if (isApplique) {
            typeText = 'APPLIQUÉ';
            specialBadgeHtml = `
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-500/40 font-black text-[11px] tracking-wide shrink-0 shadow-2xs">
                    <span>🧵</span>
                    <span>APPLIQUÉ</span>
                </span>
            `;
        }

        // Fabric / Substrate
        const fabricVal = task.target_fabric || task.fabric_type || task.fabricType || 'Pique Polo';

        // 5. CUSTOMER ARTWORK (Thumbnail + Tap to Enlarge + Download)
        const rawFiles = (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files.length > 0)
            ? task.raw_artwork_files
            : (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles.length > 0)
                ? task.rawArtworkFiles
                : [{ name: 'artwork.png', url: task.artwork_url || 'images/service-digitizing.png' }];
        const primaryArt = rawFiles[0] || { name: 'artwork.png', url: 'images/service-digitizing.png' };
        const artUrl = primaryArt.url || task.artwork_url || 'images/service-digitizing.png';
        const artName = primaryArt.name || 'artwork.png';
        const artExt = (getFileExtension(artName) || 'PNG').toUpperCase();
        const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(artExt);

        // 6. CUSTOMER INSTRUCTIONS (Sanitized, 2-3 lines clamped with ...)
        const clientNotes = (task.instructions || task.special_instructions || task.notes || '')
            .replace(/Standard commercial digitizing standards apply.*$/i, '')
            .trim();
        const hasNotes = clientNotes.length > 0;
        const isLongNotes = clientNotes.length > 110 || (clientNotes.match(/\n/g) || []).length >= 2;

        // Deliverables files list if any
        const deliverables = task.deliverables || [];
        const hasDeliverables = Array.isArray(deliverables) && deliverables.length > 0;

        return `
            <div id="digitizer-card-${orderNum}" class="digitizer-bento-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark ${cardThemeClass} shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                    <!-- Header Bar: ID, Date & Time, Badges -->
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
                            ${rushBadge}
                        </div>
                    </div>

                    <!-- HERO PRODUCTION DETAIL: PLACEMENT (Bold & Prominent) -->
                    <div class="mt-2 mb-2">
                        <div class="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-primary">Placement</div>
                        <div class="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-snug">
                            ${escapeHtml(placementUpper)}
                        </div>
                        ${designTitle && designTitle.toUpperCase() !== placementUpper ? `
                            <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5" title="${escapeHtml(designTitle)}">
                                ${escapeHtml(designTitle)}
                            </div>
                        ` : ''}
                    </div>

                    <!-- PRODUCTION LABELS BENTO: SIZE, FORMAT, TYPE & FABRIC -->
                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-primary/20 space-y-2 mb-2.5">
                        <!-- SIZE & SPECIAL OPTION BADGE -->
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-baseline gap-1.5 min-w-0">
                                <span class="font-bold text-slate-500 dark:text-slate-400 text-[11px] tracking-wider shrink-0">SIZE:</span>
                                <span class="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase truncate">${escapeHtml(sizeVal)}</span>
                            </div>
                            ${specialBadgeHtml}
                        </div>

                        <!-- FORMAT: Requested Machine Formats -->
                        <div class="flex items-baseline gap-1.5">
                            <span class="font-bold text-slate-500 dark:text-slate-400 text-[11px] tracking-wider shrink-0">FORMAT:</span>
                            <span class="font-black text-amber-950 dark:text-primary text-xs sm:text-sm tracking-wide uppercase">${escapeHtml(formatDisplay)}</span>
                        </div>

                        <!-- TYPE & FABRIC -->
                        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-primary/10 text-xs">
                            <div class="flex items-center gap-1.5 min-w-0">
                                <span class="font-bold text-slate-500 dark:text-slate-400 text-[11px] tracking-wider shrink-0">TYPE:</span>
                                <span class="font-bold text-slate-800 dark:text-slate-200 uppercase truncate text-[11.5px]">${typeText}</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px] sm:max-w-[150px]" title="${escapeHtml(fabricVal)}">
                                <span class="font-semibold text-slate-400 dark:text-slate-500">FABRIC:</span> ${escapeHtml(fabricVal)}
                            </div>
                        </div>
                    </div>

                    <!-- CUSTOMER ARTWORK THUMBNAIL (Tap to enlarge in lightbox, direct download) -->
                    <div class="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/20 flex items-center justify-between gap-2.5 mb-2.5 shadow-2xs">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div onclick="window.workerWorkspace.openDigitizerArtworkPreview('${orderNum}', 0)" class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group/art hover:ring-2 hover:ring-amber-500/50 transition-all" title="Click to view artwork full size">
                                ${isImage ? `
                                    <img src="${artUrl}" alt="Artwork thumbnail" class="w-full h-full object-contain p-1 group-hover/art:scale-110 transition-transform" loading="lazy" />
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
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.2 rounded font-mono text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">${artExt}</span>
                                    <span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]" title="${escapeHtml(artName)}">${escapeHtml(artName)}</span>
                                </div>
                                <button type="button" onclick="window.workerWorkspace.openDigitizerArtworkPreview('${orderNum}', 0)" class="text-[11px] font-semibold text-amber-700 dark:text-primary hover:underline cursor-pointer flex items-center gap-0.5 mt-0.5">
                                    <span class="material-symbols-outlined text-[12px]">visibility</span>
                                    <span>Tap to enlarge</span>
                                </button>
                            </div>
                        </div>
                        <a href="${artUrl}" download="${escapeHtml(artName)}" target="_blank" onclick="event.stopPropagation()" class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0" title="Download original artwork file">
                            <span class="material-symbols-outlined text-xs">download</span>
                            <span>Download</span>
                        </a>
                    </div>

                    <!-- CUSTOMER INSTRUCTIONS: 2-3 lines visible with line-clamp -->
                    <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-primary/15 text-xs mb-2">
                        <div class="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[13px] text-amber-600 dark:text-primary">chat</span>
                                <span>Customer Notes:</span>
                            </span>
                            ${isLongNotes ? `
                                <button type="button" onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="text-[10.5px] font-bold text-amber-700 dark:text-primary hover:underline cursor-pointer">
                                    View Full Instructions →
                                </button>
                            ` : ''}
                        </div>
                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed ${isLongNotes ? 'line-clamp-3' : ''}" style="${isLongNotes ? 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;' : ''}">
                            ${escapeHtml(hasNotes ? clientNotes : 'Standard commercial digitizing. Follow artwork contours.')}
                        </p>
                    </div>

                    <!-- REVISION FEEDBACK ALERT (If applicable) -->
                    ${isRevision && (task.revision_notes || task.revisionNotes) ? `
                        <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs mb-2">
                            <div class="text-[10.5px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1 mb-0.5">
                                <span class="material-symbols-outlined text-xs text-purple-600 dark:text-purple-400">warning</span>
                                <span>Revision Feedback:</span>
                            </div>
                            <p class="text-xs text-purple-950 dark:text-purple-200 line-clamp-2 leading-tight">
                                ${escapeHtml(task.revision_notes || task.revisionNotes)}
                            </p>
                        </div>
                    ` : ''}
                </div>

                <!-- ACTIONS TOOLBAR: View Order (left) + Attach Files (right) -->
                <div class="pt-2.5 border-t border-slate-100 dark:border-primary/10 flex items-center justify-between gap-2 mt-2">
                    <button type="button" onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors" title="Open full dedicated work order">
                        <span>View Order</span>
                        <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">arrow_forward</span>
                    </button>
                    <div>
                        ${!isCompleted ? `
                            <button type="button" onclick="window.workerWorkspace.openDeliverableUploadModal('${orderNum}')" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer focus-visible:outline-2 focus-visible:outline-primary" title="Attach production deliverables (.DST, PDF, JPG)">
                                <span class="material-symbols-outlined text-sm">cloud_upload</span>
                                <span>Attach Files</span>
                            </button>
                        ` : `
                            <button type="button" onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer" title="View delivered files">
                                <span class="material-symbols-outlined text-xs">cloud_done</span>
                                <span>Files (${deliverables.length})</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Compact 8-Column Table Row Component for Digitizer Dashboard
    function renderWorkerTaskTableRow(task, isCompleted) {
        const isRevision = task.status === 'revision_requested' || !!task.revision_notes;
        const isRush = task.isRush || task.turnaround_speed === 'rush' || task.priority === 'rush';
        const orderNum = task.order_number || task.orderNumber || 'ORD-8492';
        const safeOrderNumber = String(orderNum).replace(/-/g, '&#8209;');

        // Stage color classes
        let rowBorderClass = 'border-l-4 border-l-amber-500 bg-amber-500/[0.02] hover:bg-amber-500/[0.06]';
        let orderIdClass = 'text-amber-900 dark:text-primary';
        if (isCompleted) {
            rowBorderClass = 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]';
            orderIdClass = 'text-emerald-800 dark:text-emerald-400';
        } else if (isRevision) {
            rowBorderClass = 'border-l-4 border-l-purple-500 bg-purple-500/[0.02] hover:bg-purple-500/[0.06]';
            orderIdClass = 'text-purple-900 dark:text-purple-300';
        } else if (task.status === 'in_progress') {
            rowBorderClass = 'border-l-4 border-l-blue-500 bg-blue-500/[0.02] hover:bg-blue-500/[0.06]';
            orderIdClass = 'text-blue-900 dark:text-blue-300';
        }

        // Badges
        const rushBadge = isRush
            ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0 whitespace-nowrap shadow-2xs"><span class="material-symbols-outlined text-xs text-rose-600 dark:text-rose-400">bolt</span> ⚡ RUSH · 5–8h</span>`
            : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap"><span class="material-symbols-outlined text-[11px] text-slate-500">schedule</span> Standard · 12–24h</span>`;

        let statusBadge = '';
        if (isCompleted) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold whitespace-nowrap"><span class="material-symbols-outlined text-xs">check_circle</span> Completed</span>';
        } else if (isRevision) {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50 text-[11px] font-bold whitespace-nowrap animate-pulse"><span class="material-symbols-outlined text-xs">warning</span> Revision</span>';
        } else if (task.status === 'in_progress') {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Prod</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-primary/15 text-amber-900 dark:text-primary border border-amber-200 dark:border-primary/30 text-[11px] font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> New</span>';
        }

        // Requested Formats
        const instructionsText = `${task.instructions || ''} ${task.special_instructions || ''} ${task.specialOptions || ''} ${task.notes || ''}`;
        const reqFormats = parseRequestedFormats(task.target_format || task.fileFormat || task.file_format || 'DST', instructionsText);
        const reqFormatsBadges = reqFormats.map(f => {
            if (f === 'EMB') return `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">.EMB</span>`;
            return `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black bg-amber-500/20 text-amber-900 dark:text-primary border border-amber-500/30">.${f}</span>`;
        }).join(' ');

        const orderDt = formatOrderDateTime(task.created_at);
        const designTitle = task.design_name || task.designName || task.placement || 'Custom Embroidery';

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
                    <div class="font-black text-slate-900 dark:text-white text-xs leading-snug truncate max-w-[240px]" title="${designTitle}">${designTitle}</div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <span class="font-semibold text-slate-700 dark:text-slate-300">${task.service_type || task.serviceType || 'Digitizing'}</span>
                        <span>·</span>
                        <span class="font-mono">${task.id || task.taskId || 'TSK-ACTIVE'}</span>
                    </div>
                    ${isRevision ? `<div class="text-[10px] text-purple-700 dark:text-purple-300 font-medium truncate max-w-[240px] mt-0.5 italic">⚠️ ${task.revision_notes || task.revisionNotes || 'Revision feedback attached'}</div>` : ''}
                </td>

                <!-- 3. Placement & Size -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[140px]">
                    <div class="font-bold text-slate-800 dark:text-slate-200 text-xs">${task.placement || 'Left Chest'}</div>
                    <div class="text-[10px] text-slate-500 font-mono">${task.dimensions || task.sizing || '3.5" W x 2.2" H'}</div>
                </td>

                <!-- 4. Formats -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[110px]">
                    <div class="flex flex-wrap gap-1">${reqFormatsBadges}</div>
                </td>

                <!-- 5. Fabric -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[130px]">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px] block" title="${task.target_fabric || task.fabric_type || 'Pique Polo Knit'}">${task.target_fabric || task.fabric_type || 'Pique Polo Knit'}</span>
                </td>

                <!-- 6. Status -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[125px]">
                    ${statusBadge}
                </td>

                <!-- 7. Turnaround -->
                <td class="px-4 py-3.5 whitespace-nowrap w-[120px]">
                    ${rushBadge}
                </td>

                <!-- 8. Actions -->
                <td class="px-4 py-3.5 text-right whitespace-nowrap w-[210px]">
                    <div class="flex items-center justify-end gap-1.5">
                        <button type="button" onclick="window.workerWorkspace.openDigitizerArtworkPreview('${orderNum}', 0)" class="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-primary border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors" title="Preview original artwork inside lightbox">
                            <span class="material-symbols-outlined text-xs">visibility</span>
                            <span class="hidden xl:inline">Preview</span>
                        </button>
                        <button type="button" onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-primary/20 inline-flex items-center gap-1 cursor-pointer transition-colors" title="View technical specs">
                            <span class="material-symbols-outlined text-xs">description</span>
                            <span class="hidden xl:inline">Details</span>
                        </button>
                        ${!isCompleted ? `
                            <button type="button" onclick="window.workerWorkspace.openDeliverableUploadModal('${orderNum}')" class="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs transition-transform hover:scale-[1.02]" title="Upload production deliverables">
                                <span class="material-symbols-outlined text-xs">cloud_upload</span>
                                <span>Upload</span>
                            </button>
                        ` : `
                            <button type="button" onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1 cursor-pointer" title="View delivered files">
                                <span class="material-symbols-outlined text-xs">download</span>
                                <span>Files</span>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }

    // ===================================================================
    //  PAGE 5: WORKER SETTINGS (worker-settings.html)
    // ===================================================================
    function renderSettingsView() {
        const form = document.getElementById('worker-settings-form');
        if (!form) return;

        setInputValue('worker-name', state.session?.displayName || 'Digitizer');
        setInputValue('worker-specialty', 'Embroidery Digitizing (3D Puff & Left Chest)');
        setInputValue('worker-software', 'Wilcom EmbroideryStudio e4.5');
        setInputValue('worker-daily-capacity', '6');
    }

    // ----- Modals -----
    function ensureModalsExist() {
        if (!document.getElementById('task-details-modal')) {
            const modalHtml = `
                <div id="task-details-modal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-4">
                    <div class="w-full max-w-lg bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/30 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
                        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-primary/20">
                            <h3 class="font-black text-base flex items-center gap-2 text-slate-900 dark:text-white">
                                <span class="material-symbols-outlined text-amber-800 dark:text-primary">assignment</span>
                                <span>Production Specs (<span id="detail-task-id" class="font-mono text-amber-900 dark:text-primary">ORD-0000</span>)</span>
                            </h3>
                            <button onclick="window.workerWorkspace.closeTaskDetailsModal()" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div class="space-y-3 text-xs">
                            <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-primary/20">
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Design Title</span>
                                    <strong id="detail-design-name" class="text-slate-900 dark:text-white">Apex Mountain</strong>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Client Reference</span>
                                    <span id="detail-client-id" class="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">Client #CLI-8492</span>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Target Fabric</span>
                                    <strong id="detail-fabric" class="text-slate-900 dark:text-white">Pique Polo Knit</strong>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block">Dimensions</span>
                                    <strong id="detail-dimensions">3.5" W x 2.2" H</strong>
                                </div>
                            </div>
                            <!-- Consolidated Deliverables Requirements Box -->
                            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-primary/20 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DELIVER:</span>
                                    <span id="detail-deliver-optional" class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Optional: EMB</span>
                                </div>
                                <div id="detail-deliver-required" class="font-mono font-black text-amber-900 dark:text-primary text-xs mt-0.5 tracking-wide">
                                    DST · JPG Preview · PDF Worksheet
                                </div>
                            </div>
                            <div class="py-1">
                                <span class="text-slate-500 block mb-1">Special Machine Instructions:</span>
                                <p id="detail-instructions" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/15 text-slate-800 dark:text-slate-200 italic leading-relaxed">None</p>
                            </div>
                            <div id="detail-revision-container" class="hidden p-3 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-600/40">
                                <span class="text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 block mb-1">Revision Notes:</span>
                                <p id="detail-revision-notes" class="text-[11px] text-slate-700 dark:text-slate-300 font-medium italic"></p>
                            </div>
                            <div class="space-y-1.5">
                                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Customer Artwork:</span>
                                <div id="detail-artwork-container" class="space-y-1.5"></div>
                            </div>
                            <div id="detail-deliverables-container" class="hidden space-y-1.5">
                                <span class="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Completed Deliverables:</span>
                                <div id="detail-deliverables-list" class="space-y-1"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-4 mt-3 border-t border-slate-200 dark:border-primary/20">
                            <button type="button" id="detail-attach-btn" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform hover:scale-[1.02]">
                                <span class="material-symbols-outlined text-sm">cloud_upload</span>
                                <span>Attach Deliverables</span>
                            </button>
                            <button type="button" onclick="window.workerWorkspace.closeTaskDetailsModal()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs cursor-pointer ml-auto">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        if (!document.getElementById('stitch-zoom-modal')) {
            const zoomHtml = `
                <div id="stitch-zoom-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4" onclick="if(event.target === this) window.workerWorkspace.closeStitchOutZoomModal()">
                    <div class="relative max-w-3xl w-full bg-white dark:bg-card-dark rounded-2xl overflow-hidden shadow-2xl p-4">
                        <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-primary/20">
                            <h4 id="zoom-modal-title" class="font-bold text-sm text-slate-900 dark:text-white">Artwork Preview</h4>
                            <button onclick="window.workerWorkspace.closeStitchOutZoomModal()" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div class="flex items-center justify-center max-h-[70vh] overflow-hidden rounded-xl bg-slate-950/10">
                            <img id="zoom-modal-img" src="" alt="Zoom Preview" class="max-h-[70vh] w-auto object-contain">
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', zoomHtml);
        }

        if (!document.getElementById('digitizer-artwork-preview-modal')) {
            const previewModalHtml = `
                <div id="digitizer-artwork-preview-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-5" onclick="if(event.target === this) window.workerWorkspace.closeDigitizerArtworkPreview()">
                    <div class="relative w-full max-w-5xl h-[88vh] bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
                        <div class="px-5 py-3 bg-slate-900/90 border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
                            <div class="flex items-center gap-3 min-w-0">
                                <span id="digitizer-preview-format-badge" class="px-2 py-0.5 rounded-md font-mono text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">PNG</span>
                                <div class="min-w-0">
                                    <h4 id="digitizer-preview-filename" class="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">Artwork_Primary.png</h4>
                                    <p id="digitizer-preview-filesize" class="text-[11px] text-slate-400 font-mono">Production Asset</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <div id="digitizer-preview-nav-controls" class="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1">
                                    <button type="button" id="digitizer-preview-prev-btn" onclick="window.workerWorkspace.navigateDigitizerArtworkPreview(-1)" class="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                                    </button>
                                    <span id="digitizer-preview-counter" class="text-xs font-mono font-bold text-slate-300 px-1">1 / 1</span>
                                    <button type="button" id="digitizer-preview-next-btn" onclick="window.workerWorkspace.navigateDigitizerArtworkPreview(1)" class="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                    </button>
                                </div>
                                <a id="digitizer-preview-download-btn" href="#" download class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    <span>Download</span>
                                </a>
                                <button type="button" onclick="window.workerWorkspace.closeDigitizerArtworkPreview()" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 relative overflow-hidden flex items-center justify-center p-4" style="background-color: #0b0f17; background-image: linear-gradient(45deg, #131b2a 25%, transparent 25%), linear-gradient(-45deg, #131b2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #131b2a 75%), linear-gradient(-45deg, transparent 75%, #131b2a 75%); background-size: 24px 24px;">
                            <div id="digitizer-preview-image-container" class="w-full h-full flex items-center justify-center overflow-auto p-2">
                                <img id="digitizer-preview-img" src="" alt="Artwork preview" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                            </div>
                            <div id="digitizer-preview-pdf-container" class="w-full h-full hidden flex flex-col p-1">
                                <iframe id="digitizer-preview-pdf-iframe" src="" class="w-full h-full border-0 rounded-xl bg-white shadow-xl"></iframe>
                            </div>
                            <div id="digitizer-preview-fallback-container" class="max-w-md w-full p-6 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl text-center hidden">
                                <h4 id="digitizer-fallback-filename" class="text-base font-bold text-white mb-1 truncate">Artwork_Source.ai</h4>
                                <p class="text-xs text-slate-400 mb-5 leading-relaxed">Source vector / production file (<span id="digitizer-fallback-ext" class="font-bold text-amber-400">AI</span>).</p>
                                <a id="digitizer-fallback-download-btn" href="#" download class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer">
                                    <span>Download File</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', previewModalHtml);
        }
    }

    // Global card expansion helper
    window.toggleOrderCardExpand = function(orderNumber, btn) {
        const card = document.getElementById(`digitizer-card-${orderNumber}`)
            || (btn ? btn.closest('.digitizer-bento-card, .client-order-card, .admin-order-card') : null)
            || document.getElementById(`client-order-card-${orderNumber}`)
            || document.getElementById(`admin-order-card-${orderNumber}`);
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

    function openDeliverableUploadModal(taskNumber) {
        state.currentTaskNumber = taskNumber;
        state.stagedDeliverableFiles = [];
        const task = state.tasks.find(t => (t.order_number || t.orderNumber) === taskNumber);

        setElText('upload-task-id', taskNumber);
        setElText('upload-design-name', task ? (task.design_name || task.placement || 'Custom Embroidery') : 'Custom Embroidery');

        const isRush = task ? (task.isRush || task.turnaround_speed === 'rush' || task.priority === 'rush') : false;
        const rushEl = document.getElementById('upload-task-rush-badge');
        if (rushEl) {
            rushEl.innerHTML = isRush
                ? `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">⚡ RUSH · 5–8h</span>`
                : '';
        }

        const instructionsText = task ? `${task.instructions || ''} ${task.special_instructions || ''} ${task.notes || ''}` : '';
        const reqFormats = parseRequestedFormats(task ? (task.target_format || task.file_format || 'DST') : 'DST', instructionsText);
        const cleanReqFormats = reqFormats.filter(f => f !== 'EMB');
        const reqString = cleanReqFormats.length > 0 ? cleanReqFormats.join(' · ') : 'DST';

        const reqSummaryEl = document.getElementById('upload-deliver-req-summary');
        if (reqSummaryEl) reqSummaryEl.textContent = `${reqString} · JPG · PDF`;

        const optSummaryEl = document.getElementById('upload-deliver-opt-summary');
        if (optSummaryEl) optSummaryEl.textContent = 'EMB';

        // Setup drag and drop
        const dropzone = document.getElementById('worker-tasks-upload-dropzone');
        if (dropzone) {
            dropzone.ondragover = (e) => {
                e.preventDefault();
                dropzone.classList.add('border-amber-500');
            };
            dropzone.ondragleave = (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-amber-500');
            };
            dropzone.ondrop = (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-amber-500');
                const files = Array.from(e.dataTransfer.files || []);
                if (files.length > 0) {
                    state.stagedDeliverableFiles = (state.stagedDeliverableFiles || []).concat(files);
                    updateDeliverableUploadUI();
                }
            };
        }

        updateDeliverableUploadUI();

        const modal = document.getElementById('deliverable-upload-modal');
        if (modal) modal.classList.remove('hidden');
    }

    function closeDeliverableUploadModal() {
        const modal = document.getElementById('deliverable-upload-modal');
        if (modal) modal.classList.add('hidden');
    }

    function handleDeliverableFileInput(event) {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            state.stagedDeliverableFiles = (state.stagedDeliverableFiles || []).concat(files);
            updateDeliverableUploadUI();
        }
        event.target.value = '';
    }

    function removeStagedDeliverableFile(index) {
        if (!state.stagedDeliverableFiles) return;
        state.stagedDeliverableFiles.splice(index, 1);
        updateDeliverableUploadUI();
    }

    function updateDeliverableUploadUI() {
        const taskNumber = state.currentTaskNumber;
        const task = state.tasks.find(t => (t.order_number || t.orderNumber) === taskNumber);
        const staged = state.stagedDeliverableFiles || [];

        const instructionsText = task ? `${task.instructions || ''} ${task.special_instructions || ''} ${task.notes || ''}` : '';
        const rawReq = parseRequestedFormats(task ? (task.target_format || task.file_format || 'DST') : 'DST', instructionsText);
        const requiredFormats = rawReq.filter(f => !['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP', 'EMB', 'ZIP'].includes(f));
        if (requiredFormats.length === 0) requiredFormats.push('DST');

        const attachedExtensions = staged.map(f => getFileExtension(f.name));

        const hasPdf = attachedExtensions.includes('PDF');
        const hasJpg = attachedExtensions.some(ext => ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext));
        const hasEmb = attachedExtensions.includes('EMB');

        // Build checklist items
        const checklistItems = [];
        requiredFormats.forEach(fmt => {
            const met = attachedExtensions.includes(fmt);
            checklistItems.push({
                label: fmt,
                badge: fmt,
                met: met,
                isOptional: false
            });
        });

        checklistItems.push({
            label: 'JPG Preview',
            badge: 'JPG Preview',
            met: hasJpg,
            isOptional: false
        });

        checklistItems.push({
            label: 'PDF Worksheet',
            badge: 'PDF Worksheet',
            met: hasPdf,
            isOptional: false
        });

        checklistItems.push({
            label: 'EMB',
            badge: 'EMB',
            met: hasEmb,
            isOptional: true
        });

        // Render detected checklist
        const checklistEl = document.getElementById('worker-task-validation-checklist');
        if (checklistEl) {
            checklistEl.innerHTML = checklistItems.map(item => {
                if (item.met) {
                    return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"><span>✅</span> <span>${item.badge} uploaded</span></span>`;
                } else if (item.isOptional) {
                    return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700"><span>○</span> <span>${item.badge} optional</span></span>`;
                } else {
                    return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"><span>○</span> <span>${item.badge}</span></span>`;
                }
            }).join('');
        }

        // Render staged files list
        const stagedContainer = document.getElementById('worker-task-staged-list');
        if (stagedContainer) {
            if (staged.length === 0) {
                stagedContainer.innerHTML = '';
            } else {
                stagedContainer.innerHTML = staged.map((f, idx) => `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-primary/20 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-amber-500/15 text-amber-900 dark:text-primary border border-amber-500/30 shrink-0">${getFileExtension(f.name) || 'FILE'}</span>
                            <span class="font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs" title="${f.name}">${f.name}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${f.size ? formatFileSize(f.size) : ''}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-sm">check</span>
                                <span>Ready</span>
                            </span>
                            <button type="button" onclick="window.workerWorkspace.removeStagedDeliverableFile(${idx})" class="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="Remove attached file">
                                <span class="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Calculate missing
        const missing = [];
        requiredFormats.forEach(fmt => {
            if (!attachedExtensions.includes(fmt)) missing.push(fmt);
        });
        if (!hasJpg) missing.push('JPG Preview');
        if (!hasPdf) missing.push('PDF');

        const isValid = missing.length === 0;

        const hintEl = document.getElementById('worker-task-submit-hint');
        if (hintEl) {
            hintEl.innerHTML = isValid
                ? `<span class="text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">check_circle</span> Ready to submit</span>`
                : `<span class="text-amber-700 dark:text-amber-400">Missing: ${missing.join(' + ')}</span>`;
        }

        const submitBtn = document.getElementById('worker-task-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = !isValid;
            if (isValid) {
                submitBtn.className = 'w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-primary/25 cursor-pointer transition-all flex items-center justify-center gap-2';
            } else {
                submitBtn.className = 'w-full py-3.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-black text-sm tracking-wide shadow-none cursor-not-allowed transition-all flex items-center justify-center gap-2';
            }
        }
    }

    async function handleDeliverableSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const taskNumber = state.currentTaskNumber;
        const staged = state.stagedDeliverableFiles || [];

        try {
            const deliverables = staged.length > 0
                ? staged.map(f => ({
                    name: f.name,
                    url: 'images/service-digitizing.png',
                    type: f.type || 'application/octet-stream',
                    size: f.size ? formatFileSize(f.size) : '150 KB'
                }))
                : [
                    { name: `${taskNumber}_production.dst`, url: 'images/service-digitizing.png', type: 'application/octet-stream', size: '245 KB' },
                    { name: `${taskNumber}_preview.jpg`, url: 'images/service-digitizing.png', type: 'image/jpeg', size: '180 KB' },
                    { name: `${taskNumber}_worksheet.pdf`, url: 'images/service-digitizing.png', type: 'application/pdf', size: '320 KB' }
                ];

            if (typeof window.insforgeClient.completeDigitizerTask === 'function') {
                await window.insforgeClient.completeDigitizerTask(taskNumber, deliverables);
            } else if (typeof window.insforgeClient.completeTask === 'function') {
                await window.insforgeClient.completeTask(taskNumber, {
                    status: 'completed',
                    deliverables: deliverables
                });
            }

            // Update in-memory state
            const idx = state.tasks.findIndex(t => (t.order_number || t.orderNumber) === taskNumber);
            if (idx !== -1) {
                state.tasks[idx].status = 'completed';
                state.tasks[idx].deliverables = deliverables;
                state.tasks[idx].deliverable_url = deliverables[0].url;
            }

            // Update local storage cache
            const cachedTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
            const cIdx = cachedTasks.findIndex(t => (t.order_number || t.orderNumber) === taskNumber);
            if (cIdx !== -1) {
                cachedTasks[cIdx].status = 'completed';
                cachedTasks[cIdx].deliverables = deliverables;
                cachedTasks[cIdx].completed_at = new Date().toISOString();
                localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(cachedTasks));
            }

            updateMetricsAcrossViews();

            // Broadcast live notifications to Admin and Client
            if (window.dezanNotificationEngine) {
                window.dezanNotificationEngine.broadcastToRole('admin', {
                    orderId: taskNumber,
                    type: 'deliverables_uploaded',
                    category: 'orders',
                    title: 'Digitizer Uploaded Machine Files',
                    message: `Digitizer submitted production files for #${taskNumber}. Ready for QA & release.`,
                    meta: `.DST, .JPG & .PDF Files Attached`,
                    actionLabel: 'QA & Release',
                    actionType: 'view_order',
                    accent: 'emerald',
                    icon: 'verified'
                });
                window.dezanNotificationEngine.broadcastToRole('client', {
                    orderId: taskNumber,
                    type: 'deliverables_ready',
                    category: 'ready',
                    title: 'Production Files Ready for Download!',
                    message: `Your embroidery digitizing files for #${taskNumber} are complete and verified.`,
                    meta: 'Files Verified · 1-Click Download',
                    actionLabel: 'Download Files',
                    actionType: 'download_order',
                    accent: 'emerald',
                    icon: 'cloud_download'
                });
            }

            alert(`Deliverables for ${taskNumber} uploaded successfully! Order marked as completed and cataloged in archive.`);
            closeDeliverableUploadModal();
            renderActivePage();
        } catch (err) {
            console.error('Submission error:', err);
            alert('Failed to submit deliverables: ' + err.message);
        }
    }

    function openTaskDetailsModal(taskNumber) {
        ensureModalsExist();
        let task = state.tasks?.find(t => (t.order_number || t.orderNumber) === taskNumber || t.task_number === taskNumber || t.id === taskNumber);
        if (!task && window.insforgeClient && typeof window.insforgeClient.getOrders === 'function') {
            const order = window.insforgeClient.getOrders().find(o => o.order_number === taskNumber || o.id === taskNumber);
            if (order) {
                task = {
                    order_number: order.order_number,
                    client_name: `Client #CLI-${String(order.order_number || '').replace(/^[A-Za-z]+-/, '') || '0000'}`,
                    design_name: order.project_name || order.placement,
                    target_fabric: order.fabric_type || 'Standard Fabric',
                    dimensions: order.sizing || 'Left Chest Standard',
                    target_format: order.file_format || 'DST, EMB',
                    special_instructions: order.instructions || '',
                    status: order.status,
                    artwork_url: order.artwork_url,
                    raw_artwork_files: order.raw_artwork_files,
                    deliverables: order.deliverables
                };
            }
        }
        if (!task) {
            task = {
                order_number: taskNumber || 'ORD-8840',
                client_name: 'Client Order',
                design_name: 'Custom Embroidery Work',
                target_fabric: 'Structured Cap / Cotton',
                dimensions: 'Standard Left Chest',
                target_format: 'DST, EMB',
                special_instructions: '',
                status: 'in_progress'
            };
        }

        const orderNum = task.order_number || task.orderNumber || task.task_number || 'TSK-ACTIVE';
        setElText('detail-task-id', orderNum);
        setElText('detail-client-id', task.client_name || 'Client Order');
        setElText('detail-design-name', task.design_name || task.placement || task.project_name || 'Custom Digitizing');
        setElText('detail-fabric', task.target_fabric || task.fabric_type || 'Standard Fabric');
        setElText('detail-dimensions', task.dimensions || task.sizing || 'Standard Size');

        // Formats & deliver requirement
        const instructionsText = `${task.special_instructions || task.instructions || ''} ${task.notes || ''}`;
        const reqFormats = parseRequestedFormats(task.target_format || task.file_format || 'DST', instructionsText);
        const cleanReq = reqFormats.filter(f => f !== 'EMB').join(' · ') || 'DST';
        setElText('detail-deliver-required', `${cleanReq} · JPG Preview · PDF Worksheet`);
        setElText('detail-deliver-optional', reqFormats.includes('EMB') ? 'Optional: EMB' : 'Standard Files');

        // Instructions (clean of boilerplate)
        const notes = (task.special_instructions || task.instructions || 'Standard commercial digitizing standards apply.').replace(/Standard commercial digitizing standards apply.*$/i, '').trim();
        setElText('detail-instructions', notes || 'No special client notes provided.');

        // Customer Artwork List with Preview and Download
        const rawFiles = (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files.length > 0)
            ? task.raw_artwork_files
            : (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles.length > 0)
                ? task.rawArtworkFiles
                : [{ name: 'artwork.png', url: task.artwork_url || 'images/service-digitizing.png' }];

        const artContainer = document.getElementById('detail-artwork-container');
        if (artContainer) {
            artContainer.innerHTML = rawFiles.map((rf, idx) => {
                const ext = getFileExtension(rf.name) || 'ART';
                return `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-amber-500/15 text-amber-900 dark:text-primary border border-amber-500/30">${ext}</span>
                            <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title="${rf.name}">${rf.name}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="window.workerWorkspace.openDigitizerArtworkPreview('${orderNum}', ${idx})" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-900 dark:text-primary border border-slate-200 dark:border-primary/20 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors">
                                <span class="material-symbols-outlined text-xs text-amber-600 dark:text-primary">visibility</span>
                                <span>Preview</span>
                            </button>
                            <a href="${rf.url}" download="${rf.name}" target="_blank" class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors">
                                <span class="material-symbols-outlined text-xs">download</span>
                                <span>Download</span>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Deliverables Section (if any completed deliverables exist)
        const deliverables = task.deliverables || [];
        const delivSection = document.getElementById('detail-deliverables-container');
        const delivList = document.getElementById('detail-deliverables-list');
        if (delivSection && delivList) {
            if (Array.isArray(deliverables) && deliverables.length > 0) {
                delivSection.classList.remove('hidden');
                delivList.innerHTML = deliverables.map(d => `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">${d.name}</span>
                        <a href="${d.url}" download="${d.name}" class="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-xs">download</span>
                            <span>Get</span>
                        </a>
                    </div>
                `).join('');
            } else {
                delivSection.classList.add('hidden');
            }
        }

        // Revision Section (if revision)
        const revSection = document.getElementById('detail-revision-container');
        if (revSection) {
            if (task.status === 'revision_requested' || task.revision_notes) {
                revSection.classList.remove('hidden');
                setElText('detail-revision-notes', task.revision_notes || task.revisionNotes || 'Client requested stitch revision.');
            } else {
                revSection.classList.add('hidden');
            }
        }

        // Attach Deliverables Button Action
        const attachBtn = document.getElementById('detail-attach-btn');
        if (attachBtn) {
            if (task.status === 'completed') {
                attachBtn.classList.add('hidden');
            } else {
                attachBtn.classList.remove('hidden');
                attachBtn.onclick = () => {
                    closeTaskDetailsModal();
                    openDeliverableUploadModal(orderNum);
                };
            }
        }

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
        setElText('header-worker-name', state.session.displayName || 'Digitizer');
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

    // Digitizer In-Dashboard Artwork & Deliverables Lightbox Handlers
    let currentDigitizerPreviewFiles = [];
    let currentDigitizerPreviewIndex = 0;
    let currentDigitizerPreviewOrder = null;

    function getFileExt(filename) {
        if (!filename) return '';
        const clean = String(filename).split('?')[0].split('#')[0];
        const parts = clean.split('.');
        return parts.length > 1 ? parts.pop().toUpperCase() : '';
    }

    function openDigitizerArtworkPreview(orderNumber, fileIndex = 0, sourceType = 'artwork') {
        const task = state.tasks.find(t => (t.order_number || t.orderNumber) === orderNumber);
        if (!task) return;

        let files = [];
        if (sourceType === 'deliverables') {
            files = task.deliverables || [];
        } else {
            files = (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files.length > 0)
                ? task.raw_artwork_files
                : (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles.length > 0)
                    ? task.rawArtworkFiles
                    : [{ name: 'artwork.png', url: task.artwork_url || 'images/service-digitizing.png' }];
        }

        currentDigitizerPreviewOrder = task;
        currentDigitizerPreviewFiles = files;
        currentDigitizerPreviewIndex = Math.max(0, Math.min(fileIndex, files.length - 1));

        updateDigitizerArtworkLightboxDisplay();

        const modal = document.getElementById('digitizer-artwork-preview-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeDigitizerArtworkPreview() {
        const modal = document.getElementById('digitizer-artwork-preview-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        const pdfIframe = document.getElementById('digitizer-preview-pdf-iframe');
        if (pdfIframe) pdfIframe.src = '';
        const img = document.getElementById('digitizer-preview-img');
        if (img) img.src = '';
    }

    function navigateDigitizerArtworkPreview(dir) {
        if (!currentDigitizerPreviewFiles || currentDigitizerPreviewFiles.length <= 1) return;
        const newIdx = currentDigitizerPreviewIndex + dir;
        if (newIdx >= 0 && newIdx < currentDigitizerPreviewFiles.length) {
            currentDigitizerPreviewIndex = newIdx;
            updateDigitizerArtworkLightboxDisplay();
        }
    }

    function updateDigitizerArtworkLightboxDisplay() {
        if (!currentDigitizerPreviewFiles || currentDigitizerPreviewFiles.length === 0) return;
        const file = currentDigitizerPreviewFiles[currentDigitizerPreviewIndex];
        if (!file) return;

        const fileName = file.name || ('File_' + (currentDigitizerPreviewIndex + 1));
        const fileUrl = file.url || '#';
        const ext = (getFileExt(fileName) || getFileExt(fileUrl) || 'FILE').toUpperCase();

        const modalFilename = document.getElementById('digitizer-preview-filename');
        const modalFilesize = document.getElementById('digitizer-preview-filesize');
        const formatBadge = document.getElementById('digitizer-preview-format-badge');
        const counter = document.getElementById('digitizer-preview-counter');
        const prevBtn = document.getElementById('digitizer-preview-prev-btn');
        const nextBtn = document.getElementById('digitizer-preview-next-btn');
        const downloadBtn = document.getElementById('digitizer-preview-download-btn');
        const navControls = document.getElementById('digitizer-preview-nav-controls');

        const imgContainer = document.getElementById('digitizer-preview-image-container');
        const previewImg = document.getElementById('digitizer-preview-img');
        const pdfContainer = document.getElementById('digitizer-preview-pdf-container');
        const pdfIframe = document.getElementById('digitizer-preview-pdf-iframe');
        const fallbackContainer = document.getElementById('digitizer-preview-fallback-container');
        const fallbackFilename = document.getElementById('digitizer-fallback-filename');
        const fallbackExt = document.getElementById('digitizer-fallback-ext');
        const fallbackBtnExt = document.getElementById('digitizer-fallback-btn-ext');
        const fallbackDownloadBtn = document.getElementById('digitizer-fallback-download-btn');

        if (modalFilename) modalFilename.textContent = fileName;
        if (modalFilesize) {
            const orderInfo = currentDigitizerPreviewOrder?.order_number ? ` · Order ${currentDigitizerPreviewOrder.order_number}` : '';
            modalFilesize.textContent = (file.size ? `${file.size}${orderInfo}` : (orderInfo.replace(/^ · /, '') || 'Production Asset'));
        }
        if (formatBadge) formatBadge.textContent = ext;
        if (downloadBtn) {
            downloadBtn.href = fileUrl;
            downloadBtn.download = fileName;
        }

        if (currentDigitizerPreviewFiles.length > 1) {
            if (navControls) navControls.classList.remove('hidden');
            if (counter) counter.textContent = `${currentDigitizerPreviewIndex + 1} / ${currentDigitizerPreviewFiles.length}`;
            if (prevBtn) prevBtn.disabled = currentDigitizerPreviewIndex === 0;
            if (nextBtn) nextBtn.disabled = currentDigitizerPreviewIndex === currentDigitizerPreviewFiles.length - 1;
        } else {
            if (navControls) navControls.classList.add('hidden');
        }

        const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF'].includes(ext);
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

    // Expose Public API
    window.workerWorkspace = {
        init: initWorkerWorkspace,
        setFilter,
        setLayout: setDigitizerLayout,
        setDigitizerLayout,
        handleSearch,
        openDeliverableUploadModal,
        closeDeliverableUploadModal,
        handleDeliverableFileInput,
        removeStagedDeliverableFile,
        handleDeliverableSubmit,
        openTaskDetailsModal,
        closeTaskDetailsModal,
        openStitchOutZoomModal,
        closeStitchOutZoomModal,
        openFormatSpecsModal,
        closeFormatSpecsModal,
        openWorkerAccountModal,
        closeWorkerAccountModal,
        openDigitizerArtworkPreview,
        closeDigitizerArtworkPreview,
        navigateDigitizerArtworkPreview
    };

    window.openTaskDetailsModal = openTaskDetailsModal;
    window.closeTaskDetailsModal = closeTaskDetailsModal;
    window.setDigitizerLayout = setDigitizerLayout;
    window.setLayout = setDigitizerLayout;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorkerWorkspace);
    } else {
        initWorkerWorkspace();
    }
})();
