/**
 * SPARK Landing Page - JavaScript
 * Emergency Response System for Rural Nepal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initScrollAnimations();
  initWorkflowAnimation();
  initSmoothScroll();
  initNavHighlight();
});

/**
 * Scroll-triggered animations using Intersection Observer
 */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe workflow items
  document.querySelectorAll('.workflow-item').forEach(item => {
    observer.observe(item);
  });

  // Observe tech cards
  document.querySelectorAll('.tech-card').forEach(card => {
    observer.observe(card);
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
    }, 1500);
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
    anchor.addEventListener('click', function(e) {
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
    const scrollPos = window.scrollY + 100;
    
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
 * Add active state styling for nav links
 */
const style = document.createElement('style');
style.textContent = `
  .nav-links a.active {
    color: #1A1A1A;
    font-weight: 500;
  }
`;
document.head.appendChild(style);
