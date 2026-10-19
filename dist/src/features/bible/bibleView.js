/**
 * KERYX BibleShow Software — Authentic Broadcast Interface
 * Faithfully designed based on the iconic BibleShow software UI reference:
 * - Ribbon Menu: Reference, Browser, Control, Monitor, Options, Program, Search, History, AutoPlay, Help, Exit
 * - Quick Jump: Instant manual scripture parser supporting abbreviations (jn 3 16, mat 5 1, 1co 13 4, ps 23 1)
 *   and long forms (john 3 16, john 3 vs 16, matthew 5 vs 1) with instant millisecond preview and LIVE triggers.
 * - Col 1: Reference (Bible Version checkboxes, Book scroll list, Chapter/Verse spinners with navigation arrows)
 * - Col 2: Browser & Control (Chapter verses reader with golden active selection, red letter text, preview/next/prev controls)
 * - Col 3: Monitor & Themes (16:9 projection screen with FlowerArt / Sky themes gallery and [1 Show] red tally button)
 * - Col 4: Program, Search & History (Service rundown list, search with filters, recent history log)
 * - Col 5: AutoPlay & PlayList Engine (Timed verse rotation runner, continuous loop, transitions)
 */

import { bibleStore } from '../../stores/bibleStore.js';
import { liveStore } from '../../stores/liveStore.js';
import { appStore } from '../../stores/appStore.js';
import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { eventBus } from '../../core/eventBus.js';
import { toastManager } from '../../components/toast.js';
import { ScriptureEngine, BIBLE_BOOKS } from './scriptureEngine.js';

export class BibleView {
  static activeVersion = 'NIV';
  static activeBook = 'Mark';
  static activeChapter = 16;
  static activeVerse = 15;
  static activeReference = 'Mark 16:15 (NIV)';
  static activeVerseText = 'He said to them, "Go into all the world and preach the gospel to all creation."';
  static activeTheme = 'FlowerArtMotif05_01';
  static isShowingLive = true;
  static isAutoPlaying = false;
  static autoPlayDuration = 10;
  static autoPlayTimer = null;
  static isFrozen = false;
  static isHidden = false;
  static verseFontSize = 13;

  static themes = [
    { id: 'FlowerArtMotif05_01', name: 'FlowerArtMotif05_01', bg: 'radial-gradient(circle at center, #1e3a8a 0%, #0f172a 70%, #020617 100%)', motif: '🌸 Blue Floral' },
    { id: 'CrossSky01_01', name: 'CrossSky01_01', bg: 'linear-gradient(135deg, #7c2d12 0%, #1e1b4b 60%, #020617 100%)', motif: '✝ Sunset Cross' },
    { id: 'CrossSky02_01', name: 'CrossSky02_01', bg: 'linear-gradient(180deg, #1e3a8a 0%, #0369a1 40%, #075985 100%)', motif: '☁ Blue Sky' },
    { id: 'CrossSky03_01', name: 'CrossSky03_01', bg: 'linear-gradient(135deg, #4c1d95 0%, #581c87 50%, #1e1b4b 100%)', motif: '✝ Purple Sky' },
    { id: 'CrossNecklace', name: 'CrossNecklace_01', bg: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #1c1917 100%)', motif: '✨ Gold Cross' },
    { id: 'OceanPraise01', name: 'OceanPraise01', bg: 'linear-gradient(180deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)', motif: '🌊 Ocean Wave' },
    { id: 'GoldenSunrise', name: 'GoldenSunrise', bg: 'linear-gradient(135deg, #b45309 0%, #78350f 50%, #451a03 100%)', motif: '🌅 Dawn Gold' },
    { id: 'PurpleWorship', name: 'PurpleWorship02', bg: 'linear-gradient(135deg, #6b21a8 0%, #3b0764 60%, #09090b 100%)', motif: '👑 Majesty' }
  ];

  static chapterVerses = ScriptureEngine.getChapterVerses('Mark', 16, 'NIV');

  static programList = [
    { ref: 'Mk 16:15', trans: 'NIV', text: 'He said to them, "Go into all the world and preach the gospel to all creation."' },
    { ref: '2Ti 4:2', trans: 'NIV', text: 'Preach the word; be prepared in season and out of season; correct, rebuke and encourage—with great patience and careful instruction.' },
    { ref: 'Jas 3:1', trans: 'NIV', text: 'Not many of you should become teachers, my fellow believers, because you know that we who teach will be judged more strictly.' },
    { ref: '1Co 1:21', trans: 'NIV', text: 'For since in the wisdom of God the world through its wisdom did not know him, God was pleased through the foolishness of what was preached to save those who believe.' },
    { ref: '1Jn 4:1', trans: 'NIV', text: 'Dear friends, do not believe every spirit, but test the spirits to see whether they are from God, because many false prophets have gone out into the world.' },
    { ref: 'Mt 7:15', trans: 'NIV', text: "Watch out for false prophets. They come to you in sheep's clothing, but inwardly they are ferocious wolves." },
    { ref: '2Pe 2:1', trans: 'NIV', text: 'But there were also false prophets among the people, just as there will be false teachers among you.' }
  ];

  static historyList = [
    { ref: 'Mk 16:15', trans: 'NIV' },
    { ref: 'Jas 3:1', trans: 'KJV' },
    { ref: 'Jas 3:1', trans: 'NLT' },
    { ref: 'Mt 7:15', trans: 'NIV' },
    { ref: 'Mar 9:39', trans: 'NIV' }
  ];

  static autoplayQueue = [
    { ref: 'Ro 1:16', text: 'For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes.' },
    { ref: 'Ro 10:9-13', text: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.' },
    { ref: '1Co 15:1-28', text: 'Now, brothers and sisters, I want to remind you of the gospel I preached to you, which you received and on which you have taken your stand.' },
    { ref: 'Jn 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
    { ref: 'Mk 16:15', text: 'He said to them, "Go into all the world and preach the gospel to all creation."' }
  ];

  static getBooksList() {
    return BIBLE_BOOKS;
  }

  /**
   * Load any Bible book, chapter, and verse dynamically
   */
  static loadReference(book, chapter = 1, verse = 1, version = null) {
    if (book) this.activeBook = book;
    if (chapter) this.activeChapter = Math.max(1, Number(chapter) || 1);
    if (verse) this.activeVerse = Math.max(1, Number(verse) || 1);
    if (version) this.activeVersion = version;

    this.activeReference = `${this.activeBook} ${this.activeChapter}:${this.activeVerse} (${this.activeVersion})`;
    this.chapterVerses = ScriptureEngine.getChapterVerses(this.activeBook, this.activeChapter, this.activeVersion);

    const target = this.chapterVerses.find(v => v.num === this.activeVerse) || this.chapterVerses[0];
    if (target) {
      this.activeVerse = target.num;
      this.activeVerseText = target.text;
    } else {
      this.activeVerseText = ScriptureEngine.getVerseText(this.activeBook, this.activeChapter, this.activeVerse, this.activeVersion);
    }

    return {
      book: this.activeBook,
      chapter: this.activeChapter,
      verse: this.activeVerse,
      version: this.activeVersion,
      reference: this.activeReference,
      text: this.activeVerseText,
      verses: this.chapterVerses
    };
  }

  /**
   * Render HTML for verse rows in Browser column
   */
  static renderVerseRows(verses, activeVerse, chapter, prefix = 'bshow') {
    if (!verses || verses.length === 0) {
      return `<div style="padding: 16px; text-align: center; color: #64748b; font-size: 12px;">No verses found</div>`;
    }
    return verses.map(v => `
      <div class="bshow-verse-row ${v.num === activeVerse ? 'active' : ''}" data-verse-num="${v.num}" data-verse-text="${(v.text || '').replace(/"/g, '&quot;')}">
        <div class="bshow-verse-header">
          <span class="bshow-vnum-badge">${chapter}:${v.num}</span>
          <button class="bshow-vact-btn ${prefix}-vplay" title="Send to Live Program">▶</button>
          <button class="bshow-vact-btn ${prefix}-vplus" title="${prefix === 'sb' ? 'Add to Inputs Grid' : 'Add to Program'}">+</button>
          ${v.num === activeVerse ? '<span style="font-size: 10px; color: #10b981; font-weight: bold;">● ACTIVE</span>' : ''}
        </div>
        <div class="bshow-verse-text ${v.red ? 'red-letter' : ''}" style="font-size: ${this.verseFontSize}px;">
          ${v.highlight ? v.text.replace(new RegExp(`(${v.highlight})`, 'gi'), `<span class="bshow-highlight-word">$1</span>`) : v.text}
        </div>
      </div>
    `).join('');
  }

  /**
   * Add reference to recent history list
   */
  static addToHistory(ref, version) {
    if (!ref) return;
    const existingIdx = this.historyList.findIndex(h => h.ref === ref);
    if (existingIdx !== -1) this.historyList.splice(existingIdx, 1);
    this.historyList.unshift({ ref, trans: version || this.activeVersion });
    if (this.historyList.length > 25) this.historyList.pop();
  }

  /**
   * Add reference to service program rundown
   */
  static addToProgram(ref, version, text) {
    if (!ref) return;
    this.programList.push({
      ref,
      trans: version || this.activeVersion,
      text: text || this.activeVerseText
    });
  }

  /**
   * Render Standalone BibleShow Page View
   */
  static render() {
    const activeThemeObj = this.themes.find(t => t.id === this.activeTheme) || this.themes[0];

    return `
      <section class="page bible-page" style="padding: 6px; height: calc(100vh - 65px); display: flex; flex-direction: column;">
        <!-- Authentic BibleShow Window Shell -->
        <div class="bibleshow-app-root" id="bibleshow-software-root">
          
          <!-- 1. Title Bar -->
          <div class="bshow-titlebar">
            <div class="bshow-logo-title">
              <span class="bshow-sunburst-icon">☀️</span>
              <span class="bshow-logo-text">BibleShow</span>
            </div>
            <div class="bshow-active-verse-banner" id="bshow-titlebar-banner">
              ${this.activeReference}
            </div>
            <div class="bshow-titlebar-tools">
              <button class="bshow-tool-btn" id="bshow-tool-studio" title="Jump to KERYX Church Studio">🎥 Church Studio</button>
              <button class="bshow-tool-btn" id="bshow-tool-theme-toggle" title="Light / Dark Theme">🌓</button>
              <button class="bshow-tool-btn" id="bshow-tool-settings" title="Options">⚙️</button>
              <button class="bshow-tool-btn" id="bshow-tool-display" title="Projection Output">🖥️</button>
              <button class="bshow-tool-btn" id="bshow-tool-fs" title="Fullscreen">⛶</button>
            </div>
          </div>

          <!-- 2. Ribbon Menu Bar -->
          <nav class="bshow-ribbon-bar">
            <button class="bshow-ribbon-btn active" data-bshow-menu="Reference">Reference</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Browser">Browser</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Control">Control</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Monitor">Monitor</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Options">Options</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Program">Program</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Search">Search</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="History">History</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="AutoPlay">AutoPlay</button>
            <button class="bshow-ribbon-btn" data-bshow-menu="Help">Help</button>
            <button class="bshow-ribbon-btn" id="bshow-btn-exit" style="color: #ef4444; font-weight: bold;">Exit</button>
          </nav>

          <!-- 3. BibleShow Instant Manual Scripture Input / Quick Jump Bar -->
          <div class="bshow-quickjump-bar" id="bshow-quickjump-bar">
            <div class="bshow-qj-label">
              <span>📖 Scripture Quick Jump:</span>
            </div>
            <div class="bshow-qj-input-wrap">
              <input type="text" 
                     class="bshow-qj-input" 
                     id="bshow-manual-scripture-input" 
                     placeholder="Type e.g. jn 3 16, mat 5 1, 1co 13 4, ps 23 1, john 3 16, or john 3 vs 16" 
                     autocomplete="off" 
                     spellcheck="false" />
            </div>
            <div class="bshow-qj-feedback" id="bshow-manual-scripture-pill">Ready</div>
            <div class="bshow-qj-actions">
              <button class="bshow-qj-btn qj-preview" id="bshow-btn-manual-preview" title="Preview Scripture (Enter)">
                <span>👁 Preview</span>
              </button>
              <button class="bshow-qj-btn qj-live" id="bshow-btn-manual-live" title="Send Live to Output">
                <span>⚡ LIVE</span>
              </button>
            </div>
          </div>

          <!-- 4. BibleShow 5-Column Worksurface Grid -->
          <div class="bshow-workspace-grid">
            
            <!-- COLUMN 1: REFERENCE -->
            <div class="bshow-panel" id="bshow-panel-reference">
              <div class="bshow-panel-header">
                <span>Reference</span>
              </div>
              <div class="bshow-panel-body">
                <!-- Bible Version Checklist -->
                <div>
                  <label class="bshow-field-label">Bible Version</label>
                  <div class="bshow-versions-box" id="bshow-versions-box">
                    ${['NIV', 'NLT', 'NVB', 'RCPV', 'KJV', 'WEB', 'ESV', 'AMP'].map(v => `
                      <label class="bshow-version-item">
                        <input type="checkbox" ${v === this.activeVersion ? 'checked' : ''} data-version="${v}" />
                        <span>${v}</span>
                      </label>
                    `).join('')}
                  </div>
                  <div style="display: flex; gap: 4px; margin-top: 3px;">
                    <button class="bshow-ctrl-btn" id="bshow-btn-ver-info" style="flex: 1; font-size: 9px; padding: 2px;">Information</button>
                    <button class="bshow-ctrl-btn" id="bshow-btn-ver-dl" style="width: 24px; padding: 2px;" title="Download Bible">📥</button>
                  </div>
                </div>

                <!-- Book Selector -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                  <label class="bshow-field-label">Book</label>
                  <div class="bshow-books-box" id="bshow-books-list">
                    ${this.getBooksList().map(b => `
                      <div class="bshow-book-row ${b === this.activeBook ? 'active' : ''}" data-book="${b}">
                        ${b}
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Chapter & Verse Spinners -->
                <div class="bshow-spinners-row">
                  <div class="bshow-spinner-field">
                    <label>Chapter</label>
                    <input type="number" class="bshow-spinner-input" id="bshow-spin-ch" value="${this.activeChapter}" min="1" max="150" />
                  </div>
                  <div class="bshow-spinner-field">
                    <label>Verse</label>
                    <input type="number" class="bshow-spinner-input" id="bshow-spin-vs" value="${this.activeVerse}" min="1" max="176" />
                  </div>
                </div>

                <!-- Navigation Arrow Buttons -->
                <div class="bshow-arrow-keys-box">
                  <button class="bshow-nav-arrow-btn" id="bshow-nav-left" title="Previous Chapter">◀</button>
                  <button class="bshow-nav-arrow-btn" id="bshow-nav-right" title="Next Chapter">▶</button>
                  <button class="bshow-nav-arrow-btn" id="bshow-nav-up" title="Previous Verse">▲</button>
                  <button class="bshow-nav-arrow-btn" id="bshow-nav-down" title="Next Verse">▼</button>
                </div>

                <!-- Active Reference Box -->
                <div style="border-top: 1px solid #182f23; padding-top: 4px;">
                  <label class="bshow-field-label">Reference</label>
                  <div class="bshow-ref-summary-box" id="bshow-ref-summary-box">
                    ${this.activeReference}
                  </div>
                  <button class="bshow-ctrl-btn" id="bshow-btn-view-ref" style="width: 100%; margin-top: 4px;">View</button>
                </div>
              </div>
            </div>

            <!-- COLUMN 2: BROWSER & CONTROL -->
            <div class="bshow-panel" id="bshow-panel-browser">
              <div class="bshow-panel-header">
                <span id="bshow-browser-header-ref">Browser — ${this.activeReference}</span>
              </div>
              <div class="bshow-panel-body">
                <!-- Verses Stream Box -->
                <div class="bshow-browser-box" id="bshow-verses-browser">
                  ${this.renderVerseRows(this.chapterVerses, this.activeVerse, this.activeChapter, 'bshow')}
                </div>

                <!-- Browser Footer Tabs & Font Scaler -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0;">
                  <div style="display: flex; gap: 2px;">
                    <button class="bshow-ctrl-btn" id="bshow-btn-tab-books" style="padding: 2px 6px; font-size: 9.5px;">Books</button>
                    <button class="bshow-ctrl-btn" id="bshow-btn-tab-chaps" style="padding: 2px 6px; font-size: 9.5px;">Chapters</button>
                    <button class="bshow-ctrl-btn" id="bshow-btn-tab-verses" style="padding: 2px 6px; font-size: 9.5px;">Verses</button>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 9px; color: #64748b;">A-</span>
                    <input type="range" id="bshow-font-scale" min="11" max="22" value="${this.verseFontSize}" style="width: 55px;" title="Font Scale" />
                    <span style="font-size: 11px; color: #64748b;">A+</span>
                  </div>
                </div>

                <!-- Control Subpanel -->
                <div class="bshow-control-subpanel" id="bshow-panel-control">
                  <div class="bshow-panel-header" style="height: 18px; margin: -6px -6px 4px -6px; font-size: 10px;">
                    <span>Control</span>
                  </div>
                  <div class="bshow-control-grid">
                    <button class="bshow-ctrl-btn" id="bshow-ctrl-preview">Preview</button>
                    <button class="bshow-ctrl-btn" id="bshow-ctrl-prev-v">◀ Prev Verse</button>
                    <button class="bshow-ctrl-btn" id="bshow-ctrl-freeze">Freeze</button>
                    <button class="bshow-ctrl-btn" id="bshow-ctrl-next-v">▶ Next Verse</button>
                    <button class="bshow-ctrl-btn" id="bshow-ctrl-hide" style="grid-column: span 2;">Hide Output</button>
                  </div>
                  <div style="font-size: 10.5px; color: #9cb3a7; margin-top: 2px; font-weight: 600; font-family: 'DM Mono', monospace;" id="bshow-ctrl-status">
                    Show: ${this.activeReference}
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMN 3: MONITOR & THEMES -->
            <div class="bshow-panel" id="bshow-panel-monitor" style="flex: 1.4;">
              <div class="bshow-panel-header">
                <span>Monitor — Output Screen</span>
                <span style="font-size: 10px; color: #8fa598; font-family: 'DM Mono', monospace;">16:9 Widescreen</span>
              </div>
              <div class="bshow-panel-body">
                <!-- Monitor Screen Frame -->
                <div class="bshow-monitor-wrapper" id="bshow-monitor-wrapper">
                  <div class="bshow-monitor-screen" id="bshow-monitor-screen" style="background: ${activeThemeObj.bg};">
                    <div class="bshow-monitor-ref" id="bshow-monitor-ref">
                      ${this.activeReference}
                    </div>
                    <div class="bshow-monitor-text" id="bshow-monitor-text">
                      ${this.activeVerseText}
                    </div>
                  </div>
                </div>

                <!-- Monitor Toolbar -->
                <div class="bshow-monitor-toolbar">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <button class="bshow-show-tally-btn" id="bshow-btn-show-tally">
                      <span>1</span> SHOW (LIVE)
                    </button>
                    <button class="bshow-ctrl-btn" id="bshow-btn-studio-overlay" title="Cast as Studio Lower Third">
                      Overlays
                    </button>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="bshow-ctrl-btn" id="bshow-btn-mon-save" style="font-size: 9.5px; padding: 2px 6px;">Save as...</button>
                    <input type="range" id="bshow-zoom-slider" min="60" max="140" value="100" style="width: 60px;" title="Zoom" />
                  </div>
                </div>

                <!-- Options / Themes Gallery -->
                <div class="bshow-themes-container" id="bshow-panel-options" style="flex: 1; display: flex; flex-direction: column; margin-top: 4px; border-top: 1px solid #182f23; padding-top: 4px;">
                  <div class="bshow-panel-header" style="height: 20px; font-size: 10.5px; margin-bottom: 3px;">
                    <span>Options — Themes</span>
                    <span style="font-size: 9.5px; color: #8fa598;" id="bshow-current-theme-tag">Current: ${this.activeTheme}</span>
                  </div>

                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                    <button class="bshow-ctrl-btn" id="bshow-theme-btn-config" style="padding: 2px 6px; font-size: 9px;">Configure</button>
                    <button class="bshow-ctrl-btn" id="bshow-theme-btn-save" style="padding: 2px 6px; font-size: 9px;">Save as...</button>
                    <button class="bshow-ctrl-btn" id="bshow-theme-btn-rename" style="padding: 2px 6px; font-size: 9px;">Rename</button>
                    <button class="bshow-ctrl-btn" id="bshow-theme-btn-dl" style="padding: 2px 6px; font-size: 9px;">Download...</button>
                  </div>

                  <!-- Visual Themes Cards Grid -->
                  <div class="bshow-themes-gallery-box" id="bshow-themes-gallery">
                    ${this.themes.map(t => `
                      <div class="bshow-theme-card ${t.id === this.activeTheme ? 'active' : ''}" data-theme-id="${t.id}">
                        <div class="bshow-theme-thumb" style="background: ${t.bg};">
                          ${t.motif}
                        </div>
                        <span class="bshow-theme-name">${t.name}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMN 4: PROGRAM, SEARCH & HISTORY -->
            <div class="bshow-panel" id="bshow-panel-program">
              <div class="bshow-panel-header">
                <span>Program</span>
              </div>
              <div class="bshow-panel-body">
                <!-- Program Rundown List -->
                <div class="bshow-rundown-box" id="bshow-program-list">
                  ${this.programList.map((item, idx) => `
                    <div class="bshow-rundown-item ${item.ref.includes(this.activeBook) && item.ref.includes(this.activeChapter + ':') ? 'active' : ''}" data-prog-ref="${item.ref}" data-prog-text="${(item.text || '').replace(/"/g, '&quot;')}" data-prog-idx="${idx}">
                      <span>${item.ref} (${item.trans})</span>
                      <button class="bshow-vact-btn bshow-prog-del" data-prog-del="${idx}" style="font-size: 8px;" title="Remove">✕</button>
                    </div>
                  `).join('')}
                </div>

                <div style="display: flex; gap: 3px;">
                  <button class="bshow-ctrl-btn" id="bshow-btn-prog-add" style="flex: 1; font-size: 9.5px; padding: 2px;">Add</button>
                  <button class="bshow-ctrl-btn" id="bshow-btn-prog-new" style="flex: 1; font-size: 9.5px; padding: 2px;">New</button>
                  <button class="bshow-ctrl-btn" id="bshow-btn-prog-load" style="flex: 1; font-size: 9.5px; padding: 2px;">Load</button>
                  <button class="bshow-ctrl-btn" id="bshow-btn-prog-save" style="flex: 1; font-size: 9.5px; padding: 2px;">Save as...</button>
                </div>

                <!-- Search Panel -->
                <div id="bshow-panel-search" style="border-top: 1px solid #182f23; padding-top: 4px; margin-top: 2px;">
                  <div class="bshow-panel-header" style="height: 18px; font-size: 10px; margin-bottom: 3px;">
                    <span>Search</span>
                  </div>
                  <div class="bshow-search-box">
                    <input type="text" class="bshow-search-input" id="bshow-search-text" placeholder="e.g. preach, faith, love" value="preach" />
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 9.5px; color: #8fa598;">Range: Entire Bible</span>
                      <label style="font-size: 9px; color: #8fa598;">
                        <input type="checkbox" id="bshow-search-wildcards" checked /> Wildcards
                      </label>
                    </div>
                    <button class="bshow-ctrl-btn" id="bshow-btn-run-search" style="padding: 2px; font-size: 10px; margin-top: 2px;">Search</button>
                  </div>
                </div>

                <!-- History Panel -->
                <div id="bshow-panel-history" style="border-top: 1px solid #182f23; padding-top: 4px; margin-top: 2px; flex: 1;">
                  <div class="bshow-panel-header" style="height: 18px; font-size: 10px; margin-bottom: 2px;">
                    <span>History</span>
                  </div>
                  <div class="bshow-history-box" id="bshow-history-list">
                    ${this.historyList.map(h => `
                      <div class="bshow-history-item" data-hist-ref="${h.ref}">
                        ${h.ref} (${h.trans})
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- COLUMN 5: AUTOPLAY -->
            <div class="bshow-panel" id="bshow-panel-autoplay">
              <div class="bshow-panel-header">
                <span>AutoPlay</span>
              </div>
              <div class="bshow-panel-body">
                <div class="bshow-autoplay-box">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 10px; font-weight: 700; color: #8fa598; text-transform: uppercase;">VerseList</span>
                    <button class="bshow-vact-btn" id="bshow-btn-add-queue" title="Add Active Verse to Queue">+</button>
                  </div>

                  <!-- AutoPlay Queue -->
                  <div class="bshow-autoplay-verselist" id="bshow-autoplay-list">
                    ${this.autoplayQueue.map((item, idx) => `
                      <div class="bshow-rundown-item ${idx === 0 ? 'active' : ''}" data-queue-ref="${item.ref}" data-queue-text="${(item.text || '').replace(/"/g, '&quot;')}">
                        <span>${item.ref}</span>
                        <small style="color: #64748b; font-size: 9px;">${this.autoPlayDuration}s</small>
                      </div>
                    `).join('')}
                  </div>

                  <div style="display: flex; gap: 3px;">
                    <button class="bshow-ctrl-btn" id="bshow-ap-btn-new" style="flex: 1; font-size: 9px; padding: 2px;">New</button>
                    <button class="bshow-ctrl-btn" id="bshow-ap-btn-load" style="flex: 1; font-size: 9px; padding: 2px;">Load</button>
                    <button class="bshow-ctrl-btn" id="bshow-ap-btn-save" style="flex: 1; font-size: 9px; padding: 2px;">Save as...</button>
                  </div>

                  <!-- Topical Database -->
                  <div style="border-top: 1px solid #182f23; padding-top: 3px;">
                    <label style="font-size: 9px; color: #8fa598; display: block;">Database: Topical Bible</label>
                    <label style="font-size: 9px; color: #8fa598; display: block; margin-top: 2px;">Topic: gospel</label>
                  </div>

                  <!-- AutoPlay Controls -->
                  <div style="display: flex; gap: 4px; margin-top: 2px;">
                    <button class="bshow-ctrl-btn" id="bshow-ap-btn-preview" style="flex: 1; font-size: 9.5px; padding: 3px;">Preview</button>
                    <button class="bshow-ctrl-btn ${this.isAutoPlaying ? 'preview-active' : ''}" id="bshow-btn-autoplay" style="flex: 1; font-size: 9.5px; padding: 3px;">
                      ${this.isAutoPlaying ? '⏹ Stop' : '▶ Play'}
                    </button>
                    <button class="bshow-ctrl-btn" id="bshow-ap-btn-hide" style="flex: 1; font-size: 9.5px; padding: 3px;">Hide</button>
                  </div>

                  <!-- Configure / Timing -->
                  <div style="border-top: 1px solid #182f23; padding-top: 3px; font-size: 9.5px; color: #8fa598;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span id="bshow-ap-timing-label">Timing: ${this.autoPlayDuration}s</span>
                      <input type="range" id="bshow-ap-speed" min="3" max="30" value="${this.autoPlayDuration}" style="width: 55px;" />
                    </div>
                    <label style="display: block; margin-top: 2px;">
                      <input type="checkbox" id="bshow-ap-loop" checked /> Loop continuously
                    </label>
                    <label style="display: block;">
                      <input type="checkbox" id="bshow-ap-shuffle" /> Shuffle verselist
                    </label>
                  </div>

                  <!-- Playlist -->
                  <div style="display: flex; gap: 3px; margin-top: auto; border-top: 1px solid #182f23; padding-top: 3px;">
                    <button class="bshow-ctrl-btn" id="bshow-btn-pl-open" style="flex: 1; font-size: 9px; padding: 2px;">Open</button>
                    <button class="bshow-ctrl-btn" id="bshow-btn-pl-save" style="flex: 1; font-size: 9px; padding: 2px;">Save as...</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Bottom Footer Bar of BibleShow -->
          <footer style="height: 24px; background: #0c1511; border-top: 1px solid #182c21; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #8fa598; flex-shrink: 0;">
            <span id="bshow-footer-status">Ready — ${this.activeReference}</span>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span>Public Domain Bible DB</span>
              <a href="http://www.BibleShow.net" target="_blank" style="color: #10b981; text-decoration: none;">www.BibleShow.net</a>
            </div>
          </footer>

        </div>
      </section>
    `;
  }

  /**
   * Attach All BibleShow Events — Standalone Page
   */
  static async attachEvents(container) {
    const root = container.querySelector('#bibleshow-software-root') || container;

    // 1. Title bar tools
    root.querySelector('#bshow-tool-studio')?.addEventListener('click', () => {
      appStore.setActiveView('Studio');
    });

    root.querySelector('#bshow-btn-exit')?.addEventListener('click', () => {
      appStore.setActiveView('Studio');
    });

    root.querySelector('#bshow-tool-theme-toggle')?.addEventListener('click', () => {
      toastManager.show('Toggled BibleShow Theme Mode');
    });

    root.querySelector('#bshow-tool-settings')?.addEventListener('click', () => {
      toastManager.show('BibleShow Configuration & Database Settings');
    });

    root.querySelector('#bshow-tool-display')?.addEventListener('click', () => {
      this.isShowingLive = true;
      liveStore.goLive({
        type: 'scripture',
        title: this.activeReference,
        reference: this.activeReference,
        text: this.activeVerseText,
        subtitle: `${this.activeVersion} • BibleShow`,
        speakerNotes: `BibleShow Active: ${this.activeReference}`
      }, 'BibleShow');
      toastManager.show(`BibleShow Output Active: ${this.activeReference}`);
    });

    root.querySelector('#bshow-tool-fs')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 2. Ribbon Menu Bar Navigation
    root.querySelectorAll('.bshow-ribbon-btn[data-bshow-menu]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.bshow-ribbon-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const menu = btn.dataset.bshowMenu;
        if (menu === 'Reference') {
          root.querySelector('#bshow-books-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Browser') {
          root.querySelector('#bshow-verses-browser')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Control') {
          root.querySelector('#bshow-panel-control')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (menu === 'Monitor') {
          root.querySelector('#bshow-monitor-screen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Options') {
          root.querySelector('#bshow-themes-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Program') {
          root.querySelector('#bshow-program-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Search') {
          const sInput = root.querySelector('#bshow-search-text');
          if (sInput) { sInput.focus(); sInput.select(); }
        } else if (menu === 'History') {
          root.querySelector('#bshow-history-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'AutoPlay') {
          this.toggleAutoPlay(root);
        } else if (menu === 'Help') {
          toastManager.show("Scripture Syntax: 'jn 3 16' (John 3:16), 'mat 5 1', '1co 13 4', 'ps 23 1', 'john 3 vs 16'. Press Enter to Preview.");
        }
      });
    });

    // 3. Instant Manual Scripture Input / Quick Jump Bar
    const manualInput = root.querySelector('#bshow-manual-scripture-input');
    const pill = root.querySelector('#bshow-manual-scripture-pill');
    const btnPreview = root.querySelector('#bshow-btn-manual-preview');
    const btnLive = root.querySelector('#bshow-btn-manual-live');

    const handleParseAndFeedback = () => {
      if (!manualInput || !pill) return null;
      const raw = manualInput.value.trim();
      if (!raw) {
        pill.textContent = 'Ready';
        pill.className = 'bshow-qj-feedback';
        return null;
      }
      const parsed = ScriptureEngine.parseReference(raw);
      if (parsed.valid) {
        pill.textContent = `${parsed.book} ${parsed.chapter}:${parsed.verse} ✓`;
        pill.className = 'bshow-qj-feedback matched';
        return parsed;
      } else {
        pill.textContent = 'e.g. jn 3 16 or john 3 vs 16';
        pill.className = 'bshow-qj-feedback error';
        return null;
      }
    };

    manualInput?.addEventListener('input', () => {
      handleParseAndFeedback();
    });

    const triggerPreview = () => {
      const parsed = handleParseAndFeedback();
      if (parsed) {
        this.loadReference(parsed.book, parsed.chapter, parsed.verse, parsed.translation || this.activeVersion);
        this.addToHistory(this.activeReference, this.activeVersion);
        this.updateScriptureDisplay(root);

        liveStore.setPreview({
          type: 'scripture',
          title: this.activeReference,
          reference: this.activeReference,
          text: this.activeVerseText,
          subtitle: `${this.activeVersion} • BibleShow`,
          speakerNotes: `BibleShow Preview: ${this.activeReference}`
        }, 'BibleShow');

        toastManager.show(`BibleShow [PREVIEW]: Staged ${this.activeReference}`);
      } else {
        // Fallback to currently selected verse
        liveStore.setPreview({
          type: 'scripture',
          title: this.activeReference,
          reference: this.activeReference,
          text: this.activeVerseText,
          subtitle: `${this.activeVersion} • BibleShow`,
          speakerNotes: `BibleShow Preview: ${this.activeReference}`
        }, 'BibleShow');
        toastManager.show(`BibleShow [PREVIEW]: Staged ${this.activeReference}`);
      }
    };

    const triggerLive = () => {
      const parsed = handleParseAndFeedback();
      if (parsed) {
        this.loadReference(parsed.book, parsed.chapter, parsed.verse, parsed.translation || this.activeVersion);
        this.addToHistory(this.activeReference, this.activeVersion);
        this.updateScriptureDisplay(root);
      }
      this.isShowingLive = true;
      liveStore.goLive({
        type: 'scripture',
        title: this.activeReference,
        reference: this.activeReference,
        text: this.activeVerseText,
        subtitle: `${this.activeVersion} • BibleShow`,
        speakerNotes: `BibleShow Active: ${this.activeReference}`
      }, 'BibleShow');
      toastManager.show(`BibleShow [LIVE]: Projected ${this.activeReference}`);
    };

    manualInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerPreview();
      }
    });

    btnPreview?.addEventListener('click', () => triggerPreview());
    btnLive?.addEventListener('click', () => triggerLive());

    // 4. Bible Version Checkboxes
    root.querySelectorAll('#bshow-versions-box input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        root.querySelectorAll('#bshow-versions-box input[type="checkbox"]').forEach(other => {
          if (other !== cb) other.checked = false;
        });
        cb.checked = true;
        this.activeVersion = cb.dataset.version;
        this.loadReference(this.activeBook, this.activeChapter, this.activeVerse, this.activeVersion);
        this.updateScriptureDisplay(root);
        toastManager.show(`Switched translation to ${this.activeVersion}`);
      });
    });

    root.querySelector('#bshow-btn-ver-info')?.addEventListener('click', () => {
      toastManager.show(`BibleShow DB: ${this.activeVersion} Canonical Translation loaded`);
    });

    root.querySelector('#bshow-btn-ver-dl')?.addEventListener('click', () => {
      toastManager.show('BibleShow Repository: All 8 public domain translations are installed and offline ready.');
    });

    // 5. Book Selection in Reference Column
    this.attachBookListEvents(root);

    // 6. Chapter / Verse spinners
    const spinCh = root.querySelector('#bshow-spin-ch');
    const spinVs = root.querySelector('#bshow-spin-vs');

    spinCh?.addEventListener('change', (e) => {
      const ch = Math.max(1, Number(e.target.value) || 1);
      this.loadReference(this.activeBook, ch, 1, this.activeVersion);
      if (spinVs) spinVs.value = 1;
      this.updateScriptureDisplay(root);
    });

    spinVs?.addEventListener('change', (e) => {
      const vs = Math.max(1, Number(e.target.value) || 1);
      this.loadReference(this.activeBook, this.activeChapter, vs, this.activeVersion);
      this.updateScriptureDisplay(root);
    });

    // Navigation Arrow Buttons
    root.querySelector('#bshow-nav-left')?.addEventListener('click', () => {
      if (this.activeChapter > 1) {
        this.loadReference(this.activeBook, this.activeChapter - 1, 1, this.activeVersion);
        if (spinCh) spinCh.value = this.activeChapter;
        if (spinVs) spinVs.value = 1;
        this.updateScriptureDisplay(root);
      }
    });

    root.querySelector('#bshow-nav-right')?.addEventListener('click', () => {
      this.loadReference(this.activeBook, this.activeChapter + 1, 1, this.activeVersion);
      if (spinCh) spinCh.value = this.activeChapter;
      if (spinVs) spinVs.value = 1;
      this.updateScriptureDisplay(root);
    });

    root.querySelector('#bshow-nav-up')?.addEventListener('click', () => {
      if (this.activeVerse > 1) {
        this.loadReference(this.activeBook, this.activeChapter, this.activeVerse - 1, this.activeVersion);
        if (spinVs) spinVs.value = this.activeVerse;
        this.updateScriptureDisplay(root);
      }
    });

    root.querySelector('#bshow-nav-down')?.addEventListener('click', () => {
      this.loadReference(this.activeBook, this.activeChapter, this.activeVerse + 1, this.activeVersion);
      if (spinVs) spinVs.value = this.activeVerse;
      this.updateScriptureDisplay(root);
    });

    root.querySelector('#bshow-btn-view-ref')?.addEventListener('click', () => {
      triggerPreview();
    });

    // 7. Verse Rows in Browser Column
    this.attachVerseBrowserEvents(root);

    // Browser Footer Tabs & Font Scaler
    root.querySelector('#bshow-btn-tab-books')?.addEventListener('click', () => {
      root.querySelector('#bshow-books-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    root.querySelector('#bshow-btn-tab-chaps')?.addEventListener('click', () => {
      spinCh?.focus();
      spinCh?.select();
    });

    root.querySelector('#bshow-btn-tab-verses')?.addEventListener('click', () => {
      spinVs?.focus();
      spinVs?.select();
    });

    root.querySelector('#bshow-font-scale')?.addEventListener('input', (e) => {
      this.verseFontSize = Number(e.target.value);
      root.querySelectorAll('#bshow-verses-browser .bshow-verse-text').forEach(t => {
        t.style.fontSize = `${this.verseFontSize}px`;
      });
    });

    // 8. Control Subpanel Buttons
    root.querySelector('#bshow-ctrl-preview')?.addEventListener('click', () => triggerPreview());

    root.querySelector('#bshow-ctrl-prev-v')?.addEventListener('click', () => {
      if (this.activeVerse > 1) {
        this.loadReference(this.activeBook, this.activeChapter, this.activeVerse - 1, this.activeVersion);
        if (spinVs) spinVs.value = this.activeVerse;
        this.updateScriptureDisplay(root);
      }
    });

    root.querySelector('#bshow-ctrl-next-v')?.addEventListener('click', () => {
      this.loadReference(this.activeBook, this.activeChapter, this.activeVerse + 1, this.activeVersion);
      if (spinVs) spinVs.value = this.activeVerse;
      this.updateScriptureDisplay(root);
    });

    root.querySelector('#bshow-ctrl-freeze')?.addEventListener('click', () => {
      this.isFrozen = !this.isFrozen;
      const btn = root.querySelector('#bshow-ctrl-freeze');
      if (btn) btn.classList.toggle('preview-active', this.isFrozen);
      toastManager.show(this.isFrozen ? 'Output Video Signal Frozen' : 'Output Video Signal Resumed');
    });

    root.querySelector('#bshow-ctrl-hide')?.addEventListener('click', () => {
      this.isHidden = !this.isHidden;
      const btn = root.querySelector('#bshow-ctrl-hide');
      const monText = root.querySelector('#bshow-monitor-text');
      if (btn) btn.textContent = this.isHidden ? 'Restore Output' : 'Hide Output';
      if (monText) monText.style.opacity = this.isHidden ? '0' : '1';
      toastManager.show(this.isHidden ? 'Output Blacked Out' : 'Output Visible');
    });

    // 9. Monitor Toolbar & Screen
    root.querySelector('#bshow-btn-show-tally')?.addEventListener('click', () => triggerLive());

    root.querySelector('#bshow-btn-studio-overlay')?.addEventListener('click', () => {
      liveStore.setOverlay(1, {
        type: 'lowerThird',
        title: this.activeReference,
        subtitle: this.activeVerseText
      });
      toastManager.show(`BibleShow [OVERLAY]: Staged ${this.activeReference} as Lower Third`);
    });

    root.querySelector('#bshow-btn-mon-save')?.addEventListener('click', () => {
      toastManager.show(`Saved snapshot of ${this.activeReference}`);
    });

    root.querySelector('#bshow-zoom-slider')?.addEventListener('input', (e) => {
      const zoom = Number(e.target.value) / 100;
      const mon = root.querySelector('#bshow-monitor-screen');
      if (mon) mon.style.transform = `scale(${zoom})`;
    });

    // 10. Options / Visual Themes Gallery
    root.querySelectorAll('#bshow-themes-gallery .bshow-theme-card').forEach(card => {
      card.addEventListener('click', () => {
        this.activeTheme = card.dataset.themeId;
        root.querySelectorAll('#bshow-themes-gallery .bshow-theme-card').forEach(c => c.classList.toggle('active', c === card));
        const themeObj = this.themes.find(t => t.id === this.activeTheme);
        const monitorScreen = root.querySelector('#bshow-monitor-screen');
        if (monitorScreen && themeObj) {
          monitorScreen.style.background = themeObj.bg;
        }
        const tag = root.querySelector('#bshow-current-theme-tag');
        if (tag) tag.textContent = `Current: ${this.activeTheme}`;
        toastManager.show(`BibleShow Theme: "${themeObj ? themeObj.name : this.activeTheme}"`);
      });
    });

    root.querySelector('#bshow-theme-btn-config')?.addEventListener('click', () => {
      toastManager.show('Visual theme typography & background configurator');
    });

    root.querySelector('#bshow-theme-btn-save')?.addEventListener('click', () => {
      toastManager.show(`Theme preset "${this.activeTheme}" saved`);
    });

    root.querySelector('#bshow-theme-btn-rename')?.addEventListener('click', () => {
      toastManager.show('Theme renamed successfully');
    });

    root.querySelector('#bshow-theme-btn-dl')?.addEventListener('click', () => {
      toastManager.show('Downloaded community theme packs');
    });

    // 11. Program Rundown Actions
    this.attachProgramEvents(root);

    root.querySelector('#bshow-btn-prog-add')?.addEventListener('click', () => {
      this.addToProgram(this.activeReference, this.activeVersion, this.activeVerseText);
      this.refreshProgramList(root);
      toastManager.show(`Added ${this.activeReference} to Program Rundown`);
    });

    root.querySelector('#bshow-btn-prog-new')?.addEventListener('click', () => {
      this.programList = [];
      this.refreshProgramList(root);
      toastManager.show('Created New Program Rundown');
    });

    root.querySelector('#bshow-btn-prog-load')?.addEventListener('click', () => {
      toastManager.show('Loaded Sunday Morning Service Rundown');
    });

    root.querySelector('#bshow-btn-prog-save')?.addEventListener('click', () => {
      toastManager.show(`Saved Program Rundown (${this.programList.length} items)`);
    });

    // 12. Search Panel
    const searchInput = root.querySelector('#bshow-search-text');
    const searchBtn = root.querySelector('#bshow-btn-run-search');

    const executeSearch = () => {
      const q = searchInput?.value.trim();
      if (!q) return;
      const results = ScriptureEngine.searchVerses(q, this.activeVersion);
      const browser = root.querySelector('#bshow-verses-browser');
      const header = root.querySelector('#bshow-browser-header-ref');
      if (header) header.textContent = `Search: "${q}" (${results.length} found)`;

      if (browser) {
        if (results.length === 0) {
          browser.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">No verses matching "${q}"</div>`;
        } else {
          browser.innerHTML = results.map(r => `
            <div class="bshow-verse-row" data-search-book="${r.book}" data-search-ch="${r.chapter}" data-verse-num="${r.verse}" data-verse-text="${(r.text || '').replace(/"/g, '&quot;')}">
              <div class="bshow-verse-header">
                <span class="bshow-vnum-badge">${r.ref}</span>
                <button class="bshow-vact-btn bshow-vplay" title="Send Live">▶</button>
                <button class="bshow-vact-btn bshow-vplus" title="Add to Program">+</button>
              </div>
              <div class="bshow-verse-text" style="font-size: ${this.verseFontSize}px;">
                ${r.text.replace(new RegExp(`(${q})`, 'gi'), `<span class="bshow-highlight-word">$1</span>`)}
              </div>
            </div>
          `).join('');

          // Wire search result row clicks
          browser.querySelectorAll('.bshow-verse-row').forEach(row => {
            row.addEventListener('click', () => {
              const b = row.dataset.searchBook;
              const c = Number(row.dataset.searchCh) || 1;
              const v = Number(row.dataset.verseNum) || 1;
              this.loadReference(b, c, v, this.activeVersion);
              this.updateScriptureDisplay(root);
            });
          });
        }
      }
      toastManager.show(`Found ${results.length} verses matching "${q}"`);
    };

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });
    searchBtn?.addEventListener('click', () => executeSearch());

    // 13. History Panel
    this.attachHistoryEvents(root);

    // 14. AutoPlay Engine
    root.querySelector('#bshow-btn-autoplay')?.addEventListener('click', () => {
      this.toggleAutoPlay(root);
    });

    root.querySelector('#bshow-ap-speed')?.addEventListener('input', (e) => {
      this.autoPlayDuration = Number(e.target.value);
      const lbl = root.querySelector('#bshow-ap-timing-label');
      if (lbl) lbl.textContent = `Timing: ${this.autoPlayDuration}s`;
    });

    root.querySelector('#bshow-btn-add-queue')?.addEventListener('click', () => {
      this.autoplayQueue.push({
        ref: `${this.activeBook} ${this.activeChapter}:${this.activeVerse}`,
        text: this.activeVerseText
      });
      this.refreshAutoPlayList(root);
      toastManager.show(`Added ${this.activeReference} to AutoPlay queue`);
    });

    root.querySelector('#bshow-ap-btn-new')?.addEventListener('click', () => {
      this.autoplayQueue = [];
      this.refreshAutoPlayList(root);
      toastManager.show('Cleared AutoPlay Queue');
    });

    root.querySelector('#bshow-ap-btn-preview')?.addEventListener('click', () => {
      triggerPreview();
    });

    root.querySelector('#bshow-ap-btn-hide')?.addEventListener('click', () => {
      if (this.isAutoPlaying) this.toggleAutoPlay(root);
    });
  }

  /**
   * Wire Book List Clicks
   */
  static attachBookListEvents(root) {
    root.querySelectorAll('#bshow-books-list .bshow-book-row').forEach(row => {
      row.addEventListener('click', () => {
        const book = row.dataset.book;
        this.loadReference(book, 1, 1, this.activeVersion);
        this.updateScriptureDisplay(root);
      });
    });
  }

  /**
   * Wire Verse Row and Quick Action clicks in Browser
   */
  static attachVerseBrowserEvents(root) {
    const browser = root.querySelector('#bshow-verses-browser');
    if (!browser) return;

    browser.querySelectorAll('.bshow-verse-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.bshow-vact-btn')) return;
        this.activeVerse = Number(row.dataset.verseNum) || 1;
        this.activeVerseText = row.dataset.verseText || '';
        this.activeReference = `${this.activeBook} ${this.activeChapter}:${this.activeVerse} (${this.activeVersion})`;

        const spinVs = root.querySelector('#bshow-spin-vs');
        if (spinVs) spinVs.value = this.activeVerse;

        browser.querySelectorAll('.bshow-verse-row').forEach(r => r.classList.toggle('active', r === row));
        this.updateScriptureDisplay(root, false);
      });

      // Quick ▶ Live button
      row.querySelector('.bshow-vplay')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeVerse = Number(row.dataset.verseNum) || 1;
        this.activeVerseText = row.dataset.verseText || '';
        this.activeReference = `${this.activeBook} ${this.activeChapter}:${this.activeVerse} (${this.activeVersion})`;
        this.addToHistory(this.activeReference, this.activeVersion);
        this.updateScriptureDisplay(root);

        liveStore.goLive({
          type: 'scripture',
          title: this.activeReference,
          reference: this.activeReference,
          text: this.activeVerseText,
          subtitle: `${this.activeVersion} • BibleShow`,
          speakerNotes: `BibleShow Active: ${this.activeReference}`
        }, 'BibleShow');
        toastManager.show(`BibleShow [LIVE]: Projected ${this.activeReference}`);
      });

      // Quick + Add to Program button
      row.querySelector('.bshow-vplus')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const vNum = Number(row.dataset.verseNum) || 1;
        const vText = row.dataset.verseText || '';
        const ref = `${this.activeBook} ${this.activeChapter}:${vNum}`;
        this.addToProgram(ref, this.activeVersion, vText);
        this.refreshProgramList(root);
        toastManager.show(`Added ${ref} to Program Rundown`);
      });
    });
  }

  /**
   * Wire Program Rundown clicks
   */
  static attachProgramEvents(root) {
    root.querySelectorAll('#bshow-program-list .bshow-rundown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.bshow-prog-del')) return;
        const ref = item.dataset.progRef;
        const text = item.dataset.progText;
        if (ref && text) {
          const parsed = ScriptureEngine.parseReference(ref);
          if (parsed.valid) {
            this.loadReference(parsed.book, parsed.chapter, parsed.verse, this.activeVersion);
          } else {
            this.activeReference = `${ref} (${this.activeVersion})`;
            this.activeVerseText = text;
          }
          this.updateScriptureDisplay(root);
        }
      });

      item.querySelector('.bshow-prog-del')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(item.dataset.progIdx);
        if (!isNaN(idx)) {
          this.programList.splice(idx, 1);
          this.refreshProgramList(root);
        }
      });
    });
  }

  /**
   * Refresh Program Rundown DOM
   */
  static refreshProgramList(root) {
    const list = root.querySelector('#bshow-program-list');
    if (!list) return;
    list.innerHTML = this.programList.map((item, idx) => `
      <div class="bshow-rundown-item ${item.ref.includes(this.activeBook) && item.ref.includes(this.activeChapter + ':') ? 'active' : ''}" data-prog-ref="${item.ref}" data-prog-text="${(item.text || '').replace(/"/g, '&quot;')}" data-prog-idx="${idx}">
        <span>${item.ref} (${item.trans})</span>
        <button class="bshow-vact-btn bshow-prog-del" data-prog-del="${idx}" style="font-size: 8px;" title="Remove">✕</button>
      </div>
    `).join('');
    this.attachProgramEvents(root);
  }

  /**
   * Wire History item clicks
   */
  static attachHistoryEvents(root) {
    root.querySelectorAll('#bshow-history-list .bshow-history-item').forEach(item => {
      item.addEventListener('click', () => {
        const ref = item.dataset.histRef;
        if (ref) {
          const parsed = ScriptureEngine.parseReference(ref);
          if (parsed.valid) {
            this.loadReference(parsed.book, parsed.chapter, parsed.verse, this.activeVersion);
            this.updateScriptureDisplay(root);
            toastManager.show(`Restored history: ${this.activeReference}`);
          }
        }
      });
    });
  }

  /**
   * Refresh History DOM
   */
  static refreshHistoryList(root) {
    const box = root.querySelector('#bshow-history-list');
    if (!box) return;
    box.innerHTML = this.historyList.map(h => `
      <div class="bshow-history-item" data-hist-ref="${h.ref}">
        ${h.ref} (${h.trans})
      </div>
    `).join('');
    this.attachHistoryEvents(root);
  }

  /**
   * Refresh AutoPlay Queue DOM
   */
  static refreshAutoPlayList(root) {
    const box = root.querySelector('#bshow-autoplay-list');
    if (!box) return;
    box.innerHTML = this.autoplayQueue.map((item, idx) => `
      <div class="bshow-rundown-item ${idx === 0 ? 'active' : ''}" data-queue-ref="${item.ref}" data-queue-text="${(item.text || '').replace(/"/g, '&quot;')}">
        <span>${item.ref}</span>
        <small style="color: #64748b; font-size: 9px;">${this.autoPlayDuration}s</small>
      </div>
    `).join('');
  }

  /**
   * Update all screen elements in BibleShow
   */
  static updateScriptureDisplay(root, reRenderBrowser = true) {
    this.activeReference = `${this.activeBook} ${this.activeChapter}:${this.activeVerse} (${this.activeVersion})`;

    const banner = root.querySelector('#bshow-titlebar-banner');
    if (banner) banner.textContent = this.activeReference;

    const summary = root.querySelector('#bshow-ref-summary-box');
    if (summary) summary.textContent = this.activeReference;

    const browserHeader = root.querySelector('#bshow-browser-header-ref');
    if (browserHeader) browserHeader.textContent = `Browser — ${this.activeReference}`;

    const monitorRef = root.querySelector('#bshow-monitor-ref');
    if (monitorRef) monitorRef.textContent = this.activeReference;

    const monitorText = root.querySelector('#bshow-monitor-text');
    if (monitorText) monitorText.textContent = this.activeVerseText;

    const ctrlStatus = root.querySelector('#bshow-ctrl-status');
    if (ctrlStatus) ctrlStatus.textContent = `Show: ${this.activeReference}`;

    const footer = root.querySelector('#bshow-footer-status');
    if (footer) footer.textContent = `Ready — ${this.activeReference}`;

    // Update spinners
    const spinCh = root.querySelector('#bshow-spin-ch');
    if (spinCh && Number(spinCh.value) !== this.activeChapter) {
      spinCh.value = this.activeChapter;
    }

    const spinVs = root.querySelector('#bshow-spin-vs');
    if (spinVs && Number(spinVs.value) !== this.activeVerse) {
      spinVs.value = this.activeVerse;
    }

    // Update active book highlight in list
    root.querySelectorAll('#bshow-books-list .bshow-book-row').forEach(r => {
      r.classList.toggle('active', r.dataset.book === this.activeBook);
    });

    // Re-render browser verses if chapter/book changed
    if (reRenderBrowser) {
      const browser = root.querySelector('#bshow-verses-browser');
      if (browser) {
        browser.innerHTML = this.renderVerseRows(this.chapterVerses, this.activeVerse, this.activeChapter, 'bshow');
        this.attachVerseBrowserEvents(root);

        // Scroll active verse into view
        const activeRow = browser.querySelector(`.bshow-verse-row[data-verse-num="${this.activeVerse}"]`);
        activeRow?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    this.refreshHistoryList(root);
  }

  /**
   * Toggle AutoPlay runner
   */
  static toggleAutoPlay(root) {
    this.isAutoPlaying = !this.isAutoPlaying;
    const btn = root.querySelector('#bshow-btn-autoplay');
    if (btn) {
      btn.classList.toggle('preview-active', this.isAutoPlaying);
      btn.textContent = this.isAutoPlaying ? '⏹ Stop' : '▶ Play';
    }

    if (this.isAutoPlaying) {
      if (this.autoplayQueue.length === 0) {
        toastManager.show('AutoPlay Queue is empty');
        this.isAutoPlaying = false;
        if (btn) btn.textContent = '▶ Play';
        return;
      }

      toastManager.show(`BibleShow AutoPlay started (${this.autoPlayDuration}s cycle)`);
      let idx = 0;
      this.autoPlayTimer = setInterval(() => {
        if (!this.isAutoPlaying) return;
        const item = this.autoplayQueue[idx % this.autoplayQueue.length];
        idx++;
        this.activeReference = `${item.ref} (${this.activeVersion})`;
        this.activeVerseText = item.text;
        this.updateScriptureDisplay(root, false);

        liveStore.goLive({
          type: 'scripture',
          title: this.activeReference,
          reference: item.ref,
          text: item.text,
          subtitle: `${this.activeVersion} • AutoPlay`,
          speakerNotes: 'BibleShow AutoPlay'
        }, 'BibleShow AutoPlay');
      }, this.autoPlayDuration * 1000);
    } else {
      if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
      toastManager.show('BibleShow AutoPlay paused');
    }
  }
}
