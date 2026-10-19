# KERYX — AI Church Presentation & Ministry OS

> *“Run the service. Capture the message. Amplify the ministry.”*

**KERYX** is a professional, AI-native church presentation and ministry operating system designed to control presentations, Bibles, lyrics, media, stage confidence monitors, livestreams, sermon transcription, AI scripture detection, sermon notes, translation, service planning, and church knowledge management.

---

## Complete Feature Matrix

### 1. Presentation & Broadcast Foundation (V1)
- **Isolated Presentation & Live Engine**: Dedicated dual-state architecture where staged Preview items never accidentally affect the auditorium Live screen.
- **Broadcast Control Bar**: Instant one-click `Go Live (Enter)`, `Blackout (B)`, `Clear Screen (C)`, `Freeze Frame (F)`, `Logo Screen (L)`, and big red `Emergency Override (Esc)`.
- **Multi-Screen Display Router**: Independent routing for Auditorium Projector / LED wall, Stage Confidence Monitor (with speaker notes & clock), Lobby TV networks, and Livestream feeds. Real popup windows (`window.open`) update with live synchronization.
- **Offline-First Bible Engine**: Instant offline search across 66 books in public domain translations (`WEB`, `KJV`). Search by reference (`Romans 8:28`, `John 3:16`), phrase, or topic with side-by-side translation comparison.
- **Custom Scriptures & Manual Queue**: Manually create custom translations and notes; pre-stage scripture sets ready for immediate one-click live projection without requiring AI.
- **Worship Songs & Lyrics**: Manage praise and worship songs structured by Verse, Chorus, Bridge, and Ending. Interactive lyric advancement allows stepping through verses with keyboard or clicks.
- **Media Asset Library**: Organize motion backgrounds, video loops, audio pads, countdown videos, and church logos with drag-and-drop import.
- **Service Planner & Timeline**: Drag-ready timeline for Sunday services with rehearsal mode and template loaders.
- **Presentation Canvas Editor**: 16:9 widescreen and 4:3 standard aspect ratio canvas with visual element styling and private presenter notes.
- **14-Category Mega Menu & Command Palette (Ctrl+K)**: Complete desktop application menu bar plus global interactive search across scriptures, views, and actions.
- **Granular RBAC**: Role switching between Owner, Pastor, Media Director, Presentation Operator, Worship Leader, and Volunteer.

### 2. Live Speech & Audio Intelligence (V1 + V2)
- **AI Speech-to-Text & VU Meter**: Real-time microphone listening, live VU level meter, continuous streaming transcript, and multi-strategy scripture detector with confidence indicators (🟢 99.8%, 🟢 97.4%, 🟡 88.2%).
- **Sermon Intelligence**: Automated real-time note taker, sermon summarizer, and social media content repurposer (Facebook post, Instagram caption, carousel slides, TikTok script, WhatsApp pastoral message) with one-click export to Markdown, Plain Text, and Print/PDF.
- **AI Presentation Generator**: Automated deck architect creating an 8-slide sermon presentation with anchor scriptures, homiletic points, and stage notes from topic and preacher name.
- **AI Copilot Tool-Calling Assistant**: "Ask KERYX Copilot" executing real software tools (`searchBible`, `sendLive`, `toggleBlackout`, `startCountdown`, `generatePresentation`, `translateSlide`).
- **10-Language Theological Translation Engine**: Instant translation to French, Spanish, Portuguese, Yoruba, Swahili, German, Italian, Tagalog, Mandarin, and Arabic.

### 3. Studio Broadcast, Church Brain & Remote Surface (V2 + V3)
- **Livestream Studio & Lower-Thirds Matrix**: 5-scene broadcast switcher (Pulpit Wide, Close-Up, Band, Scripture Full, Split Screen) and alpha-channel transparent lower-third overlays for Pastor ID, Scriptures, Giving, and Community notices with local MP4 recording.
- **Countdown & Service Timers**: 5-minute pre-service countdowns and sermon elapsed stopwatches synced to stage monitors and top-bar timer chips.
- **Ministry & Service Analytics**: Track service duration, top scriptures cited, worship song frequency, and sub-2-second AI latency telemetry (1.38s average).
- **AI Church Brain & Semantic Knowledge Search (PRD §37 & §38)**: Private knowledge base answering natural questions (*"What did we teach about prayer?"*) with grounded answers and direct citations back to historical sermons and scriptures.
- **AI Worship Song Detection (PRD §33)**: Scans live audio transcript and matches sung or spoken lyrics against the church song library with one-click staging.
- **Mobile & Stage Web Remote Controller (PRD §72 & §16)**: High-contrast touch keypad for pastors on stage or roaming operators on iPhone, Android, or iPad over local Wi-Fi.
- **Church Marketplace & Plugins**: Pre-installed and downloadable broadcast themes, 4K motion graphics, hymnals, and overlay bundles.

---

## Running KERYX

KERYX is built as a zero-dependency, modular ES6+ desktop web application:

1. Open `index.html` directly in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, or embedded desktop webview).
2. No Node/npm packages or external web servers are required to launch the complete offline control room.
3. All church data, custom scriptures, presentations, and settings persist locally in your browser's IndexedDB and LocalStorage engine.

---

## Broadcast Keyboard Shortcuts

| Shortcut | Function |
| :--- | :--- |
| `Space` | Advance to Next Slide / Lyric |
| `Shift + Space` | Step back to Previous Slide / Lyric |
| `Enter` | Send Staged Preview item to **LIVE** |
| `B` | Toggle **Black Screen** (Instant blackout) |
| `C` | Toggle **Clear Screen** (Hide text, preserve background) |
| `F` | Toggle **Freeze Output** (Hold current video frame) |
| `L` | Toggle **Church Logo Screen** |
| `Ctrl + K` | Open **Global Command Palette** |
| `Ctrl + S` | Save Local Church Workspace |
| `Esc` | **Emergency Override** (Halts AI, shows backup slide) |

---

## Architectural Philosophy

1. **AI Assists, but Humans Control**: Every AI feature has an immediate manual fallback.
2. **Presentation Never Depends on AI**: AI errors or audio pipeline stalls can never disrupt live auditorium projection.
3. **Offline Resilience**: Full ministry operations continue smoothly during network outages.

---

## License & Attribution

Scriptures included:
- World English Bible (WEB) — Public Domain
- King James Version (KJV) — Public Domain
- All custom church scriptures, worship songs, and presentation decks are created and managed by church media teams.
