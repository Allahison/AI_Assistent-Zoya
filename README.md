# 🚀 Zoya AI Assistant: The Ultimate Windows Companion
## 🌟 Overview

**Zoya AI Assistant** is a professional-grade Windows automation and development companion. Built with a robust **Node.js System Bridge** and a modern **React/Vite frontend**, Zoya transcends simple voice commands to provide true autonomous control over your OS, applications, and development workflow.

Whether you're bootstrapping a Next.js project, automating WhatsApp messages, or controlling your system volume, Zoya handles the heavy lifting so you can focus on what matters.

## ✨ Key Features

### 💻 Development Automation
- **Autonomous Project Scaffolding**: Create full React or Next.js projects from scratch with one command. Zoya handles folder creation, dependency installation, and boilerplate setup.
- **VS Code Mastery**: Open files, run terminal commands, install extensions, and format documents—all via AI.
- **Integrated Control**: Seamlessly bridge the gap between your AI assistant and your IDE.

### 🛠️ System Control
- **Application Management**: Smart open/close logic for WhatsApp, Spotify, Chrome, Slack, Discord, and more.
- **OS Operations**: Control volume, brightness, and system power states (Sleep, Restart, Shutdown).
- **File Explorer Navigation**: Navigate your directories and manage files with ease.
- **Recycle Bin**: Automatic cleanup commands.

### 📱 Communication & Media
- **Smart WhatsApp Messaging**: Send messages autonomously by finding contacts and typing messages using advanced automation scripts.
- **YouTube Auto-Play**: Search and play the first result on YouTube instantly.
- **URL Management**: Open any web link directly in your default browser.

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion (Lucide Icons)
- **Backend**: Node.js, Express.js (System Bridge Server)
- **AI Engine**: Google Gemini API (@google/genai) — Powered by Zoya Intelligence
- **Automation**: PowerShell Scripting, COM Objects, WScript.Shell
- **Styling**: Modern Glassmorphic UI with Sleek Animations

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Visual Studio Code](https://code.visualstudio.com/) (Recommended)
- A **Gemini API Key** from [Google AI Studio (Zoya's Core Engine)](https://aistudio.google.com/)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zoya-ai-assistant.git
   cd zoya-ai-assistant
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Launch the Bridge Server**:
   ```bash
   npm run server
   ```

5. **Start the Assistant**:
   In a new terminal:
   ```bash
   npm run dev
   ```
   *Tip: Use `npm run dev:all` if configured to run both simultaneously.*

---

## 📖 Usage Examples

- **Voice Command**: *"Zoya, create a new Next.js project called 'MyPortfolio' on my desktop."*
- **Voice Command**: *"Zoya, play 'lofi hip hop' on YouTube."*
- **Voice Command**: *"Zoya, send a WhatsApp message to John saying 'I'll be there in 5 mins'."*
- **Voice Command**: *"Zoya, decrease my brightness to 30%."*

---

## 🛡️ Security Note

This application uses system-level automation (PowerShell, `exec`). Ensure you run it in a trusted environment and never expose your `.env` file or AI keys publicly.

---

<div align="center">
  <p>Built with ❤️ by the Zoya AI Team</p>
  <p><em>Production Ready Version 3.1</em></p>
</div>
