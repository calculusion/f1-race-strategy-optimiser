(() => {
  "use strict";

  const DURATION = 420;
  const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Initial page entrance
  document.documentElement.classList.add("page-enter");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add("page-enter-active");
    });
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      document.documentElement.classList.remove(
        "page-enter",
        "page-enter-active",
      );
    }, DURATION);
  });

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

    if (destination.origin !== window.location.origin) {
      return;
    }

    if (
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search
    ) {
      return;
    }

    event.preventDefault();

    document.documentElement.classList.remove(
      "page-enter",
      "page-enter-active",
    );

    document.documentElement.classList.add("page-exit");

    setTimeout(() => {
      window.location.href = destination.href;
    }, DURATION);
  });
})();
