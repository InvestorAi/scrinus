# KERYX Plugin & Extension Architecture

KERYX is designed with provider-agnostic abstraction layers so future developers, audio engineers, and church tech teams can extend its core engines without modifying the application shell.

## 1. Core Provider Interfaces

```typescript
export interface BibleProvider {
  search(query: string): Promise<BibleVerse[]>;
  getChapter(book: string, chapter: number): Promise<BibleVerse[]>;
  getTranslations(): Promise<BibleTranslation[]>;
}

export interface SpeechRecognitionProvider {
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  onSegment(callback: (segment: TranscriptSegment) => void): void;
}

export interface ScriptureDetectionProvider {
  detect(transcript: string): Promise<ScriptureDetectionResult[]>;
}

export interface TranslationProvider {
  translate(text: string, targetLanguage: string): Promise<string>;
}

export interface OutputProvider {
  broadcastFrame(screenId: string, frame: RenderedSlide): Promise<void>;
}
```

## 2. Supported Plugin Domains

- **AI Model Providers**: Integrate local ONNX / Whisper models, Google Gemini, Anthropic Claude, or local Ollama instances.
- **Hardware Display Drivers**: Blackmagic Design DeckLink SDI cards, NDI 5 video transport, and multi-GPU adapters.
- **Bible Formats**: USFM, Zefania XML, OSIS, and OpenSong Bible dataset importers.
- **Church Management Systems (ChMS)**: Planning Center Online, Elvanto, Breeze, and Church Community Builder (CCB).

