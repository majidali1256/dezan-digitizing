/**
 * Dezan Digitizing — Shared JavaScript
 * Theme toggle, scroll reveal, active navigation, order system,
 * PayPal payment, and EmailJS notification
 */

document.addEventListener("DOMContentLoaded", () => {

    // ===== ADAPTIVE ENVIRONMENT ROUTING (LOCAL ONLY) =====
    // If running locally, rewrite actions pointing to process_form.php back to Web3Forms
    // so the user can test email delivery and uploads without a local PHP server.
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    if (isLocal) {
        document.querySelectorAll('form[action="process_form.php"]').forEach(form => {
            form.setAttribute("action", "https://api.web3forms.com/submit");
        });
    }

    // ===== THEME TOGGLE =====
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    // Apply saved theme or default to light
    if (savedTheme === "dark") {
        html.classList.add("dark");
    } else {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }

    // Update all theme toggle icons
    function updateThemeIcons() {
        const isDark = html.classList.contains("dark");
        document.querySelectorAll(".theme-toggle-icon").forEach(icon => {
            icon.textContent = isDark ? "light_mode" : "dark_mode";
        });
    }
    updateThemeIcons();

    // Bind click to all toggle buttons
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            html.classList.toggle("dark");
            const isDark = html.classList.contains("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
            updateThemeIcons();
        });
    });

    // ===== DYNAMIC HEADER AUTH STATE (LOGIN BUTTON vs PREVIOUS ACCOUNT ICON) =====
    function initHeaderAuthState() {
        const slots = document.querySelectorAll('#header-auth-slot, .header-auth-slot');
        if (!slots.length) return;        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (e) {
            session = null;
        }

        slots.forEach(slot => {
            if (session && session.role) {
                // Logged in: show previous account_circle icon!
                let dashboardUrl = 'client-portal.html';
                if (session.role === 'admin') dashboardUrl = 'admin-portal.html';
                else if (session.role === 'digitizer') dashboardUrl = 'worker-portal.html';

                slot.innerHTML = `
                    <div class="relative">
                        <button id="user-header-btn" class="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-slate-800 dark:text-primary hover:bg-primary/30 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer" title="${session.displayName || 'My Account'}">
                            <span class="material-symbols-outlined text-xl">account_circle</span>
                        </button>
                        <div id="user-header-menu" class="hidden absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-primary/20 shadow-xl py-2 z-50 transition-all text-xs">
                            <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                <p class="font-bold text-slate-900 dark:text-white truncate">${session.displayName || 'User'}</p>
                                <p class="text-[11px] text-slate-500 truncate">${session.email || ''}</p>
                                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/15 text-slate-900 dark:text-primary">${session.role}</span>
                            </div>
                            <a href="${dashboardUrl}" class="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors font-semibold">
                                <span class="material-symbols-outlined text-base">dashboard</span>
                                <span>Go to Dashboard</span>
                            </a>
                            <button id="header-signout-btn" class="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold text-left">
                                <span class="material-symbols-outlined text-base">logout</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                `;

                const btn = slot.querySelector('#user-header-btn');
                const menu = slot.querySelector('#user-header-menu');
                if (btn && menu) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        menu.classList.toggle('hidden');
                    });
                }

                const signOutBtn = slot.querySelector('#header-signout-btn');
                if (signOutBtn) {
                    signOutBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('dezan_session');
                        if (typeof localStorage !== 'undefined') localStorage.removeItem('dezan_session');
                        initHeaderAuthState();
                        if (window.location.pathname.includes('-portal.html')) {
                            window.location.href = 'portal-login.html';
                        }
                    });
                } 
            } else {
                // Logged out: show Login button!
                slot.innerHTML = `
                    <a href="portal-login.html" class="header-login-btn px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/15 hover:bg-primary hover:text-background-dark dark:hover:bg-primary dark:hover:text-background-dark text-primary border border-primary/25 dark:border-primary/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm">
                        <span class="material-symbols-outlined text-sm">login</span>
                        <span>Login</span>
                    </a>
                `;
            }
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
        document.querySelectorAll('#user-header-menu').forEach(menu => {
            if (!menu.contains(e.target) && !menu.previousElementSibling?.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    });

    // Listen for storage changes across tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'dezan_session') {
            initHeaderAuthState();
        }
    });

    initHeaderAuthState();

    // ===== GLOBAL AUTHENTICATED ORDER & QUOTE DISPATCHER =====
    // Directs unauthenticated users to portal-login.html before ordering or requesting quotes.
    // Directs authenticated clients directly to client-portal.html?action=new_order or action=request_quote
    window.handleOrderClick = function(e, service = null, plan = null) {
        if (e && e.preventDefault) e.preventDefault();

        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (err) {
            session = null;
        }

        if (session && session.role) {
            // User is already logged in
            if (session.role === 'client') {
                let url = 'client-portal.html?action=new_order';
                if (service) url += `&service=${encodeURIComponent(service)}`;
                if (plan) url += `&plan=${encodeURIComponent(plan)}`;
                window.location.href = url;
            } else if (session.role === 'admin') {
                window.location.href = 'admin-portal.html';
            } else if (session.role === 'digitizer') {
                window.location.href = 'worker-portal.html';
            }
        } else {
            // User is NOT logged in: redirect to login page so they log in before ordering
            let url = 'portal-login.html?redirect=new_order';
            if (service) url += `&service=${encodeURIComponent(service)}`;
            if (plan) url += `&plan=${encodeURIComponent(plan)}`;
            window.location.href = url;
        }
    };

    window.handleQuoteClick = function(e, service = null) {
        if (e && e.preventDefault) e.preventDefault();

        let session = null;
        try {
            const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                        (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
            if (raw) session = JSON.parse(raw);
        } catch (err) {
            session = null;
        }

        if (session && session.role) {
            if (session.role === 'client') {
                let url = 'client-portal.html?action=request_quote';
                if (service) url += `&service=${encodeURIComponent(service)}`;
                window.location.href = url;
            } else if (session.role === 'admin') {
                window.location.href = 'admin-portal.html';
            } else if (session.role === 'digitizer') {
                window.location.href = 'worker-portal.html';
            }
        } else {
            let url = 'portal-login.html?redirect=request_quote';
            if (service) url += `&service=${encodeURIComponent(service)}`;
            window.location.href = url;
        }
    };

    // Global click listener to intercept any "Order Now" / "Place Order" or Quote links
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;

        // Elements explicitly tagged with data-action="order-now"
        if (target.getAttribute('data-action') === 'order-now') {
            e.preventDefault();
            const service = target.getAttribute('data-service');
            const plan = target.getAttribute('data-plan');
            window.handleOrderClick(e, service, plan);
            return;
        }

        // Elements explicitly tagged with data-action="request-quote"
        if (target.getAttribute('data-action') === 'request-quote') {
            e.preventDefault();
            const service = target.getAttribute('data-service');
            window.handleQuoteClick(e, service);
            return;
        }

        // Links leading to pricing.html#order-section
        const href = target.getAttribute('href');
        if (href && (href === 'pricing.html#order-section' || href.endsWith('/pricing.html#order-section'))) {
            e.preventDefault();
            window.handleOrderClick(e);
            return;
        }

        // Links leading to contact.html#custom-quote-section or #custom-quote-section
        if (href && (href === 'contact.html#custom-quote-section' || href.endsWith('/contact.html#custom-quote-section') || href === '#custom-quote-section')) {
            e.preventDefault();
            window.handleQuoteClick(e);
            return;
        }
    });


    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length > 0) {
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: "150px 0px 150px 0px", threshold: 0.01 });
            revealElements.forEach(el => observer.observe(el));
            // Safety fallback so content never gets stuck invisible
            setTimeout(() => {
                revealElements.forEach(el => el.classList.add("revealed"));
            }, 1000);
        } else {
            revealElements.forEach(el => el.classList.add("revealed"));
        }
    }


    // ===== ACTIVE NAVIGATION STATE =====
    // Detect current page from the URL
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";

    // Highlight active link in desktop header nav
    document.querySelectorAll("nav a[data-nav]").forEach(link => {
        const linkPage = link.getAttribute("data-nav");
        if (linkPage === currentPage) {
            link.classList.add("text-primary");
            link.classList.remove("hover:text-primary");
        }
    });

    // Highlight active link in bottom mobile nav
    document.querySelectorAll("a[data-page]").forEach(link => {
        const linkPage = link.getAttribute("data-page");
        if (linkPage === currentPage) {
            link.classList.remove("text-slate-400");
            link.classList.add("text-primary");
        }
    });


    // ===================================================================
    //  ORDER SYSTEM (pricing.html only)
    // ===================================================================
    if (currentPage === "pricing.html" || currentPage === "pricing") {
        initOrderSystem();
    }

    // ===================================================================
    //  ORDER SUCCESS PAGE (order-success.html only)
    // ===================================================================
    if (currentPage === "order-success.html" || currentPage === "order-success") {
        initSuccessPage();
    }
    
    // ===================================================================
    //  LIGHTBOX FOR FEEDBACK IMAGES
    // ===================================================================
    initLightbox();
    initFeedbackSlider();

    // ===================================================================
    if (document.getElementById('hero-compare-slider')) {
        initCompareSlider();
    }

    initStickyHeader();
    initFileUploads();
    initInteractiveElements();
});

// ===================================================================
// FILE UPLOAD SYSTEM
// ===================================================================
function initFileUploads() {
    // Reusable Multi-File Uploader Setup
    function setupMultiUploader(containerId, formId, inputPrefix = "attachment") {
        const container = document.getElementById(containerId);
        const form = document.getElementById(formId);
        if (!container || !form) return;

        const dropZone = container.querySelector(".upload-zone");
        const rawInput = container.querySelector(".raw-file-input");
        const fileListContainer = container.querySelector(".file-list");
        if (!dropZone || !rawInput || !fileListContainer) return;

        let filesArray = [];
        let isSubmitting = false;

        // Ensure form supports multipart/form-data for files
        form.setAttribute("enctype", "multipart/form-data");

        // Click on drop zone opens file picker
        dropZone.addEventListener("click", () => {
            rawInput.click();
        });

        // Prevent click events on input from bubbling up to dropZone
        rawInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Drag and drop listeners
        ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ["dragenter", "dragover"].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add("border-primary", "bg-primary/10", "scale-[1.01]");
            }, false);
        });

        ["dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove("border-primary", "bg-primary/10", "scale-[1.01]");
            }, false);
        });

        dropZone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files.length > 0) {
                handleFiles(Array.from(dt.files));
            }
        });

        rawInput.addEventListener("change", () => {
            if (rawInput.files.length > 0) {
                handleFiles(Array.from(rawInput.files));
                rawInput.value = ""; // Clear value so same file can be chosen again
            }
        });

        function handleFiles(newFiles) {
            newFiles.forEach(file => {
                // Size validation: max 10MB (10 * 1024 * 1024 bytes)
                if (file.size > 10 * 1024 * 1024) {
                    alert(`File "${file.name}" is too large. Max file size is 10MB.`);
                    return;
                }

                // Duplicate check
                const isDuplicate = filesArray.some(f => f.name === file.name && f.size === file.size);
                if (isDuplicate) return;

                // Max limit check: 5 files
                if (filesArray.length >= 5) {
                    alert("You can upload a maximum of 5 artwork files.");
                    return;
                }

                filesArray.push(file);
            });

            updateUI();
            updateFormInputs();
        }

        function removeFile(index) {
            filesArray.splice(index, 1);
            updateUI();
            updateFormInputs();
        }

        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
                return 'image';
            }
            if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
                return 'folder_zip';
            }
            if (['pdf'].includes(ext)) {
                return 'picture_as_pdf';
            }
            if (['dst', 'pes', 'exp', 'ofm', 'jef', 'hus', 'vip', 'vp3', 'xxx'].includes(ext)) {
                return 'architecture';
            }
            return 'description';
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        function updateUI() {
            if (filesArray.length === 0) {
                fileListContainer.classList.add("hidden");
                fileListContainer.innerHTML = "";
                return;
            }

            fileListContainer.classList.remove("hidden");
            fileListContainer.innerHTML = "";

            filesArray.forEach((file, index) => {
                const icon = getFileIcon(file.name);
                const sizeStr = formatBytes(file.size);

                const fileItem = document.createElement("div");
                fileItem.className = "flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/80 border border-primary/10 rounded-xl text-left hover:border-primary/30 transition-all animate-fade-in";
                fileItem.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden pr-2">
                        <span class="material-symbols-outlined text-primary text-2xl flex-shrink-0">${icon}</span>
                        <div class="overflow-hidden">
                            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">${file.name}</p>
                            <p class="text-xs text-slate-400 dark:text-slate-500">${sizeStr}</p>
                        </div>
                    </div>
                    <button type="button" class="remove-btn p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                `;

                fileItem.querySelector(".remove-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeFile(index);
                });

                fileListContainer.appendChild(fileItem);
            });
        }

        function updateFormInputs() {
            // Remove existing dynamic inputs in this form
            const existingInputs = form.querySelectorAll(`.dynamic-${containerId}-input`);
            existingInputs.forEach(input => input.remove());

            const action = form.getAttribute("action") || "";
            const isWeb3Forms = action.includes("web3forms.com");

            // Create and append a hidden input for each file
            filesArray.forEach((file, index) => {
                const dynamicInput = document.createElement("input");
                dynamicInput.type = "file";
                dynamicInput.name = isWeb3Forms ? `${inputPrefix}${index + 1}` : `${inputPrefix}[]`;
                dynamicInput.className = `dynamic-${containerId}-input hidden`;

                const dt = new DataTransfer();
                dt.items.add(file);
                dynamicInput.files = dt.files;

                form.appendChild(dynamicInput);
            });
        }

        // Intercept form submission to upload files via CORS first
        form.addEventListener("submit", async (e) => {
            const action = form.getAttribute("action") || "";
            const isWeb3Forms = action.includes("web3forms.com");
            if (!isWeb3Forms) {
                // If it's a native submit (PHP process_form.php), let it proceed natively with files
                return;
            }

            if (isSubmitting) return;
            if (filesArray.length === 0) return; // Native submit without attachments is allowed on free tier

            e.preventDefault();
            isSubmitting = true;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;

            const uploadUrls = [];

            try {
                for (let i = 0; i < filesArray.length; i++) {
                    const file = filesArray[i];
                    submitBtn.innerHTML = `
                        <span class="inline-block animate-spin mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4"></span>
                        Uploading File ${i + 1}/${filesArray.length}...
                    `;

                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("expire", "172800"); // 48 hours

                    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
                        method: "POST",
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`Upload failed with status ${response.status}`);
                    }

                    const json = await response.json();
                    if (json.status !== "success" || !json.data || !json.data.url) {
                        throw new Error("Invalid response from upload service");
                    }

                    // Convert to direct download link
                    const directUrl = json.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");
                    uploadUrls.push(directUrl);
                }

                submitBtn.innerHTML = `
                    <span class="inline-block animate-spin mr-2 border-2 border-current border-t-transparent rounded-full w-4 h-4"></span>
                    Submitting Request...
                `;

                // Remove file fields from form to bypass Web3Forms file upload (Pro feature) check
                const fileInputs = form.querySelectorAll(`.dynamic-${containerId}-input`);
                fileInputs.forEach(input => input.remove());

                if (rawInput) {
                    rawInput.removeAttribute("name");
                }

                // Add links as hidden text inputs
                uploadUrls.forEach((url, index) => {
                    const urlInput = document.createElement("input");
                    urlInput.type = "hidden";
                    urlInput.name = `Artwork_File_${index + 1}_Link`;
                    urlInput.className = `dynamic-${containerId}-input`;
                    urlInput.value = url;
                    form.appendChild(urlInput);
                });

                const countInput = document.createElement("input");
                countInput.type = "hidden";
                countInput.name = "Total_Artwork_Files";
                countInput.className = `dynamic-${containerId}-input`;
                countInput.value = filesArray.length;
                form.appendChild(countInput);

                // Submit form natively
                form.submit();

            } catch (error) {
                console.error("Submission error:", error);
                alert(`Upload failed: ${error.message}. Please try again, or submit the form without files and email them to fdezan91@gmail.com.`);
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }

    // Initialize both uploaders
    setupMultiUploader("quote-upload-container", "quote-form", "attachment");
    setupMultiUploader("order-upload-container", "order-form", "attachment");
}

// ===== STICKY HEADER LOGIC =====
function initStickyHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });
}

// ===================================================================
//  BEFORE / AFTER COMPARISON SLIDER
// ===================================================================
function initCompareSlider() {
    const slider = document.getElementById('hero-compare-slider');
    const beforeDiv = document.getElementById('compare-before');
    const divider = document.getElementById('compare-divider');
    const beforeImg = beforeDiv.querySelector('img');
    if (!slider || !beforeDiv || !divider) return;

    // Keep the before image sized to the full container width and height
    function syncBeforeImageWidth() {
        if (!slider || !beforeImg) return;
        beforeImg.style.width = slider.offsetWidth + 'px';
        beforeImg.style.height = slider.offsetHeight + 'px';
        beforeImg.style.minWidth = slider.offsetWidth + 'px';
    }
    syncBeforeImageWidth();
    window.addEventListener('resize', syncBeforeImageWidth);

    let isDragging = false;

    function updateSlider(clientX) {
        const rect = slider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;
        beforeDiv.style.width = pct + '%';
        divider.style.left = pct + '%';
    }

    // Mouse events
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e.clientX);
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    });
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events
    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateSlider(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

//  LIGHTBOX FUNCTIONALITY
// ===================================================================
function initLightbox() {
    const feedbackImages = document.querySelectorAll('.marquee-item, .carousel-track img, .portfolio-card img, #feedback-slide-track img, .columns-1 img');
    if (feedbackImages.length === 0) return;

    // Create lightbox HTML structure
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    
    const imgEl = document.createElement('img');
    imgEl.className = 'lightbox-image';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    
    overlay.appendChild(imgEl);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    // Open lightbox (using pointerdown because CSS animation moves the element, breaking 'click')
    feedbackImages.forEach(img => {
        img.addEventListener('pointerdown', (e) => {
            // Ignore right-clicks
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            
            imgEl.src = img.src;
            overlay.style.display = 'flex';
            // Force reflow for transition
            overlay.offsetHeight;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close lightbox
    function closeLightbox() {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300); // Matches CSS transition duration
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeLightbox();
        }
    });
}


// ===================================================================
//  GLOBAL — Plan Selection (called from onclick in pricing.html)
// ===================================================================
function selectPlan(planName, price) {
    let session = null;
    try {
        const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (raw) session = JSON.parse(raw);
    } catch (err) {
        session = null;
    }

    const service = planName.toLowerCase().includes('vector') ? 'Vectorizing' : 'Digitizing';

    // If client is not logged in, route to login page first
    if (!session || !session.role) {
        window.location.href = `portal-login.html?redirect=new_order&service=${encodeURIComponent(service)}&plan=${encodeURIComponent(planName)}`;
        return;
    }

    // If logged in as client, route directly to Client Portal with adaptive modal opened
    if (session.role === 'client') {
        window.location.href = `client-portal.html?action=new_order&service=${encodeURIComponent(service)}&plan=${encodeURIComponent(planName)}`;
        return;
    }

    // Admin / Worker fallback
    if (session.role === 'admin') {
        window.location.href = 'admin-portal.html';
        return;
    }
    if (session.role === 'digitizer') {
        window.location.href = 'worker-portal.html';
        return;
    }

    const planInput = document.getElementById("order-plan");
    const amountInput = document.getElementById("order-amount");
    const banner = document.getElementById("selected-plan-banner");
    const nameEl = document.getElementById("selected-plan-name");
    const priceEl = document.getElementById("selected-plan-price");
    const summary = document.getElementById("order-summary");
    const summaryPlan = document.getElementById("summary-plan");
    const summaryTotal = document.getElementById("summary-total");

    if (planInput) planInput.value = planName;
    if (amountInput) amountInput.value = price;

    if (banner) {
        banner.classList.remove("hidden");
        if (nameEl) nameEl.textContent = planName;
        if (priceEl) priceEl.textContent = "$" + price;
    }

    if (summary) {
        summary.classList.remove("hidden");
        if (summaryPlan) summaryPlan.textContent = planName + " ($" + price + ")";
        if (summaryTotal) summaryTotal.textContent = "$" + price;
    }

    const serviceType = document.getElementById("service-type");
    if (serviceType && document.getElementById("summary-service")) {
        document.getElementById("summary-service").textContent = serviceType.value;
    }

    const orderSection = document.getElementById("order-section");
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    hideFormError();
}


// ===================================================================
//  ORDER SYSTEM INIT
// ===================================================================
function initOrderSystem() {
    let session = null;
    try {
        const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                    (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
        if (raw) session = JSON.parse(raw);
    } catch (err) {
        session = null;
    }

    const loginPromptBanner = document.getElementById('pricing-login-prompt');
    const clientLoggedBanner = document.getElementById('pricing-client-banner');
    const quotePromptBanner = document.getElementById('quote-login-prompt');
    const quoteClientBanner = document.getElementById('quote-client-banner');
    const orderForm = document.getElementById('order-form');

    if (session && session.role) {
        if (loginPromptBanner) loginPromptBanner.classList.add('hidden');
        if (clientLoggedBanner) {
            clientLoggedBanner.classList.remove('hidden');
            const nameEl = document.getElementById('pricing-client-name');
            if (nameEl) nameEl.textContent = session.displayName || session.email;
        }
        if (quotePromptBanner) quotePromptBanner.classList.add('hidden');
        if (quoteClientBanner) {
            quoteClientBanner.classList.remove('hidden');
            const quoteNameEl = document.getElementById('quote-client-name');
            if (quoteNameEl) quoteNameEl.textContent = session.displayName || session.email;
        }
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');
        if (nameInput && !nameInput.value) nameInput.value = session.displayName || '';
        if (emailInput && !emailInput.value) emailInput.value = session.email || '';
    } else {
        if (loginPromptBanner) loginPromptBanner.classList.remove('hidden');
        if (clientLoggedBanner) clientLoggedBanner.classList.add('hidden');
        if (quotePromptBanner) quotePromptBanner.classList.remove('hidden');
        if (quoteClientBanner) quoteClientBanner.classList.add('hidden');
    }

    // Intercept form submission if user is not logged in
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            let currentSession = null;
            try {
                const raw = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dezan_session') : null) || 
                            (typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_session') : null);
                if (raw) currentSession = JSON.parse(raw);
            } catch (err) {
                currentSession = null;
            }

            if (!currentSession || !currentSession.role) {
                e.preventDefault();
                e.stopPropagation();
                const plan = document.getElementById('order-plan')?.value || '';
                const service = document.getElementById('service-type')?.value || '';
                alert('Please sign in or create an account before placing an order.');
                window.location.href = `portal-login.html?redirect=new_order&service=${encodeURIComponent(service)}&plan=${encodeURIComponent(plan)}`;
                return false;
            }
        });
    }

    // ----- EmailJS Init -----
    if (typeof emailjs !== "undefined") {
        emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");
    }

    // ----- Service type sync with summary -----
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        serviceType.addEventListener("change", () => {
            const summaryService = document.getElementById("summary-service");
            if (summaryService) summaryService.textContent = serviceType.value;
        });
    }
}


// ===================================================================
//  FORM VALIDATION
// ===================================================================
function validateOrderForm() {
    const plan = document.getElementById("order-plan").value;
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    const project = document.getElementById("project-name").value.trim();

    if (!plan) {
        showFormError("Please select a plan above before proceeding to payment.");
        return false;
    }
    if (!name) {
        showFormError("Please enter your name.");
        return false;
    }
    if (!email || !email.includes("@")) {
        showFormError("Please enter a valid email address.");
        return false;
    }
    if (!project) {
        showFormError("Please enter a project name.");
        return false;
    }

    const placement = document.getElementById("design-placement").value.trim();
    const sizing = document.getElementById("design-sizing").value.trim();
    const fileFormat = document.getElementById("file-format").value.trim();

    if (!placement) {
        showFormError("Please enter the style/location (e.g. Left Chest, Hat, Jacket Back).");
        return false;
    }
    if (!sizing) {
        showFormError("Please enter the sizing details.");
        return false;
    }
    if (!fileFormat) {
        showFormError("Please enter the required file format (e.g. DST, PES, EXP).");
        return false;
    }

    hideFormError();
    return true;
}

function showFormError(message) {
    const errorDiv = document.getElementById("form-error");
    const errorText = document.getElementById("form-error-text");
    if (errorDiv) {
        errorDiv.classList.remove("hidden");
        errorText.textContent = message;
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function hideFormError() {
    const errorDiv = document.getElementById("form-error");
    if (errorDiv) {
        errorDiv.classList.add("hidden");
    }
}


// ===================================================================
//  EMAIL NOTIFICATION (EmailJS)
// ===================================================================
function sendOrderEmail(orderData) {
    if (typeof emailjs === "undefined") {
        console.warn("EmailJS not loaded — skipping email notification.");
        return;
    }

    // *** REPLACE these with your actual EmailJS Service ID and Template ID ***
    const SERVICE_ID = "YOUR_SERVICE_ID";
    const TEMPLATE_ID = "YOUR_TEMPLATE_ID";

    const templateParams = {
        to_email: "fdezan91@gmail.com",
        from_name: orderData.customerName,
        from_email: orderData.customerEmail,
        transaction_id: orderData.transactionId,
        plan: orderData.planName,
        amount: "$" + orderData.amount,
        project_name: orderData.projectName,
        service_type: orderData.serviceType,
        placement: orderData.placement,
        sizing: orderData.sizing,
        file_format: orderData.fileFormat,
        notes: orderData.notes,
        order_date: new Date().toLocaleString()
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then(() => {
            console.log("Order notification email sent successfully.");
        })
        .catch((error) => {
            console.error("Email sending failed:", error);
        });
}


// ===================================================================
//  ORDER SUCCESS PAGE
// ===================================================================
function initSuccessPage() {
    const params = new URLSearchParams(window.location.search);

    const txnEl = document.getElementById("success-txn-id");
    const planEl = document.getElementById("success-plan");
    const projectEl = document.getElementById("success-project");
    const serviceEl = document.getElementById("success-service");
    const amountEl = document.getElementById("success-amount");

    if (txnEl) txnEl.textContent = params.get("txn") || "—";
    if (planEl) planEl.textContent = params.get("plan") || "—";
    if (projectEl) projectEl.textContent = params.get("project") || "—";
    if (serviceEl) serviceEl.textContent = params.get("service") || "—";
    if (amountEl) amountEl.textContent = "$" + (params.get("amount") || "0");
}

// ===================================================================
//  FEEDBACK SLIDER (index.html — matches dezandigitizing.com design)
//  Horizontal slide with peeking prev/next images
// ===================================================================
function initFeedbackSlider() {
    const track = document.getElementById('feedback-slide-track');
    const strip = document.getElementById('feedback-thumb-strip');
    const wrapper = document.getElementById('feedback-slider-wrapper');
    if (!track || !strip) return;

    // All feedback image paths (sequenced alphabetically based on numeric values)
    const images = [
        'Client FeedBack/1.webp',
        'Client FeedBack/2.webp',
        'Client FeedBack/3.webp',
        'Client FeedBack/4.webp',
        'Client FeedBack/5.webp',
        'Client FeedBack/6.webp',
        'Client FeedBack/7.webp',
        'Client FeedBack/8.webp',
        'Client FeedBack/9.webp',
        'Client FeedBack/10.webp',
        'Client FeedBack/11.webp',
        'Client FeedBack/12.webp',
        'Client FeedBack/14.webp',
        'Client FeedBack/15.webp',
        'Client FeedBack/16.webp',
        'Client FeedBack/17.webp',
        'Client FeedBack/18.webp',
        'Client FeedBack/19.webp',
        'Client FeedBack/20.webp',
        'Client FeedBack/21.webp',
        'Client FeedBack/22.webp',
        'Client FeedBack/23.webp',
        'Client FeedBack/24.webp',
        'Client FeedBack/25.webp',
        'Client FeedBack/26.webp',
        'Client FeedBack/27.webp',
        'Client FeedBack/28.webp',
        'Client FeedBack/29.webp',
        'Client FeedBack/30.webp',
        'Client FeedBack/31.webp',
        'Client FeedBack/32.webp',
        'Client FeedBack/33.webp',
        'Client FeedBack/34.webp',
        'Client FeedBack/35.webp',
        'Client FeedBack/36.webp',
        'Client FeedBack/37.webp',
        'Client FeedBack/38.webp',
        'Client FeedBack/39.webp',
        'Client FeedBack/40.webp'
    ];

    const totalSlides = images.length;
    let currentIndex = 0;
    let autoTimer = null;
    let isTransitioning = false;

    // --- Slide width percentage (center panel takes ~65%, sides peek) ---
    const SLIDE_WIDTH_PERCENT = 65; // center image width (sides peek smaller)

    // --- Build slide images in track ---
    images.forEach((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'flex-shrink-0 h-full flex items-center justify-center';
        slide.style.width = SLIDE_WIDTH_PERCENT + '%';
        slide.style.transition = 'transform 600ms ease-in-out, opacity 600ms ease-in-out';

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Client Feedback ' + (i + 1);
        img.className = 'w-full h-full object-contain';
        img.draggable = false;
        slide.appendChild(img);
        track.appendChild(slide);
    });

    const slides = track.querySelectorAll(':scope > div');

    // --- Build Thumbnail Strip ---
    images.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.alt = 'Thumbnail ' + (i + 1);
        thumb.className = 'h-14 w-20 md:h-16 md:w-24 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all duration-300 hover:border-primary';
        thumb.style.borderColor = i === 0 ? 'var(--color-primary, #c9a84c)' : 'transparent';
        thumb.addEventListener('click', () => goTo(i));
        strip.appendChild(thumb);
    });

    const thumbs = strip.querySelectorAll('img');

    // --- Apply scale/opacity to slides based on distance from center ---
    function updateSlideStyles() {
        slides.forEach((slide, i) => {
            if (i === currentIndex) {
                slide.style.transform = 'scale(1) translateX(0)';
                slide.style.opacity = '1';
                slide.style.zIndex = '2';
            } else if (i < currentIndex) {
                slide.style.transform = 'scale(0.85) translateX(20%)';
                slide.style.opacity = '0.6';
                slide.style.zIndex = '1';
            } else {
                slide.style.transform = 'scale(0.85) translateX(-20%)';
                slide.style.opacity = '0.6';
                slide.style.zIndex = '1';
            }
        });
    }

    // --- Position track so current slide is centered ---
    function updatePosition(animate) {
        if (!animate) {
            track.style.transition = 'none';
            slides.forEach(s => s.style.transition = 'none');
        } else {
            track.style.transition = 'transform 600ms ease-in-out';
            slides.forEach(s => s.style.transition = 'transform 600ms ease-in-out, opacity 600ms ease-in-out');
        }
        // Offset: center the current slide
        const offset = (50 - SLIDE_WIDTH_PERCENT / 2) - (currentIndex * SLIDE_WIDTH_PERCENT);
        track.style.transform = 'translateX(' + offset + '%)';
        updateSlideStyles();

        if (!animate) {
            // Force reflow then re-enable transitions
            track.offsetHeight;
            track.style.transition = 'transform 600ms ease-in-out';
        }
    }

    // --- Go to a specific slide ---
    function goTo(index, animate = true) {
        if (isTransitioning && animate) return;
        if (index === currentIndex && animate) return;

        // Update thumbnail borders
        thumbs[currentIndex].style.borderColor = 'transparent';
        currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;
        thumbs[currentIndex].style.borderColor = 'var(--color-primary, #c9a84c)';

        // Scroll active thumb into view, but only if the user is actually looking at the slider section.
        // This prevents the page from auto-scrolling down to the slider on load when the auto-play timer ticks.
        const sliderRect = wrapper.getBoundingClientRect();
        const isSliderVisible = (
            sliderRect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            sliderRect.bottom > 0
        );

        if (isSliderVisible) {
            thumbs[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        if (animate) {
            isTransitioning = true;
            updatePosition(true);
            setTimeout(() => { isTransitioning = false; }, 650);
        } else {
            updatePosition(false);
        }

        resetAutoPlay();
    }

    // --- Initial position ---
    updatePosition(false);

    // --- Auto-play (3 seconds) ---
    function startAutoPlay() {
        autoTimer = setInterval(() => {
            goTo(currentIndex + 1);
        }, 3000);
    }

    function resetAutoPlay() {
        clearInterval(autoTimer);
        startAutoPlay();
    }

    startAutoPlay();

    // --- Main viewer prev/next buttons ---
    const mainPrev = document.getElementById('fb-main-prev');
    const mainNext = document.getElementById('fb-main-next');

    if (mainPrev) mainPrev.addEventListener('click', () => goTo(currentIndex - 1));
    if (mainNext) mainNext.addEventListener('click', () => goTo(currentIndex + 1));

    // --- Thumbnail strip scroll buttons ---
    const thumbPrev = document.getElementById('fb-thumb-prev');
    const thumbNext = document.getElementById('fb-thumb-next');

    if (thumbPrev) thumbPrev.addEventListener('click', () => {
        strip.scrollBy({ left: -300, behavior: 'smooth' });
    });
    if (thumbNext) thumbNext.addEventListener('click', () => {
        strip.scrollBy({ left: 300, behavior: 'smooth' });
    });

    // Pause auto-play on hover over entire slider area
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
        wrapper.addEventListener('mouseleave', () => startAutoPlay());
    }

    // --- Touch/swipe support for mobile ---
    let touchStartX = 0;
    let touchEndX = 0;
    const sliderContainer = track.parentElement;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoTimer);
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goTo(currentIndex + 1);
            else goTo(currentIndex - 1);
        }
        startAutoPlay();
    }, { passive: true });
}

// ===================================================================
//  GLOBAL INTERACTIVE ELEMENTS (TOASTS, MODALS, newsletter, profile)
// ===================================================================
function initInteractiveElements() {
    // 1. Toast Notification Helper
    window.showToast = function(message, type = 'success') {
        const existingToast = document.querySelector('.global-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `global-toast fixed top-20 right-4 z-[100] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border transition-all duration-300 transform translate-y-[-20px] opacity-0 pointer-events-none`;
        
        if (type === 'success') {
            toast.className += ' bg-white dark:bg-card-dark border-green-500/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-green-500 text-xl filled-icon">check_circle</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        } else if (type === 'error') {
            toast.className += ' bg-white dark:bg-card-dark border-red-500/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-red-500 text-xl filled-icon">error</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        } else {
            toast.className += ' bg-white dark:bg-card-dark border-primary/40 text-slate-900 dark:text-white';
            toast.innerHTML = `
                <span class="material-symbols-outlined text-primary text-xl">info</span>
                <p class="text-sm font-semibold">${message}</p>
            `;
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
            toast.classList.add('translate-y-0', 'opacity-100');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-[-20px]', 'opacity-0', 'pointer-events-none');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 2. Custom Dialog Modal Helper
    window.showModalDialog = function(title, contentHTML, actionsHTML = '') {
        const existingModal = document.querySelector('.global-dialog-modal');
        if (existingModal) existingModal.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'global-dialog-modal fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-card-dark border border-primary/25 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-transform duration-300 transform scale-95 flex flex-col max-h-[85vh]';
        
        modal.innerHTML = `
            <div class="flex items-center justify-between px-6 py-4 border-b border-primary/15 bg-slate-50/80 dark:bg-card-dark">
                <h3 class="font-black text-gradient-gold text-lg">${title}</h3>
                <button class="close-modal-btn text-slate-400 hover:text-red-500 transition-colors text-2xl font-light leading-none">&times;</button>
            </div>
            <div class="p-6 text-sm text-slate-700 dark:text-slate-200 overflow-y-auto space-y-4 flex-1">
                ${contentHTML}
            </div>
            <div class="px-6 py-4 bg-slate-50/80 dark:bg-black/40 flex justify-end gap-3 border-t border-primary/15">
                ${actionsHTML || `<button class="close-modal-btn bg-primary text-background-dark font-bold text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all">Close</button>`}
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            backdrop.classList.add('opacity-100');
            modal.classList.add('scale-100');
            modal.classList.remove('scale-95');
        }, 50);

        const closeBtns = backdrop.querySelectorAll('.close-modal-btn');
        const closeModal = () => {
            backdrop.classList.remove('opacity-100');
            modal.classList.remove('scale-100');
            modal.classList.add('scale-95');
            document.body.style.overflow = '';
            setTimeout(() => backdrop.remove(), 300);
        };

        closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    };

    // 3. Newsletter Submission Interceptor
    document.querySelectorAll('footer form, main form').forEach(form => {
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (emailInput && submitBtn && submitBtn.textContent.trim().toLowerCase() === 'join') {
            form.removeAttribute('onsubmit');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                if (!email) return;
                
                showToast(`Thank you! "${email}" has been added to our list.`, 'success');
                emailInput.value = '';
            });
        }
    });

    // 4. Privacy & Terms Modals (Intercept # clicks containing Privacy or Terms)
    document.querySelectorAll('a[href="#"]').forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('privacy')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const privacyContent = `
                    <p class="font-bold text-slate-800 dark:text-slate-200">1. Information Collection</p>
                    <p>We collect only the name, email address, project names, sizing, format requests, and artwork files uploaded via our order and quote forms. We do not use persistent cookies or trackers.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">2. Uploaded Artworks</p>
                    <p>All client designs and logo files uploaded to Dezan Digitizing are held in absolute confidentiality. They are used solely to perform the embroidery digitizing and vector conversion services you request.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">3. File Retention</p>
                    <p>Temporary file uploads (via tmpfiles.org) expire within 48 hours. Digitized production files (.DST, .PES, etc.) are kept in our secure cloud vaults for 5 years so you can retrieve them if lost.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">4. Third-Party Sharing</p>
                    <p>We do not share, lease, sell, or distribute your artwork, designs, or personal details with any external organizations or third parties.</p>
                `;
                showModalDialog("Privacy Policy", privacyContent);
            });
        } else if (text.includes('terms')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const termsContent = `
                    <p class="font-bold text-slate-800 dark:text-slate-200">1. Ordering & Approvals</p>
                    <p>By placing an order, you confirm you own the legal rights or licenses to reproduce the uploaded artwork/logo designs.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">2. Free Review & Invoicing</p>
                    <p>No upfront payment is required when submitting files. We will review your artwork and placement specs, verify if there are complex edits needed, and email you a direct invoice via PayPal or card processor.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">3. Delivery & Turnaround</p>
                    <p>Standard delivery is 12-24 hours for Left Chest, Hat, and Simple Vector designs. Jacket Backs and Pet Portraits take up to 2-3 days depending on complexity.</p>
                    
                    <p class="font-bold text-slate-800 dark:text-slate-200">4. Free Edits & Revisions</p>
                    <p>We offer unlimited minor edits/revisions (such as minor size adjustments, minor stitch adjustments, density edits) for 30 days after order delivery to guarantee perfect sewout results.</p>
                `;
                showModalDialog("Terms of Service", termsContent);
            });
        }
    });

    // 5. Profile settings buttons (profile.html only)
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";
    if (currentPage === "profile.html" || currentPage === "profile") {
        
        // Load saved profile data
        const profileNameEl = document.getElementById("profile-name");
        const profileEmailEl = document.getElementById("profile-email");
        if (profileNameEl && profileEmailEl) {
            const savedName = localStorage.getItem("profileName");
            const savedEmail = localStorage.getItem("profileEmail");
            if (savedName) profileNameEl.textContent = savedName;
            if (savedEmail) profileEmailEl.textContent = savedEmail;
        }

        // Edit Profile
        const editProfileBtn = document.getElementById("btn-edit-profile");
        if (editProfileBtn) {
            editProfileBtn.addEventListener("click", () => {
                const currentName = profileNameEl ? profileNameEl.textContent : "John Doe";
                const currentEmail = profileEmailEl ? profileEmailEl.textContent : "john@example.com";
                
                const editHTML = `
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Full Name</label>
                            <input id="edit-name-input" type="text" class="w-full h-11 bg-white dark:bg-background-dark border border-primary/30 rounded-lg px-4 focus:ring-1 focus:ring-primary text-slate-800 dark:text-white" value="${currentName}">
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-bold text-slate-600 dark:text-slate-400">Email Address</label>
                            <input id="edit-email-input" type="email" class="w-full h-11 bg-white dark:bg-background-dark border border-primary/30 rounded-lg px-4 focus:ring-1 focus:ring-primary text-slate-800 dark:text-white" value="${currentEmail}">
                        </div>
                    </div>
                `;
                
                const actionsHTML = `
                    <button class="close-modal-btn border border-primary/20 hover:bg-primary/5 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg transition-all">Cancel</button>
                    <button id="save-profile-btn" class="bg-primary text-background-dark font-bold text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition-all">Save Changes</button>
                `;
                
                showModalDialog("Edit Profile Details", editHTML, actionsHTML);
                
                // Save button handler
                const saveBtn = document.getElementById("save-profile-btn");
                if (saveBtn) {
                    saveBtn.addEventListener("click", () => {
                        const newName = document.getElementById("edit-name-input").value.trim();
                        const newEmail = document.getElementById("edit-email-input").value.trim();
                        
                        if (!newName || !newEmail) {
                            showToast("Name and email are required.", "error");
                            return;
                        }
                        
                        localStorage.setItem("profileName", newName);
                        localStorage.setItem("profileEmail", newEmail);
                        
                        if (profileNameEl) profileNameEl.textContent = newName;
                        if (profileEmailEl) profileEmailEl.textContent = newEmail;
                        
                        showToast("Profile details updated successfully!", "success");
                        
                        // Close modal by clicking any close button
                        const closeBtn = document.querySelector('.global-dialog-modal .close-modal-btn');
                        if (closeBtn) closeBtn.click();
                    });
                }
            });
        }

        // Notifications
        const notifBtn = document.getElementById("btn-notifications");
        if (notifBtn) {
            notifBtn.addEventListener("click", () => {
                showToast("You have no new notifications.", "info");
            });
        }

        // Password & Security
        const securityBtn = document.getElementById("btn-security");
        if (securityBtn) {
            securityBtn.addEventListener("click", () => {
                showToast("Password and security settings are locked in demo mode.", "error");
            });
        }

        // Log Out
        const logoutBtn = document.getElementById("btn-logout");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                const logoutHTML = `<p>Are you sure you want to log out of your profile account?</p>`;
                const actionsHTML = `
                    <button class="close-modal-btn border border-primary/20 hover:bg-primary/5 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-lg transition-all">Cancel</button>
                    <button id="confirm-logout-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all">Log Out</button>
                `;
                
                showModalDialog("Confirm Log Out", logoutHTML, actionsHTML);
                
                const confirmBtn = document.getElementById("confirm-logout-btn");
                if (confirmBtn) {
                    confirmBtn.addEventListener("click", () => {
                        localStorage.removeItem("profileName");
                        localStorage.removeItem("profileEmail");
                        showToast("Logging out...", "info");
                        
                        // Close modal
                        const closeBtn = document.querySelector('.global-dialog-modal .close-modal-btn');
                        if (closeBtn) closeBtn.click();
                        
                        setTimeout(() => {
                            window.location.href = "index.html";
                        }, 1200);
                    });
                }
            });
        }
    }
}
