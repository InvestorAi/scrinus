/**
 * KERYX Live & Preview Broadcast Store
 * Strict state isolation: Preview never accidentally alters Live output.
 * Expanded with Lower Thirds and Live Service Countdown Timers.
 */

import { eventBus } from '../core/eventBus.js';
import { AuditLogger } from '../core/auditLogger.js';

class LiveStore {
  constructor() {
    this.currentPreview = {
      type: 'scripture',
      title: 'Romans 8:28 (WEB)',
      reference: 'Romans 8:28',
      text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.',
      speakerNotes: 'Anchor verse for congregation in testing times.',
      subtitle: 'World English Bible'
    };

    this.currentLive = {
      type: 'title',
      title: 'Walking By Faith In Difficult Seasons',
      subtitle: 'Pastor Godswill Johnson · Sunday Main Service',
      text: 'Walking By Faith In Difficult Seasons',
      speakerNotes: 'Welcome the church and online congregation.',
      theme: 'dark-broadcast'
    };

    this.queuedItems = [];

    this.isBlackout = false;
    this.isClear = false;
    this.isFrozen = false;
    this.isLogo = false;
    this.isEmergency = false;

    // V2: Lower Third Overlay & Countdown Timer State
    this.activeLowerThird = null; // { type: 'speaker'|'scripture'|'event', title: string, subtitle: string }
    this.activeCountdown = null; // { remainingSeconds: number, label: string, isRunning: boolean }

    this.emergencySlide = {
      type: 'emergency',
      title: 'Service Will Resume Shortly',
      text: 'Please remain seated and join us in prayer.',
      subtitle: 'KERYX Emergency Override Active'
    };

    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
    eventBus.emit('live:changed', state);
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (!this.displayChannel) this.displayChannel = new BroadcastChannel('keryx_display_bus');
        this.displayChannel.postMessage({ type: 'LIVE_STATE', payload: state });
      } catch (e) {}
    }
  }

  getState() {
    return {
      currentPreview: this.currentPreview,
      currentLive: this.currentLive,
      queuedItems: this.queuedItems,
      isBlackout: this.isBlackout,
      isClear: this.isClear,
      isFrozen: this.isFrozen,
      isLogo: this.isLogo,
      isEmergency: this.isEmergency,
      activeLowerThird: this.activeLowerThird,
      activeCountdown: this.activeCountdown
    };
  }

  setPreview(item, source = 'Operator') {
    this.currentPreview = item;
    AuditLogger.log({
      action: 'PREVIEW_SET',
      resource: item.title || item.reference || 'Slide',
      details: `Preview updated via ${source}`
    });
    this.notify();
  }

  goLive(item = null, source = 'Operator') {
    if (this.isEmergency) {
      console.warn('[KERYX Live] Cannot transition live while Emergency mode is active.');
      return;
    }

    const nextLive = item || this.currentPreview;
    if (!nextLive) return;

    this.currentLive = nextLive;
    this.isBlackout = false;
    this.isClear = false;

    AuditLogger.log({
      action: 'GO_LIVE',
      resource: nextLive.title || nextLive.reference || 'Live Slide',
      details: `Sent live via ${source}`
    });

    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'Output Updated',
      message: `Sent to Live: ${nextLive.title || nextLive.reference || 'Item'}`
    });

    this.notify();
  }

  toggleBlackout() {
    this.isBlackout = !this.isBlackout;
    AuditLogger.log({
      action: this.isBlackout ? 'BLACKOUT_ENABLED' : 'BLACKOUT_DISABLED',
      resource: 'Live Output'
    });
    this.notify();
  }

  toggleClear() {
    this.isClear = !this.isClear;
    AuditLogger.log({
      action: this.isClear ? 'CLEAR_ENABLED' : 'CLEAR_DISABLED',
      resource: 'Live Output'
    });
    this.notify();
  }

  toggleFreeze() {
    this.isFrozen = !this.isFrozen;
    AuditLogger.log({
      action: this.isFrozen ? 'FREEZE_ENABLED' : 'FREEZE_DISABLED',
      resource: 'Live Output'
    });
    this.notify();
  }

  toggleLogo() {
    this.isLogo = !this.isLogo;
    AuditLogger.log({
      action: this.isLogo ? 'LOGO_SCREEN_ENABLED' : 'LOGO_SCREEN_DISABLED',
      resource: 'Live Output'
    });
    this.notify();
  }

  triggerEmergency() {
    this.isEmergency = true;
    this.isBlackout = false;
    this.isClear = false;
    this.isFrozen = false;
    this.currentLive = this.emergencySlide;

    AuditLogger.log({
      action: 'EMERGENCY_TRIGGERED',
      resource: 'Live Output',
      details: 'All AI automation stopped. Manual backup slide engaged.'
    });

    eventBus.emit('toast:notify', {
      type: 'danger',
      title: 'EMERGENCY OVERRIDE ENGAGED',
      message: 'AI automation stopped. Backup slide is live. Manual controls restored.'
    });

    this.notify();
  }

  clearEmergency() {
    this.isEmergency = false;
    AuditLogger.log({
      action: 'EMERGENCY_CLEARED',
      resource: 'Live Output',
      details: 'Emergency mode cleared by operator.'
    });
    this.notify();
  }

  // V2: Lower Third Overlay Controls
  setLowerThird(overlay) {
    this.activeLowerThird = overlay;
    AuditLogger.log({
      action: overlay ? 'LOWER_THIRD_ENABLED' : 'LOWER_THIRD_DISABLED',
      resource: overlay ? overlay.title : 'Overlay Clear'
    });
    this.notify();
  }

  clearLowerThird() {
    this.activeLowerThird = null;
    this.notify();
  }

  // V2: Countdown Timer Controls
  setCountdown(countdownData) {
    this.activeCountdown = countdownData;
    this.notify();
  }

  clearCountdown() {
    this.activeCountdown = null;
    this.notify();
  }
}

export const liveStore = new LiveStore();
