/**
 * Dezan Digitizing — Shared JavaScript
 * Theme toggle, scroll reveal, active navigation, order system,
 * PayPal payment, and EmailJS notification
 */

document.addEventListener("DOMContentLoaded", () => {

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


    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => observer.observe(el));
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

            // Create and append a hidden input for each file
            filesArray.forEach((file, index) => {
                const dynamicInput = document.createElement("input");
                dynamicInput.type = "file";
                dynamicInput.name = `${inputPrefix}${index + 1}`;
                dynamicInput.className = `dynamic-${containerId}-input hidden`;

                const dt = new DataTransfer();
                dt.items.add(file);
                dynamicInput.files = dt.files;

                form.appendChild(dynamicInput);
            });
        }
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

    // Keep the before image sized to the full container width
    function syncBeforeImageWidth() {
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
    const planInput = document.getElementById("order-plan");
    const amountInput = document.getElementById("order-amount");
    const banner = document.getElementById("selected-plan-banner");
    const nameEl = document.getElementById("selected-plan-name");
    const priceEl = document.getElementById("selected-plan-price");
    const summary = document.getElementById("order-summary");
    const summaryPlan = document.getElementById("summary-plan");
    const summaryTotal = document.getElementById("summary-total");

    // Set hidden values
    planInput.value = planName;
    amountInput.value = price;

    // Show banner
    banner.classList.remove("hidden");
    nameEl.textContent = planName;
    priceEl.textContent = "$" + price;

    // Update summary
    summary.classList.remove("hidden");
    summaryPlan.textContent = planName + " ($" + price + ")";
    summaryTotal.textContent = "$" + price;

    // Update service in summary
    const serviceType = document.getElementById("service-type");
    if (serviceType) {
        document.getElementById("summary-service").textContent = serviceType.value;
    }

    // Scroll to order form
    const orderSection = document.getElementById("order-section");
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Clear any error
    hideFormError();
}


// ===================================================================
//  ORDER SYSTEM INIT
// ===================================================================
function initOrderSystem() {

    // ----- EmailJS Init -----
    // *** REPLACE with your EmailJS public key ***
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
