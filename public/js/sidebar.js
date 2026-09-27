document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuIcon = document.getElementById("mobileMenuIcon");
  const closeBtn = document.getElementById("closeSidebarBtn");
  const chatbot = document.getElementById("SavePointChatbot");

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

  // Change the menu icon
  function setMenuIcon(icon) {
    if (menuIcon) {
      menuIcon.setAttribute("icon", icon);
    }
  }

  // Open sidebar
  function openSidebar() {
    sidebar.classList.remove("-translate-x-full");

    overlay.classList.remove("opacity-0", "pointer-events-none");

    document.body.classList.add("overflow-hidden");

    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close sidebar");

    setMenuIcon("x");

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

    if (chatbot) {
      chatbot.style.visibility = "";
      chatbot.style.pointerEvents = "";
    }
  }

  // Set initial state
  if (window.innerWidth < mobileBreakpoint) {
    closeSidebar();
  } else {
    sidebar.classList.remove("-translate-x-full");

    overlay.classList.add("opacity-0", "pointer-events-none");

    document.body.classList.remove("overflow-hidden");
    setMenuIcon("menu");
  }

  // Toggle sidebar using the header button
  menuBtn.addEventListener("click", () => {
    const isClosed = sidebar.classList.contains("-translate-x-full");

    if (isClosed) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  // Close when clicking outside the sidebar
  overlay.addEventListener("click", closeSidebar);

  // Close when pressing Escape
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

      if (chatbot) {
        chatbot.style.visibility = "";
        chatbot.style.pointerEvents = "";
      }
    } else {
      closeSidebar();
    }
  });
});
