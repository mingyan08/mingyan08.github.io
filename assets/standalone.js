/* Page interactions only. Markdown rendering is shared with tools/build-site.js. */
(function () {
  "use strict";

  const root = document.documentElement;
  const contentRoot = document.getElementById("content-root");
  if (!contentRoot) return;
  const mainNav = document.querySelector(".main-nav");
  const languageButtons = Array.from(document.querySelectorAll("[data-set-lang]"));
  const homeLink = document.querySelector("[data-home-link]");
  const hadPrebuiltContent = contentRoot.dataset.contentReady === "true";
  let navLinks = [];
  let selectedTopic = "";
  let scrollPending = false;

  function hashTarget() {
    try { return decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return ""; }
  }

  function initialLanguage() {
    const linkedLanguage = hashTarget().match(/-(en|zh)$/);
    if (linkedLanguage) return linkedLanguage[1];
    try {
      const saved = localStorage.getItem("site-language");
      if (saved === "en" || saved === "zh") return saved;
    } catch (_) { /* Reading the site does not require browser storage. */ }
    return navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function updateActiveNav() {
    scrollPending = false;
    const header = document.querySelector(".site-header");
    const threshold = (header ? header.getBoundingClientRect().height : 0) + 48;
    let active = null;
    navLinks.forEach((link) => {
      const section = document.getElementById(`${link.dataset.section}-${root.dataset.lang}`);
      if (section && section.getBoundingClientRect().top <= threshold) active = link;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("active", link === active);
      if (link === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function scheduleNavUpdate() {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(updateActiveNav);
  }

  function applyLanguage(language) {
    const next = language === "zh" ? "zh" : "en";
    root.lang = next === "zh" ? "zh-CN" : "en";
    root.dataset.lang = next;
    document.body.dataset.lang = next;
    languageButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.setLang === next)));
    navLinks.forEach((link) => link.setAttribute("href", `#${link.dataset.section}-${next}`));
    if (homeLink) homeLink.setAttribute("href", `#top-${next}`);
    try { localStorage.setItem("site-language", next); } catch (_) { /* Language switching still works. */ }
    scheduleNavUpdate();
  }

  function scrollToHash() {
    const target = document.getElementById(hashTarget());
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
  }

  function switchLanguage(language) {
    const oldTarget = hashTarget();
    const activeLink = navLinks.find((link) => link.classList.contains("active"));
    const section = oldTarget.match(/^(.+)-(en|zh)$/)?.[1] || (activeLink ? activeLink.dataset.section : "top");
    applyLanguage(language);
    const nextTarget = document.getElementById(`${section}-${root.dataset.lang}`);
    if (nextTarget) {
      try { history.replaceState(null, "", `#${nextTarget.id}`); }
      catch (_) { window.location.hash = nextTarget.id; }
      scrollToHash();
    }
  }

  function applyPublicationFilter() {
    contentRoot.querySelectorAll("[data-publications]").forEach((group) => {
      const articles = Array.from(group.querySelectorAll("[data-publication-topic]"));
      let shown = 0;
      articles.forEach((article) => {
        article.hidden = !!selectedTopic && article.dataset.publicationTopic !== selectedTopic;
        if (!article.hidden) shown += 1;
      });
      group.querySelectorAll("[data-publication-filter]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.publicationFilter === selectedTopic));
      });
      const status = group.querySelector("[data-publication-count]");
      if (status) status.textContent = group.dataset.language === "zh"
        ? `显示 ${shown} / ${articles.length} 篇论文${selectedTopic ? `（${selectedTopic}）` : ""}`
        : `${shown} of ${articles.length} publications${selectedTopic ? ` · ${selectedTopic}` : ""}`;
    });
    scheduleNavUpdate();
  }

  function initializeContent() {
    navLinks = mainNav ? Array.from(mainNav.querySelectorAll("a[data-section]")) : [];
    applyLanguage(initialLanguage());
    applyPublicationFilter();
    scrollToHash();
  }

  async function fetchText(path) {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.text();
  }

  async function loadContent() {
    if (!window.SiteRenderer) throw new Error("The page renderer is unavailable.");
    const [en, zh, shared] = await Promise.all([
      fetchText("content/en.md"), fetchText("content/zh.md"), fetchText("content/shared.md"),
    ]);
    const rendered = window.SiteRenderer.renderSite({ en, zh, shared });
    contentRoot.innerHTML = rendered.contentHtml;
    contentRoot.dataset.contentReady = "true";
    if (mainNav) mainNav.innerHTML = rendered.navHtml;
    initializeContent();
  }

  function showLoadError() {
    if (hadPrebuiltContent) {
      const notice = document.createElement("p");
      notice.className = "load-notice";
      notice.setAttribute("role", "status");
      notice.textContent = root.dataset.lang === "zh" ? "当前显示已保存的页面。请稍后刷新以查看最新内容。" : "Showing the saved page. Refresh later to check for updates.";
      contentRoot.prepend(notice);
      initializeContent();
      return;
    }
    contentRoot.innerHTML = `<section class="section loading error"><h1>The page could not be loaded</h1><p>Please refresh the page or use the links below.</p><p><a href="https://scholar.google.com/citations?user=IR1mvb0AAAAJ&amp;hl=en">Publications on Google Scholar</a> · <a href="https://github.com/mingyan08/mingyan08.github.io/tree/main/content">Website content on GitHub</a></p>${window.location.protocol === "file:" ? '<p>For a local preview, open the generated <code>preview.html</code> or follow the preview instructions in the repository README.</p>' : ""}</section>`;
  }

  languageButtons.forEach((button) => button.addEventListener("click", () => switchLanguage(button.dataset.setLang)));
  contentRoot.addEventListener("click", (event) => {
    const button = event.target.closest && event.target.closest("[data-publication-filter]");
    if (!button || !contentRoot.contains(button)) return;
    selectedTopic = button.dataset.publicationFilter || "";
    applyPublicationFilter();
  });
  window.addEventListener("hashchange", () => {
    const linkedLanguage = hashTarget().match(/-(en|zh)$/);
    if (linkedLanguage) applyLanguage(linkedLanguage[1]);
    scrollToHash();
  });
  window.addEventListener("scroll", scheduleNavUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavUpdate);

  initializeContent();
  // The offline export already contains both languages. A file:// fetch must not erase it.
  if (!(window.location.protocol === "file:" && hadPrebuiltContent)) loadContent().catch(showLoadError);
})();
