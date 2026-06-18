# Editing Guide

You can edit most website content with Markdown. You do not need to edit HTML or CSS for ordinary content changes.

## Files to edit

- `content/en.md`: English-only text, including the English hero, about, research, join-us, and acknowledgments copy.
- `content/zh.md`: Chinese-only text for the same language-specific sections.
- `content/shared.md`: content that should be the same in both languages. Edit publications, teaching, and people here once.

## After editing online on GitHub

You only need to edit and commit the Markdown files. The live website reads these files directly:

- `content/en.md`
- `content/zh.md`
- `content/shared.md`

After GitHub Pages finishes updating, refresh the website. You do not need to run `build.bat` for online edits.

## Previewing locally

This version loads Markdown files at runtime. Many browsers block that when you double-click `index.html`.

For a reliable local preview, run a small local server in this folder:

```bat
python -m http.server 8000
```

Then open `http://localhost:8000`.

`build.bat` is now optional. Use it only if you want to export a fully prebuilt `index.html` that works by double-clicking.

## Common edits

- Add a publication in `content/shared.md` under `## Publications {#publications}`. It will appear as a subsection inside Research.
- Add a student or postdoc in `content/shared.md` under `## People {#people}`.
- Add a course in `content/shared.md` under `## Teaching {#teaching}`.
- Change English prose in `content/en.md`.
- Change Chinese prose in `content/zh.md`.

Keep these labels in the section headings because they connect the navigation and shared content:

- `{#about}`
- `{#research}`
- `{#publications}`
- `{#people}`
- `{#teaching}`
- `{#join}`
- `{#support}`

## Notes

Treat the Markdown files as the source of truth for ordinary content edits.
