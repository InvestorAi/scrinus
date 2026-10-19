# KERYX AI Architecture & Speech Pipeline

## 1. Pipeline Overview

KERYX is an AI-native operating system where AI is deeply embedded into the service lifecycle rather than bolted on as a detached chatbot.

```text
Audio Input (Microphone / NDI / Virtual Audio Cable)
                ↓
    Noise Reduction & VAD (Speech vs Silence)
                ↓
    Speech Recognition (Web Speech API / Local Engine)
                ↓
    Streaming Transcript Segment (Timestamp + Speaker + Confidence)
                ↓
    Scripture Detector & Confidence Engine
    ├── Strategy 1: Explicit Reference Parser
    ├── Strategy 2: Natural Speech Parser
    ├── Strategy 3: Quoted Scripture Matcher
    └── Strategy 4: Semantic Context Matcher
                ↓
    Confidence Scoring (95%+ Auto / 85–94% Review / <85% Suggestion)
                ↓
    Operator AI Detection Queue
                ↓
    [Preview] or [LIVE] Approval (Sub-2-Second Target Latency)
```

---

## 2. Multi-Strategy Scripture Detection

| Strategy | Trigger Example | Detection Mechanism | Typical Confidence |
| :--- | :--- | :--- | :--- |
| **Strategy 1: Explicit Reference** | *"John 3:16"*, *"Romans 8:28"* | Regex reference extractor + Bible chapter/verse validation | **99.8%** |
| **Strategy 2: Natural Speech** | *"Turn with me to the eighth chapter of Romans"* | Natural speech pattern extractor + book resolution | **94.5%** |
| **Strategy 3: Quoted Scripture** | *"The Lord is my shepherd, I shall lack nothing"* | Verbatim text substring indexing against offline database | **97.4%** |
| **Strategy 4: Semantic Match** | *"God works everything together for our good"* | Doctrinal keywords & semantic context match | **88.2%** |

---

## 3. Autopilot Operating Modes

1. **Manual Mode**:
   - AI audio capture and transcription can run, but AI can **never** trigger slide changes or send scriptures live.
   - All live broadcast actions require explicit operator button clicks.
2. **Assisted Mode (Default Production Setting)**:
   - AI recommendations appear immediately in the **Scripture Confidence Queue**.
   - The operator reviews and clicks `[Preview]` or `[LIVE]`.
3. **Automatic Mode**:
   - High-confidence detections (**>=95%**) are automatically sent live to the projection outputs.
   - Detections between 85% and 94% remain staged for human review.
4. **Emergency Mode**:
   - One-click override that instantly terminates all AI automation, preserves live output with a safe backup slide, and returns control exclusively to the human operator.

---

## 4. Sermon Intelligence & Content Repurposing

During and after the preaching moment, the AI pipeline generates:
- **Live Notes**: Real-time extraction of thesis statements, scripture anchors, and practical applications.
- **Sermon Summaries**: 30-second elevator synopsis, detailed pastoral overview, and youth discussion guides.
- **Repurposed Social Media**: Facebook teaching recap, Instagram caption with carousel slide copy, TikTok / YouTube Shorts video scripts, and WhatsApp pastoral devotionals.
- **Exports**: Instant generation of `.md`, `.txt`, and printable `.pdf` study materials.

