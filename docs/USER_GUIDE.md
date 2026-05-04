# XTerm Web - User Guide & Help Material

Welcome to **XTerm Web**, your premium web-based terminal and file management suite. This guide will walk you through the core features, configurations, and best practices for getting the most out of your experience.

---

## 🚀 Getting Started

### 1. Creating a Session
To connect to a remote server, you first need to create a session:
1. Click the **"New Session"** button in the top ribbon or right-click in the **Sessions** sidebar.
2. Select your protocol: **SSH**, **Telnet**, or **Serial**.
3. Fill in the connection details:
   - **Host/IP**: The address of your remote server.
   - **Port**: Default is 22 for SSH, 23 for Telnet.
   - **Username/Password**: Your credentials.
4. Click **"Connect"** to open the terminal immediately, or **"Save"** to keep it in your session tree.

### 2. Quick Connect
Need a one-time connection? Use the **Quick Connect** bar at the top of the session list. Type `user@host:port` and press Enter.

---

## 🖥️ Terminal Usage

### Multi-Tab & Split Layouts
XTerm Web allows you to manage multiple sessions simultaneously using a flexible layout system:
- **Tabs**: Every new connection opens in a new tab. Switch between them using the tab bar.
- **Split Modes**: Click the **"Split"** button in the ribbon to switch between:
  - **Single**: Standard full-screen view.
  - **2-Terminals (Vertical/Horizontal)**: Stack two terminals side-by-side or top-to-bottom.
  - **4-Terminals (Grid)**: Work with four terminals at once.

> [!TIP]
> **Persistence**: Your terminal state and history are preserved even if you reload the page (F5) or switch between split modes.

### Copy & Paste Security
- **Selection**: Simply selecting text in the terminal automatically copies it to your clipboard.
- **Right-Click Paste**: Right-clicking in the terminal triggers a paste action.
- **Security Check**: For your safety, a confirmation dialog will appear showing the content to be pasted. You can review and edit the text before it's sent to the terminal.

---

## 📂 File Management (SFTP/FTP)

### SFTP Browser
When connected via SSH, you can toggle the **SFTP Sidebar** (on the left) to manage files on the remote server:
- **Upload**: Drag and drop files from your computer into the SFTP list.
- **Download**: Double-click a file or use the right-click menu.
- **Manage**: Create folders, rename, or delete files directly in the browser.

### Dedicated FTP Client
For legacy servers, use the **FTP** button in the ribbon to open a dedicated FTP connection tab.

---

## 🔍 Session Logs & Auditing
All terminal sessions are automatically recorded for security and auditing purposes:
- **Auto-Save**: Logs are saved in real-time as you type.
- **Search**: Use the **Logs** tab in the sidebar to search through past sessions by host name or date.
- **30-Day Retention**: Logs are kept for 30 days before being automatically cleaned up.
- **Preview**: View the first 1000 lines of any log file directly in the browser.

---

## 🔐 Security & Vault
- **Master Password**: You can set a Master Password to encrypt all saved session credentials.
- **Isolated Sessions**: Each user only sees their own sessions and logs. Admins cannot access other users' private connection data.

---

## 🛠️ Advanced Configurations
- **Auto-Login**: Save credentials in the session dialog for one-click access.
- **Custom Fonts**: The terminal uses high-readability monospaced fonts (Cascadia Code / Fira Code).
- **Inactivity Timeout**: Sessions remain active for 30 minutes after a disconnect, allowing you to return to your work.

---

*(XTerm Web - Built for Performance and Security)*
