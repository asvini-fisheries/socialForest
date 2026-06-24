# GitHub Desktop — SocialForest

Use this guide if GitHub Desktop shows fetch/pull errors or wrong branch.

> **Canonical local path:** `D:\sak\ApplicationDevelopment\socialForest`  
> Defined in [`config/paths.mjs`](../config/paths.mjs) — update that file if the folder moves again.

## Correct local path

Add this folder in GitHub Desktop:

```
D:\sak\ApplicationDevelopment\socialForest
```

**File → Add local repository** → browse to `socialForest` under `ApplicationDevelopment`.

## Remote URL (canonical)

```
https://github.com/asvini-fisheries/socialForest.git
```

If you see *"repository moved"*, update the remote:

```powershell
cd D:\sak\ApplicationDevelopment\socialForest
git remote set-url origin https://github.com/asvini-fisheries/socialForest.git
git fetch origin
```

Or run:

```powershell
cd D:\sak\ApplicationDevelopment\socialForest
scripts\fix-github-desktop.bat
```

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production / stable |
| `develop` | Active development (default for day-to-day work) |

First-time setup after clone:

```powershell
git fetch origin
git checkout develop
```

## Verify correct folder

```powershell
cd D:\sak\ApplicationDevelopment\socialForest
git rev-parse --show-toplevel
```

Expected output ends with `\socialForest`.

## Common errors

### "Couldn't find remote ref develop"

```powershell
git fetch origin
git checkout -b develop origin/develop
```

### Pull / push authentication failed

GitHub Desktop → **File → Options → Accounts** → sign in again.

### Wrong folder / npm dev errors

Always run `npm run dev` from `D:\sak\ApplicationDevelopment\socialForest` (folder with `package.json` and `src/app`).

## Quick health check

```powershell
cd D:\sak\ApplicationDevelopment\socialForest
git status
git remote -v
git branch -vv
git fetch origin
```

All commands should complete without errors.
