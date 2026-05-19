# ✍️ SignaDrop — PDF Visual Signature Placer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/deploy-status)](https://app.netlify.com/sites/signadrop/deploys)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Draw it. Drop it. Sign it.**  
SignaDrop lets you sign PDF documents directly in your browser — draw your signature, drag it onto the exact line, and download the signed file.  
**No server, no upload, 100% private.**

![SignaDrop Screenshot](assets/screenshot.png)

---

## 🔥 Features

- 📱 **Mobile‑first** – Works with touch, stylus, or mouse
- 🎨 **Unique glassmorphism UI** – Light / dark mode with smooth animations
- 🖊️ **Smooth signature pad** – Realistic ink strokes on HTML5 Canvas
- 🖱️ **Drag & drop signature** – Place it precisely where needed
- 📄 **PDF viewing & navigation** – Powered by [pdf.js](https://mozilla.github.io/pdf.js/)
- ✨ **Client‑side PDF generation** – [pdf‑lib](https://pdf-lib.js.org/) embeds the signature without any data leaving your device
- 🌙 **Dark mode toggle** – Persists your preference in localStorage
- 🔍 **SEO optimised** – Meta tags, Open Graph, JSON‑LD structured data
- 📢 **Ad‑ready** – Placeholder slots for Adsterra (top, sidebar, native, footer)
- 🔒 **Privacy by design** – No tracking, no cookies (except theme), no backend

---

## 🚀 Live Demo

**[https://signadrop.com](https://signadrop.com)**  

---

## 📦 Tech Stack

| Layer                | Technology                          |
|----------------------|-------------------------------------|
| PDF Rendering        | Mozilla [pdf.js](https://mozilla.github.io/pdf.js/) (2.16) |
| PDF Manipulation     | [pdf‑lib](https://pdf-lib.js.org/) (1.17) |
| Styling              | Vanilla CSS (custom properties, glassmorphism, animations) |
| Interactivity        | Vanilla JavaScript (ES6+)           |
| PWA / Icons          | Web App Manifest, SVG favicon       |
| Hosting              | Any static host (Netlify, Vercel, GitHub Pages) |

---

## 📁 Project Structure

signadrop/
├── index.html # Main tool
├── about.html # About page
├── privacy.html # Privacy policy
├── terms.html # Terms of service
├── robots.txt # Search engine instructions
├── sitemap.xml # Sitemap for SEO
├── manifest.json # PWA manifest
├── favicon.svg # Vector favicon
├── css/
│ └── style.css # All styles (mobile‑first, dark mode)
├── js/
│ └── main.js # Signature pad, PDF handling, drag & drop
├── icons/
│ ├── icon-192x192.png # PWA small icon
│ └── icon-512x512.png # PWA large icon
└── assets/
└── screenshot.png # App preview (optional)


---

## 🛠️ Getting Started (Local Development)

Because everything runs in the browser, **no build step or server** is required.

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/signadrop.git
   cd signadrop

2. Open index.html directly in your browser, or serve it with any static server:
   npx serve .
# or
python3 -m http.server 8080

3. That’s it — the tool is fully functional at http://localhost:8080

   Note: The PDF.js worker is loaded from CDN. To go fully offline, download the worker and update the workerSrc path in js/main.js.

📢 Adding Adsterra Ads
Replace the placeholder comments and text inside each ad container with your real Adsterra code.

Location	HTML ID / Class	Expected Size
Top banner	.ad-banner (first)	728×90
Sidebar (desktop)	.ad-sidebar	300×600
Native ad	.ad-native	flexible
Footer banner	Last .ad-banner	728×90
All placeholders are clearly labelled Adsterra – ... for easy search/replace.

⚙️ Customisation
Change the brand name & domain
Search/replace SignaDrop and signadrop.com across all files.

Change the colour scheme
Edit the CSS custom properties inside :root and [data-theme="dark"] in css/style.css.

Remove ads
Delete the <div> containers with class ad-banner, ad-sidebar, and ad-native.

🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

Fork the project

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.

💬 Acknowledgements
pdf.js – Mozilla

pdf‑lib – Andrew Dillon

Fonts by Google (Inter, Dancing Script)

<p align="center"> Made with ❤️ for privacy and simplicity </p> ```