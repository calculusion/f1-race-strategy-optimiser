(() => {
  "use strict";

  const DURATION = 700;
  const EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

  // Prevent white background
  document.documentElement.style.background = "#050505";
  document.body.style.background = "#050505";

  // Create ONE transition layer
  const transition = document.createElement("div");

  transition.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #050505;
      opacity: 1;
      pointer-events: none;
      transition: opacity ${DURATION}ms ${EASING};
  `;

  document.body.appendChild(transition);

  // Page entrance
  requestAnimationFrame(() => {
    transition.style.opacity = "0";
  });

  // Remove after entrance
  setTimeout(() => {
    transition.remove();
  }, DURATION + 50);

  // Navigation
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (!link) return;

    const href = link.getAttribute("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.target === "_blank" ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const destination = new URL(href, window.location.href);

    // External link
    if (destination.origin !== window.location.origin) {
      return;
    }

    // Same page
    if (
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash === window.location.hash
    ) {
      return;
    }

    event.preventDefault();

    // Reuse the SAME transition layer
    document.body.appendChild(transition);

    transition.style.opacity = "1";

    setTimeout(() => {
      window.location.href = destination.href;
    }, DURATION);
  });
})();
