/**
 * KERYX Sermon Archive & Church Brain View (PRD §37 & §38)
 * Searchable knowledge repository of sermon transcripts, notes, scriptures, and teachings.
 * Powered by ChurchBrain semantic Q&A with grounded citations.
 */

import { appStore } from '../../stores/appStore.js';
import { aiStore } from '../../stores/aiStore.js';
import { SermonIntelligence } from '../ai/sermonIntelligence.js';
import { ChurchBrain, HISTORICAL_SERMONS } from './churchBrain.js';

export class SermonsView {
  static selectedSermonIndex = 0;
  static currentSearchResult = null;

  static render() {
    const { church } = appStore.getState();
    const sermons = this.currentSearchResult ? this.currentSearchResult.matchingSermons : HISTORICAL_SERMONS;
    const selectedSermon = sermons[this.selectedSermonIndex] || sermons[0] || HISTORICAL_SERMONS[0];

    return `
      <section class="page sermons-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">CHURCH KNOWLEDGE REPOSITORY · PRD §37</span>
            <h1>Sermon Archive & Church Brain</h1>
            <p class="subheading">Semantic search across pulpit transcripts, pastoral notes, and theological topics. Grounded answers citing past sermons and scriptures.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button" id="sermon-btn-export-all">
              Export Notes (Markdown) <span>↓</span>
            </button>
          </div>
        </div>

        <!-- Church Brain Search & Semantic QA Bar -->
        <div class="church-brain-query-panel panel">
          <div class="brain-search-row">
            <span class="brain-sparkle">🧠</span>
            <input 
              type="text" 
              id="sermon-search-box" 
              placeholder="Ask Church Brain: 'What did we teach about prayer?' or 'Find scriptures on faith'..." 
              value="${this.currentSearchResult?.query || ''}"
            />
            <button class="primary-button small" id="btn-brain-search">Ask Brain <span>→</span></button>
            ${this.currentSearchResult ? '<button class="secondary-button small" id="btn-brain-clear">Clear</button>' : ''}
          </div>

          <!-- Semantic Q&A Answer Card (if query active) -->
          ${
            this.currentSearchResult && this.currentSearchResult.answer
              ? `
            <div class="brain-answer-box">
              <div class="brain-answer-header">
                <span class="brain-badge">AI CHURCH BRAIN SYNTHESIS</span>
                <small>Source Grounded Answer</small>
              </div>
              <p class="brain-answer-text">${this.currentSearchResult.answer}</p>
              ${
                this.currentSearchResult.citations && this.currentSearchResult.citations.length > 0
                  ? `
                <div class="brain-citations-row">
                  <span class="cite-label">CITATIONS:</span>
                  ${this.currentSearchResult.citations
                    .map(
                      (c) => `
                    <span class="brain-cite-pill" title="${c.ref}">
                      📜 <strong>${c.title}</strong> (${c.date}) · <em>${c.ref}</em>
                    </span>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }
        </div>

        <div class="sermon-archive-layout">
          <!-- Left List: Historical Sermons -->
          <div class="sermon-list-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">TEACHING ARCHIVE (${sermons.length})</span>
                <h3>Recorded Messages</h3>
              </div>
            </div>

            <div class="sermons-catalog-list">
              ${sermons
                .map(
                  (s, idx) => `
                <div class="sermon-card-entry ${idx === this.selectedSermonIndex ? 'selected-sermon' : ''}" data-idx="${idx}">
                  <div class="sermon-entry-top">
                    <strong>${s.title}</strong>
                    <span class="sermon-status-tag ${s.series ? 'series' : ''}">${s.series || 'Single'}</span>
                  </div>
                  <small class="sermon-entry-sub">Pastor ${s.pastor} · ${s.date}</small>
                  <p class="sermon-entry-oneliner">${s.oneLiner}</p>
                  <div class="sermon-refs-pills">
                    ${s.scriptures.map((ref) => `<span class="ref-pill">✦ ${ref}</span>`).join('')}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Right Content: Active Selected Sermon Detail -->
          <div class="sermon-detail-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">SERMON DETAILS & MEMORY</span>
                <h2>${selectedSermon.title}</h2>
                <small>Preached by Pastor ${selectedSermon.pastor} · ${selectedSermon.date} · Series: ${selectedSermon.series || 'Independent'}</small>
              </div>
            </div>

            <div class="sermon-detail-content">
              <div class="detail-section">
                <span class="eyebrow">THEOLOGICAL SUMMARY</span>
                <p class="summary-body-text">${selectedSermon.summary}</p>
              </div>

              <div class="detail-section">
                <span class="eyebrow">KEY HOMILETIC POINTS & DOCTRINE</span>
                <div class="detail-notes-grid">
                  ${selectedSermon.notes
                    .map(
                      (n) => `
                    <div class="detail-note-card">
                      <strong>${n.category}</strong>
                      <p>${n.content}</p>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <div class="detail-section">
                <span class="eyebrow">SCRIPTURE FOUNDATIONS</span>
                <div class="detail-scriptures-list">
                  ${selectedSermon.scriptures
                    .map(
                      (ref) => `
                    <div class="detail-scrip-row">
                      <strong>✦ ${ref}</strong>
                      <span>Referenced and projected on sanctuary displays</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <div class="detail-section">
                <span class="eyebrow">PULPIT TRANSCRIPT EXCERPT</span>
                <blockquote class="transcript-quote-box">
                  “${selectedSermon.transcriptExcerpt || 'Transcript recorded and indexed.'}”
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    const searchBox = container.querySelector('#sermon-search-box');
    const searchBtn = container.querySelector('#btn-brain-search');
    const clearBtn = container.querySelector('#btn-brain-clear');

    const handleSearch = () => {
      const q = searchBox?.value?.trim();
      if (!q) {
        this.currentSearchResult = null;
      } else {
        const res = ChurchBrain.query(q);
        this.currentSearchResult = { ...res, query: q };
      }
      this.selectedSermonIndex = 0;
      const root = document.querySelector('#main-content') || container;
      root.innerHTML = this.render();
      this.attachEvents(root);
    };

    searchBtn?.addEventListener('click', handleSearch);
    searchBox?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });

    clearBtn?.addEventListener('click', () => {
      this.currentSearchResult = null;
      this.selectedSermonIndex = 0;
      const root = document.querySelector('#main-content') || container;
      root.innerHTML = this.render();
      this.attachEvents(root);
    });

    // Sermon card selection clicks
    container.querySelectorAll('.sermon-card-entry').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        if (!isNaN(idx)) {
          this.selectedSermonIndex = idx;
          const root = document.querySelector('#main-content') || container;
          root.innerHTML = this.render();
          this.attachEvents(root);
        }
      });
    });

    container.querySelector('#sermon-btn-export-all')?.addEventListener('click', () => {
      const md = SermonIntelligence.exportAsMarkdown();
      SermonIntelligence.downloadFile('sermon-full-archive.md', md, 'text/markdown');
    });
  }
}
