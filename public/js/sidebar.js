document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuIcon = document.getElementById("mobileMenuIcon");
  const closeBtn = document.getElementById("closeSidebarBtn");
  const chatbot = document.getElementById("SavePointChatbot");
  const header = document.getElementById("mainHeader");

  if (!menuBtn || !sidebar || !overlay) {
    console.error("Sidebar elements not found:", {
      menuBtn,
      sidebar,
      overlay,
    });
    return;
  }

  // Match the Tailwind lg breakpoint
  const mobileBreakpoint = 1024;

  // Preserve the header's original inline styles
  const originalHeaderStyles = header
    ? {
        backgroundColor: header.style.backgroundColor,
        borderColor: header.style.borderColor,
        backdropFilter: header.style.backdropFilter,
      }
    : null;

  // Preserve original visibility of header elements
  const originalVisibility = new Map();

  if (header) {
    header.querySelectorAll("*").forEach((element) => {
      originalVisibility.set(element, element.style.visibility);
    });
  }

  // Change the menu icon
  function setMenuIcon(icon) {
    if (menuIcon) {
      menuIcon.setAttribute("icon", icon);
    }
  }

  // Make the header transparent and hide everything except
  // the menu button and its icon.
  function setHeaderOpen() {
    if (!header || window.innerWidth >= mobileBreakpoint) return;

    header.style.backgroundColor = "transparent";
    header.style.borderColor = "transparent";
    header.style.backdropFilter = "none";

    header.querySelectorAll("*").forEach((element) => {
      const isMenuButton = element === menuBtn;
      const isMenuIcon = menuBtn.contains(element);
      const isMenuButtonParent = element.contains(menuBtn);

      if (isMenuButton || isMenuIcon || isMenuButtonParent) {
        return;
      }

      element.style.visibility = "hidden";
    });
  }

  // Restore the header to its original appearance
  function setHeaderClosed() {
    if (!header || !originalHeaderStyles) return;

    header.style.backgroundColor = originalHeaderStyles.backgroundColor;
    header.style.borderColor = originalHeaderStyles.borderColor;
    header.style.backdropFilter = originalHeaderStyles.backdropFilter;

    header.querySelectorAll("*").forEach((element) => {
      if (originalVisibility.has(element)) {
        element.style.visibility = originalVisibility.get(element);
      }
    });
  }

  // Open sidebar
  function openSidebar() {
    sidebar.classList.remove("-translate-x-full");

    overlay.classList.remove("opacity-0", "pointer-events-none");

    document.body.classList.add("overflow-hidden");

    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close sidebar");

    setMenuIcon("x");
    setHeaderOpen();

    if (chatbot) {
      chatbot.style.visibility = "hidden";
      chatbot.style.pointerEvents = "none";
    }
  }

  // Close sidebar
  function closeSidebar() {
    sidebar.classList.add("-translate-x-full");

    overlay.classList.add("opacity-0", "pointer-events-none");

    document.body.classList.remove("overflow-hidden");

    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open sidebar");

    setMenuIcon("menu");
    setHeaderClosed();

    if (chatbot) {
      chatbot.style.visibility = "";
      chatbot.style.pointerEvents = "";
    }
  }

  // Initial state
  if (window.innerWidth < mobileBreakpoint) {
    closeSidebar();
  } else {
    sidebar.classList.remove("-translate-x-full");

    overlay.classList.add("opacity-0", "pointer-events-none");

    document.body.classList.remove("overflow-hidden");
    setMenuIcon("menu");
  }

  // Toggle sidebar
  menuBtn.addEventListener("click", () => {
    const isClosed = sidebar.classList.contains("-translate-x-full");

    if (isClosed) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  // Close when clicking outside
  overlay.addEventListener("click", closeSidebar);

  // Close with Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });

  // Optional close button inside the sidebar
  if (closeBtn) {
    closeBtn.addEventListener("click", closeSidebar);
  }

  // Close after selecting a navigation link on mobile
  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < mobileBreakpoint) {
        closeSidebar();
      }
    });
  });

  // Handle screen resizing
  window.addEventListener("resize", () => {
    if (window.innerWidth >= mobileBreakpoint) {
      sidebar.classList.remove("-translate-x-full");

      overlay.classList.add("opacity-0", "pointer-events-none");

      document.body.classList.remove("overflow-hidden");

      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open sidebar");

      setMenuIcon("menu");
      setHeaderClosed();

      if (chatbot) {
        chatbot.style.visibility = "";
        chatbot.style.pointerEvents = "";
      }
    } else {
      closeSidebar();
    }
  });
});
