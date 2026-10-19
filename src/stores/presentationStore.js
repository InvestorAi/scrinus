/**
 * KERYX Presentation Store
 * Presentation decks, slide canvas models, aspect ratio settings, and slide element layers.
 */

import { SEED_PRESENTATION } from '../database/seedData.js';
import { liveStore } from './liveStore.js';
import { eventBus } from '../core/eventBus.js';

class PresentationStore {
  constructor() {
    this.currentPresentation = SEED_PRESENTATION;
    this.activeSlideIndex = 0;
    this.aspectRatio = '16:9';
    this.theme = 'dark-broadcast';
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.getState()));
    eventBus.emit('presentation:changed', this.getState());
  }

  getState() {
    return {
      currentPresentation: this.currentPresentation,
      activeSlideIndex: this.activeSlideIndex,
      activeSlide: this.getActiveSlide(),
      aspectRatio: this.aspectRatio,
      theme: this.theme
    };
  }

  getActiveSlide() {
    return this.currentPresentation.slides[this.activeSlideIndex] || this.currentPresentation.slides[0];
  }

  setActiveSlideIndex(index) {
    if (index >= 0 && index < this.currentPresentation.slides.length) {
      this.activeSlideIndex = index;
      const slide = this.getActiveSlide();
      this.notify();
      this.previewSlide(slide);
    }
  }

  previewSlide(slide) {
    liveStore.setPreview({
      type: 'presentation_slide',
      title: slide.title,
      subtitle: `${this.currentPresentation.title} · Slide ${this.activeSlideIndex + 1}`,
      text: slide.elements.map((e) => e.text).join('\n\n'),
      elements: slide.elements,
      slideType: slide.type,
      bgColor: slide.bgColor,
      speakerNotes: slide.notes || ''
    }, 'Presentation Editor');
  }

  sendSlideLive(slide) {
    liveStore.goLive({
      type: 'presentation_slide',
      title: slide.title,
      subtitle: `${this.currentPresentation.title} · Slide ${this.activeSlideIndex + 1}`,
      text: slide.elements.map((e) => e.text).join('\n\n'),
      elements: slide.elements,
      slideType: slide.type,
      bgColor: slide.bgColor,
      speakerNotes: slide.notes || ''
    }, 'Presentation Editor');
  }

  nextSlide() {
    if (this.activeSlideIndex < this.currentPresentation.slides.length - 1) {
      this.setActiveSlideIndex(this.activeSlideIndex + 1);
      this.sendSlideLive(this.getActiveSlide());
    }
  }

  previousSlide() {
    if (this.activeSlideIndex > 0) {
      this.setActiveSlideIndex(this.activeSlideIndex - 1);
      this.sendSlideLive(this.getActiveSlide());
    }
  }

  addSlide(type = 'point') {
    const newSlide = {
      id: 'slide_' + Date.now(),
      title: `Slide ${this.currentPresentation.slides.length + 1}`,
      type,
      bgType: 'color',
      bgColor: '#141e24',
      elements: [
        { type: 'heading', text: 'New Teaching Point' },
        { type: 'body', text: 'Click here to edit sermon notes or presentation body copy.' }
      ],
      notes: 'Notes for speaker display'
    };
    this.currentPresentation.slides.push(newSlide);
    this.activeSlideIndex = this.currentPresentation.slides.length - 1;
    this.notify();
  }

  duplicateSlide(index) {
    const target = this.currentPresentation.slides[index];
    if (!target) return;
    const cloned = JSON.parse(JSON.stringify(target));
    cloned.id = 'slide_' + Date.now();
    cloned.title += ' (Copy)';
    this.currentPresentation.slides.splice(index + 1, 0, cloned);
    this.activeSlideIndex = index + 1;
    this.notify();
  }

  deleteSlide(index) {
    if (this.currentPresentation.slides.length <= 1) return;
    this.currentPresentation.slides.splice(index, 1);
    if (this.activeSlideIndex >= this.currentPresentation.slides.length) {
      this.activeSlideIndex = this.currentPresentation.slides.length - 1;
    }
    this.notify();
  }

  updateActiveSlideElements(elements) {
    const slide = this.getActiveSlide();
    if (slide) {
      slide.elements = elements;
      this.notify();
      this.previewSlide(slide);
    }
  }

  updateActiveSlideNotes(notes) {
    const slide = this.getActiveSlide();
    if (slide) {
      slide.notes = notes;
      this.notify();
    }
  }

  setAspectRatio(ratio) {
    this.aspectRatio = ratio;
    this.notify();
  }
}

export const presentationStore = new PresentationStore();

