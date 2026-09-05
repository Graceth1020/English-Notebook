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

## Check the Junction Points Into the Repo

`themes/notebook` must resolve to `themes/_upstream/hexo-theme-notebook` inside
this repo, because that is what CI builds from (the workflow creates the symlink
itself). If it points at a checkout elsewhere on disk, local builds silently use
different theme code than the deployed site.

```powershell
(Get-Item themes\notebook -Force).Target    # expect ...\English-Notebook\themes\_upstream\hexo-theme-notebook
```

To repoint it:

```powershell
Remove-Item -LiteralPath themes\notebook -Force     # removes the link only, not the target
New-Item -ItemType Junction -Path themes\notebook `
         -Target themes\_upstream\hexo-theme-notebook
```

## First Time on a Fresh Clone

```bash
git clone --recurse-submodules https://github.com/Graceth1020/English-Notebook.git
cd English-Notebook
bash setup.sh
```

This initializes the submodule, creates the junction/symlink, and installs dependencies.
