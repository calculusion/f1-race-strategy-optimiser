document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const menuIcon = document.getElementById("mobileMenuIcon");
  const closeBtn = document.getElementById("closeSidebarBtn");
  const chatbot = document.getElementById("SavePointChatbot");

  if (!menuBtn || !sidebar || !overlay) return;

  const mobileBreakpoint = 768;

  // Keep the sidebar closed when a mobile page loads
  if (window.innerWidth < mobileBreakpoint) {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("opacity-0", "pointer-events-none");
    document.body.classList.remove("overflow-hidden");
  }

  function openSidebar() {
    sidebar.classList.remove("-translate-x-full");

    overlay.classList.remove("opacity-0", "pointer-events-none");

    document.body.classList.add("overflow-hidden");

    if (menuIcon) {
      menuIcon.setAttribute("icon", "lucide:x");
    }

    if (chatbot) {
      chatbot.style.visibility = "hidden";
      chatbot.style.pointerEvents = "none";
    }
  }

  function closeSidebar() {
    sidebar.classList.add("-translate-x-full");

    overlay.classList.add("opacity-0", "pointer-events-none");

    document.body.classList.remove("overflow-hidden");

    if (menuIcon) {
      menuIcon.setAttribute("icon", "lucide:menu");
    }

    if (chatbot) {
      chatbot.style.visibility = "";
      chatbot.style.pointerEvents = "";
    }
  }

  // Toggle sidebar
  menuBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("-translate-x-full")) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  // Close when clicking outside the sidebar
  overlay.addEventListener("click", closeSidebar);

  // Close when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
    }
  });

  // Close button inside the sidebar
  if (closeBtn) {
    closeBtn.addEventListener("click", closeSidebar);
  }

  // Close sidebar after selecting a navigation link on mobile
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

      if (menuIcon) {
        menuIcon.setAttribute("icon", "lucide:menu");
      }

      if (chatbot) {
        chatbot.style.visibility = "";
        chatbot.style.pointerEvents = "";
      }
    } else {
      closeSidebar();
    }
  });
});
