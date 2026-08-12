---
"better-auth": patch
---

Improve error handling: use proper logger in MCP plugin, propagate errors in One Tap button callback, redirect on OAuth proxy state failures instead of silently continuing, and preserve APIError messages in account linking.
