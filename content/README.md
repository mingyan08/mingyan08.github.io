# Editing guide

The website reads its Markdown content directly. For ordinary changes, edit the relevant file on GitHub, commit it to the publishing branch, and wait for GitHub Pages to update. No local software or build command is required.

## Which file should I edit?

| File | Contents |
|---|---|
| [shared.md](shared.md) | Publications, teaching, people, and selected activities shown in both languages |
| [en.md](en.md) | English introduction, biography, research descriptions, recruitment text, and acknowledgments |
| [zh.md](zh.md) | Chinese versions of the language-specific text |
| [Calculus II README](../Teaching/MAT1002/README.md) | Course overview, module descriptions, and links |

Edit shared entries once. The English and Chinese pages use the same publication, teaching, people, and activity records. If an activity needs both languages, include both descriptions in that shared entry. Language-specific prose is edited separately in `en.md` and `zh.md`.

## Add a publication

Open `shared.md` and find `## Publications {#publications}`. Copy an entry, update its category, year, authors, title, venue, and links, then commit the change.

### Publication template

The following is a template, not an actual publication. Replace all example details and URLs before saving:

```markdown
- **Distributed** | **2026** A. Author and M. Yan, [Paper title](https://doi.org/REPLACE_ME), *Journal name*, volume, pages. ([Code](https://github.com/OWNER/REPOSITORY))
```

Keep the entire entry on **one source line**. Visual wrapping in the editor is fine. Preserve the bold category, the spaces around `|`, and the bold four-digit year.

The site sorts papers by year, newest first. Entries with the same year retain their order in the file; place a new paper where you want it within that year. Topic filters are generated from the category labels in the entries. Enter each paper once.

Suggested labels are `Optimization`, `Distributed`, `PINN`, `Primal-Dual`, `Sparse`, and `AI`. Use one consistent label for each topic. A new category can be added by using a new label; it will appear as a filter without a code change. Give each paper one category; a combined label would become a separate category.

Optional links can be added to the same line:

```markdown
([Paper](https://doi.org/REPLACE_ME)) ([Code](https://github.com/OWNER/REPOSITORY)) ([Slides](/Slides/FILENAME.pdf))
```

Omit links that are not available. Use the actual publication year and venue details; include a status such as “accepted” or “preprint” in the text when relevant.

## Add a course or teaching link

In `shared.md`, find `## Teaching {#teaching}` and the appropriate university heading. For example:

```markdown
- [COURSE CODE: Course title](https://example.edu/course/) - Spring 2027
```

Replace the example course, URL, and semester. Keep one course entry on one source line. For another offering of an existing course, add the semester to its current entry instead of duplicating the course.

Use a stable course overview link where possible. Calculus II links to `/Teaching/MAT1002/`, and its overview is maintained in [Teaching/MAT1002/README.md](../Teaching/MAT1002/README.md). To add a module there, copy an existing `###` module block, change the title and description, and link to the module's actual file. Existing module URLs can remain unchanged.

### Add a PDF or another resource

Upload the file to the appropriate folder using GitHub's **Add file → Upload files**, commit it, then add its link to the relevant Markdown entry. For example, a file stored as `Slides/FILENAME.pdf` can be linked as:

```markdown
[Slides](/Slides/FILENAME.pdf)
```

File and folder names are case-sensitive on the published website. Prefer short filenames without spaces, and test each link after publishing. Within the Calculus II overview, links such as `Sequence.html` are relative to the course folder.

## Add an important activity

In `shared.md`, find `## Selected Activities {#activities}`. Add a dated bullet **outside** the HTML comment containing the template instructions:

```markdown
- **2026-10** [Activity title](https://example.edu/event/). Brief description of the activity.
```

Replace the date, title, URL, and description with the actual details. An entry without a link is also valid:

```markdown
- **2026-10-26** Activity title. Brief description of the activity.
```

Use `YYYY-MM` or `YYYY-MM-DD`, including two digits for the month and day. Keep each activity on one source line. The site places newer dates first; entries with the same date keep their file order. The five latest entries are shown immediately, and older entries are available under an expandable heading.

The section and its navigation link stay hidden until the first real activity is entered. The commented template is never published. This lets you add a permanent record of talks, academic service, awards, or outreach whenever there is something to report.

## Update people

In `shared.md`, find `## People {#people}` and the relevant group. Copy a nearby bullet, update the name and affiliation, and add a personal link if available. When a student graduates, move the existing entry to the appropriate previous-students group and update its details.

## Formatting and section identifiers

The site supports the formatting used by these files: paragraphs, `##` section headings, `###` subsection or card headings, `-` bullet lists, `[label](URL)` links, `**bold**`, `*italic*`, and inline backticks. HTML comments (`<!-- ... -->`) are hidden and can hold editing notes.

This is a small Markdown renderer, not every feature of GitHub Markdown. Tables, nested lists, fenced code blocks, raw HTML layouts, and LaTeX equations are not part of the website content format. The guide itself is read on GitHub, so it can contain tables and fenced examples.

Keep these identifiers unchanged; they connect content to the navigation and shared sections:

| Section | Identifier |
|---|---|
| About | `{#about}` |
| Selected Activities | `{#activities}` |
| Research | `{#research}` |
| Publications | `{#publications}` |
| Teaching | `{#teaching}` |
| People | `{#people}` |
| Join Us | `{#join}` |
| Acknowledgments | `{#support}` |

You may change the displayed heading text before an identifier. Adding an entirely new top-level section beyond these configured sections requires a layout change; adding more entries or cards inside an existing section does not.

## Check an update

1. Read the changed entry in GitHub's Preview and check the diff for accidental deletions.
2. Commit with a short description, such as “Add publication on distributed optimization.”
3. Wait for the site's Pages deployment to finish in the repository's Actions tab.
4. Refresh the published website, check the relevant section in both languages, and open any new links.

GitHub's Preview is a text-formatting preview. Topic filters, cards, language switching, and the activity archive are rendered by the website and should be checked there.

## Optional local previews

These options are for working on a downloaded copy of the repository. Online content updates do not require them.

To preview live Markdown loading, run a local server from the repository folder:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. Opening the ordinary `index.html` directly may prevent the browser from loading its Markdown files.

If Node.js is installed, you can also generate a prebuilt preview:

```sh
node tools/build-site.js
```

On Windows, `build.bat` runs the same command. It writes `preview.html` in the repository folder and `Teaching/MAT1002/preview.html` for the course, without overwriting either `index.html`. The two previews link to each other. Open `preview.html` while keeping it beside the repository's assets. Its prebuilt content works without a Markdown fetch, although external links and externally hosted teaching resources may still need internet access. Regenerate the preview after editing the Markdown.

The optional preview and live site use the same renderer. Markdown files remain the source of truth; do not edit generated preview files.

## Checks for layout or code changes

If you change the rendering code, run `node tools/site.test.js`. These dependency-free checks cover bilingual content, publication order and filters, activities, course links, and offline previews. Ordinary online content edits still use the short checking process above.
