const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const backToTop = document.querySelector("#backToTop");
const progressBar = document.querySelector("#scrollProgress");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile menu
menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("show");
    });
});

// Typing animation
const typingText = document.querySelector("#typing-text");

const phrases = [
    "Frontend Developer",
    "UI/UX Designer with Figma",
    "Software Engineer",
    "Responsive Web Interface Builder",
    "Passionate About Thoughtful User Experiences"
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 45 : 90;

    if (!isDeleting && charIndex === currentPhrase.length) {
        speed = 1400;
        isDeleting = true;
    }

    if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 400;
    }

    setTimeout(typeEffect, speed);
}

if (prefersReducedMotion) {
    typingText.textContent = phrases[0];
} else {
    typeEffect();
}

// Scroll reveal animation
const revealElements = document.querySelectorAll(".reveal");

function revealOnScroll() {
    revealElements.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const revealPoint = 120;

        if (elementTop < windowHeight - revealPoint) {
            element.classList.add("active");
        }
    });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Scroll progress bar and back to top button
window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + "%";

    if (scrollTop > 500) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
    });
});

// Highlight the nav link of the section on screen
const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navAnchors.forEach((a) => {
                    a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
                });
            }
        });
    },
    { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((section) => sectionObserver.observe(section));

// Count-up numbers in the About stats
const counters = document.querySelectorAll(".counter");

const counterObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const target = Number(el.dataset.target);

            if (prefersReducedMotion) {
                el.textContent = target;
            } else {
                let current = 0;
                const step = Math.max(1, Math.ceil(target / 20));
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current;
                }, 60);
            }

            observer.unobserve(el);
        });
    },
    { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));

// Project filters
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((b) => b.classList.remove("active"));
        button.classList.add("active");

        projectCards.forEach((card) => {
            const show = filter === "all" || card.dataset.category === filter;
            card.classList.toggle("hide", !show);
            if (show) card.classList.add("active");
        });
    });
});

// Footer year
document.querySelector("#year").textContent = new Date().getFullYear();