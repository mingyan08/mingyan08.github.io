# Editing Guide

You can edit most website content with Markdown. You do not need to edit HTML or CSS for ordinary content changes.

## Files to edit

- `content/en.md`: English-only text, including the English hero, about, research, join-us, and acknowledgments copy.
- `content/zh.md`: Chinese-only text for the same language-specific sections.
- `content/shared.md`: content that should be the same in both languages. Edit publications, people, and teaching here once.

## After editing

Run `build.bat` in the parent folder (`新建文件夹`). It rebuilds `index.html` from the Markdown files.

After the build finishes, open `index.html` directly in your browser. The page no longer needs to load Markdown files at runtime, so double-clicking `index.html` works.

## Common edits

- Add a publication in `content/shared.md` under `## Publications {#publications}`.
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

The generated `index.html` is safe to overwrite. Treat the Markdown files as the source of truth.
