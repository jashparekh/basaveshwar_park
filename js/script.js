(function () {
    "use strict";

    var navbar = document.getElementById("navbar");
    var hamburger = document.getElementById("hamburger");
    var navMenu = document.getElementById("navMenu");
    var navLinks = document.querySelectorAll(".nav-link");
    var sections = document.querySelectorAll("section[id]");
    var revealEls = document.querySelectorAll(".reveal");
    var lightbox = document.getElementById("lightbox");
    var lightboxImg = document.getElementById("lightboxImg");
    var lightboxPlaceholder = document.getElementById("lightboxPlaceholder");
    var lightboxCaption = document.getElementById("lightboxCaption");
    var lightboxCaptionText = document.getElementById("lightboxCaptionText");
    var lightboxClose = document.getElementById("lightboxClose");
    var galleryItems = document.querySelectorAll(".gallery-item");
    var enquiryForm = document.getElementById("enquiryForm");
    var formSuccess = document.getElementById("formSuccess");
    var formError = document.getElementById("formError");
    var openEligibilityModalTriggers = document.querySelectorAll("[data-open-eligibility-modal]");
    var eligibilityModal = document.getElementById("eligibilityModal");
    var eligibilityForm = document.getElementById("eligibilityForm");
    var eligibilityFormSuccess = document.getElementById("eligibilityFormSuccess");
    var eligibilityFormError = document.getElementById("eligibilityFormError");
    var eligibilityModalCloseEls = document.querySelectorAll("[data-close-eligibility-modal]");
    var eligibilityModalTitleEl = document.getElementById("eligibilityModalTitle");
    var eligibilityModalIntroEl = document.getElementById("eligibilityModalIntro");
    var eligibilityFormSubjectInput = document.getElementById("eligibilityFormSubject");

    var ELIGIBILITY_MODAL_DEFAULTS = {
        title: "Check loan eligibility",
        intro:
            "Share your details — we will get back to you on loan assistance and next steps.",
        subject: "Shri Basaveshwar Park — Loan eligibility enquiry",
    };

    /** FormSubmit.co — delivers JSON submissions to inbox (confirm email on first use). */
    var FORM_ENDPOINT =
        "https://formsubmit.co/ajax/" +
        encodeURIComponent("ShribasaveshwarPark@gmail.com");

    /** FormSubmit blocks file:// — page must be served over http(s). */
    var NEEDS_LOCAL_SERVER_MSG =
        "These forms need the site opened over http:// or https:// (not by double‑clicking the HTML file). " +
        "From the project folder run: python3 -m http.server 8080 — then open http://localhost:8080 in your browser.";

    var lastModalFocus = null;

    function humanizeFormSubmitError(msg) {
        if (typeof msg !== "string") {
            return msg;
        }
        if (/web server|html files|formsubmit|file:\/\//i.test(msg)) {
            return NEEDS_LOCAL_SERVER_MSG;
        }
        return msg;
    }

    function formDataToJson(form) {
        var fd = new FormData(form);
        var data = {};
        fd.forEach(function (value, key) {
            data[key] = value;
        });
        return data;
    }

    function submitToInbox(form, options) {
        options = options || {};
        var errEl = options.errorEl;
        var okEl = options.successEl;
        var submitBtn = form.querySelector('button[type="submit"]');
        var prevLabel = submitBtn ? submitBtn.textContent : "";

        if (errEl) {
            errEl.hidden = true;
            errEl.textContent = "";
        }
        if (okEl) {
            okEl.hidden = true;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (window.location.protocol === "file:") {
            if (errEl) {
                errEl.textContent = NEEDS_LOCAL_SERVER_MSG;
                errEl.hidden = false;
            }
            return;
        }

        var payload = formDataToJson(form);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending…";
        }

        fetch(FORM_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(function (res) {
                return res.json().then(function (data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function (result) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = prevLabel;
                }
                var d = result.data || {};
                var accepted =
                    result.ok &&
                    !d.error &&
                    d.success !== false &&
                    d.success !== "false";

                if (accepted) {
                    if (okEl) {
                        okEl.hidden = false;
                    }
                    form.reset();
                    if (typeof options.onSuccess === "function") {
                        options.onSuccess();
                    }
                } else {
                    var raw =
                        d.message ||
                        d.error ||
                        "Could not send. Please try WhatsApp or call us.";
                    var msg =
                        typeof raw === "string"
                            ? humanizeFormSubmitError(raw)
                            : "Send failed. Please try again.";
                    if (errEl) {
                        errEl.textContent = msg;
                        errEl.hidden = false;
                    }
                }
            })
            .catch(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = prevLabel;
                }
                if (errEl) {
                    errEl.textContent =
                        "Network error. Please check your connection and try again.";
                    errEl.hidden = false;
                }
            });
    }

    function applyEligibilityModalCopy(trigger) {
        var ds = trigger && trigger.dataset ? trigger.dataset : {};
        var title = ds.eligibilityModalTitle || ELIGIBILITY_MODAL_DEFAULTS.title;
        var intro = ds.eligibilityModalIntro || ELIGIBILITY_MODAL_DEFAULTS.intro;
        var subject = ds.eligibilityFormSubject || ELIGIBILITY_MODAL_DEFAULTS.subject;
        if (eligibilityModalTitleEl) {
            eligibilityModalTitleEl.textContent = title;
        }
        if (eligibilityModalIntroEl) {
            eligibilityModalIntroEl.textContent = intro;
        }
        if (eligibilityFormSubjectInput) {
            eligibilityFormSubjectInput.value = subject;
        }
    }

    function openEligibilityModal(trigger) {
        if (!eligibilityModal) return;
        applyEligibilityModalCopy(trigger || null);
        lastModalFocus = document.activeElement;
        eligibilityModal.removeAttribute("hidden");
        eligibilityModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        var first = document.getElementById("eligName");
        if (first) {
            setTimeout(function () {
                first.focus();
            }, 10);
        }
    }

    function closeEligibilityModal() {
        if (!eligibilityModal) return;
        eligibilityModal.setAttribute("hidden", "");
        eligibilityModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (eligibilityFormError) {
            eligibilityFormError.hidden = true;
            eligibilityFormError.textContent = "";
        }
        if (eligibilityFormSuccess) {
            eligibilityFormSuccess.hidden = true;
        }
        if (lastModalFocus && typeof lastModalFocus.focus === "function") {
            lastModalFocus.focus();
        }
    }

    var NAV_OFFSET = 80;

    function setNavbarScrolled() {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add("is-scrolled");
        } else {
            navbar.classList.remove("is-scrolled");
        }
    }

    function closeMobileMenu() {
        if (!navMenu || !hamburger) return;
        navMenu.classList.remove("is-open");
        hamburger.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
    }

    function openMobileMenu() {
        if (!navMenu || !hamburger) return;
        navMenu.classList.add("is-open");
        hamburger.classList.add("is-open");
        hamburger.setAttribute("aria-expanded", "true");
    }

    function toggleMobileMenu() {
        if (!navMenu || !hamburger) return;
        if (navMenu.classList.contains("is-open")) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    function scrollToHash(hash, pushState) {
        if (!hash || hash === "#") return;
        var el = document.querySelector(hash);
        if (!el) return;
        var top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        window.scrollTo({ top: top, behavior: "smooth" });
        if (pushState !== false) {
            history.pushState(null, "", hash);
        }
    }

    function updateActiveNav() {
        var scrollPos = window.scrollY + NAV_OFFSET + 20;
        var current = "";
        sections.forEach(function (section) {
            var id = section.getAttribute("id");
            if (!id) return;
            var offsetTop = section.offsetTop;
            if (scrollPos >= offsetTop) {
                current = id;
            }
        });
        navLinks.forEach(function (link) {
            link.classList.remove("active");
            var href = link.getAttribute("href");
            if (href === "#" + current) {
                link.classList.add("active");
            }
        });
    }

    function openLightbox(fullSrc, caption) {
        if (!lightbox) return;
        lightbox.removeAttribute("hidden");
        document.body.style.overflow = "hidden";
        lightboxCaption.textContent = caption || "";

        if (fullSrc && fullSrc.trim() !== "") {
            lightboxImg.removeAttribute("hidden");
            lightboxImg.src = fullSrc;
            lightboxImg.alt = caption || "Gallery image";
            lightboxPlaceholder.setAttribute("hidden", "");
        } else {
            lightboxImg.setAttribute("hidden", "");
            lightboxImg.src = "";
            lightboxImg.alt = "";
            lightboxPlaceholder.removeAttribute("hidden");
            if (lightboxCaptionText) {
                lightboxCaptionText.textContent =
                    caption || "Add image path in data-full on gallery item";
            }
        }
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.setAttribute("hidden", "");
        document.body.style.overflow = "";
        lightboxImg.src = "";
        lightboxImg.setAttribute("hidden", "");
        lightboxPlaceholder.setAttribute("hidden", "");
    }

    /* Navbar scroll */
    window.addEventListener("scroll", function () {
        setNavbarScrolled();
        updateActiveNav();
    });
    setNavbarScrolled();
    updateActiveNav();

    /* Hamburger */
    if (hamburger) {
        hamburger.addEventListener("click", toggleMobileMenu);
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
            var href = link.getAttribute("href");
            if (href && href.startsWith("#")) {
                e.preventDefault();
                scrollToHash(href);
                closeMobileMenu();
            }
        });
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (lightbox && !lightbox.hasAttribute("hidden")) {
            closeLightbox();
            return;
        }
        if (eligibilityModal && !eligibilityModal.hasAttribute("hidden")) {
            closeEligibilityModal();
        }
    });

    /* Logo home link */
    var logo = document.querySelector(".logo");
    if (logo) {
        logo.addEventListener("click", function (e) {
            if (logo.getAttribute("href") === "#home") {
                e.preventDefault();
                scrollToHash("#home");
                closeMobileMenu();
            }
        });
    }

    /* Reveal on scroll */
    if (revealEls.length && "IntersectionObserver" in window) {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { root: null, rootMargin: "0px 0px -48px 0px", threshold: 0.08 }
        );
        revealEls.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add("is-visible");
        });
    }

    /* Gallery lightbox */
    galleryItems.forEach(function (item) {
        item.addEventListener("click", function () {
            var full = item.getAttribute("data-full") || "";
            var caption = item.getAttribute("data-caption") || "";
            var thumbImg = item.querySelector("img");
            if (!full && thumbImg && thumbImg.getAttribute("src")) {
                full = thumbImg.getAttribute("src");
            }
            openLightbox(full, caption);
        });
    });

    var floorPlanZoom = document.querySelector(".floor-plan-zoom");
    if (floorPlanZoom) {
        floorPlanZoom.addEventListener("click", function () {
            var full = floorPlanZoom.getAttribute("data-full") || "";
            var caption = floorPlanZoom.getAttribute("data-caption") || "";
            var planImg = floorPlanZoom.querySelector("img");
            if (!full && planImg && planImg.getAttribute("src")) {
                full = planImg.getAttribute("src");
            }
            openLightbox(full, caption);
        });
    }

    if (lightboxClose) {
        lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    /* Contact & eligibility forms → ShribasaveshwarPark@gmail.com (FormSubmit) */
    if (enquiryForm) {
        enquiryForm.addEventListener("submit", function (e) {
            e.preventDefault();
            submitToInbox(enquiryForm, {
                successEl: formSuccess,
                errorEl: formError,
                onSuccess: function () {
                    setTimeout(function () {
                        if (formSuccess) {
                            formSuccess.hidden = true;
                        }
                    }, 6000);
                },
            });
        });
    }

    /* Loan eligibility modal (Check Eligibility, hero E‑Brochure, etc.) */
    openEligibilityModalTriggers.forEach(function (btn) {
        btn.addEventListener("click", function () {
            openEligibilityModal(btn);
        });
    });

    eligibilityModalCloseEls.forEach(function (el) {
        el.addEventListener("click", function () {
            closeEligibilityModal();
        });
    });

    if (eligibilityForm) {
        eligibilityForm.addEventListener("submit", function (e) {
            e.preventDefault();
            submitToInbox(eligibilityForm, {
                successEl: eligibilityFormSuccess,
                errorEl: eligibilityFormError,
                onSuccess: function () {
                    setTimeout(function () {
                        closeEligibilityModal();
                    }, 2200);
                },
            });
        });
    }

    /* FAQ accordion */
    var faqQuestions = document.querySelectorAll(".faq-question");
    faqQuestions.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var item = btn.closest(".faq-item");
            if (!item) return;
            var answer = item.querySelector(".faq-answer");
            var icon = item.querySelector(".faq-icon i");
            var expanded = btn.getAttribute("aria-expanded") === "true";

            faqQuestions.forEach(function (other) {
                if (other === btn) return;
                var oItem = other.closest(".faq-item");
                var oAns = oItem && oItem.querySelector(".faq-answer");
                var oIcon = oItem && oItem.querySelector(".faq-icon i");
                other.setAttribute("aria-expanded", "false");
                if (oAns) oAns.hidden = true;
                if (oIcon) {
                    oIcon.classList.remove("fa-minus");
                    oIcon.classList.add("fa-plus");
                }
            });

            btn.setAttribute("aria-expanded", expanded ? "false" : "true");
            if (answer) answer.hidden = expanded;
            if (icon) {
                if (expanded) {
                    icon.classList.remove("fa-minus");
                    icon.classList.add("fa-plus");
                } else {
                    icon.classList.remove("fa-plus");
                    icon.classList.add("fa-minus");
                }
            }
        });
    });

})();
