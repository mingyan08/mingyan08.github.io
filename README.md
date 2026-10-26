# Ming Yan's academic website

[Open the website](https://mingyan08.github.io/) · [Detailed editing guide](content/README.md) · [Calculus II resources](https://mingyan08.github.io/Teaching/MAT1002/)

## How to update my website

Ordinary updates only require editing Markdown on GitHub. Publications, teaching, people, and activities are entered once and appear in both language versions.

| I want to… | File and section | Open the editor |
|---|---|---|
| Add a publication | `content/shared.md` → Publications | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/shared.md) |
| Add a course or change a teaching link | `content/shared.md` → Teaching | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/shared.md) |
| Add a talk, award, or other activity | `content/shared.md` → Selected Activities | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/shared.md) |
| Update students or postdocs | `content/shared.md` → People | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/shared.md) |
| Change English prose | `content/en.md` | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/en.md) |
| Change Chinese prose | `content/zh.md` | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/content/zh.md) |
| Add or describe a Calculus II module | `Teaching/MAT1002/README.md` | [Edit](https://github.com/mingyan08/mingyan08.github.io/edit/main/Teaching/MAT1002/README.md) |

The edit links above target `main`. If reviewing a proposed change on another branch, open the file on that branch before editing.

### The usual update

1. Open the appropriate editor above and find the section.
2. Copy a nearby entry or one of the [templates](content/README.md#publication-template), then replace its details and links.
3. Review the change. GitHub's Markdown preview checks the text; the website has its own layout.
4. Click **Commit changes**, write a short description, and save to the site's publishing branch as allowed by the repository settings.
5. Wait for the Pages deployment to finish in [Actions](https://github.com/mingyan08/mingyan08.github.io/actions), then refresh the website and test the new links.

**Remember:** keep section identifiers such as `{#publications}` unchanged. Keep each publication, course, or activity on one source line; the editor may wrap a long line visually. You do not need to run a build for online edits.

### What the site does automatically

- Publications appear newest year first, with topic filters. Papers from the same year retain their order in the file.
- Selected Activities appears after the first real dated entry is added. It shows the latest five entries, with older entries available under an expandable heading.
- The Calculus II link opens a course overview; its module descriptions are maintained in the course's Markdown file.

See the [editing guide](content/README.md) for copyable examples, link and file-upload instructions, supported formatting, and optional local previewing.
