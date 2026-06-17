(function () {
  const root = document.documentElement;
  const body = document.body;
  const buttons = Array.from(document.querySelectorAll("[data-set-lang]"));
  const navLinks = Array.from(document.querySelectorAll(".main-nav a[data-section]"));
  const homeLink = document.querySelector("[data-home-link]");
  let observer = null;

  function chooseInitialLanguage() {
    const saved = localStorage.getItem("site-language");
    if (saved === "en" || saved === "zh") {
      return saved;
    }

    return navigator.language && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function setActiveNav() {
    if (observer) {
      observer.disconnect();
    }

    const language = root.dataset.lang === "zh" ? "zh" : "en";
    const sections = navLinks
      .map((link) => document.getElementById(`${link.dataset.section}-${language}`))
      .filter(Boolean);

    if (!("IntersectionObserver" in window) || !sections.length) {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          navLinks.forEach((link) => {
            link.classList.toggle("active", `${link.dataset.section}-${language}` === entry.target.id);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function setLanguage(language) {
    const nextLanguage = language === "zh" ? "zh" : "en";
    root.lang = nextLanguage === "zh" ? "zh-CN" : "en";
    root.dataset.lang = nextLanguage;
    body.dataset.lang = nextLanguage;
    document.title = nextLanguage === "zh" ? "严明 | Ming Yan" : "Ming Yan | 严明";
    localStorage.setItem("site-language", nextLanguage);

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.setLang === nextLanguage));
    });

    navLinks.forEach((link) => {
      link.setAttribute("href", `#${link.dataset.section}-${nextLanguage}`);
      link.classList.remove("active");
    });

    if (homeLink) {
      homeLink.setAttribute("href", `#top-${nextLanguage}`);
    }

    setActiveNav();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.setLang));
  });

  setLanguage(chooseInitialLanguage());
})();
