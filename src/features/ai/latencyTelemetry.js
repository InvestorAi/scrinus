/**
 * KERYX Real-Time Latency Telemetry & SLA Engine
 * High-precision performance tracking using performance.now()
 * Percentiles (P50, P90, P95, P99), jitter, bottleneck attribution,
 * and SLA breach detection for the <=300ms P95 processing contract.
 */

import { eventBus } from '../../core/eventBus.js';

export class LatencyTelemetry {
  constructor(bufferSize = 1000) {
    this.bufferSize = bufferSize;
    this.history = [];
    this.droppedEventsCount = 0;
    this.queueDepth = 0;

    // SLA Contract Target
    this.slaTargetMs = 300;
    this.warningThresholdMs = 200;

    // Rolling statistics cache
    this.stats = {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      max: 0,
      min: 0,
      avg: 0,
      current: 0,
      count: 0,
      slaBreached: false,
      bottleneck: 'None',
      breakdown: {
        asrArrival: 0,
        parser: 0,
        context: 0,
        lookup: 0,
        confidence: 0,
        event: 0,
        ui: 0
      }
    };
  }

  /**
   * Start a timing session for an incoming streaming token/event.
   * @param {string} sourceEventId
   * @param {number} [asrTimestamp] When ASR emitted the token (if available)
   * @returns {Object} Active tracker instance
   */
  startMeasurement(sourceEventId, asrTimestamp = null) {
    const startMs = performance.now();
    const asrDeliveryMs = asrTimestamp ? Math.max(0, startMs - asrTimestamp) : 0;

    const tracker = {
      id: sourceEventId || 'evt_' + Math.random().toString(36).slice(2, 9),
      startMs,
      asrDeliveryMs,
      splits: {},
      lastSplitMs: startMs,

      /**
       * Mark completion of a sub-pipeline phase
       * @param {string} phase e.g. 'parser', 'context', 'lookup', 'confidence', 'event', 'ui'
       */
      split(phase) {
        const now = performance.now();
        const duration = Math.max(0.01, now - this.lastSplitMs);
        this.splits[phase] = parseFloat(duration.toFixed(2));
        this.lastSplitMs = now;
        return duration;
      },

      /**
       * Conclude measurement and record to telemetry buffer
       * @param {Object} [metadata] e.g. reference, action, method
       * @returns {Object} Metric record with SLA calculation
       */
      finish: (metadata = {}) => {
        const endMs = performance.now();
        const totalProcessingMs = parseFloat((endMs - startMs).toFixed(2));

        const record = {
          id: tracker.id,
          timestamp: Date.now(),
          asrDeliveryMs: parseFloat(asrDeliveryMs.toFixed(2)),
          parserLatencyMs: tracker.splits.parser || 0,
          contextLatencyMs: tracker.splits.context || 0,
          lookupLatencyMs: tracker.splits.lookup || 0,
          confidenceLatencyMs: tracker.splits.confidence || 0,
          eventLatencyMs: tracker.splits.event || 0,
          uiLatencyMs: tracker.splits.ui || 0,
          totalProcessingMs,
          totalEndToEndMs: parseFloat((asrDeliveryMs + totalProcessingMs).toFixed(2)),
          metadata
        };

        this.recordMetric(record);
        return record;
      }
    };

    return tracker;
  }

  /**
   * Records a completed metric into the rolling buffer and updates stats.
   * @param {Object} record
   */
  recordMetric(record) {
    this.history.push(record);
    if (this.history.length > this.bufferSize) {
      this.history.shift();
    }

    this.recalculateStats();
    eventBus.emit('telemetry:updated', this.stats);
  }

  recordDroppedEvent() {
    this.droppedEventsCount++;
    eventBus.emit('telemetry:dropped', this.droppedEventsCount);
  }

  setQueueDepth(depth) {
    this.queueDepth = depth;
  }

  recalculateStats() {
    if (this.history.length === 0) return;

    const latencies = this.history.map((r) => r.totalProcessingMs).sort((a, b) => a - b);
    const count = latencies.length;

    const getPercentile = (p) => {
      const idx = Math.min(count - 1, Math.floor((p / 100) * count));
      return latencies[idx];
    };

    const sum = latencies.reduce((acc, v) => acc + v, 0);
    const avg = parseFloat((sum / count).toFixed(2));
    const p50 = parseFloat(getPercentile(50).toFixed(2));
    const p90 = parseFloat(getPercentile(90).toFixed(2));
    const p95 = parseFloat(getPercentile(95).toFixed(2));
    const p99 = parseFloat(getPercentile(99).toFixed(2));
    const max = parseFloat(latencies[count - 1].toFixed(2));
    const min = parseFloat(latencies[0].toFixed(2));
    const current = latencies[latencies.length - 1];

    // Calculate component breakdown averages over the window
    const breakdown = {
      asrArrival: 0,
      parser: 0,
      context: 0,
      lookup: 0,
      confidence: 0,
      event: 0,
      ui: 0
    };

    for (const r of this.history) {
      breakdown.asrArrival += r.asrDeliveryMs;
      breakdown.parser += r.parserLatencyMs;
      breakdown.context += r.contextLatencyMs;
      breakdown.lookup += r.lookupLatencyMs;
      breakdown.confidence += r.confidenceLatencyMs;
      breakdown.event += r.eventLatencyMs;
      breakdown.ui += r.uiLatencyMs;
    }

    Object.keys(breakdown).forEach((k) => {
      breakdown[k] = parseFloat((breakdown[k] / count).toFixed(2));
    });

    // Check for SLA Breach
    const slaBreached = p95 > this.slaTargetMs;

    // Identify primary bottleneck component
    let bottleneck = 'None';
    let maxCompVal = 0;
    for (const [k, v] of Object.entries(breakdown)) {
      if (v > maxCompVal) {
        maxCompVal = v;
        bottleneck = k;
      }
    }

    if (breakdown.asrArrival > 150) {
      bottleneck = 'ASR Speech Delivery (Audio Jitter)';
    } else if (bottleneck === 'parser') {
      bottleneck = 'Token Parser';
    } else if (bottleneck === 'lookup') {
      bottleneck = 'Bible Index Lookup';
    } else if (bottleneck === 'ui') {
      bottleneck = 'DOM / UI Rendering';
    } else if (bottleneck === 'context') {
      bottleneck = 'Context Resolution';
    }

    this.stats = {
      p50,
      p90,
      p95,
      p99,
      max,
      min,
      avg,
      current,
      count,
      slaBreached,
      bottleneck,
      queueDepth: this.queueDepth,
      droppedEvents: this.droppedEventsCount,
      breakdown
    };

    if (slaBreached) {
      eventBus.emit('telemetry:sla_breached', {
        p95,
        target: this.slaTargetMs,
        bottleneck
      });
    }
  }

  getStats() {
    return this.stats;
  }

  getHistory() {
    return this.history;
  }

  reset() {
    this.history = [];
    this.droppedEventsCount = 0;
    this.queueDepth = 0;
    this.recalculateStats();
  }
}

export const latencyTelemetry = new LatencyTelemetry();

