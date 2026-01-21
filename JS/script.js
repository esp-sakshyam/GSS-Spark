/**
 * LifeLine Landing Page - JavaScript
 * Emergency Response System for Rural Nepal
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initScrollAnimations();
    initSectionHeaderAnimations();
    initWorkflowAnimation();
    initSmoothScroll();
    initNavHighlight();
    initNavScroll();
    initMobileNav();
    initParallaxEffects();
});

/**
 * Scroll-triggered animations using Intersection Observer
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe problem cards
    document.querySelectorAll('.problem-card').forEach(card => {
        observer.observe(card);
    });

    // Observe workflow items
    document.querySelectorAll('.workflow-item').forEach(item => {
        observer.observe(item);
    });

    // Observe tech cards
    document.querySelectorAll('.tech-card').forEach(card => {
        observer.observe(card);
    });

    // Observe highlight content
    document.querySelectorAll('.highlight-content').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Section header animations
 */
function initSectionHeaderAnimations() {
    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.section-label, .section-title, .section-subtitle').forEach(el => {
        headerObserver.observe(el);
    });
}

/**
 * Sequential workflow step highlighting
 */
function initWorkflowAnimation() {
    const workflowItems = document.querySelectorAll('.workflow-item');
    let currentStep = 0;
    let intervalId = null;

    const activateStep = (step) => {
        workflowItems.forEach((item, index) => {
            if (index === step) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    const startAnimation = () => {
        if (intervalId) return;

        intervalId = setInterval(() => {
            activateStep(currentStep);
            currentStep = (currentStep + 1) % workflowItems.length;
        }, 2000);
    };

    const stopAnimation = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    // Start animation when workflow section is in view
    const workflowSection = document.querySelector('.working');

    const workflowObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAnimation();
            } else {
                stopAnimation();
                currentStep = 0;
                workflowItems.forEach(item => item.classList.remove('active'));
            }
        });
    }, { threshold: 0.3 });

    if (workflowSection) {
        workflowObserver.observe(workflowSection);
    }
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Highlight active navigation link based on scroll position
 */
function initNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const highlightNav = () => {
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav(); // Initial call
}

/**
 * Nav background change on scroll with hide/show
 */
function initNavScroll() {
    const nav = document.querySelector('.nav');
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;

        // Add shadow when scrolled
        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Hide/show nav on scroll direction (optional - comment out if not wanted)
        // if (currentScrollY > lastScrollY && currentScrollY > 200) {
        //     nav.classList.add('hidden');
        // } else {
        //     nav.classList.remove('hidden');
        // }

        lastScrollY = currentScrollY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Mobile navigation toggle
 */
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (!navToggle || !navLinks) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

/**
 * Counter animation for stats (can be extended)
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
}

/**
 * Subtle parallax effects
 */
function initParallaxEffects() {
    const heroBg = document.querySelector('.hero-bg-pattern');

    if (!heroBg) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (scrollY < window.innerHeight) {
                    heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}
