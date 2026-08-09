# English-notebook

Personal English learning notes powered by [hexo-notebook-theme](https://github.com/Graceth1020/hexo-notebook-theme).

## Rephrase practice site

Content in `days/`, `summaries/`, `corpus/`, and `notes/` is imported into the
Hexo source tree by `tools/import-rephrase.js` at build time (and locally via
`npm run preview`). New courses and days are produced by the
`english-rephrase-practice` skill; word/phrase notes by the `language-notes`
skill. Push to `main` and GitHub Actions rebuilds and deploys the site.

- Day pages link directly to their matching summary pages (and back).
- Corpus pages filter by difficulty (E/M/H) and search.
- The notes page renders all note entries as searchable cards.

- [Update theme](UPDATE_THEME.md)
