(() => {
  "use strict";

  const DURATION = 700;
  const EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

  // Prevent white flash before the page is painted
  document.documentElement.style.backgroundColor = "#050505";
  document.body.style.backgroundColor = "#050505";

  // Create a dark transition layer
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

  // Premium slow reveal
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transition.style.opacity = "0";
    });
  });

  // Remove after entrance
  setTimeout(() => {
    transition.remove();
  }, DURATION + 50);

  // Page navigation
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

    // Don't animate external links
    if (destination.origin !== window.location.origin) {
      return;
    }

    // Don't animate same-page links
    if (
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash === window.location.hash
    ) {
      return;
    }

    event.preventDefault();

    // Create exit layer
    const exitTransition = document.createElement("div");

    exitTransition.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #050505;
          opacity: 0;
          pointer-events: none;
          transition: opacity ${DURATION}ms ${EASING};
      `;

    document.body.appendChild(exitTransition);

    // Slow premium fade
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        exitTransition.style.opacity = "1";
      });
    });

    setTimeout(() => {
      window.location.href = destination.href;
    }, DURATION);
  });
})();
