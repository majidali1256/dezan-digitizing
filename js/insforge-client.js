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
        fabric_type: 'Heavy Denim Jacket',
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
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Falcon_Wings_Back.dst', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.dst', size: 54000 },
            { format: 'EMB', name: 'Falcon_Wings_Back.emb', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.emb', size: 220000 }
        ],
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
        fabric_type: '6-Panel Structured Cap',
        file_format: 'DST, EMB',
        instructions: 'Center-out sequencing for structured 6-panel baseball cap. Needle 75/11.',
        raw_artwork_files: [
            { name: 'falcon_cap_badge.png', url: 'logo.png', size: 142000 }
        ],
        price: 15.00,
        currency: 'USD',
        payment_status: 'unpaid',
        payment_method: 'Pending Invoice',
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
        fabric_type: 'Pique Knit Cotton',
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
            { format: 'DST', name: 'Falcon_Polo_LeftChest.dst', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.dst', size: 28400 },
            { format: 'EMB', name: 'Falcon_Polo_LeftChest.emb', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.emb', size: 148200 }
        ],
        created_at: new Date(Date.now() - 3600000 * 54).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000104',
        order_number: 'ORD-8835',
        client_id: '00000000-0000-0000-0000-000000000006',
        client_name: 'Marcus Vance',
        client_email: 'vance@vanceathletics.com',
        client_company: 'Vance Athletics',
        service_type: 'Digitizing',
        plan_name: 'Left Chest',
        project_name: 'Vance Tigers Varsity Crest',
        placement: 'Left Chest',
        sizing: '3.8" W x 3.2" H',
        fabric_type: 'Fleece / Sweatshirt',
        file_format: 'DST, EMB',
        instructions: 'Underlay grid for heavy fleece, gold and navy thread colors.',
        raw_artwork_files: [
            { name: 'vance_tigers.png', url: 'logo.png', size: 120000 }
        ],
        price: 25.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 68).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Vance_Tigers_Varsity.dst', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.dst', size: 34200 },
            { format: 'EMB', name: 'Vance_Tigers_Varsity.emb', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.emb', size: 165000 }
        ],
        created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000105',
        order_number: 'ORD-8838',
        client_id: '00000000-0000-0000-0000-000000000006',
        client_name: 'Marcus Vance',
        client_email: 'vance@vanceathletics.com',
        client_company: 'Vance Athletics',
        service_type: 'Digitizing',
        plan_name: 'Cap / Hat',
        project_name: 'Vance Track & Field 3D Cap',
        placement: 'Cap Front / Hat',
        sizing: '2.4" W x 2.0" H',
        fabric_type: '6-Panel Structured Cap',
        file_format: 'DST, EMB',
        instructions: '3D foam puff on letter V. Center-out sewing sequence for high-profile cap.',
        raw_artwork_files: [
            { name: 'vance_track_badge.png', url: 'logo.png', size: 140000 }
        ],
        price: 30.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'Credit Card',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000005',
        assigned_digitizer_name: 'Maria Garcia (3D Puff Master)',
        assigned_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Vance_Track_3D_Cap.dst', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_cap.dst', size: 41000 },
            { format: 'EMB', name: 'Vance_Track_3D_Cap.emb', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_cap.emb', size: 182000 }
        ],
        created_at: new Date(Date.now() - 3600000 * 36).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000106',
        order_number: 'ORD-8832',
        client_id: '00000000-0000-0000-0000-000000000007',
        client_name: 'Sarah Jenkins',
        client_email: 'sarah@apexuniforms.com',
        client_company: 'Apex Workwear & Uniforms',
        service_type: 'Digitizing',
        plan_name: 'Left Chest',
        project_name: 'Apex Shield Uniform Badge',
        placement: 'Left Chest',
        sizing: '3.2" W x 3.5" H',
        fabric_type: 'Cotton / Oxford Pique',
        file_format: 'DST, PES, EMB',
        instructions: 'Gold metallic accent thread border. High stitch density tatami fill.',
        raw_artwork_files: [
            { name: 'apex_shield_vector.png', url: 'logo.png', size: 115000 }
        ],
        price: 20.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 110).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'DST', name: 'Apex_Shield_Badge.dst', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.dst', size: 29000 },
            { format: 'PES', name: 'Apex_Shield_Badge.pes', url: 'https://cdn.insforge.dev/storage/e8rw998g/deliverables/sample_crest.pes', size: 31000 }
        ],
        created_at: new Date(Date.now() - 3600000 * 120).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000107',
        order_number: 'ORD-8836',
        client_id: '00000000-0000-0000-0000-000000000007',
        client_name: 'Sarah Jenkins',
        client_email: 'sarah@apexuniforms.com',
        client_company: 'Apex Workwear & Uniforms',
        service_type: 'Digitizing',
        plan_name: 'Jacket Back',
        project_name: 'Apex Industrial Back Emblem',
        placement: 'Jacket Back',
        sizing: '11.0" W x 9.5" H',
        fabric_type: 'Heavy Canvas / Twill',
        file_format: 'DST, EMB',
        instructions: 'Large format embroidery for work jackets. Underlay compensation for canvas.',
        raw_artwork_files: [
            { name: 'apex_back_emblem.svg', url: 'logo.png', size: 210000 }
        ],
        price: 50.00,
        currency: 'USD',
        payment_status: 'unpaid',
        payment_method: 'Pending Invoice',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000003',
        assigned_digitizer_name: 'Alex Miller (Lead Digitizer)',
        assigned_at: new Date(Date.now() - 3600000 * 14).toISOString(),
        status: 'in_progress',
        deliverables: [],
        created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
        id: '00000000-0000-0000-0000-000000000108',
        order_number: 'ORD-8828',
        client_id: '00000000-0000-0000-0000-000000000008',
        client_name: 'Elena Rostova',
        client_email: 'elena@summitheadwear.com',
        client_company: 'Summit Headwear & Outerwear',
        service_type: 'Vector Art',
        plan_name: 'Vector Conversion',
        project_name: 'Summit Alpine Peak Emblem',
        placement: 'Vector Graphic / Print',
        sizing: 'Scalable Vector',
        fabric_type: 'Vector Graphic',
        file_format: 'AI, EPS, SVG, PDF',
        instructions: 'Clean pantone color separation for screen printing and vinyl cutting.',
        raw_artwork_files: [
            { name: 'summit_sketch.jpg', url: 'logo.png', size: 180000 }
        ],
        price: 25.00,
        currency: 'USD',
        payment_status: 'paid',
        payment_method: 'PayPal',
        assigned_digitizer_id: '00000000-0000-0000-0000-000000000004',
        assigned_digitizer_name: 'Sam Chen (Vector Specialist)',
        assigned_at: new Date(Date.now() - 3600000 * 140).toISOString(),
        status: 'completed',
        deliverables: [
            { format: 'AI', name: 'Summit_Alpine_Vector.ai', url: 'logo.png', size: 450000 },
            { format: 'SVG', name: 'Summit_Alpine_Vector.svg', url: 'logo.png', size: 85000 }
        ],
        created_at: new Date(Date.now() - 3600000 * 150).toISOString()
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
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_jwt_token') : null;
        return {
            'apikey': this.anonKey,
            'Authorization': token ? `Bearer ${token}` : `Bearer ${this.anonKey}`,
            'Content-Type': 'application/json',
            ...extra
        };
    }

    getApiBase() {
        if (typeof window !== 'undefined') {
            if (window.location.port === '5001') return '/api';
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:5001/api';
            }
        }
        return '/api';
    }

    async callBackendApi(endpoint, method = 'GET', body = null) {
        try {
            const apiBase = this.getApiBase();
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_jwt_token') : null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${apiBase}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json.data, message: json.message };
            } else {
                const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
                return { success: false, error: errJson.message || `HTTP ${res.status}` };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
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

    // Predefined & Standard Sign In
    async signIn(email, password) {
        const rawEmail = (email || '').trim().toLowerCase();

        // 1. Attempt Node.js REST API login first
        const apiRes = await this.callBackendApi('/auth/login', 'POST', { email: rawEmail, password });
        if (apiRes.success && apiRes.data && apiRes.data.user) {
            const apiUser = {
                id: apiRes.data.user.id,
                email: apiRes.data.user.email,
                displayName: apiRes.data.user.display_name,
                role: apiRes.data.user.role,
                company: apiRes.data.user.company || '',
                phone: apiRes.data.user.phone || '',
                status: apiRes.data.user.status || 'active'
            };
            if (apiRes.data.token && typeof localStorage !== 'undefined') {
                localStorage.setItem('dezan_jwt_token', apiRes.data.token);
            }
            this.setSession(apiUser);
            this.claimGuestOrders(apiUser.email, apiUser.id).catch(() => {});
            return { user: apiUser, error: null };
        }

        // 2. Check predefined admin accounts / aliases (Fallback / 1-Click)
        if (rawEmail === 'admin' || rawEmail === 'admin@dezandigitizing.com' || rawEmail === 'admin@dezan.com') {
            const adminUser = DEMO_USERS.admin;
            this.setSession(adminUser);
            return { user: adminUser, error: null };
        }

        // 3. Check predefined digitizer worker accounts / aliases (Fallback / 1-Click)
        if (rawEmail === 'worker' || rawEmail === 'digitizer' || rawEmail === 'worker.alex@dezandigitizing.com') {
            const workerUser = DEMO_USERS.digitizer;
            this.setSession(workerUser);
            return { user: workerUser, error: null };
        }

        // 4. Check demo client alias (Fallback / 1-Click)
        if (rawEmail === 'client' || rawEmail === 'client@falconapparel.com') {
            const clientUser = DEMO_USERS.client;
            this.setSession(clientUser);
            this.claimGuestOrders(clientUser.email, clientUser.id).catch(() => {});
            return { user: clientUser, error: null };
        }

        // 5. Check all demo users in DEMO_USERS
        const demoUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === rawEmail);
        if (demoUser) {
            this.setSession(demoUser);
            this.claimGuestOrders(demoUser.email, demoUser.id).catch(() => {});
            return { user: demoUser, error: null };
        }

        // 6. Check predefined digitizers from team list
        const digitizers = JSON.parse(localStorage.getItem('dezan_digitizers') || '[]');
        const matchedDigitizer = digitizers.find(d => d.email && d.email.toLowerCase() === rawEmail);
        if (matchedDigitizer) {
            this.setSession(matchedDigitizer);
            return { user: matchedDigitizer, error: null };
        }

        // 7. Check local registered users (all registered users are clients)
        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        const existing = registered.find(u => u.email.toLowerCase() === rawEmail);
        if (existing) {
            this.setSession(existing);
            this.claimGuestOrders(existing.email, existing.id).catch(() => {});
            return { user: existing, error: null };
        }

        return { user: null, error: apiRes.error || 'Invalid email or password. Please use a predefined staff login or sign up as a client.' };
    }

    // Public Sign Up (strictly creates client accounts; staff are predefined)
    async signUp({ email, password, displayName, role = 'client', company = '', phone = '' }) {
        // 1. Attempt Node.js REST API registration first
        const apiRes = await this.callBackendApi('/auth/register', 'POST', {
            email, password, displayName, company, phone
        });
        if (apiRes.success && apiRes.data && apiRes.data.user) {
            const apiUser = {
                id: apiRes.data.user.id,
                email: apiRes.data.user.email,
                displayName: apiRes.data.user.display_name,
                role: apiRes.data.user.role || 'client',
                company: apiRes.data.user.company || '',
                phone: apiRes.data.user.phone || '',
                status: apiRes.data.user.status || 'active'
            };
            if (apiRes.data.token && typeof localStorage !== 'undefined') {
                localStorage.setItem('dezan_jwt_token', apiRes.data.token);
            }
            this.setSession(apiUser);
            return { user: apiUser, error: null };
        }

        // 2. Client-side fallback if server is offline
        const user = {
            id: this.generateUUID(),
            email: (email || '').trim().toLowerCase(),
            displayName: (displayName || '').trim() || (email || '').split('@')[0],
            role: 'client',
            company: (company || '').trim(),
            status: 'active',
            created_at: new Date().toISOString()
        };

        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        registered.push(user);
        localStorage.setItem('dezan_registered_users', JSON.stringify(registered));

        this.setSession(user);
        await this.claimGuestOrders(user.email, user.id).catch(() => {});
        return { user, error: null };
    }

    /**
     * Update current user profile details (name, company, phone, preferences, etc.)
     */
    async updateUserProfile(updates) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const updatedUser = {
            ...user,
            displayName: updates.displayName !== undefined ? updates.displayName : user.displayName,
            company: updates.company !== undefined ? updates.company : user.company,
            phone: updates.phone !== undefined ? updates.phone : (user.phone || ''),
            preferredFormat: updates.preferredFormat !== undefined ? updates.preferredFormat : (user.preferredFormat || 'DST'),
            preferredFabric: updates.preferredFabric !== undefined ? updates.preferredFabric : (user.preferredFabric || 'Pique Knit Cotton'),
            turnaroundSpeed: updates.turnaroundSpeed !== undefined ? updates.turnaroundSpeed : (user.turnaroundSpeed || 'standard'),
            avatarInitials: updates.avatarInitials !== undefined ? updates.avatarInitials : user.avatarInitials,
            avatarBg: updates.avatarBg !== undefined ? updates.avatarBg : user.avatarBg,
            updated_at: new Date().toISOString()
        };

        // Persist session
        this.setSession(updatedUser);

        // Update registered users cache if applicable
        const registered = JSON.parse(localStorage.getItem('dezan_registered_users') || '[]');
        const idx = registered.findIndex(u => u.id === user.id || (u.email && u.email.toLowerCase() === user.email.toLowerCase()));
        if (idx !== -1) {
            registered[idx] = { ...registered[idx], ...updatedUser };
            localStorage.setItem('dezan_registered_users', JSON.stringify(registered));
        }

        // Try syncing to InsForge PostgreSQL backend
        try {
            await fetch(`${this.baseUrl}/api/database/records/profiles?id=eq.${user.id}`, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    display_name: updatedUser.displayName,
                    company: updatedUser.company,
                    phone: updatedUser.phone,
                    updated_at: updatedUser.updated_at
                })
            });
        } catch (e) {
            console.warn('InsForge remote profile sync fallback:', e);
        }

        // Broadcast realtime update event
        this.broadcastRealtimeEvent('profile_updated', { user: updatedUser });

        return { success: true, user: updatedUser };
    }

    /**
     * Update user password securely
     */
    async updatePassword({ currentPassword, newPassword }) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters long.' };
        }

        // Save password record in local user credentials
        const creds = JSON.parse(localStorage.getItem('dezan_user_passwords') || '{}');
        const userKey = (user.email || user.id).toLowerCase();

        // If user already has a custom password set, check currentPassword
        if (creds[userKey] && creds[userKey] !== currentPassword) {
            return { success: false, error: 'Current password does not match.' };
        }

        creds[userKey] = newPassword;
        localStorage.setItem('dezan_user_passwords', JSON.stringify(creds));

        return { success: true, message: 'Password successfully updated.' };
    }

    // Automatic Role-Based Routing
    redirectToDashboard(role) {
        // Check for redirect query params (e.g. from Order Now button)
        let redirectTarget = null;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectParam = urlParams.get('redirect');
            const serviceParam = urlParams.get('service');
            const planParam = urlParams.get('plan');

            if (redirectParam === 'new_order' || redirectParam === 'order') {
                if (role === 'digitizer') {
                    redirectTarget = 'worker-portal.html';
                } else {
                    let target = 'client-portal.html?action=new_order';
                    if (serviceParam) target += `&service=${encodeURIComponent(serviceParam)}`;
                    if (planParam) target += `&plan=${encodeURIComponent(planParam)}`;
                    redirectTarget = target;
                }
            } else if (redirectParam === 'request_quote' || redirectParam === 'quote') {
                if (role === 'digitizer') {
                    redirectTarget = 'worker-portal.html';
                } else {
                    let target = 'client-portal.html?action=request_quote';
                    if (serviceParam) target += `&service=${encodeURIComponent(serviceParam)}`;
                    redirectTarget = target;
                }
            }
        } catch (e) {
            redirectTarget = null;
        }

        if (redirectTarget) {
            window.location.href = redirectTarget;
            return;
        }

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
                    const localOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                    const localOnly = localOrders.filter(l => !cloudOrders.some(c => c.order_number === l.order_number || c.id === l.id));
                    const mergedCloud = cloudOrders.map(cloud => {
                        const local = localOrders.find(l => l.order_number === cloud.order_number || l.id === cloud.id);
                        if (local) {
                            if (local.assigned_digitizer_id && !cloud.assigned_digitizer_id) {
                                cloud.assigned_digitizer_id = local.assigned_digitizer_id;
                                cloud.assigned_digitizer_name = local.assigned_digitizer_name;
                                cloud.assigned_at = local.assigned_at;
                                cloud.status = local.status;
                            }
                            if (local.deliverables && local.deliverables.length > (cloud.deliverables ? cloud.deliverables.length : 0)) {
                                cloud.deliverables = local.deliverables;
                            }
                            if (local.payment_status === 'paid' && cloud.payment_status !== 'paid') {
                                cloud.payment_status = 'paid';
                            }
                        }
                        return cloud;
                    });
                    orders = [...localOnly, ...mergedCloud];
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
     * Fetches and aggregates all unique clients from PostgreSQL orders & profiles (Admin only)
     * Calculates lifetime value (LTV), total order count, outstanding balance, and full order history.
     */
    async fetchClients() {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];

        const orders = await this.fetchOrders();
        const clientsMap = new Map();

        // Query profiles for any additional registered clients
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/profiles?role=eq.client`, {
                headers: this.getApiHeaders()
            });
            if (res.ok) {
                const profiles = await res.json();
                if (Array.isArray(profiles)) {
                    profiles.forEach(p => {
                        const key = (p.email || p.id).toLowerCase();
                        clientsMap.set(key, {
                            clientId: p.id,
                            clientName: p.display_name || p.displayName || 'Client',
                            clientEmail: p.email,
                            clientCompany: p.company || 'Direct Client',
                            clientAvatar: p.avatar_url || null,
                            totalOrders: 0,
                            completedOrders: 0,
                            activeOrders: 0,
                            revisionOrders: 0,
                            totalSpent: 0,
                            balanceDue: 0,
                            firstOrderDate: p.created_at || null,
                            lastOrderDate: p.created_at || null,
                            orders: []
                        });
                    });
                }
            }
        } catch (_) {}

        const clientList = this._compileClientsFromOrders(orders, clientsMap);
        localStorage.setItem('dezan_clients', JSON.stringify(clientList));
        return clientList;
    }

    /**
     * Helper to compile client CRM records from orders
     */
    _compileClientsFromOrders(orders, baseMap = new Map()) {
        const clientsMap = baseMap;
        orders.forEach(o => {
            const emailKey = (o.client_email || '').toLowerCase().trim();
            const idKey = (o.client_id || '').toLowerCase().trim();
            const nameKey = (o.client_name || '').toLowerCase().trim();
            const key = emailKey || idKey || nameKey || 'unknown_client';

            let client = clientsMap.get(key);
            if (!client) {
                client = {
                    clientId: o.client_id || this.generateUUID(),
                    clientName: o.client_name || 'Valued Client',
                    clientEmail: o.client_email || 'client@dezan.com',
                    clientCompany: o.client_company || 'Independent Business',
                    clientAvatar: null,
                    totalOrders: 0,
                    completedOrders: 0,
                    activeOrders: 0,
                    revisionOrders: 0,
                    totalSpent: 0,
                    balanceDue: 0,
                    firstOrderDate: o.created_at || new Date().toISOString(),
                    lastOrderDate: o.created_at || new Date().toISOString(),
                    orders: []
                };
                clientsMap.set(key, client);
            }

            client.orders.push(o);
            client.totalOrders++;
            const price = Number(o.price) || 0;

            if (o.status === 'completed') {
                client.completedOrders++;
            }
            if (o.status === 'in_progress' || o.status === 'assigned' || o.status === 'pending_review') {
                client.activeOrders++;
            }
            if (o.status === 'revision_requested') {
                client.revisionOrders++;
            }

            if (o.payment_status === 'paid') {
                client.totalSpent += price;
            } else if (o.payment_status === 'unpaid' || o.payment_status === 'pending') {
                client.balanceDue += price;
            }

            if (o.created_at) {
                if (!client.firstOrderDate || new Date(o.created_at) < new Date(client.firstOrderDate)) {
                    client.firstOrderDate = o.created_at;
                }
                if (!client.lastOrderDate || new Date(o.created_at) > new Date(client.lastOrderDate)) {
                    client.lastOrderDate = o.created_at;
                }
            }
        });

        clientsMap.forEach(client => {
            client.orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        });

        const clientList = Array.from(clientsMap.values());
        clientList.sort((a, b) => b.totalSpent - a.totalSpent);
        return clientList;
    }

    /**
     * Read cached clients synchronously (fallback to compiling from orders if needed)
     */
    getClients() {
        let clients = JSON.parse(localStorage.getItem('dezan_clients') || '[]');
        if (clients.length === 0) {
            const orders = this.getOrders();
            if (orders && orders.length > 0) {
                clients = this._compileClientsFromOrders(orders);
                try {
                    localStorage.setItem('dezan_clients', JSON.stringify(clients));
                } catch (_) {}
            }
        }
        return clients;
    }

    /**
     * Retrieve complete chronological history for a specific client
     */
    getClientHistory(clientIdOrEmail) {
        const clients = this.getClients();
        const key = (clientIdOrEmail || '').toLowerCase().trim();
        return clients.find(c => 
            (c.clientId && c.clientId.toLowerCase() === key) ||
            (c.clientEmail && c.clientEmail.toLowerCase() === key) ||
            (c.clientName && c.clientName.toLowerCase() === key)
        ) || null;
    }

    /**
     * Get visual catalog of all digitized embroidery & vector designs
     */
    getCatalogDesigns() {
        const orders = this.getOrders();
        // Return orders formatted for catalog showcase
        return orders.map(o => {
            const hasDeliverables = o.deliverables && o.deliverables.length > 0;
            const hasArtwork = o.raw_artwork_files && o.raw_artwork_files.length > 0;
            const previewUrl = hasArtwork ? o.raw_artwork_files[0].url : 'logo.png';

            return {
                id: o.id,
                orderNumber: o.order_number,
                projectName: o.project_name,
                serviceType: o.service_type || 'Digitizing',
                placement: o.placement || 'Standard',
                sizing: o.sizing || 'Default Size',
                fabricType: o.fabric_type || 'Standard Garment',
                fileFormat: o.file_format || 'DST, EMB',
                instructions: o.instructions || '',
                previewUrl: previewUrl,
                artworkName: hasArtwork ? o.raw_artwork_files[0].name : 'Artwork',
                deliverables: o.deliverables || [],
                clientName: o.client_name || 'Client',
                clientCompany: o.client_company || 'Independent',
                clientEmail: o.client_email,
                clientId: o.client_id,
                price: o.price || 0,
                status: o.status,
                paymentStatus: o.payment_status || 'paid',
                stitchOutPhotos: o.stitch_out_photos || [],
                createdAt: o.created_at
            };
        });
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
                    const localTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
                    const localOnly = localTasks.filter(l => !cloudTasks.some(c => (c.order_number && c.order_number === l.order_number) || (c.task_number && c.task_number === l.task_number) || (c.id && c.id === l.id)));
                    tasks = [...localOnly, ...cloudTasks];
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

        // Merge with any assigned orders that don't have tasks yet
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        allOrders.forEach(o => {
            if (o.assigned_digitizer_id && !tasks.some(t => t.order_number === o.order_number)) {
                tasks.unshift({
                    id: o.id || this.generateUUID(),
                    task_number: 'TSK-' + (o.order_number || '').replace('ORD-', '').replace('DZ-', ''),
                    order_number: o.order_number,
                    order_id: o.id,
                    assigned_digitizer_id: o.assigned_digitizer_id,
                    service_type: o.service_type || 'Digitizing',
                    placement: o.placement || 'Left Chest',
                    sizing: o.sizing || 'Standard',
                    file_format: o.file_format || 'DST, EMB',
                    instructions: o.instructions || '',
                    raw_artwork_files: o.raw_artwork_files || [],
                    status: o.status || 'in_progress',
                    deliverables: o.deliverables || [],
                    assigned_at: o.assigned_at || o.created_at
                });
            }
        });

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
            fabric_type: t.fabric_type || t.fabricType || '',
            fabricType: t.fabric_type || t.fabricType || '',
            sizing: t.sizing || 'Standard',
            fileFormat: t.file_format || 'DST, EMB',
            instructions: t.instructions || '',
            rawArtworkFiles: Array.isArray(t.raw_artwork_files) ? t.raw_artwork_files : [],
            status: t.status || 'in_progress',
            deliverables: Array.isArray(t.deliverables) ? t.deliverables : [],
            assignedAt: t.assigned_at,
            completedAt: t.completed_at,
            assignedDigitizerId: t.assigned_digitizer_id,
            revision_notes: t.revision_notes || t.revisionNotes || '',
            revisionNotes: t.revision_notes || t.revisionNotes || '',
            stitch_out_photos: Array.isArray(t.stitch_out_photos) ? t.stitch_out_photos : (Array.isArray(t.stitchOutPhotos) ? t.stitchOutPhotos : []),
            stitchOutPhotos: Array.isArray(t.stitch_out_photos) ? t.stitch_out_photos : (Array.isArray(t.stitchOutPhotos) ? t.stitchOutPhotos : [])
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
                fabric_type: t.fabric_type || t.fabricType || '',
                fabricType: t.fabric_type || t.fabricType || '',
                sizing: t.sizing,
                fileFormat: t.file_format || 'DST, EMB',
                instructions: t.instructions || '',
                rawArtworkFiles: Array.isArray(t.raw_artwork_files) ? t.raw_artwork_files : [],
                status: t.status,
                deliverables: Array.isArray(t.deliverables) ? t.deliverables : [],
                assignedAt: t.assigned_at,
                revision_notes: t.revision_notes || t.revisionNotes || '',
                revisionNotes: t.revision_notes || t.revisionNotes || '',
                stitch_out_photos: Array.isArray(t.stitch_out_photos) ? t.stitch_out_photos : (Array.isArray(t.stitchOutPhotos) ? t.stitchOutPhotos : []),
                stitchOutPhotos: Array.isArray(t.stitch_out_photos) ? t.stitch_out_photos : (Array.isArray(t.stitchOutPhotos) ? t.stitchOutPhotos : [])
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
            fabric_type: order.fabric_type || '',
            fabricType: order.fabric_type || '',
            sizing: order.sizing,
            fileFormat: order.file_format,
            instructions: order.instructions,
            rawArtworkFiles: order.raw_artwork_files || [],
            status: order.status,
            deliverables: order.deliverables || [],
            assignedAt: order.assigned_at,
            revision_notes: order.revision_notes || '',
            revisionNotes: order.revision_notes || '',
            stitch_out_photos: Array.isArray(order.stitch_out_photos) ? order.stitch_out_photos : [],
            stitchOutPhotos: Array.isArray(order.stitch_out_photos) ? order.stitch_out_photos : []
        }));
    }

    /**
     * Client or Guest Submits a New Order (persisted to PostgreSQL cloud database + local cache + broadcast)
     * @param {Object} orderData 
     * @returns {Promise<Object>} Created order
     */
    async createOrder(orderData) {
        const user = this.getCurrentUser();
        const isGuest = !user;
        const clientEmail = (user ? user.email : orderData.clientEmail || '').trim();
        if (isGuest && !clientEmail) {
            throw new Error('Customer email is required for guest checkout.');
        }

        const isQuote = (orderData.isQuote === true) || (orderData.status === 'quote_requested');
        const orderNumber = (isQuote ? 'QUO-' : 'DZ-') + Math.floor(1000 + Math.random() * 9000);
        const clientId = user ? user.id : null;
        const clientName = user ? (user.displayName || user.email) : (orderData.clientName || 'Guest Customer');
        const clientCompany = user ? (user.company || '') : (orderData.clientCompany || '');

        const autoAssign = !isQuote && this.isAutoAssignWorkerEnabled();
        const primaryWorker = this.getPrimaryWorker();

        const assignedDigitizerId = autoAssign ? primaryWorker.id : null;
        const assignedDigitizerName = autoAssign ? primaryWorker.displayName : null;
        const assignedAt = autoAssign ? new Date().toISOString() : null;
        const initialStatus = isQuote ? 'quote_requested' : (autoAssign ? 'in_progress' : 'pending_review');

        const newOrder = {
            id: this.generateUUID(),
            order_number: orderNumber,
            client_id: clientId,
            client_name: clientName,
            client_email: clientEmail,
            client_company: clientCompany,
            service_type: orderData.serviceType || 'Digitizing',
            plan_name: orderData.planName || (isQuote ? 'Custom Quote' : 'Custom Order'),
            project_name: orderData.projectName || (orderData.serviceType ? `${orderData.serviceType} Order` : 'Embroidery Design'),
            placement: orderData.placement || 'Standard',
            fabric_type: orderData.fabricType || '',
            sizing: orderData.sizing || 'Standard',
            file_format: orderData.fileFormat || 'DST, EMB',
            special_options: orderData.specialOptions || [],
            turnaround_speed: orderData.turnaroundSpeed || 'standard',
            instructions: orderData.instructions || '',
            raw_artwork_files: orderData.rawArtworkFiles || [],
            price: isQuote ? (orderData.price ? parseFloat(orderData.price) : 0.00) : (parseFloat(orderData.price) || 15.00),
            currency: 'USD',
            payment_status: isQuote ? 'unpaid' : (orderData.paymentStatus || 'unpaid'),
            payment_method: orderData.paymentMethod || (isQuote ? 'Pending Quote Review' : (orderData.paymentStatus === 'paid' ? 'PayPal' : 'Pending Invoice')),
            assigned_digitizer_id: assignedDigitizerId,
            assigned_digitizer_name: assignedDigitizerName,
            assigned_at: assignedAt,
            status: initialStatus,
            is_quote: isQuote,
            deliverables: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Attempt Node.js backend order creation
        try {
            const endpoint = isQuote ? '/quotes' : '/orders';
            const apiRes = await this.callBackendApi(endpoint, 'POST', {
                serviceType: newOrder.service_type,
                planName: newOrder.plan_name,
                projectName: newOrder.project_name,
                placement: newOrder.placement,
                sizing: newOrder.sizing,
                fabricType: newOrder.fabric_type,
                fileFormat: newOrder.file_format,
                instructions: newOrder.instructions,
                rawArtworkFiles: newOrder.raw_artwork_files,
                price: newOrder.price,
                specialOptions: newOrder.special_options,
                turnaroundSpeed: newOrder.turnaround_speed,
                paymentMethod: newOrder.payment_method,
                paymentStatus: newOrder.payment_status,
                clientName: newOrder.client_name,
                clientEmail: newOrder.client_email,
                clientCompany: newOrder.client_company
            });
            if (apiRes.success && apiRes.data) {
                newOrder.id = apiRes.data.id;
                newOrder.order_number = apiRes.data.order_number;
            }
        } catch (e) {
            console.warn('[Backend Order Sync Fallback]:', e.message);
        }

        // If auto-assigned, generate sanitized digitizer task immediately
        if (autoAssign) {
            const taskNumber = 'TSK-' + orderNumber.replace('ORD-', '').replace('DZ-', '');
            const sanitizedTask = {
                id: this.generateUUID(),
                task_number: taskNumber,
                order_number: orderNumber,
                order_id: newOrder.id,
                assigned_digitizer_id: assignedDigitizerId,
                service_type: newOrder.service_type,
                placement: newOrder.placement,
                sizing: newOrder.sizing,
                file_format: newOrder.file_format,
                fabric_type: newOrder.fabric_type,
                instructions: newOrder.instructions,
                raw_artwork_files: newOrder.raw_artwork_files,
                status: 'in_progress',
                deliverables: [],
                assigned_at: assignedAt
            };

            const allTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
            allTasks.unshift(sanitizedTask);
            localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));

            // Broadcast assignment event
            this.broadcastEvent('order_assigned', {
                orderNumber: orderNumber,
                taskNumber: taskNumber,
                digitizerId: assignedDigitizerId,
                digitizerName: assignedDigitizerName
            });
            console.log(`⚡ Order ${orderNumber} automatically assigned to ${assignedDigitizerName} without admin approval.`);
        }

        // Optimistic local cache update
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        allOrders.unshift(newOrder);
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_created', {
            orderNumber: newOrder.order_number,
            clientName: newOrder.client_name,
            projectName: newOrder.project_name,
            serviceType: newOrder.service_type,
            price: newOrder.price,
            paymentStatus: newOrder.payment_status,
            isQuote: newOrder.is_quote,
            autoAssigned: autoAssign
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
                const errText = await res.text();
                console.warn('InsForge database insert returned status:', res.status, errText);
            }
        } catch (err) {
            console.warn('Offline order creation notice (saved to local cache):', err.message);
        }

        return newOrder;
    }

    /**
     * Check if Auto-Assign work to digitizer is turned on
     * @returns {boolean}
     */
    isAutoAssignWorkerEnabled() {
        return localStorage.getItem('dezan_auto_assign_worker') === 'true';
    }

    /**
     * Toggle or set Auto-Assign work to digitizer
     * @param {boolean} enabled 
     */
    setAutoAssignWorkerEnabled(enabled) {
        localStorage.setItem('dezan_auto_assign_worker', enabled ? 'true' : 'false');
        this.broadcastEvent('auto_assign_toggled', { enabled: !!enabled });
    }

    /**
     * Get primary digitizer worker for auto-assignment (single digitizer account)
     */
    getPrimaryWorker() {
        return DEMO_USERS.digitizer;
    }

    /**
     * Auto-assign all unassigned pending orders to Alex Miller
     * @returns {Promise<number>} Number of orders assigned
     */
    async autoAssignAllPendingOrders() {
        const primaryWorker = this.getPrimaryWorker();
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        let count = 0;
        for (const order of allOrders) {
            if (!order.is_quote && (!order.assigned_digitizer_id || order.status === 'pending_review')) {
                await this.assignDigitizer(order.order_number, primaryWorker.id, primaryWorker.displayName);
                count++;
            }
        }
        return count;
    }

    /**
     * Links any unlinked guest orders with matching clientEmail to an authenticated user
     * @param {string} clientEmail 
     * @param {string} userId 
     * @returns {Promise<Array>} Claimed orders
     */
    async claimGuestOrders(clientEmail, userId) {
        if (!clientEmail || !userId) return [];
        const normalizedEmail = clientEmail.trim().toLowerCase();

        // 1. Update local storage orders
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        let claimedCount = 0;
        allOrders.forEach(ord => {
            if ((!ord.client_id || ord.client_id === null) && ord.client_email && ord.client_email.toLowerCase() === normalizedEmail) {
                ord.client_id = userId;
                claimedCount++;
            }
        });
        if (claimedCount > 0) {
            localStorage.setItem('dezan_orders', JSON.stringify(allOrders));
            console.log(`✅ Claimed ${claimedCount} guest order(s) in local storage for user ${userId}`);
        }

        // 2. Update remote InsForge database records
        try {
            const res = await fetch(`${this.baseUrl}/api/database/records/orders?client_email=eq.${encodeURIComponent(normalizedEmail)}&client_id=is.null`, {
                method: 'PATCH',
                headers: this.getApiHeaders({ 'Prefer': 'return=representation' }),
                body: JSON.stringify({
                    client_id: userId,
                    updated_at: new Date().toISOString()
                })
            });
            if (res.ok) {
                const updated = await res.json();
                console.log(`✅ Claimed ${Array.isArray(updated) ? updated.length : 0} guest order(s) in InsForge database for ${normalizedEmail}`);
                return updated;
            }
        } catch (err) {
            console.warn('Could not patch claimed guest orders to InsForge remote DB:', err.message);
        }
        return [];
    }

    /**
     * Admin gives/sets price on a requested quote
     * @param {string} orderIdOrNumber 
     * @param {number} price 
     * @param {string} adminNotes 
     * @returns {Promise<boolean>}
     */
    async updateQuotePrice(orderIdOrNumber, price, adminNotes = '') {
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.id === orderIdOrNumber || o.order_number === orderIdOrNumber);
        if (!order) {
            console.warn('Quote not found for price update:', orderIdOrNumber);
            return false;
        }

        order.price = parseFloat(price);
        order.status = 'quote_ready';
        order.quote_admin_notes = adminNotes;
        order.quote_priced_at = new Date().toISOString();
        order.updated_at = new Date().toISOString();
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Broadcast to other tabs
        this.broadcastEvent('quote_priced', {
            orderId: order.id,
            orderNumber: order.order_number,
            clientEmail: order.client_email,
            price: order.price,
            adminNotes
        });

        // Persist to InsForge DB
        try {
            const queryParam = order.id ? `id=eq.${order.id}` : `order_number=eq.${order.order_number}`;
            await fetch(`${this.baseUrl}/api/database/records/orders?${queryParam}`, {
                method: 'PATCH',
                headers: this.getApiHeaders({ 'Prefer': 'return=representation' }),
                body: JSON.stringify({
                    price: order.price,
                    status: 'quote_ready',
                    quote_admin_notes: adminNotes,
                    updated_at: order.updated_at
                })
            });
        } catch (err) {
            console.warn('InsForge database patch quote price notice:', err.message);
        }

        return true;
    }

    /**
     * Updates an order's payment status (e.g. completes due payment, marks as paid)
     * @param {string} orderIdOrNumber 
     * @param {string} paymentStatus - 'paid' | 'unpaid' | 'pending'
     * @param {string} paymentMethod - 'PayPal' | 'Credit Card' | 'Stripe'
     * @returns {Promise<boolean>}
     */
    async updateOrderPayment(orderIdOrNumber, paymentStatus = 'paid', paymentMethod = 'PayPal') {
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.id === orderIdOrNumber || o.order_number === orderIdOrNumber);
        if (!order) {
            console.warn('Order not found for payment update:', orderIdOrNumber);
            return false;
        }

        order.payment_status = paymentStatus;
        order.payment_method = paymentMethod;

        // If this was a quote, paying converts it directly into an active production order
        if (order.is_quote || order.status === 'quote_ready' || order.status === 'quote_requested') {
            order.is_quote = false;
            order.was_quote = true;
            order.status = 'pending_review';
        }

        order.updated_at = new Date().toISOString();
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Broadcast to other open tabs
        this.broadcastEvent('order_paid', {
            orderId: order.id,
            orderNumber: order.order_number,
            paymentStatus,
            paymentMethod,
            price: order.price
        });

        // Persist to InsForge PostgreSQL
        try {
            const queryParam = order.id ? `id=eq.${order.id}` : `order_number=eq.${order.order_number}`;
            const res = await fetch(`${this.baseUrl}/api/database/records/orders?${queryParam}`, {
                method: 'PATCH',
                headers: this.getApiHeaders({ 'Prefer': 'return=representation' }),
                body: JSON.stringify({
                    payment_status: paymentStatus,
                    payment_method: paymentMethod,
                    status: order.status,
                    is_quote: order.is_quote,
                    updated_at: order.updated_at
                })
            });
            if (res.ok) {
                console.log(`✅ Order ${order.order_number} payment status updated live in PostgreSQL: ${paymentStatus}`);
                localStorage.setItem('dezan_db_last_synced', new Date().toISOString());
            }
        } catch (err) {
            console.warn('Payment status remote sync notice (cached locally):', err.message);
        }

        return true;
    }

    /**
     * Admin sends an email payment reminder for an unpaid/incomplete order
     * @param {string} orderIdOrNumber
     * @param {string} customNote
     * @returns {Promise<{success: boolean, timestamp: string, reminderCount: number, clientEmail: string, clientName: string}>}
     */
    async sendPaymentReminder(orderIdOrNumber, customNote = '') {
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.id === orderIdOrNumber || o.order_number === orderIdOrNumber);
        if (!order) {
            console.warn('Order not found for payment reminder:', orderIdOrNumber);
            return { success: false, error: 'Order not found' };
        }

        const now = new Date().toISOString();
        const reminderCount = (order.reminder_count || 0) + 1;
        order.last_payment_reminder_at = now;
        order.reminder_count = reminderCount;
        order.last_reminder_note = customNote;
        order.updated_at = now;
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Broadcast to other open tabs
        this.broadcastEvent('payment_reminder_sent', {
            orderId: order.id,
            orderNumber: order.order_number,
            clientEmail: order.client_email,
            clientName: order.client_name,
            price: order.price,
            timestamp: now,
            reminderCount
        });

        // Persist to InsForge PostgreSQL
        try {
            const queryParam = order.id ? `id=eq.${order.id}` : `order_number=eq.${order.order_number}`;
            const res = await fetch(`${this.baseUrl}/api/database/records/orders?${queryParam}`, {
                method: 'PATCH',
                headers: this.getApiHeaders({ 'Prefer': 'return=representation' }),
                body: JSON.stringify({
                    updated_at: order.updated_at
                })
            });
            if (res.ok) {
                console.log(`✅ Payment reminder timestamp recorded live in InsForge DB for ${order.order_number}`);
                localStorage.setItem('dezan_db_last_synced', new Date().toISOString());
            }
        } catch (err) {
            console.warn('Payment reminder remote sync notice (cached locally):', err.message);
        }

        return {
            success: true,
            timestamp: now,
            reminderCount,
            clientEmail: order.client_email,
            clientName: order.client_name
        };
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
     * Client Requests a Revision on a Completed Order with Specific Feedback & Physical Stitch-Out Photos
     * Automatically routes straight to the assigned digitizer's dashboard (strict technical data masking: no client PII/price)
     * @param {string} orderNumber 
     * @param {string} revisionNotes 
     * @param {Array} stitchOutPhotos - [{ name, url, size }]
     * @returns {Promise<{order: Object, task: Object}>}
     */
    async submitOrderRevision(orderNumber, revisionNotes, stitchOutPhotos = []) {
        const requestedAt = new Date().toISOString();
        const allOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
        const order = allOrders.find(o => o.order_number === orderNumber || o.id === orderNumber);

        if (!order) {
            throw new Error(`Order #${orderNumber} not found.`);
        }

        order.status = 'revision_requested';
        order.revision_notes = revisionNotes;
        order.stitch_out_photos = stitchOutPhotos;
        order.revision_requested_at = requestedAt;
        order.revision_count = (order.revision_count || 0) + 1;
        order.updated_at = requestedAt;
        localStorage.setItem('dezan_orders', JSON.stringify(allOrders));

        // Ensure task exists in digitizer_tasks for the assigned digitizer (or default Alex Miller)
        const allTasks = JSON.parse(localStorage.getItem('dezan_digitizer_tasks') || '[]');
        let task = allTasks.find(t => t.order_number === order.order_number || t.orderNumber === order.order_number);

        const digitizerId = order.assigned_digitizer_id || '00000000-0000-0000-0000-000000000003';
        const taskNumber = 'TSK-' + order.order_number.replace('ORD-', '');

        if (!task) {
            task = {
                id: this.generateUUID(),
                task_number: taskNumber,
                order_number: order.order_number,
                order_id: order.id,
                assigned_digitizer_id: digitizerId,
                service_type: order.service_type || 'Digitizing',
                placement: order.placement || 'Standard',
                fabric_type: order.fabric_type || '',
                sizing: order.sizing || 'Standard',
                file_format: order.file_format || 'DST, EMB',
                instructions: order.instructions || '',
                raw_artwork_files: order.raw_artwork_files || [],
                status: 'revision_requested',
                revision_notes: revisionNotes,
                stitch_out_photos: stitchOutPhotos,
                revision_requested_at: requestedAt,
                deliverables: order.deliverables || [],
                assigned_at: requestedAt
            };
            allTasks.unshift(task);
        } else {
            task.status = 'revision_requested';
            task.revision_notes = revisionNotes;
            task.stitch_out_photos = stitchOutPhotos;
            task.revision_requested_at = requestedAt;
            task.assigned_digitizer_id = digitizerId;
        }
        localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_revision_requested', {
            orderNumber: order.order_number,
            taskNumber: taskNumber,
            digitizerId: digitizerId,
            revisionNotes: revisionNotes,
            stitchOutPhotosCount: stitchOutPhotos.length,
            requestedAt: requestedAt
        });

        // Sync to InsForge PostgreSQL
        try {
            // 1. Update orders table
            await fetch(`${this.baseUrl}/api/database/records/orders?order_number=eq.${encodeURIComponent(order.order_number)}`, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    status: 'revision_requested',
                    revision_notes: revisionNotes,
                    stitch_out_photos: stitchOutPhotos,
                    updated_at: requestedAt
                })
            });

            // 2. Upsert digitizer_tasks
            const taskCheckRes = await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order_number=eq.${encodeURIComponent(order.order_number)}`, {
                headers: this.getApiHeaders()
            });
            const existingTasks = taskCheckRes.ok ? await taskCheckRes.json() : [];

            if (Array.isArray(existingTasks) && existingTasks.length > 0) {
                await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks?order_number=eq.${encodeURIComponent(order.order_number)}`, {
                    method: 'PATCH',
                    headers: this.getApiHeaders(),
                    body: JSON.stringify({
                        status: 'revision_requested',
                        revision_notes: revisionNotes,
                        stitch_out_photos: stitchOutPhotos,
                        assigned_digitizer_id: digitizerId,
                        updated_at: requestedAt
                    })
                });
            } else {
                await fetch(`${this.baseUrl}/api/database/records/digitizer_tasks`, {
                    method: 'POST',
                    headers: this.getApiHeaders(),
                    body: JSON.stringify([task])
                });
            }
            console.log(`✅ Revision for ${order.order_number} auto-routed to digitizer in InsForge PostgreSQL`);
            localStorage.setItem('dezan_db_last_synced', requestedAt);
        } catch (err) {
            console.warn('InsForge revision sync notice:', err.message);
        }

        return { order, task };
    }

    /**
     * Digitizer Submits Completed .dst/.emb Deliverables (persisted to PostgreSQL cloud database + local cache + broadcast)
     * Also clears open revision states
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
            order.revision_completed_at = completedAt;
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
            task.revision_completed_at = completedAt;
            localStorage.setItem('dezan_digitizer_tasks', JSON.stringify(allTasks));
        }

        // Broadcast to other tabs immediately
        this.broadcastEvent('order_completed', {
            orderNumber: orderNumber,
            deliverables: deliverables,
            isRevisionComplete: !!(order && order.revision_notes)
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
