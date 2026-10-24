/* Optional motion enhancements for the creative portfolio.
   No library dependency; only runs on fine-pointer devices with motion enabled. */
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  const projectCards = document.querySelectorAll(".projects-grid .project-card");
  projectCards.forEach((card, index) => {
    card.style.setProperty("--stagger-delay", `${(index % 2) * 95}ms`);
  });

  // Stop here on touch / keyboard-first devices, reduced motion, or data-saving mode.
  if (reducedMotion.matches || !finePointer.matches || saveData) return;

  // Spotlight effects are visual only; existing mouse pointers and click targets stay native.
  const glow = document.createElement("div");
  glow.className = "motion-cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let pointerX = -500;
  let pointerY = -500;
  let pointerFrame = 0;

  function paintPointer() {
    pointerFrame = 0;
    glow.style.transform = `translate3d(${pointerX - 110}px,${pointerY - 110}px,0)`;
  }

  function movePointer(event) {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    glow.style.opacity = "1";
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  }

  document.addEventListener("pointermove", movePointer, {passive: true});
  document.documentElement.addEventListener("pointerleave", () => {
    glow.style.opacity = "0";
  });
  window.addEventListener("blur", () => {
    glow.style.opacity = "0";
  });

  // Each project card gets its own soft light that follows the pointer locally.
  projectCards.forEach((card) => {
    let frame = 0;
    let px = 0;
    let py = 0;
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      px = event.clientX - bounds.left;
      py = event.clientY - bounds.top;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        card.style.setProperty("--pointer-x", `${px}px`);
        card.style.setProperty("--pointer-y", `${py}px`);
        frame = 0;
      });
    }, {passive: true});
  });

  // Gentle magnetic CTA response. Links remain normally clickable and keyboard accessible.
  const magneticLinks = document.querySelectorAll(".motion-magnetic, .nav-contact");
  magneticLinks.forEach((link) => {
    link.classList.add("motion-magnetic");
    link.addEventListener("pointermove", (event) => {
      const rect = link.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      link.style.setProperty("--magnet-x", `${(dx * 10).toFixed(1)}px`);
      link.style.setProperty("--magnet-y", `${(dy * 8).toFixed(1)}px`);
    }, {passive: true});
    const reset = () => {
      link.style.setProperty("--magnet-x", "0px");
      link.style.setProperty("--magnet-y", "0px");
    };
    link.addEventListener("pointerleave", reset);
    link.addEventListener("blur", reset);
  });

  // Profile portrait follows the cursor by a few pixels while the card floats.
  const profile = document.querySelector(".profile-card");
  if (profile) {
    profile.addEventListener("pointermove", (event) => {
      const bounds = profile.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      profile.style.setProperty("--photo-x", `${(x * 15).toFixed(1)}px`);
      profile.style.setProperty("--photo-y", `${(y * 12).toFixed(1)}px`);
    }, {passive: true});
    profile.addEventListener("pointerleave", () => {
      profile.style.setProperty("--photo-x", "0px");
      profile.style.setProperty("--photo-y", "0px");
    });
  }
})();
