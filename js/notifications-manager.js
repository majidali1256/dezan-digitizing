/**
 * ============================================================================
 * DEZAN DIGITIZING - NOTIFICATION ENGINE (js/notifications-manager.js)
 * ============================================================================
 * Centralized, reactive in-app notification center for:
 *   1. Admin HQ (admin-portal.html, admin-orders.html)
 *   2. Digitizer Studio (worker-portal.html, worker-tasks.html)
 *   3. Client Portal (client-portal.html, client-orders.html)
 *
 * Features:
 *   - Role-specific contextual notifications for order lifecycle events
 *   - Strict privacy & data masking for Digitizers (Zero PII, Zero Pricing)
 *   - Persistent localStorage storage with cross-tab reactive synchronization
 *   - Audio chime integration via Web Audio API
 *   - Sleek Dark Luxury / Clean Light theme design matching Awesome DESIGN.md
 *   - Fully responsive: desktop popover + mobile modal drawer (>= 44px touch targets)
 *   - Direct actions: View Order, Assign Digitizer, Open Workbench, Download Files
 * ============================================================================
 */

(function () {
    'use strict';

    // Role-specific configuration & metadata
    const ROLE_CONFIGS = {
        admin: {
            title: 'Admin Notifications',
            subtitle: 'Operational HQ & Orders Queue',
            badge: 'Admin Operations',
            badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-primary border-amber-500/30',
            tabs: [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'orders', label: 'Orders', icon: 'receipt_long' },
                { id: 'revisions', label: 'Revisions', icon: 'change_circle' },
                { id: 'quotes', label: 'Quotes', icon: 'request_quote' }
            ],
            emptyText: 'No admin notifications right now. New customer orders, quote requests, and digitizer submissions will appear here.'
        },
        digitizer: {
            title: 'Studio Notifications',
            subtitle: 'Digitizer Production Queue',
            badge: 'Zero-PII Masked',
            badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30',
            tabs: [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'assigned', label: 'New Tasks', icon: 'precision_manufacturing' },
                { id: 'revisions', label: 'Revisions', icon: 'change_circle' },
                { id: 'urgent', label: 'Urgent', icon: 'bolt' }
            ],
            emptyText: 'No studio alerts right now. New assigned embroidery & vector tasks will appear here in real-time.'
        },
        client: {
            title: 'Order Notifications',
            subtitle: 'Live Order & Deliverable Alerts',
            badge: 'Live Tracking',
            badgeClass: 'bg-primary/15 text-amber-800 dark:text-primary border-primary/30',
            tabs: [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'production', label: 'In Production', icon: 'pending_actions' },
                { id: 'ready', label: 'Files Ready', icon: 'verified' },
                { id: 'quotes', label: 'Quotes', icon: 'request_quote' }
            ],
            emptyText: 'No order updates right now. Notifications about your digitizing stages and finished stitch files will appear here.'
        }
    };

    class DezanNotificationEngine {
        constructor() {
            this.role = null;
            this.userId = 'guest';
            this.notifications = [];
            this.activeTab = 'all';
            this.isOpen = false;
            this.soundEnabled = localStorage.getItem('dezan_notif_sound') !== 'false';
            this.containerEl = null;
            this.bellBtn = null;
            this.badgeEl = null;
            this.panelEl = null;

            // Bind cross-tab synchronization
            window.addEventListener('storage', (e) => this.handleStorageEvent(e));
        }

        /**
         * Initialize the engine for a specific dashboard role
         * @param {'admin'|'digitizer'|'client'} role
         * @param {string} [mountSelector] Selector for header toolbar container
         */
        init(role, mountSelector = null) {
            if (!ROLE_CONFIGS[role]) {
                console.warn(`[Notifications] Invalid role "${role}". Defaulting to client.`);
                role = 'client';
            }
            this.role = role;

            // Resolve active user id
            const user = (typeof window.insforgeClient?.getCurrentUser === 'function')
                ? window.insforgeClient.getCurrentUser()
                : null;
            this.userId = user?.id || user?.email || (role === 'admin' ? 'admin_master' : role === 'digitizer' ? 'worker_master' : 'client_demo');

            // Load persisted notifications or generate initial contextual seed
            this.loadNotifications();

            // Render Bell & Panel UI into DOM
            this.mountUI(mountSelector);

            // Bind outside click & escape key
            this.bindGlobalEvents();

            console.log(`[Notifications] Dezan Notification Center initialized for role: ${role}`);
        }

        /**
         * Storage key specific to role and account
         */
        getStorageKey() {
            return `dezan_notifications_${this.role}_${this.userId}`;
        }

        /**
         * Load notifications from localStorage or generate realistic contextual seed
         */
        loadNotifications() {
            const key = this.getStorageKey();
            const stored = localStorage.getItem(key);

            if (stored) {
                try {
                    this.notifications = JSON.parse(stored);
                    if (Array.isArray(this.notifications)) return;
                } catch (e) {
                    console.warn('[Notifications] Failed to parse stored notifications:', e);
                }
            }

            // Generate initial realistic seed based on role
            this.notifications = this.generateInitialSeed();
            this.saveNotifications(false);
        }

        saveNotifications(syncBroadcast = true) {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify(this.notifications));
            this.updateBadgeUI();
            if (this.isOpen) this.renderPanelBody();

            if (syncBroadcast) {
                localStorage.setItem(`dezan_notif_pulse_${this.role}`, Date.now().toString());
            }
        }

        handleStorageEvent(e) {
            if (e.key === this.getStorageKey() || e.key === `dezan_notif_pulse_${this.role}`) {
                const stored = localStorage.getItem(this.getStorageKey());
                if (stored) {
                    try {
                        this.notifications = JSON.parse(stored);
                        this.updateBadgeUI();
                        if (this.isOpen) this.renderPanelBody();
                    } catch (err) {}
                }
            }
        }

        /**
         * Contextual Initial Seed Data based on role and actual orders in system
         */
        generateInitialSeed() {
            const now = Date.now();
            const m = (mins) => new Date(now - mins * 60 * 1000).toISOString();

            if (this.role === 'admin') {
                return [
                    {
                        id: 'notif-adm-1',
                        orderId: 'ORD-8842',
                        type: 'order_new',
                        category: 'orders',
                        title: 'New Embroidery Order Placed',
                        message: 'Falcon Cap Badge (Cap / Hat) placed by John Falcon. Ready for digitizer dispatch.',
                        meta: '$15.00 · Structured Cap · Turnaround 12-24h',
                        clientName: 'John Falcon',
                        actionLabel: 'Assign Digitizer',
                        actionType: 'assign_order',
                        read: false,
                        timestamp: m(8),
                        icon: 'add_shopping_cart',
                        accent: 'amber'
                    },
                    {
                        id: 'notif-adm-2',
                        orderId: 'QUO-4769',
                        type: 'quote_new',
                        category: 'quotes',
                        title: 'New Free Quote Request',
                        message: 'Custom Vector Redraw requested by Marcus Vance. Requires complexity appraisal.',
                        meta: 'Quote Appraisal Pending · Vector Redraw',
                        clientName: 'Marcus Vance',
                        actionLabel: 'Appraise Quote',
                        actionType: 'view_quotes',
                        read: false,
                        timestamp: m(42),
                        icon: 'request_quote',
                        accent: 'sky'
                    },
                    {
                        id: 'notif-adm-3',
                        orderId: 'ORD-8837',
                        type: 'revision_requested',
                        category: 'revisions',
                        title: 'Stitch-Out Revision Requested',
                        message: 'Client reported minor thread pull on Left Chest crest. Physical defect photos attached.',
                        meta: 'Priority Review · Left Chest Polo',
                        clientName: 'Sarah Jenkins',
                        actionLabel: 'Review Revision',
                        actionType: 'view_revision',
                        read: false,
                        timestamp: m(110),
                        icon: 'change_circle',
                        accent: 'purple'
                    },
                    {
                        id: 'notif-adm-4',
                        orderId: 'ORD-8839',
                        type: 'deliverables_uploaded',
                        category: 'orders',
                        title: 'Digitizer Submitted Machine Files',
                        message: 'Digitizer submitted .DST and .EMB production files for Falcon Corporate Polo.',
                        meta: 'QA Review Required · 14,280 Stitches',
                        clientName: 'Falcon Apparel',
                        actionLabel: 'QA & Release',
                        actionType: 'view_order',
                        read: true,
                        timestamp: m(320),
                        icon: 'verified',
                        accent: 'emerald'
                    },
                    {
                        id: 'notif-adm-5',
                        orderId: 'ORD-8841',
                        type: 'payment_confirmed',
                        category: 'orders',
                        title: 'Payment Received ($25.00)',
                        message: 'PayPal payment confirmed for Jacket Back Redraw. Automated invoice generated.',
                        meta: 'Paid · Transaction #TXN-9941',
                        clientName: 'David Miller',
                        actionLabel: 'View Invoice',
                        actionType: 'view_invoice',
                        read: true,
                        timestamp: m(650),
                        icon: 'payments',
                        accent: 'emerald'
                    }
                ];
            }

            if (this.role === 'digitizer') {
                return [
                    {
                        id: 'notif-wrk-1',
                        orderId: 'ORD-8840',
                        type: 'task_assigned',
                        category: 'assigned',
                        title: 'New Digitizing Task Assigned',
                        message: 'Task #ORD-8840 (Left Chest Logo) assigned to your workbench. Needle 75/11, Tatami underlay.',
                        meta: 'Cap / Hat · 3.5" W x 2.2" H · Format: DST, EMB',
                        actionLabel: 'Open Workbench',
                        actionType: 'open_task',
                        read: false,
                        timestamp: m(12),
                        icon: 'precision_manufacturing',
                        accent: 'blue'
                    },
                    {
                        id: 'notif-wrk-2',
                        orderId: 'ORD-8837',
                        type: 'revision_task',
                        category: 'revisions',
                        title: 'Stitch-Out Revision Requested',
                        message: 'Density adjustment required on lettering. Increase pull compensation to 0.40mm for pique knit.',
                        meta: 'Urgent Revision · Left Chest · Pique Fabric',
                        actionLabel: 'Inspect Specs',
                        actionType: 'open_task',
                        read: false,
                        timestamp: m(55),
                        icon: 'change_circle',
                        accent: 'purple'
                    },
                    {
                        id: 'notif-wrk-3',
                        orderId: 'ORD-8838',
                        type: 'deadline_urgent',
                        category: 'urgent',
                        title: 'Priority Turnaround Reminder',
                        message: 'Task #ORD-8838 has a target delivery in 4 hours. Ensure jump stitches under 1mm are trimmed.',
                        meta: 'Priority Queue · Jacket Back 3D Puff',
                        actionLabel: 'Workbench',
                        actionType: 'open_task',
                        read: false,
                        timestamp: m(140),
                        icon: 'bolt',
                        accent: 'amber'
                    },
                    {
                        id: 'notif-wrk-4',
                        orderId: 'ORD-8835',
                        type: 'qa_approved',
                        category: 'assigned',
                        title: 'Deliverables Approved & Verified',
                        message: 'Machine stitch simulation for Vance Tigers Crest verified. 100% QA score recorded.',
                        meta: 'Completed · 18,920 Stitches · 5 Stars',
                        actionLabel: 'View Archive',
                        actionType: 'view_archive',
                        read: true,
                        timestamp: m(480),
                        icon: 'task_alt',
                        accent: 'emerald'
                    }
                ];
            }

            // Default: Client Role
            return [
                {
                    id: 'notif-cli-1',
                    orderId: 'ORD-8839',
                    type: 'deliverables_ready',
                    category: 'ready',
                    title: 'Stitch Files Ready for Download!',
                    message: 'Your production-ready embroidery files (.DST, .EMB) for Falcon Corporate Polo are complete.',
                    meta: 'Deliverables Ready · Left Chest · 14,280 Stitches',
                    actionLabel: 'Download Files',
                    actionType: 'download_order',
                    read: false,
                    timestamp: m(15),
                    icon: 'cloud_download',
                    accent: 'emerald'
                },
                {
                    id: 'notif-cli-2',
                    orderId: 'ORD-8840',
                    type: 'in_production',
                    category: 'production',
                    title: 'Order is in Active Digitization',
                    message: 'Our senior digitizer has started stitching simulations on Falcon Cap Badge.',
                    meta: 'In Production · Estimated Ready: Today 6:00 PM',
                    actionLabel: 'Track Progress',
                    actionType: 'track_order',
                    read: false,
                    timestamp: m(65),
                    icon: 'pending_actions',
                    accent: 'blue'
                },
                {
                    id: 'notif-cli-3',
                    orderId: 'QUO-4769',
                    type: 'quote_ready',
                    category: 'quotes',
                    title: 'Custom Quote Appraisal Ready',
                    message: 'Master digitizer reviewed your artwork and estimated stitch counts. Flat appraisal: $15.00.',
                    meta: 'Quote Approved · 100% Free Appraisal',
                    actionLabel: 'Review & Pay',
                    actionType: 'view_quote',
                    read: false,
                    timestamp: m(180),
                    icon: 'request_quote',
                    accent: 'sky'
                },
                {
                    id: 'notif-cli-4',
                    orderId: 'ORD-8837',
                    type: 'revision_progress',
                    category: 'production',
                    title: 'Stitch Revision in Progress',
                    message: 'Digitizer is adjusting pull compensation and lettering density as requested.',
                    meta: 'Free Revisions Guarantee · In Progress',
                    actionLabel: 'View Order',
                    actionType: 'view_order',
                    read: true,
                    timestamp: m(360),
                    icon: 'change_circle',
                    accent: 'purple'
                },
                {
                    id: 'notif-cli-5',
                    orderId: 'ORD-8841',
                    type: 'payment_received',
                    category: 'ready',
                    title: 'Payment Confirmed & Receipt Ready',
                    message: 'Payment of $15.00 received. Your order has entered standard queue.',
                    meta: 'Invoice Settled · Confirmation #DZ-1048',
                    actionLabel: 'View Invoice',
                    actionType: 'view_invoice',
                    read: true,
                    timestamp: m(720),
                    icon: 'receipt',
                    accent: 'emerald'
                }
            ];
        }

        /**
         * Add a new real-time notification
         */
        addNotification(item) {
            const notif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                orderId: item.orderId || 'ORD-NEW',
                type: item.type || 'order_update',
                category: item.category || 'orders',
                title: item.title || 'New Order Notification',
                message: item.message || '',
                meta: item.meta || '',
                clientName: item.clientName || null,
                actionLabel: item.actionLabel || 'View Details',
                actionType: item.actionType || 'view_order',
                read: false,
                timestamp: new Date().toISOString(),
                icon: item.icon || 'notifications',
                accent: item.accent || 'amber'
            };

            this.notifications.unshift(notif);
            this.saveNotifications(true);

            // Trigger notification chime sound
            if (this.soundEnabled) {
                this.playChime();
            }

            // Trigger native browser notification if granted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const browserNotif = new Notification(notif.title, {
                        body: notif.message,
                        icon: 'logo.png'
                    });
                    browserNotif.onclick = () => {
                        window.focus();
                        if (notif.orderId) {
                            if (typeof window.openTaskDetailsModal === 'function') {
                                window.openTaskDetailsModal(notif.orderId);
                            } else if (window.workerWorkspace && typeof window.workerWorkspace.openTaskDetailsModal === 'function') {
                                window.workerWorkspace.openTaskDetailsModal(notif.orderId);
                            } else if (typeof window.openAdminOrderDetailsModal === 'function') {
                                window.openAdminOrderDetailsModal(notif.orderId);
                            }
                        }
                    };
                } catch (e) {}
            }

            // Trigger visual toast
            if (typeof window.insforgeClient?.showToast === 'function') {
                window.insforgeClient.showToast(notif.title, notif.message, notif.icon, 'info');
            }

            return notif;
        }

        requestNativePermission() {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                try {
                    Notification.requestPermission();
                } catch (e) {}
            }
        }

        /**
         * Broadcast a notification to a specific role (even if current session has a different role)
         */
        broadcastToRole(targetRole, item) {
            if (this.role === targetRole) {
                return this.addNotification(item);
            }
            try {
                const notif = {
                    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    orderId: item.orderId || 'ORD-NEW',
                    type: item.type || 'order_update',
                    category: item.category || 'orders',
                    title: item.title || 'New Notification',
                    message: item.message || '',
                    meta: item.meta || '',
                    clientName: item.clientName || null,
                    actionLabel: item.actionLabel || 'View Details',
                    actionType: item.actionType || 'view_order',
                    read: false,
                    timestamp: new Date().toISOString(),
                    icon: item.icon || 'notifications',
                    accent: item.accent || 'amber'
                };

                let matched = false;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(`dezan_notifications_${targetRole}_`)) {
                        try {
                            const list = JSON.parse(localStorage.getItem(key) || '[]');
                            if (Array.isArray(list)) {
                                list.unshift(notif);
                                localStorage.setItem(key, JSON.stringify(list));
                                matched = true;
                            }
                        } catch (e) {}
                    }
                }

                if (!matched) {
                    const defaultKey = `dezan_notifications_${targetRole}_default`;
                    const list = [notif];
                    localStorage.setItem(defaultKey, JSON.stringify(list));
                }

                // Broadcast pulse
                localStorage.setItem(`dezan_notif_pulse_${targetRole}`, Date.now().toString());
                return notif;
            } catch (e) {
                console.warn('[Notifications] broadcastToRole error:', e);
            }
        }

        /**
         * Play Web Audio notification bell chime
         */
        playChime() {
            if (typeof window.insforgeClient?.playNotificationChime === 'function') {
                window.insforgeClient.playNotificationChime();
                return;
            }
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const now = ctx.currentTime;

                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(880, now); // A5
                osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1320, now);
                osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.36);
                osc2.stop(now + 0.36);
            } catch (e) {}
        }

        getUnreadCount() {
            return this.notifications.filter(n => !n.read).length;
        }

        markAsRead(id) {
            const notif = this.notifications.find(n => n.id === id);
            if (notif) {
                notif.read = true;
                this.saveNotifications(true);
            }
        }

        markAllAsRead() {
            this.notifications.forEach(n => { n.read = true; });
            this.saveNotifications(true);
        }

        clearAllRead() {
            this.notifications = this.notifications.filter(n => !n.read);
            this.saveNotifications(true);
        }

        deleteNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
            this.saveNotifications(true);
        }

        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('dezan_notif_sound', this.soundEnabled ? 'true' : 'false');
            if (this.soundEnabled) this.playChime();
            this.renderPanelHeader();
        }

        togglePanel() {
            if (this.isOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        }

        openPanel() {
            this.isOpen = true;
            if (this.panelEl) {
                this.panelEl.classList.remove('hidden');
                // Always reset scroll to top so the top notification card is never cut off
                const bodyEl = this.panelEl.querySelector('#dezan-notif-body');
                if (bodyEl) bodyEl.scrollTop = 0;

                // Trigger reflow for transition
                void this.panelEl.offsetWidth;
                this.panelEl.classList.add('opacity-100', 'scale-100');
                this.panelEl.classList.remove('opacity-0', 'scale-95');
                this.renderPanelHeader();
                this.renderPanelTabs();
                this.renderPanelBody();
            }
            if (this.containerEl) {
                this.containerEl.classList.add('is-open');
                this.containerEl.style.zIndex = '100';
            }
            // Elevate header while open so it sits strictly on top of any sticky elements or stage sub-sections
            const parentHeader = this.containerEl?.closest('header');
            if (parentHeader) {
                parentHeader.dataset.prevZIndex = parentHeader.style.zIndex || '';
                parentHeader.style.zIndex = '70';
            }
            if (this.bellBtn) {
                this.bellBtn.setAttribute('aria-expanded', 'true');
                this.bellBtn.classList.add('ring-2', 'ring-amber-500/50');
            }
        }

        closePanel() {
            this.isOpen = false;
            if (this.panelEl) {
                this.panelEl.classList.add('opacity-0', 'scale-95');
                this.panelEl.classList.remove('opacity-100', 'scale-100');
                setTimeout(() => {
                    if (!this.isOpen) this.panelEl.classList.add('hidden');
                }, 150);
            }
            if (this.containerEl) {
                this.containerEl.classList.remove('is-open');
                this.containerEl.style.zIndex = '';
            }
            const parentHeader = this.containerEl?.closest('header');
            if (parentHeader) {
                parentHeader.style.zIndex = parentHeader.dataset.prevZIndex || '';
                delete parentHeader.dataset.prevZIndex;
            }
            if (this.bellBtn) {
                this.bellBtn.setAttribute('aria-expanded', 'false');
                this.bellBtn.classList.remove('ring-2', 'ring-amber-500/50');
            }
        }

        /**
         * Mount UI elements into Header
         */
        mountUI(mountSelector) {
            // Find target location in header
            let target = mountSelector ? document.querySelector(mountSelector) : null;

            if (!target) {
                // Reliably target the right-side header toolbar using the theme toggle button
                const themeBtn = document.querySelector('header .theme-toggle-btn');
                if (themeBtn && themeBtn.parentElement) {
                    target = themeBtn.parentElement;
                } else {
                    target = document.querySelector('#notification-mount-slot') ||
                             document.querySelector('header div.flex.items-center:last-child') ||
                             document.querySelector('header div.flex.items-center.gap-2\\.5') ||
                             document.querySelector('header div.flex.items-center.gap-2');
                }
            }

            if (!target) {
                console.warn('[Notifications] Could not find header container to mount notification bell');
                return;
            }

            // Remove existing if any
            const existing = document.getElementById('dezan-notification-container');
            if (existing) existing.remove();

            // Create wrapper
            this.containerEl = document.createElement('div');
            this.containerEl.id = 'dezan-notification-container';
            this.containerEl.className = 'relative inline-block text-left';

            // Create Bell Button
            this.bellBtn = document.createElement('button');
            this.bellBtn.id = 'dezan-notifications-bell';
            this.bellBtn.type = 'button';
            this.bellBtn.className = 'relative p-2 rounded-xl bg-slate-100 dark:bg-card-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-primary transition-all border border-slate-200 dark:border-primary/25 cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
            this.bellBtn.setAttribute('aria-label', 'Open Notifications');
            this.bellBtn.setAttribute('aria-expanded', 'false');
            this.bellBtn.setAttribute('title', 'Notifications');

            this.bellBtn.innerHTML = `
                <span class="material-symbols-outlined text-xl transition-transform group-hover:scale-105">notifications</span>
                <span id="dezan-notif-badge" class="hidden absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-xs border-2 border-white dark:border-[#12100c]">0</span>
            `;

            this.bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });

            this.badgeEl = this.bellBtn.querySelector('#dezan-notif-badge');

            // Create Popover Panel - 100% OPAQUE SOLID SURFACE with z-[100]
            this.panelEl = document.createElement('div');
            this.panelEl.id = 'dezan-notification-panel';
            this.panelEl.className = 'hidden fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] sm:w-[410px] max-w-[420px] max-h-[85vh] sm:max-h-[580px] rounded-2xl bg-white dark:bg-[#12100c] border border-amber-500/30 dark:border-primary/25 shadow-2xl z-[100] overflow-hidden flex flex-col transition-all duration-150 transform opacity-0 scale-95';

            this.panelEl.innerHTML = `
                <div id="dezan-notif-header" class="px-4 py-3.5 border-b border-slate-200/80 dark:border-primary/20 flex items-center justify-between bg-slate-50 dark:bg-[#16140d] shrink-0"></div>
                <div id="dezan-notif-tabs" class="px-3 py-2 border-b border-slate-200/60 dark:border-primary/15 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-white dark:bg-[#12100c] shrink-0"></div>
                <div id="dezan-notif-body" class="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[380px] scrollbar-thin bg-white dark:bg-[#12100c] overscroll-contain"></div>
                <div id="dezan-notif-footer" class="px-4 py-2.5 border-t border-slate-200/80 dark:border-primary/20 flex items-center justify-between text-[11px] bg-slate-50 dark:bg-[#16140d] shrink-0"></div>
            `;

            // Prevent clicks inside panel from closing it
            this.panelEl.addEventListener('click', (e) => e.stopPropagation());

            this.containerEl.appendChild(this.bellBtn);
            this.containerEl.appendChild(this.panelEl);

            // Insert into header before theme toggle or at the end
            const themeBtn = target.querySelector('.theme-toggle-btn');
            if (themeBtn) {
                target.insertBefore(this.containerEl, themeBtn);
            } else {
                target.appendChild(this.containerEl);
            }

            this.updateBadgeUI();
        }

        bindGlobalEvents() {
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.containerEl?.contains(e.target)) {
                    this.closePanel();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closePanel();
                }
            });
        }

        updateBadgeUI() {
            if (!this.badgeEl) return;
            const count = this.getUnreadCount();
            if (count > 0) {
                this.badgeEl.textContent = count > 99 ? '99+' : count;
                this.badgeEl.classList.remove('hidden');
                this.badgeEl.classList.add('animate-pulse');
            } else {
                this.badgeEl.classList.add('hidden');
                this.badgeEl.classList.remove('animate-pulse');
            }
        }

        renderPanelHeader() {
            const headerEl = this.panelEl?.querySelector('#dezan-notif-header');
            if (!headerEl) return;

            const cfg = ROLE_CONFIGS[this.role] || ROLE_CONFIGS.client;
            const unread = this.getUnreadCount();

            headerEl.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-primary/20 text-amber-900 dark:text-primary flex items-center justify-center border border-amber-500/30">
                        <span class="material-symbols-outlined text-lg">notifications_active</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5">
                            <h3 class="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">${cfg.title}</h3>
                            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.badgeClass}">${cfg.badge}</span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">${unread > 0 ? `${unread} unread notifications` : 'All caught up'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button type="button" id="notif-btn-sound" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors" title="${this.soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}">
                        <span class="material-symbols-outlined text-base">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button type="button" id="notif-btn-markall" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors" title="Mark all as read">
                        <span class="material-symbols-outlined text-base">done_all</span>
                    </button>
                    <button type="button" id="notif-btn-close" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors" title="Close">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            `;

            headerEl.querySelector('#notif-btn-sound')?.addEventListener('click', () => this.toggleSound());
            headerEl.querySelector('#notif-btn-markall')?.addEventListener('click', () => this.markAllAsRead());
            headerEl.querySelector('#notif-btn-close')?.addEventListener('click', () => this.closePanel());
        }

        renderPanelTabs() {
            const tabsEl = this.panelEl?.querySelector('#dezan-notif-tabs');
            if (!tabsEl) return;

            const cfg = ROLE_CONFIGS[this.role] || ROLE_CONFIGS.client;
            const unreadCount = this.getUnreadCount();

            tabsEl.innerHTML = cfg.tabs.map(tab => {
                const isActive = this.activeTab === tab.id;
                let badge = '';
                if (tab.id === 'unread' && unreadCount > 0) {
                    badge = `<span class="ml-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${isActive ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-amber-500 text-slate-950'}">${unreadCount}</span>`;
                }

                return `
                    <button type="button" data-tab-id="${tab.id}" class="notif-tab-btn px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                            ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                            : 'bg-slate-100 dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }">
                        ${tab.icon ? `<span class="material-symbols-outlined text-xs">${tab.icon}</span>` : ''}
                        <span>${tab.label}</span>
                        ${badge}
                    </button>
                `;
            }).join('');

            tabsEl.querySelectorAll('.notif-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.activeTab = btn.getAttribute('data-tab-id');
                    this.renderPanelTabs();
                    this.renderPanelBody();
                });
            });
        }

        getFilteredNotifications() {
            let list = this.notifications || [];
            if (this.activeTab === 'unread') {
                return list.filter(n => !n.read);
            }
            if (this.activeTab !== 'all') {
                return list.filter(n => n.category === this.activeTab || n.type === this.activeTab);
            }
            return list;
        }

        formatRelativeTime(isoString) {
            if (!isoString) return 'Recent';
            const diff = Date.now() - new Date(isoString).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Just now';
            if (mins < 60) return `${mins}m ago`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }

        getAccentClasses(accent, isRead) {
            switch (accent) {
                case 'emerald':
                    return {
                        bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
                        border: isRead ? 'border-slate-200 dark:border-primary/15' : 'border-emerald-500/50 dark:border-emerald-400/40 shadow-xs'
                    };
                case 'purple':
                    return {
                        bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
                        border: isRead ? 'border-slate-200 dark:border-primary/15' : 'border-purple-500/50 dark:border-purple-400/40 shadow-xs'
                    };
                case 'sky':
                    return {
                        bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
                        border: isRead ? 'border-slate-200 dark:border-primary/15' : 'border-sky-500/50 dark:border-sky-400/40 shadow-xs'
                    };
                case 'blue':
                    return {
                        bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
                        border: isRead ? 'border-slate-200 dark:border-primary/15' : 'border-blue-500/50 dark:border-blue-400/40 shadow-xs'
                    };
                default: // amber
                    return {
                        bg: 'bg-amber-500/15 text-amber-800 dark:text-primary border-amber-500/30',
                        border: isRead ? 'border-slate-200 dark:border-primary/15' : 'border-amber-500/50 dark:border-amber-400/40 shadow-xs'
                    };
            }
        }

        renderPanelBody() {
            const bodyEl = this.panelEl?.querySelector('#dezan-notif-body');
            const footerEl = this.panelEl?.querySelector('#dezan-notif-footer');
            if (!bodyEl) return;

            const filtered = this.getFilteredNotifications();
            const cfg = ROLE_CONFIGS[this.role] || ROLE_CONFIGS.client;

            if (filtered.length === 0) {
                bodyEl.innerHTML = `
                    <div class="py-12 px-4 text-center flex flex-col items-center justify-center">
                        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-card-dark text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3 border border-slate-200 dark:border-primary/20">
                            <span class="material-symbols-outlined text-2xl">notifications_paused</span>
                        </div>
                        <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No notifications found</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed">${cfg.emptyText}</p>
                    </div>
                `;
            } else {
                bodyEl.innerHTML = filtered.map(notif => {
                    const isRead = !!notif.read;
                    const accentStyle = this.getAccentClasses(notif.accent, isRead);
                    const timeAgo = this.formatRelativeTime(notif.timestamp);

                    return `
                        <div data-notif-id="${notif.id}" class="notif-card group relative p-3 rounded-xl border transition-all ${accentStyle.border} ${
                            isRead
                                ? 'bg-slate-50/90 dark:bg-[#15130b] opacity-80 hover:opacity-100'
                                : 'bg-white dark:bg-[#17150e] shadow-xs'
                        }">
                            <div class="flex items-start gap-2.5">
                                <!-- Status / Category Icon -->
                                <div class="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${accentStyle.bg}">
                                    <span class="material-symbols-outlined text-base">${notif.icon || 'notifications'}</span>
                                </div>

                                <!-- Notification Content -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between gap-1 mb-1">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="font-mono text-[11px] font-black text-slate-900 dark:text-white">${notif.orderId}</span>
                                            ${notif.clientName ? `<span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">• ${notif.clientName}</span>` : ''}
                                        </div>
                                        <div class="flex items-center gap-1.5 shrink-0">
                                            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">${timeAgo}</span>
                                            ${!isRead ? '<span class="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title="Unread"></span>' : ''}
                                        </div>
                                    </div>

                                    <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1">${notif.title}</h4>
                                    <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">${notif.message}</p>

                                    ${notif.meta ? `
                                        <div class="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-primary/15 mb-2.5">
                                            <span class="material-symbols-outlined text-[12px]">info</span>
                                            <span class="truncate max-w-[280px]">${notif.meta}</span>
                                        </div>
                                    ` : ''}

                                    <!-- Action Button Toolbar -->
                                    <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-primary/10">
                                        <button type="button" data-action="${notif.actionType}" data-order="${notif.orderId}" class="notif-action-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-2xs">
                                            <span>${notif.actionLabel || 'View Details'}</span>
                                            <span class="material-symbols-outlined text-xs">arrow_forward</span>
                                        </button>

                                        <div class="flex items-center gap-1">
                                            <button type="button" data-mark-id="${notif.id}" class="notif-mark-btn p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="${isRead ? 'Mark as unread' : 'Mark as read'}">
                                                <span class="material-symbols-outlined text-sm">${isRead ? 'mark_email_unread' : 'check'}</span>
                                            </button>
                                            <button type="button" data-delete-id="${notif.id}" class="notif-delete-btn p-1 rounded text-slate-400 hover:text-red-500 transition-colors" title="Dismiss notification">
                                                <span class="material-symbols-outlined text-sm">delete_outline</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Bind Card Item Buttons
                bodyEl.querySelectorAll('.notif-mark-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = btn.getAttribute('data-mark-id');
                        const item = this.notifications.find(n => n.id === id);
                        if (item) {
                            item.read = !item.read;
                            this.saveNotifications(true);
                            this.renderPanelHeader();
                            this.renderPanelTabs();
                            this.renderPanelBody();
                        }
                    });
                });

                bodyEl.querySelectorAll('.notif-delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = btn.getAttribute('data-delete-id');
                        this.deleteNotification(id);
                        this.renderPanelHeader();
                        this.renderPanelTabs();
                        this.renderPanelBody();
                    });
                });

                bodyEl.querySelectorAll('.notif-action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = btn.getAttribute('data-action');
                        const order = btn.getAttribute('data-order');
                        const card = btn.closest('.notif-card');
                        const id = card?.getAttribute('data-notif-id');
                        if (id) {
                            const notif = this.notifications.find(n => n.id === id);
                            if (notif) notif.read = true;
                            this.saveNotifications(false);
                        }
                        this.executeAction(action, order);
                    });
                });
            }

            // Render Footer
            if (footerEl) {
                const total = this.notifications.length;
                const unread = this.getUnreadCount();

                footerEl.innerHTML = `
                    <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="font-semibold">${unread} unread (${total} total)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="notif-btn-simulate" class="text-amber-800 dark:text-primary font-bold hover:underline cursor-pointer" title="Generate test order notification">+ Test Alert</button>
                        <span class="text-slate-300 dark:text-slate-700">|</span>
                        <button type="button" id="notif-btn-clear" class="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-semibold cursor-pointer" title="Remove all read notifications">Clear Read</button>
                    </div>
                `;

                footerEl.querySelector('#notif-btn-clear')?.addEventListener('click', () => {
                    this.clearAllRead();
                    this.renderPanelHeader();
                    this.renderPanelTabs();
                    this.renderPanelBody();
                });
                footerEl.querySelector('#notif-btn-simulate')?.addEventListener('click', () => {
                    this.simulateSampleAlert();
                    this.renderPanelHeader();
                    this.renderPanelTabs();
                    this.renderPanelBody();
                });
            }
        }

        /**
         * Test alert simulator for instant demonstration
         */
        simulateSampleAlert() {
            const rand = Math.floor(1000 + Math.random() * 9000);
            if (this.role === 'admin') {
                this.addNotification({
                    orderId: `ORD-${rand}`,
                    type: 'order_new',
                    category: 'orders',
                    title: 'New Customer Order Placed',
                    message: `Customer placed instant order #ORD-${rand} for Left Chest / Hat ($15.00).`,
                    meta: '$15.00 · Cap / Hat · Pending Assignment',
                    clientName: 'Demo Client',
                    actionLabel: 'Assign Digitizer',
                    actionType: 'assign_order',
                    accent: 'amber',
                    icon: 'add_shopping_cart'
                });
            } else if (this.role === 'digitizer') {
                this.addNotification({
                    orderId: `ORD-${rand}`,
                    type: 'task_assigned',
                    category: 'assigned',
                    title: 'New Digitizing Task Assigned',
                    message: `New task #ORD-${rand} assigned to you. Turnaround requested within 24h.`,
                    meta: 'Structured Cap · Needle 75/11 · Format: DST, EMB',
                    actionLabel: 'Open Workbench',
                    actionType: 'open_task',
                    accent: 'blue',
                    icon: 'precision_manufacturing'
                });
            } else {
                this.addNotification({
                    orderId: `ORD-${rand}`,
                    type: 'deliverables_ready',
                    category: 'ready',
                    title: 'Stitch Files Ready for Download',
                    message: `Production deliverables for order #ORD-${rand} are uploaded and verified.`,
                    meta: 'Ready · .DST & .EMB files attached',
                    actionLabel: 'Download Files',
                    actionType: 'download_order',
                    accent: 'emerald',
                    icon: 'cloud_download'
                });
            }
        }

        /**
         * Execute navigation or action based on role context
         */
        executeAction(actionType, orderNumber) {
            this.closePanel();

            // Fire generic CustomEvent for custom page listeners
            window.dispatchEvent(new CustomEvent('dezan:notification-action', {
                detail: { actionType, orderNumber, role: this.role }
            }));

            // ADMIN WORKSPACE ACTIONS
            if (this.role === 'admin') {
                const isAdminOrders = window.location.pathname.includes('admin-orders.html');

                if (actionType === 'assign_order') {
                    if (typeof window.openAssignModal === 'function') {
                        window.openAssignModal(orderNumber);
                        return;
                    }
                    window.location.href = `admin-orders.html?assign=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                if (actionType === 'view_quotes') {
                    if (typeof window.openSetQuotePriceModal === 'function') {
                        window.openSetQuotePriceModal(orderNumber);
                        return;
                    }
                    window.location.href = `admin-orders.html?quote=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                if (actionType === 'view_revision') {
                    if (typeof window.openAdminRevisionModal === 'function') {
                        window.openAdminRevisionModal(orderNumber);
                        return;
                    }
                    window.location.href = `admin-orders.html?revision=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                if (actionType === 'view_invoice') {
                    if (typeof window.openInvoiceModal === 'function') {
                        window.openInvoiceModal(orderNumber);
                        return;
                    }
                    window.location.href = `admin-orders.html?invoice=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                if (actionType === 'view_order') {
                    if (typeof window.openAdminOrderDetailsModal === 'function') {
                        window.openAdminOrderDetailsModal(orderNumber);
                        return;
                    }
                    window.location.href = `admin-orders.html?order=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                // Fallback for admin: filter search or jump to orders
                if (typeof window.switchAdminView === 'function') {
                    window.switchAdminView('orders');
                }
                if (typeof window.applyAdminSearch === 'function') {
                    const searchInput = document.getElementById('admin-search-input') || document.getElementById('search-input');
                    if (searchInput) {
                        searchInput.value = orderNumber;
                        window.applyAdminSearch(orderNumber);
                    }
                } else if (!isAdminOrders) {
                    window.location.href = `admin-orders.html?search=${encodeURIComponent(orderNumber)}`;
                }
                return;
            }

            // DIGITIZER WORKSPACE ACTIONS
            if (this.role === 'digitizer') {
                if (actionType === 'view_archive') {
                    window.location.href = 'worker-archive.html';
                    return;
                }

                if (window.workerWorkspace && typeof window.workerWorkspace.openTaskDetailsModal === 'function') {
                    window.workerWorkspace.openTaskDetailsModal(orderNumber);
                } else if (typeof window.openTaskDetailsModal === 'function') {
                    window.openTaskDetailsModal(orderNumber);
                } else {
                    window.location.href = `worker-tasks.html?task=${encodeURIComponent(orderNumber)}`;
                }
                return;
            }

            // CLIENT WORKSPACE ACTIONS
            if (this.role === 'client') {
                if (actionType === 'view_quote') {
                    window.location.href = 'client-quotes.html';
                    return;
                }
                if (actionType === 'view_invoice') {
                    if (window.clientWorkspace && typeof window.clientWorkspace.openClientInvoiceModal === 'function') {
                        window.clientWorkspace.openClientInvoiceModal(orderNumber);
                    } else {
                        window.location.href = 'client-invoices.html';
                    }
                    return;
                }
                if (actionType === 'view_revision') {
                    if (window.clientWorkspace && typeof window.clientWorkspace.openRevisionModal === 'function') {
                        window.clientWorkspace.openRevisionModal(orderNumber);
                        return;
                    }
                    window.location.href = `client-orders.html?revision=${encodeURIComponent(orderNumber)}`;
                    return;
                }

                // Default: download, track, or view details
                if (window.clientWorkspace && typeof window.clientWorkspace.openOrderDetailsModal === 'function') {
                    window.clientWorkspace.openOrderDetailsModal(orderNumber);
                } else if (typeof window.openOrderDetailsModal === 'function') {
                    window.openOrderDetailsModal(orderNumber);
                } else {
                    window.location.href = `client-orders.html?order=${encodeURIComponent(orderNumber)}`;
                }
                return;
            }
        }
    }

    // Export singleton instance to window
    window.dezanNotificationEngine = new DezanNotificationEngine();

    // Auto-detect role and initialize on DOM ready
    function autoInit() {
        const body = document.body;
        if (!body) return;
        let role = null;

        if (body.hasAttribute('data-admin-page') || window.location.pathname.includes('admin-')) {
            role = 'admin';
        } else if (body.hasAttribute('data-worker-page') || window.location.pathname.includes('worker-')) {
            role = 'digitizer';
        } else if (body.hasAttribute('data-client-page') || window.location.pathname.includes('client-')) {
            role = 'client';
        }

        if (role && !document.getElementById('dezan-notifications-bell')) {
            window.dezanNotificationEngine.init(role);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

})();
