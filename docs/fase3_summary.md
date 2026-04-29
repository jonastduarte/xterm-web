# XTerm Web — Fase 3 Implementation Summary: Password Vault

## 🚀 Overview
Fase 3 introduced a robust security layer to XTerm Web: the **Password Vault**. This feature ensures that sensitive session credentials (passwords) are never stored in plain text on the server or in the browser's local storage.

## ✨ New Features

### 1. AES-256-GCM Encryption
- **Algorithm:** Uses Node's native `crypto` module to perform authenticated encryption (GCM mode).
- **Key Derivation:** Encryption keys are derived from a user-defined **Master Password** using **PBKDF2** with 100,000 iterations and a unique salt for each encryption.
- **Backend Integration:** All session CRUD operations (Create/Update) now automatically encrypt the password if a Master Password is provided.

### 2. Master Password Management
- **Setup:** Users can set a Master Password in the "Tools" sidebar tab. 
- **Validation:** The Master Password hash is stored in SQLite using `scrypt` for secure verification. The plain-text password is never persisted.
- **Lock/Unlock:** The vault can be unlocked for the duration of the browser session. It can be manually locked from the UI.

### 3. Just-in-Time Decryption
- **Connection Flow:** When connecting to a session with an encrypted password, the frontend detects if the vault is locked and prompts the user for the Master Password only when needed.
- **Memory Safety:** The decrypted password exists only in volatile memory during the connection process and is never stored.

## 🛠️ Technical Details
- **Crypto Utility:** Created `backend/src/crypto.ts` as a standalone module for all cryptographic operations.
- **Frontend State:** Managed vault lock/unlock status in `MainLayout.tsx` using a custom React modal to ensure a seamless "Premium" experience.

## 📦 Commits
- **Phase 3 Commit:** `Implement Fase 3: Password Vault (AES-256-GCM encryption)`
- **Documentation Commit:** `docs: add Fase 3 implementation summary`
