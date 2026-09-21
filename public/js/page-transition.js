(() => {
  "use strict";

  const duration = 650;
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Page entrance
  document.documentElement.style.opacity = "0";
  document.documentElement.style.transform = "translateY(4px)";
  document.documentElement.style.filter = "blur(2px)";

  requestAnimationFrame(() => {
    document.documentElement.style.transition = `
          opacity ${duration}ms ${easing},
          transform ${duration}ms ${easing},
          filter ${duration}ms ${easing}
      `;

    document.documentElement.style.opacity = "1";
    document.documentElement.style.transform = "translateY(0)";
    document.documentElement.style.filter = "blur(0)";
  });

  // Internal page navigation
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
      destination.search === window.location.search
    ) {
      return;
    }

    event.preventDefault();

    // Premium exit
    document.documentElement.style.transition = `
          opacity ${duration}ms ${easing},
          transform ${duration}ms ${easing},
          filter ${duration}ms ${easing}
      `;

    document.documentElement.style.opacity = "0";
    document.documentElement.style.transform = "translateY(-4px)";
    document.documentElement.style.filter = "blur(2px)";

    setTimeout(() => {
      window.location.href = destination.href;
    }, duration);
  });
})();
