const fs = require("fs");
const path = require("path");

const siteDir = path.resolve(__dirname, "..");
const contentDir = path.join(siteDir, "content");
const outputPath = path.join(siteDir, "index.html");

const navIds = ["about", "research", "publications", "people", "teaching", "join"];
const bandSections = new Set(["about", "publications", "teaching"]);
const cardSections = new Set(["about", "research", "people", "teaching", "join"]);
const sponsorLogos = [
  { src: "images/nsfc.png", alt: "National Natural Science Foundation of China" },
  { src: "images/Guangdong.png", alt: "Department of Science and Technology of Guangdong Province" },
  { src: "images/Shenzhen.png", alt: "Shenzhen Science and Technology Innovation Commission" },
  { src: "images/SZNSF.png", alt: "Shenzhen Natural Science Foundation" },
  { src: "images/NSF.png", alt: "U.S. National Science Foundation" },
  { src: "images/FORD.png", alt: "Ford Motor Company" },
  { src: "images/Facebook.png", alt: "Meta" },
];

const topicClasses = {
  "Distributed": "topic-distributed",
  "PINN": "topic-pinns",
  "Primal-Dual": "topic-primal-dual",
  "Sparse": "topic-sparse",
  "AI for Math": "topic-ai-math",
};

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function topicClass(topic) {
  return topicClasses[topic] || `topic-${slugify(topic)}`;
}

function parseHeading(rawTitle) {
  const match = rawTitle.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
  if (!match) {
    return { title: rawTitle.trim(), id: slugify(rawTitle) };
  }

  return { title: match[1].trim(), id: match[2] };
}

function inlineMarkdown(text) {
  let html = escapeHtml(text.trim());
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, function (_, label, href) {
    const safeHref = href.trim().replace(/&amp;/g, "&");
    const external = /^https?:\/\//i.test(safeHref);
    const attrs = external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${escapeHtml(safeHref)}"${attrs}>${label}</a>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const heroLines = [];
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const heading = parseHeading(sectionMatch[1]);
      current = { id: heading.id, title: heading.title, lines: [] };
      sections.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    } else {
      heroLines.push(line);
    }
  });

  return { hero: parseHero(heroLines), sections };
}

function parseHero(lines) {
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const title = titleIndex >= 0 ? lines[titleIndex].replace(/^#\s+/, "").trim() : "Ming Yan · 严明";
  const bodyLines = lines.slice(titleIndex + 1);
  const actionLines = bodyLines.filter((line) => /^-\s+\[[^\]]+]\([^)]+\)/.test(line.trim()));
  const textLines = bodyLines.filter((line) => !/^\s*-\s+/.test(line));
  const paragraphs = collectParagraphs(textLines);
  const role = paragraphs.shift() || "";

  return { title, role, paragraphs, actions: actionLines.map(parseListLink).filter(Boolean) };
}

function parseListLink(line) {
  const match = line.trim().match(/^-\s+\[([^\]]+)]\(([^)]+)\)/);
  if (!match) {
    return null;
  }
  return { label: match[1], href: match[2] };
}

function collectParagraphs(lines) {
  const paragraphs = [];
  let buffer = [];

  lines.forEach((line) => {
    if (!line.trim()) {
      flush();
      return;
    }
    buffer.push(line.replace(/\s{2,}$/, ""));
  });
  flush();

  function flush() {
    if (!buffer.length) {
      return;
    }
    paragraphs.push(buffer.join(" ").trim());
    buffer = [];
  }

  return paragraphs;
}

function splitIntroAndCards(lines) {
  const intro = [];
  const cards = [];
  let current = null;

  lines.forEach((line) => {
    const cardMatch = line.match(/^###\s+(.+)$/);
    if (cardMatch) {
      current = { title: cardMatch[1].trim(), lines: [] };
      cards.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  });

  return { intro, cards };
}

function renderBlocks(lines) {
  let html = "";
  let paragraph = [];
  let list = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^-\s+/, ""));
      return;
    }

    flushList();
    paragraph.push(trimmed.replace(/\s{2,}$/, ""));
  });

  flushParagraph();
  flushList();
  return html;

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }
    html += `<p>${inlineMarkdown(paragraph.join(" "))}</p>`;
    paragraph = [];
  }

  function flushList() {
    if (!list.length) {
      return;
    }
    html += `<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`;
    list = [];
  }
}

function renderHero(hero, language) {
  const titleParts = hero.title.split(/\s+·\s+/);
  const primaryName = titleParts[0] || hero.title;
  const localName = titleParts.slice(1).join(" · ");
  const actions = hero.actions
    .map((action) => {
      const external = /^https?:\/\//i.test(action.href);
      const attrs = external ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${escapeHtml(action.href)}"${attrs}>${escapeHtml(action.label)}</a>`;
    })
    .join("");

  return `
    <section class="hero section" id="top-${language}">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">${language === "zh" ? "优化 · 机器学习 · 科学计算" : "Optimization · Machine Learning · Scientific Computing"}</p>
          <h1>
            <span class="hero-name-primary">${escapeHtml(primaryName)}</span>
            ${localName ? `<span class="hero-name-local">${escapeHtml(localName)}</span>` : ""}
          </h1>
          ${hero.role ? `<p class="hero-role">${inlineMarkdown(hero.role)}</p>` : ""}
          ${hero.paragraphs.map((paragraph) => `<p class="hero-summary">${inlineMarkdown(paragraph)}</p>`).join("")}
          <div class="hero-actions" aria-label="Profile links">${actions}</div>
        </div>
        <aside class="profile-panel" aria-label="Profile">
          <img src="Yan3.JPG" alt="Portrait of Ming Yan" width="308" height="450">
          <div>
            <p class="profile-name">Ming Yan · 严明</p>
            <p>${language === "zh" ? "中国广东省深圳市，518172" : "Shenzhen, Guangdong 518172, China"}</p>
            <p><a href="mailto:yanming@cuhk.edu.cn">yanming@cuhk.edu.cn</a></p>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderCard(sectionId, card) {
  const cardClass = sectionId === "research" ? "research-card" : "list-card";
  return `
    <article class="${cardClass}">
      <h3>${inlineMarkdown(card.title)}</h3>
      ${renderBlocks(card.lines)}
    </article>
  `;
}

function renderPublications(lines) {
  const items = lines
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, ""));

  return `
    <div class="publication-list">
      ${items
        .map((item) => {
          const taggedMatch = item.match(/^\*\*([^*]+)\*\*\s+\|\s+\*\*(\d{4})\*\*\s+(.+)$/);
          const yearMatch = item.match(/^\*\*(\d{4})\*\*\s+(.+)$/);
          const tag = taggedMatch ? taggedMatch[1] : "";
          const year = taggedMatch ? taggedMatch[2] : yearMatch ? yearMatch[1] : "";
          const bodyText = taggedMatch ? taggedMatch[3] : yearMatch ? yearMatch[2] : item;
          const tagHtml = tag ? `<span class="pub-tag ${topicClass(tag)}">${escapeHtml(tag)}</span>` : "";
          return `<article>${year ? `<time>${year}</time>` : ""}<p>${tagHtml}${inlineMarkdown(bodyText)}</p></article>`;
        })
        .join("")}
    </div>
  `;
}

function renderSection(section, language) {
  const { intro, cards } = splitIntroAndCards(section.lines);
  const isCardSection = cardSections.has(section.id) && cards.length > 0;
  const classNames = ["section", "markdown-section"];
  if (bandSections.has(section.id)) {
    classNames.push("section-band");
  }

  const introHtml = section.id === "publications"
    ? renderBlocks(intro.filter((line) => !/^\s*-\s+/.test(line)))
    : renderBlocks(intro);

  let bodyHtml = "";
  if (section.id === "publications") {
    bodyHtml = renderPublications(section.lines);
  } else if (isCardSection) {
    const gridClass = {
      about: "timeline",
      research: "research-grid",
      people: "people-grid",
      teaching: "course-columns",
      join: "opportunity-grid",
    }[section.id] || "card-grid";
    bodyHtml = `<div class="${gridClass}">${cards.map((card) => renderCard(section.id, card)).join("")}</div>`;
  } else if (section.id === "support") {
    bodyHtml = "";
  } else {
    bodyHtml = renderBlocks(section.lines);
  }

  if (section.id === "support") {
    bodyHtml += renderSponsorLogos();
  }

  return `
    <section class="${classNames.join(" ")}" id="${section.id}-${language}" data-section-id="${section.id}">
      <div class="section-heading wide">
        <p class="eyebrow">${escapeHtml(section.title)}</p>
        <h2>${inlineMarkdown(section.title)}</h2>
        ${introHtml}
      </div>
      ${bodyHtml}
    </section>
  `;
}

function renderSponsorLogos() {
  return `
    <div class="logo-strip" aria-label="Funding agency logos">
      ${sponsorLogos.map((logo) => `<img src="${logo.src}" alt="${escapeHtml(logo.alt)}">`).join("")}
    </div>
  `;
}

function mergeSharedSections(languageSections, sharedSections) {
  const sharedById = sharedSections.reduce((map, section) => {
    map[section.id] = section;
    return map;
  }, {});

  return languageSections.map((section) => {
    const shared = sharedById[section.id];
    if (!shared) {
      return section;
    }

    return {
      ...section,
      lines: [...section.lines, "", ...shared.lines],
    };
  });
}

function renderLanguagePage(parsed, language) {
  return `
    <div class="language-page" data-page-lang="${language}">
      ${renderHero(parsed.hero, language)}
      ${parsed.sections.map((section) => renderSection(section, language)).join("")}
    </div>
  `;
}

function sectionTitle(parsed, id) {
  const section = parsed.sections.find((item) => item.id === id);
  return section ? section.title : id;
}

function renderNav(en, zh) {
  return navIds
    .map((id) => `
      <a href="#${id}-en" data-section="${id}">
        <span data-lang="en">${escapeHtml(sectionTitle(en, id))}</span>
        <span data-lang="zh">${escapeHtml(sectionTitle(zh, id))}</span>
      </a>
    `)
    .join("");
}

function renderDocument(en, zh) {
  return `<!doctype html>
<html lang="en" data-lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Ming Yan, Associate Professor and Assistant Dean at CUHK-Shenzhen. Research in optimization, machine learning, and scientific computing.">
  <title>Ming Yan | 严明</title>
  <link rel="preload" href="Yan3.JPG" as="image">
  <link rel="stylesheet" href="assets/standalone.css">
  <script src="assets/standalone.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="#top-en" aria-label="Ming Yan home" data-home-link>
        <span>Ming Yan</span>
        <span>严明</span>
      </a>
      <nav class="main-nav" aria-label="Primary">
        ${renderNav(en, zh)}
      </nav>
      <div class="language-switch" aria-label="Language">
        <button type="button" data-set-lang="en" aria-pressed="true">EN</button>
        <button type="button" data-set-lang="zh" aria-pressed="false">中文</button>
      </div>
    </div>
  </header>

  <main id="main">
    <div id="content-root" class="content-root">
      ${renderLanguagePage(en, "en")}
      ${renderLanguagePage(zh, "zh")}
    </div>
  </main>

  <footer class="site-footer">
    <div>
      <p>Ming Yan · 严明</p>
      <p>
        <span data-lang="en">School of Data Science, The Chinese University of Hong Kong, Shenzhen</span>
        <span data-lang="zh">香港中文大学（深圳）数据科学学院</span>
      </p>
    </div>
    <div class="footer-links">
      <a href="mailto:yanming@cuhk.edu.cn">Email</a>
      <a href="https://scholar.google.com/citations?user=IR1mvb0AAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a>
      <a href="https://github.com/mingyan08" target="_blank" rel="noopener">GitHub</a>
    </div>
    <p class="updated">
      <span data-lang="en">Last updated: June 2026</span>
      <span data-lang="zh">更新日期：2026 年 6 月</span>
    </p>
  </footer>
</body>
</html>
`;
}

const shared = parseMarkdown(readText(path.join(contentDir, "shared.md")));
const en = parseMarkdown(readText(path.join(contentDir, "en.md")));
const zh = parseMarkdown(readText(path.join(contentDir, "zh.md")));

en.sections = mergeSharedSections(en.sections, shared.sections);
zh.sections = mergeSharedSections(zh.sections, shared.sections);

fs.writeFileSync(outputPath, renderDocument(en, zh), "utf8");
console.log(`Built ${path.relative(process.cwd(), outputPath)}`);
