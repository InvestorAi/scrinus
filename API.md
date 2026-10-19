# KERYX API & Automation Specification

KERYX exposes an event-driven automation interface for external hardware, companion mobile apps, stream switchers (Stream Deck, Companion, OBS), and church management systems.

## 1. Local Control API Endpoints

### Presentation & Broadcast Control
- `POST /api/v1/live/transition`: Transitions staged preview item to Live screen.
- `POST /api/v1/live/black`: Toggles blackout mode.
- `POST /api/v1/live/clear`: Toggles clear screen mode.
- `POST /api/v1/live/freeze`: Toggles video freeze.
- `POST /api/v1/live/emergency`: Activates emergency override.
- `GET /api/v1/live/status`: Returns current preview and live on-air payloads.

### Bible & Scripture
- `GET /api/v1/bible/search?q={query}`: Searches offline Bible repository.
- `POST /api/v1/bible/preview`: Staged scripture reference into Preview.
- `POST /api/v1/bible/live`: Sends scripture reference directly to Live output.

### AI & Speech Intelligence
- `POST /api/v1/ai/listening/toggle`: Starts or pauses audio capture.
- `GET /api/v1/ai/detections`: Retrieves current detection queue with confidence scores.
- `POST /api/v1/ai/detections/{id}/approve`: Sends detected scripture to Live screen.
- `GET /api/v1/ai/transcript`: Retrieves real-time pulpit speech transcript.

## 2. Webhook Events
KERYX emits real-time events over WebSocket and local event bus:
- `service.started`, `service.ended`
- `scripture.detected`, `scripture.live`
- `sermon.started`, `sermon.ended`
- `transcript.updated`
- `presentation.live`
- `emergency.triggered`

