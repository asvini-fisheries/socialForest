# GitHub Desktop — SocialForest

Use this guide if GitHub Desktop shows fetch/pull errors, wrong branch, or nested-repo warnings.

## Correct local path

Add **only** the SocialForest folder — not the parent `payoutstand-dashboard` folder:

```
D:\sak\Asvini\payoutstand-dashboard\socialForest
```

In GitHub Desktop: **File → Add local repository** → browse to `socialForest`.

## Remote URL (canonical)

```
https://github.com/asvini-fisheries/socialForest.git
```

If you see *"repository moved"*, update the remote:

```powershell
cd D:\sak\Asvini\payoutstand-dashboard\socialForest
git remote set-url origin https://github.com/asvini-fisheries/socialForest.git
git fetch origin
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

If `develop` does not exist locally:

```powershell
git checkout -b develop origin/develop
```

## Nested repo warning

If `payoutstand-dashboard` is also a Git repository, GitHub Desktop may open the **parent** repo instead of SocialForest.

**Fix:** Remove the parent from GitHub Desktop, then add `socialForest` directly (path above).

Or in PowerShell, confirm you are inside SocialForest:

```powershell
cd D:\sak\Asvini\payoutstand-dashboard\socialForest
git rev-parse --show-toplevel
```

Expected output ends with `\socialForest`, not `\payoutstand-dashboard`.

## Common errors

### "Couldn't find remote ref develop"

Run `git fetch origin` then `git branch -r`. If `origin/develop` is missing, use `main` or ask the team to push `develop`.

### Pull / push authentication failed

GitHub Desktop → **File → Options → Accounts** → sign in again.

### Wrong folder / npm dev errors

Always run `npm run dev` from inside `socialForest` (folder with `package.json` and `src/app`).

## Quick health check

```powershell
cd D:\sak\Asvini\payoutstand-dashboard\socialForest
git status
git remote -v
git branch -vv
git fetch origin
```

All commands should complete without errors.
