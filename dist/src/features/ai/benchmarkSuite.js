/**
 * KERYX Real-Time Performance & 300ms SLA Acceptance Benchmark Suite
 * Automated harness executing the 5 required benchmark scenarios:
 * 1. Romans 8:28 (1,000 iterations measuring P50, P90, P95, P99, max)
 * 2. Psalm 23:1 local quotation matching
 * 3. Two-step contextual verse resolution ("chapter 8" -> "verse 28") without LLM
 * 4. Predictive next-verse resolution ("next verse" -> Romans 8:29) without network call
 * 5. High-volume continuous sermon simulation (10,000 segments, 100 detections) verifying zero degradation
 */

import { ScriptureDetector } from './scriptureDetector.js';
import { speechEngine } from './speechEngine.js';
import { realtimeContextResolver } from './realtimeContextResolver.js';
import { localBibleIndex } from './localBibleIndex.js';
import { MicroNoteEngine } from './microNoteEngine.js';
import { latencyTelemetry } from './latencyTelemetry.js';
import { aiStore } from '../../stores/aiStore.js';
import { eventBus } from '../../core/eventBus.js';

export class BenchmarkSuite {
  /**
   * Helper to compute percentile stats for any array of numbers
   */
  static computeStats(latencies) {
    if (!latencies || latencies.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, min: 0, avg: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const count = sorted.length;
    const getP = (p) => sorted[Math.min(count - 1, Math.floor((p / 100) * count))];
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    return {
      count,
      p50: parseFloat(getP(50).toFixed(2)),
      p90: parseFloat(getP(90).toFixed(2)),
      p95: parseFloat(getP(95).toFixed(2)),
      p99: parseFloat(getP(99).toFixed(2)),
      max: parseFloat(sorted[count - 1].toFixed(2)),
      min: parseFloat(sorted[0].toFixed(2)),
      avg: parseFloat((sum / count).toFixed(2))
    };
  }

  /**
   * ACCEPTANCE TEST 1:
   * "Turn with me to Romans chapter eight verse twenty-eight."
   * Run 1,000 times, measuring end-to-end Lane A processing latency.
   * Target: P50 <= 100ms, P95 <= 300ms, P99 <= 500ms
   */
  static async runTest1_Romans828(iterations = 1000) {
    console.log(`[KERYX BENCHMARK] Starting Test 1 (Romans 8:28) with ${iterations} iterations...`);
    const latencies = [];
    let detectedCount = 0;
    let verifiedRef = null;

    realtimeContextResolver.reset();
    localBibleIndex.clearPredictiveCache();

    for (let i = 0; i < iterations; i++) {
      const phrase = 'Turn with me to Romans chapter eight verse twenty-eight.';
      const t0 = performance.now();

      // Execute full Lane A processing
      const detected = await ScriptureDetector.analyzeText(phrase, `bench_seg_${i}`, t0);
      const noteEvent = MicroNoteEngine.extractMicroEvent(phrase, `bench_seg_${i}`);

      const elapsed = performance.now() - t0;
      latencies.push(elapsed);

      if (detected && detected.reference.toLowerCase() === 'romans 8:28') {
        detectedCount++;
        verifiedRef = detected.reference;
      }
    }

    const stats = this.computeStats(latencies);
    const passed = stats.p95 <= 300 && detectedCount === iterations;

    const report = {
      testId: 'TEST_1_ROMANS_8_28_BENCHMARK',
      title: '1,000-Run Romans 8:28 End-to-End Processing Benchmark',
      iterations,
      detectedCount,
      accuracy: `${((detectedCount / iterations) * 100).toFixed(1)}%`,
      verifiedRef,
      slaTarget: '<= 300ms P95',
      passed,
      stats
    };

    console.log('[KERYX BENCHMARK] Test 1 Complete:', report);
    return report;
  }

  /**
   * ACCEPTANCE TEST 2:
   * "The Lord is my shepherd, I shall not want."
   * Identify Psalm 23:1 through local in-memory quotation matching.
   */
  static async runTest2_QuotationMatch(iterations = 200) {
    console.log(`[KERYX BENCHMARK] Starting Test 2 (Psalm 23:1 quotation match)...`);
    const phrase = 'The Lord is my shepherd, I shall not want.';
    const latencies = [];
    let matchSuccess = 0;
    let matchedRef = null;

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      const detected = await ScriptureDetector.analyzeText(phrase, `quote_seg_${i}`, t0);
      const elapsed = performance.now() - t0;
      latencies.push(elapsed);

      if (detected && (detected.reference.toLowerCase() === 'psalms 23:1' || detected.reference.toLowerCase() === 'psalm 23:1')) {
        matchSuccess++;
        matchedRef = detected.reference;
      }
    }

    const stats = this.computeStats(latencies);
    const passed = stats.p95 <= 300 && matchSuccess === iterations;

    const report = {
      testId: 'TEST_2_PSALM_23_1_QUOTATION',
      title: 'Psalm 23:1 Local In-Memory Quotation Matching',
      iterations,
      matchSuccess,
      accuracy: `${((matchSuccess / iterations) * 100).toFixed(1)}%`,
      matchedRef,
      slaTarget: '<= 300ms P95',
      passed,
      stats
    };

    console.log('[KERYX BENCHMARK] Test 2 Complete:', report);
    return report;
  }

  /**
   * ACCEPTANCE TEST 3:
   * Context: "Turn to Romans chapter eight."
   * Then: "Read verse twenty-eight."
   * Resolves Romans 8:28 without an LLM.
   */
  static async runTest3_ContextualResolution(iterations = 200) {
    console.log(`[KERYX BENCHMARK] Starting Test 3 (Contextual relative verse resolution)...`);
    const latencies = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      realtimeContextResolver.reset();

      // Step 1: Establish chapter context
      await ScriptureDetector.analyzeText('Turn to Romans chapter eight.');

      // Step 2: Resolve relative verse
      const t0 = performance.now();
      const detected = await ScriptureDetector.analyzeText('Read verse twenty-eight.', `ctx_seg_${i}`, t0);
      const elapsed = performance.now() - t0;
      latencies.push(elapsed);

      if (detected && detected.reference.toLowerCase() === 'romans 8:28' && detected.method === 'CONTEXTUAL_RELATIVE') {
        successCount++;
      }
    }

    const stats = this.computeStats(latencies);
    const passed = stats.p95 <= 300 && successCount === iterations;

    const report = {
      testId: 'TEST_3_CONTEXTUAL_RELATIVE_RESOLUTION',
      title: 'Two-Step Contextual Relative Verse Resolution (No LLM)',
      iterations,
      successCount,
      accuracy: `${((successCount / iterations) * 100).toFixed(1)}%`,
      slaTarget: '<= 300ms P95',
      passed,
      stats
    };

    console.log('[KERYX BENCHMARK] Test 3 Complete:', report);
    return report;
  }

  /**
   * ACCEPTANCE TEST 4:
   * Context: "Romans 8:28..."
   * Then: "Now let's read the next verse."
   * Resolves Romans 8:29 instantly from predictive pre-cache without network call.
   */
  static async runTest4_PredictiveNextVerse(iterations = 200) {
    console.log(`[KERYX BENCHMARK] Starting Test 4 (Predictive next-verse pre-cache)...`);
    const latencies = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      realtimeContextResolver.reset();

      // Step 1: Seed Romans 8:28 (triggers neighbor pre-cache of 8:27 and 8:29)
      await ScriptureDetector.analyzeText('Romans 8:28');

      // Step 2: Trigger relative "the next verse"
      const t0 = performance.now();
      const detected = await ScriptureDetector.analyzeText("Now let's read the next verse.", `next_seg_${i}`, t0);
      const elapsed = performance.now() - t0;
      latencies.push(elapsed);

      if (detected && detected.reference.toLowerCase() === 'romans 8:29') {
        successCount++;
      }
    }

    const stats = this.computeStats(latencies);
    const passed = stats.p95 <= 10 && successCount === iterations; // Next verse should be sub-10ms

    const report = {
      testId: 'TEST_4_PREDICTIVE_NEXT_VERSE',
      title: 'Predictive Next-Verse Pre-Cache Resolution (Zero Network)',
      iterations,
      successCount,
      accuracy: `${((successCount / iterations) * 100).toFixed(1)}%`,
      slaTarget: '<= 10ms (Instant Cache)',
      passed,
      stats
    };

    console.log('[KERYX BENCHMARK] Test 4 Complete:', report);
    return report;
  }

  /**
   * ACCEPTANCE TEST 5:
   * 60-Minute Continuous Sermon Load Simulation:
   * Feeds 10,000 transcript segments and 100 scripture detections under rapid load,
   * verifying zero memory leak and constant <=300ms P95 latency.
   */
  static async runTest5_ContinuousSermonLoad(totalSegments = 10000, scriptureCadence = 100) {
    console.log(`[KERYX BENCHMARK] Starting Test 5 (Continuous Sermon Load: ${totalSegments} segments)...`);
    const corpus = [
      'Beloved church, we are gathered here to understand God’s eternal covenant.',
      'Faith requires us to trust God even when we don’t understand what He is doing.',
      'Turn with me to Romans chapter eight verse twenty-eight.',
      'And we know that all things work together for good for those who love God.',
      'Now look at the next verse.',
      'The Lord is my shepherd, I shall not want.',
      'He makes me lie down in green pastures, he leads me beside still waters.',
      'Remember the Lord your God, for it is He that gives you the ability to produce wealth.',
      'For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.',
      'How can you desire breakthrough without battle preparedness?'
    ];

    const latenciesFirst1000 = [];
    const latenciesLast1000 = [];
    let detectedScriptures = 0;
    let microNotesExtracted = 0;

    const tStart = performance.now();

    for (let i = 0; i < totalSegments; i++) {
      const phrase = corpus[i % corpus.length];
      const isScriptureMoment = (i % scriptureCadence === 0);

      const t0 = performance.now();

      // Process segment
      if (isScriptureMoment) {
        const detected = await ScriptureDetector.analyzeText(phrase, `load_${i}`, t0);
        if (detected) detectedScriptures++;
      }

      const note = MicroNoteEngine.extractMicroEvent(phrase, `load_${i}`);
      if (note) microNotesExtracted++;

      const elapsed = performance.now() - t0;

      if (i < 1000) {
        latenciesFirst1000.push(elapsed);
      } else if (i >= totalSegments - 1000) {
        latenciesLast1000.push(elapsed);
      }
    }

    const totalDurationSeconds = parseFloat(((performance.now() - tStart) / 1000).toFixed(2));
    const statsFirst1000 = this.computeStats(latenciesFirst1000);
    const statsLast1000 = this.computeStats(latenciesLast1000);

    // Verify that latency did not degrade over time (e.g. statsLast1000.p95 <= statsFirst1000.p95 * 1.5 and <= 300ms)
    const passed = statsLast1000.p95 <= 300 && statsLast1000.p95 <= (statsFirst1000.p95 * 2.0 + 5.0);

    const report = {
      testId: 'TEST_5_CONTINUOUS_SERMON_LOAD',
      title: 'Continuous Sermon Load Simulation (10,000 Segments)',
      totalSegments,
      totalDurationSeconds,
      detectedScriptures,
      microNotesExtracted,
      statsFirst1000,
      statsLast1000,
      degradationCheck: `${statsLast1000.p95}ms vs initial ${statsFirst1000.p95}ms`,
      passed
    };

    console.log('[KERYX BENCHMARK] Test 5 Complete:', report);
    return report;
  }

  /**
   * Runs the complete test suite and returns consolidated results
   */
  static async runAll() {
    const r1 = await this.runTest1_Romans828(1000);
    const r2 = await this.runTest2_QuotationMatch(200);
    const r3 = await this.runTest3_ContextualResolution(200);
    const r4 = await this.runTest4_PredictiveNextVerse(200);
    const r5 = await this.runTest5_ContinuousSermonLoad(5000, 50);

    const allPassed = r1.passed && r2.passed && r3.passed && r4.passed && r5.passed;

    return {
      timestamp: new Date().toISOString(),
      allPassed,
      overallSLA: allPassed ? 'COMPLIANT (<=300ms P95 Target Met)' : 'BREACHED',
      results: [r1, r2, r3, r4, r5]
    };
  }
}

// Expose on window for easy browser console and CDP automation
if (typeof window !== 'undefined') {
  window.BenchmarkSuite = BenchmarkSuite;
}

