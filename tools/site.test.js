const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { renderSite, renderCourse } = require("../assets/site-renderer.js");

const rootDir = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(rootDir, file), "utf8");
const source = {
  en: read("content/en.md"), zh: read("content/zh.md"), shared: read("content/shared.md"),
};
const count = (text, pattern) => (text.match(pattern) || []).length;
const addPublication = (entry) => ({
  ...source, shared: source.shared.replace("## Publications {#publications}", `## Publications {#publications}\n${entry}`),
});

test("one shared publication list appears in both languages without losing current entries", () => {
  const { contentHtml, navHtml } = renderSite(source);
  assert.equal(count(contentHtml, /data-publication-topic=/g), 10);
  for (const title of ["Fast projection onto the top-k-sum constraint", "Optimal gradient tracking for decentralized optimization", "A decentralized proximal-gradient method", "A new primal-dual algorithm", "ARock:"]) {
    assert.equal(contentHtml.split(title).length - 1, 2, title);
  }
  assert.match(navHtml, /data-section="publications"/);
  assert.equal(count(contentHtml, /href="\/Teaching\/MAT1002\/"/g), 2);
});

test("new publications are sorted by year, while same-year author ordering is preserved", () => {
  const result = renderSite(addPublication([
    '- **PINN** | **2027** First same-year paper.',
    '- **Sparse** | **2025** Middle-year paper.',
    '- **PINN** | **2027** Second same-year paper.',
  ].join("\n"))).contentHtml;
  assert.ok(result.indexOf("First same-year paper") < result.indexOf("Second same-year paper"));
  assert.ok(result.indexOf("Second same-year paper") < result.indexOf("Fast projection"));
  assert.ok(result.indexOf("Fast projection") < result.indexOf("Middle-year paper"));
  assert.match(result, /data-publication-filter="PINN"/);
});

test("wrapped publication text and parentheses in DOI links are preserved", () => {
  const html = renderSite(addPublication('- **Optimization** | **2027** An Author,\n  [A wrapped paper](https://doi.org/10.example/paper(2027)),\n  *A Journal*.')).contentHtml;
  assert.equal(count(html, /href="https:\/\/doi.org\/10.example\/paper\(2027\)"/g), 2);
  assert.equal(count(html, /<em>A Journal<\/em>/g), 2);
});

test("empty activity headings and commented examples do not create public announcements", () => {
  const result = renderSite(source);
  assert.doesNotMatch(result.navHtml, /data-section="activities"/);
  assert.doesNotMatch(result.contentHtml, /id="activities-(?:en|zh)"/);
  assert.doesNotMatch(result.contentHtml, /REPLACE_ME|Activity title|Talk title/);
});

test("one dated activity edit appears in both languages; older records are archived", () => {
  const entries = Array.from({ length: 7 }, (_, index) => `- **2026-0${index + 1}** Test activity ${index + 1}.`).join("\n");
  const shared = source.shared.replace(/## Selected Activities \{#activities\}/, `## Selected Activities {#activities}\n${entries}`);
  const result = renderSite({ ...source, shared });
  assert.match(result.navHtml, /data-section="activities"/);
  assert.equal(count(result.contentHtml, /class="activities-archive"/g), 2);
  assert.match(result.contentHtml, /Earlier activities \(2\)/);
  assert.ok(result.contentHtml.indexOf("Test activity 7") < result.contentHtml.indexOf("Test activity 6"));
  assert.equal(count(result.contentHtml, /Test activity 1\./g), 2);
});

test("content text stays text and unsafe link schemes are not rendered as links", () => {
  const html = renderSite(addPublication('- **AI** | **2027** <script>alert(1)</script> [Unsafe](javascript:alert(1)) [Safe](https://example.com/a?x=1&y=2).')).contentHtml;
  assert.doesNotMatch(html, /<script>|href="javascript:/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/example.com\/a\?x=1&amp;y=2"/);
});

test("course overview links all six original modules and preserves navigation targets", () => {
  const html = renderCourse(read("Teaching/MAT1002/README.md"));
  for (const file of ["Sequence.html", "Series2.html", "Power_Series.html", "Parametrization.html", "Cycloid.html", "Polar.html"]) {
    assert.equal(count(html, new RegExp(`href="${file.replace(/\./g, "\\.")}"`, "g")), 1);
    assert.ok(fs.existsSync(path.join(rootDir, "Teaching/MAT1002", file)));
  }
  for (const id of ["sequences-and-series", "curves-and-coordinates", "study-guide"]) assert.ok(html.includes(`id="${id}"`));
  assert.doesNotMatch(html, /Edit this file on GitHub/);
});

test("optional exports use the same renderer and never overwrite the live entry pages", () => {
  const homeBefore = read("index.html");
  const courseBefore = read("Teaching/MAT1002/index.html");
  const { buildPreviews } = require("./build-site.js");
  buildPreviews();
  assert.equal(read("index.html"), homeBefore);
  assert.equal(read("Teaching/MAT1002/index.html"), courseBefore);
  const home = read("preview.html");
  const course = read("Teaching/MAT1002/preview.html");
  const previewContent = renderSite(source).contentHtml.replace(/href="\/Teaching\/MAT1002\/"/g, 'href="Teaching/MAT1002/preview.html"');
  assert.ok(home.includes(previewContent));
  assert.ok(course.includes(renderCourse(read("Teaching/MAT1002/README.md"))));
  assert.equal(count(home, /href="Teaching\/MAT1002\/preview.html"/g), 2);
  assert.equal(count(course, /href="\.\.\/\.\.\/preview.html#teaching-en"/g), 2);
  assert.match(home, /id="content-root" data-content-ready="true"/);
  assert.match(course, /id="course-content" data-content-ready="true"/);
  assert.doesNotMatch(home, /Last updated: June 2026/);
});

// A small DOM fixture exercises the actual controller without a browser dependency.
// It models public DOM operations only; assertions concern author/visitor behavior.
function controllerFixture({ protocol = "file:", hash = "#publications-zh", failStorage = false, failFetch = false } = {}) {
  const clicks = new Map();
  const windowEvents = new Map();
  const element = (dataset = {}) => ({
    dataset, attributes: {}, hidden: false, textContent: "",
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, callback) { if (name === "click") clicks.set(this, callback); },
    classList: { toggle() {}, contains() { return false; } },
    getBoundingClientRect() { return { height: 72, top: 300 }; },
    scrollIntoView() { this.scrolled = true; },
  });
  const html = element();
  const languageButtons = [element({ setLang: "en" }), element({ setLang: "zh" })];
  const navLinks = ["research", "publications", "teaching"].map((section) => element({ section }));
  const nav = element();
  nav.querySelectorAll = () => navLinks;
  const groups = ["en", "zh"].map((language) => {
    const group = element({ language });
    group.articles = ["Distributed", "Optimization", "Distributed"].map((publicationTopic) => element({ publicationTopic }));
    group.buttons = ["", "Distributed", "Optimization"].map((publicationFilter) => element({ publicationFilter }));
    group.status = element();
    group.querySelectorAll = (selector) => selector === "[data-publication-topic]" ? group.articles : group.buttons;
    group.querySelector = () => group.status;
    return group;
  });
  const content = element({ contentReady: "true" });
  content.innerHTML = "SAVED CONTENT";
  content.querySelectorAll = () => groups;
  content.contains = (button) => groups.some((group) => group.buttons.includes(button));
  content.prepend = (notice) => { content.notice = notice; };
  const anchors = Object.fromEntries(["publications-en", "publications-zh", "research-en", "research-zh", "teaching-en", "teaching-zh", "top-en", "top-zh"].map((id) => [id, { ...element(), id }]));
  const home = element();
  const location = { protocol, hash };
  let fetches = 0;
  const context = {
    document: {
      documentElement: html, body: element(),
      getElementById: (id) => id === "content-root" ? content : anchors[id],
      querySelector: (selector) => selector === ".main-nav" ? nav : selector === "[data-home-link]" ? home : element(),
      querySelectorAll: () => languageButtons,
      createElement: () => element(),
    },
    window: { location, SiteRenderer: { renderSite }, addEventListener: (name, callback) => windowEvents.set(name, callback) },
    navigator: { language: "en-US" },
    localStorage: {
      getItem() { if (failStorage) throw new Error("Storage unavailable"); return "en"; },
      setItem() { if (failStorage) throw new Error("Storage unavailable"); },
    },
    history: { replaceState(_state, _title, nextHash) { location.hash = nextHash; } },
    requestAnimationFrame: (callback) => callback(),
    fetch: async () => { fetches += 1; if (failFetch) throw new Error("Network unavailable"); return { ok: true, text: async () => "" }; },
  };
  vm.runInNewContext(read("assets/standalone.js"), context);
  return { html, languageButtons, groups, content, anchors, location, clicks, fetches: () => fetches };
}

test("offline export remains readable, honors a Chinese deep link, and needs no storage or fetch", () => {
  const fixture = controllerFixture({ failStorage: true });
  assert.equal(fixture.fetches(), 0);
  assert.equal(fixture.content.innerHTML, "SAVED CONTENT");
  assert.equal(fixture.html.dataset.lang, "zh");
  assert.ok(fixture.anchors["publications-zh"].scrolled);
});

test("publication filters and counts update both languages and survive language switching", () => {
  const fixture = controllerFixture();
  const button = fixture.groups[0].buttons[1];
  fixture.clicks.get(fixture.content)({ target: { closest: () => button } });
  for (const group of fixture.groups) {
    assert.deepEqual(group.articles.map((article) => article.hidden), [false, true, false]);
    assert.equal(group.buttons[1].attributes["aria-pressed"], "true");
  }
  assert.match(fixture.groups[0].status.textContent, /2 of 3 publications/);
  assert.match(fixture.groups[1].status.textContent, /2 \/ 3/);
  fixture.clicks.get(fixture.languageButtons[0])();
  assert.equal(fixture.location.hash, "#publications-en");
  assert.equal(fixture.html.dataset.lang, "en");
  assert.equal(fixture.groups[0].articles[1].hidden, true);
});

test("a failed HTTP refresh keeps the prebuilt page available", async () => {
  const fixture = controllerFixture({ protocol: "https:", failFetch: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fixture.content.innerHTML, "SAVED CONTENT");
  assert.ok(fixture.content.notice);
});
