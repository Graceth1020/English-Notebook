#!/bin/bash
# Setup script for hexo-notebook-theme site
# Creates necessary symlinks after cloning

set -e

echo "=== Initializing submodules ==="
git submodule update --init --recursive

echo "=== Creating theme symlink ==="
if [ ! -L themes/notebook ] && [ ! -d themes/notebook ]; then
  case "$(uname -s)" in
    Linux|Darwin)
      ln -s _upstream/hexo-theme-notebook themes/notebook
      ;;
    MINGW*|MSYS*)
      cmd //c "if not exist themes\notebook mklink /J themes\notebook _upstream\hexo-theme-notebook"
      ;;
    *)
      echo "Unknown OS: $(uname -s)"
      echo "Create themes/notebook as a symlink/junction to _upstream/hexo-theme-notebook manually."
      return 1
      ;;
  esac
  echo "Created themes/notebook -> _upstream/hexo-theme-notebook"
else
  echo "themes/notebook already exists, skipping"
fi

echo "=== Installing npm dependencies ==="
npm install

echo ""
echo "Done! Run 'npx hexo server' to preview."
