# KERYX Architecture Specification

## 1. Executive Summary & Core Philosophy

**KERYX** is a professional, AI-native church presentation and ministry operating system designed to control presentations, Bibles, lyrics, media, stage displays, livestreams, sermon transcription, AI scripture detection, sermon notes, translation, and church knowledge workflows.

The architectural foundation is governed by four immutable principles:
1. **AI Assists, but the Church Remains in Control**: Every AI feature has a direct manual fallback. AI automation never removes operator agency.
2. **Presentation Engine Decoupling**: The presentation, canvas renderer, preview/live dual-state controller, and display outputs are completely isolated from AI, network, and cloud services. An AI error, speech recognition timeout, or internet outage cannot freeze or crash the live output screen.
3. **Offline-First Resilience**: All core church capabilities (slides, Bible search, songs, custom scriptures, media playback, service timelines, and multi-screen outputs) function locally without internet connectivity.
4. **Sub-2-Second Pipeline Latency**: Real-time speech transcription and multi-strategy scripture detection are optimized for rapid operator review and broadcast dispatch.

---

## 2. Target Component Hierarchy

```text
src/
  app/                    Desktop shell, mega menu, router, command palette, shortcuts, preflight
  components/             Modular design system (modals, toasts, audio visualizer, buttons, tabs)
  core/                   Decoupled event bus, audit logger, RBAC permissions, error boundaries
  database/               IndexedDB/LocalStorage adapter, schema migrations, seed engine
  features/
    auth/                 Church onboarding, user session, operator role switcher
    dashboard/            Control-room operational dashboard, health dials, service countdown
    service/              Service planner, timeline, reordering, template loader, rehearsal mode
    presentation/         Presentation workspace, slide canvas, aspect ratio (16:9, 4:3), themes, inspector
    preview-live/         Dual-state broadcast controller, Go Live, Black, Clear, Freeze, Logo, Emergency
    bible/                Bible engine, book/chapter/verse browser, instant search, translation comparison
    custom-scripture/     Manual scripture authoring, local scripture queue, service set export
    songs/                Worship songs library, Verse/Chorus/Bridge structuring, live lyric advancement
    media/                Media manager, motion backgrounds, video loops, audio pads, asset import
    sermons/              Sermon archive, verbatim transcripts, doctrine points, church brain
    ai/                   AI Center, speech engine, multi-strategy scripture detector, note taker, summarizer
    outputs/              Multi-screen router (Main, Stage, Confidence, Lobby, Stream) with popup windows
    settings/             16 PRD configuration categories, branding tokens, full backup & restore
  stores/                 Reactive state stores (appStore, liveStore, presentationStore, bibleStore, aiStore)
```

---

## 3. Reliability & Isolation Boundary

```text
┌────────────────────────────────────────────────────────┐
│              PRESENTATION & OUTPUT ENGINE              │
│  • Canvas Renderer (16:9 / 4:3)                        │
│  • Preview / Live State Machine                        │
│  • Blackout / Clear / Freeze / Logo                    │
│  • One-Click Emergency Override                        │
│  • Multi-Screen Output Routing (Main, Stage, Lobby)    │
└──────────────────────────▲─────────────────────────────┘
                           │
                           │ Explicit operator actions
                           │ or confidence-gated events
                           │
┌──────────────────────────┴─────────────────────────────┐
│                   AI COPILOT LAYER                     │
│  • Speech-to-Text Pipeline (Web Speech / Web Audio)    │
│  • Multi-Strategy Scripture Detector                   │
│  • Confidence Engine (95%+ Auto, 85-94% Review)        │
│  • Real-Time Note Taker & Summarizer                   │
└────────────────────────────────────────────────────────┘
```

The presentation engine does not await promises from the AI engine. Even if the microphone is disconnected, the speech pipeline throws an error, or the network disappears, the live output continues uninterrupted.

---

## 4. Multi-Screen Output Matrix

| Output Role | Primary Display Target | Content Routing |
| :--- | :--- | :--- |
| **Main Auditorium** | Projector / LED Wall | Live Slide, Scripture, Lyrics, Video |
| **Stage Display** | Downstage Confidence Monitor | Speaker Notes, Service Clock, Countdown, Next Slide |
| **Lobby & Overflow** | Foyer TV Network | Welcome Announcements, Service Countdown |
| **Livestream Feed** | OBS Studio / vMix / NDI | Alpha-channel Lower Thirds & Scripture Overlays |

---

## 5. Security & RBAC Enforcement

The system implements Role-Based Access Control across:
- `Owner`: Full authority over organization, branding, users, and finances.
- `Super Admin`: System-wide settings and multi-campus management.
- `Pastor`: Sermon preparation, notes, archive, and teaching approvals.
- `Media Director`: Complete live broadcast, screen routing, and presentation control.
- `Presentation Operator`: Staged preview, live slide advancement, and AI detection queue review.
- `Worship Leader`: Song library, lyrics structuring, and setlists.
- `Volunteer`: Safe slide advancement with restricted permissions.
