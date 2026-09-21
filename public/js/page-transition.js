(() => {
  "use strict";

  const TRANSITION_DURATION = 450;

  // Create the transition overlay
  const overlay = document.createElement("div");

  overlay.id = "page-transition";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "99999",
    background: "#111113",
    opacity: "1",
    pointerEvents: "none",
    transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
  });

  document.body.prepend(overlay);

  // Smoothly reveal the current page
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = "0";
    });
  });

  // Remove overlay after transition
  setTimeout(() => {
    overlay.remove();
  }, TRANSITION_DURATION + 50);

  // Handle internal page navigation
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (!link) return;

    const href = link.getAttribute("href");

    // Ignore links that should behave normally
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      link.target === "_blank" ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    // Ignore external URLs
    const destination = new URL(href, window.location.href);

    if (destination.origin !== window.location.origin) {
      return;
    }

    // Ignore same-page navigation
    if (
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash === window.location.hash
    ) {
      return;
    }

    event.preventDefault();

    // Create transition overlay
    const exitOverlay = document.createElement("div");

    Object.assign(exitOverlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      background: "#111113",
      opacity: "0",
      pointerEvents: "none",
      transition: `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    });

    document.body.appendChild(exitOverlay);

    // Start fade
    requestAnimationFrame(() => {
      exitOverlay.style.opacity = "1";
    });

    // Navigate after transition
    setTimeout(() => {
      window.location.href = destination.href;
    }, TRANSITION_DURATION);
  });
})();
