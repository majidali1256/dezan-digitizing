/**
 * Dezan Digitizing — InsForge Client & RBAC State Engine
 * Backend Base: https://e8rw998g.us-east.insforge.app
 * Handles Authentication, PostgreSQL Database Sync, Worker Tasks, S3 Storage, and Live Realtime Sync
 */

const INSFORGE_CONFIG = {
    baseUrl: 'https://e8rw998g.us-east.insforge.app',
    anonKey: 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50',
    storageUrl: 'https://e8rw998g.us-east.insforge.app/api/storage'
};

// ===================================================================
//  DEMO MOCK ACCOUNTS (For Instant 1-Click Role Testing & Verifications)
// ===================================================================
const DEMO_USERS = {
    admin: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@dezandigitizing.com',
        displayName: 'Faisal Dezan (Admin)',
        role: 'admin',
        company: 'Dezan Digitizing HQ',
        status: 'active'
    },
    client: {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'client@falconapparel.com',
        displayName: 'John Falcon',
        role: 'client',
        company: 'Falcon Apparel Co.',
        status: 'active'
    },
    digitizer: {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'worker.alex@dezandigitizing.com',
        displayName: 'Alex Miller (Lead Digitizer)',
        role: 'digitizer',
        status: 'active'
    }
};

// Initial Sample Orders for Offline Demonstration & Fallback
const INITIAL_DEMO_ORDERS = [
    {
        id: '00000000-0000-0000-0000-000000000101',
        order_number: 'ORD-8841',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Jacket Back',
        project_name: 'Falcon Wings Crest',
        placement: 'Jacket Back',
        sizing: '11.5" W x 8.0" H',
        file_format: 'DST, EMB',
        instructions: 'High density stitch, 3D puff on the letter F, fabric is heavy denim. Keep color changes to max 5 stops.',
        raw_artwork_files: [
            { name: 'falcon_wings_crest.png', url: 'images/dezan-logo.png', size: 245000 }
        ],
        price: 55.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'in_progress',
        deliverables: [],
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000102',
        order_number: 'ORD-8842',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Left Chest / Hat',
        project_name: 'Falcon Mini Cap Logo',
        placement: 'Cap Front / Hat',
        sizing: '2.5" W x 2.2" H',
        file_format: 'DST, EMB',
        instructions: 'Center-out sequencing for structured 6-panel baseball cap. Needle 75/11.',
        raw_artwork_files: [
            { name: 'falcon_cap_badge.png', url: 'logo.png', size: 142000 }
        ],
        price: 15.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: null,
        assigned_digitizer_name: null,
        assigned_at: null,
        status: 'pending_review',
        deliverables: [],
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000103',
        order_number: 'ORD-8839',
        client_id: '00000000-0000-0000-0000-000000000002',
        client_name: 'John Falcon',
        client_email: 'client@falconapparel.com',
        client_company: 'Falcon Apparel Co.',
        service_type: 'Digitizing',
        plan_name: 'Left Chest',
        project_name: 'Falcon Corporate Polo',
        placement: 'Left Chest',
        sizing: '3.5" W x 1.8" H',
        file_format: 'DST, EMB',
        instructions: 'Pique knit fabric, underlay tatami with satin border.',
        raw_artwork_files: [
            { name: 'falcon_polo_vector.svg', url: 'logo.png', size: 98000 }
        ],
        price: 20.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Falcon_Polo_LeftChest.dst', url: '#', size: 28400 },
            { format: 'EMB', name: 'Falcon_Polo_LeftChest.emb', url: '#', size: 148200 }
        ],
        created_at: new Date(Date.now() - 3600000 * 54).toISOString()
    }
];

class InsForgeClient {
    constructor() {
        this.baseUrl = INSFORGE_CONFIG.baseUrl;
        this.anonKey = INSFORGE_CONFIG.anonKey;
        this.initStorage();
        this.initRealtime();
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getApiHeaders(extra = {}) {
        return {
            'apikey': this.anonKey,
            'Authorization': `Bearer ${this.anonKey}`,
            'Content-Type': 'application/json',
            ...extra
        };
    }

    initStorage() {
        if (!localStorage.getItem('dezan_orders')) {
            localStorage.setItem('dezan_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
        }
        if (!localStorage.getItem('dezan_digitizers')) {
            localStorage.setItem('dezan_digitizers', JSON.stringify([
                DEMO_USERS.digitizer,
                {
                    id: '00000000-0000-0000-0000-000000000004',
                    email: 'worker.sam@dezandigitizing.com',
                    displayName: 'Sam Chen (Vector Specialist)',
                    role: 'digitizer',
                    status: 'active'
                },
                {
                    id: '00000000-0000-0000-0000-000000000005',
                    email: 'worker.maria@dezandigitizing.com',
                    displayName: 'Maria Garcia (3D Puff Master)',
                    role: 'digitizer',
                    status: 'active'
                }
            ]));
        }
    }

    // ===================================================================
    //  REALTIME & AUTO-HEARTBEAT DUAL-ENGINE
    // ===================================================================

    initRealtime() {
        this.subscribers = new Set();
        this.lastKnownFingerprint = null;
        this._heartbeatTimer = null;
        this._processedEventKeys = new Set();

        if (typeof window !== 'undefined') {
            // 1. HTML5 BroadcastChannel for instantaneous multi-tab sync (< 5ms)
            if (typeof BroadcastChannel !== 'undefined') {
                try {
                    this.broadcastChannel = new BroadcastChannel('dezan_realtime_sync');
                    this.broadcastChannel.onmessage = (event) => {
                        const { id, type, payload } = event.data || {};
                        if (id && this._processedEventKeys.has(id)) return;
                        if (id) {
                            this._processedEventKeys.add(id);
                            setTimeout(() => this._processedEventKeys.delete(id), 8000);
                        }
                        if (type) {
                            console.log('⚡ Realtime Broadcast received:', type, payload);
                            this.notifySubscribers(type, payload, false);
                        }
                    };
                } catch (e) {
                    console.warn('BroadcastChannel note:', e.message);
                }
            }

            // 2. Storage event listener (Cross-tab secondary channel)
            window.addEventListener('storage', (e) => {
                if (e.key === 'dezan_last_event' && e.newValue) {
                    try {
                        const { id, type, payload } = JSON.parse(e.newValue);
                        if (id && this._processedEventKeys.has(id)) return;
                        if (id) {
                            this._processedEventKeys.add(id);
                            setTimeout(() => this._processedEventKeys.delete(id), 8000);
                        }
                        this.notifySubscribers(type, payload, false);
                    } catch (_) {}
                }
            });

            // 3. Tab visibility listener (Reconciles instantly when tab becomes visible)
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.checkHeartbeatProbe();
                }
            });

            // 4. Online state listener
            window.addEventListener('online', () => {
                console.log('🌐 Online event: reconnecting and probing database...');
                this.checkHeartbeatProbe();
            });

            // 5. Start lightweight probe heartbeat (polls every 5s)
            this.startAutoHeartbeat(5000);
        }
    }

    onRealtimeEvent(callback) {
        if (typeof callback === 'function') {
            this.subscribers.add(callback);
            return () => this.subscribers.delete(callback);
        }
        return () => {};
    }

    notifySubscribers(type, payload, isLocal = false) {
        this.subscribers.forEach(cb => {
            try {
                cb({ type, payload, isLocal });
            } catch (err) {
                console.error('Realtime subscriber error:', err);
            }
        });
    }

    broadcastEvent(type, payload) {
        const eventId = `${type}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        this._processedEventKeys.add(eventId);
        setTimeout(() => this._processedEventKeys.delete(eventId), 8000);

        const message = { id: eventId, type, payload, timestamp: Date.now() };

        // 1. Post to BroadcastChannel
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(message);
            } catch (_) {}
        }

        // 2. Update localStorage key for cross-tab storage event
        try {
            localStorage.setItem('dezan_last_event', JSON.stringify(message));
        } catch (_) {}

        // 3. Notify current tab's local subscribers
        this.notifySubscribers(type, payload, true);
    }

    startAutoHeartbeat(intervalMs = 5000) {
        if (this._heartbeatTimer) return;
        // Run initial check
        setTimeout(() => this.checkHeartbeatProbe(), 1000);
        this._heartbeatTimer = setInterval(() => {
            this.checkHeartbeatProbe();
        }, intervalMs);
    }

    /**
     * Bandwidth-efficient probe: queries only 4 small columns of the latest updated record
     */
    async checkHeartbeatProbe() {
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/orders?select=id,order_number,status,updated_at&order=updated_at.desc&limit=1`, {
                headers: this.getApiHeaders()
            });
            if (!res.ok) return;
            const rows = await res.json();
            if (!Array.isArray(rows) || rows.length === 0) return;

            const latest = rows[0];
            const fingerprint = `${latest.order_number}:${latest.status}:${latest.updated_at}`;

            if (this.lastKnownFingerprint && this.lastKnownFingerprint !== fingerprint) {
                console.log('⚡ InsForge DB change detected by probe:', fingerprint);
                this.lastKnownFingerprint = fingerprint;
                this.notifySubscribers('remote_db_change', {
                    orderNumber: latest.order_number,
                    status: latest.status,
                    updatedAt: latest.updated_at
                }, false);
            } else {
                this.lastKnownFingerprint = fingerprint;
            }

            const timeStr = new Date().toLocaleTimeString();
            localStorage.setItem('dezan_db_last_synced', new Date().toISOString());
            this.updateSyncBadges(timeStr);
        } catch (err) {
            // Offline or intermittent network; quietly ignore
        }
    }

    updateSyncBadges(timeStr) {
        const textElements = document.querySelectorAll('#db-sync-text, #admin-db-sync-text, #worker-db-sync-text');
        textElements.forEach(el => {
            el.textContent = `Live Sync Active (${timeStr})`;
        });
    }

    // Interactive Toast Notification Engine
    showToast(title, message, icon = 'notifications', type = 'info') {
        if (typeof document === 'undefined') return;

        // Deduplicate identical toasts triggered in quick succession
        const toastKey = `${title}:${message}`;
        if (this._lastToastKey === toastKey && (Date.now() - (this._lastToastTime || 0) < 2000)) {
            return;
        }
        this._lastToastKey = toastKey;
        this._lastToastTime = Date.now();

        let container = document.getElementById('dezan-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dezan-toast-container';
            container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/30 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0';
        
        let iconBg = 'bg-amber-50 text-amber-900 dark:bg-primary/20 dark:text-primary';
        if (type === 'success') {
            iconBg = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30';
        } else if (type === 'info') {
            iconBg = 'bg-blue-50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30';
        }

        toast.innerHTML = `
            <div class="w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-lg">${icon}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h5 class="text-xs font-black text-slate-900 dark:text-white leading-snug">${title}</h5>
                <p class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">${message}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 p-1 cursor-pointer" aria-label="Close">
                <span class="material-symbols-outlined text-xs">close</span>
            </button>
        `;

        container.appendChild(toast);
        this.playNotificationChime();

        // Animate entrance
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 350);
        }, 4500);
    }

    // Synthesized Web Audio Notification Bell
    playNotificationChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.12); // A5
            osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.3);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.5);
        } catch (_) {}
    }

    // ===================================================================
    //  INSFORGE CLOUD STORAGE (S3-BACKED FILE UPLOADS & CDN DOWNLOADS)
    // ===================================================================

    /**
     * Uploads a File object directly to an InsForge Storage Bucket ('artworks' or 'deliverables')
     * @param {string} bucket - Target bucket name ('artworks' | 'deliverables')
     * @param {File} file - Browser File object
     * @returns {Promise<{bucket: string, key: string, url: string, name: string, size: number, mimeType: string, format: string}>}
     */
    async uploadFile(bucket, file) {
        if (!file) throw new Error('No file provided for upload');
        
        const formData = new FormData();
        formData.append('file', file);

        const uploadUrl = `${this.baseUrl}/api/storage/buckets/${encodeURIComponent(bucket)}/objects`;
        
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`
            },
            body: formData
        });

        if (!response.ok) {
            let errorMsg = `Storage upload failed with status ${response.status}`;
            try {
                const errJson = await response.json();
                errorMsg = errJson.message || errJson.error || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const ext = file.name.split('.').pop().toUpperCase();
        const objectKey = data.key;
        const cdnUrl = data.url || `${this.baseUrl}/api/storage/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}`;

        return {
            bucket: data.bucket || bucket,
            key: objectKey,
            url: cdnUrl,
            name: file.name,
            size: file.size,
            mimeType: file.type || data.mimeType || 'application/octet-stream',
            format: ext,
            uploadedAt: data.uploadedAt || new Date().toISOString()
        };
    }

    // ===================================================================
    //  AUTHENTICATION & SESSION MANAGEMENT
    // ===================================================================

    getCurrentUser() {
        const session = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch {
            return null;
        }
    }

    setSession(user, sessionOnly = false) {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
        }
        if (!sessionOnly && typeof localStorage !== 'undefined') {
            localStorage.setItem('dezan_session', JSON.stringify(user));
        }
    }

    signOut() {
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('dezan_session');
        if (typeof localStorage !== 'undefined') localStorage.removeItem('dezan_session');
        window.location.href = 'portal-login.html';
    }

    // 1-Click Demo Login Switcher
    loginAsDemo(role) {
        const user = DEMO_USERS[role];
        if (!user) return false;
        this.setSession(user);
        this.redirectToDashboard(user.role);
        return true;
    }

    // Standard Sign In
    async signIn(email, password) {
        // First check demo users
        const demoUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
        if (demoUser) {
            this.setSession(demoUser);
            return { user: demoUser, error: null };
        }

        // Check local registered users
        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        const existing = registered.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            this.setSession(existing);
            return { user: existing, error: null };
        }

        return { user: null, error: 'Invalid email or password. Please try a demo account or sign up.' };
    }

    // Standard Sign Up
    async signUp({ email, password, displayName, role = 'client', company = '' }) {
        const user = {
            id: this.generateUUID(),
            email,
            displayName,
            role,
            company,
            status: 'active',
            created_at: new Date().toISOString()
        };

        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        registered.push(user);
        localStorage.setItem('dezan_registered_users', JSON.stringify(registered));

        this.setSession(user);
        return { user, error: null };
    }

    // Automatic Role-Based Routing
    redirectToDashboard(role) {
        if (role === 'admin') {
            window.location.href = 'admin-portal.html';
        } else if (role === 'digitizer') {
            window.location.href = 'worker-portal.html';
        } else {
            window.location.href = 'client-portal.html';
        }
    }

    // Guard page access
    requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'portal-login.html';
            return null;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            this.redirectToDashboard(user.role);
            return null;
        }
        return user;
    }

    // ===================================================================
    //  POSTGRESQL DATABASE OPERATIONS (LIVE CLOUD SYNC & CACHE)
    // ===================================================================

    /**
     * Fetches orders live from InsForge PostgreSQL database with local fallback & RBAC filtering.
     * @returns {Promise<Array>} Role-filtered orders
     */
    async fetchOrders() {
        const user = this.getCurrentUser();
        if (!user) return [];

        // Digitizers NEVER access orders table directly (enforcing strict data masking)
        if (user.role === 'digitizer') return [];

        let orders = [];
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/orders?order=created_at.desc`, {
                headers: this.getApiHeaders()
            });

            if (res.ok) {
                const cloudOrders = await res.json();
                if (Array.isArray(cloudOrders)) {
                    orders = cloudOrders;
                    localStorage.setItem('dezan_orders', JSON.stringify(orders));
                    localStorage.setItem('dezan_db_last_synced', new Date().toISOString());
                }
            } else {
                console.warn('InsForge orders fetch non-200 status:', res.status);
                orders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
            }
        } catch (err) {
            console.warn('InsForge orders network notice, using local cache:', err.message);
            orders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        }

        // Apply RBAC filtering
        if (user.role === 'admin') {
            return orders;
        }

        if (user.role === 'client') {
            return orders.filter(o => 
                (o.client_id && o.client_id === user.id) ||
                (o.client_email && user.email && o.client_email.toLowerCase() === user.email.toLowerCase())
            );
        }

        return [];
    }

    /**
     * Synchronous orders reader (reads local cache with RBAC filtering)
     */
    getOrders() {
        const user = this.getCurrentUser();
        if (!user || user.role === 'digitizer') return [];

        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        if (user.role === 'admin') return allOrders;

        return allOrders.filter(o => 
            (o.client_id && o.client_id === user.id) ||
            (o.client_email && user.email && o.client_email.toLowerCase() === user.email.toLowerCase())
        );
    }

    /**
     * Fetches sanitized tasks from InsForge PostgreSQL database for Digitizer portal.
     * STRICT DATA MASKING: Client name, email, company, and price are completely omitted.
     * @returns {Promise<Array>} Sanitized tasks
     */
    async fetchDigitizerTasks() {
        const user = this.getCurrentUser();
        if (!user || (user.role !== 'digitizer' && user.role !== 'admin')) return [];

        let tasks = [];
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order=assigned_at.desc`, {
                headers: this.getApiHeaders()
            });

            if (res.ok) {
                const cloudTasks = await res.json();
                if (Array.isArray(cloudTasks)) {
                    tasks = cloudTasks;
                    localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(tasks));
                }
            } else {
                console.warn('InsForge tasks fetch non-200 status:', res.status);
                tasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
            }
        } catch (err) {
            console.warn('InsForge tasks network notice, using cache:', err.message);
            tasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
        }

        // If tasks table was empty, fallback from local orders
        if (tasks.length === 0) {
            return this.getDigitizerTasks();
        }

        // Filter by assigned digitizer unless admin
        const assignedTasks = user.role === 'admin'
            ? tasks
            : tasks.filter(t => t.assigned_digitizer_id === user.id);

        // Normalize property names (support both snake_case and camelCase)
        return assignedTasks.map(t => ({
            id: t.id,
            taskId: t.task_number || ('TSK-' + (t.order_number ? t.order_number.replace('ORD-', '') : '')),
            taskNumber: t.task_number,
            orderNumber: t.order_number,
            serviceType: t.service_type || 'Digitizing',
            placement: t.placement || 'Left Chest',
            sizing: t.sizing || 'Standard',
            fileFormat: t.file_format || 'DST, EMB',
            instructions: t.instructions || '',
            rawArtworkFiles: Array.isArray(t.raw_artwork_files) ? t.raw_artwork_files : [],
            status: t.status || 'in_progress',
            deliverables: Array.isArray(t.deliverables) ? t.deliverables : [],
            assignedAt: t.assigned_at,
            completedAt: t.completed_at,
            assignedDigitizerId: t.assigned_digitizer_id
            // NO client_name
            // NO client_email
            // NO client_company
            // NO price
            // NO payment_status
        }));
    }

    /**
     * Synchronous fallback for digitizer tasks
     */
    getDigitizerTasks() {
        const user = this.getCurrentUser();
        if (!user || (user.role !== 'digitizer' && user.role !== 'admin')) return [];

        const cachedTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
        if (cachedTasks.length > 0) {
            const filtered = user.role === 'admin' 
                ? cachedTasks 
                : cachedTasks.filter(t => t.assigned_digitizer_id === user.id);
            return filtered.map(t => ({
                id: t.id,
                taskId: t.task_number || ('TSK-' + (t.order_number ? t.order_number.replace('ORD-', '') : '')),
                orderNumber: t.order_number,
                serviceType: t.service_type || 'Digitizing',
                placement: t.placement,
                sizing: t.sizing,
                fileFormat: t.file_format || 'DST, EMB',
                instructions: t.instructions || '',
                rawArtworkFiles: Array.isArray(t.raw_artwork_files) ? t.raw_artwork_files : [],
                status: t.status,
                deliverables: Array.isArray(t.deliverables) ? t.deliverables : [],
                assignedAt: t.assigned_at
            }));
        }

        // Fallback: derive from orders in localStorage
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const assignedOrders = user.role === 'admin'
            ? allOrders.filter(o => o.assigned_digitizer_id)
            : allOrders.filter(o => o.assigned_digitizer_id === user.id);

        return assignedOrders.map(order => ({
            taskId: 'TSK-' + order.order_number.replace('ORD-', ''),
            orderNumber: order.order_number,
            serviceType: order.service_type,
            placement: order.placement,
            sizing: order.sizing,
            fileFormat: order.file_format,
            instructions: order.instructions,
            rawArtworkFiles: order.raw_artwork_files || [],
            status: order.status,
            deliverables: order.deliverables || [],
            assignedAt: order.assigned_at
        }));
    }

    /**
     * Client Submits a New Order (persisted to PostgreSQL cloud database + local cache + broadcast)
     * @param {Object} orderData 
     * @returns {Promise<Object>} Created order
     */
    async createOrder(orderData) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('Must be logged in to create an order');

        const orderNumber = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
            id: this.generateUUID(),
            order_number: orderNumber,
            client_id: user.id,
            client_name: user.displayName || user.email,
            client_email: user.email,
            client_company: user.company || '',
            service_type: orderData.serviceType || 'Digitizing',
            plan_name: orderData.planName || 'Custom Order',
            project_name: orderData.projectName,
            placement: orderData.placement,
            sizing: orderData.sizing,
            file_format: orderData.fileFormat || 'DST, EMB',
            instructions: orderData.instructions || '',
            raw_artwork_files: orderData.rawArtworkFiles || [],
            price: parseFloat(orderData.price) || 20.00,
            currency: 'USD',
            payment_status: 'paid',
            payment_method: 'PayPal',
            assigned_digitizer_id: null,
            assigned_digitizer_name: null,
            assigned_at: null,
            status: 'pending_review',
            deliverables: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Optimistic local cache update
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        allOrders.unshift(newOrder);
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_created', {
            orderNumber: newOrder.order_number,
            clientName: newOrder.client_name,
            projectName: newOrder.project_name,
            price: newOrder.price
        });

        // Persist directly to InsForge PostgreSQL via REST
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/orders`, {
                method: 'POST',
                headers: this.getApiHeaders({ 'Prefer': 'return=representation' }),
                body: JSON.stringify([newOrder])
            });

            if (res.ok) {
                const inserted = await res.json();
                if (Array.isArray(inserted) && inserted.length > 0) {
                    console.log('✅ InsForge PostgreSQL order created live:', inserted[0].order_number);
                    localStorage.setItem('dezan_db_last_synced', new Date().toISOString());
                    return inserted[0];
                }
            } else {
                console.warn('InsForge database insert returned status:', res.status);
            }
        } catch (err) {
            console.warn('Offline order creation notice (saved to local cache):', err.message);
        }

        return newOrder;
    }

    /**
     * Admin Assigns a Ticket to a Digitizer (Updates orders and upserts sanitized digitizer_tasks in PostgreSQL + broadcast)
     * @param {string} orderNumber 
     * @param {string} digitizerId 
     * @param {string} digitizerName 
     * @returns {Promise<boolean>}
     */
    async assignDigitizer(orderNumber, digitizerId, digitizerName) {
        const assignedAt = new Date().toISOString();
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.order_number === orderNumber);

        if (order) {
            order.assigned_digitizer_id = digitizerId;
            order.assigned_digitizer_name = digitizerName;
            order.assigned_at = assignedAt;
            order.status = 'in_progress';
            localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
        }

        // Sanitized technical task (Strict Data Masking)
        const taskNumber = 'TSK-' + orderNumber.replace('ORD-', '');
        const sanitizedTask = {
            id: this.generateUUID(),
            task_number: taskNumber,
            order_number: orderNumber,
            order_id: order ? order.id : null,
            assigned_digitizer_id: digitizerId,
            service_type: (order && order.service_type) || 'Digitizing',
            placement: (order && order.placement) || 'Left Chest',
            sizing: (order && order.sizing) || 'Standard',
            file_format: (order && order.file_format) || 'DST, EMB',
            instructions: (order && order.instructions) || '',
            raw_artwork_files: (order && order.raw_artwork_files) || [],
            status: 'in_progress',
            deliverables: [],
            assigned_at: assignedAt
        };

        // Update local tasks cache
        const allTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
        const taskIdx = allTasks.findIndex(t => t.order_number === orderNumber || t.orderNumber === orderNumber);
        if (taskIdx >= 0) {
            allTasks[taskIdx].assigned_digitizer_id = digitizerId;
            allTasks[taskIdx].status = 'in_progress';
            allTasks[taskIdx].assigned_at = assignedAt;
        } else {
            allTasks.unshift(sanitizedTask);
        }
        localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_assigned', {
            orderNumber: orderNumber,
            taskNumber: taskNumber,
            digitizerId: digitizerId,
            digitizerName: digitizerName
        });

        // Sync to InsForge PostgreSQL
        try {
            // 1. Patch orders table
            await fetch(`${this.baseUrl}/api/database/records/orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    assigned_digitizer_id: digitizerId,
                    assigned_digitizer_name: digitizerName,
                    assigned_at: assignedAt,
                    status: 'in_progress',
                    updated_at: assignedAt
                })
            });

            // 2. Upsert digitizer_tasks table
            const taskCheckRes = await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order_number=eq.${encodeURIComponent(orderNumber)}`, {
                headers: this.getApiHeaders()
            });
            const existingTasks = taskCheckRes.ok ? await taskCheckRes.json() : [];

            if (Array.isArray(existingTasks) && existingTasks.length > 0) {
                await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order_number=eq.${encodeURIComponent(orderNumber)}`, {
                    method: 'PATCH',
                    headers: this.getApiHeaders(),
                    body: JSON.stringify({
                        assigned_digitizer_id: digitizerId,
                        status: 'in_progress',
                        assigned_at: assignedAt
                    })
                });
            } else {
                await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks`, {
                    method: 'POST',
                    headers: this.getApiHeaders(),
                    body: JSON.stringify([sanitizedTask])
                });
            }
            console.log(`✅ Order ${orderNumber} assigned to ${digitizerName} in InsForge PostgreSQL`);
        } catch (err) {
            console.warn('InsForge assign sync notice:', err.message);
        }

        return true;
    }

    /**
     * Digitizer Submits Completed .dst/.emb Deliverables (persisted to PostgreSQL cloud database + local cache + broadcast)
     * @param {string} orderNumber 
     * @param {Array} deliverables 
     * @returns {Promise<boolean>}
     */
    async completeDigitizerTask(orderNumber, deliverables) {
        const completedAt = new Date().toISOString();

        // Update local orders cache
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.order_number === orderNumber);
        if (order) {
            order.deliverables = deliverables;
            order.status = 'completed';
            order.updated_at = completedAt;
            localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
        }

        // Update local tasks cache
        const allTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
        const task = allTasks.find(t => t.order_number === orderNumber || t.orderNumber === orderNumber);
        if (task) {
            task.deliverables = deliverables;
            task.status = 'completed';
            task.completed_at = completedAt;
            localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));
        }

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_completed', {
            orderNumber: orderNumber,
            deliverables: deliverables
        });

        // Sync to InsForge PostgreSQL
        try {
            // 1. Patch digitizer_tasks
            await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order_number=eq.${encodeURIComponent(orderNumber)}`, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    status: 'completed',
                    deliverables: deliverables,
                    completed_at: completedAt
                })
            });

            // 2. Patch orders table
            await fetch(`${this.baseUrl}/api/database/records/orders?order_number=eq.${encodeURIComponent(orderNumber)}`, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    status: 'completed',
                    deliverables: deliverables,
                    updated_at: completedAt
                })
            });
            console.log(`✅ Deliverables for ${orderNumber} synced to InsForge PostgreSQL`);
        } catch (err) {
            console.warn('InsForge completion sync notice:', err.message);
        }

        return true;
    }

    /**
     * Get list of available digitizers (queries PostgreSQL profiles or fallback)
     */
    async fetchDigitizers() {
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/profiles?role=eq.digitizer`, {
                headers: this.getApiHeaders()
            });
            if (res.ok) {
                const profiles = await res.json();
                if (Array.isArray(profiles) && profiles.length > 0) {
                    const mapped = profiles.map(p => ({
                        id: p.id,
                        email: p.email,
                        displayName: p.display_name || p.displayName || p.email,
                        role: 'digitizer',
                        status: p.status || 'active'
                    }));
                    localStorage.setItem('dezan_digitizers', JSON.stringify(mapped));
                    return mapped;
                }
            }
        } catch (err) {
            console.warn('Profiles fetch notice:', err.message);
        }
        return this.getDigitizers();
    }

    getDigitizers() {
        return JSON.parse(localStorage.getItem('dezan_digitizers') || '[]');
    }

    getDatabaseSyncStatus() {
        const lastSynced = localStorage.getItem('dezan_db_last_synced');
        return {
            connected: true,
            lastSynced: lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'Active'
        };
    }
}

// Export singleton instance
window.insforgeClient = new InsForgeClient();
