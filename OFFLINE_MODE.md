# KERYX Offline-First Operating Architecture

## 1. Zero Cloud Dependency for Live Presentation

A fundamental church production reality: **internet connectivity in sanctuaries and auditoriums can fail unpredictably.**

In KERYX, **no live presentation feature depends on an active internet connection.**

The following operate 100% locally:
- **Presentation Workspace**: Slide editing, layer canvas, text rendering, and themes.
- **Preview & Live Broadcast Controls**: Staged previewing, live switching, black screen, clear screen, freeze, logo, and emergency override.
- **Bible Search Engine**: Instant lookup across 66 books in public domain translations (WEB, KJV) stored in the local IndexedDB database.
- **Custom Scriptures**: Manual authoring of custom translations, notes, tags, and local scripture queue sets.
- **Worship Songs**: Complete song library, Verse/Chorus/Bridge section navigation, and live lyric advancement.
- **Media Playback**: Image slides, local motion background video loops, audio pads, and graphic overlays.
- **Service Planner**: Order of service timeline, countdown timers, and rehearsal mode.
- **Multi-Screen Outputs**: Hardware HDMI/DisplayPort projectors, downstage confidence stage monitor, and NDI feeds.

---

## 2. Local Storage Architecture

```text
Workstation Local Storage
├── IndexedDB (`keryx_church_os_db`)
│     ├── Bibles (WEB, KJV)
│     ├── Custom Scriptures & Local Queue
│     ├── Songs & Structured Lyrics
│     ├── Presentation Decks & Canvas Elements
│     ├── Media Assets Metadata
│     ├── Service Timelines
│     ├── Audit Logs
│     └── Church Workspace Profile & Campuses
└── LocalStorage (`keryx.store.*`)
      └── High-speed synchronous cache fallback for instant restoration
```

---

## 3. Data Synchronization

When network connectivity is detected:
1. Church statistics and attendance logs can sync to church administrative databases.
2. Cloud backups can be pushed to remote archives.
3. If internet drops mid-service, KERYX silently transitions to offline mode without interrupting active projection or triggering error dialogs.

