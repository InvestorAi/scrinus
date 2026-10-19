/**
 * KERYX Presentation Engine View
 * Slide canvas editor, aspect ratio control (16:9 / 4:3), layer properties inspector, and stage notes.
 */

import { presentationStore } from '../../stores/presentationStore.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';
import { AIPresentationBuilder } from '../ai/aiPresentationBuilder.js';

export class PresentationView {
  static render() {
    const { currentPresentation, activeSlideIndex, activeSlide, aspectRatio } = presentationStore.getState();

    return `
      <section class="page presentation-page">
        <!-- Presentation Top Action Bar -->
        <div class="presentation-toolbar panel">
          <div class="toolbar-left">
            <div class="deck-title-wrap">
              <span class="eyebrow">PRESENTATION DECK</span>
              <h2 id="pres-deck-title">${currentPresentation.title}</h2>
            </div>
          </div>

          <div class="toolbar-controls">
            <!-- Aspect Ratio Selector -->
            <label class="toolbar-select-label">Aspect:
              <select id="pres-select-aspect">
                <option value="16:9" ${aspectRatio === '16:9' ? 'selected' : ''}>16:9 Widescreen</option>
                <option value="4:3" ${aspectRatio === '4:3' ? 'selected' : ''}>4:3 Standard</option>
              </select>
            </label>

            <!-- Slide Manipulation Buttons -->
            <button class="tool-btn ai-tool-btn" id="pres-btn-ai-builder" title="AI Generate Sermon Presentation Deck"><span>✳</span> AI Generate Deck</button>
            <button class="tool-btn" id="pres-btn-add-slide" title="Add New Slide"><span>＋</span> New Slide</button>
            <button class="tool-btn" id="pres-btn-dup-slide" title="Duplicate Slide"><span>⧉</span> Duplicate</button>
            <button class="tool-btn danger-tool" id="pres-btn-del-slide" title="Delete Slide"><span>✕</span> Delete</button>
          </div>

          <div class="toolbar-right">
            <button class="secondary-button small" id="pres-btn-preview-deck">Preview</button>
            <button class="primary-button small" id="pres-btn-live-deck">Go Live <span>→</span></button>
          </div>
        </div>

        <!-- 3-Pane Presentation Workspace -->
        <div class="presentation-workspace-grid">
          <!-- Left Pane: Slide Thumbnail Deck -->
          <div class="slides-deck-sidebar panel">
            <div class="panel-header">
              <span class="eyebrow">SLIDES (${currentPresentation.slides.length})</span>
              <small>Click to stage</small>
            </div>
            <div class="slides-thumbnail-list" id="slides-thumbnail-list">
              ${currentPresentation.slides
                .map(
                  (slide, idx) => `
                <div class="slide-thumb-card ${idx === activeSlideIndex ? 'active-thumb' : ''}" data-idx="${idx}">
                  <span class="slide-thumb-num">0${idx + 1}</span>
                  <div class="slide-thumb-preview" style="background: ${slide.bgColor || '#141e24'};">
                    <span class="thumb-type">${slide.type.toUpperCase()}</span>
                    <strong class="thumb-title">${slide.title}</strong>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Center Pane: Slide Canvas Preview (16:9 / 4:3 Ratio) -->
          <div class="slide-canvas-center panel">
            <div class="canvas-header">
              <span class="canvas-ratio-indicator">ASPECT RATIO: <strong>${aspectRatio}</strong></span>
              <span class="canvas-slide-indicator">Slide ${activeSlideIndex + 1} of ${currentPresentation.slides.length}</span>
            </div>

            <div class="canvas-viewport-wrap">
              <div class="slide-canvas-frame ${aspectRatio === '4:3' ? 'aspect-4-3' : 'aspect-16-9'}" id="slide-canvas-frame" style="background: ${activeSlide.bgColor || '#101a1e'};">
                <div class="canvas-elements-layer" id="canvas-elements-layer">
                  ${this.renderCanvasElements(activeSlide)}
                </div>
              </div>
            </div>
          </div>

          <!-- Right Pane: Inspector & Speaker Notes -->
          <div class="slide-inspector-panel panel">
            <div class="panel-header">
              <span class="eyebrow">PROPERTIES</span>
              <h3>Slide Inspector</h3>
            </div>

            <div class="inspector-form">
              <label>Slide Title
                <input id="insp-slide-title" value="${activeSlide.title}" />
              </label>

              <label>Layout Type
                <select id="insp-slide-type">
                  <option value="title" ${activeSlide.type === 'title' ? 'selected' : ''}>Title & Subtitle</option>
                  <option value="scripture" ${activeSlide.type === 'scripture' ? 'selected' : ''}>Scripture Block</option>
                  <option value="point" ${activeSlide.type === 'point' ? 'selected' : ''}>Teaching Point</option>
                  <option value="callToAction" ${activeSlide.type === 'callToAction' ? 'selected' : ''}>Call to Action</option>
                </select>
              </label>

              <label>Background Color
                <div class="color-picker-row">
                  <input type="color" id="insp-slide-color" value="${activeSlide.bgColor || '#101a1e'}" />
                  <span id="insp-color-label">${activeSlide.bgColor || '#101a1e'}</span>
                </div>
              </label>

              <div class="inspector-divider"></div>

              <!-- Speaker Notes (Sent to Stage Display) -->
              <label class="speaker-notes-label">
                <span>Presenter Notes (Stage Monitor)</span>
                <textarea id="insp-slide-notes" rows="5" placeholder="Private notes visible on pastor's confidence screen...">${activeSlide.notes || ''}</textarea>
              </label>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static renderCanvasElements(slide) {
    if (slide.type === 'title') {
      const heading = slide.elements.find((e) => e.type === 'heading')?.text || slide.title;
      const sub = slide.elements.find((e) => e.type === 'subheading')?.text || '';
      const eyebrow = slide.elements.find((e) => e.type === 'eyebrow')?.text || '';
      return `
        <div class="canvas-slide-content title-layout">
          ${eyebrow ? `<span class="canvas-eyebrow">${eyebrow}</span>` : ''}
          <h1 class="canvas-title-text" contenteditable="true" id="canvas-editable-heading">${heading}</h1>
          ${sub ? `<p class="canvas-subtitle-text" contenteditable="true" id="canvas-editable-body">${sub}</p>` : ''}
        </div>
      `;
    }

    if (slide.type === 'scripture') {
      const ref = slide.elements.find((e) => e.type === 'reference')?.text || slide.title;
      const quote = slide.elements.find((e) => e.type === 'quote')?.text || '';
      return `
        <div class="canvas-slide-content scripture-layout">
          <span class="canvas-ref-badge" contenteditable="true" id="canvas-editable-heading">${ref}</span>
          <blockquote class="canvas-scripture-quote" contenteditable="true" id="canvas-editable-body">“${quote}”</blockquote>
        </div>
      `;
    }

    // Default Teaching Point
    const pointNum = slide.elements.find((e) => e.type === 'pointNumber')?.text || '01';
    const heading = slide.elements.find((e) => e.type === 'heading')?.text || slide.title;
    const body = slide.elements.find((e) => e.type === 'body')?.text || '';

    return `
      <div class="canvas-slide-content point-layout">
        <span class="canvas-point-num">${pointNum}</span>
        <h2 class="canvas-point-heading" contenteditable="true" id="canvas-editable-heading">${heading}</h2>
        <p class="canvas-point-body" contenteditable="true" id="canvas-editable-body">${body}</p>
      </div>
    `;
  }

  static attachEvents(container) {
    const thumbList = container.querySelector('#slides-thumbnail-list');
    const aspectSelect = container.querySelector('#pres-select-aspect');
    const titleInput = container.querySelector('#insp-slide-title');
    const typeSelect = container.querySelector('#insp-slide-type');
    const colorInput = container.querySelector('#insp-slide-color');
    const colorLabel = container.querySelector('#insp-color-label');
    const notesInput = container.querySelector('#insp-slide-notes');
    const editableHeading = container.querySelector('#canvas-editable-heading');
    const editableBody = container.querySelector('#canvas-editable-body');

    thumbList?.querySelectorAll('.slide-thumb-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        presentationStore.setActiveSlideIndex(idx);
        refreshView();
      });
    });

    aspectSelect?.addEventListener('change', (e) => {
      presentationStore.setAspectRatio(e.target.value);
      const frame = container.querySelector('#slide-canvas-frame');
      if (frame) {
        frame.className = `slide-canvas-frame ${e.target.value === '4:3' ? 'aspect-4-3' : 'aspect-16-9'}`;
      }
    });

    titleInput?.addEventListener('input', (e) => {
      const slide = presentationStore.getActiveSlide();
      if (slide) {
        slide.title = e.target.value;
      }
    });

    typeSelect?.addEventListener('change', (e) => {
      const slide = presentationStore.getActiveSlide();
      if (slide) {
        slide.type = e.target.value;
        refreshView();
      }
    });

    colorInput?.addEventListener('input', (e) => {
      const slide = presentationStore.getActiveSlide();
      if (slide) {
        slide.bgColor = e.target.value;
        if (colorLabel) colorLabel.textContent = e.target.value;
        const frame = container.querySelector('#slide-canvas-frame');
        if (frame) frame.style.background = e.target.value;
      }
    });

    notesInput?.addEventListener('input', (e) => {
      presentationStore.updateActiveSlideNotes(e.target.value);
    });

    editableHeading?.addEventListener('input', () => {
      syncContentFromCanvas();
    });

    editableBody?.addEventListener('input', () => {
      syncContentFromCanvas();
    });

    const syncContentFromCanvas = () => {
      const slide = presentationStore.getActiveSlide();
      if (!slide) return;
      const hText = editableHeading ? editableHeading.textContent : '';
      const bText = editableBody ? editableBody.textContent : '';

      slide.elements.forEach((el) => {
        if (el.type === 'heading' || el.type === 'reference') el.text = hText;
        if (el.type === 'body' || el.type === 'subheading' || el.type === 'quote') el.text = bText;
      });
      presentationStore.previewSlide(slide);
    };

    container.querySelector('#pres-btn-ai-builder')?.addEventListener('click', () => {
      AIPresentationBuilder.open();
    });

    container.querySelector('#pres-btn-add-slide')?.addEventListener('click', () => {
      presentationStore.addSlide('point');
      refreshView();
    });

    container.querySelector('#pres-btn-dup-slide')?.addEventListener('click', () => {
      presentationStore.duplicateSlide(presentationStore.activeSlideIndex);
      refreshView();
    });

    container.querySelector('#pres-btn-del-slide')?.addEventListener('click', () => {
      presentationStore.deleteSlide(presentationStore.activeSlideIndex);
      refreshView();
    });

    container.querySelector('#pres-btn-preview-deck')?.addEventListener('click', () => {
      presentationStore.previewSlide(presentationStore.getActiveSlide());
    });

    container.querySelector('#pres-btn-live-deck')?.addEventListener('click', () => {
      presentationStore.sendSlideLive(presentationStore.getActiveSlide());
    });

    const refreshView = () => {
      eventBus.emit('view:refresh');
    };
  }
}

