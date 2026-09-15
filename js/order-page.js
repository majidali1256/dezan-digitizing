/**
 * Dezan Digitizing - Dedicated Full-Page Order Flow Engine
 * 
 * Features:
 * 1. URL Parameter Parsing (?service=..., ?placement=..., ?turnaround=...)
 * 2. Continuous Session & Local Storage Draft Preservation (Inputs & Artwork)
 * 3. Step 2 (Order Details) -> Step 3 (Review & Pay) Validation & Transitions
 * 4. Side-by-Side PayPal & Standalone Credit Card Smart Buttons
 * 5. Full-Funnel GA4 & Google Ads Event Dispatching
 * 6. Automated Order Capture & InsForge PostgreSQL Synchronization
 */
(function(global) {
    'use strict';

    // State object
    const state = {
        serviceSlug: 'embroidery',
        serviceType: 'Digitizing',
        serviceName: 'Embroidery Digitizing',
        paymentMethod: null,
        hasExplicitlySelectedMethod: false,
        turnaround: 'standard',
        basePrice: 15.00,
        rushFee: 5.00,
        totalPrice: 15.00,
        uploadedFiles: [], // Array of { name, size, type, dataUrl }
        isSubmitting: false,
        paypalMountedMethod: null,
        isMountingPayPal: false
    };

    const DRAFT_KEY = 'dezan_order_page_draft';
    const ARTWORKS_DB_NAME = 'dezan_order_artworks_db';
    const ARTWORKS_STORE = 'artworks';

    // -------------------------------------------------------------
    // 1. IndexedDB Helper for Large Artwork File Persistence
    // -------------------------------------------------------------
    function openArtworksDb() {
        return new Promise((resolve) => {
            if (!('indexedDB' in global)) return resolve(null);
            const req = indexedDB.open(ARTWORKS_DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(ARTWORKS_STORE)) {
                    db.createObjectStore(ARTWORKS_STORE, { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = () => resolve(null);
        });
    }

    async function saveArtworksToDb(files) {
        try {
            const db = await openArtworksDb();
            if (!db) return false;
            return new Promise((resolve) => {
                const tx = db.transaction(ARTWORKS_STORE, 'readwrite');
                const store = tx.objectStore(ARTWORKS_STORE);
                store.clear();
                files.forEach((f, idx) => {
                    store.put({ id: idx, name: f.name, size: f.size, type: f.type, dataUrl: f.dataUrl });
                });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            });
        } catch (_) {
            return false;
        }
    }

    async function loadArtworksFromDb() {
        try {
            const db = await openArtworksDb();
            if (!db) return [];
            return new Promise((resolve) => {
                const tx = db.transaction(ARTWORKS_STORE, 'readonly');
                const store = tx.objectStore(ARTWORKS_STORE);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            });
        } catch (_) {
            return [];
        }
    }

    async function clearArtworksFromDb() {
        try {
            const db = await openArtworksDb();
            if (!db) return;
            const tx = db.transaction(ARTWORKS_STORE, 'readwrite');
            tx.objectStore(ARTWORKS_STORE).clear();
        } catch (_) {}
    }

    // -------------------------------------------------------------
    // 2. Draft Serialization & Restoration
    // -------------------------------------------------------------
    function saveOrderDraft() {
        if (typeof sessionStorage === 'undefined') return;
        const form = document.getElementById('order-page-form');
        if (!form) return;

        const data = {
            serviceSlug: state.serviceSlug,
            serviceType: state.serviceType,
            jobName: document.getElementById('dig-job-name')?.value || '',
            placement: document.getElementById('dig-placement')?.value || '',
            petPlacement: document.getElementById('pet-placement')?.value || '',
            fabric: document.getElementById('dig-fabric')?.value || '',
            size: document.getElementById('dig-size')?.value || '',
            sizeUnit: document.getElementById('dig-size-unit')?.value || 'in',
            notes: document.getElementById('order-notes')?.value || '',
            vecUse: document.getElementById('vec-use')?.value || '',
            turnaround: state.turnaround,
            clientName: document.getElementById('order-client-name')?.value || '',
            clientEmail: document.getElementById('order-client-email')?.value || '',
            digFormats: Array.from(document.querySelectorAll('input[name="dig-formats"]:checked')).map(cb => cb.value),
            vecFormats: Array.from(document.querySelectorAll('input[name="vec-formats"]:checked')).map(cb => cb.value),
            digSpecial: Array.from(document.querySelectorAll('input[name="dig-special"]:checked')).map(cb => cb.value),
            savedAt: new Date().toISOString()
        };

        if (Array.isArray(state.uploadedFiles) && state.uploadedFiles.length > 0) {
            try {
                const filesJson = JSON.stringify(state.uploadedFiles);
                if (filesJson.length < 3500000) {
                    data.artworkFiles = state.uploadedFiles;
                }
            } catch (_) {}
        }

        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); // Secondary backup
        } catch (_) {}

        saveArtworksToDb(state.uploadedFiles);
    }

    async function restoreOrderDraft() {
        let raw = null;
        try {
            raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(DRAFT_KEY) : null) ||
                  (typeof localStorage !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null);
        } catch (_) {}

        if (!raw) return false;
        let draft = null;
        try {
            draft = JSON.parse(raw);
        } catch (_) {
            return false;
        }

        if (!draft) return false;

        // Restore service if not overridden by direct URL query
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('service') && draft.serviceSlug) {
            setService(draft.serviceSlug, false);
        }

        if (draft.jobName) {
            const el = document.getElementById('dig-job-name');
            if (el) el.value = draft.jobName;
        }

        if (draft.placement && !urlParams.has('placement')) {
            const el = document.getElementById('dig-placement');
            if (el) el.value = draft.placement;
        }

        if (draft.petPlacement && !urlParams.has('placement')) {
            const el = document.getElementById('pet-placement');
            if (el) el.value = draft.petPlacement;
        }

        if (draft.fabric) {
            const el = document.getElementById('dig-fabric');
            if (el) el.value = draft.fabric;
        }

        if (draft.size) {
            const el = document.getElementById('dig-size');
            if (el) el.value = draft.size;
        }

        if (draft.sizeUnit) {
            const el = document.getElementById('dig-size-unit');
            if (el) el.value = draft.sizeUnit;
        }

        if (draft.notes) {
            const el = document.getElementById('order-notes');
            if (el) el.value = draft.notes;
        }

        if (draft.vecUse) {
            const el = document.getElementById('vec-use');
            if (el) el.value = draft.vecUse;
        }

        if (draft.turnaround && !urlParams.has('turnaround')) {
            handleTurnaroundChange(draft.turnaround);
        }

        if (draft.clientName) {
            const el = document.getElementById('order-client-name');
            if (el) el.value = draft.clientName;
        }

        if (draft.clientEmail) {
            const el = document.getElementById('order-client-email');
            if (el) el.value = draft.clientEmail;
        }

        // Formats & Special options
        if (Array.isArray(draft.digFormats) && draft.digFormats.length > 0) {
            document.querySelectorAll('input[name="dig-formats"]').forEach(cb => {
                cb.checked = draft.digFormats.includes(cb.value);
            });
        }

        if (Array.isArray(draft.vecFormats) && draft.vecFormats.length > 0) {
            document.querySelectorAll('input[name="vec-formats"]').forEach(cb => {
                cb.checked = draft.vecFormats.includes(cb.value);
            });
        }

        if (Array.isArray(draft.digSpecial)) {
            document.querySelectorAll('input[name="dig-special"]').forEach(cb => {
                cb.checked = draft.digSpecial.includes(cb.value);
            });
        }

        // Restore artwork files from session draft or IndexedDB
        let savedFiles = (draft && Array.isArray(draft.artworkFiles) && draft.artworkFiles.length > 0) ? draft.artworkFiles : null;
        if (!savedFiles || savedFiles.length === 0) {
            savedFiles = await loadArtworksFromDb();
        }
        if (savedFiles && savedFiles.length > 0) {
            state.uploadedFiles = savedFiles;
            renderUploadedFilesList();
        }

        // Show banner if fields were restored
        const alertBanner = document.getElementById('draft-alert-banner');
        if (alertBanner && (draft.jobName || (savedFiles && savedFiles.length > 0))) {
            alertBanner.classList.remove('hidden');
        }

        calculatePrice();
        return true;
    }

    global.clearOrderDraft = function() {
        if (confirm('Start a fresh order? All entered information and uploaded files will be cleared.')) {
            try {
                sessionStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(DRAFT_KEY);
            } catch (_) {}
            clearArtworksFromDb();
            state.uploadedFiles = [];
            const form = document.getElementById('order-page-form');
            if (form) form.reset();
            renderUploadedFilesList();
            const alertBanner = document.getElementById('draft-alert-banner');
            if (alertBanner) alertBanner.classList.add('hidden');
            handleTurnaroundChange('standard');
            calculatePrice();
        }
    };

    // -------------------------------------------------------------
    // 3. Service Switching & Query Parameter Parsing
    // -------------------------------------------------------------
    function parseUrlParameters() {
        const params = new URLSearchParams(window.location.search);

        // Service
        const rawService = (params.get('service') || '').toLowerCase();
        if (rawService) {
            if (rawService.includes('vector')) {
                setService('vector-art', false);
            } else if (rawService.includes('pet') || rawService.includes('portrait') || rawService.includes('realistic')) {
                setService('pet-portrait', false);
            } else {
                setService('embroidery', false);
            }
        } else {
            setService('embroidery', false);
        }

        // Placement deep-linking (e.g. ?placement=cap, ?placement=left-chest, ?placement=jacket-back)
        const rawPlacement = (params.get('placement') || '').toLowerCase();
        if (rawPlacement) {
            const digPlacement = document.getElementById('dig-placement');
            const fabricSelect = document.getElementById('dig-fabric');
            if (digPlacement) {
                if (rawPlacement.includes('cap') || rawPlacement.includes('hat')) {
                    digPlacement.value = 'Cap / Hat Front — $15';
                    if (fabricSelect) fabricSelect.value = 'Structured Cap / Hat (Richardson 112, Yupoong)';
                } else if (rawPlacement.includes('jacket') || rawPlacement.includes('back')) {
                    digPlacement.value = 'Jacket Back / Full Back — $25';
                    if (fabricSelect) fabricSelect.value = 'Jacket / Outerwear / Nylon';
                } else if (rawPlacement.includes('chest')) {
                    digPlacement.value = 'Left Chest — $15';
                    if (fabricSelect) fabricSelect.value = 'Polo / Pique Knit';
                } else if (rawPlacement.includes('sleeve') || rawPlacement.includes('pocket')) {
                    digPlacement.value = 'Sleeve / Pocket — $15';
                }
            }
        }

        // Turnaround
        const rawTurnaround = (params.get('turnaround') || '').toLowerCase();
        if (rawTurnaround.includes('rush')) {
            handleTurnaroundChange('rush');
        }

        calculatePrice();
    }

    function setService(slug, triggerTracker = true) {
        state.serviceSlug = slug;
        const bannerTitle = document.getElementById('service-banner-title');
        const bannerIcon = document.getElementById('service-banner-icon');
        const bannerIconBox = document.getElementById('service-banner-icon-box');
        const pricePill = document.getElementById('service-price-pill');
        const headerServiceText = document.getElementById('header-selected-service-text');
        const digContainer = document.getElementById('digitizing-fields-container');
        const vecContainer = document.getElementById('vector-fields-container');
        const digPlacementBox = document.getElementById('dig-placement-box');
        const petPlacementBox = document.getElementById('pet-placement-box');
        const slugInput = document.getElementById('selected-service-slug');
        const typeInput = document.getElementById('selected-service-type');
        const jobInput = document.getElementById('dig-job-name');

        if (slug === 'vector-art') {
            state.serviceType = 'Vectorizing';
            state.serviceName = 'Vector Art Conversion';
            if (bannerTitle) bannerTitle.textContent = 'Vector Art Conversion';
            if (bannerIcon) bannerIcon.textContent = 'draw';
            if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 shrink-0';
            if (pricePill) {
                pricePill.textContent = '$15 Flat Rate';
                pricePill.className = 'px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-600 font-black text-[10.5px]';
            }
            if (headerServiceText) headerServiceText.textContent = 'Vector Art Conversion';
            if (digContainer) digContainer.classList.add('hidden');
            if (vecContainer) vecContainer.classList.remove('hidden');
            if (jobInput) jobInput.placeholder = 'e.g. Eagle Logo Vector Redraw, Color Separations';
        } else if (slug === 'pet-portrait') {
            state.serviceType = 'PetPortrait';
            state.serviceName = 'Pet & Portrait Digitizing';
            if (bannerTitle) bannerTitle.textContent = 'Realistic / Pet Portrait Digitizing';
            if (bannerIcon) bannerIcon.textContent = 'pets';
            if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 shrink-0';
            if (pricePill) {
                pricePill.textContent = 'From $25';
                pricePill.className = 'px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-600 font-black text-[10.5px]';
            }
            if (headerServiceText) headerServiceText.textContent = 'Pet & Portrait Digitizing';
            if (digContainer) digContainer.classList.remove('hidden');
            if (vecContainer) vecContainer.classList.add('hidden');
            if (digPlacementBox) digPlacementBox.classList.add('hidden');
            if (petPlacementBox) petPlacementBox.classList.remove('hidden');
            if (jobInput) jobInput.placeholder = 'e.g. Golden Retriever Portrait on Left Chest';
        } else {
            // Default: Embroidery
            state.serviceSlug = 'embroidery';
            state.serviceType = 'Digitizing';
            state.serviceName = 'Embroidery Digitizing';
            if (bannerTitle) bannerTitle.textContent = 'Embroidery Digitizing';
            if (bannerIcon) bannerIcon.textContent = 'precision_manufacturing';
            if (bannerIconBox) bannerIconBox.className = 'w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0';
            if (pricePill) {
                pricePill.textContent = '$15 Flat Rate';
                pricePill.className = 'px-2 py-0.2 rounded-full bg-primary/15 text-primary text-[10.5px] font-black';
            }
            if (headerServiceText) headerServiceText.textContent = 'Embroidery Digitizing';
            if (digContainer) digContainer.classList.remove('hidden');
            if (vecContainer) vecContainer.classList.add('hidden');
            if (digPlacementBox) digPlacementBox.classList.remove('hidden');
            if (petPlacementBox) petPlacementBox.classList.add('hidden');
            if (jobInput) jobInput.placeholder = 'e.g. Falcon Polo Left Chest, Apple Roofing Cap';
        }

        if (slugInput) slugInput.value = state.serviceSlug;
        if (typeInput) typeInput.value = state.serviceType;

        showServiceSelector(false);
        calculatePrice();
        saveOrderDraft();

        if (triggerTracker && typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackServiceSelected === 'function') {
            window.dezanTracker.trackServiceSelected(state.serviceName, state.serviceType);
        }
    }
    global.setService = setService;

    function showServiceSelector(show) {
        const sec = document.getElementById('order-service-choice-section');
        if (sec) {
            if (show) {
                sec.classList.remove('hidden');
                sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                sec.classList.add('hidden');
            }
        }
    }
    global.showServiceSelector = showServiceSelector;

    // -------------------------------------------------------------
    // 4. Price Calculation
    // -------------------------------------------------------------
    function calculatePrice() {
        let base = 15.00;
        if (state.serviceSlug === 'pet-portrait') {
            const petVal = document.getElementById('pet-placement')?.value || '';
            base = petVal.includes('40') ? 40.00 : 25.00;
        } else if (state.serviceSlug === 'embroidery') {
            const placementVal = document.getElementById('dig-placement')?.value || '';
            if (placementVal.includes('25') || placementVal.toLowerCase().includes('jacket') || placementVal.toLowerCase().includes('full back')) {
                base = 25.00;
            } else {
                base = 15.00;
            }
        } else {
            // Vector art
            base = 15.00;
        }

        const isRush = state.turnaround === 'rush';
        const rush = isRush ? 5.00 : 0.00;
        const total = base + rush;

        state.basePrice = base;
        state.totalPrice = total;

        // Update Review View labels
        const reviewBase = document.getElementById('review-base-price');
        const reviewTotal = document.getElementById('review-total-price');
        const reviewRushRow = document.getElementById('review-rush-fee-row');

        if (reviewBase) reviewBase.textContent = `$${base.toFixed(2)}`;
        if (reviewTotal) reviewTotal.textContent = `$${total.toFixed(2)}`;
        if (reviewRushRow) {
            if (isRush) reviewRushRow.classList.remove('hidden');
            else reviewRushRow.classList.add('hidden');
        }

        return total;
    }
    global.calculatePrice = calculatePrice;

    function handleTurnaroundChange(speed) {
        state.turnaround = speed === 'rush' ? 'rush' : 'standard';
        const cardStd = document.getElementById('card-turnaround-standard');
        const cardRush = document.getElementById('card-turnaround-rush');
        const radioStd = document.querySelector('input[name="turnaround"][value="standard"]');
        const radioRush = document.querySelector('input[name="turnaround"][value="rush"]');

        if (state.turnaround === 'rush') {
            if (cardRush) {
                cardRush.className = 'p-3.5 rounded-2xl border-2 border-primary bg-amber-50/50 dark:bg-primary/10 flex items-start gap-3 cursor-pointer transition-all ring-1 ring-primary/20';
            }
            if (cardStd) {
                cardStd.className = 'p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark hover:border-slate-300 dark:hover:border-slate-700 flex items-start gap-3 cursor-pointer transition-all';
            }
            if (radioRush) radioRush.checked = true;
        } else {
            if (cardStd) {
                cardStd.className = 'p-3.5 rounded-2xl border-2 border-primary bg-amber-50/50 dark:bg-primary/10 flex items-start gap-3 cursor-pointer transition-all ring-1 ring-primary/20';
            }
            if (cardRush) {
                cardRush.className = 'p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark hover:border-slate-300 dark:hover:border-slate-700 flex items-start gap-3 cursor-pointer transition-all';
            }
            if (radioStd) radioStd.checked = true;
        }

        calculatePrice();
        saveOrderDraft();
    }
    global.handleTurnaroundChange = handleTurnaroundChange;

    // -------------------------------------------------------------
    // 5. Artwork Upload Dropzone & Thumbnail Rendering
    // -------------------------------------------------------------
    function setupArtworkDropzone() {
        const dropzone = document.getElementById('artwork-dropzone');
        const fileInput = document.getElementById('artwork-file');
        if (!dropzone || !fileInput) return;

        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-primary', 'bg-amber-50/30', 'dark:bg-primary/10');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary', 'bg-amber-50/30', 'dark:bg-primary/10');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary', 'bg-amber-50/30', 'dark:bg-primary/10');
            if (e.dataTransfer && e.dataTransfer.files) {
                handleIncomingFiles(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files) {
                handleIncomingFiles(fileInput.files);
            }
        });
    }

    function handleIncomingFiles(fileList) {
        Array.from(fileList).forEach((file) => {
            // Read file as Data URL for preview and session persistence
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = {
                    id: Date.now() + Math.random().toString(36).substr(2, 5),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result
                };
                state.uploadedFiles.push(item);
                renderUploadedFilesList();
                saveOrderDraft();

                if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackArtworkUploaded === 'function') {
                    window.dezanTracker.trackArtworkUploaded(state.uploadedFiles.length, state.uploadedFiles.map(f => f.name.split('.').pop()));
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function renderUploadedFilesList() {
        const container = document.getElementById('uploaded-files-list');
        const reviewContainer = document.getElementById('review-artwork-chips');
        const reviewCount = document.getElementById('review-artwork-count');
        if (!container) return;

        if (state.uploadedFiles.length === 0) {
            container.innerHTML = '';
            if (reviewContainer) reviewContainer.innerHTML = '<span class="text-xs text-red-500 font-bold">No artwork attached</span>';
            if (reviewCount) reviewCount.textContent = '0 files';
            return;
        }

        // Render Step 2 list
        container.innerHTML = state.uploadedFiles.map((f, idx) => {
            const isImage = f.type.startsWith('image/') || f.name.match(/\.(png|jpg|jpeg|webp)$/i);
            const sizeKb = (f.size / 1024).toFixed(1);
            return `
                <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs">
                    <div class="flex items-center gap-2.5 min-w-0">
                        ${isImage ? `<img src="${f.dataUrl}" alt="${escapeHtml(f.name)}" class="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0" />` : `<div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">${f.name.split('.').pop()}</div>`}
                        <div class="truncate">
                            <p class="font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(f.name)}</p>
                            <span class="text-[10.5px] text-slate-400">${sizeKb} KB</span>
                        </div>
                    </div>
                    <button type="button" onclick="window.removeArtworkFile(${idx})" class="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer" title="Remove File">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            `;
        }).join('');

        // Render Step 3 chips
        if (reviewContainer) {
            reviewContainer.innerHTML = state.uploadedFiles.map((f) => {
                const isImage = f.type.startsWith('image/') || f.name.match(/\.(png|jpg|jpeg|webp)$/i);
                return `
                    <div class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
                        ${isImage ? `<img src="${f.dataUrl}" alt="${escapeHtml(f.name)}" class="w-5 h-5 rounded object-cover" />` : `<span class="material-symbols-outlined text-primary text-sm">attachment</span>`}
                        <span class="truncate max-w-[150px]">${escapeHtml(f.name)}</span>
                    </div>
                `;
            }).join('');
        }

        if (reviewCount) {
            reviewCount.textContent = `${state.uploadedFiles.length} file${state.uploadedFiles.length === 1 ? '' : 's'}`;
        }
    }

    global.removeArtworkFile = function(idx) {
        state.uploadedFiles.splice(idx, 1);
        renderUploadedFilesList();
        saveOrderDraft();
    };

    // -------------------------------------------------------------
    // 6. Step Transitions & Form Validation
    // -------------------------------------------------------------
    global.goToReviewStep = function() {
        const jobNameInput = document.getElementById('dig-job-name');
        const sizeInput = document.getElementById('dig-size');
        const clientNameInput = document.getElementById('order-client-name');
        const clientEmailInput = document.getElementById('order-client-email');

        // Validation
        const jobName = (jobNameInput?.value || '').trim();
        const size = (sizeInput?.value || '').trim();
        const clientName = (clientNameInput?.value || '').trim();
        const clientEmail = (clientEmailInput?.value || '').trim();

        if (!jobName) {
            alert('Please enter a Job Name / Reference for your project.');
            jobNameInput?.focus();
            return;
        }

        if (state.serviceSlug !== 'vector-art' && !size) {
            alert('Please specify the target dimensions (width or height).');
            sizeInput?.focus();
            return;
        }

        if (state.uploadedFiles.length === 0) {
            alert('Please upload at least one artwork or reference file.');
            document.getElementById('artwork-dropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!clientName) {
            alert('Please enter your Full Name for delivery.');
            clientNameInput?.focus();
            return;
        }

        if (!clientEmail || !clientEmail.includes('@') || !clientEmail.includes('.')) {
            alert('Please enter a valid email address so we can deliver your finished stitch files.');
            clientEmailInput?.focus();
            return;
        }

        // Populate Step 3 review fields
        const revService = document.getElementById('review-service-name');
        const revJob = document.getElementById('review-job-name');
        const revPlacement = document.getElementById('review-placement');
        const revSize = document.getElementById('review-size');
        const revFabric = document.getElementById('review-fabric');
        const revFormats = document.getElementById('review-formats');
        const revSpecial = document.getElementById('review-special');
        const revSpecialRow = document.getElementById('review-special-row');
        const revTurnaround = document.getElementById('review-turnaround');
        const revEmail = document.getElementById('review-email');

        if (revService) revService.textContent = state.serviceName;
        if (revJob) revJob.textContent = jobName;

        let placementText = 'Standard';
        if (state.serviceSlug === 'pet-portrait') {
            placementText = document.getElementById('pet-placement')?.value || 'Left Chest';
        } else if (state.serviceSlug === 'vector-art') {
            placementText = document.getElementById('vec-use')?.value || 'Vectorization';
        } else {
            placementText = document.getElementById('dig-placement')?.value || 'Left Chest';
        }
        if (revPlacement) revPlacement.textContent = placementText.split('—')[0].trim();

        if (revSize) {
            const unit = document.getElementById('dig-size-unit')?.value || 'in';
            revSize.textContent = state.serviceSlug === 'vector-art' ? 'Resolution Independent' : `${size} ${unit}`;
        }

        if (revFabric) {
            revFabric.textContent = state.serviceSlug === 'vector-art' ? 'Scalable Vector' : (document.getElementById('dig-fabric')?.value || 'Standard Fabric');
        }

        if (revFormats) {
            let formats = [];
            if (state.serviceSlug === 'vector-art') {
                formats = Array.from(document.querySelectorAll('input[name="vec-formats"]:checked')).map(cb => cb.value);
            } else {
                formats = Array.from(document.querySelectorAll('input[name="dig-formats"]:checked')).map(cb => cb.value);
            }
            revFormats.textContent = formats.length > 0 ? formats.join(', ') : (state.serviceSlug === 'vector-art' ? 'AI, EPS, PDF' : '.DST');
        }

        const specialOpts = Array.from(document.querySelectorAll('input[name="dig-special"]:checked')).map(cb => cb.value);
        if (revSpecialRow) {
            if (specialOpts.length > 0) {
                revSpecialRow.classList.remove('hidden');
                if (revSpecial) revSpecial.textContent = specialOpts.join(', ');
            } else {
                revSpecialRow.classList.add('hidden');
            }
        }

        if (revTurnaround) {
            revTurnaround.textContent = state.turnaround === 'rush' ? 'Rush Priority (2-4 Hours)' : 'Standard (12-24 Hours)';
        }

        if (revEmail) revEmail.textContent = `${clientName} (${clientEmail})`;

        calculatePrice();
        saveOrderDraft();

        // 1. GA4 Funnel: order_details_completed
        if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackOrderDetailsCompleted === 'function') {
            window.dezanTracker.trackOrderDetailsCompleted({
                service: state.serviceName,
                plan: placementText,
                placement: placementText,
                amount: state.totalPrice,
                turnaround: state.turnaround
            });
        }

        // Toggle Views: Hide Step 2, Show Step 3
        const step2 = document.getElementById('order-step-2-view');
        const step3 = document.getElementById('order-step-3-view');
        if (step2) step2.classList.add('hidden');
        if (step3) step3.classList.remove('hidden');

        // Stepper updates
        updateStepper(3);

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 2. GA4 Funnel: begin_checkout
        if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackBeginCheckout === 'function') {
            window.dezanTracker.trackBeginCheckout({
                service: state.serviceName,
                plan: placementText,
                placement: placementText,
                amount: state.totalPrice,
                turnaround: state.turnaround
            });
        }

        // Reset payment tabs to neutral state
        resetPaymentTabs();
        window.updateOrderPageDynamicCta();

        if (!window._orderPageScrollBound) {
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        window.updateOrderPageDynamicCta();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
            window._orderPageScrollBound = true;
        }

        // Preload PayPal SDK & CardFields component in background for instant display
        if (typeof preloadOrderPageCardPayment === 'function') {
            preloadOrderPageCardPayment();
        } else if (window.PayPalConfig && typeof window.PayPalConfig.loadSdk === 'function') {
            window.PayPalConfig.loadSdk().catch(() => {});
        }
    };

    global.backToOrderDetailsStep = function() {
        const step2 = document.getElementById('order-step-2-view');
        const step3 = document.getElementById('order-step-3-view');
        if (step3) step3.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');

        updateStepper(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function updateStepper(stepNum) {
        const progress = document.getElementById('step-connector-progress');
        const circle2 = document.getElementById('step-circle-2');
        const label2 = document.getElementById('step-label-2');
        const circle3 = document.getElementById('step-circle-3');
        const label3 = document.getElementById('step-label-3');

        if (stepNum === 3) {
            if (progress) progress.style.width = '100%';
            if (circle2) {
                circle2.className = 'w-8 h-8 rounded-full bg-primary text-background-dark font-black flex items-center justify-center text-xs shadow-xs transition-all ring-4 ring-background-light dark:ring-background-dark';
                circle2.innerHTML = '<span class="material-symbols-outlined text-sm font-black">check</span>';
            }
            if (circle3) {
                circle3.className = 'w-8 h-8 rounded-full bg-primary text-background-dark font-black flex items-center justify-center text-xs shadow-xs transition-all ring-4 ring-background-light dark:ring-background-dark';
                circle3.innerHTML = '3';
            }
            if (label3) {
                label3.className = 'text-[10.5px] sm:text-xs font-black text-primary mt-1 whitespace-nowrap';
            }
        } else {
            // Step 2
            if (progress) progress.style.width = '50%';
            if (circle2) {
                circle2.className = 'w-8 h-8 rounded-full bg-primary text-background-dark font-black flex items-center justify-center text-xs shadow-xs transition-all ring-4 ring-background-light dark:ring-background-dark';
                circle2.innerHTML = '2';
            }
            if (circle3) {
                circle3.className = 'w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700 transition-all ring-4 ring-background-light dark:ring-background-dark';
                circle3.innerHTML = '3';
            }
            if (label3) {
                label3.className = 'text-[10.5px] sm:text-xs font-medium text-slate-400 mt-1 whitespace-nowrap';
            }
        }
    }

    // -------------------------------------------------------------
    // 7. Side-by-Side Payment Selector & Smart Buttons
    // -------------------------------------------------------------
    let orderPageCardFieldsInstance = null;
    let orderPageCardFieldsRendered = false;
    let isOrderPageCardSubmitting = false;

    /**
     * Update detected card brand visual indicators (Visa, Mastercard, AMEX, Discover)
     */
    function updateOrderPageCardBrandBadges(brand) {
        const b = (brand || '').toLowerCase();
        const isVisa = b.includes('visa');
        const isMastercard = b.includes('master');
        const isAmex = b.includes('american') || b.includes('amex');
        const isDiscover = b.includes('discover');
        const hasMatch = isVisa || isMastercard || isAmex || isDiscover;

        const elVisa = document.getElementById('modal-brand-badge-visa');
        const elMaster = document.getElementById('modal-brand-badge-mastercard');
        const elAmex = document.getElementById('modal-brand-badge-amex');
        const elDiscover = document.getElementById('modal-brand-badge-discover');

        if (!hasMatch) {
            if (elVisa) elVisa.className = 'transition-all duration-200 font-black text-[#1434CB] italic text-xs opacity-35 px-1 py-0.5 rounded';
            if (elMaster) elMaster.className = 'transition-all duration-200 inline-flex items-center opacity-35 px-1 py-0.5 rounded';
            if (elAmex) elAmex.className = 'transition-all duration-200 px-1 rounded bg-[#006FCF] text-white text-[8.5px] font-black leading-tight opacity-35';
            if (elDiscover) elDiscover.className = 'transition-all duration-200 font-black text-[#FF6000] text-[10px] opacity-35 px-1 py-0.5 rounded';
            return;
        }

        if (elVisa) elVisa.className = `transition-all duration-200 font-black text-[#1434CB] italic text-xs px-1 py-0.5 rounded ${isVisa ? 'opacity-100 scale-110 ring-1 ring-[#1434CB]/40 bg-blue-50/70 dark:bg-blue-900/30' : 'opacity-25 grayscale'}`;
        if (elMaster) elMaster.className = `transition-all duration-200 inline-flex items-center px-1 py-0.5 rounded ${isMastercard ? 'opacity-100 scale-110 ring-1 ring-amber-500/40 bg-amber-50/70 dark:bg-amber-900/30' : 'opacity-25 grayscale'}`;
        if (elAmex) elAmex.className = `transition-all duration-200 px-1 rounded bg-[#006FCF] text-white text-[8.5px] font-black leading-tight ${isAmex ? 'opacity-100 scale-110 ring-1 ring-blue-500/60 shadow-xs' : 'opacity-25 grayscale'}`;
        if (elDiscover) elDiscover.className = `transition-all duration-200 font-black text-[#FF6000] text-[10px] px-1 py-0.5 rounded ${isDiscover ? 'opacity-100 scale-110 ring-1 ring-orange-500/40 bg-orange-50/70 dark:bg-orange-900/30' : 'opacity-25 grayscale'}`;
    }

    /**
     * Display a clean card validation or processing error message
     */
    function showOrderPageCardError(msg) {
        const errorBox = document.getElementById('modal-card-fields-error');
        const errorText = document.getElementById('modal-card-fields-error-text');
        if (errorBox && errorText) {
            errorText.textContent = msg || 'Please verify your card details and try again.';
            errorBox.classList.remove('hidden');
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Initialize PayPal CardFields (Advanced Credit and Debit Card Payments)
     */
    async function initOrderPageCardFieldsComponent(paypal) {
        const cardFieldsContainer = document.getElementById('modal-card-fields-container');
        if (!cardFieldsContainer || !paypal || typeof paypal.CardFields !== 'function') {
            return false;
        }

        if (orderPageCardFieldsRendered && orderPageCardFieldsInstance) {
            return true;
        }

        try {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const cardFields = paypal.CardFields({
                createOrder: async () => {
                    const price = state.totalPrice || 15.00;
                    const jobName = (document.getElementById('dig-job-name')?.value || 'Custom Order').trim();
                    const clientName = (document.getElementById('order-client-name')?.value || 'Customer').trim();
                    const clientEmail = (document.getElementById('order-client-email')?.value || '').trim();

                    const res = await fetch('/api/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: price.toFixed(2),
                            currency: 'USD',
                            orderDetails: {
                                projectName: jobName,
                                serviceType: state.serviceName,
                                clientName: clientName,
                                clientEmail: clientEmail
                            }
                        })
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.message || 'Failed to initialize card order');
                    }

                    const data = await res.json();
                    return data.paypalOrderId || data.id || data.data?.id;
                },
                onApprove: async (data) => {
                    let processingOverlay = document.getElementById('orderpage-processing-overlay');
                    if (!processingOverlay) {
                        processingOverlay = document.createElement('div');
                        processingOverlay.id = 'orderpage-processing-overlay';
                        processingOverlay.className = 'fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center';
                        processingOverlay.innerHTML = `
                            <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <h4 class="text-lg font-black tracking-tight mb-1">Verifying Payment &amp; Finalizing Order...</h4>
                            <p class="text-xs text-slate-300 max-w-sm">Please do not close this window while we secure your digitizing order.</p>
                        `;
                        document.body.appendChild(processingOverlay);
                    }

                    try {
                        const captureRes = await fetch('/api/paypal/capture-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paypalOrderId: data.orderID })
                        });

                        const captureData = await captureRes.json().catch(() => ({}));
                        if (!captureRes.ok || !captureData.success) {
                            throw new Error(captureData.message || 'Payment capture could not be confirmed.');
                        }

                        await finalizeOrder({
                            paymentStatus: 'paid',
                            paymentMethod: 'CreditCard',
                            transactionId: captureData.transactionId || data.orderID
                        });
                    } catch (err) {
                        console.error('[Payment Capture Error]:', err);
                        showOrderPageCardError(err.message || 'Payment capture error');
                    } finally {
                        if (processingOverlay) processingOverlay.remove();
                    }
                },
                onError: (err) => {
                    console.error('[CardFields Error]:', err);
                    showOrderPageCardError(err.message || 'Payment could not be completed with this card.');
                },
                style: {
                    'input': {
                        'font-size': '14px',
                        'font-family': 'Inter, system-ui, -apple-system, sans-serif',
                        'color': isDarkMode ? '#f1f5f9' : '#0f172a'
                    },
                    '.invalid': {
                        'color': '#ef4444'
                    }
                }
            });

            if (typeof cardFields.isEligible === 'function' && !cardFields.isEligible()) {
                console.warn('[PayPal CardFields not eligible for current account/session]');
                return false;
            }

            orderPageCardFieldsInstance = cardFields;

            // Clear target containers
            const numContainer = document.getElementById('modal-card-number-field');
            const expContainer = document.getElementById('modal-card-expiry-field');
            const cvvContainer = document.getElementById('modal-card-cvv-field');
            const nameContainer = document.getElementById('modal-card-name-field');
            const postContainer = document.getElementById('modal-card-postal-field');

            if (numContainer) numContainer.innerHTML = '';
            if (expContainer) expContainer.innerHTML = '';
            if (cvvContainer) cvvContainer.innerHTML = '';
            if (nameContainer) nameContainer.innerHTML = '';
            if (postContainer) postContainer.innerHTML = '';

            const numberField = cardFields.NumberField({ placeholder: '•••• •••• •••• ••••' });
            const expiryField = cardFields.ExpiryField({ placeholder: 'MM / YY' });
            const cvvField = cardFields.CVVField({ placeholder: 'CVC / CVV' });
            const nameField = cardFields.NameField({ placeholder: 'Name on card' });
            const postalField = cardFields.PostalCodeField({ placeholder: 'Billing ZIP / Postal' });

            // Brand detection listeners
            const handleBrandChange = (event) => {
                const detectedBrand = (event && event.cards && event.cards[0]?.type) || event?.cardType || '';
                updateOrderPageCardBrandBadges(detectedBrand);
            };

            if (typeof cardFields.on === 'function') {
                try { cardFields.on('cardTypeChange', handleBrandChange); } catch(e) {}
            }
            if (typeof numberField.on === 'function') {
                try { numberField.on('cardTypeChange', handleBrandChange); } catch(e) {}
                try { numberField.on('change', (e) => {
                    if (e && (e.cards || e.cardType)) handleBrandChange(e);
                }); } catch(e) {}
            }

            const renderPromises = [];
            if (numContainer && typeof numberField.render === 'function') {
                renderPromises.push(numberField.render('#modal-card-number-field'));
            }
            if (expContainer && typeof expiryField.render === 'function') {
                renderPromises.push(expiryField.render('#modal-card-expiry-field'));
            }
            if (cvvContainer && typeof cvvField.render === 'function') {
                renderPromises.push(cvvField.render('#modal-card-cvv-field'));
            }
            if (nameContainer && typeof nameField.render === 'function') {
                renderPromises.push(nameField.render('#modal-card-name-field'));
            }
            if (postContainer && typeof postalField.render === 'function') {
                renderPromises.push(postalField.render('#modal-card-postal-field'));
            }

            await Promise.all(renderPromises);
            orderPageCardFieldsRendered = true;
            return true;
        } catch (cardInitErr) {
            console.warn('[PayPal CardFields Mount Note]:', cardInitErr.message);
            orderPageCardFieldsInstance = null;
            orderPageCardFieldsRendered = false;
            return false;
        }
    }

    /**
     * Preload PayPal SDK & CardFields component on order page
     */
    async function preloadOrderPageCardPayment() {
        try {
            if (!window.PayPalConfig) {
                await new Promise((resolve) => {
                    const existing = document.getElementById('dezan-paypal-config-script');
                    if (existing) {
                        if (window.PayPalConfig) return resolve(window.PayPalConfig);
                        existing.addEventListener('load', () => resolve(window.PayPalConfig));
                        existing.addEventListener('error', () => resolve(null));
                        return;
                    }
                    const sc = document.createElement('script');
                    sc.id = 'dezan-paypal-config-script';
                    const srcPath = typeof window.resolveAppPath === 'function' ? window.resolveAppPath('js/paypal-config.js') : '/js/paypal-config.js';
                    sc.src = srcPath;
                    sc.onload = () => resolve(window.PayPalConfig);
                    sc.onerror = () => resolve(null);
                    document.head.appendChild(sc);
                });
            }

            if (window.PayPalConfig && typeof window.PayPalConfig.loadSdk === 'function') {
                const paypal = await window.PayPalConfig.loadSdk();
                if (paypal && paypal.CardFields) {
                    await initOrderPageCardFieldsComponent(paypal);
                }
            }
        } catch (e) {
            console.warn('[PayPal Preload Note]:', e.message);
        }
    }

    /**
     * Submit payment using PayPal direct CardFields
     */
    global.submitModalCardPayment = async function() {
        if (isOrderPageCardSubmitting) return;
        const errorBox = document.getElementById('modal-card-fields-error');
        const submitBtn = document.getElementById('modal-card-submit-btn');
        const submitBtnText = document.getElementById('modal-card-submit-btn-text');

        if (errorBox) errorBox.classList.add('hidden');

        if (!orderPageCardFieldsInstance || typeof orderPageCardFieldsInstance.submit !== 'function') {
            showOrderPageCardError('Card payment fields are initializing. Please wait a moment and click Pay again.');
            return;
        }

        try {
            isOrderPageCardSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            }
            if (submitBtnText) {
                submitBtnText.textContent = 'Processing Card Payment...';
            }

            await orderPageCardFieldsInstance.submit().catch(err => {
                throw err;
            });
        } catch (err) {
            console.error('[Card Submission Error]:', err);
            showOrderPageCardError(err.message || 'Please check your card details and try again.');
        } finally {
            isOrderPageCardSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
            const price = state.totalPrice || 15;
            const priceStr = (price % 1 === 0) ? `$${Math.round(price)}` : `$${Number(price).toFixed(2)}`;
            if (submitBtnText) {
                submitBtnText.textContent = `Pay ${priceStr} Now`;
            }
        }
    };

    global.setPaymentMethod = function(method) {
        state.paymentMethod = (method === 'Card' || method === 'CreditCard') ? 'Card' : 'PayPal';

        const tabPaypal = document.getElementById('modal-tab-paypal');
        const tabCard = document.getElementById('modal-tab-card');
        const radioPaypal = document.getElementById('modal-radio-paypal');
        const radioCard = document.getElementById('modal-radio-card');
        const instruction = document.getElementById('modal-payment-instruction');

        if (state.paymentMethod === 'Card') {
            // Card Selected
            if (tabCard) {
                tabCard.className = 'relative p-3.5 sm:p-4 rounded-2xl border-2 border-primary bg-amber-50/50 dark:bg-primary/10 ring-1 ring-primary/20 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
            }
            if (radioCard) {
                radioCard.className = 'w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
                radioCard.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-primary"></div>';
            }

            // PayPal Inactive
            if (tabPaypal) {
                tabPaypal.className = 'relative p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
            }
            if (radioPaypal) {
                radioPaypal.className = 'w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
                radioPaypal.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>';
            }

            if (instruction) {
                instruction.textContent = 'Enter your card details below to complete payment securely:';
            }
        } else {
            // PayPal Selected
            if (tabPaypal) {
                tabPaypal.className = 'relative p-3.5 sm:p-4 rounded-2xl border-2 border-primary bg-amber-50/50 dark:bg-primary/10 ring-1 ring-primary/20 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
            }
            if (radioPaypal) {
                radioPaypal.className = 'w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
                radioPaypal.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-primary"></div>';
            }

            // Card Inactive
            if (tabCard) {
                tabCard.className = 'relative p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
            }
            if (radioCard) {
                radioCard.className = 'w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
                radioCard.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>';
            }

            if (instruction) {
                instruction.textContent = 'Fast, 1-click settlement via PayPal balance or PayPal Pay Later:';
            }
        }

        // GA4 Funnel: add_payment_info
        if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackAddPaymentInfo === 'function') {
            window.dezanTracker.trackAddPaymentInfo(state.paymentMethod, {
                plan: state.serviceName,
                amount: state.totalPrice
            });
        }

        state.hasExplicitlySelectedMethod = true;
        window.updateOrderPageDynamicCta();
        initPayPalButtons(state.paymentMethod);
    };

    function resetPaymentTabs() {
        state.hasExplicitlySelectedMethod = false;
        state.paymentMethod = null;

        const tabPaypal = document.getElementById('modal-tab-paypal');
        const tabCard = document.getElementById('modal-tab-card');
        const radioPaypal = document.getElementById('modal-radio-paypal');
        const radioCard = document.getElementById('modal-radio-card');
        const instruction = document.getElementById('modal-payment-instruction');
        const container = document.getElementById('modal-paypal-button-container');
        const cardContainer = document.getElementById('modal-card-fields-container');
        const errorBox = document.getElementById('modal-card-fields-error');

        if (tabPaypal) {
            tabPaypal.className = 'relative p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
        }
        if (radioPaypal) {
            radioPaypal.className = 'w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
            radioPaypal.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>';
        }

        if (tabCard) {
            tabCard.className = 'relative p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none shadow-xs flex flex-col justify-between';
        }
        if (radioCard) {
            radioCard.className = 'w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors bg-white dark:bg-slate-900';
            radioCard.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-transparent"></div>';
        }

        if (instruction) {
            instruction.textContent = 'Select your preferred payment method above to proceed:';
        }

        if (cardContainer) {
            cardContainer.classList.add('hidden');
        }

        if (errorBox) {
            errorBox.classList.add('hidden');
        }

        updateOrderPageCardBrandBadges(null);

        if (container) {
            container.classList.remove('hidden');
            container.innerHTML = `
                <div class="py-3 px-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-base text-primary">touch_app</span>
                    <span>Choose <strong>PayPal</strong> or <strong>Credit / Debit Card</strong> above</span>
                </div>
            `;
            state.paypalMountedMethod = null;
        }

        window.updateOrderPageDynamicCta();
    }

    window.updateOrderPageDynamicCta = function() {
        const ctaBtn = document.getElementById('orderpage-step3-dynamic-cta');
        const ctaText = document.getElementById('orderpage-step3-cta-text');
        const ctaIcon = document.getElementById('orderpage-step3-cta-icon');
        if (!ctaBtn) return;

        const paymentBox = document.getElementById('modal-panel-payment');
        let isPaymentVisible = false;
        if (paymentBox) {
            const pRect = paymentBox.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            isPaymentVisible = (pRect.top < windowHeight - 40) && (pRect.bottom > 40);
        }

        const price = state.totalPrice || 15;
        const priceStr = (price % 1 === 0) ? `$${Math.round(price)}` : `$${Number(price).toFixed(2)}`;

        if (!isPaymentVisible) {
            ctaBtn.className = 'w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-background-dark text-xs sm:text-sm font-black shadow-md shadow-primary/25 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]';
            if (ctaText) ctaText.textContent = 'Continue to Payment →';
            if (ctaIcon) {
                ctaIcon.textContent = 'arrow_forward';
                ctaIcon.className = 'material-symbols-outlined text-base animate-pulse';
            }
            ctaBtn.setAttribute('data-cta-state', 'continue');
        } else if (!state.hasExplicitlySelectedMethod) {
            ctaBtn.className = 'w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow-md shadow-amber-500/25 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]';
            if (ctaText) ctaText.textContent = 'Choose Payment Method';
            if (ctaIcon) {
                ctaIcon.textContent = 'payments';
                ctaIcon.className = 'material-symbols-outlined text-base';
            }
            ctaBtn.setAttribute('data-cta-state', 'choose');
        } else {
            const isPayPal = state.paymentMethod === 'PayPal';
            if (isPayPal) {
                ctaBtn.className = 'w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FFC439] hover:bg-[#f5b82e] text-[#003087] text-xs sm:text-sm font-black shadow-md shadow-amber-400/30 border border-amber-400/50 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]';
                if (ctaText) ctaText.textContent = `Pay ${priceStr} with PayPal`;
                if (ctaIcon) {
                    ctaIcon.textContent = 'lock';
                    ctaIcon.className = 'material-symbols-outlined text-base';
                }
                ctaBtn.setAttribute('data-cta-state', 'paypal');
            } else {
                ctaBtn.className = 'w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-black shadow-md shadow-slate-900/20 border border-slate-700/50 dark:border-slate-200 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]';
                if (ctaText) ctaText.textContent = `Pay ${priceStr} by Card`;
                if (ctaIcon) {
                    ctaIcon.textContent = 'credit_card';
                    ctaIcon.className = 'material-symbols-outlined text-base';
                }
                ctaBtn.setAttribute('data-cta-state', 'card');
            }
        }
    };

    window.handleOrderPageDynamicCtaClick = function() {
        const ctaBtn = document.getElementById('orderpage-step3-dynamic-cta');
        const ctaState = ctaBtn?.getAttribute('data-cta-state') || 'continue';
        const paymentBox = document.getElementById('modal-panel-payment');

        if (ctaState === 'continue') {
            if (paymentBox) {
                paymentBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setTimeout(() => {
                window.updateOrderPageDynamicCta();
            }, 350);
            return;
        }

        if (ctaState === 'choose') {
            if (paymentBox) {
                paymentBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const tabPaypal = document.getElementById('modal-tab-paypal');
            const tabCard = document.getElementById('modal-tab-card');
            [tabPaypal, tabCard].forEach(tab => {
                if (tab) {
                    tab.classList.add('ring-4', 'ring-primary/40');
                    setTimeout(() => tab.classList.remove('ring-4', 'ring-primary/40'), 1200);
                }
            });
            return;
        }

        if (ctaState === 'card') {
            const cardContainer = document.getElementById('modal-card-fields-container');
            const cardSubmitBtn = document.getElementById('modal-card-submit-btn');
            if (cardContainer && !cardContainer.classList.contains('hidden') && cardSubmitBtn) {
                cardSubmitBtn.click();
                return;
            }
        }

        if (ctaState === 'paypal' || ctaState === 'card') {
            if (paymentBox) {
                paymentBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                paymentBox.classList.add('ring-4', 'ring-primary/40');
                setTimeout(() => paymentBox.classList.remove('ring-4', 'ring-primary/40'), 1200);
            }
            const container = document.getElementById('modal-paypal-button-container');
            if (container) {
                const clickable = container.querySelector('button, [role="button"], input[type="submit"]');
                if (clickable) {
                    clickable.click();
                }
            }
        }
    };

    async function initPayPalButtons(preferredMethod) {
        preferredMethod = preferredMethod || state.paymentMethod;
        const container = document.getElementById('modal-paypal-button-container');
        const cardContainer = document.getElementById('modal-card-fields-container');
        if (!container) return;

        const isCard = preferredMethod === 'Card';

        if (state.isMountingPayPal) return;
        state.isMountingPayPal = true;

        try {
            if (!window.PayPalConfig) {
                await new Promise((resolve, reject) => {
                    const existing = document.getElementById('dezan-paypal-config-script');
                    if (existing) {
                        if (window.PayPalConfig) return resolve(window.PayPalConfig);
                        existing.addEventListener('load', () => resolve(window.PayPalConfig));
                        existing.addEventListener('error', () => reject(new Error('PayPal configuration script failed to load')));
                        return;
                    }
                    const sc = document.createElement('script');
                    sc.id = 'dezan-paypal-config-script';
                    const srcPath = typeof window.resolveAppPath === 'function' ? window.resolveAppPath('js/paypal-config.js') : '/js/paypal-config.js';
                    sc.src = srcPath;
                    sc.onload = () => resolve(window.PayPalConfig);
                    sc.onerror = () => reject(new Error('PayPal configuration script failed to load'));
                    document.head.appendChild(sc);
                });
            }

            if (!window.PayPalConfig || typeof window.PayPalConfig.loadSdk !== 'function') {
                throw new Error('PayPal SDK configuration not loaded');
            }

            const sdkPromise = window.PayPalConfig.loadSdk();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('PayPal gateway response delayed on current network.')), 6500);
            });
            const paypal = await Promise.race([sdkPromise, timeoutPromise]);

            if (isCard) {
                // Try initializing CardFields directly ONLY if account has a server-generated clientToken
                let isCardFieldsReady = false;
                if (paypal && paypal.CardFields && window.PayPalConfig?.clientToken) {
                    isCardFieldsReady = await initOrderPageCardFieldsComponent(paypal);
                }

                if (isCardFieldsReady && cardContainer) {
                    // Direct card fields: immediate display without second button!
                    container.classList.add('hidden');
                    cardContainer.classList.remove('hidden');
                    const price = state.totalPrice || 15;
                    const priceStr = (price % 1 === 0) ? `$${Math.round(price)}` : `$${Number(price).toFixed(2)}`;
                    const submitBtnText = document.getElementById('modal-card-submit-btn-text');
                    if (submitBtnText) submitBtnText.textContent = `Pay ${priceStr} Now`;
                    return;
                }

                // Fallback to PayPal card button if CardFields is not eligible
                if (cardContainer) cardContainer.classList.add('hidden');
                container.classList.remove('hidden');
            } else {
                if (cardContainer) cardContainer.classList.add('hidden');
                container.classList.remove('hidden');
            }

            if (state.paypalMountedMethod === preferredMethod && container.children.length > 0) {
                return;
            }

            container.innerHTML = `
                <div class="space-y-2 py-1 animate-pulse">
                    <div class="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined animate-spin text-sm text-primary">sync</span>
                        <span>Loading secure ${isCard ? 'card' : 'PayPal'} checkout...</span>
                    </div>
                </div>
            `;

            container.innerHTML = '';

            const buttonConfig = {
                style: {
                    layout: 'vertical',
                    color: isCard ? 'black' : 'gold',
                    shape: 'rect',
                    label: isCard ? 'pay' : 'paypal',
                    height: 46
                },
                fundingSource: isCard ? paypal.FUNDING.CARD : paypal.FUNDING.PAYPAL,

                createOrder: async function() {
                    const price = state.totalPrice || 15.00;
                    const jobName = (document.getElementById('dig-job-name')?.value || 'Custom Order').trim();
                    const clientName = (document.getElementById('order-client-name')?.value || 'Customer').trim();
                    const clientEmail = (document.getElementById('order-client-email')?.value || '').trim();

                    try {
                        const res = await fetch('/api/paypal/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                amount: price.toFixed(2),
                                currency: 'USD',
                                orderDetails: {
                                    projectName: jobName,
                                    serviceType: state.serviceName,
                                    clientName: clientName,
                                    clientEmail: clientEmail
                                }
                            })
                        });

                        if (!res.ok) {
                            const errData = await res.json().catch(() => ({}));
                            throw new Error(errData.message || `Server returned HTTP ${res.status}`);
                        }

                        const data = await res.json();
                        return data.paypalOrderId || data.id || data.data?.id;
                    } catch (err) {
                        console.error('[PayPal createOrder Error]:', err);
                        alert(`Unable to initialize checkout: ${err.message}. Please try again.`);
                        throw err;
                    }
                },

                onApprove: async function(data) {
                    container.innerHTML = `
                        <div class="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 py-4">
                            <span class="material-symbols-outlined text-xl animate-spin text-primary">progress_activity</span>
                            <span class="font-bold">Authorizing payment & creating your order...</span>
                        </div>
                    `;

                    try {
                        const captureRes = await fetch('/api/paypal/capture-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ paypalOrderId: data.orderID })
                        });

                        const captureData = await captureRes.json().catch(() => ({}));
                        if (!captureRes.ok || !captureData.success) {
                            throw new Error(captureData.message || 'Payment capture could not be confirmed.');
                        }

                        await finalizeOrder({
                            paymentStatus: 'paid',
                            paymentMethod: preferredMethod === 'Card' ? 'CreditCard' : 'PayPal',
                            transactionId: captureData.transactionId || data.orderID
                        });
                    } catch (err) {
                        console.error('[Payment Capture Error]:', err);
                        alert(`Payment confirmation error: ${err.message}`);
                        initPayPalButtons(preferredMethod);
                    }
                },

                onError: function(err) {
                    console.error('[PayPal Error]:', err);
                    container.innerHTML = `
                        <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-center space-y-2">
                            <p class="font-bold">Gateway Connection Error</p>
                            <p class="text-[11px] text-slate-600 dark:text-slate-300">${err.message || 'Could not open checkout on this network.'}</p>
                            <div class="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                                <button type="button" onclick="window.handleOrderPageDirectSubmit()" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-background-dark font-black text-xs hover:bg-primary-hover cursor-pointer shadow-sm">
                                    Place Order &amp; Pay Later
                                </button>
                                <button type="button" onclick="window.setPaymentMethod('${preferredMethod}')" class="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-xs text-slate-700 dark:text-slate-200 hover:border-primary cursor-pointer">
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    `;
                }
            };

            const buttons = paypal.Buttons(buttonConfig);
            if (typeof buttons.isEligible === 'function' && !buttons.isEligible()) {
                delete buttonConfig.fundingSource;
                await paypal.Buttons(buttonConfig).render(container);
            } else {
                await buttons.render(container);
            }

            state.paypalMountedMethod = preferredMethod;
        } catch (err) {
            console.error('[PayPal Mount Error]:', err);
            container.innerHTML = `
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs text-center space-y-2">
                    <p class="font-bold">Payment Gateway Response Delayed</p>
                    <p class="text-[11px] text-slate-600 dark:text-slate-300">${err.message || 'PayPal is taking longer to respond on your connection.'}</p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button type="button" onclick="window.handleOrderPageDirectSubmit()" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-background-dark font-black text-xs hover:bg-primary-hover cursor-pointer shadow-sm">
                            Place Order &amp; Pay Later
                        </button>
                        <button type="button" onclick="window.setPaymentMethod('${preferredMethod}')" class="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-xs text-slate-700 dark:text-slate-200 hover:border-primary cursor-pointer">
                            Retry Connection
                        </button>
                    </div>
                </div>
            `;
        } finally {
            state.isMountingPayPal = false;
        }
    }

    // Expose direct order submission helper on window for fallback usage
    global.handleOrderPageDirectSubmit = function() {
        finalizeOrder({
            paymentStatus: 'pending_invoice',
            paymentMethod: state.paymentMethod || 'PayPal'
        });
    };

    // -------------------------------------------------------------
    // 8. Order Finalization & Database Storage
    // -------------------------------------------------------------
    async function finalizeOrder(paymentOverrides = {}) {
        const jobName = (document.getElementById('dig-job-name')?.value || 'Custom Order').trim();
        const clientName = (document.getElementById('order-client-name')?.value || 'Customer').trim();
        const clientEmail = (document.getElementById('order-client-email')?.value || '').trim();
        const instructions = (document.getElementById('order-notes')?.value || '').trim();

        let placement = 'Left Chest';
        if (state.serviceSlug === 'pet-portrait') {
            placement = document.getElementById('pet-placement')?.value || 'Small / Left Chest (Up to 5.5")';
        } else if (state.serviceSlug === 'vector-art') {
            placement = document.getElementById('vec-use')?.value || 'Screen Printing';
        } else {
            placement = (document.getElementById('dig-placement')?.value || 'Left Chest — $15').split('—')[0].trim();
        }

        const sizeVal = (document.getElementById('dig-size')?.value || '').trim();
        const unit = document.getElementById('dig-size-unit')?.value || 'in';
        const sizing = state.serviceSlug === 'vector-art' ? 'Resolution Independent' : `${sizeVal} ${unit}`;

        let formats = [];
        if (state.serviceSlug === 'vector-art') {
            formats = Array.from(document.querySelectorAll('input[name="vec-formats"]:checked')).map(cb => cb.value);
        } else {
            formats = Array.from(document.querySelectorAll('input[name="dig-formats"]:checked')).map(cb => cb.value);
        }
        const fileFormat = formats.length > 0 ? formats.join(', ') : (state.serviceSlug === 'vector-art' ? 'AI, EPS, PDF' : '.DST');

        const specialOptions = Array.from(document.querySelectorAll('input[name="dig-special"]:checked')).map(cb => cb.value);
        const fabricType = state.serviceSlug === 'vector-art' ? 'Scalable Vector' : (document.getElementById('dig-fabric')?.value || 'Polo / Pique Knit');

        const rawArtworkFiles = state.uploadedFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            dataUrl: f.dataUrl
        }));

        const planName = `${state.serviceName} - ${placement}`;
        const calculatedPrice = state.totalPrice;

        const orderPayload = {
            isQuote: false,
            is_quote: false,
            status: 'pending_review',
            serviceType: state.serviceType,
            planName: planName,
            projectName: jobName,
            placement: placement,
            fabricType: fabricType,
            sizing: sizing,
            fileFormat: fileFormat,
            specialOptions: specialOptions,
            turnaroundSpeed: state.turnaround,
            instructions: [
                `Service: ${state.serviceName}`,
                `Sizing: ${sizing}`,
                `Fabric: ${fabricType}`,
                specialOptions.length > 0 ? `Special: ${specialOptions.join(', ')}` : '',
                instructions ? `Notes: ${instructions}` : ''
            ].filter(Boolean).join('\n'),
            rawArtworkFiles: rawArtworkFiles,
            price: calculatedPrice,
            amount: calculatedPrice,
            paymentStatus: paymentOverrides.paymentStatus || 'paid',
            paymentMethod: paymentOverrides.paymentMethod || state.paymentMethod,
            transactionId: paymentOverrides.transactionId || null,
            payment_reference: paymentOverrides.transactionId || null,
            clientName: clientName,
            clientEmail: clientEmail,
            attribution: (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.getAttribution === 'function') ? window.dezanTracker.getAttribution() : {}
        };

        let createdRecord = null;
        try {
            if (window.insforgeClient && typeof window.insforgeClient.createOrder === 'function') {
                createdRecord = await window.insforgeClient.createOrder(orderPayload);
            } else {
                const orderNum = 'DZ-' + Math.floor(1000 + Math.random() * 9000);
                createdRecord = {
                    id: 'ord_' + Date.now(),
                    order_number: orderNum,
                    ...orderPayload,
                    created_at: new Date().toISOString()
                };
                const localOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                localOrders.unshift(createdRecord);
                localStorage.setItem('dezan_orders', JSON.stringify(localOrders));
            }
        } catch (err) {
            console.warn('[InsForge Save Warning]:', err.message);
            const orderNum = 'DZ-' + Math.floor(1000 + Math.random() * 9000);
            createdRecord = {
                id: 'ord_' + Date.now(),
                order_number: orderNum,
                ...orderPayload,
                created_at: new Date().toISOString()
            };
        }

        // Clear local draft upon confirmed creation
        try {
            sessionStorage.removeItem(DRAFT_KEY);
            localStorage.removeItem(DRAFT_KEY);
        } catch (_) {}
        clearArtworksFromDb();

        const orderNum = createdRecord?.order_number || createdRecord?.orderNumber || 'DZ-1048';

        // Redirect to confirmation screen with order and payment query parameters
        let dest = `order-success.html?order=${encodeURIComponent(orderNum)}&status=paid&service=${encodeURIComponent(state.serviceName)}&amount=${calculatedPrice.toFixed(2)}&placement=${encodeURIComponent(placement)}&turnaround=${encodeURIComponent(state.turnaround)}`;
        if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.buildAttributionUrl === 'function') {
            dest = window.dezanTracker.buildAttributionUrl(dest);
        }
        window.location.href = dest;
    }

    // -------------------------------------------------------------
    // 9. Page Initialization
    // -------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', async () => {
        // Track order_started event
        if (typeof window.dezanTracker !== 'undefined' && typeof window.dezanTracker.trackOrderStarted === 'function') {
            window.dezanTracker.trackOrderStarted('order_page_load');
        }

        setupArtworkDropzone();

        // Check for prefilled authenticated session
        try {
            const rawSession = sessionStorage.getItem('dezan_session') || localStorage.getItem('dezan_session');
            if (rawSession) {
                const sess = JSON.parse(rawSession);
                if (sess.email) {
                    const nameInput = document.getElementById('order-client-name');
                    const emailInput = document.getElementById('order-client-email');
                    const authIndicator = document.getElementById('auth-status-indicator');
                    if (nameInput) nameInput.value = sess.full_name || sess.name || 'Client';
                    if (emailInput) emailInput.value = sess.email;
                    if (authIndicator) authIndicator.textContent = `Signed In as ${sess.email}`;
                }
            }
        } catch (_) {}

        // 1. Restore draft if available
        await restoreOrderDraft();

        // 2. Parse URL parameters (takes precedence on first load if explicit parameters are passed)
        parseUrlParameters();

        // 3. Auto-save on form inputs
        const form = document.getElementById('order-page-form');
        if (form) {
            form.addEventListener('input', () => saveOrderDraft());
            form.addEventListener('change', () => {
                calculatePrice();
                saveOrderDraft();
            });
        }
    });

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})(typeof window !== 'undefined' ? window : this);
