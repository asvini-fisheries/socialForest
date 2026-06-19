# Service Port Registry

Each service runs on a **dedicated isolated port**. Ports are defined in `config/ports.mjs`.

## SocialForest Ports

| Service | Port | URL |
|---------|------|-----|
| **Web App** (dev + prod) | `4350` | http://localhost:4350 |

## System Ports (Reserved — Do Not Use)

| Port | Service |
|------|---------|
| 26053 | Cursor exec-daemon |
| 26054 | Cursor PTY websocket |
| 26055 | Cursor server |
| 26058 | Python utility |
| 5901 | VNC |

## Commands

```bash
npm run dev      # Development on port 4350
npm run build
npm run start    # Production on port 4350
```

## Adding a New Service

1. Add a new entry in `config/ports.mjs`
2. Document it in this file
3. Never reuse an existing port number
