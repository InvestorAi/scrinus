# KERYX Presentation Engine Specification

## 1. Dual-State Architecture (Preview vs. Live)

Traditional presentation tools frequently suffer from accidental on-air edits. KERYX implements an **isolated dual-state state machine**:

```text
┌────────────────────────────────┐         ┌────────────────────────────────┐
│        PREVIEW STATE           │         │          LIVE STATE            │
│  • Staged slide / scripture    │ ──────> │  • On-air auditorium output    │
│  • Off-air operator inspection │ Go Live │  • Stage confidence monitor    │
│  • Editable without risk       │ (Enter) │  • Livestream overlay          │
└────────────────────────────────┘         └────────────────────────────────┘
```

- **Staged Preview (`currentPreview`)**: The operator or AI can inspect, edit, or cue up slides, scripture verses, and lyrics without altering the auditorium screen.
- **On-Air Live (`currentLive`)**: Only explicit operator triggers (`Go Live`, `Enter`, or configured Automatic AI mode) push an item to the projection outputs.

---

## 2. Broadcast Overrides & Guardrails

| Control | Shortcut | Behavior |
| :--- | :--- | :--- |
| **Go Live** | `Enter` | Transitions staged item in Preview directly to Live output. |
| **Next Slide** | `Space` | Advances to the next slide in sequence and projects it live. |
| **Prev Slide** | `Shift+Space` | Steps back to the previous slide. |
| **Black Screen** | `B` | Cuts projection outputs instantly to solid black. Staged items remain loaded. |
| **Clear Screen** | `C` | Clears text and typography while maintaining background media or motion loops. |
| **Freeze Output** | `F` | Holds current video frame on screen while operator stages next content off-air. |
| **Logo Screen** | `L` | Instantly replaces live screen with official church brand logo slide. |
| **EMERGENCY** | `Esc` | Stops AI automation, activates safe backup slide, and preserves manual controls. |

---

## 3. Slide Canvas & Multi-Aspect Support

- **16:9 Widescreen**: Default for modern LED walls, high-definition projectors, and 1080p/4K displays.
- **4:3 Standard**: Supported for heritage church sanctuaries and legacy projection systems.
- **Layers**:
  1. Background Layer (Solid Color, Gradient, Motion Video Loop, Image).
  2. Content Layer (Title, Scripture Reference, Scripture Text, Body, Eyebrow).
  3. Overlay Layer (Lower Thirds, Countdown Timers, Emergency Banners).
  4. Speaker Notes Layer (Routed exclusively to Stage Confidence Displays).

