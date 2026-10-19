# KERYX Security & Privacy Architecture

## 1. Church Data Privacy & Sanctuary Sovereignty

Church teachings, prayers, confidential leadership notes, and altar moments are sacred and private. KERYX enforces:
1. **Local-First Processing**: Audio capture, transcription, and scripture search are executed locally on the church media PC. Audio is never automatically forwarded to third-party cloud servers unless specifically authorized by church administration.
2. **Encrypted Local Storage**: IndexedDB storage caches are isolated within the application boundary.
3. **No Unaudited AI Actions**: AI cannot silently modify the live broadcast feed unless the operator has explicitly armed **Automatic Autopilot Mode** with strict confidence thresholds.

## 2. Granular Role-Based Access Control (RBAC)

KERYX prevents unauthorized volunteer or operator errors through granular capability tokens:
- `can_control_live`: Ability to send content to the main auditorium screen.
- `can_control_outputs`: Ability to re-route physical display ports and NDI matrixes.
- `can_manage_ai`: Ability to configure autopilot thresholds and audio models.
- `can_export_sermons`: Ability to download full sermon transcripts and notes.

## 3. Operator Audit Logging

Every critical live broadcast decision is recorded with:
- Timestamp (ISO 8601)
- Operator Name & Role
- Action Name (e.g. `GO_LIVE`, `BLACKOUT_ENABLED`, `AI_SCRIPTURE_APPROVED`)
- Target Resource
- Previous State vs New State
Logs are accessible in the local database and Settings > Advanced & Logs.

