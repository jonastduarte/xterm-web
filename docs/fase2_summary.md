# XTerm Web — Fase 2 Implementation Summary

## 🚀 Overview
Fase 2 focused on expanding the organizational capabilities and protocol support of XTerm Web, bringing it closer to a full MobaXterm alternative. Key improvements include a hierarchical folder system, local serial port support, and improved session automation.

## ✨ New Features

### 1. Hierarchical (Nested) Folders
- **Backend:** Updated SQLite schema to include `parent_id` in the `folders` table.
- **Recursion:** Implemented a recursive rendering logic in `SessionTree.tsx` to support infinite nesting levels.
- **Drag & Drop:** Updated the tree to support moving folders into other folders (moving the entire branch).
- **UI:** Added "Create subfolder" option to the folder context menu.

### 2. Protocol Support: Telnet & Serial
- **Telnet:** Full integration for unencrypted terminal sessions.
- **Serial (Web Serial API):**
    - Integrated the modern browser-native Web Serial API.
    - Allows direct connection to local COM/USB ports without backend involvement.
    - Supports baud rate selection.
    - Custom handling in `TerminalComponent` to pipe data between XTerm.js and the Serial device.

### 3. Session Auto-save
- **Quick Connect:** Any successful connection initiated through the Quick Connect bar is now automatically saved as a persistent session in the database.
- **Deduplication:** Logic implemented to prevent redundant saves if the session was already opened from the tree.

### 4. UI/UX Refinement
- **Custom Modals:** Replaced native `window.prompt` with custom React-based modals for folder creation and Quick Connect password prompts. This avoids browser-blocking issues and improves the "Premium" feel.
- **Dynamic Validation:** Updated `SessionDialog` to dynamically adjust required fields based on the protocol (e.g., Serial doesn't require a host/user).

## 🛠️ Technical Debt & Fixes
- Fixed a bug where the "Connect & Save" button was improperly disabled for Serial protocols.
- Standardized the use of `lucide-react` icons across all protocols.
- Optimized Docker build process by fixing missing TypeScript imports.

## 📦 Commits
- **Message:** `Implement Fase 2: Nested Folders, Serial (Web Serial API), Telnet, and Auto-save sessions`
- **Hash:** `2a19fa0`
