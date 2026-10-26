/* Shared by the live website and the optional offline preview. No DOM or dependencies. */
(function (host, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else host.SiteRenderer = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const sectionOrder = ["about", "activities", "research", "teaching", "people", "join", "support"];
  const navOrder = ["about", "activities", "research", "publications", "teaching", "people", "join"];
  const cardClasses = { about: "timeline", research: "research-grid", teaching: "course-columns", people: "people-grid", join: "opportunity-grid" };
  const topicClasses = {
    Optimization: "topic-optimization", Distributed: "topic-distributed", PINN: "topic-pinns", "Primal-Dual": "topic-primal-dual", Sparse: "topic-sparse", AI: "topic-ai-math",
    "Distributed Optimization Algorithms": "topic-distributed", "Physics-Informed Neural Networks": "topic-pinns", "Primal-Dual Algorithms": "topic-primal-dual", "Sparse Optimization and Signal Processing": "topic-sparse", "AI for Mathematical and Optimization Problems": "topic-ai-math",
  };
  const labels = {
    en: { about: "About", activities: "Activities", research: "Research", publications: "Publications", teaching: "Teaching", people: "People", join: "Join Us", support: "Acknowledgments" },
    zh: { about: "简介", activities: "学术活动", research: "研究", publications: "论文", teaching: "教学", people: "团队", join: "加入课题组", support: "致谢" },
  };

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function slugify(value) {
    return String(value).toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "") || "section";
  }

  function safeHref(value) {
    const href = value.trim();
    if (!href || /[\u0000-\u0020\u007f\\]/.test(href) || href.startsWith("//")) return null;
    const scheme = href.match(/^([a-z][a-z0-9+.-]*):/i);
    return scheme && !/^(https?|mailto)$/i.test(scheme[1]) ? null : href;
  }

  // Balanced URL parentheses preserve links such as https://doi.org/10.xxxx/example(2026).
  function readLink(text, start) {
    if (text[start] !== "[") return null;
    let labelDepth = 1;
    let labelEnd = start + 1;
    for (; labelEnd < text.length; labelEnd += 1) {
      if (text[labelEnd] === "[") labelDepth += 1;
      if (text[labelEnd] === "]") labelDepth -= 1;
      if (!labelDepth) break;
    }
    if (labelDepth || text[labelEnd + 1] !== "(") return null;
    let depth = 1;
    let end = labelEnd + 2;
    for (; end < text.length; end += 1) {
      if (text[end] === "(") depth += 1;
      if (text[end] === ")") depth -= 1;
      if (!depth) break;
    }
    return depth ? null : { label: text.slice(start + 1, labelEnd), href: text.slice(labelEnd + 2, end), end: end + 1 };
  }

  // A small Markdown subset. Text is escaped before insertion; raw HTML is never executed.
  function inlineMarkdown(value, depth) {
    const text = String(value).trim();
    if ((depth || 0) > 8) return escapeHtml(text);
    let html = "";
    for (let i = 0; i < text.length;) {
      if (text[i] === "`") {
        const end = text.indexOf("`", i + 1);
        if (end > i + 1) {
          html += `<code>${escapeHtml(text.slice(i + 1, end))}</code>`;
          i = end + 1;
          continue;
        }
      }
      if (text[i] === "[") {
        const link = readLink(text, i);
        if (link) {
          const href = safeHref(link.href);
          const label = inlineMarkdown(link.label, (depth || 0) + 1);
          const attrs = href && /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : "";
          html += href ? `<a href="${escapeHtml(href)}"${attrs}>${label}</a>` : label;
          i = link.end;
          continue;
        }
      }
      const marker = text.startsWith("**", i) ? "**" : text[i] === "*" ? "*" : null;
      if (marker) {
        const end = text.indexOf(marker, i + marker.length);
        if (end > i + marker.length) {
          const tag = marker === "**" ? "strong" : "em";
          html += `<${tag}>${inlineMarkdown(text.slice(i + marker.length, end), (depth || 0) + 1)}</${tag}>`;
          i = end + marker.length;
          continue;
        }
      }
      html += escapeHtml(text[i]);
      i += 1;
    }
    return html;
  }

  function parseHeading(title) {
    const match = title.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
    return match ? { title: match[1].trim(), id: match[2] } : { title: title.trim(), id: slugify(title) };
  }

  function parseMarkdown(markdown) {
    const lines = String(markdown || "").replace(/<!--[\s\S]*?-->/g, "").replace(/\r\n?/g, "\n").split("\n");
    const heroLines = [];
    const sections = [];
    let current = null;
    lines.forEach((line) => {
      const match = line.match(/^##\s+(.+)$/);
      if (match) {
        current = { ...parseHeading(match[1]), lines: [] };
        sections.push(current);
      } else (current ? current.lines : heroLines).push(line);
    });
    return { heroLines, sections };
  }

  function paragraphs(lines) {
    return lines.join("\n").split(/\n\s*\n/).map((text) => text.trim().replace(/\s*\n\s*/g, " ")).filter(Boolean);
  }

  function splitCards(lines) {
    const intro = [];
    const cards = [];
    let current = null;
    lines.forEach((line) => {
      const match = line.match(/^###\s+(.+)$/);
      if (match) {
        current = { title: match[1].trim(), lines: [] };
        cards.push(current);
      } else (current ? current.lines : intro).push(line);
    });
    return { intro, cards };
  }

  function renderBlocks(lines) {
    let html = "";
    let paragraph = [];
    let list = [];
    function flushParagraph() {
      if (paragraph.length) html += `<p>${inlineMarkdown(paragraph.join(" "))}</p>`;
      paragraph = [];
    }
    function flushList() {
      if (list.length) html += `<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`;
      list = [];
    }
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
      } else if (/^-\s+/.test(trimmed)) {
        flushParagraph();
        list.push(trimmed.replace(/^-\s+/, ""));
      } else if (list.length) list[list.length - 1] += ` ${trimmed}`;
      else paragraph.push(trimmed);
    });
    flushParagraph();
    flushList();
    return html;
  }

  // A wrapped line belongs to the preceding bullet until a blank line separates them.
  function splitList(lines) {
    const items = [];
    const intro = [];
    let active = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (/^-\s+/.test(trimmed)) {
        items.push(trimmed.replace(/^-\s+/, ""));
        active = true;
      } else if (active && trimmed) items[items.length - 1] += ` ${trimmed}`;
      else {
        intro.push(line);
        if (!trimmed) active = false;
      }
    });
    return { items, intro };
  }

  function renderHero(lines, language) {
    const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
    const title = titleIndex >= 0 ? lines[titleIndex].replace(/^#\s+/, "").trim() : "Ming Yan · 严明";
    const textLines = [];
    const actions = [];
    lines.slice(titleIndex + 1).forEach((line) => {
      const match = line.trim().match(/^-\s+(.+)$/);
      if (match) {
        const action = readLink(match[1], 0);
        if (action && safeHref(action.href)) actions.push(inlineMarkdown(match[1]));
      } else textLines.push(line);
    });
    const copy = paragraphs(textLines);
    const role = copy.shift();
    const [primaryName, ...localName] = title.split(/\s+·\s+/);
    return `<section class="hero section" id="top-${language}"><div class="hero-grid">
      <div class="hero-copy"><p class="eyebrow">${language === "zh" ? "优化 · 机器学习 · 科学计算" : "Optimization · Machine Learning · Scientific Computing"}</p>
        <h1><span class="hero-name-primary">${escapeHtml(primaryName)}</span>${localName.length ? ` <span class="hero-name-local">${escapeHtml(localName.join(" · "))}</span>` : ""}</h1>
        ${role ? `<p class="hero-role">${inlineMarkdown(role)}</p>` : ""}${copy.map((text) => `<p class="hero-summary">${inlineMarkdown(text)}</p>`).join("")}
        <div class="hero-actions" aria-label="${language === "zh" ? "个人链接" : "Profile links"}">${actions.join("")}</div>
      </div>
      <aside class="profile-panel" aria-label="${language === "zh" ? "个人信息" : "Profile"}"><img src="Yan3.JPG" alt="${language === "zh" ? "严明的照片" : "Portrait of Ming Yan"}" width="308" height="450"><div><p>${language === "zh" ? "中国广东省深圳市，518172" : "Shenzhen, Guangdong 518172, China"}</p><p><a href="mailto:yanming@cuhk.edu.cn">yanming@cuhk.edu.cn</a></p></div></aside>
    </div></section>`;
  }

  function publicationItems(lines) {
    return splitList(lines).items.map((item, index) => {
      const tagged = item.match(/^\*\*([^*]+)\*\*\s*\|\s*\*\*(\d{4})\*\*\s+(.+)$/);
      const dated = item.match(/^\*\*(\d{4})\*\*\s+(.+)$/);
      return { topic: tagged ? tagged[1] : "", year: tagged ? tagged[2] : dated ? dated[1] : "", text: tagged ? tagged[3] : dated ? dated[2] : item, index };
    }).sort((a, b) => Number(b.year) - Number(a.year) || a.index - b.index);
  }

  function renderPublications(section, language) {
    const items = publicationItems(section.lines);
    const topics = [...new Set(items.map((item) => item.topic).filter(Boolean))];
    const listId = `publication-list-${language}`;
    const buttons = ["", ...topics].map((topic) => `<button type="button" class="publication-filter" data-publication-filter="${escapeHtml(topic)}" aria-pressed="${!topic}" aria-controls="${listId}">${escapeHtml(topic || (language === "zh" ? "全部方向" : "All topics"))}</button>`).join("");
    const count = language === "zh" ? `显示 ${items.length} / ${items.length} 篇论文` : `${items.length} of ${items.length} publications`;
    return `<div class="research-publications" id="publications-${language}" data-section-id="publications" data-publications data-language="${language}">
      <div class="research-subsection-heading"><h3>${inlineMarkdown(section.title)}</h3>${renderBlocks(splitList(section.lines).intro)}</div>
      <div class="publication-controls"><div class="publication-filters" role="group" aria-label="${language === "zh" ? "按研究方向筛选论文" : "Filter publications by topic"}">${buttons}</div><p class="publication-count" data-publication-count role="status" aria-live="polite" aria-atomic="true">${count}</p></div>
      <div class="publication-list" id="${listId}">${items.map((item) => `<article data-publication-topic="${escapeHtml(item.topic)}">${item.year ? `<time datetime="${item.year}">${item.year}</time>` : "<span></span>"}<p>${item.topic ? `<span class="pub-tag ${topicClasses[item.topic] || `topic-${slugify(item.topic)}`}">${escapeHtml(item.topic)}</span>` : ""}${inlineMarkdown(item.text)}</p></article>`).join("")}</div>
    </div>`;
  }

  function activityItems(lines) {
    return splitList(lines).items.map((item, index) => {
      const match = item.match(/^\*\*(\d{4}-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)\*\*\s+(.+)$/);
      return { date: match ? match[1] : "", text: match ? match[2] : item, index };
    }).sort((a, b) => b.date.localeCompare(a.date) || a.index - b.index);
  }

  function renderActivities(section, language) {
    const items = activityItems(section.lines);
    if (!items.length) return "";
    function list(entries) {
      return `<ul class="activity-list">${entries.map((item) => `<li>${item.date ? `<time class="activity-date" datetime="${item.date}">${item.date}</time>` : ""}<div>${inlineMarkdown(item.text)}</div></li>`).join("")}</ul>`;
    }
    const older = items.slice(5);
    return `<section class="section markdown-section activities-section" id="activities-${language}" data-section-id="activities"><div class="section-heading wide"><h2>${inlineMarkdown(section.title)}</h2>${renderBlocks(splitList(section.lines).intro)}</div>${list(items.slice(0, 5))}${older.length ? `<details class="activities-archive"><summary>${language === "zh" ? "往期活动" : "Earlier activities"} (${older.length})</summary>${list(older)}</details>` : ""}</section>`;
  }

  function renderSection(section, language, publications) {
    if (section.id === "activities") return renderActivities(section, language);
    const { intro, cards } = splitCards(section.lines);
    const isCards = cardClasses[section.id] && cards.length;
    const introHtml = renderBlocks(isCards ? intro : section.lines);
    let body = isCards ? `<div class="${cardClasses[section.id]}">${cards.map((card) => `<article class="${section.id === "research" ? "research-card" : "list-card"}"><h3>${inlineMarkdown(card.title)}</h3>${renderBlocks(card.lines)}</article>`).join("")}</div>` : "";
    if (section.id === "research" && publications) body += renderPublications(publications, language);
    return `<section class="section markdown-section${section.id === "about" || section.id === "teaching" ? " section-band" : ""}" id="${section.id}-${language}" data-section-id="${section.id}"><div class="section-heading wide"><h2>${inlineMarkdown(section.title)}</h2>${introHtml}</div>${body}</section>`;
  }

  function mergePage(markdown, shared, language) {
    const page = parseMarkdown(markdown);
    const ownById = Object.fromEntries(page.sections.map((section) => [section.id, section]));
    const sharedById = Object.fromEntries(shared.sections.map((section) => [section.id, section]));
    const sections = {};
    [...sectionOrder, "publications"].forEach((id) => {
      const own = ownById[id];
      const common = sharedById[id];
      if (own || common) sections[id] = { id, title: own ? own.title : labels[language][id], lines: [...(own ? own.lines : []), "", ...(common ? common.lines : [])] };
    });
    if (sections.activities && !activityItems(sections.activities.lines).length) delete sections.activities;
    return { heroLines: page.heroLines, sections };
  }

  function renderSite(sources) {
    const shared = parseMarkdown(sources.shared);
    const pages = { en: mergePage(sources.en, shared, "en"), zh: mergePage(sources.zh, shared, "zh") };
    const contentHtml = ["en", "zh"].map((language) => {
      const page = pages[language];
      return `<div class="language-page" data-page-lang="${language}">${renderHero(page.heroLines, language)}${sectionOrder.filter((id) => page.sections[id]).map((id) => renderSection(page.sections[id], language, page.sections.publications)).join("")}</div>`;
    }).join("");
    const navHtml = navOrder.filter((id) => pages.en.sections[id] || pages.zh.sections[id]).map((id) => `<a href="#${id}-en" data-section="${id}"><span data-lang="en">${escapeHtml(labels.en[id])}</span><span data-lang="zh">${escapeHtml(labels.zh[id])}</span></a>`).join("");
    return { contentHtml, navHtml };
  }

  function renderCourse(markdown) {
    const page = parseMarkdown(markdown);
    const titleLine = page.heroLines.find((line) => /^#\s+/.test(line));
    const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Course materials";
    const intro = page.heroLines.filter((line) => !/^#\s+/.test(line));
    return `<header class="course-hero"><h1>${inlineMarkdown(title)}</h1>${renderBlocks(intro)}</header>` + page.sections.map((section) => {
      const { intro: sectionIntro, cards } = splitCards(section.lines);
      const body = cards.length ? `${renderBlocks(sectionIntro)}<div class="course-grid">${cards.map((card) => `<article class="course-card"><h3>${inlineMarkdown(card.title)}</h3>${renderBlocks(card.lines)}</article>`).join("")}</div>` : renderBlocks(section.lines);
      return `<section class="course-section" id="${escapeHtml(section.id)}"><h2>${inlineMarkdown(section.title)}</h2>${body}</section>`;
    }).join("");
  }

  return { renderSite, renderCourse };
});
