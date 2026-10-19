# KERYX Database & Storage Specification

KERYX employs an **offline-first relational database architecture** implemented via IndexedDB with automatic transactional fallback to structured LocalStorage.

## 1. Schema Entities

```text
Organization
  └── Church
        ├── Campus
        ├── Users & RBAC (Users, Roles, Permissions, AuditLog)
        ├── Services (Service, ServiceItem, ServiceTemplate)
        ├── Presentations (Presentation, Slide, SlideElement, Theme)
        ├── Songs (Song, SongSection, SongSetlist)
        ├── Bible (BibleTranslation, BibleBook, BibleVerse, CustomScripture, ScriptureQueue)
        ├── Media (MediaAsset, MediaFolder, Playlist)
        ├── Outputs (OutputScreen, OutputRoute, LowerThird)
        ├── Sermons (Sermon, Transcript, TranscriptSegment, AINote, AISummary)
        └── AI Intelligence (ScriptureDetection, AIEvent)
```

## 2. Table Indexing & Keys

| Table Name | Primary Key | Key Indexes & Lookup Targets |
| :--- | :--- | :--- |
| `bible_verses` | `id` | `book`, `chapter`, `verse`, `reference`, `translation` |
| `custom_scriptures` | `id` | `reference`, `tags`, `translation` |
| `songs` | `id` | `title`, `artist`, `tags`, `key` |
| `presentations` | `id` | `title`, `speaker`, `updatedAt` |
| `service_items` | `id` | `time`, `type`, `status` |
| `scripture_detections` | `id` | `confidence`, `timestamp`, `status` |
| `output_screens` | `id` | `name`, `status`, `isPrimary` |
| `audit_logs` | `id` | `timestamp`, `userName`, `action` |

## 3. Seeded Assets (Offline Out-Of-The-Box)

1. **Public Domain Translations**:
   - World English Bible (`WEB`)
   - King James Version (`KJV`)
   - Pre-indexed anchor verses across Genesis, Psalms, Proverbs, Isaiah, Matthew, John, Romans, 2 Corinthians, Hebrews, and Philippians.
2. **Core Worship Repertoire**:
   - "Way Maker" (Sinach)
   - "Goodness of God" (Bethel Music)
   - "Great Are You Lord" (All Sons & Daughters)
   - "Amazing Grace (My Chains Are Gone)" (Chris Tomlin)
3. **Sunday Service Timeline**:
   - Pre-service countdown, opening prayer, praise set, intercession, announcements, sermon, altar call, and closing.
4. **Physical Output Routing**:
   - Auditorium Main Screen, Stage Confidence Monitor, Lobby Display, and Livestream feed.

## 4. Backup & Disaster Recovery

The storage adapter provides one-click disaster recovery:
- `db.exportBackup()`: Exports the entire church catalog into a portable `.json` backup file.
- `db.importBackup()`: Restores church data on any new workstation or offline laptop.

