# Updating the Notebook Theme

This project uses a **git submodule** to track the upstream theme at `themes/_upstream/`, with a directory junction/symlink at `themes/notebook/` pointing to `themes/_upstream/hexo-theme-notebook/`.

## Quick Update

```bash
cd themes/_upstream
git pull origin main
cd ../..
npx hexo generate
```

That's it. The junction/symlink picks up the changes automatically — no extra steps needed.

## What This Does

| Step | What happens |
|------|-------------|
| `git pull origin main` | Pulls the latest theme code from GitHub |
| `npx hexo generate` | Rebuilds your site with the updated theme |

## Check What Changed (optional)

To see what was updated before rebuilding:

```bash
cd themes/_upstream
git log --oneline --stat HEAD..origin/main   # preview incoming changes
git pull origin main                          # apply them
git log --oneline -5                          # see recent commits
```

## Resolve Conflicts (if any)

If the theme upstream has conflicts with your local changes:

```bash
cd themes/_upstream
git pull origin main
# Fix any merge conflicts, then:
git commit
cd ../..
git add themes/_upstream
git commit -m "update theme"
```

## First Time on a Fresh Clone

```bash
git clone --recurse-submodules https://github.com/Graceth1020/English-Notebook.git
cd English-Notebook
bash setup.sh
```

This initializes the submodule, creates the junction/symlink, and installs dependencies.
