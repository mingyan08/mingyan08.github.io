(function () {
  "use strict";

  const content = document.getElementById("course-content");
  const status = document.getElementById("course-status");
  if (!content) return;

  const hasSavedOverview = content.dataset.contentReady === "true";

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
  }

  function restoreSection() {
    if (!window.location.hash) return;
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch (_) {
      return;
    }
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ block: "start" });
  }

  // A prebuilt overview already contains all content and needs no network request.
  // The ordinary HTML fallback also keeps every module accessible from a local folder.
  if (window.location.protocol === "file:") {
    restoreSection();
    return;
  }

  async function loadOverview() {
    if (!window.SiteRenderer || typeof window.SiteRenderer.renderCourse !== "function") {
      throw new Error("The overview renderer is unavailable.");
    }
    const response = await fetch("README.md", { cache: "no-cache" });
    if (!response.ok) throw new Error("The course overview could not be loaded.");
    const markdown = await response.text();
    const html = window.SiteRenderer.renderCourse(markdown);
    if (!html.trim()) throw new Error("The course overview is empty.");
    content.innerHTML = html;
    content.dataset.contentReady = "true";
    if (status) status.hidden = true;
    restoreSection();
  }

  loadOverview().catch(function () {
    // Keep the saved overview or useful module links in place if an update fails.
    showStatus(hasSavedOverview
      ? "Showing the saved course overview. The latest version could not be loaded."
      : "The full course guide could not be loaded. You can still open the modules below.");
  });
})();
