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
        const designName = task.design_name || task.designName || task.placement || task.service_type || 'Custom Embroidery';
        const targetFabric = task.target_fabric || task.targetFabric || task.fabric_type || task.fabricType || 'Pique Polo Knit';
        const targetFormat = task.target_format || task.targetFormat || task.file_format || task.fileFormat || 'DST, EMB';
        const dimensions = task.dimensions || task.sizing || '3.5" W x 2.2" H';
        const instructions = task.special_instructions || task.instructions || task.revision_notes || task.revisionNotes || 'Keep stitch density balanced for pique polo; minimal jump stitches on lettering.';
        const serviceType = task.service_type || task.serviceType || 'Digitizing';
        const artworkUrl = task.artwork_url || (Array.isArray(task.rawArtworkFiles) && task.rawArtworkFiles[0]?.url) || (Array.isArray(task.raw_artwork_files) && task.raw_artwork_files[0]?.url) || 'images/Left Chest Logos.png';
        const deliverableUrl = task.deliverable_url || (Array.isArray(task.deliverables) && task.deliverables[0]?.url) || artworkUrl;

        return {
            ...task,
            order_number: orderNumber,
            orderNumber: orderNumber,
            design_name: designName,
            placement: designName,
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
            artwork_url: artworkUrl,
            deliverable_url: deliverableUrl,
            status: task.status || 'in_progress',
            priority: task.priority || (task.isRush || (task.revision_notes || task.revisionNotes) ? 'rush' : 'normal'),
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
                design_name: 'Apex Mountain Gear Left Chest',
                service_type: 'Digitizing',
                plan: 'Hat / Left Chest Logos',
                status: 'in_progress',
                priority: 'normal',
                created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
                artwork_url: 'images/Left Chest Logos.png',
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
                artwork_url: 'images/Custom Hats.png',
                target_fabric: 'Structured 6-Panel Cap (Twill)',
                dimensions: '2.25" H x 4.0" W',
                target_format: 'DST',
                special_instructions: 'Center out sequence for structured cap frame. Add extra pull comp for cap center seam.'
            },
            {
                id: 'task-204',
                order_number: 'ORD-8482',
                design_name: 'Metro Fire Rescue Emblem',
                service_type: 'Vectorizing',
                plan: 'Vector Artwork',
                status: 'in_progress',
                priority: 'normal',
                created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
                artwork_url: 'images/1.jpeg',
                target_fabric: 'Screen Print / Sublimation Film',
                dimensions: '12.0" W x 10.0" H',
                target_format: 'AI, EPS, SVG, PDF',
                special_instructions: 'Convert raster crest to clean CMYK vector paths with closed outlines and grouped color layers.'
            },
            {
                id: 'task-205',
                order_number: 'ORD-8475',
                design_name: 'Summit Ridge Athletic Club',
                service_type: 'Digitizing',
                plan: 'Jacket Backs',
                status: 'revision_requested',
                priority: 'rush',
                created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
                artwork_url: 'images/Jacket Backs.png',
                target_fabric: 'Fleece Pullover',
                dimensions: '6.5" W x 4.5" H',
                target_format: 'DST, EMB, PES',
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
                artwork_url: 'images/2.jpeg',
                deliverable_url: 'images/Jacket Backs.png',
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
                artwork_url: 'images/3.jpeg',
                deliverable_url: 'images/Left Chest Logos.png',
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
        const active = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending' || t.status === 'revision_requested');
        const completed = tasks.filter(t => t.status === 'completed');
        const rush = tasks.filter(t => (t.priority === 'rush' || t.status === 'revision_requested') && t.status !== 'completed');

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
        const isRevision = task.status === 'revision_requested' || !!task.revision_notes;
        const orderNum = task.order_number || task.orderNumber || 'ORD-8492';
        const designName = task.design_name || task.placement || 'Custom Embroidery';

        return `
            <div class="worker-task-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-card-dark border ${isRevision && !isCompleted ? 'border-amber-400 dark:border-amber-500 shadow-sm ring-1 ring-amber-400/20' : 'border-slate-200 dark:border-primary/20'} shadow-xs flex flex-col justify-between gap-4 transition-all">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs cursor-pointer" onclick="window.workerWorkspace.openStitchOutZoomModal('${task.artwork_url || 'images/service-digitizing.png'}', '${designName}')" title="Click to enlarge artwork">
                            <img src="${task.artwork_url || 'images/service-digitizing.png'}" alt="Source Artwork" class="w-full h-full object-cover">
                        </div>
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <span class="font-mono text-xs font-black text-amber-900 dark:text-primary">${orderNum}</span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">${task.client_name}</span>
                                ${isRush && !isCompleted ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">bolt</span> RUSH (<12h)</span>` : ''}
                                ${isRevision && !isCompleted ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">warning</span> REVISION</span>` : ''}
                                ${isCompleted ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">verified</span> COMPLETED</span>` : ''}
                            </div>
                            <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${designName}</h4>
                            <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                                <span class="format-tag">${task.target_format || 'DST'}</span>
                                <span>• Fabric: <strong class="text-slate-800 dark:text-slate-200">${task.target_fabric || 'Standard'}</strong></span>
                                <span>• Size: <strong class="text-slate-800 dark:text-slate-200">${task.dimensions || 'Chest Size'}</strong></span>
                                ${isCompleted && task.stitch_count ? `<span>• Stitches: <strong class="text-emerald-700 dark:text-emerald-400 font-mono font-bold">${Number(task.stitch_count).toLocaleString()}</strong></span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-primary/10">
                        <button onclick="window.workerWorkspace.openTaskDetailsModal('${orderNum}')" class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap">
                            <span class="material-symbols-outlined text-sm">assignment</span>
                            <span>Specs</span>
                        </button>
                        ${!isCompleted ? `
                            <button onclick="window.workerWorkspace.openDeliverableUploadModal('${orderNum}')" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-background-dark font-black text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap">
                                <span class="material-symbols-outlined text-sm">upload_file</span>
                                <span>Upload &amp; Complete</span>
                            </button>
                        ` : `
                            <a href="${task.deliverable_url || task.artwork_url}" download class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-xs whitespace-nowrap">
                                <span class="material-symbols-outlined text-sm">file_download</span>
                                <span>Verify Archive</span>
                            </a>
                        `}
                    </div>
                </div>

                ${isRevision && !isCompleted && task.revision_notes ? `
                    <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                        <span class="material-symbols-outlined text-sm text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5">rate_review</span>
                        <div>
                            <strong class="font-bold block text-slate-900 dark:text-white">Client Revision Note:</strong>
                            <span class="italic font-medium">${task.revision_notes}</span>
                        </div>
                    </div>
                ` : ''}
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
    function ensureModalsExist() {
        if (!document.getElementById('task-details-modal')) {
            const modalHtml = `
                <div id="task-details-modal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-4">
                    <div class="w-full max-w-lg bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-primary/30 shadow-2xl p-6 text-slate-900 dark:text-slate-100">
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
                            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-primary/10">
                                <span class="text-slate-500">Design Title:</span>
                                <strong id="detail-design-name" class="text-slate-900 dark:text-white">Apex Mountain</strong>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-primary/10">
                                <span class="text-slate-500">Client Reference:</span>
                                <span id="detail-client-id" class="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">Client #CLI-8492</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-primary/10">
                                <span class="text-slate-500">Target Fabric:</span>
                                <strong id="detail-fabric" class="text-slate-900 dark:text-white">Pique Polo Knit</strong>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-primary/10">
                                <span class="text-slate-500">Dimensions:</span>
                                <strong id="detail-dimensions">3.5" W x 2.2" H</strong>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100 dark:border-primary/10">
                                <span class="text-slate-500">Requested Format:</span>
                                <strong id="detail-format" class="format-tag">DST</strong>
                            </div>
                            <div class="py-1">
                                <span class="text-slate-500 block mb-1">Special Machine Instructions:</span>
                                <p id="detail-instructions" class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/15 text-slate-800 dark:text-slate-200 italic leading-relaxed">None</p>
                            </div>
                        </div>
                        <div class="flex justify-end pt-3">
                            <button type="button" onclick="window.workerWorkspace.closeTaskDetailsModal()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">Close</button>
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
    }

    function openDeliverableUploadModal(taskNumber) {
        state.currentTaskNumber = taskNumber;
        const task = state.tasks.find(t => (t.order_number || t.orderNumber) === taskNumber);
        setElText('upload-task-id', taskNumber);
        setElText('upload-design-name', task ? (task.design_name || task.placement) : 'Custom Embroidery');
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
            const deliverables = [
                { name: `${taskNumber}_production.dst`, url: 'images/service-digitizing.png', type: 'application/octet-stream', size: '245 KB' },
                { name: `${taskNumber}_master.emb`, url: 'images/service-vector.png', type: 'application/octet-stream', size: '1.4 MB' }
            ];

            if (typeof window.insforgeClient.completeDigitizerTask === 'function') {
                await window.insforgeClient.completeDigitizerTask(taskNumber, deliverables);
            } else if (typeof window.insforgeClient.completeTask === 'function') {
                await window.insforgeClient.completeTask(taskNumber, {
                    stitch_count: stitchCount,
                    notes: notes,
                    status: 'completed',
                    deliverables: deliverables
                });
            }

            // Update in-memory state
            const idx = state.tasks.findIndex(t => (t.order_number || t.orderNumber) === taskNumber);
            if (idx !== -1) {
                state.tasks[idx].status = 'completed';
                state.tasks[idx].stitch_count = stitchCount;
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
        const task = state.tasks.find(t => (t.order_number || t.orderNumber) === taskNumber);
        if (!task) return;

        setElText('detail-task-id', task.order_number || task.orderNumber);
        setElText('detail-client-id', task.client_name);
        setElText('detail-design-name', task.design_name || task.placement);
        setElText('detail-fabric', task.target_fabric || 'Standard Fabric');
        setElText('detail-dimensions', task.dimensions || 'Left Chest Standard');
        setElText('detail-format', task.target_format || 'DST');
        setElText('detail-instructions', task.special_instructions || task.instructions || 'None specified. Follow standard production guidelines.');

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
