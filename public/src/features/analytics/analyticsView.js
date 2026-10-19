/**
 * KERYX Ministry Analytics View
 * Service duration tracking, sermon metrics, top referenced scriptures, and AI detection accuracy.
 */

import { appStore } from '../../stores/appStore.js';

export class AnalyticsView {
  static render() {
    const { church } = appStore.getState();

    const topScriptures = [
      { ref: 'Romans 8:28', count: 24, percent: 92 },
      { ref: 'Psalm 23:1', count: 19, percent: 75 },
      { ref: 'John 3:16', count: 16, percent: 64 },
      { ref: 'Hebrews 11:1', count: 14, percent: 55 },
      { ref: 'Philippians 4:13', count: 11, percent: 42 }
    ];

    const topSongs = [
      { title: 'Way Maker', artist: 'Sinach', plays: 18, percent: 88 },
      { title: 'Goodness of God', artist: 'Bethel Music', plays: 15, percent: 72 },
      { title: 'Great Are You Lord', artist: 'All Sons & Daughters', plays: 12, percent: 58 },
      { title: 'Amazing Grace', artist: 'Chris Tomlin', plays: 9, percent: 45 }
    ];

    return `
      <section class="page analytics-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">MINISTRY INSIGHTS & TELEMETRY</span>
            <h1>Service & Preaching Analytics</h1>
            <p class="subheading">Track service durations, biblical scripture citations, worship rotation, and AI detection accuracy over time.</p>
          </div>
        </div>

        <!-- KPI Metric Cards Grid -->
        <div class="analytics-kpi-grid">
          <div class="kpi-card panel">
            <span class="eyebrow">SERVICES LOGGED</span>
            <strong>48</strong>
            <small class="kpi-delta positive">↑ 100% On-Schedule</small>
          </div>
          <div class="kpi-card panel">
            <span class="eyebrow">AVG SERMON TIME</span>
            <strong>42m 15s</strong>
            <small class="kpi-delta">Target: 45m</small>
          </div>
          <div class="kpi-card panel">
            <span class="eyebrow">SCRIPTURES CITED</span>
            <strong>142</strong>
            <small class="kpi-delta positive">Across 22 Books</small>
          </div>
          <div class="kpi-card panel">
            <span class="eyebrow">AI DETECTION ACCURACY</span>
            <strong>97.2%</strong>
            <small class="kpi-delta positive">Avg Latency: 1.3s</small>
          </div>
        </div>

        <!-- 2-Column Analytics Charts -->
        <div class="analytics-charts-grid">
          <!-- Top Referenced Scriptures Chart -->
          <div class="chart-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">PULPIT ANCHORS</span>
                <h3>Most Referenced Scriptures</h3>
              </div>
              <span class="offline-label"><i></i> Historical Data</span>
            </div>

            <div class="bar-chart-list">
              ${topScriptures
                .map(
                  (s) => `
                <div class="bar-chart-row">
                  <div class="bar-label-wrap">
                    <strong>${s.ref}</strong>
                    <span>${s.count} times</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill coral-bar" style="width: ${s.percent}%;"></div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Top Worship Songs Chart -->
          <div class="chart-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">WORSHIP ROTATION</span>
                <h3>Most Sung Songs</h3>
              </div>
              <span class="offline-label"><i></i> CCLI Compliant</span>
            </div>

            <div class="bar-chart-list">
              ${topSongs
                .map(
                  (song) => `
                <div class="bar-chart-row">
                  <div class="bar-label-wrap">
                    <strong>${song.title}</strong>
                    <span>${song.artist} (${song.plays}x)</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill green-bar" style="width: ${song.percent}%;"></div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <!-- AI Accuracy & Topic Breakdown -->
        <div class="analytics-lower-grid">
          <div class="panel ai-telemetry-detail">
            <div class="panel-header">
              <span class="eyebrow">AI TELEMETRY AUDIT</span>
              <h3>Sub-2-Second Pipeline Performance</h3>
            </div>
            <div class="telemetry-stats-rows">
              <div class="stat-row"><span>Audio Capture to Transcript:</span><strong>340 ms</strong></div>
              <div class="stat-row"><span>Transcript to Scripture Match:</span><strong>420 ms</strong></div>
              <div class="stat-row"><span>Operator Verification to Live Display:</span><strong>620 ms</strong></div>
              <div class="stat-row"><span>Total Pipeline Latency:</span><strong style="color:var(--green);">1.38 seconds (Exceeds &lt;2s goal)</strong></div>
              <div class="stat-row"><span>Operator Acceptance Rate:</span><strong>94.6% of suggestions approved</strong></div>
            </div>
          </div>

          <div class="panel sermon-topics-breakdown">
            <div class="panel-header">
              <span class="eyebrow">DOCTRINAL DISTRIBUTION</span>
              <h3>Sermon Themes</h3>
            </div>
            <div class="topics-tags-cloud">
              <div class="topic-chip large"><span>Faith & Victory</span><b>35%</b></div>
              <div class="topic-chip med"><span>Prayer & Intercession</span><b>25%</b></div>
              <div class="topic-chip med"><span>Grace & Salvation</span><b>20%</b></div>
              <div class="topic-chip small"><span>Spiritual Maturity</span><b>12%</b></div>
              <div class="topic-chip small"><span>Family & Stewardship</span><b>8%</b></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    // Read-only operational analytics dashboard
  }
}

