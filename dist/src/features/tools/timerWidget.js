/**
 * KERYX Countdown & Service Timer Engine
 * Pre-service countdown, sermon elapsed stopwatch, and stage monitor synchronization.
 */

import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';

class TimerWidget {
  constructor() {
    this.remainingSeconds = 300; // 5 mins default
    this.totalSeconds = 300;
    this.timerType = 'countdown'; // 'countdown' | 'stopwatch'
    this.isRunning = false;
    this.interval = null;
    this.title = 'Pre-Service Countdown';
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const formatted = this.formatTime(this.remainingSeconds);
    this.listeners.forEach((l) => l({
      seconds: this.remainingSeconds,
      formatted,
      isRunning: this.isRunning,
      type: this.timerType,
      title: this.title
    }));

    liveStore.setCountdown({
      remainingSeconds: this.remainingSeconds,
      label: this.title,
      isRunning: this.isRunning,
      formatted
    });
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  start(seconds = 300, title = 'Service Countdown', type = 'countdown') {
    this.stop();
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.title = title;
    this.timerType = type;
    this.isRunning = true;

    this.interval = setInterval(() => {
      if (this.timerType === 'countdown') {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--;
          this.notify();
        } else {
          this.stop();
          eventBus.emit('toast:notify', {
            type: 'warning',
            title: 'Countdown Expired',
            message: `${this.title} has completed.`
          });
        }
      } else {
        // Stopwatch mode
        this.remainingSeconds++;
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    this.notify();
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.interval = setInterval(() => {
        if (this.timerType === 'countdown' && this.remainingSeconds > 0) {
          this.remainingSeconds--;
          this.notify();
        } else if (this.timerType === 'stopwatch') {
          this.remainingSeconds++;
          this.notify();
        }
      }, 1000);
      this.notify();
    }
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.notify();
  }

  stop() {
    this.pause();
    liveStore.clearCountdown();
  }
}

export const timerWidget = new TimerWidget();

