// Reveal page content after the page has loaded
window.addEventListener("load", () => {
  const pageContent = document.getElementById("pageContent");

  if (pageContent) {
    requestAnimationFrame(() => {
      pageContent.classList.remove("opacity-0", "translate-y-2");
    });
  }

  // Make sure the transition overlay is hidden
  hideTransition();
});

// Show the page transition overlay
function showTransition(message = "Loading...") {
  const overlay = document.getElementById("pageTransition");

  if (!overlay) return;

  const text = overlay.querySelector("#pageTransitionText");

  if (text) {
    text.textContent = message;
  }

  overlay.classList.remove("opacity-0", "pointer-events-none");
}

// Hide the page transition overlay
function hideTransition() {
  const overlay = document.getElementById("pageTransition");

  if (!overlay) return;

  overlay.classList.add("opacity-0", "pointer-events-none");
}

// Navigate with premium transition
function navigateWithTransition(url, message = "Loading...") {
  showTransition(message);

  setTimeout(() => {
    window.location.href = url;
  }, 500);
}
