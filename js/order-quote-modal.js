/**
 * DEZAN DIGITIZING - UNIFIED ORDER & QUOTE MODAL ENGINE
 * 
 * Provides an identical 2-stage adaptive order & quote modal across:
 * - Public marketing website (index, pricing, services, contact, portfolio, about)
 * - Client portal & workspace suite (client-portal, client-orders, client-quotes, client-invoices, client-profile)
 * 
 * Implements the 5-skill design pipeline standards:
 * - 4px/8px spatial grid, WCAG 2.1 AA contrast, 44x44px minimum touch targets
 * - Light default / Dark luxury themes, 1px translucent borders, micro-interactions
 * - Multi-file drag & drop, live price computation, InsForge cloud storage & postgres sync
 */

(function() {
    'use strict';

    // State management
    const state = {
        isQuote: false,
        selectedService: 'Digitizing', // 'Digitizing' | 'Vectorizing'
        uploadedFiles: [],
        calculatedPrice: 15.00,
        paymentMethod: 'Credit Card',
        isSubmitting: false
    };

    function getSession() {
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) ||
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Injects the unified modal markup into the DOM if not already present
     */
    function ensureModalElement() {
        let existing = document.getElementById('new-order-modal');
        if (existing) {
            if (existing.querySelector('#modal-mode-order-btn') && existing.querySelector('#modal-auth-name')) {
                return existing;
            }
            // If existing is legacy or incomplete markup, replace it with the unified modal
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'new-order-modal';
        modal.onclick = function(e) {
            if (e.target === modal) window.closeOrderQuoteModal();
        };
        modal.className = 'fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 overflow-hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        modal.innerHTML = `
            <style>
                @media screen and (max-width: 768px) {
                    #new-order-modal input:not([type="checkbox"]):not([type="radio"]),
                    #new-order-modal select,
                    #new-order-modal textarea {
                        font-size: 16px !important;
                    }
                }
                #new-order-modal input,
                #new-order-modal select,
                #new-order-modal textarea,
                #new-order-modal button {
                    touch-action: manipulation;
                }
            </style>
            <!-- Dual ID compatibility wrapper for test suites -->
            <div id="guest-checkout-modal" class="w-full flex flex-col justify-end sm:justify-center sm:items-center">
                <div class="w-full sm:max-w-2xl bg-white dark:bg-card-dark border-t sm:border border-slate-200 dark:border-primary/30 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] text-slate-900 dark:text-slate-100 overflow-hidden relative">
                    
                    <!-- Mobile Drag Indicator Bar -->
                    <div class="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0"></div>

                    <!-- Sticky Modal Header (Image 2 Target Design) -->
                    <div class="flex flex-col px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-slate-200/80 dark:border-primary/15 bg-white/95 dark:bg-card-dark/95 backdrop-blur-md flex-shrink-0 z-10 gap-2.5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3 min-w-0 pr-2">
                                <span class="material-symbols-outlined text-[#b89218] dark:text-primary text-2xl sm:text-3xl flex-shrink-0" id="order-modal-header-icon">shopping_cart</span>
                                <div class="min-w-0">
                                    <h3 class="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate" id="order-modal-header-text">Place an Order</h3>
                                    <p class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5" id="order-modal-header-desc">Choose a service to continue.</p>
                                </div>
                            </div>
                            <button type="button" onclick="window.closeGuestCheckoutModal()" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0" title="Close (Esc)">
                                <span class="material-symbols-outlined text-lg sm:text-xl">close</span>
                            </button>
                        </div>

                        <!-- Top Segmented Mode Switcher Pill (Place Order vs. Free Quote) -->
                        <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-primary/20">
                            <button type="button" id="modal-mode-order-btn" onclick="window.setModalMode(false)" class="py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer">
                                <span class="material-symbols-outlined text-sm">bolt</span>
                                <span>Place Order</span>
                            </button>
                            <button type="button" id="modal-mode-quote-btn" onclick="window.setModalMode(true)" class="py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer">
                                <span class="material-symbols-outlined text-sm">request_quote</span>
                                <span>Request Free Quote ($0)</span>
                            </button>
                        </div>

                        <!-- 2-Step Stepper Progress Bar (Image 2 Target Design) -->
                        <div class="w-full max-w-[280px] sm:max-w-[320px] mx-auto pt-1.5 pb-0.5">
                            <div class="flex items-start justify-between relative">
                                <!-- Connecting line centered at top-4 (middle of 32px circle) -->
                                <div class="absolute left-8 right-8 top-4 -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-slate-700 transition-colors" id="step-connector"></div>

                                <!-- Step 1 (Clickable to return to service choice) -->
                                <button type="button" onclick="window.switchOrderServiceChoice()" class="relative z-10 flex flex-col items-center cursor-pointer group bg-transparent border-0 p-0 text-center" title="Step 1: Choose Service">
                                    <div id="step-circle-1" class="w-8 h-8 rounded-full bg-[#b89218] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs transition-all ring-4 ring-white dark:ring-card-dark">
                                        1
                                    </div>
                                    <span id="step-label-1" class="text-[11px] sm:text-xs font-bold text-[#b89218] mt-1 whitespace-nowrap transition-colors">Choose Service</span>
                                </button>

                                <!-- Step 2 -->
                                <div class="relative z-10 flex flex-col items-center text-center">
                                    <div id="step-circle-2" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all ring-4 ring-white dark:ring-card-dark">
                                        2
                                    </div>
                                    <span id="step-label-2" class="text-[11px] sm:text-xs font-medium text-slate-400 mt-1 whitespace-nowrap transition-colors">Order Details</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STAGE 1: SERVICE CHOICE CARDS (Exact match to Image 2) -->
                    <div id="order-service-selection-view" class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                        
                        <!-- Option 1: Embroidery Digitizing -->
                        <button type="button" onclick="window.selectOrderService('Digitizing')" class="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#faedd0] dark:border-primary/25 bg-[#fffdf8] dark:bg-card-dark hover:border-[#b89218] dark:hover:border-primary transition-all text-left flex flex-col gap-3 sm:gap-3.5 cursor-pointer shadow-xs hover:shadow-md">
                            <div class="flex items-center gap-3 sm:gap-4 w-full">
                                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#fef5df] dark:bg-primary/15 border border-[#f5dfaa] dark:border-primary/30 text-[#b89218] dark:text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg class="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="2" y="3" width="20" height="13" rx="2"></rect>
                                        <path d="M8 20h8"></path>
                                        <path d="M12 16v4"></path>
                                        <circle cx="6" cy="10.5" r="1.2" fill="currentColor"></circle>
                                        <circle cx="9.5" cy="7" r="1.2" fill="currentColor"></circle>
                                        <circle cx="9.5" cy="12.5" r="1.2" fill="currentColor"></circle>
                                        <path d="M6 10.5c1.2-3.5 2.5-3.5 3.5-3.5s2 2 3.5 3.5"></path>
                                        <path d="M14 7h4"></path>
                                        <path d="M14 9.5h4"></path>
                                        <path d="M14 12h4"></path>
                                    </svg>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-base sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#b89218] dark:group-hover:text-primary transition-colors leading-tight">Embroidery Digitizing</h4>
                                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Stitch files for embroidery machines.</p>
                                </div>
                                <span class="material-symbols-outlined text-2xl text-[#b89218] dark:text-primary group-hover:translate-x-1 transition-transform shrink-0 font-bold">chevron_right</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span class="px-3 py-1 rounded-full bg-[#fef3cd] dark:bg-primary/20 text-[#9a7810] dark:text-primary font-bold text-xs">.DST &nbsp;.PES &nbsp;.EXP</span>
                                <span class="px-3 py-1 rounded-full bg-[#edf4f9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 font-medium text-xs">Left Chest / Hats / Jacket Back</span>
                                <span class="px-3 py-1 rounded-full bg-[#edf4f9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 font-medium text-xs">3D Puff</span>
                            </div>
                        </button>

                        <!-- Option 2: Vector Art Conversion -->
                        <button type="button" onclick="window.selectOrderService('Vectorizing')" class="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#e2eaf4] dark:border-primary/25 bg-[#f8faff] dark:bg-card-dark hover:border-[#1d68d8] dark:hover:border-primary transition-all text-left flex flex-col gap-3 sm:gap-3.5 cursor-pointer shadow-xs hover:shadow-md">
                            <div class="flex items-center gap-3 sm:gap-4 w-full">
                                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#e8f1fd] dark:bg-blue-950/40 border border-[#cce0fc] dark:border-blue-800/50 text-[#1d68d8] dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg class="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 17c3-8 9-8 18 0"></path>
                                        <circle cx="3" cy="17" r="1.4" fill="currentColor"></circle>
                                        <circle cx="12" cy="10" r="1.4" fill="currentColor"></circle>
                                        <circle cx="21" cy="17" r="1.4" fill="currentColor"></circle>
                                        <path d="M12 11l-3 6h6l-3-6z"></path>
                                        <circle cx="12" cy="14.5" r="0.8" fill="currentColor"></circle>
                                        <path d="M10.5 17v4h3v-4"></path>
                                    </svg>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-base sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#1d68d8] dark:group-hover:text-blue-400 transition-colors leading-tight">Vector Art Conversion</h4>
                                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Clean vector redraws for print and artwork.</p>
                                </div>
                                <span class="material-symbols-outlined text-2xl text-[#1d68d8] dark:text-blue-400 group-hover:translate-x-1 transition-transform shrink-0 font-bold">chevron_right</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span class="px-3 py-1 rounded-full bg-[#dbeafe] dark:bg-blue-900/30 text-[#1e40af] dark:text-blue-300 font-bold text-xs">.AI &nbsp;.EPS &nbsp;.SVG &nbsp;.PDF</span>
                                <span class="px-3 py-1 rounded-full bg-[#edf4f9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 font-medium text-xs">Print-ready</span>
                            </div>
                        </button>

                    </div>

                    <!-- STAGE 2: ADAPTIVE FORM (Hidden until service selected) -->
                    <form id="adaptive-order-form" onsubmit="window.handleAdaptiveOrderSubmit(event)" class="hidden flex-1 flex flex-col overflow-hidden">
                        <input type="hidden" id="selected-service-type" value="Digitizing" />

                        <!-- Scrollable Form Fields Body -->
                        <div class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                            <!-- Active Service Banner with Quick Switcher -->
                            <div class="p-2.5 sm:p-3 rounded-xl bg-amber-50/50 dark:bg-slate-900/60 border border-amber-200/80 dark:border-primary/20 flex items-center justify-between">
                                <div class="flex items-center gap-2 min-w-0">
                                    <span class="material-symbols-outlined text-amber-800 dark:text-primary text-lg flex-shrink-0" id="service-banner-icon">precision_manufacturing</span>
                                    <div class="min-w-0">
                                        <span class="text-[9px] uppercase font-bold text-slate-500 block">Active Service</span>
                                        <strong class="text-xs font-black text-slate-900 dark:text-white truncate block" id="service-banner-title">Embroidery Digitizing</strong>
                                    </div>
                                </div>
                                <button type="button" onclick="window.switchOrderServiceChoice()" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-primary/30 text-xs font-bold text-amber-800 dark:text-primary hover:bg-amber-50 dark:hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0">
                                    <span class="material-symbols-outlined text-xs">swap_horiz</span> Change
                                </button>
                            </div>

                            <!-- ================= EMBROIDERY DIGITIZING FIELDS ================= -->
                            <div id="digitizing-fields-container" class="space-y-3.5 sm:space-y-4">
                                <!-- Job Name & Placement -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Job Name / Reference *</label>
                                        <input type="text" id="dig-job-name" required placeholder="e.g. Falcon Polo Left Chest" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Target Placement *</label>
                                        <select id="dig-placement" onchange="window.handlePlacementChange()" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white focus:border-primary font-medium">
                                            <option value="Left Chest — $15" data-price="15">Left Chest — $15</option>
                                            <option value="Cap / Hat Front — $15" data-price="15">Cap / Hat Front — $15</option>
                                            <option value="Jacket Back / Large — $25" data-price="25">Jacket Back / Large — $25</option>
                                            <option value="Custom Placement" data-price="15">Custom Placement</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Custom Placement Details (Automatically appears when Custom Placement is selected) -->
                                <div id="custom-placement-container" class="hidden">
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Custom Placement Details *</label>
                                    <input type="text" id="dig-custom-placement" placeholder="e.g. patch , visor , apron, tote bag, etc." class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary" />
                                </div>

                                <!-- Fabric Material & Sizing -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Fabric / Garment Material *</label>
                                        <select id="dig-fabric" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white focus:border-primary font-medium">
                                            <option value="Cotton / Pique Knit">Cotton / Pique Knit (Polos, Tees)</option>
                                            <option value="Structured Cap (6-Panel)">Structured Cap (6-Panel, Center-Out)</option>
                                            <option value="Unstructured Cap / Beanie">Unstructured Cap / Beanie (Knit)</option>
                                            <option value="Fleece / Heavy Hoodie">Fleece / Heavy Hoodie</option>
                                            <option value="Denim / Heavy Twill">Denim / Heavy Twill Workwear</option>
                                            <option value="Leather / Patches">Leather / Heavy Substrate</option>
                                            <option value="Other Fabric">Other / General Purpose</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Target Size *</label>
                                        <div class="flex items-center gap-2">
                                            <input type="text" id="dig-size" placeholder="e.g. 4.0 Tall / Wide" oninput="window.validatePlacementSize(); window.calculateAdaptivePrice();" class="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white focus:border-primary" />
                                            <select id="dig-size-unit" onchange="window.validatePlacementSize(); window.calculateAdaptivePrice();" class="w-20 flex-shrink-0 px-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white focus:border-primary font-medium">
                                                <option value="in" selected>in</option>
                                                <option value="cm">cm</option>
                                            </select>
                                        </div>
                                        <div id="dig-size-large-notice" class="hidden text-[11.5px] font-semibold text-[#9a7810] dark:text-primary mt-1.5 flex items-center gap-1.5 transition-all">
                                            <span class="material-symbols-outlined text-sm leading-none shrink-0">info</span>
                                            <span>Large design pricing applied (over 5.5″ wide).</span>
                                        </div>
                                        <div id="dig-size-error" class="hidden text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                                            <span class="material-symbols-outlined text-xs">error</span>
                                            <span id="dig-size-error-text">Please enter a valid size.</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Required Machine Formats (No brand names, DST first) -->
                                <div>
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1.5">Required Machine File Formats *</label>
                                    <div class="flex flex-wrap gap-1.5 sm:gap-2" id="machine-format-chips">
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-primary/10 border border-amber-300 dark:border-primary/30 text-xs font-bold text-amber-900 dark:text-primary cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".DST" checked class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .DST
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".PES" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .PES
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value="EMB" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> EMB
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".OFM" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .OFM
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".EXP" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .EXP
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".JEF" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .JEF
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".VP3" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .VP3
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".CND" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .CND
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-formats" value=".XXX" class="rounded text-primary focus:ring-primary h-3.5 w-3.5" /> .XXX
                                        </label>
                                    </div>
                                </div>

                                <!-- Special Technical Options (Only 3D Puff, Trims Between All Letters, Applique) -->
                                <div>
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1.5">Special Technical Options (Optional)</label>
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/15 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-special" value="3D Puff" class="rounded text-primary focus:ring-primary h-3.5 w-3.5 flex-shrink-0" /> <span class="truncate">3D Puff</span>
                                        </label>
                                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/15 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-special" value="Trims Between All Letters" class="rounded text-primary focus:ring-primary h-3.5 w-3.5 flex-shrink-0" /> <span class="truncate">Trims Between All Letters</span>
                                        </label>
                                        <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-primary/15 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-primary transition-all">
                                            <input type="checkbox" name="dig-special" value="Applique" class="rounded text-primary focus:ring-primary h-3.5 w-3.5 flex-shrink-0" /> <span class="truncate">Applique</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- ================= VECTOR ART FIELDS ================= -->
                            <div id="vector-fields-container" class="hidden space-y-3.5 sm:space-y-4">
                                <!-- Job Name & Output Format -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Job Name / Vector Reference *</label>
                                        <input type="text" id="vec-job-name" placeholder="e.g. Apex Mascot Vector Redraw" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Intended Production Use</label>
                                        <select id="vec-use" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white focus:border-primary font-medium">
                                            <option value="Screen Printing">Screen Printing (Spot Colors)</option>
                                            <option value="Vinyl / Plotter Cutting">Vinyl / Plotter Cutting (Single Line)</option>
                                            <option value="DTG / Sublimation">DTG / Sublimation (Full Color)</option>
                                            <option value="Signage / Laser Engraving">Signage / Laser Engraving</option>
                                            <option value="General Brand Logo">General Brand Logo (Scalable)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Vector Tier -->
                                <div>
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1.5">Artwork Complexity Tier</label>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <label class="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-primary bg-primary/10 cursor-pointer">
                                            <input type="radio" name="vec-plan-choice" value="Simple Vector Redraw" data-price="15" checked onchange="window.calculateAdaptivePrice()" class="text-primary focus:ring-primary h-4 w-4 mt-0.5" />
                                            <div>
                                                <strong class="text-xs font-black text-slate-900 dark:text-white block">Simple Redraw ($15.00)</strong>
                                                <span class="text-[10px] text-slate-500 dark:text-slate-400">Basic shapes, typography, 1-3 flat colors</span>
                                            </div>
                                        </label>
                                        <label class="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-primary">
                                            <input type="radio" name="vec-plan-choice" value="Complex Vector Redraw" data-price="25" onchange="window.calculateAdaptivePrice()" class="text-primary focus:ring-primary h-4 w-4 mt-0.5" />
                                            <div>
                                                <strong class="text-xs font-black text-slate-900 dark:text-white block">Complex Redraw ($25.00)</strong>
                                                <span class="text-[10px] text-slate-500 dark:text-slate-400">Detailed mascot, multi-layer, shield contours</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <!-- Required Vector Formats -->
                                <div>
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1.5">Required Vector Formats *</label>
                                    <div class="flex flex-wrap gap-1.5 sm:gap-2" id="vector-format-chips">
                                        <label class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 text-xs font-bold text-blue-900 dark:text-blue-400 cursor-pointer">
                                            <input type="checkbox" name="vec-formats" value="AI" checked class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" /> Adobe Illustrator (.AI)
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 text-xs font-bold text-blue-900 dark:text-blue-400 cursor-pointer">
                                            <input type="checkbox" name="vec-formats" value="EPS" checked class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" /> Production .EPS
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 text-xs font-bold text-blue-900 dark:text-blue-400 cursor-pointer">
                                            <input type="checkbox" name="vec-formats" value="PDF" checked class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" /> Vector PDF
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input type="checkbox" name="vec-formats" value="SVG" class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" /> Scalable SVG
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/20 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input type="checkbox" name="vec-formats" value="PNG" class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" /> 300 DPI Transparent PNG
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- ================= COMMON FIELDS (Artwork, Notes, Turnaround, Contact) ================= -->
                            <!-- Multi-file Drag & Drop Artwork Upload -->
                            <div>
                                <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Artwork Upload (Drag &amp; Drop or Browse) *</label>
                                <div id="dropzone" onclick="document.getElementById('artwork-file').click()" class="border-2 border-dashed border-slate-300 dark:border-primary/30 hover:border-primary rounded-xl p-3.5 sm:p-5 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/40 transition-all hover:bg-amber-50/20">
                                    <span class="material-symbols-outlined text-amber-700 dark:text-primary text-2xl sm:text-3xl mb-0.5">cloud_upload</span>
                                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Tap to upload or drag artwork file here</p>
                                    <p class="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Supports PNG, JPG, PDF, AI, EPS, SVG, or ZIP (Multiple files supported)</p>
                                    <input type="file" id="artwork-file" onchange="window.handleFileSelected(event)" class="hidden" accept=".ai,.eps,.pdf,.png,.jpg,.jpeg,.svg,.zip,.dst,.emb" multiple />
                                </div>
                                <div id="file-preview-container" class="hidden mt-2 space-y-1.5">
                                    <!-- Populated by JS -->
                                </div>
                            </div>

                            <!-- Notes / Instructions -->
                            <div>
                                <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1" id="order-notes-label">Production Notes / Special Instructions</label>
                                <textarea id="order-notes" rows="2" placeholder="Specific thread colors, underlay preference, color count, or special curve adjustments..." class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary"></textarea>
                            </div>

                            <!-- Turnaround Speed Selection -->
                            <div>
                                <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1.5">Turnaround Speed</label>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                                    <label class="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 border-primary bg-amber-50/40 dark:bg-primary/10 cursor-pointer">
                                        <input type="radio" name="order-turnaround" value="standard" checked onchange="window.calculateAdaptivePrice()" class="text-primary focus:ring-primary h-4 w-4 mt-0.5" />
                                        <div>
                                            <strong class="text-xs font-black text-slate-900 dark:text-white block">Standard Turnaround (12-24 Hours)</strong>
                                            <span class="text-[10px] text-slate-500 dark:text-slate-400">Included at standard pricing</span>
                                        </div>
                                    </label>
                                    <label class="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-primary">
                                        <input type="radio" name="order-turnaround" value="rush" onchange="window.calculateAdaptivePrice()" class="text-primary focus:ring-primary h-4 w-4 mt-0.5" />
                                        <div>
                                            <strong class="text-xs font-black text-slate-900 dark:text-white block flex items-center gap-1">
                                                <span class="material-symbols-outlined text-amber-600 text-xs">bolt</span> ⚡ Rush Service (5-8 Hours)
                                            </strong>
                                            <span class="text-[10px] text-slate-500 dark:text-slate-400">+ $5.00 expedited queue fee</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <!-- SMART CONTACT & DELIVERY BLOCK -->
                            <!-- Rendered for guests; auto-filled for authenticated users -->
                            <div id="modal-contact-section" class="pt-2 border-t border-slate-200 dark:border-primary/15">
                                <div id="modal-guest-contact-fields" class="space-y-2.5">
                                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">Your Delivery Information *</label>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name *</label>
                                            <input type="text" id="order-client-name" placeholder="e.g. Sarah Jenkins" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary" />
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Delivery Email Address *</label>
                                            <input type="email" id="order-client-email" placeholder="name@company.com" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-primary/25 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary" />
                                            <span class="text-[10px] text-slate-500 block mt-0.5">Files &amp; quote proof are sent here directly</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Authenticated user status pill -->
                                <div id="modal-auth-contact-badge" class="hidden p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                                    <div class="flex items-center gap-2 text-xs">
                                        <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">verified_user</span>
                                        <span class="text-slate-700 dark:text-slate-300">Ordering as <strong id="modal-auth-name" class="text-slate-900 dark:text-white">Client</strong> (<span id="modal-auth-email" class="text-slate-600 dark:text-slate-400">client@example.com</span>)</span>
                                    </div>
                                    <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase">Authenticated</span>
                                </div>
                            </div>

                            <!-- Price Summary Bar (Hidden in Quote Mode) -->
                            <div id="order-price-summary-box" class="p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-primary/20 flex items-center justify-between">
                                <div>
                                    <span class="text-[10px] font-bold text-slate-500 uppercase block">Estimated Price</span>
                                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-400" id="order-price-breakdown">Standard Digitizing</span>
                                    <!-- Compatibility test anchors -->
                                    <span id="guest-summary-plan" class="sr-only">Digitizing · Left Chest / Hat</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-xl sm:text-2xl font-black text-amber-800 dark:text-primary" id="order-price-display">$15.00</span>
                                    <span class="text-[10px] font-bold text-slate-400 block">USD</span>
                                    <!-- Compatibility test anchor -->
                                    <span id="guest-summary-price" class="sr-only">$15.00</span>
                                </div>
                            </div>

                            <!-- Order Payment Notice & Options (Hidden in Quote Mode) -->
                            <div id="order-payment-terms-box" class="space-y-3">
                                <div class="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 dark:bg-primary/10 border border-amber-400/30 dark:border-primary/25 flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-2.5 sm:gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-primary/20 text-amber-900 dark:text-primary flex items-center justify-center flex-shrink-0">
                                            <span class="material-symbols-outlined text-lg">credit_card</span>
                                        </div>
                                        <div>
                                            <span class="text-xs font-bold text-slate-900 dark:text-white block">Payment Required to Start Production</span>
                                            <span class="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">All standard orders require payment upfront. Secure instant checkout via Credit Card or PayPal.</span>
                                        </div>
                                    </div>
                                    <div class="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                                        <span class="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">lock</span>
                                        <span>256-Bit SSL</span>
                                    </div>
                                </div>

                                <!-- Payment Method Tabs -->
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" id="modal-tab-card" onclick="window.setModalPaymentMethod('Credit Card')" class="p-2 sm:p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer">
                                        <span class="material-symbols-outlined text-sm text-primary">credit_card</span>
                                        <span>Credit / Debit Card</span>
                                    </button>
                                    <button type="button" id="modal-tab-paypal" onclick="window.setModalPaymentMethod('PayPal')" class="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer">
                                        <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
                                        <span>PayPal</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Quote Mode Notice (Visible ONLY in Quote Mode) -->
                            <div id="quote-mode-info-box" class="hidden p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-950 dark:text-blue-200">
                                <div class="flex items-start gap-2.5 sm:gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-800 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/25">
                                        <span class="material-symbols-outlined text-lg">request_quote</span>
                                    </div>
                                    <div>
                                        <strong class="text-xs font-black block text-blue-950 dark:text-blue-200">100% Free Stitch Appraisal &amp; Estimation</strong>
                                        <p class="text-[10px] sm:text-[11px] text-blue-900/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                                            Submit your design specs and artwork for free. Our senior digitizer will inspect stitch density, small text complexity, and fabric compatibility within 1 hour. Pay only after price approval.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sticky Form Action Buttons -->
                        <div class="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 dark:border-primary/15 bg-white/95 dark:bg-card-dark/95 backdrop-blur-md flex items-center justify-between gap-2 shadow-lg sm:shadow-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            <button type="button" onclick="window.switchOrderServiceChoice()" class="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">arrow_back</span>
                                <span class="hidden xs:inline">Back</span>
                            </button>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="window.closeOrderQuoteModal()" class="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" id="adaptive-order-submit-btn" class="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-background-dark text-xs font-black shadow-md shadow-primary/20 cursor-pointer transition-all flex items-center gap-1.5 flex-shrink-0">
                                    <span class="material-symbols-outlined text-sm" id="order-submit-btn-icon">lock</span>
                                    <span id="order-submit-btn-text">Pay &amp; Place Order ($15.00)</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Setup dropzone listeners
        const dropzone = modal.querySelector('#dropzone');
        if (dropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('border-primary', 'bg-amber-50/40');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('border-primary', 'bg-amber-50/40');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = Array.from(dt?.files || []);
                if (files.length > 0) {
                    files.forEach(f => {
                        if (!state.uploadedFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
                            state.uploadedFiles.push(f);
                        }
                    });
                    renderArtworkFileChips();
                }
            }, false);
        }

        // Live size input listeners for real-time large design pricing calculation
        const sizeInput = modal.querySelector('#dig-size');
        const sizeUnit = modal.querySelector('#dig-size-unit');
        if (sizeInput) {
            sizeInput.addEventListener('input', () => {
                if (typeof window.validatePlacementSize === 'function') window.validatePlacementSize();
                if (typeof window.calculateAdaptivePrice === 'function') window.calculateAdaptivePrice();
            });
        }
        if (sizeUnit) {
            sizeUnit.addEventListener('change', () => {
                if (typeof window.validatePlacementSize === 'function') window.validatePlacementSize();
                if (typeof window.calculateAdaptivePrice === 'function') window.calculateAdaptivePrice();
            });
        }

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Mode switcher: Order Mode vs Quote Mode
     */
    window.setModalMode = function(isQuote) {
        state.isQuote = isQuote;
        const modal = ensureModalElement();

        const tabOrder = modal.querySelector('#modal-mode-order-btn');
        const tabQuote = modal.querySelector('#modal-mode-quote-btn');
        const headerIcon = modal.querySelector('#order-modal-header-icon');
        const headerText = modal.querySelector('#order-modal-header-text');
        const headerDesc = modal.querySelector('#order-modal-header-desc');
        const step2Label = modal.querySelector('#step-label-2');
        const priceBox = modal.querySelector('#order-price-summary-box');
        const termsBox = modal.querySelector('#order-payment-terms-box');
        const quoteBox = modal.querySelector('#quote-mode-info-box');
        const submitBtnIcon = modal.querySelector('#order-submit-btn-icon');
        const submitBtnText = modal.querySelector('#order-submit-btn-text');

        const isFormOpen = modal.querySelector('#order-service-selection-view')?.classList.contains('hidden');

        if (isQuote) {
            if (tabOrder) tabOrder.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer';
            if (tabQuote) tabQuote.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer';

            if (headerIcon) headerIcon.textContent = 'request_quote';
            if (headerText) headerText.textContent = 'Request a Free Quote';
            if (headerDesc) headerDesc.textContent = isFormOpen ? 'Provide specifications for accurate quotation' : 'Choose a service to continue.';
            if (step2Label) step2Label.textContent = 'Quote Details';

            if (priceBox) priceBox.classList.add('hidden');
            if (termsBox) termsBox.classList.add('hidden');
            if (quoteBox) quoteBox.classList.remove('hidden');

            if (submitBtnIcon) submitBtnIcon.textContent = 'send';
            if (submitBtnText) submitBtnText.textContent = 'Submit Free Custom Quote';
        } else {
            if (tabOrder) tabOrder.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-primary text-background-dark shadow-xs cursor-pointer';
            if (tabQuote) tabQuote.className = 'py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 hover:text-primary cursor-pointer';

            if (headerIcon) headerIcon.textContent = 'shopping_cart';
            if (headerText) headerText.textContent = 'Place an Order';
            if (headerDesc) headerDesc.textContent = isFormOpen ? 'Provide specifications to complete your order' : 'Choose a service to continue.';
            if (step2Label) step2Label.textContent = 'Order Details';

            if (priceBox) priceBox.classList.remove('hidden');
            if (termsBox) termsBox.classList.remove('hidden');
            if (quoteBox) quoteBox.classList.add('hidden');

            if (submitBtnIcon) submitBtnIcon.textContent = 'lock';
            window.calculateAdaptivePrice();
        }
    };
    window.setGuestMode = window.setModalMode;

    /**
     * Service selection: Digitizing vs. Vectorizing
     */
    window.selectOrderService = function(service) {
        state.selectedService = service;
        const modal = ensureModalElement();

        const serviceTypeInput = modal.querySelector('#selected-service-type');
        const selectionView = modal.querySelector('#order-service-selection-view');
        const formView = modal.querySelector('#adaptive-order-form');
        const bannerTitle = modal.querySelector('#service-banner-title');
        const bannerIcon = modal.querySelector('#service-banner-icon');
        const digContainer = modal.querySelector('#digitizing-fields-container');
        const vecContainer = modal.querySelector('#vector-fields-container');
        const headerDesc = modal.querySelector('#order-modal-header-desc');

        if (serviceTypeInput) serviceTypeInput.value = service;

        if (service === 'Digitizing') {
            if (bannerTitle) bannerTitle.textContent = 'Embroidery Digitizing';
            if (bannerIcon) bannerIcon.textContent = 'precision_manufacturing';
            if (digContainer) digContainer.classList.remove('hidden');
            if (vecContainer) vecContainer.classList.add('hidden');
        } else {
            if (bannerTitle) bannerTitle.textContent = 'Vector Art Conversion';
            if (bannerIcon) bannerIcon.textContent = 'draw';
            if (digContainer) digContainer.classList.add('hidden');
            if (vecContainer) vecContainer.classList.remove('hidden');
        }

        if (selectionView) selectionView.classList.add('hidden');
        if (formView) formView.classList.remove('hidden');

        // Dynamic Stepper State Transition: Step 1 -> Step 2
        const stepCircle1 = modal.querySelector('#step-circle-1');
        const stepLabel1 = modal.querySelector('#step-label-1');
        const stepConnector = modal.querySelector('#step-connector');
        const stepCircle2 = modal.querySelector('#step-circle-2');
        const stepLabel2 = modal.querySelector('#step-label-2');

        if (stepCircle1) {
            stepCircle1.innerHTML = '<span class="material-symbols-outlined text-sm font-bold">check</span>';
            stepCircle1.className = 'w-8 h-8 rounded-full bg-[#b89218] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs transition-all ring-4 ring-white dark:ring-card-dark';
        }
        if (stepLabel1) {
            stepLabel1.className = 'text-[11px] sm:text-xs font-bold text-[#b89218] mt-1 whitespace-nowrap transition-colors';
        }
        if (stepConnector) {
            stepConnector.className = 'absolute left-8 right-8 top-4 -translate-y-1/2 h-[2px] bg-[#b89218] transition-colors';
        }
        if (stepCircle2) {
            stepCircle2.className = 'w-8 h-8 rounded-full bg-[#b89218] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs transition-all ring-4 ring-white dark:ring-card-dark';
        }
        if (stepLabel2) {
            stepLabel2.className = 'text-[11px] sm:text-xs font-bold text-[#b89218] mt-1 whitespace-nowrap transition-colors';
            stepLabel2.textContent = state.isQuote ? 'Quote Details' : 'Order Details';
        }

        if (headerDesc) {
            headerDesc.textContent = state.isQuote ? 'Provide specifications for accurate quotation' : 'Provide specifications to complete your order';
        }

        window.calculateAdaptivePrice();
    };
    window.selectModalService = window.selectOrderService;

    /**
     * Switch back to service choice view
     */
    window.switchOrderServiceChoice = function() {
        const modal = ensureModalElement();
        const selectionView = modal.querySelector('#order-service-selection-view');
        const formView = modal.querySelector('#adaptive-order-form');
        const headerDesc = modal.querySelector('#order-modal-header-desc');

        if (selectionView) selectionView.classList.remove('hidden');
        if (formView) formView.classList.add('hidden');

        // Dynamic Stepper State Transition: Reset back to Step 1 Active
        const stepCircle1 = modal.querySelector('#step-circle-1');
        const stepLabel1 = modal.querySelector('#step-label-1');
        const stepConnector = modal.querySelector('#step-connector');
        const stepCircle2 = modal.querySelector('#step-circle-2');
        const stepLabel2 = modal.querySelector('#step-label-2');

        if (stepCircle1) {
            stepCircle1.innerHTML = '1';
            stepCircle1.className = 'w-8 h-8 rounded-full bg-[#b89218] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs transition-all ring-4 ring-white dark:ring-card-dark';
        }
        if (stepLabel1) {
            stepLabel1.className = 'text-[11px] sm:text-xs font-bold text-[#b89218] mt-1 whitespace-nowrap transition-colors';
        }
        if (stepConnector) {
            stepConnector.className = 'absolute left-8 right-8 top-4 -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-slate-700 transition-colors';
        }
        if (stepCircle2) {
            stepCircle2.className = 'w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all ring-4 ring-white dark:ring-card-dark';
        }
        if (stepLabel2) {
            stepLabel2.className = 'text-[11px] sm:text-xs font-medium text-slate-400 mt-1 whitespace-nowrap transition-colors';
            stepLabel2.textContent = state.isQuote ? 'Quote Details' : 'Order Details';
        }

        if (headerDesc) {
            headerDesc.textContent = 'Choose a service to continue.';
        }
    };
    window.switchModalServiceChoice = window.switchOrderServiceChoice;

    /**
     * Placement Change Handler
     */
    window.handlePlacementChange = function() {
        const modal = ensureModalElement();
        const placementSelect = modal.querySelector('#dig-placement');
        const customContainer = modal.querySelector('#custom-placement-container');
        const isCustom = placementSelect && placementSelect.value.includes('Custom Placement');

        if (customContainer) {
            if (isCustom) {
                customContainer.classList.remove('hidden');
                modal.querySelector('#dig-custom-placement')?.focus();
            } else {
                customContainer.classList.add('hidden');
            }
        }

        window.validatePlacementSize();
        window.calculateAdaptivePrice();
    };

    /**
     * Parses design size and returns width/dimension in inches.
     * Converts cm to inches (val / 2.54) if unit is cm.
     */
    function getDesignWidthInInches(sizeVal, unitVal) {
        if (!sizeVal) return 0;
        const text = String(sizeVal).toLowerCase().trim();
        if (!text) return 0;

        // Check if user explicitly specified width (e.g., "7 wide", "7w", "w: 7", "7 inches wide")
        const explicitWidthMatch = text.match(/([\d.]+)\s*(?:in|inch|inches|cm)?\s*(?:w\b|wide|width)/) 
            || text.match(/(?:w\b|width|wide)\s*[:=]?\s*([\d.]+)/);

        let rawVal = NaN;
        if (explicitWidthMatch) {
            rawVal = parseFloat(explicitWidthMatch[1]);
        } else {
            const numbers = (text.match(/[\d.]+/g) || []).map(n => parseFloat(n)).filter(n => !isNaN(n));
            if (numbers.length === 1) {
                rawVal = numbers[0];
            } else if (numbers.length > 1) {
                // In embroidery sizing (e.g. 4 x 7 or 7 x 5), if any dimension exceeds 5.5", it requires large hoop/pricing
                rawVal = Math.max(...numbers);
            }
        }

        if (isNaN(rawVal) || rawVal <= 0) return 0;

        // Determine if unit is cm (dropdown selection or typed directly in input)
        const isCm = (unitVal === 'cm') || text.includes('cm');
        return isCm ? (rawVal / 2.54) : rawVal;
    }
    window.getDesignWidthInInches = getDesignWidthInInches;

    /**
     * Size Validation
     * Any size > 5.5" automatically updates to $25 (valid large design).
     * Only non-positive numbers (e.g. <= 0) are flagged as invalid.
     */
    window.validatePlacementSize = function() {
        const modal = ensureModalElement();
        const service = modal.querySelector('#selected-service-type')?.value || 'Digitizing';
        if (service !== 'Digitizing') return true;

        const sizeInput = modal.querySelector('#dig-size');
        const errorEl = modal.querySelector('#dig-size-error');
        const errorText = modal.querySelector('#dig-size-error-text');

        if (!sizeInput) return true;

        const match = (sizeInput.value || '').match(/[\d.]+/);
        const rawVal = match ? parseFloat(match[0]) : parseFloat(sizeInput.value);

        if (!isNaN(rawVal) && rawVal <= 0) {
            if (errorEl) errorEl.classList.remove('hidden');
            if (errorText) errorText.textContent = 'Please enter a valid positive size.';
            sizeInput.classList.add('border-rose-500', 'focus:border-rose-500');
            sizeInput.classList.remove('border-slate-300', 'dark:border-primary/25');
            return false;
        }

        if (errorEl) errorEl.classList.add('hidden');
        sizeInput.classList.remove('border-rose-500', 'focus:border-rose-500');
        sizeInput.classList.add('border-slate-300', 'dark:border-primary/25');
        return true;
    };

    /**
     * Dynamic Price Calculation
     * Rule: If the design is larger than 5.5 inches wide -> automatically change price to $25.
     * Applies to Custom Placement as well as all other placements (Left Chest, Cap, etc.).
     * Returning to 5.5 inches or less restores base price to $15.
     * Shows: "Large design pricing applied (over 5.5″ wide)."
     */
    window.calculateAdaptivePrice = function() {
        const modal = ensureModalElement();
        const service = modal.querySelector('#selected-service-type')?.value || 'Digitizing';
        const priceDisplay = modal.querySelector('#order-price-display');
        const priceBreakdown = modal.querySelector('#order-price-breakdown');
        const submitBtnText = modal.querySelector('#order-submit-btn-text');
        const isRush = modal.querySelector('input[name="order-turnaround"]:checked')?.value === 'rush';

        let basePrice = 15.00;
        let breakdownText = 'Standard Turnaround (12-24h)';

        if (service === 'Digitizing') {
            const placementSelect = modal.querySelector('#dig-placement');
            const selectedOpt = placementSelect?.options[placementSelect.selectedIndex];
            const optPrice = parseFloat(selectedOpt?.getAttribute('data-price') || '15');
            basePrice = optPrice;

            const placementVal = selectedOpt?.value || '';
            const sizeInput = modal.querySelector('#dig-size');
            const unitSelect = modal.querySelector('#dig-size-unit');
            const sizeVal = sizeInput?.value || '';
            const unit = unitSelect?.value || 'in';

            const widthInInches = getDesignWidthInInches(sizeVal, unit);
            const isLargeBySize = widthInInches > 5.5001;
            const isJacketBack = placementVal.includes('Jacket Back') || placementVal.includes('25');

            const largeNotice = modal.querySelector('#dig-size-large-notice');
            if (largeNotice) {
                if (isLargeBySize) {
                    largeNotice.classList.remove('hidden');
                } else {
                    largeNotice.classList.add('hidden');
                }
            }

            if (isLargeBySize || isJacketBack) {
                basePrice = 25.00;
                if (isJacketBack) {
                    breakdownText = 'Jacket Back / Large ($25.00)';
                } else if (placementVal.includes('Cap')) {
                    breakdownText = 'Cap / Hat Front · Large Design ($25.00)';
                } else if (placementVal.includes('Custom')) {
                    breakdownText = 'Custom Placement · Large Design ($25.00)';
                } else {
                    breakdownText = 'Left Chest · Large Design ($25.00)';
                }
            } else {
                basePrice = 15.00;
                if (placementVal.includes('Cap')) {
                    breakdownText = 'Cap / Hat Front ($15.00)';
                } else if (placementVal.includes('Custom')) {
                    breakdownText = 'Custom Placement ($15.00)';
                } else {
                    breakdownText = 'Left Chest ($15.00)';
                }
            }
            // 3D Puff has NO additional charge (+$0)
        } else {
            const largeNotice = modal.querySelector('#dig-size-large-notice');
            if (largeNotice) largeNotice.classList.add('hidden');

            const vecRadio = modal.querySelector('input[name="vec-plan-choice"]:checked');
            const vecPrice = parseFloat(vecRadio?.getAttribute('data-price') || '15');
            basePrice = vecPrice;
            breakdownText = vecRadio?.value || 'Clean Vector Conversion ($15.00)';
        }

        if (isRush) {
            basePrice += 5.00;
            breakdownText += ' + ⚡ Rush Priority (5-8h)';
        }

        state.calculatedPrice = basePrice;

        const formattedPrice = `$${basePrice.toFixed(2)}`;
        if (priceDisplay) priceDisplay.textContent = formattedPrice;
        if (priceBreakdown) priceBreakdown.textContent = breakdownText;

        // Update compatibility anchors
        const guestPriceAnchor = modal.querySelector('#guest-summary-price');
        const guestPlanAnchor = modal.querySelector('#guest-summary-plan');
        if (guestPriceAnchor) guestPriceAnchor.textContent = formattedPrice;
        if (guestPlanAnchor) guestPlanAnchor.textContent = `${service} · ${breakdownText}`;

        if (submitBtnText && !state.isQuote) {
            submitBtnText.textContent = `Pay & Place Order (${formattedPrice})`;
        }

        return basePrice;
    };
    window.calculateModalPrice = window.calculateAdaptivePrice;

    /**
     * File select handler
     */
    window.handleFileSelected = function(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        files.forEach(f => {
            if (!state.uploadedFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
                state.uploadedFiles.push(f);
            }
        });
        renderArtworkFileChips();
    };
    window.handleModalFileSelect = window.handleFileSelected;

    function removeArtworkFile(index) {
        state.uploadedFiles.splice(index, 1);
        renderArtworkFileChips();
    }
    window.removeArtworkFile = removeArtworkFile;
    window.removeModalArtworkFile = removeArtworkFile;

    function renderArtworkFileChips() {
        const modal = ensureModalElement();
        const container = modal.querySelector('#file-preview-container');
        if (!container) return;

        if (state.uploadedFiles.length === 0) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        container.innerHTML = state.uploadedFiles.map((file, idx) => {
            const sizeStr = (file.size / 1024 < 1024) ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;
            return `
                <div class="p-2 rounded-xl bg-emerald-50 dark:bg-primary/10 border border-emerald-300 dark:border-primary/25 text-xs text-emerald-900 dark:text-primary flex items-center justify-between">
                    <div class="flex items-center gap-2 truncate">
                        <span class="material-symbols-outlined text-sm flex-shrink-0">attachment</span>
                        <span class="font-bold truncate">${file.name}</span>
                        <span class="text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">(${sizeStr})</span>
                    </div>
                    <button type="button" onclick="window.removeArtworkFile(${idx})" class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer flex-shrink-0" title="Remove file">
                        <span class="material-symbols-outlined text-xs">close</span>
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Payment method selection
     */
    window.setModalPaymentMethod = function(method) {
        state.paymentMethod = method;
        const modal = ensureModalElement();
        const tabCard = modal.querySelector('#modal-tab-card');
        const tabPaypal = modal.querySelector('#modal-tab-paypal');
        if (method === 'PayPal') {
            if (tabPaypal) tabPaypal.className = 'p-2 sm:p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer';
            if (tabCard) tabCard.className = 'p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer';
        } else {
            if (tabCard) tabCard.className = 'p-2 sm:p-2.5 rounded-xl border-2 border-primary bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white cursor-pointer';
            if (tabPaypal) tabPaypal.className = 'p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-400 cursor-pointer';
        }
    };

    /**
     * Open Modal Controller
     */
    window.openOrderQuoteModal = function(options = {}) {
        const modal = ensureModalElement();
        const isQuote = !!options.isQuote;
        window.setModalMode(isQuote);

        // Session check & contact block update
        const session = getSession();
        if (session && (session.role === 'admin' || session.role === 'digitizer')) {
            if (typeof window.showStaffOrderBlockModal === 'function') {
                window.showStaffOrderBlockModal(session.role, session.email);
            } else {
                alert("You can't place orders from this account.");
            }
            return;
        }

        const guestBlock = modal.querySelector('#modal-guest-contact-fields');
        const authBadge = modal.querySelector('#modal-auth-contact-badge');
        const clientNameInput = modal.querySelector('#order-client-name');
        const clientEmailInput = modal.querySelector('#order-client-email');

        if (session && session.email) {
            if (guestBlock) guestBlock.classList.add('hidden');
            if (authBadge) authBadge.classList.remove('hidden');
            const authName = modal.querySelector('#modal-auth-name');
            const authEmail = modal.querySelector('#modal-auth-email');
            if (authName) authName.textContent = session.full_name || session.name || 'Client';
            if (authEmail) authEmail.textContent = session.email;
            if (clientNameInput) clientNameInput.value = session.full_name || session.name || 'Client';
            if (clientEmailInput) clientEmailInput.value = session.email;
        } else {
            if (guestBlock) guestBlock.classList.remove('hidden');
            if (authBadge) authBadge.classList.add('hidden');
        }

        // Service & Plan determination
        const rawService = (options.service || '').toLowerCase();
        const isVector = rawService.includes('vector');
        const targetService = isVector ? 'Vectorizing' : 'Digitizing';
        const plan = options.plan || '';

        if (options.service || options.plan) {
            window.selectOrderService(targetService);
            
            if (targetService === 'Digitizing') {
                const placementSelect = modal.querySelector('#dig-placement');
                if (placementSelect && plan) {
                    const lowerPlan = plan.toLowerCase();
                    for (let i = 0; i < placementSelect.options.length; i++) {
                        const opt = placementSelect.options[i];
                        const lowerOpt = opt.value.toLowerCase();
                        if (lowerOpt.includes(lowerPlan) || lowerPlan.includes(lowerOpt) ||
                           (lowerPlan.includes('larger') && lowerOpt.includes('larger')) ||
                           (lowerPlan.includes('jacket') && lowerOpt.includes('jacket')) ||
                           (lowerPlan.includes('hat') && lowerOpt.includes('cap')) ||
                           (lowerPlan.includes('cap') && lowerOpt.includes('cap'))) {
                            placementSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                if (typeof window.handlePlacementChange === 'function') {
                    window.handlePlacementChange();
                }
            } else {
                const isComplex = plan.toLowerCase().includes('complex');
                const radio = modal.querySelector(`input[name="vec-plan-choice"][value="${isComplex ? 'Complex Vector Redraw' : 'Simple Vector Redraw'}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            window.switchOrderServiceChoice();
        }

        state.uploadedFiles = [];
        renderArtworkFileChips();
        window.calculateAdaptivePrice();

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        const guestWrap = modal.querySelector('#guest-checkout-modal');
        if (guestWrap) {
            guestWrap.classList.remove('hidden');
            guestWrap.style.display = 'flex';
        }
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const firstInput = targetService === 'Digitizing' ? modal.querySelector('#dig-job-name') : modal.querySelector('#vec-job-name');
            if (firstInput && !modal.querySelector('#order-service-selection-view:not(.hidden)')) {
                firstInput.focus();
            }
        }, 120);
    };

    // Global Public Aliases
    window.openNewOrderModal = function(options = {}) {
        if (typeof options === 'string') options = { plan: options };
        options.isQuote = false;
        window.openOrderQuoteModal(options);
    };

    window.openNewQuoteModal = function(options = {}) {
        if (typeof options === 'string') options = { plan: options };
        options.isQuote = true;
        window.openOrderQuoteModal(options);
    };

    window.openGuestCheckoutModal = function(options = {}) {
        window.openOrderQuoteModal(options);
    };

    window.openRequestQuoteModal = function(options = {}) {
        window.openNewQuoteModal(options);
    };

    window.openQuoteModal = function(options = {}) {
        window.openNewQuoteModal(options);
    };

    window.closeOrderQuoteModal = function() {
        const modal = document.getElementById('new-order-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            const guestWrap = modal.querySelector('#guest-checkout-modal');
            if (guestWrap) {
                guestWrap.classList.add('hidden');
                guestWrap.style.display = 'none';
            }
            document.body.style.overflow = '';
        }
    };
    window.closeNewOrderModal = window.closeOrderQuoteModal;
    window.closeGuestCheckoutModal = window.closeOrderQuoteModal;

    // Keyboard ESC listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeOrderQuoteModal();
        }
    });

    /**
     * Unified Submission Engine
     */
    window.handleAdaptiveOrderSubmit = async function(e) {
        if (e) e.preventDefault();
        const modal = ensureModalElement();
        if (state.isSubmitting) return;

        const submitBtn = modal.querySelector('#adaptive-order-submit-btn');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

        const serviceType = modal.querySelector('#selected-service-type')?.value || 'Digitizing';
        let projectName = '';
        let placement = 'Standard';
        let fabricType = 'Cotton / Pique Knit';
        let sizing = 'Standard';
        let fileFormat = 'DST, EMB';
        let specialOptions = [];

        if (serviceType === 'Digitizing') {
            projectName = (modal.querySelector('#dig-job-name')?.value || '').trim();
            if (!projectName) {
                alert('Please provide a Job Name / Reference.');
                modal.querySelector('#dig-job-name')?.focus();
                return;
            }

            const rawPlacement = modal.querySelector('#dig-placement')?.value || 'Left Chest — $15';
            if (rawPlacement.includes('Custom')) {
                const customVal = (modal.querySelector('#dig-custom-placement')?.value || '').trim();
                if (!customVal) {
                    alert('Please specify your Custom Placement Details (e.g. patch, visor, apron, tote bag, etc.).');
                    modal.querySelector('#dig-custom-placement')?.focus();
                    return;
                }
                placement = `Custom Placement: ${customVal}`;
            } else {
                placement = rawPlacement.split('—')[0].trim();
            }

            fabricType = modal.querySelector('#dig-fabric')?.value || 'Cotton / Pique Knit';

            // Validate target size (ensures positive size if entered)
            const isSizeValid = window.validatePlacementSize();
            if (!isSizeValid) {
                alert('Please enter a valid positive target size.');
                modal.querySelector('#dig-size')?.focus();
                return;
            }

            const sizeVal = (modal.querySelector('#dig-size')?.value || '').trim();
            const unit = modal.querySelector('#dig-size-unit')?.value || 'in';
            sizing = sizeVal ? (sizeVal.toLowerCase().includes(unit.toLowerCase()) ? sizeVal : `${sizeVal} ${unit}`) : 'Standard';

            const checkedFormats = Array.from(modal.querySelectorAll('input[name="dig-formats"]:checked')).map(cb => cb.value);
            fileFormat = checkedFormats.length > 0 ? checkedFormats.join(', ') : '.DST';
            specialOptions = Array.from(modal.querySelectorAll('input[name="dig-special"]:checked')).map(cb => cb.value);
        } else {
            projectName = (modal.querySelector('#vec-job-name')?.value || '').trim();
            if (!projectName) {
                alert('Please provide a Job Name / Reference for your vector artwork.');
                modal.querySelector('#vec-job-name')?.focus();
                return;
            }
            placement = modal.querySelector('#vec-use')?.value || 'Screen Printing';
            fabricType = 'Vector Scalable';
            sizing = 'Resolution Independent Vector';
            const checkedVecFormats = Array.from(modal.querySelectorAll('input[name="vec-formats"]:checked')).map(cb => cb.value);
            fileFormat = checkedVecFormats.length > 0 ? checkedVecFormats.join(', ') : 'AI, EPS, PDF';
        }

        const instructions = (modal.querySelector('#order-notes')?.value || '').trim();
        const turnaroundSpeed = modal.querySelector('input[name="order-turnaround"]:checked')?.value || 'standard';
        const isQuote = state.isQuote;

        // Contact info handling
        const session = getSession();
        if (session && (session.role === 'admin' || session.role === 'digitizer')) {
            if (typeof window.showStaffOrderBlockModal === 'function') {
                window.showStaffOrderBlockModal(session.role, session.email);
            } else {
                alert("You can't place orders from this account.");
            }
            return;
        }

        let clientName = session?.full_name || session?.name || '';
        let clientEmail = session?.email || '';

        if (!clientEmail) {
            clientName = (modal.querySelector('#order-client-name')?.value || '').trim();
            clientEmail = (modal.querySelector('#order-client-email')?.value || '').trim();

            const normalizedEmail = clientEmail.toLowerCase();
            if (normalizedEmail === 'admin@dezandigitizing.com' || normalizedEmail === 'digitizer@dezandigitizing.com') {
                if (typeof window.showStaffOrderBlockModal === 'function') {
                    window.showStaffOrderBlockModal(normalizedEmail.includes('digitizer') ? 'digitizer' : 'admin', clientEmail);
                } else {
                    alert("You can't place orders from this account.");
                }
                return;
            }

            if (!clientName) {
                alert('Please enter your full name.');
                modal.querySelector('#order-client-name')?.focus();
                return;
            }
            if (!clientEmail || !clientEmail.includes('@')) {
                alert('Please provide a valid delivery email address.');
                modal.querySelector('#order-client-email')?.focus();
                return;
            }
        }

        state.isSubmitting = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> ${isQuote ? 'Submitting Quote Request...' : 'Placing Order & Uploading...'}`;
        }

        // Upload files to InsForge Storage
        let rawArtworkFiles = [];
        try {
            if (state.uploadedFiles.length > 0) {
                for (const file of state.uploadedFiles) {
                    if (window.insforgeClient && typeof window.insforgeClient.uploadFile === 'function') {
                        try {
                            const uploaded = await window.insforgeClient.uploadFile('artworks', file);
                            rawArtworkFiles.push({
                                name: uploaded.name || file.name,
                                url: uploaded.url,
                                key: uploaded.key,
                                size: uploaded.size || file.size,
                                mimeType: uploaded.mimeType
                            });
                        } catch (upErr) {
                            console.warn('Storage upload fallback:', upErr);
                            rawArtworkFiles.push({
                                name: file.name,
                                url: 'logo.png',
                                size: file.size
                            });
                        }
                    } else {
                        rawArtworkFiles.push({
                            name: file.name,
                            url: 'logo.png',
                            size: file.size
                        });
                    }
                }
            } else {
                rawArtworkFiles.push({
                    name: 'sample_artwork_upload.png',
                    url: 'logo.png',
                    size: 104000
                });
            }
        } catch (fileErr) {
            console.warn('File preparation error:', fileErr);
        }

        const calculatedPrice = isQuote ? 0 : window.calculateAdaptivePrice();
        const planName = isQuote 
            ? `${serviceType === 'Digitizing' ? 'Digitizing' : 'Vector'} Quote - ${placement}`
            : `${serviceType === 'Digitizing' ? 'Embroidery' : 'Vector'} - ${placement}`;

        const combinedInstructions = [
            `Sizing: ${sizing}`,
            `Fabric: ${fabricType}`,
            specialOptions.length > 0 ? `Special: ${specialOptions.join(', ')}` : '',
            instructions ? `Notes: ${instructions}` : ''
        ].filter(Boolean).join('\n');

        const orderPayload = {
            isQuote: isQuote,
            is_quote: isQuote,
            status: isQuote ? 'quote_requested' : 'pending_review',
            serviceType: serviceType === 'Digitizing' ? 'Digitizing' : 'Vectorizing',
            planName: planName,
            projectName: projectName,
            placement: placement,
            fabricType: fabricType,
            sizing: sizing,
            fileFormat: fileFormat,
            specialOptions: specialOptions,
            turnaroundSpeed: turnaroundSpeed,
            instructions: combinedInstructions,
            rawArtworkFiles: rawArtworkFiles,
            price: isQuote ? null : calculatedPrice,
            amount: calculatedPrice,
            paymentStatus: isQuote ? 'unpaid' : 'paid',
            paymentMethod: isQuote ? 'Quote Request' : state.paymentMethod,
            clientName: clientName,
            clientEmail: clientEmail,
            clientId: session?.id || session?.userId || null
        };

        try {
            let createdRecord = null;
            if (window.insforgeClient && typeof window.insforgeClient.createOrder === 'function') {
                createdRecord = await window.insforgeClient.createOrder(orderPayload);
            } else {
                const orderNum = (isQuote ? 'QUO-' : 'DZ-') + Math.floor(1000 + Math.random() * 9000);
                createdRecord = {
                    id: (isQuote ? 'quo_' : 'ord_') + Date.now(),
                    order_number: orderNum,
                    ...orderPayload,
                    created_at: new Date().toISOString()
                };
                try {
                    const localOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                    localOrders.unshift(createdRecord);
                    localStorage.setItem('dezan_orders', JSON.stringify(localOrders));
                } catch (e) {}
            }

            // Realtime sync broadcast
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel('dezan_realtime_sync');
                    channel.postMessage({
                        type: 'order_created',
                        order: createdRecord,
                        timestamp: Date.now()
                    });
                    channel.close();
                }
            } catch (e) {}

            window.closeOrderQuoteModal();
            modal.querySelector('#adaptive-order-form')?.reset();
            state.uploadedFiles = [];
            state.isSubmitting = false;

            // Context-specific redirection or in-place update
            const isClientWorkspace = typeof window.clientWorkspace !== 'undefined' || 
                                     document.body.dataset.clientPage !== undefined ||
                                     window.location.pathname.includes('client-');

            if (isClientWorkspace) {
                if (window.insforgeClient && typeof window.insforgeClient.showToast === 'function') {
                    window.insforgeClient.showToast(
                        isQuote ? 'Quote Requested' : 'Order Placed Successfully',
                        `Ticket #${createdRecord.order_number} has been recorded.`,
                        isQuote ? 'request_quote' : 'check_circle',
                        'success'
                    );
                }

                if (window.clientWorkspace && typeof window.clientWorkspace.loadOrders === 'function') {
                    await window.clientWorkspace.loadOrders();
                } else if (typeof renderOrders === 'function') {
                    await renderOrders();
                }
            } else {
                const query = new URLSearchParams({
                    orderId: createdRecord.order_number || createdRecord.id,
                    service: serviceType,
                    plan: planName,
                    project: projectName,
                    email: clientEmail,
                    amount: calculatedPrice.toFixed(2),
                    type: isQuote ? 'quote' : 'order'
                });
                window.location.href = `order-success.html?${query.toString()}`;
            }

        } catch (err) {
            console.error('Submission error:', err);
            alert('Could not submit. Please check your connection and try again.');
        } finally {
            state.isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    };
    window.handleModalSubmit = window.handleAdaptiveOrderSubmit;

    // Auto-mount modal on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureModalElement);
    } else {
        ensureModalElement();
    }
})();
