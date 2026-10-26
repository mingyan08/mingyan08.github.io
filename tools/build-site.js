/* Optional offline previews. GitHub content edits do not need this command. */
const fs = require("node:fs");
const path = require("node:path");
const { renderSite, renderCourse } = require("../assets/site-renderer.js");

const siteDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(siteDir, relativePath), "utf8");
}

function fillRegion(template, region, content) {
  const start = `<!-- ${region}:start -->`;
  const end = `<!-- ${region}:end -->`;
  const from = template.indexOf(start);
  const to = template.indexOf(end);
  if (from < 0 || to <= from) {
    throw new Error(`Missing template region: ${region}`);
  }
  return template.slice(0, from + start.length) + "\n" + content + "\n" + template.slice(to);
}

function markReady(template, id) {
  const marker = `id="${id}"`;
  if (!template.includes(marker)) {
    throw new Error(`Missing content container: ${id}`);
  }
  return template.replace(marker, `${marker} data-content-ready="true"`);
}

function buildPreviews() {
  const rendered = renderSite({
    en: read("content/en.md"),
    zh: read("content/zh.md"),
    shared: read("content/shared.md"),
  });
  let home = fillRegion(read("index.html"), "site:nav", rendered.navHtml);
  home = fillRegion(home, "site:content", rendered.contentHtml);
  home = markReady(home, "content-root");
  // file:// URLs cannot resolve a site-root link; connect the two local previews.
  home = home.replace(/href="\/Teaching\/MAT1002\/"/g, 'href="Teaching/MAT1002/preview.html"');
  fs.writeFileSync(path.join(siteDir, "preview.html"), home, "utf8");

  let course = fillRegion(
    read("Teaching/MAT1002/index.html"),
    "course:content",
    renderCourse(read("Teaching/MAT1002/README.md"))
  );
  course = markReady(course, "course-content");
  course = course.replace(/href="\.\.\/\.\.\/#teaching-en"/g, 'href="../../preview.html#teaching-en"');
  fs.writeFileSync(path.join(siteDir, "Teaching/MAT1002/preview.html"), course, "utf8");

  return ["preview.html", "Teaching/MAT1002/preview.html"];
}

if (require.main === module) {
  try {
    buildPreviews().forEach((file) => console.log(`Created ${file}`));
    console.log("Keep previews with the repository assets. Source index.html files were not changed.");
  } catch (error) {
    console.error(`Could not build previews: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildPreviews };
