@echo off
chcp 65001 >nul
title English-Notebook Setup
echo === Initializing submodules ===
git submodule update --init --recursive
if %errorlevel% neq 0 (
    echo Failed to initialize submodules.
    pause
    exit /b 1
)

echo.
echo === Creating theme junction ===
if not exist themes\notebook (
    mklink /J themes\notebook themes\_upstream\hexo-theme-notebook
    if %errorlevel% equ 0 (
        echo Created themes\notebook -^> themes\_upstream\hexo-theme-notebook
    ) else (
        echo.
        echo Failed to create junction. Try running this script as Administrator.
        pause
        exit /b 1
    )
) else (
    echo themes\notebook already exists, skipping
)

echo.
echo === Installing npm dependencies ===
call npm install
if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b 1
)

echo.
echo Done! Run 'npx hexo server' to preview.
pause
