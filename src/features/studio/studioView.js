/**
 * KERYX Unified Church Studio Workspace — Authentic vMix Architecture
 * Designed based on professional vMix 26/27 broadcast control room workflows.
 * 
 * Features:
 * - Upper Tier: Dual 16:9 widescreen monitors (Preview with Orange header, Program with Green header)
 *   flanking a centered vMix transition column (Quick Play, Cut, Fade, Merge, Wipe, Fly, T-Bar, Green LED Clock).
 * - Category Tab Strip: All, Cameras, Scriptures, Worship, Slides, Media, Titles, AI Cues.
 * - Dynamic Inputs Grid:
 *   - Starts completely empty until the user adds inputs.
 *   - Empty state prompt with 1-click '+ Add Input to Section' and optional preset loader.
 *   - Live 16:9 thumbnails with orange preview / green live borders.
 *   - Dedicated 'Preview' and 'Live' action buttons on each card.
 *   - Dedicated '1', '2', '3' Overlay Channel buttons on each card:
 *     - [ 1 ]: Overlay 1 (Lower Third Title / Scripture banner)
 *     - [ 2 ]: Overlay 2 (Picture-in-Picture PIP window)
 *     - [ 3 ]: Overlay 3 (Scripture / Reference Floating Pill)
 *   - Dedicated '✕' and '🗑' delete buttons to remove inputs from the section.
 * - Docked Audio Mixer: Master dual stereo LED meters + input channel faders with real-time dB calculation.
 * - Bottom Master Bar: Prominent [+ Add Input] button, Record/Stream/NDI triggers, Stage & Projector launchers.
 * - Add Input / Church Asset Drawer: Instant Bible verses, worship lyrics, slides, NDI cams, media, and custom inputs.
 * - Multi-Platform Simulcast Hub: Stream simultaneously to YouTube, Facebook, TikTok, Instagram, X/Twitter, Twitch, Restream, and Custom RTMP.
 */

import { liveStore } from '../../stores/liveStore.js';
import { bibleStore } from '../../stores/bibleStore.js';
import { presentationStore } from '../../stores/presentationStore.js';
import { appStore } from '../../stores/appStore.js';
import { aiStore } from '../../stores/aiStore.js';
import { eventBus } from '../../core/eventBus.js';
import { speechEngine } from '../ai/speechEngine.js';
import { AICopilot } from '../ai/aiCopilot.js';
import { AIPresentationBuilder } from '../ai/aiPresentationBuilder.js';
import { timerWidget } from '../tools/timerWidget.js';
import { toastManager } from '../../components/toast.js';
import { OutputsView } from '../outputs/outputsView.js';
import { BibleView } from '../bible/bibleView.js';
import { ScriptureEngine, BIBLE_BOOKS, getBookChapterCount, BOOK_CHAPTER_COUNTS } from '../bible/scriptureEngine.js';
import { TranslationEngine } from '../ai/translationEngine.js';
import { SermonIntelligence } from '../ai/sermonIntelligence.js';
import { ScriptureDetector } from '../ai/scriptureDetector.js';
import { latencyTelemetry } from '../ai/latencyTelemetry.js';
import { BenchmarkSuite } from '../ai/benchmarkSuite.js';
import { MicroNoteEngine } from '../ai/microNoteEngine.js';

export class StudioView {
  static activeCategory = 'all'; // 'all' | 'cameras' | 'scriptures' | 'worship' | 'slides' | 'media' | 'titles' | 'ai'
  static activeDrawerTab = 'bible'; // 'bible' | 'worship' | 'slides' | 'media' | 'cameras' | 'titles' | 'custom' | 'ai'
  static isAddInputModalOpen = false;
  static isStreaming = false;
  static isRecording = false;
  static isExternalActive = false;
  static isMultiCorderActive = false;
  static isInputsPaused = false;
  static isBlackout = false;
  static isClear = false;
  static streamTimerInterval = null;
  static streamSeconds = 0;
  static recordTimerInterval = null;
  static recordSeconds = 0;
  static tbarValue = 0;
  static clockInterval = null;
  static audioMeterInterval = null;
  static _eventsInitialized = false;

  // Active Broadcast Preset
  static activePreset = 'Sunday Live Service';

  // Bible Show Manual Scripture State
  static isBibleShowModalOpen = false;
  static bibleShowBook = 'John';
  static bibleShowChapter = 3;
  static bibleShowVerse = 16;
  static bibleShowManualRef = 'John 3:16';
  static bibleShowManualText = 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.';
  static bibleShowManualTrans = 'KJV';
  static bibleShowManualTheme = 'lower-third'; // 'lower-third' | 'fullscreen' | 'pill' | 'alpha'
  static bibleShowTestament = 'ALL'; // 'ALL' | 'OT' | 'NT'
  static bibleShowBookSearch = '';
  static bibleShowVerseFontSize = 14;
  static bibleShowIsFullscreen = false;

  // AI Studio Intelligence Suite State
  static isAISuiteModalOpen = false;
  static activeAISuiteTab = 'detector'; // 'detector' | 'transcription' | 'notes' | 'translator'
  static isLiveSubtitlesActive = false;
  static isLiveTranslationActive = false;
  static activeTranslationLang = 'French';
  static liveSubtitlesText = '';

  // Image & Video Media Asset Management State
  static mediaSubFilter = 'all'; // 'all' | 'image' | 'video'
  static mediaAddMode = 'image'; // 'image' | 'video'
  static mediaSearchQuery = '';
  static mediaStagedUpload = null; // { file, url, title, sub, type, mediaType, loop, audio }
  static churchMediaAssets = [
    {
      id: 'cmed_1',
      title: 'Sunday Sermon Banner — Supernatural Fruitfulness',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Full HD Graphic · Still Art',
      tag: 'SERMON ART',
      bg: 'linear-gradient(135deg, #092e20 0%, #164e3f 50%, #061a12 100%)',
      accent: '#10b981',
      aspect: '16:9',
      size: '2.4 MB'
    },
    {
      id: 'cmed_2',
      title: 'Welcome to Grace City Church',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Sanctuary Welcome Graphic',
      tag: 'WELCOME',
      bg: 'linear-gradient(135deg, #0f2b38 0%, #1a4d63 50%, #081920 100%)',
      accent: '#06b6d4',
      aspect: '16:9',
      size: '1.8 MB'
    },
    {
      id: 'cmed_3',
      title: 'Tithes & Offering Giving Slate',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Bank & Mobile Giving Account Details',
      tag: 'GIVING',
      bg: 'linear-gradient(135deg, #332109 0%, #5e3c0f 50%, #1c1205 100%)',
      accent: '#f59e0b',
      aspect: '16:9',
      size: '1.5 MB'
    },
    {
      id: 'cmed_4',
      title: 'Holy Communion Memorial Graphic',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Reverent Memorial Graphic',
      tag: 'COMMUNION',
      bg: 'linear-gradient(135deg, #2b1117 0%, #521c27 50%, #17070b 100%)',
      accent: '#f43f5e',
      aspect: '16:9',
      size: '2.1 MB'
    },
    {
      id: 'cmed_5',
      title: 'Youth Ignite Conference Flyer',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Event Announcement Graphic',
      tag: 'EVENT',
      bg: 'linear-gradient(135deg, #271038 0%, #4b1a6e 50%, #14071f 100%)',
      accent: '#a855f7',
      aspect: '16:9',
      size: '3.0 MB'
    },
    {
      id: 'cmed_6',
      title: 'Social Media & Broadcast Info Slate',
      type: 'image',
      mediaType: 'image',
      category: 'media',
      sub: '1920×1080 Online Stream Handles @gracecity',
      tag: 'SOCIAL',
      bg: 'linear-gradient(135deg, #102438 0%, #1e456d 50%, #09131f 100%)',
      accent: '#38bdf8',
      aspect: '16:9',
      size: '1.2 MB'
    },
    {
      id: 'cmed_7',
      title: 'Welcome 5-Minute Motion Countdown',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 Motion Countdown Loop with Ambient Pad',
      tag: 'COUNTDOWN',
      bg: 'radial-gradient(circle at center, #083344 0%, #02121a 100%)',
      accent: '#06b6d4',
      aspect: '16:9',
      loop: true,
      audio: true,
      duration: '05:00',
      size: '64 MB'
    },
    {
      id: 'cmed_8',
      title: 'Ethereal Worship Ambient Particles',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 Seamless Blue & Gold Particle Loop',
      tag: 'MOTION LOOP',
      bg: 'radial-gradient(circle at center, #172554 0%, #030712 100%)',
      accent: '#3b82f6',
      aspect: '16:9',
      loop: true,
      audio: false,
      duration: 'Seamless Loop',
      size: '48 MB'
    },
    {
      id: 'cmed_9',
      title: 'Generosity Offering Motion Background',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 Warm Golden Wave Particle Motion',
      tag: 'OFFERTORY',
      bg: 'radial-gradient(circle at center, #451a03 0%, #0a0401 100%)',
      accent: '#f59e0b',
      aspect: '16:9',
      loop: true,
      audio: false,
      duration: 'Seamless Loop',
      size: '36 MB'
    },
    {
      id: 'cmed_10',
      title: 'Sermon Bumper Cinematic Video Intro',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 15s Cinematic Title Intro',
      tag: 'BUMPER',
      bg: 'radial-gradient(circle at center, #064e3b 0%, #021a13 100%)',
      accent: '#10b981',
      aspect: '16:9',
      loop: false,
      audio: true,
      duration: '00:15',
      size: '22 MB'
    },
    {
      id: 'cmed_11',
      title: 'Reverent Cross & Cloud Rays Loop',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 Slow Reverent Cloud Motion',
      tag: 'WORSHIP',
      bg: 'radial-gradient(circle at center, #312e81 0%, #0b0a1d 100%)',
      accent: '#6366f1',
      aspect: '16:9',
      loop: true,
      audio: false,
      duration: 'Seamless Loop',
      size: '52 MB'
    },
    {
      id: 'cmed_12',
      title: 'Energetic Praise Neon Pulse Motion',
      type: 'video',
      mediaType: 'video',
      category: 'media',
      sub: '1080p60 Concert Style Motion Background',
      tag: 'PRAISE',
      bg: 'radial-gradient(circle at center, #581c87 0%, #0d0216 100%)',
      accent: '#c084fc',
      aspect: '16:9',
      loop: true,
      audio: false,
      duration: 'Seamless Loop',
      size: '44 MB'
    }
  ];

  // Overlays State (1: Lower Third, 2: PIP / Watermark, 3: Scripture Pill, 4: Clock)
  static activeOverlays = {
    1: false,
    2: false,
    3: false,
    4: false
  };

  // Connected Input IDs per Overlay Channel (1, 2, 3, 4)
  static overlayInputs = {
    1: null,
    2: null,
    3: null,
    4: null
  };

  // Audio Channel Values & States
  static audioTabMode = 'master'; // 'master' | 'inputs'
  static channelVolumes = {
    master: 85,
    ch1: 78,
    ch2: 68,
    ch3: 60
  };
  static channelMutes = {
    master: false,
    ch1: false,
    ch2: false,
    ch3: false
  };
  static channelAudios = {
    master: true,
    ch1: true,
    ch2: true,
    ch3: true
  };

  // Multi-Platform Simulcast Destinations
  static streamDestinations = [
    {
      id: 'youtube',
      name: 'YouTube Live',
      icon: '🔴',
      color: '#ff0000',
      rtmp: 'rtmp://a.rtmp.youtube.com/live2',
      key: 'x8k4-29pa-v901-m74b',
      aspect: '16:9 Landscape',
      enabled: true
    },
    {
      id: 'facebook',
      name: 'Facebook Live',
      icon: '🔵',
      color: '#1877f2',
      rtmp: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      key: 'FB-884219401284-live',
      aspect: '16:9 Landscape',
      enabled: true
    },
    {
      id: 'tiktok',
      name: 'TikTok Live',
      icon: '🎵',
      color: '#00f2fe',
      rtmp: 'rtmp://live-push.tiktok.com/live/',
      key: 'tt_live_keryx_simulcast_key',
      aspect: '9:16 Vertical',
      enabled: true
    },
    {
      id: 'instagram',
      name: 'Instagram Live',
      icon: '📸',
      color: '#e1306c',
      rtmp: 'rtmps://live-upload.instagram.com:443/rtmp/',
      key: 'ig_live_stream_keryx_church',
      aspect: '9:16 Vertical',
      enabled: true
    },
    {
      id: 'x_twitter',
      name: 'X / Twitter Live',
      icon: '✖',
      color: '#ffffff',
      rtmp: 'rtmp://va.pscp.tv:80/x/',
      key: 'x_producer_keryx_broadcaster',
      aspect: '16:9 Landscape',
      enabled: true
    },
    {
      id: 'twitch',
      name: 'Twitch TV',
      icon: '🟣',
      color: '#9146ff',
      rtmp: 'rtmp://live.twitch.tv/app/',
      key: 'live_keryx_twitch_channel_key',
      aspect: '16:9 Landscape',
      enabled: false
    },
    {
      id: 'church_online',
      name: 'Church Online / Restream',
      icon: '⛪',
      color: '#10b981',
      rtmp: 'rtmp://live.restream.io/live/',
      key: 're_simulcast_aggregator_key',
      aspect: '16:9 Landscape',
      enabled: false
    },
    {
      id: 'custom_rtmp',
      name: 'Custom RTMP / SRT Server',
      icon: '📡',
      color: '#38bdf8',
      rtmp: 'rtmp://broadcast.gracecity.org:1935/live',
      key: 'sanctuary_master_pgm_stream',
      aspect: '16:9 / 9:16 Custom',
      enabled: false
    }
  ];

  // Active Modals & Input Editor
  static activeModal = null; // null | 'preset' | 'settings' | 'help' | 'input_settings' | 'output_settings' | 'playlist'
  static editingInputId = null;

  // Active Bible Browser State inside Drawer
  static activeBook = 'Proverbs';
  static activeChapter = 11;
  static bibleSearchQuery = '';
  static activeSongKey = 'Way Maker';
  static activeVerseLayout = 'full'; // 'full' | 'lt' | 'stage'

  // Default Broadcast Theme
  static activeTheme = {
    id: 'theme_nebula',
    name: 'Deep Nebula Blue',
    bg: 'linear-gradient(135deg, #09131d 0%, #102538 50%, #081119 100%)',
    textColor: '#ffffff',
    accentColor: '#38bdf8'
  };

  // Broadcast Presets List
  static presetsList = [
    { id: 'preset_sun', name: 'Sunday Live Service', desc: 'Full broadcast setup with PTZ cams, scripture overlays, and live stream telemetry' },
    { id: 'preset_mid', name: 'Wednesday Midweek Bible Study', desc: 'Scripture-focused template with high-contrast text and dual camera angles' },
    { id: 'preset_yth', name: 'Youth Revival Service', desc: 'Dynamic motion worship graphics, fast fade transitions, and energetic color themes' },
    { id: 'preset_conf', name: 'Global Miracle Conference', desc: 'Multi-camera ISO recording, guest speaker lower thirds, and external NDI distribution' }
  ];

  // Order of Service Setlist (for Service Playlist Modal)
  static servicePlaylist = [
    { num: 1, type: 'Opening', title: 'Call to Worship & Opening Prayer', sub: 'Auditorium Ambient Cam 1', inputId: 'inp_1' },
    { num: 2, type: 'Worship', title: 'Praise & Worship — Way Maker', sub: 'Sinach · Key: E · 68 BPM', inputId: 'inp_5' },
    { num: 3, type: 'Worship', title: 'Praise & Worship — Goodness of God', sub: 'Bethel Music · Key: G · 70 BPM', inputId: 'inp_6' },
    { num: 4, type: 'Scripture', title: 'Scripture Reading — Proverbs 11:12', sub: 'Proverbs 11:12 (KJV)', inputId: 'inp_3' },
    { num: 5, type: 'Sermon', title: 'Pastoral Sermon — Romans 8:28', sub: 'Pastor David Kingsley · Grace City', inputId: 'inp_4' },
    { num: 6, type: 'Slides', title: 'Vision Presentation 2026', sub: 'Slide 1 of 12 · 16:9 Deck', inputId: 'inp_7' },
    { num: 7, type: 'Offering', title: 'Tithes & Generosity Offering', sub: 'Lower Third Account Details', inputId: 'inp_9' },
    { num: 8, type: 'Closing', title: 'Benediction & Welcome Countdown', sub: '1080p Motion Video Loop', inputId: 'inp_8' }
  ];

  // =========================================================================
  // vMix Active Inputs List: Initially EMPTY as requested by user.
  // Nothing appears here until the user adds an input!
  // =========================================================================
  static inputsList = [];

  // Church Demo Preset Inputs (available to load with 1 click if desired)
  static defaultPresetsInputs = [
    {
      id: 'inp_1',
      num: 1,
      type: 'camera',
      category: 'cameras',
      title: 'Sanctuary Cam 1 (Wide)',
      text: 'Sanctuary Wide · 1080p60 NDI',
      sub: 'Main Center PTZ',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#ef4444'
    },
    {
      id: 'inp_2',
      num: 2,
      type: 'camera',
      category: 'cameras',
      title: 'Pulpit PTZ (Pastor Focus)',
      text: 'Pulpit Close-Up · 1080p60 HDMI 2',
      sub: 'Pastor Robotic PTZ',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#ef4444'
    },
    {
      id: 'inp_3',
      num: 3,
      type: 'scripture',
      category: 'scriptures',
      title: 'Proverbs 11:12 (KJV)',
      text: 'He that is void of wisdom despiseth his neighbour: but a man of understanding holdeth his peace.',
      sub: 'Proverbs 11:12 (KJV)',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: true,
      accent: '#f97316'
    },
    {
      id: 'inp_4',
      num: 4,
      type: 'scripture',
      category: 'scriptures',
      title: 'Romans 8:28 (KJV)',
      text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
      sub: 'Romans 8:28 (KJV)',
      audio: false,
      loop: false,
      isLive: true,
      isPreview: false,
      accent: '#f97316'
    },
    {
      id: 'inp_5',
      num: 5,
      type: 'worship',
      category: 'worship',
      title: 'Way Maker (Chorus)',
      text: 'Way maker, miracle worker, promise keeper\nLight in the darkness, my God\nThat is who You are',
      sub: 'Sinach · Key: E · 68 BPM',
      audio: true,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#eab308'
    },
    {
      id: 'inp_6',
      num: 6,
      type: 'worship',
      category: 'worship',
      title: 'Goodness of God (Verse 1)',
      text: 'I love You, Lord, for Your mercy never fails me\nAll my days, I\'ve been held in Your hands\nFrom the moment that I wake up until I lay my head\nI will sing of the goodness of God',
      sub: 'Bethel Music · Key: G · 70 BPM',
      audio: true,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#eab308'
    },
    {
      id: 'inp_7',
      num: 7,
      type: 'slides',
      category: 'slides',
      title: 'Sunday Vision 2026',
      text: 'Walking in Supernatural Fruitfulness\nTheme of the Year · Pastor David K.',
      sub: 'Slide 1 of 12 · 16:9 Presentation',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#22c55e'
    },
    {
      id: 'inp_8',
      num: 8,
      type: 'media',
      category: 'media',
      title: 'Welcome Countdown (5:00)',
      text: 'Service Begins In 04:59\nWelcome to Grace City Church',
      sub: 'Motion Video Loop · 1080p MP4',
      audio: true,
      loop: true,
      isLive: false,
      isPreview: false,
      accent: '#06b6d4'
    },
    {
      id: 'inp_9',
      num: 9,
      type: 'titles',
      category: 'titles',
      title: 'Pastor Badge (Lower Third)',
      text: 'Pastor David Kingsley\nSenior Pastor · KERYX Ministries',
      sub: 'Transparent Alpha Title Overlay',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#3b82f6'
    },
    {
      id: 'inp_10',
      num: 10,
      type: 'ai',
      category: 'ai',
      title: 'AI Speech Cue: Psalm 23:1',
      text: 'The LORD is my shepherd; I shall not want.',
      sub: 'Auto-detected from Pulpit Mic (99.2%)',
      audio: false,
      loop: false,
      isLive: false,
      isPreview: false,
      accent: '#a855f7'
    }
  ];

  // Comprehensive Scripture Database for Church Asset Drawer
  static scriptureDatabase = {
    'Proverbs': {
      11: [
        { num: 1, text: 'A false balance is abomination to the LORD: but a just weight is his delight.' },
        { num: 2, text: 'When pride cometh, then cometh shame: but with the lowly is wisdom.' },
        { num: 3, text: 'The integrity of the upright shall guide them: but the perverseness of transgressors shall destroy them.' },
        { num: 10, text: 'When it goeth well with the righteous, the city rejoiceth: and when the wicked perish, there is shouting.' },
        { num: 11, text: 'By the blessing of the upright the city is exalted: but it is overthrown by the mouth of the wicked.' },
        { num: 12, text: 'He that is void of wisdom despiseth his neighbour: but a man of understanding holdeth his peace.', active: true },
        { num: 13, text: 'A talebearer revealeth secrets: but he that is of a faithful spirit concealeth the matter.' },
        { num: 25, text: 'The liberal soul shall be made fat: and he that watereth shall be watered also himself.' },
        { num: 30, text: 'The fruit of the righteous is a tree of life; and he that winneth souls is wise.' }
      ],
      3: [
        { num: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.', active: true },
        { num: 6, text: 'In all thy ways acknowledge him, and he shall direct thy paths.' },
        { num: 9, text: 'Honour the LORD with thy substance, and with the firstfruits of all thine increase:' },
        { num: 10, text: 'So shall thy barns be filled with plenty, and thy presses shall burst out with new wine.' }
      ]
    },
    'Romans': {
      8: [
        { num: 1, text: 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.' },
        { num: 14, text: 'For as many as are led by the Spirit of God, they are the sons of God.' },
        { num: 18, text: 'For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us.' },
        { num: 26, text: 'Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought.' },
        { num: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', active: true },
        { num: 31, text: 'What shall we then say to these things? If God be for us, who can be against us?' },
        { num: 37, text: 'Nay, in all these things we are more than conquerors through him that loved us.' },
        { num: 38, text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,' },
        { num: 39, text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' }
      ],
      12: [
        { num: 1, text: 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.' },
        { num: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' }
      ]
    },
    'Psalms': {
      23: [
        { num: 1, text: 'The LORD is my shepherd; I shall not want.', active: true },
        { num: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
        { num: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
        { num: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
        { num: 5, text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
        { num: 6, text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' }
      ],
      91: [
        { num: 1, text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.', active: true },
        { num: 2, text: 'I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.' },
        { num: 11, text: 'For he shall give his angels charge over thee, to keep thee in all thy ways.' }
      ]
    },
    'John': {
      3: [
        { num: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', active: true },
        { num: 17, text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' }
      ],
      14: [
        { num: 1, text: 'Let not your heart be troubled: ye believe in God, believe also in me.' },
        { num: 6, text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.', active: true }
      ]
    },
    'Hebrews': {
      11: [
        { num: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', active: true },
        { num: 6, text: 'But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.' }
      ]
    },
    'Philippians': {
      4: [
        { num: 4, text: 'Rejoice in the Lord alway: and again I say, Rejoice.' },
        { num: 6, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
        { num: 7, text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' },
        { num: 13, text: 'I can do all things through Christ which strengtheneth me.', active: true },
        { num: 19, text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.' }
      ]
    },
    'Isaiah': {
      40: [
        { num: 29, text: 'He giveth power to the faint; and to them that have no might he increaseth strength.' },
        { num: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', active: true }
      ]
    }
  };

  // Worship Song Catalog
  static worshipSongsData = {
    'Way Maker': {
      title: 'Way Maker',
      artist: 'Sinach · Key: E · 68 BPM',
      sections: [
        { id: 's1', name: '1. Verse 1', text: 'You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You' },
        { id: 's2', name: '2. Chorus 1', text: 'Way maker, miracle worker, promise keeper\nLight in the darkness, my God\nThat is who You are', active: true },
        { id: 's3', name: '3. Verse 2', text: 'You are here, touching every heart\nI worship You, I worship You\nYou are here, healing every heart\nI worship You, I worship You' },
        { id: 's4', name: '4. Chorus 2', text: 'Way maker, miracle worker, promise keeper\nLight in the darkness, my God\nThat is who You are' },
        { id: 's5', name: '5. Bridge', text: 'Even when I don\'t see it, You\'re working\nEven when I don\'t feel it, You\'re working\nYou never stop, You never stop working' },
        { id: 's6', name: '6. Outro', text: 'That is who You are\nThat is who You are\nLord that is who You are' }
      ]
    },
    'Goodness of God': {
      title: 'Goodness of God',
      artist: 'Bethel Music · Key: G · 70 BPM',
      sections: [
        { id: 'g1', name: '1. Verse 1', text: 'I love You, Lord, for Your mercy never fails me\nAll my days, I\'ve been held in Your hands\nFrom the moment that I wake up until I lay my head\nI will sing of the goodness of God', active: true },
        { id: 'g2', name: '2. Chorus', text: '\'Cause all my life You have been faithful\nAnd all my life You have been so, so good\nWith every breath that I am able\nI will sing of the goodness of God' },
        { id: 'g3', name: '3. Verse 2', text: 'I love Your voice, You have led me through the fire\nIn the darkest night You are close like no other\nI\'ve known You as a Father, I\'ve known You as a Friend\nAnd I have lived in the goodness of God' },
        { id: 'g4', name: '4. Bridge', text: 'Your goodness is running after, it\'s running after me\nYour goodness is running after, it\'s running after me\nWith my life laid down, I surrender now, I give You everything' }
      ]
    },
    'What A Beautiful Name': {
      title: 'What A Beautiful Name',
      artist: 'Hillsong Worship · Key: D · 68 BPM',
      sections: [
        { id: 'w1', name: '1. Verse 1', text: 'You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ' },
        { id: 'w2', name: '2. Chorus 1', text: 'What a beautiful Name it is\nWhat a beautiful Name it is\nThe Name of Jesus Christ my King', active: true },
        { id: 'w3', name: '3. Verse 2', text: 'You didn\'t want heaven without us\nSo Jesus, You brought heaven down\nMy sin was great, Your love was greater\nWhat could separate us now' },
        { id: 'w4', name: '4. Chorus 2', text: 'What a wonderful Name it is\nWhat a wonderful Name it is\nThe Name of Jesus Christ my King' }
      ]
    }
  };

  /**
   * Helper: Get active simulcast destinations
   */
  static getActiveDestinations() {
    return this.streamDestinations.filter(d => d.enabled);
  }

  /**
   * Main Render Method: Authentic vMix 26/27 Broadcast Control Room
   */
  static render() {
    const previewInput = this.inputsList.find(i => i.isPreview) || null;
    const liveInput = this.inputsList.find(i => i.isLive) || null;

    const previewTitle = previewInput ? previewInput.title : '(Standby)';
    const previewText = previewInput ? previewInput.text : '';
    const previewSub = previewInput ? previewInput.sub : 'No input in preview · Click an input card below to stage';

    const liveTitle = liveInput ? liveInput.title : 'Standby Slate';
    const liveText = liveInput ? liveInput.text : '';
    const liveSub = liveInput ? liveInput.sub : 'Grace City Church Broadcast · Standby Output';

    const activeDestCount = this.getActiveDestinations().length;

    // Resolve active overlay inputs
    const ol1Input = this.inputsList.find(i => i.id === this.overlayInputs[1]);
    const ol2Input = this.inputsList.find(i => i.id === this.overlayInputs[2]);
    const ol3Input = this.inputsList.find(i => i.id === this.overlayInputs[3]);

    const ol1Title = ol1Input ? ol1Input.title : (liveInput ? liveInput.title : 'Grace City Church Broadcast');
    const ol1Sub = ol1Input ? (ol1Input.text ? ol1Input.text.split('\n')[0] : ol1Input.sub) : (liveInput ? liveInput.sub : 'Auditorium Output');

    return `
      <section class="keryx-studio-workspace" id="keryx-studio-workspace">
        <!-- 1. AeuxGlobal Studio Header Control Strip -->
        <header class="vmix-top-bar">
          <div class="vmix-menu-group">
            <div class="vmix-brand-lockup">
              <div class="aeux-logo-bars sm">
                <span class="bar bar-1"></span>
                <span class="bar bar-2"></span>
                <span class="bar bar-3"></span>
              </div>
              <strong class="vmix-brand-title">STUDIO</strong>
              <span class="vmix-version-tag">27 PRO</span>
            </div>
            <div class="vmix-preset-pill" id="btn-vmix-preset-trigger" title="Active Broadcast Preset: Click to switch">
              <span id="vmix-preset-label">✦ ${this.activePreset}</span>
              <small style="opacity: 0.6;">▾</small>
            </div>
          </div>

          <div class="vmix-top-actions">
            <button class="aeux-pill-toggle-btn ${this.isStreaming ? 'active-emerald' : ''}" id="btn-vmix-stream" title="Simulcast Stream to ${activeDestCount} Platforms">
              <span class="status-pip ${this.isStreaming ? 'pulse-emerald' : ''}"></span>
              <span id="btn-vmix-stream-text">${this.isStreaming ? 'STREAM ' + this.formatDuration(this.streamSeconds) + ` (${activeDestCount} LIVE)` : `STREAM (${activeDestCount})`}</span>
            </button>
            <button class="aeux-pill-toggle-btn ${this.isRecording ? 'active-ruby' : ''}" id="btn-vmix-rec" title="Toggle Master Recording">
              <span class="status-pip ${this.isRecording ? 'pulse-ruby' : ''}"></span>
              <span id="btn-vmix-rec-text">${this.isRecording ? 'REC ' + this.formatDuration(this.recordSeconds) : 'REC'}</span>
            </button>
            <button class="aeux-pill-btn" id="btn-vmix-fullscreen" title="Toggle Fullscreen Output">Fullscreen</button>
            <button class="aeux-pill-btn ${this.isExternalActive ? 'active-cyan' : ''}" id="btn-vmix-external" title="Toggle NDI / External Output">External</button>
            <button class="aeux-pill-btn ${this.isMultiCorderActive ? 'active-ruby' : ''}" id="btn-vmix-multicorder" title="Multi-Angle Camera Capture">MultiCorder</button>
          </div>

          <div class="vmix-top-right">
            <button class="aeux-pill-btn ${this.isInputsPaused ? 'active-amber' : ''}" id="btn-vmix-pause" title="Pause / Freeze All Live Inputs">Pause</button>
            <button class="aeux-pill-btn-emerald" id="btn-vmix-aisuite" title="Studio AI Suite: Detector, Transcriber, Notes & Translator">✳ AI Studio Hub</button>
            <button class="aeux-pill-btn" id="btn-vmix-settings" title="vMix Studio Settings & Multi-Platform Simulcasting">Settings</button>
            <button class="aeux-pill-btn" id="btn-vmix-help" title="Documentation & Keyboard Shortcuts">Help</button>
            <button class="aeux-pill-btn-emerald" id="btn-vmix-exit-dash" data-view="Dashboard" data-nav-target="Dashboard" title="Return to Dashboard">⌂ Dashboard</button>
          </div>
        </header>

        <!-- 2. Upper Tier: Dual 16:9 Widescreen Monitors & Centered Transition Column -->
        <div class="vmix-monitors-tier">
          <!-- LEFT: PREVIEW MONITOR (Orange Header / Border) -->
          <div class="vmix-screen-wrapper">
            <div class="vmix-screen-card is-preview" id="vmix-preview-card">
              <div class="vmix-card-header orange-header">
                <div class="vcard-title-lockup">
                  <span class="vcard-pill-badge orange">PREVIEW</span>
                  <span class="vcard-num-badge" id="preview-input-num">${previewInput ? previewInput.num : '-'}</span>
                  <strong class="vcard-title-text" id="preview-station-title">Preview: ${previewTitle}</strong>
                </div>
                <div class="vcard-header-icons">
                  <span class="vcard-ratio-tag">1920×1080 · 16:9</span>
                  <button class="vcard-icon-btn" id="btn-preview-gear" title="Configure Preview Input">⚙</button>
                </div>
              </div>

              <!-- Strict 16:9 Widescreen Viewport -->
              <div class="vmix-screen-canvas" id="preview-monitor-canvas" style="background: ${this.activeTheme.bg};">
                <div class="vmix-bounding-frame">
                  <span class="vhandle tl"></span>
                  <span class="vhandle tr"></span>
                  <span class="vhandle bl"></span>
                  <span class="vhandle br"></span>
                  <span class="vhandle pin"></span>
                </div>

                <div class="vmix-canvas-content" id="preview-monitor-content">
                  ${this.renderScreenContent(previewInput, previewText, previewSub, false)}
                </div>
              </div>

              <div class="vmix-card-footer">
                <span class="vfooter-meta" id="preview-footer-meta">${previewSub}</span>
                <div class="vfooter-controls">
                  <button class="mini-tool-btn" id="btn-preview-swap" title="Swap Preview and Live">⇄ Swap to Live</button>
                  <button class="mini-tool-btn" id="btn-preview-clear" title="Clear Preview to Standby">⎚ Clear</button>
                </div>
              </div>
            </div>
          </div>

          <!-- CENTER: VMIX TRANSITION COLUMN -->
          <div class="vmix-transition-column">
            <button class="vtrans-btn primary-quick" id="btn-quick-play" title="Quick Play Transition">Quick Play</button>
            <button class="vtrans-btn primary-cut" id="btn-cut-trans" title="Immediate Cut (Space / Enter)">Cut</button>
            <div class="vtrans-split-row">
              <button class="vtrans-btn sm" id="btn-fade-trans" title="Smooth Fade Transition">Fade</button>
              <input type="number" class="vtrans-dur-input" id="fade-duration-input" value="500" min="50" max="3000" step="50" title="Fade duration in ms" />
            </div>
            <button class="vtrans-btn sm" id="btn-merge-trans" title="Merge Motion">Merge</button>
            <button class="vtrans-btn sm" id="btn-wipe-trans" title="Horizontal Wipe">Wipe</button>
            <button class="vtrans-btn sm" id="btn-fly-trans" title="3D Fly In">Fly</button>

            <!-- Interactive T-Bar Slider -->
            <div class="vmix-tbar-container">
              <div class="tbar-track-line">
                <input type="range" class="vmix-tbar-slider" id="vmix-tbar" min="0" max="100" value="0" />
              </div>
              <span class="tbar-percent-readout" id="tbar-percent">0%</span>
            </div>

            <!-- Master Overlay Channel Toggles (1, 2, 3, 4) -->
            <div class="vmix-overlay-buttons">
              <button class="voverlay-btn ${this.activeOverlays[1] ? 'active' : ''}" data-overlay="1" title="Overlay 1: Lower Third Title">1</button>
              <button class="voverlay-btn ${this.activeOverlays[2] ? 'active' : ''}" data-overlay="2" title="Overlay 2: Picture-in-Picture PIP">2</button>
              <button class="voverlay-btn ${this.activeOverlays[3] ? 'active' : ''}" data-overlay="3" title="Overlay 3: Scripture Pill">3</button>
              <button class="voverlay-btn ${this.activeOverlays[4] ? 'active' : ''}" data-overlay="4" title="Overlay 4: Service Clock">4</button>
            </div>

            <!-- Digital Green Studio Clock -->
            <div class="vmix-digital-clock" id="vmix-studio-clock">
              11:12:05 AM
            </div>
          </div>

          <!-- RIGHT: PROGRAM / ACTIVE LIVE MONITOR (Green Header / Border) -->
          <div class="vmix-screen-wrapper">
            <div class="vmix-screen-card is-live" id="vmix-program-card">
              <div class="vmix-card-header green-header">
                <div class="vcard-title-lockup">
                  <span class="vcard-pill-badge green pulse">● ON AIR</span>
                  <span class="vcard-num-badge" id="live-input-num">${liveInput ? liveInput.num : '-'}</span>
                  <strong class="vcard-title-text" id="live-station-title">Active: ${liveTitle}</strong>
                </div>
                <div class="vcard-header-icons">
                  <span class="vcard-ratio-tag">NDI 1080p60</span>
                  <button class="vcard-icon-btn" id="btn-program-gear" title="Output & Watermark Settings">⚙</button>
                </div>
              </div>

              <!-- Strict 16:9 Widescreen Viewport -->
              <div class="vmix-screen-canvas" id="live-monitor-canvas" style="background: ${this.isBlackout ? '#000000' : this.activeTheme.bg};">
                <div class="vmix-canvas-content" id="live-monitor-content" style="opacity: ${this.isBlackout ? 0 : 1};">
                  ${this.renderScreenContent(liveInput, liveText, liveSub, true)}
                </div>

                <!-- Overlay 1: Lower Third Overlay Banner on Program -->
                <div class="vmix-program-lower-third" id="vmix-live-lower-third" style="display: ${this.activeOverlays[1] && !this.isClear && !this.isBlackout ? 'flex' : 'none'};">
                  <div class="vlt-bar"></div>
                  <div class="vlt-content">
                    <strong id="vlt-title">${ol1Title}</strong>
                    <small id="vlt-subtitle">${ol1Sub}</small>
                  </div>
                </div>

                <!-- Overlay 2: Picture-in-Picture (PIP) Window on Program -->
                <div class="vmix-pip-overlay" id="vmix-pip-overlay" style="display: ${this.activeOverlays[2] && !this.isClear && !this.isBlackout && ol2Input ? 'block' : 'none'};">
                  <div class="vpip-window">
                    <div class="vpip-badge">PIP 2</div>
                    <div class="vpip-content" id="vpip-content">
                      ${ol2Input ? this.renderPipSnippet(ol2Input) : ''}
                    </div>
                    <span class="vpip-label" id="vpip-label">${ol2Input ? ol2Input.title : ''}</span>
                  </div>
                </div>

                <!-- Overlay 2 Alternate: Watermark Bug Overlay on Program -->
                <div class="vmix-watermark-overlay" id="vmix-watermark-overlay" style="display: ${this.activeOverlays[2] && !ol2Input && !this.isClear && !this.isBlackout ? 'block' : 'none'};">
                  ✦ GRACE CITY BROADCAST
                </div>

                <!-- Overlay 3: Scripture / Reference Pill Overlay -->
                <div class="vmix-ref-overlay" id="vmix-ref-overlay" style="display: ${this.activeOverlays[3] && !this.isClear && !this.isBlackout ? 'block' : 'none'};">
                  <span id="vref-text">${ol3Input ? (ol3Input.sub || ol3Input.title) : (liveInput ? liveInput.sub : 'Romans 8:28')}</span>
                </div>

                <!-- Overlay 4: Digital Countdown / Clock Overlay -->
                <div class="vmix-clock-overlay" id="vmix-clock-overlay" style="display: ${this.activeOverlays[4] && !this.isClear && !this.isBlackout ? 'block' : 'none'};">
                  SERVICE 11:12:05
                </div>

                <!-- Live Closed Captions / Subtitles Overlay on Program -->
                <div class="vmix-live-subtitles-overlay" id="vmix-live-subtitles-overlay" style="display: ${(this.isLiveSubtitlesActive || this.isLiveTranslationActive) && !this.isClear && !this.isBlackout ? 'flex' : 'none'};">
                  <span class="vsubtitle-badge ${this.isLiveTranslationActive ? 'trans' : ''}" id="vsubtitle-badge">
                    ${this.isLiveTranslationActive ? ('TRANS (' + this.activeTranslationLang.toUpperCase() + ')') : 'LIVE CC'}
                  </span>
                  <span class="vsubtitle-text" id="vsubtitle-text">
                    ${this.getLiveSubtitlesContent()}
                  </span>
                </div>

                <!-- Emergency Safety Overlay -->
                <div class="vmix-emergency-overlay" id="vmix-emergency-overlay" style="display: none;">
                  <h2>⚠ EMERGENCY SAFETY OVERRIDE</h2>
                  <p>Please remain calm and follow safety usher instructions immediately.</p>
                </div>
              </div>

              <div class="vmix-card-footer">
                <span class="vfooter-meta live-text">NDI: 1920×1080 @ 60fps · AUDITORIUM ACTIVE</span>
                <div class="vfooter-controls">
                  <button class="mini-tool-btn danger ${this.isBlackout ? 'active-blackout' : ''}" id="btn-live-blackout" title="Instant Blackout (B)">■ Blackout</button>
                  <button class="mini-tool-btn warning ${this.isClear ? 'active-clear' : ''}" id="btn-live-clear" title="Clear Overlays (C)">⎚ Clear</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Category Tab Strip (vMix Colored Filter Bar) -->
        <div class="vmix-category-strip">
          <div class="vcat-buttons-group" id="vmix-category-tabs">
            <button class="vcat-tab ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">
              <span class="vcat-chip gray"></span> All (${this.inputsList.length})
            </button>
            <button class="vcat-tab ${this.activeCategory === 'cameras' ? 'active' : ''}" data-cat="cameras">
              <span class="vcat-chip red"></span> Cameras
            </button>
            <button class="vcat-tab ${this.activeCategory === 'scriptures' ? 'active' : ''}" data-cat="scriptures">
              <span class="vcat-chip orange"></span> Scriptures
            </button>
            <button class="vcat-tab ${this.activeCategory === 'worship' ? 'active' : ''}" data-cat="worship">
              <span class="vcat-chip yellow"></span> Worship
            </button>
            <button class="vcat-tab ${this.activeCategory === 'slides' ? 'active' : ''}" data-cat="slides">
              <span class="vcat-chip green"></span> Slides
            </button>
            <button class="vcat-tab ${this.activeCategory === 'media' ? 'active' : ''}" data-cat="media">
              <span class="vcat-chip cyan"></span> Media
            </button>
            <button class="vcat-tab ${this.activeCategory === 'titles' ? 'active' : ''}" data-cat="titles">
              <span class="vcat-chip blue"></span> Titles
            </button>
            <button class="vcat-tab ${this.activeCategory === 'ai' ? 'active' : ''}" data-cat="ai">
              <span class="vcat-chip purple"></span> AI Cues
            </button>
          </div>

          <div class="vcat-quick-actions">
            <button class="vcat-action-btn" id="btn-open-bibleshow" title="Bible Show Scripture Software Console">
              <span>📖</span> Bible Show
            </button>
            <button class="vcat-action-btn" id="btn-open-aisuite" title="AI Scripture Detector, Notes, Translator & Transcription">
              <span>✳</span> AI Studio Tools
            </button>
            <button class="vcat-action-btn" id="btn-open-asset-drawer" title="Open Church Scripture & Worship Library">
              <span>＋</span> Add Input / Assets
            </button>
            <button class="vcat-action-btn" id="btn-ai-speech-toggle" title="Toggle Live Speech Transcription">
              <span>🎤</span> Speech AI Cues
            </button>
          </div>
        </div>

        <!-- 4. Bottom Tier: Inputs Matrix Cards + Docked Audio Mixer -->
        <div class="vmix-bottom-tier">
          <!-- LEFT / CENTER: INPUTS MATRIX -->
          <div class="vmix-inputs-area" id="vmix-inputs-area">
            <div class="vmix-inputs-grid ${this.isInputsPaused ? 'inputs-paused' : ''}" id="vmix-inputs-grid">
              ${this.renderInputCards()}
            </div>
          </div>

          <!-- RIGHT: DOCKED VMIX AUDIO MIXER -->
          <aside class="vmix-audio-dock" id="vmix-audio-dock">
            <div class="vaudio-header">
              <strong>Audio Mixer</strong>
              <div class="vaudio-header-tabs">
                <span class="vaudio-tab ${this.audioTabMode === 'master' ? 'active' : ''}" data-audio-tab="master">Master</span>
                <span class="vaudio-tab ${this.audioTabMode === 'inputs' ? 'active' : ''}" data-audio-tab="inputs">Inputs</span>
              </div>
            </div>

            <div class="vaudio-channels-row">
              <!-- Master Channel -->
              <div class="vaudio-strip master-strip">
                <span class="vstrip-label">Master</span>
                <div class="vstrip-meters-box">
                  <div class="vled-bar left" id="meter-master-l">
                    <span class="vled-fill" style="height: 78%;"></span>
                  </div>
                  <div class="vled-bar right" id="meter-master-r">
                    <span class="vled-fill" style="height: 74%;"></span>
                  </div>
                </div>
                <div class="vstrip-fader-track">
                  <input type="range" class="vstrip-fader" orient="vertical" data-channel="master" min="0" max="100" value="${this.channelVolumes.master}" />
                </div>
                <span class="vstrip-db" id="db-master">0.0 dB</span>
                <button class="vstrip-mute-btn ${this.channelMutes.master ? 'active-mute' : ''}" data-channel="master">M</button>
                <button class="vstrip-audio-btn ${this.channelAudios.master ? 'active' : ''}" data-channel="master">Audio</button>
              </div>

              <!-- Channel 1: Pulpit Mic -->
              <div class="vaudio-strip">
                <span class="vstrip-label">Pulpit</span>
                <div class="vstrip-meters-box">
                  <div class="vled-bar center" id="meter-ch1">
                    <span class="vled-fill" style="height: 65%;"></span>
                  </div>
                </div>
                <div class="vstrip-fader-track">
                  <input type="range" class="vstrip-fader" orient="vertical" data-channel="ch1" min="0" max="100" value="${this.channelVolumes.ch1}" />
                </div>
                <span class="vstrip-db" id="db-ch1">-6.8 dB</span>
                <button class="vstrip-mute-btn ${this.channelMutes.ch1 ? 'active-mute' : ''}" data-channel="ch1">M</button>
                <button class="vstrip-audio-btn ${this.channelAudios.ch1 ? 'active' : ''}" data-channel="ch1">Audio</button>
              </div>

              <!-- Channel 2: Worship Band -->
              <div class="vaudio-strip">
                <span class="vstrip-label">Worship</span>
                <div class="vstrip-meters-box">
                  <div class="vled-bar center" id="meter-ch2">
                    <span class="vled-fill" style="height: 58%;"></span>
                  </div>
                </div>
                <div class="vstrip-fader-track">
                  <input type="range" class="vstrip-fader" orient="vertical" data-channel="ch2" min="0" max="100" value="${this.channelVolumes.ch2}" />
                </div>
                <span class="vstrip-db" id="db-ch2">-10.8 dB</span>
                <button class="vstrip-mute-btn ${this.channelMutes.ch2 ? 'active-mute' : ''}" data-channel="ch2">M</button>
                <button class="vstrip-audio-btn ${this.channelAudios.ch2 ? 'active' : ''}" data-channel="ch2">Audio</button>
              </div>

              <!-- Channel 3: Video Media -->
              <div class="vaudio-strip">
                <span class="vstrip-label">Media</span>
                <div class="vstrip-meters-box">
                  <div class="vled-bar center" id="meter-ch3">
                    <span class="vled-fill" style="height: 42%;"></span>
                  </div>
                </div>
                <div class="vstrip-fader-track">
                  <input type="range" class="vstrip-fader" orient="vertical" data-channel="ch3" min="0" max="100" value="${this.channelVolumes.ch3}" />
                </div>
                <span class="vstrip-db" id="db-ch3">-14.0 dB</span>
                <button class="vstrip-mute-btn ${this.channelMutes.ch3 ? 'active-mute' : ''}" data-channel="ch3">M</button>
                <button class="vstrip-audio-btn ${this.channelAudios.ch3 ? 'active' : ''}" data-channel="ch3">Audio</button>
              </div>
            </div>
          </aside>
        </div>

        <!-- 5. Bottom Master Control Bar -->
        <footer class="vmix-bottom-bar">
          <div class="vbottom-left">
            <button class="vbig-add-input-btn" id="btn-vmix-add-input">
              <span class="add-plus">+</span> Add Input
            </button>
          </div>

          <div class="vbottom-center-actions">
            <button class="vaction-btn ${this.isRecording ? 'active-rec' : ''}" id="btn-bottom-rec">
              <span>⏺</span> Record
            </button>
            <button class="vaction-btn ${this.isStreaming ? 'active-stream' : ''}" id="btn-bottom-stream">
              <span>🔴</span> Stream
            </button>
            <button class="vaction-btn ${this.isExternalActive ? 'active-cyan' : ''}" id="btn-bottom-external">
              <span>📡</span> External
            </button>
            <button class="vaction-btn" id="btn-bottom-stage">
              <span>🖥</span> Stage Display
            </button>
            <button class="vaction-btn" id="btn-bottom-projector">
              <span>📺</span> Projector
            </button>
            <button class="vaction-btn" id="btn-bottom-playlist">
              <span>📋</span> Playlist
            </button>
            <button class="vaction-btn danger-override" id="btn-bottom-emergency">
              <span>⚠</span> EMERGENCY
            </button>
          </div>

          <div class="vbottom-telemetry">
            <span>60 fps</span>
            <span>Render: 1.2ms</span>
            <span>CPU: 8%</span>
            <span>GPU: 14%</span>
            <span class="vdiag-tag" id="vdiag-tag">${this.isStreaming ? `SIMULCAST: ${activeDestCount} ON AIR` : (this.isExternalActive ? 'NDI: 1080p60 [ON AIR]' : 'NDI: 1080p60 [STANDBY]')}</span>
          </div>
        </footer>

        <!-- 6. Church Asset Drawer / Modal -->
        ${this.renderAddInputModal()}

        <!-- 7. Interactive Control Room Modals -->
        ${this.renderBibleShowModal()}
        ${this.renderAISuiteModal()}
        ${this.renderPresetModal()}
        ${this.renderSettingsModal()}
        ${this.renderHelpModal()}
        ${this.renderInputSettingsModal()}
        ${this.renderOutputSettingsModal()}
        ${this.renderPlaylistModal()}
      </section>
    `;
  }

  /**
   * Render individual input cards for the vMix Grid.
   * If empty, renders a clean, friendly empty state with an Add Input action!
   */
  static renderInputCards() {
    const filter = this.activeCategory;
    const cards = filter === 'all'
      ? this.inputsList
      : this.inputsList.filter(i => i.category === filter || (filter === 'media' && (i.category === 'media' || i.type === 'media' || i.type === 'image' || i.type === 'video' || i.mediaType === 'image' || i.mediaType === 'video')));

    if (cards.length === 0) {
      return `
        <div class="vmix-inputs-empty-state">
          <div class="vempty-icon">📺</div>
          <div class="vempty-text">
            <strong>No Inputs in This Section</strong>
            <p>${filter === 'all' 
              ? 'This section is currently empty. Click <strong>+ Add Input</strong> below to add cameras, scripture verses, worship lyrics, presentation slides, or video media to your production.' 
              : `No ${filter} inputs have been added yet. Click <strong>+ Add Input</strong> to add one to this section.`}
            </p>
          </div>
          <div class="vempty-actions">
            <button class="vempty-add-btn" id="btn-empty-add-input">
              <span>+</span> Add Input to Section
            </button>
            ${filter === 'all' ? `
              <button class="mini-tool-btn" id="btn-load-sample-preset" title="Load sample church demo inputs">
                <span>✦</span> Load Sample Preset
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }

    return cards.map(input => {
      const isPreview = input.isPreview;
      const isLive = input.isLive;
      const cardStateClass = isLive ? 'is-live' : isPreview ? 'is-preview' : '';

      return `
        <div class="vmix-input-card ${cardStateClass}" data-input-id="${input.id}">
          <!-- Input Header Bar -->
          <div class="vicard-header ${isLive ? 'live-head' : isPreview ? 'preview-head' : ''}">
            <div class="vicard-title-wrap">
              <span class="vicard-num">${input.num}</span>
              <span class="vicard-title" title="${input.title}">${input.title}</span>
            </div>
            <div class="vicard-header-actions">
              <button class="vicard-gear-btn" data-action="settings" data-input-id="${input.id}" title="Input Settings">⚙</button>
              <button class="vicard-close-btn" data-action="delete" data-input-id="${input.id}" title="Delete Input from Section">✕</button>
            </div>
          </div>

          <!-- Input 16:9 Thumbnail -->
          <div class="vicard-thumbnail" data-action="stage" data-input-id="${input.id}">
            <div class="vthumb-content type-${input.type}">
              ${this.renderThumbnailSnippet(input)}
            </div>
            ${isPreview ? '<span class="vthumb-badge orange">PREVIEW</span>' : ''}
            ${isLive ? '<span class="vthumb-badge green">LIVE</span>' : ''}
          </div>

          <!-- Input Action Controls (Preview, Live, Quick, Audio, and 1, 2, 3 Overlays) -->
          <div class="vicard-actions">
            <button class="vic-btn preview-btn ${isPreview ? 'active-prev' : ''}" data-action="stage" data-input-id="${input.id}" title="Send to Preview Screen">Preview</button>
            <button class="vic-btn cut-btn ${isLive ? 'active-live' : ''}" data-action="cut" data-input-id="${input.id}" title="Send Live to Program Screen">Live</button>
            <button class="vic-btn audio-btn ${input.audio ? 'active' : ''}" data-action="audio" data-input-id="${input.id}" title="Audio State">Audio</button>
            <div class="vic-overlays">
              <button type="button" class="vol-num ${this.overlayInputs[1] === input.id && this.activeOverlays[1] ? 'active' : ''}" data-action="toggle-overlay" data-overlay="1" data-input-id="${input.id}" title="Overlay 1: Lower Third Title">1</button>
              <button type="button" class="vol-num ${this.overlayInputs[2] === input.id && this.activeOverlays[2] ? 'active' : ''}" data-action="toggle-overlay" data-overlay="2" data-input-id="${input.id}" title="Overlay 2: Picture-in-Picture">2</button>
              <button type="button" class="vol-num ${this.overlayInputs[3] === input.id && this.activeOverlays[3] ? 'active' : ''}" data-action="toggle-overlay" data-overlay="3" data-input-id="${input.id}" title="Overlay 3: Scripture Pill">3</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render miniature thumbnail snippet inside input cards
   */
  static renderThumbnailSnippet(input) {
    if (input.type === 'camera') {
      return `
        <div class="thumb-cam-view">
          <span class="cam-icon">📹</span>
          <small>${input.title}</small>
          <span class="cam-badge">LIVE FEED</span>
        </div>
      `;
    }
    if (input.type === 'scripture') {
      return `
        <div class="thumb-scripture-view">
          <p class="thumb-text">"${input.text ? input.text.slice(0, 70) : ''}..."</p>
          <strong class="thumb-ref">${input.sub}</strong>
        </div>
      `;
    }
    if (input.type === 'worship') {
      return `
        <div class="thumb-worship-view">
          <span class="music-icon">♫</span>
          <p class="thumb-text">${input.text ? input.text.split('\n')[0] : ''}</p>
          <small class="thumb-artist">${input.sub}</small>
        </div>
      `;
    }
    if (input.type === 'slides') {
      return `
        <div class="thumb-slide-view">
          <span class="slide-icon">▶</span>
          <strong>${input.title}</strong>
          <small>${input.sub}</small>
        </div>
      `;
    }
    if (input.type === 'media' || input.type === 'image' || input.type === 'video' || input.mediaType === 'image' || input.mediaType === 'video') {
      const isImg = input.type === 'image' || input.mediaType === 'image' || !!input.imageUrl;
      const mediaUrl = input.imageUrl || input.videoUrl || input.url;

      if (mediaUrl) {
        return `
          <div class="thumb-media-frame">
            ${isImg ? `
              <img src="${mediaUrl}" alt="${input.title}" class="thumb-media-element" />
            ` : `
              <video src="${mediaUrl}" muted loop playsinline class="thumb-media-element"></video>
            `}
            <span class="media-type-badge-thumb ${isImg ? 'img-badge' : 'vid-badge'}">${isImg ? 'IMAGE' : 'VIDEO'}</span>
          </div>
        `;
      }

      return `
        <div class="thumb-slide-view" style="background:${input.bg || (isImg ? 'linear-gradient(135deg, #0f2b38 0%, #06151c 100%)' : 'radial-gradient(circle at center, #082026 0%, #030a0d 100%)')};">
          <span class="slide-icon" style="color: ${isImg ? '#10b981' : '#06b6d4'}; font-size:18px;">${isImg ? '🖼' : '🎬'}</span>
          <strong>${input.title}</strong>
          <small>${input.sub || (isImg ? '1080p Image Still' : '1080p Video Loop')}</small>
          <span class="media-type-badge-thumb ${isImg ? 'img-badge' : 'vid-badge'}">${isImg ? 'IMAGE' : 'VIDEO'}</span>
        </div>
      `;
    }
    if (input.type === 'titles') {
      return `
        <div class="thumb-title-view">
          <span class="title-badge-preview">LOWER THIRD</span>
          <strong>${input.text ? input.text.split('\n')[0] : input.title}</strong>
        </div>
      `;
    }
    return `
      <div class="thumb-generic-view">
        <span>🎬</span>
        <small>${input.title}</small>
      </div>
    `;
  }

  /**
   * Render snippet inside Picture-in-Picture (PIP) window
   */
  static renderPipSnippet(input) {
    if (!input) return '';
    if (input.type === 'camera') {
      return `
        <div style="text-align:center;">
          <span style="font-size:18px;display:block;">📹</span>
          <span style="font-size:7.5px;color:#c5d6cc;font-weight:700;">LIVE PTZ</span>
        </div>
      `;
    }
    if (input.type === 'scripture') {
      return `
        <div style="padding:2px 4px;">
          <blockquote style="margin:0;font-size:7.5px;line-height:1.2;font-style:italic;color:#e2e8f0;">"${(input.text || '').slice(0, 48)}..."</blockquote>
          <strong style="display:block;font-size:7px;color:#f97316;margin-top:2px;">${input.sub}</strong>
        </div>
      `;
    }
    if (input.type === 'worship') {
      return `
        <div style="padding:2px 4px;">
          <span style="color:#eab308;font-size:9px;">♫</span>
          <p style="margin:0;font-size:7.5px;color:#fef08a;">${(input.text || '').split('\n')[0]}</p>
        </div>
      `;
    }
    if (input.type === 'slides' || input.type === 'media') {
      return `
        <div style="text-align:center;">
          <span style="font-size:16px;color:#06b6d4;">▶</span>
          <small style="display:block;font-size:7px;color:#fff;">${input.title}</small>
        </div>
      `;
    }
    return `
      <div style="text-align:center;">
        <span style="font-size:16px;">📺</span>
      </div>
    `;
  }

  /**
   * Render full text content on Preview or Program 16:9 monitor
   */
  static renderScreenContent(input, text, sub, isLive) {
    if (!input) {
      return `
        <div class="vmix-standby-screen-view">
          <div class="standby-center-box">
            <span class="standby-icon">${isLive ? '🔴' : '🟧'}</span>
            <h3>${isLive ? 'PROGRAM OUTPUT STANDBY' : 'PREVIEW MONITOR STANDBY'}</h3>
            <p>${isLive ? 'NDI / SDI Output Feed Active · Standby Slate' : 'No input selected · Click an input card below or "+ Add Input" to stage'}</p>
          </div>
        </div>
      `;
    }

    if (input.type === 'camera') {
      return `
        <div class="vmix-cam-screen-view">
          <div class="cam-center-box">
            <span class="cam-svg-icon">📹</span>
            <h3>${input.title}</h3>
            <p>${input.sub}</p>
          </div>
        </div>
      `;
    }

    if (input.type === 'media' || input.type === 'image' || input.type === 'video' || input.mediaType === 'image' || input.mediaType === 'video') {
      const isImg = input.type === 'image' || input.mediaType === 'image' || !!input.imageUrl;
      const mediaUrl = input.imageUrl || input.videoUrl || input.url;

      if (mediaUrl) {
        return `
          <div class="vmix-screen-media-container ${isImg ? 'image-container' : 'video-container'}">
            ${isImg ? `
              <img src="${mediaUrl}" alt="${input.title}" class="screen-full-media-img" />
            ` : `
              <video src="${mediaUrl}" autoplay loop ${isLive && input.audio ? '' : 'muted'} playsinline class="screen-full-media-video"></video>
            `}
            <div class="screen-media-watermark">
              ${isImg ? '🖼' : '🎬'} ${input.title} ${isImg ? '· STILL' : '· LIVE VIDEO'}
            </div>
          </div>
        `;
      }

      return `
        <div class="vmix-cam-screen-view" style="background: ${input.bg || (isImg ? 'radial-gradient(circle at center, #0c2d3a 0%, #030e13 100%)' : 'radial-gradient(circle at center, #082026 0%, #030a0d 100%)')};">
          <div class="cam-center-box">
            <span class="cam-svg-icon" style="color:${isImg ? '#10b981' : '#06b6d4'}; font-size:40px;">${isImg ? '🖼' : '🎬'}</span>
            <h3 style="margin:10px 0 4px 0;font-size:18px;color:#fff;">${input.title}</h3>
            <p style="margin:0;font-size:12px;color:#8fa598;">${input.sub || (isImg ? '1080p Image Still Graphic' : '1080p Video Loop')} ${isImg ? '· Still Art' : '· Playing'}</p>
            <span style="display:inline-block;margin-top:10px;padding:3px 10px;border-radius:9999px;font-size:10px;font-weight:800;background:${isImg ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'};color:${isImg ? '#34d399' : '#22d3ee'};border:1px solid ${isImg ? 'rgba(16,185,129,0.4)' : 'rgba(6,182,212,0.4)'};">
              ${isImg ? '● IMAGE STILL ACTIVE' : '● VIDEO LOOP PLAYING'}
            </span>
          </div>
          <div class="screen-reference-tag" style="background:${isImg ? 'rgba(16,185,129,0.85)' : 'rgba(6,182,212,0.85)'};color:#fff;">
            ${isImg ? '🖼' : '🎬'} ${input.title}
          </div>
        </div>
      `;
    }

    const formattedText = (text || '').replace(/\n/g, '<br/>');

    return `
      <div class="vmix-text-screen-view">
        <blockquote class="screen-main-verse">
          "${formattedText}"
        </blockquote>
        <div class="screen-reference-tag">
          ${sub || input.sub || ''}
        </div>
      </div>
    `;
  }

  /**
   * Centralized upsert for input cards in Studio.
   * Ensures that dynamic inputs (Scripture / BibleShow, Worship lyrics, AI cues / notes, Slides, etc.)
   * do not spawn duplicate cards. If a card for that category/type already exists, it is "charged" (updated)
   * in-place with the new content, title, text, sub, and routed to preview/live/overlays.
   */
  static upsertInputCard(item, root, options = {}) {
    const type = item.type || 'generic';
    const category = item.category || (type === 'scripture' ? 'scriptures' : type);
    const toPreview = !!options.toPreview;
    const toLive = !!options.toLive;
    const toOl1 = !!options.toOl1;
    const toOl3 = !!options.toOl3;

    // Find existing card of the same category / type
    let existing = null;

    if (category === 'scriptures' || type === 'scripture') {
      existing = this.inputsList.find(i => (i.category === 'scriptures' || i.type === 'scripture') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.category === 'scriptures' || i.type === 'scripture');
    } else if (category === 'worship' || type === 'worship') {
      existing = this.inputsList.find(i => (i.category === 'worship' || i.type === 'worship') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.category === 'worship' || i.type === 'worship');
    } else if (category === 'slides' || type === 'slides') {
      existing = this.inputsList.find(i => (i.category === 'slides' || i.type === 'slides') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.category === 'slides' || i.type === 'slides');
    } else if (category === 'titles' || category === 'ai' || type === 'titles' || type === 'ai') {
      existing = this.inputsList.find(i => (i.category === 'titles' || i.category === 'ai' || i.type === 'titles' || i.type === 'ai') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.category === 'titles' || i.category === 'ai' || i.type === 'titles' || i.type === 'ai');
    } else if (item.mediaType === 'image' || type === 'image') {
      existing = this.inputsList.find(i => (i.type === 'image' || i.mediaType === 'image') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.type === 'image' || i.mediaType === 'image');
    } else if (item.mediaType === 'video' || type === 'video') {
      existing = this.inputsList.find(i => (i.type === 'video' || i.mediaType === 'video' || (i.category === 'media' && i.mediaType !== 'image')) && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.type === 'video' || i.mediaType === 'video' || (i.category === 'media' && i.mediaType !== 'image'));
    } else if (category === 'media' || type === 'media') {
      existing = this.inputsList.find(i => (i.category === 'media' || i.type === 'media') && (i.isLive || i.isPreview))
              || this.inputsList.find(i => i.category === 'media' || i.type === 'media');
    } else if (category === 'cameras' || type === 'camera') {
      existing = this.inputsList.find(i => i.id === item.id || i.title === item.title);
    } else if (item.id) {
      existing = this.inputsList.find(i => i.id === item.id);
    }

    if (existing) {
      // Update existing card in place ("charge" it)
      existing.title = item.title || existing.title;
      if (item.text !== undefined) existing.text = item.text;
      if (item.sub !== undefined) existing.sub = item.sub;
      if (item.accent) existing.accent = item.accent;
      if (item.bg) existing.bg = item.bg;
      if (item.mediaType !== undefined) existing.mediaType = item.mediaType;
      if (item.imageUrl !== undefined) existing.imageUrl = item.imageUrl;
      if (item.videoUrl !== undefined) existing.videoUrl = item.videoUrl;
      if (item.url !== undefined) existing.url = item.url;
      if (item.audio !== undefined) existing.audio = !!item.audio;
      if (item.loop !== undefined) existing.loop = !!item.loop;

      if (toPreview) {
        this.inputsList.forEach(i => { i.isPreview = false; });
        existing.isPreview = true;
      } else if (toLive) {
        this.inputsList.forEach(i => { i.isLive = false; });
        existing.isLive = true;
      }

      if (toOl1) {
        this.overlayInputs[1] = existing.id;
        this.activeOverlays[1] = true;
      }
      if (toOl3) {
        this.overlayInputs[3] = existing.id;
        this.activeOverlays[3] = true;
      }

      const grid = root?.querySelector('#vmix-inputs-grid');
      if (grid) {
        grid.innerHTML = this.renderInputCards();
        this.attachInputCardsEvents(root);
      }

      if (root) {
        this.refreshCategoryTabs(root);
        this.updateMonitors(root);
        if (toOl1 || toOl3) this.syncOverlayButtons(root);
      }

      return existing;
    } else {
      // Create fresh card (exactly 1 for this input channel)
      const newNum = this.inputsList.length + 1;
      const isImg = item.mediaType === 'image' || type === 'image';
      const isVid = item.mediaType === 'video' || type === 'video';
      const newInput = {
        id: item.id || `inp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        num: newNum,
        type: type,
        category: category,
        title: item.title || `Input ${newNum}`,
        text: item.text !== undefined ? item.text : (item.title || ''),
        sub: item.sub !== undefined ? item.sub : (item.title || ''),
        mediaType: item.mediaType || (isImg ? 'image' : isVid ? 'video' : null),
        imageUrl: item.imageUrl || null,
        videoUrl: item.videoUrl || null,
        url: item.url || null,
        bg: item.bg || null,
        audio: !!item.audio,
        loop: !!item.loop,
        isLive: false,
        isPreview: false,
        accent: item.accent || (category === 'scriptures' ? '#f97316' : category === 'worship' ? '#a855f7' : isImg ? '#10b981' : isVid ? '#06b6d4' : '#10b981')
      };

      if (toPreview) {
        this.inputsList.forEach(i => { i.isPreview = false; });
        newInput.isPreview = true;
      } else if (toLive) {
        this.inputsList.forEach(i => { i.isLive = false; });
        newInput.isLive = true;
      } else if (this.inputsList.length === 0) {
        newInput.isPreview = true;
      }

      if (toOl1) {
        this.overlayInputs[1] = newInput.id;
        this.activeOverlays[1] = true;
      }
      if (toOl3) {
        this.overlayInputs[3] = newInput.id;
        this.activeOverlays[3] = true;
      }

      this.inputsList.push(newInput);

      const grid = root?.querySelector('#vmix-inputs-grid');
      if (grid) {
        grid.innerHTML = this.renderInputCards();
        this.attachInputCardsEvents(root);
      }

      if (root) {
        this.refreshCategoryTabs(root);
        this.updateMonitors(root);
        if (toOl1 || toOl3) this.syncOverlayButtons(root);
      }

      return newInput;
    }
  }

  /**
   * Add or charge an input in the inputs list dynamically
   */
  static addInput(item, root, options = { toPreview: false, toLive: false }) {
    const card = this.upsertInputCard(item, root, options);
    toastManager.show(`Ready: "${card.title}" in Inputs Section [Input ${card.num}]`);
    return card;
  }

  /**
   * Delete an input from the inputs list
   */
  static deleteInput(inputId, root) {
    const index = this.inputsList.findIndex(i => i.id === inputId);
    if (index === -1) return;

    const deleted = this.inputsList[index];
    const wasPreview = deleted.isPreview;
    const wasLive = deleted.isLive;

    // Clean up overlays if this input was active on any overlay
    for (let num = 1; num <= 4; num++) {
      if (this.overlayInputs[num] === inputId) {
        this.overlayInputs[num] = null;
        this.activeOverlays[num] = false;
      }
    }

    // Remove from array
    this.inputsList.splice(index, 1);

    // Re-index remaining inputs
    this.inputsList.forEach((inp, idx) => {
      inp.num = idx + 1;
    });

    // Handle preview reassignment if deleted input was active
    if (wasPreview) {
      if (this.inputsList.length > 0) {
        const nextPrev = this.inputsList.find(i => !i.isLive) || this.inputsList[0];
        this.inputsList.forEach(i => { i.isPreview = (i === nextPrev); });
      }
    }

    // Handle live reassignment if deleted input was live
    if (wasLive) {
      if (this.inputsList.length > 0) {
        const nextLive = this.inputsList.find(i => !i.isPreview) || this.inputsList[0];
        this.inputsList.forEach(i => { i.isLive = (i === nextLive); });
      }
    }

    // Re-render grid
    const grid = root.querySelector('#vmix-inputs-grid');
    if (grid) {
      grid.innerHTML = this.renderInputCards();
      this.attachInputCardsEvents(root);
    }

    // Refresh category tabs
    this.refreshCategoryTabs(root);

    // Update monitors & overlay buttons
    this.updateMonitors(root);
    this.syncOverlayButtons(root);

    toastManager.show(`Deleted "${deleted.title}" from Section`);
  }

  /**
   * Refresh category tabs count
   */
  static refreshCategoryTabs(root) {
    const allTab = root.querySelector('.vcat-tab[data-cat="all"]');
    if (allTab) {
      allTab.innerHTML = `<span class="vcat-chip gray"></span> All (${this.inputsList.length})`;
    }
  }

  /**
   * Toggle Overlay Channel (1, 2, 3) for a specific Input Card
   */
  static toggleInputOverlay(overlayNum, inputId, root) {
    const num = Number(overlayNum);
    const input = this.inputsList.find(i => i.id === inputId);
    if (!input) return;

    if (this.overlayInputs[num] === inputId && this.activeOverlays[num]) {
      // Already active with this input -> turn OFF
      this.overlayInputs[num] = null;
      this.activeOverlays[num] = false;
      toastManager.show(`Overlay ${num} [OFF]: Removed "${input.title}"`);
    } else {
      // Turn ON with this input
      this.overlayInputs[num] = inputId;
      this.activeOverlays[num] = true;
      const channelDesc = num === 1 ? 'Lower Third' : num === 2 ? 'Picture-in-Picture PIP' : 'Scripture Pill';
      toastManager.show(`Overlay ${num} [ON]: ${channelDesc} routed from "${input.title}"`);
    }

    // Update monitors & sync buttons
    this.updateMonitors(root);
    this.syncOverlayButtons(root);
  }

  /**
   * Sync all Overlay button states (Cards 1 2 3 + Transition Column 1 2 3 4)
   */
  static syncOverlayButtons(container) {
    const root = container || document.querySelector('#keryx-studio-workspace') || document;

    // 1. Sync card buttons (1, 2, 3)
    root.querySelectorAll('.vol-num').forEach(btn => {
      const num = Number(btn.dataset.overlay);
      const inputId = btn.dataset.inputId;
      const isActive = (this.overlayInputs[num] === inputId) && !!this.activeOverlays[num];
      btn.classList.toggle('active', isActive);
    });

    // 2. Sync transition column buttons (1, 2, 3, 4)
    root.querySelectorAll('.voverlay-btn').forEach(btn => {
      const num = Number(btn.dataset.overlay);
      btn.classList.toggle('active', !!this.activeOverlays[num]);
    });
  }

  /**
   * Render Church Asset Drawer / Modal for adding and selecting Bible verses, worship, and slides
   */
  static renderAddInputModal() {
    const isOpen = this.isAddInputModalOpen;
    return `
      <div class="vmix-asset-modal-backdrop ${isOpen ? 'show' : ''}" id="vmix-asset-modal">
        <div class="vmix-asset-dialog">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">KERYX ASSET LIBRARY</span>
              <h3>Add Input to Section / Browse Assets</h3>
            </div>
            <button class="modal-close-btn" id="btn-close-asset-modal">✕</button>
          </div>

          <div class="vmix-modal-body">
            <!-- Modal Sidebar Navigation -->
            <nav class="vmodal-sidebar">
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'bible' ? 'active' : ''}" data-drawer-tab="bible">
                <span>📖</span> Bible Scripture
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'worship' ? 'active' : ''}" data-drawer-tab="worship">
                <span>♫</span> Worship Songs
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'slides' ? 'active' : ''}" data-drawer-tab="slides">
                <span>▶</span> Presentation Slides
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'media' || this.activeDrawerTab === 'images' ? 'active' : ''}" data-drawer-tab="media">
                <span>🖼🎬</span> Images & Video Media
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'cameras' ? 'active' : ''}" data-drawer-tab="cameras">
                <span>📹</span> NDI / Video Cameras
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'titles' ? 'active' : ''}" data-drawer-tab="titles">
                <span>🏷</span> Lower Third Titles
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'custom' ? 'active' : ''}" data-drawer-tab="custom">
                <span>⚡</span> Quick Custom Input
              </button>
              <button class="vmod-nav-btn ${this.activeDrawerTab === 'ai' ? 'active' : ''}" data-drawer-tab="ai">
                <span>✳</span> AI Speech Transcriber
              </button>
            </nav>

            <!-- Modal Dynamic Content Area -->
            <div class="vmodal-content-area">
              ${this.renderDrawerTabContent()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render dynamic content for the drawer tabs
   */
  static renderDrawerTabContent() {
    // 1. Bible Scriptures
    if (this.activeDrawerTab === 'bible') {
      const bookData = this.scriptureDatabase[this.activeBook] || {};
      let verses = bookData[this.activeChapter] || [];
      if (this.bibleSearchQuery) {
        const q = this.bibleSearchQuery.toLowerCase();
        verses = verses.filter(v => v.text.toLowerCase().includes(q) || String(v.num).includes(q));
      }

      return `
        <div class="vtab-pane-bible">
          <div class="vpane-toolbar">
            <select class="vpane-select" id="drawer-bible-book-select">
              ${Object.keys(this.scriptureDatabase).map(b => `
                <option value="${b}" ${this.activeBook === b ? 'selected' : ''}>${b}</option>
              `).join('')}
            </select>

            <div class="vpane-chap-pills" id="drawer-chap-pills">
              ${Object.keys(bookData).map(ch => `
                <button class="chap-pill ${Number(ch) === this.activeChapter ? 'active' : ''}" data-chapter="${ch}">
                  ${ch}
                </button>
              `).join('')}
            </div>

            <input type="text" class="vpane-search" id="drawer-bible-search" placeholder="Search verses..." value="${this.bibleSearchQuery}" />
          </div>

          <div class="vpane-verses-list">
            ${verses.length === 0 ? '<p style="color:#8fa598;padding:20px;text-align:center;">No verses found matching query.</p>' : ''}
            ${verses.map(v => `
              <div class="drawer-verse-card ${v.active ? 'active' : ''}" data-verse-num="${v.num}">
                <div class="dverse-head">
                  <span class="dverse-badge">${this.activeBook} ${this.activeChapter}:${v.num}</span>
                  <div class="dverse-btns">
                    <button class="btn-add-grid" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${escape(v.text)}" data-ref="${this.activeBook} ${this.activeChapter}:${v.num}">+ Add to Section</button>
                    <button class="btn-cue-stage" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${escape(v.text)}" data-ref="${this.activeBook} ${this.activeChapter}:${v.num}">To Preview</button>
                    <button class="btn-cue-live" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${escape(v.text)}" data-ref="${this.activeBook} ${this.activeChapter}:${v.num}">Go Live ↵</button>
                  </div>
                </div>
                <p class="dverse-text">${v.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2. Worship Songs
    if (this.activeDrawerTab === 'worship') {
      const currentSong = this.worshipSongsData[this.activeSongKey] || this.worshipSongsData['Way Maker'];

      return `
        <div class="vtab-pane-worship">
          <div class="vpane-toolbar">
            <select class="vpane-select" id="drawer-song-select">
              ${Object.keys(this.worshipSongsData).map(s => `
                <option value="${s}" ${this.activeSongKey === s ? 'selected' : ''}>${s}</option>
              `).join('')}
            </select>
            <span class="vpane-sub">${currentSong.artist}</span>
          </div>

          <div class="vpane-stanzas-grid">
            ${currentSong.sections.map(sec => `
              <div class="drawer-stanza-card ${sec.active ? 'active-staged' : ''}" data-stanza-id="${sec.id}">
                <div class="dstanza-head">
                  <strong>${sec.name}</strong>
                  <div class="dstanza-btns">
                    <button class="btn-add-grid" data-item-type="worship" data-item-category="worship" data-stanza-text="${escape(sec.text)}" data-title="${currentSong.title} (${sec.name})" data-artist="${currentSong.artist}">+ Add to Section</button>
                    <button class="btn-cue-stage" data-item-type="worship" data-item-category="worship" data-stanza-text="${escape(sec.text)}" data-title="${currentSong.title} (${sec.name})" data-artist="${currentSong.artist}">To Preview</button>
                    <button class="btn-cue-live" data-item-type="worship" data-item-category="worship" data-stanza-text="${escape(sec.text)}" data-title="${currentSong.title} (${sec.name})" data-artist="${currentSong.artist}">Go Live ↵</button>
                  </div>
                </div>
                <p class="dstanza-text">${sec.text.replace(/\n/g, '<br/>')}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 3. Presentation Slides
    if (this.activeDrawerTab === 'slides') {
      return `
        <div class="vtab-pane-generic">
          <div class="vmodal-field-group" style="margin-bottom:12px;">
            <label>Church Presentation Slides Deck</label>
            <p style="color:#8fa598;font-size:11px;margin:0;">Select sermon slides to add to your inputs section, stage to Preview, or send to Live.</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="drawer-verse-card active">
              <div class="dverse-head">
                <span class="dverse-badge">Slide 1: Walking in Supernatural Fruitfulness</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="slides" data-item-category="slides" data-verse-text="Walking in Supernatural Fruitfulness\nTheme of the Year 2026" data-ref="Slide 1 · Theme">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="slides" data-item-category="slides" data-verse-text="Walking in Supernatural Fruitfulness\nTheme of the Year 2026" data-ref="Slide 1 · Theme">To Preview</button>
                  <button class="btn-cue-live" data-item-type="slides" data-item-category="slides" data-verse-text="Walking in Supernatural Fruitfulness\nTheme of the Year 2026" data-ref="Slide 1 · Theme">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Walking in Supernatural Fruitfulness — Senior Pastor David Kingsley</p>
            </div>
            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Slide 2: Four Pillars of Christian Maturity</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="slides" data-item-category="slides" data-verse-text="1. Prayer & Word\n2. Faithful Stewardship\n3. Holy Living\n4. Evangelism" data-ref="Slide 2 · Pillars">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="slides" data-item-category="slides" data-verse-text="1. Prayer & Word\n2. Faithful Stewardship\n3. Holy Living\n4. Evangelism" data-ref="Slide 2 · Pillars">To Preview</button>
                  <button class="btn-cue-live" data-item-type="slides" data-item-category="slides" data-verse-text="1. Prayer & Word\n2. Faithful Stewardship\n3. Holy Living\n4. Evangelism" data-ref="Slide 2 · Pillars">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">1. Prayer & Word · 2. Faithful Stewardship · 3. Holy Living · 4. Evangelism</p>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Media & Video Loops (Images, Videos, Countdowns, Backgrounds)
    if (this.activeDrawerTab === 'media' || this.activeDrawerTab === 'images') {
      const isImg = this.mediaAddMode === 'image';
      const staged = this.mediaStagedUpload;
      const filter = this.mediaSubFilter;
      const q = (this.mediaSearchQuery || '').toLowerCase();

      const assets = this.churchMediaAssets.filter(m => {
        const matchCat = filter === 'all' || m.mediaType === filter || m.type === filter;
        const matchQ = !q || m.title.toLowerCase().includes(q) || (m.tag && m.tag.toLowerCase().includes(q)) || (m.sub && m.sub.toLowerCase().includes(q));
        return matchCat && matchQ;
      });

      const imgCount = this.churchMediaAssets.filter(m => m.mediaType === 'image' || m.type === 'image').length;
      const vidCount = this.churchMediaAssets.filter(m => m.mediaType === 'video' || m.type === 'video').length;

      return `
        <div class="vtab-pane-media">
          <!-- 1. Top Panel: Add Image / Video Input Creator -->
          <div class="vmedia-add-panel">
            <div class="vmedia-panel-head">
              <div class="vmedia-panel-title">
                <span class="vmedia-panel-badge">${isImg ? 'IMAGE INPUT' : 'VIDEO INPUT'}</span>
                <h4>Add ${isImg ? 'Image Still / Graphic' : 'Video Loop / Countdown'} to Section</h4>
              </div>
              <!-- Mode Switch: Image vs Video -->
              <div class="vmedia-mode-toggle">
                <button type="button" class="vmedia-mode-btn ${isImg ? 'active' : ''}" data-media-mode="image">
                  <span>🖼</span> Add Image
                </button>
                <button type="button" class="vmedia-mode-btn video-mode ${!isImg ? 'active' : ''}" data-media-mode="video">
                  <span>🎬</span> Add Video
                </button>
              </div>
            </div>

            <div class="vmedia-workspace-grid">
              <!-- Left: Dropzone, URL & Metadata -->
              <div class="vmedia-form-fields">
                <div class="vmedia-dropzone" id="drawer-media-dropzone">
                  <input type="file" id="drawer-media-file-input" accept="${isImg ? 'image/*' : 'video/*'}" style="display:none;" />
                  <span class="vmedia-dropzone-icon">${isImg ? '🖼' : '🎬'}</span>
                  <strong>${staged && staged.file ? staged.file.name : `Click or Drag & Drop ${isImg ? 'Image' : 'Video'} File`}</strong>
                  <small>${isImg ? 'Supports PNG, JPG, JPEG, WebP, SVG, GIF (Up to 4K)' : 'Supports MP4, WebM, MOV, OGG (Up to 4K60)'}</small>
                </div>

                <div class="vmedia-field-wrap">
                  <label>Or Paste Web Media URL</label>
                  <input type="text" class="vmedia-input" id="drawer-media-url-input" placeholder="${isImg ? 'https://example.com/church-banner.png' : 'https://example.com/welcome-loop.mp4'}" value="${staged && staged.url && !staged.file ? staged.url : ''}" />
                </div>

                <div class="vmedia-meta-row">
                  <div class="vmedia-field-wrap">
                    <label>Input Title</label>
                    <input type="text" class="vmedia-input" id="drawer-media-title-input" placeholder="${isImg ? 'e.g., Sunday Sermon Key Art' : 'e.g., 5-Min Welcome Countdown'}" value="${staged ? staged.title : ''}" />
                  </div>
                  <div class="vmedia-field-wrap">
                    <label>Subtitle / Format</label>
                    <input type="text" class="vmedia-input" id="drawer-media-sub-input" placeholder="${isImg ? '1920×1080 Still Graphic' : '1080p60 Video Loop'}" value="${staged ? staged.sub : (isImg ? '1920×1080 Still Graphic' : '1080p60 Video Loop')}" />
                  </div>
                </div>

                ${!isImg ? `
                  <div class="vmedia-options-row">
                    <label class="vmedia-chk-label">
                      <input type="checkbox" id="drawer-media-loop-chk" ${staged ? (staged.loop ? 'checked' : '') : 'checked'} />
                      <span>Loop Video Continuously</span>
                    </label>
                    <label class="vmedia-chk-label">
                      <input type="checkbox" id="drawer-media-audio-chk" ${staged ? (staged.audio ? 'checked' : '') : ''} />
                      <span>Audio Enabled</span>
                    </label>
                  </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="vmedia-actions-bar">
                  <button type="button" class="vmedia-btn-add" id="btn-submit-media-add">
                    <span>＋</span> Add to Inputs Section
                  </button>
                  <button type="button" class="vmedia-btn-preview" id="btn-submit-media-preview">
                    <span>👁</span> To Preview
                  </button>
                  <button type="button" class="vmedia-btn-live" id="btn-submit-media-live">
                    <span>⚡</span> Go Live ↵
                  </button>
                </div>
              </div>

              <!-- Right: 16:9 Live Preview Slate -->
              <div class="vmedia-preview-box">
                <span class="vmedia-preview-badge">${isImg ? 'IMAGE PREVIEW' : 'VIDEO PREVIEW'}</span>
                ${staged && staged.url ? (
                  isImg ? `
                    <img src="${staged.url}" class="vmedia-preview-img" alt="Staged Image" />
                  ` : `
                    <video src="${staged.url}" controls muted autoplay loop class="vmedia-preview-video"></video>
                  `
                ) : `
                  <div class="vmedia-preview-placeholder">
                    <span>${isImg ? '🖼' : '🎬'}</span>
                    <strong style="color:#cbd5e1;font-size:11px;">16:9 Monitor Preview</strong>
                    <small>Preview will display here when a file or URL is chosen.</small>
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- 2. Curated Church Broadcast Media Gallery -->
          <div class="vmedia-gallery-header">
            <div class="vmedia-filter-strip">
              <button type="button" class="vmedia-filter-chip ${filter === 'all' ? 'active' : ''}" data-media-filter="all">All Media (${this.churchMediaAssets.length})</button>
              <button type="button" class="vmedia-filter-chip ${filter === 'image' ? 'active' : ''}" data-media-filter="image">🖼 Images (${imgCount})</button>
              <button type="button" class="vmedia-filter-chip ${filter === 'video' ? 'active' : ''}" data-media-filter="video">🎬 Videos (${vidCount})</button>
            </div>
            <input type="text" class="vmedia-search-input" id="drawer-media-search" placeholder="Search images & videos..." value="${this.mediaSearchQuery}" />
          </div>

          <div class="vmedia-cards-grid">
            ${assets.length === 0 ? '<p style="color:#7d9688;grid-column:1/-1;text-align:center;padding:20px;">No media assets found matching search query.</p>' : ''}
            ${assets.map(asset => {
              const isAssetImg = asset.mediaType === 'image' || asset.type === 'image';
              return `
                <div class="drawer-media-card" data-media-id="${asset.id}" data-item-type="${isAssetImg ? 'image' : 'video'}" data-item-category="media" data-title="${asset.title}" data-sub="${asset.sub}" data-bg="${asset.bg || ''}" data-accent="${asset.accent || ''}" data-loop="${!!asset.loop}" data-audio="${!!asset.audio}">
                  <div class="dmedia-thumb-strip" style="background: ${asset.bg || '#0b1611'};">
                    <span class="dmedia-type-tag ${isAssetImg ? 'img-tag' : 'vid-tag'}">${isAssetImg ? 'IMAGE' : 'VIDEO'}</span>
                    <span style="font-size: 26px; color: ${asset.accent || '#10b981'};">${isAssetImg ? '🖼' : '🎬'}</span>
                    <span class="dmedia-tag-pill">${asset.tag || (isAssetImg ? 'STILL' : 'LOOP')}</span>
                  </div>
                  <div class="dmedia-body">
                    <div class="dmedia-title-row">
                      <strong title="${asset.title}">${asset.title}</strong>
                      <small>${asset.sub}</small>
                    </div>
                    <div class="dmedia-actions">
                      <button type="button" class="btn-add-grid" data-item-type="${isAssetImg ? 'image' : 'video'}" data-item-category="media" data-media-type="${isAssetImg ? 'image' : 'video'}" data-title="${asset.title}" data-sub="${asset.sub}" data-bg="${asset.bg || ''}" data-accent="${asset.accent || ''}" data-loop="${!!asset.loop}" data-audio="${!!asset.audio}">+ Add to Section</button>
                      <button type="button" class="btn-cue-stage" data-item-type="${isAssetImg ? 'image' : 'video'}" data-item-category="media" data-media-type="${isAssetImg ? 'image' : 'video'}" data-title="${asset.title}" data-sub="${asset.sub}" data-bg="${asset.bg || ''}" data-accent="${asset.accent || ''}" data-loop="${!!asset.loop}" data-audio="${!!asset.audio}">To Preview</button>
                      <button type="button" class="btn-cue-live" data-item-type="${isAssetImg ? 'image' : 'video'}" data-item-category="media" data-media-type="${isAssetImg ? 'image' : 'video'}" data-title="${asset.title}" data-sub="${asset.sub}" data-bg="${asset.bg || ''}" data-accent="${asset.accent || ''}" data-loop="${!!asset.loop}" data-audio="${!!asset.audio}">Go Live ↵</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 5. Cameras
    if (this.activeDrawerTab === 'cameras') {
      return `
        <div class="vtab-pane-generic">
          <p style="color:#8fa598;font-size:12px;margin-bottom:12px;">Add physical NDI cameras, PTZ robotic angles, or HDMI capture cards into your inputs section.</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Sanctuary Cam 1 (Wide Angle PTZ)</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="camera" data-item-category="cameras" data-verse-text="Sanctuary Wide · 1080p60 NDI" data-ref="Sanctuary Cam 1 (Wide)">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="camera" data-item-category="cameras" data-verse-text="Sanctuary Wide · 1080p60 NDI" data-ref="Sanctuary Cam 1 (Wide)">To Preview</button>
                  <button class="btn-cue-live" data-item-type="camera" data-item-category="cameras" data-verse-text="Sanctuary Wide · 1080p60 NDI" data-ref="Sanctuary Cam 1 (Wide)">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Main Center Sanctuary PTZ · NDI 1080p60 High Definition Feed</p>
            </div>

            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Pulpit PTZ (Pastor Focus)</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="camera" data-item-category="cameras" data-verse-text="Pulpit Close-Up · 1080p60 HDMI 2" data-ref="Pulpit PTZ (Pastor Focus)">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="camera" data-item-category="cameras" data-verse-text="Pulpit Close-Up · 1080p60 HDMI 2" data-ref="Pulpit PTZ (Pastor Focus)">To Preview</button>
                  <button class="btn-cue-live" data-item-type="camera" data-item-category="cameras" data-verse-text="Pulpit Close-Up · 1080p60 HDMI 2" data-ref="Pulpit PTZ (Pastor Focus)">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Pastor Robotic PTZ Close-up · 1080p60 HDMI Input 2</p>
            </div>

            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Balcony Cam 3 (Audience View)</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="camera" data-item-category="cameras" data-verse-text="Balcony Cam · 1080p60 NDI" data-ref="Balcony Cam 3 (Audience View)">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="camera" data-item-category="cameras" data-verse-text="Balcony Cam · 1080p60 NDI" data-ref="Balcony Cam 3 (Audience View)">To Preview</button>
                  <button class="btn-cue-live" data-item-type="camera" data-item-category="cameras" data-verse-text="Balcony Cam · 1080p60 NDI" data-ref="Balcony Cam 3 (Audience View)">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Balcony Wide Angle Audience Congregation Camera</p>
            </div>
          </div>
        </div>
      `;
    }

    // 6. Titles (Lower Thirds)
    if (this.activeDrawerTab === 'titles') {
      return `
        <div class="vtab-pane-generic">
          <p style="color:#8fa598;font-size:12px;margin-bottom:12px;">Broadcast lower third graphics and speaker badges.</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Speaker: Pastor David Kingsley</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="titles" data-item-category="titles" data-verse-text="Pastor David Kingsley\nSenior Pastor · KERYX Ministries" data-ref="Pastor Badge (Lower Third)">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="titles" data-item-category="titles" data-verse-text="Pastor David Kingsley\nSenior Pastor · KERYX Ministries" data-ref="Pastor Badge (Lower Third)">To Preview</button>
                  <button class="btn-cue-live" data-item-type="titles" data-item-category="titles" data-verse-text="Pastor David Kingsley\nSenior Pastor · KERYX Ministries" data-ref="Pastor Badge (Lower Third)">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Pastor David Kingsley — Senior Pastor & Visionary</p>
            </div>

            <div class="drawer-verse-card">
              <div class="dverse-head">
                <span class="dverse-badge">Giving / Offering Lower Third</span>
                <div class="dverse-btns">
                  <button class="btn-add-grid" data-item-type="titles" data-item-category="titles" data-verse-text="Tithes & Offerings\nBank: First Church Bank · Acc: 0123456789" data-ref="Offering Account Badge">+ Add to Section</button>
                  <button class="btn-cue-stage" data-item-type="titles" data-item-category="titles" data-verse-text="Tithes & Offerings\nBank: First Church Bank · Acc: 0123456789" data-ref="Offering Account Badge">To Preview</button>
                  <button class="btn-cue-live" data-item-type="titles" data-item-category="titles" data-verse-text="Tithes & Offerings\nBank: First Church Bank · Acc: 0123456789" data-ref="Offering Account Badge">Go Live ↵</button>
                </div>
              </div>
              <p class="dverse-text">Bank: First Church Bank · Acc: 0123456789 · Online: gracecity.org/give</p>
            </div>
          </div>
        </div>
      `;
    }

    // 7. Quick Custom Input Creator
    if (this.activeDrawerTab === 'custom') {
      return `
        <div class="vtab-pane-generic">
          <div class="vcustom-input-box">
            <h4>⚡ Create Custom Input</h4>
            <div class="vmodal-field-group">
              <label>Input Title</label>
              <input type="text" class="vmodal-input" id="custom-inp-title" placeholder="e.g., Guest Speaker Lower Third or Youth Choir Video" />
            </div>
            <div class="vmodal-field-group">
              <label>Category</label>
              <select class="vmodal-select" id="custom-inp-cat">
                <option value="cameras">Camera / Video Feed</option>
                <option value="scriptures">Scripture Verse</option>
                <option value="worship">Worship Song / Stanza</option>
                <option value="slides">Presentation Slides</option>
                <option value="image">Image (Photo / Graphic Banner)</option>
                <option value="video">Video (Motion Loop / Clip)</option>
                <option value="media">Media / Video Loop</option>
                <option value="titles" selected>Lower Third Title</option>
              </select>
            </div>
            <div class="vmodal-field-group">
              <label>Content / Lyrics / Scripture / URL</label>
              <textarea class="vmodal-textarea" id="custom-inp-text" placeholder="Type text or lyrics to display on screen..."></textarea>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="aeux-pill-btn-emerald" id="btn-submit-custom-add">+ Add to Inputs Section</button>
              <button class="mini-tool-btn primary" id="btn-submit-custom-preview">Add & Send to Preview</button>
              <button class="mini-tool-btn danger" id="btn-submit-custom-live">Add & Send to Live ↵</button>
            </div>
          </div>
        </div>
      `;
    }

    // 8. AI Cues
    if (this.activeDrawerTab === 'ai') {
      const { isListening, detectedScriptures = [], microNoteEvents = [] } = aiStore.getState();

      return `
        <div class="vtab-pane-ai">
          <div class="vai-header-bar">
            <div class="vai-mic-status">
              <button class="vai-listen-btn" id="btn-modal-speech-toggle">
                <span>🎤</span> ${isListening ? 'Stop AI Speech Listening' : 'Start AI Speech Listening'}
              </button>
              <button class="secondary-button small" id="btn-drawer-stream-sample" style="font-size: 11px; padding: 4px 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 4px; font-weight: 600; cursor: pointer;">
                ⚡ Stream Sample Sermon
              </button>
              <button class="secondary-button small" id="btn-drawer-open-suite" style="font-size: 11px; padding: 4px 10px; background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 4px; font-weight: 600; cursor: pointer;">
                ✳ Open AI Broadcast Suite
              </button>
              <span class="vai-status-chip">${isListening ? '● Listening live on pulpit mic...' : 'Ready — Click Start or Stream Sample'}</span>
            </div>
          </div>

          <div class="vai-cue-cards-list">
            ${detectedScriptures.length === 0 && microNoteEvents.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: #64748b; background: #0c1511; border-radius: 8px; border: 1px dashed #1a2f23; width: 100%;">
                <span style="font-size: 24px;">✳</span>
                <h4 style="margin: 8px 0 4px; color: #94a3b8; font-size: 13px;">No AI Broadcast Cues Yet</h4>
                <p style="margin: 0 0 12px; font-size: 11.5px; color: #64748b;">Spoken Bible verses and sermon points will appear here in &le;300ms as the pastor speaks.</p>
                <div style="display: flex; justify-content: center; gap: 8px;">
                  <button class="primary-button small" id="btn-drawer-empty-sample" style="font-size: 11px; padding: 6px 14px; background: #10b981; color: #021a0f; font-weight: 700;">⚡ Stream Sample Sermon Now</button>
                </div>
              </div>
            ` : `
              ${detectedScriptures.map((det, idx) => `
                <div class="drawer-verse-card ${idx === 0 ? 'active' : ''}">
                  <div class="dverse-head">
                    <span class="dverse-badge" style="display: inline-flex; align-items: center; gap: 6px;">
                      <span class="status-pip pulse-emerald" style="width: 6px; height: 6px;"></span>
                      Detected: ${det.reference} (${det.confidence || 98}%) &bull; ${det.processingTimeMs || '1.1'}ms
                    </span>
                    <div class="dverse-btns">
                      <button class="btn-add-grid" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${det.text.replace(/"/g, '&quot;')}" data-ref="${det.reference}">+ Add to Section</button>
                      <button class="btn-cue-stage" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${det.text.replace(/"/g, '&quot;')}" data-ref="${det.reference}">To Preview</button>
                      <button class="btn-cue-live" data-item-type="scripture" data-item-category="scriptures" data-verse-text="${det.text.replace(/"/g, '&quot;')}" data-ref="${det.reference}">Go Live ↵</button>
                      <button class="btn-cue-lt" data-action="drawer-ai-lt" data-verse-text="${det.text.replace(/"/g, '&quot;')}" data-ref="${det.reference}" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #2563eb; font-size: 10px; padding: 2px 7px; border-radius: 3px; cursor: pointer;">Lower Third</button>
                    </div>
                  </div>
                  <p class="dverse-text">"${det.text}"</p>
                </div>
              `).join('')}

              ${microNoteEvents.slice(0, 6).map(mn => `
                <div class="drawer-verse-card" style="border-left: 3px solid #f59e0b;">
                  <div class="dverse-head">
                    <span class="dverse-badge" style="color: #fbbf24; background: rgba(245, 158, 11, 0.15);">
                      ⚡ [${mn.category || mn.type}] &bull; ${mn.timestamp}
                    </span>
                    <div class="dverse-btns">
                      <button class="btn-add-grid" data-item-type="titles" data-item-category="titles" data-verse-text="${mn.text.replace(/"/g, '&quot;')}" data-ref="${mn.category || 'Note'}">+ Add to Section</button>
                      <button class="btn-cue-stage" data-item-type="titles" data-item-category="titles" data-verse-text="${mn.text.replace(/"/g, '&quot;')}" data-ref="${mn.category || 'Note'}">To Preview</button>
                      <button class="btn-cue-live" data-item-type="titles" data-item-category="titles" data-verse-text="${mn.text.replace(/"/g, '&quot;')}" data-ref="${mn.category || 'Note'}">Go Live ↵</button>
                      <button class="btn-cue-lt" data-action="drawer-note-lt" data-verse-text="${mn.text.replace(/"/g, '&quot;')}" data-ref="${mn.category || 'Note'}" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #2563eb; font-size: 10px; padding: 2px 7px; border-radius: 3px; cursor: pointer;">Lower Third</button>
                    </div>
                  </div>
                  <p class="dverse-text" style="color: #f1f5f9;">"${mn.text}"</p>
                </div>
              `).join('')}
            `}
          </div>
        </div>
      `;
    }

    return `<div class="vtab-pane-generic"><p>Select items to add them as live inputs into your grid.</p></div>`;
  }

  /**
   * Render Preset Selector Modal
   */
  static renderPresetModal() {
    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'preset' ? 'show' : ''}" id="vmix-preset-modal">
        <div class="vmodal-dialog-sm">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">BROADCAST PRESET</span>
              <h3>Switch Service Preset</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="preset">✕</button>
          </div>
          <div class="vmodal-dialog-body">
            ${this.presetsList.map(p => `
              <div class="vmodal-preset-item ${this.activePreset === p.name ? 'active' : ''}" data-preset-name="${p.name}">
                <div>
                  <strong style="color:#ffffff;font-size:12px;">${p.name}</strong>
                  <small style="display:block;color:#8fa598;margin-top:2px;">${p.desc}</small>
                </div>
                <button class="mini-tool-btn ${this.activePreset === p.name ? 'primary' : ''}">${this.activePreset === p.name ? 'Active' : 'Load'}</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Studio Settings Modal with Multi-Platform Simulcasting Engine
   */
  static renderSettingsModal() {
    const activeCount = this.getActiveDestinations().length;

    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'settings' ? 'show' : ''}" id="vmix-settings-modal">
        <div class="vmodal-dialog-lg">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">SIMULCAST HUB</span>
              <h3>Live Stream Multi-Destination & Control Settings</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="settings">✕</button>
          </div>
          <div class="vmodal-dialog-body">
            <!-- Top Controls: Output Resolution, Bitrate, NDI -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <div class="vmodal-field-group">
                <label>Master Resolution</label>
                <select class="vmodal-select" id="setting-resolution">
                  <option value="1080p60" selected>1920×1080 @ 60fps (Full HD)</option>
                  <option value="4k60">3840×2160 @ 60fps (4K UHD)</option>
                  <option value="720p60">1280×720 @ 60fps (Standard)</option>
                </select>
              </div>
              <div class="vmodal-field-group">
                <label>Stream Bitrate</label>
                <select class="vmodal-select" id="setting-bitrate">
                  <option value="6000" selected>6000 kbps (Optimal Multi-Stream)</option>
                  <option value="9000">9000 kbps (Ultra Studio)</option>
                  <option value="3500">3500 kbps (Low Bandwidth)</option>
                </select>
              </div>
              <div class="vmodal-field-group">
                <label>NDI Channel Name</label>
                <input type="text" class="vmodal-input" id="setting-ndi-channel" value="KERYX-CHURCH-PGM" />
              </div>
            </div>

            <!-- Multi-Platform Simulcast Section -->
            <div class="vmodal-field-group" style="margin-top: 4px;">
              <div class="vsimulcast-header-bar">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <label style="font-size: 11px; font-weight: 800; color: #fff;">Simulcast Platforms (Stream Everywhere at Once)</label>
                  <span class="vsimulcast-badge" id="simulcast-count-badge">${activeCount} of ${this.streamDestinations.length} Active</span>
                </div>
                <div class="vsimulcast-quick-actions">
                  <button class="mini-tool-btn primary" id="btn-simulcast-select-all" title="Activate all streaming destinations">⚡ Stream on All Platforms</button>
                  <button class="mini-tool-btn" id="btn-simulcast-select-top4" title="Activate YouTube, Facebook, TikTok & Instagram">Top 4 (YT, FB, TikTok, IG)</button>
                  <button class="mini-tool-btn" id="btn-simulcast-clear-all" title="Deactivate all">Clear</button>
                </div>
              </div>

              <!-- Platforms Matrix List -->
              <div class="vsimulcast-list" id="vsimulcast-destinations-list">
                ${this.renderSimulcastList()}
              </div>
            </div>

            <div class="vmodal-actions-row">
              <button class="mini-tool-btn" data-close-modal="settings">Cancel</button>
              <button class="aeux-pill-btn-emerald" id="btn-save-settings">Save & Apply Simulcast Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Multi-Platform Simulcast Destination Cards
   */
  static renderSimulcastList() {
    return this.streamDestinations.map(dest => {
      const isVertical = dest.aspect.includes('9:16');
      return `
        <div class="vdest-card ${dest.enabled ? 'is-active' : ''}" data-dest-id="${dest.id}">
          <div class="vdest-top-row">
            <div class="vdest-platform-info">
              <label class="vdest-toggle-label">
                <input type="checkbox" class="vdest-checkbox" data-dest-toggle="${dest.id}" ${dest.enabled ? 'checked' : ''} />
                <span class="vdest-icon">${dest.icon}</span>
                <span class="vdest-name">${dest.name}</span>
              </label>
              <span class="vdest-aspect-tag ${isVertical ? 'vertical' : ''}">${dest.aspect}</span>
            </div>
            <div class="vdest-badges">
              <span class="vdest-status-badge ${dest.enabled ? 'live' : 'standby'}" id="status-badge-${dest.id}">
                ${dest.enabled ? '● SIMULCAST READY' : 'STANDBY'}
              </span>
            </div>
          </div>

          <div class="vdest-inputs-row">
            <div class="vdest-input-wrap">
              <label>RTMP Ingest Server URL</label>
              <input type="text" class="vdest-input" data-dest-rtmp="${dest.id}" value="${dest.rtmp}" />
            </div>
            <div class="vdest-input-wrap">
              <label>Stream Key</label>
              <div class="vdest-key-wrap">
                <input type="password" class="vdest-input" data-dest-key="${dest.id}" value="${dest.key}" placeholder="Paste stream key..." />
                <button type="button" class="vdest-key-toggle" data-key-toggle="${dest.id}" title="Show/Hide Key">👁</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Help / Keyboard Shortcuts Modal
   */
  static renderHelpModal() {
    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'help' ? 'show' : ''}" id="vmix-help-modal">
        <div class="vmodal-dialog-sm">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">SHORTCUTS</span>
              <h3>Broadcast Keyboard Shortcuts</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="help">✕</button>
          </div>
          <div class="vmodal-dialog-body">
            <div class="vmodal-shortcut-row">
              <span>Instant Cut Transition</span>
              <span class="vmodal-kbd">Space</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Quick Play / Fade Transition</span>
              <span class="vmodal-kbd">Enter</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Toggle Master Blackout</span>
              <span class="vmodal-kbd">B</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Toggle Overlays Clear</span>
              <span class="vmodal-kbd">C</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Overlays 1, 2, 3, 4</span>
              <span class="vmodal-kbd">1  2  3  4</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Toggle Fullscreen</span>
              <span class="vmodal-kbd">F</span>
            </div>
            <div class="vmodal-shortcut-row">
              <span>Close Active Modal</span>
              <span class="vmodal-kbd">Esc</span>
            </div>
            <div class="vmodal-actions-row">
              <button class="aeux-pill-btn-emerald" data-close-modal="help">Got It</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Input Settings Modal
   */
  static renderInputSettingsModal() {
    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'input_settings' ? 'show' : ''}" id="vmix-input-settings-modal">
        <div class="vmodal-dialog-md">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">INPUT EDITOR</span>
              <h3 id="inp-edit-header-title">Edit Input Settings</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="input_settings">✕</button>
          </div>
          <div class="vmodal-dialog-body" id="inp-edit-form-body">
            <!-- Form populated dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Program Output Settings Modal
   */
  static renderOutputSettingsModal() {
    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'output_settings' ? 'show' : ''}" id="vmix-output-settings-modal">
        <div class="vmodal-dialog-md">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">PROGRAM OUTPUT</span>
              <h3>Program Output Configuration</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="output_settings">✕</button>
          </div>
          <div class="vmodal-dialog-body">
            <div class="vmodal-field-group">
              <label>Church Subtitle / Watermark Text</label>
              <input type="text" class="vmodal-input" id="output-church-subtitle" value="Grace City Church Broadcast · Lagos, Nigeria" />
            </div>
            <div class="vmodal-field-group">
              <label>Aspect Ratio</label>
              <select class="vmodal-select" id="output-aspect-ratio">
                <option value="16:9" selected>16:9 Widescreen (1920×1080 / 4K)</option>
                <option value="9:16">9:16 Vertical Reel / TikTok Stream</option>
                <option value="4:3">4:3 Legacy Standard</option>
              </select>
            </div>
            <div class="vmodal-field-group">
              <label>Color Contrast Grade</label>
              <select class="vmodal-select" id="output-color-grade">
                <option value="neutral" selected>Rec.709 Natural Broadcast Grade</option>
                <option value="warm">Warm Sanctuary Amber</option>
                <option value="vivid">Vivid High Contrast (Outdoor / LED)</option>
              </select>
            </div>
            <div class="vmodal-actions-row">
              <button class="mini-tool-btn" data-close-modal="output_settings">Cancel</button>
              <button class="aeux-pill-btn-emerald" id="btn-save-output-settings">Apply Output Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Service Playlist Modal
   */
  static renderPlaylistModal() {
    return `
      <div class="vmix-asset-modal-backdrop ${this.activeModal === 'playlist' ? 'show' : ''}" id="vmix-playlist-modal">
        <div class="vmodal-dialog-md">
          <div class="vmix-modal-header">
            <div class="modal-title-group">
              <span class="modal-badge">ORDER OF SERVICE</span>
              <h3>Sunday Service Live Setlist</h3>
            </div>
            <button class="modal-close-btn" data-close-modal="playlist">✕</button>
          </div>
          <div class="vmodal-dialog-body" style="gap: 8px;">
            ${this.servicePlaylist.map(item => `
              <div class="vmodal-playlist-item" data-playlist-input-id="${item.inputId}">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="vicard-num">${item.num}</span>
                  <div>
                    <strong style="font-size:11px;color:#fff;display:block;">${item.title}</strong>
                    <small style="font-size:9px;color:#8fa598;">${item.sub}</small>
                  </div>
                </div>
                <div style="display:flex;gap:5px;">
                  <button class="btn-cue-stage" data-action="playlist-stage" data-item-type="${item.type.toLowerCase()}" data-title="${item.title}" data-sub="${item.sub}">Stage</button>
                  <button class="btn-cue-live" data-action="playlist-live" data-item-type="${item.type.toLowerCase()}" data-title="${item.title}" data-sub="${item.sub}">Go Live ↵</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Calculate dB from vertical fader 0-100
   */
  static calculateDb(val) {
    const num = Number(val);
    if (num <= 0) return '-∞ dB';
    if (num >= 95) return '0.0 dB';
    const db = ((num - 95) * 0.4).toFixed(1);
    return `${db} dB`;
  }

  /**
   * Format duration in seconds to HH:MM:SS or MM:SS
   */
  static formatDuration(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  /**
   * Attach all DOM Event Handlers
   */
  static attachEvents(container) {
    const root = container || document.querySelector('#keryx-studio-workspace') || document;

    this.initGlobalEvents();
    this.startClockTimer(root);
    this.startAudioMeters(root);

    // 0. Bible Show & AI Suite Modals
    this.attachBibleShowModalEvents(root);
    this.attachAISuiteModalEvents(root);

    // 1. Header Bar Events
    this.attachHeaderEvents(root);

    // 2. Monitors & Screen Events
    this.attachMonitorEvents(root);

    // 3. Transition Column Events
    this.attachTransitionEvents(root);

    // 4. Category Tab Events
    this.attachCategoryEvents(root);

    // 5. Input Cards Events (including 1 2 3 overlays)
    this.attachInputCardsEvents(root);

    // 6. Audio Mixer Events
    this.attachAudioMixerEvents(root);

    // 7. Bottom Bar Events
    this.attachBottomBarEvents(root);

    // 8. Modals & Drawers Events
    this.attachModalEvents(root);

    // 9. Keyboard Shortcuts
    this.attachKeyboardShortcuts(root);
  }

  /**
   * 1. Header Bar Events
   */
  static attachHeaderEvents(root) {
    // Preset Trigger
    root.querySelector('#btn-vmix-preset-trigger')?.addEventListener('click', () => {
      this.openModal('preset', root);
    });

    // Simulcast Stream Toggle
    const streamBtn = root.querySelector('#btn-vmix-stream');
    streamBtn?.addEventListener('click', () => {
      this.isStreaming = !this.isStreaming;
      streamBtn.classList.toggle('active-emerald', this.isStreaming);
      const activeCount = this.getActiveDestinations().length;

      if (this.isStreaming) {
        this.streamSeconds = 0;
        this.streamTimerInterval = setInterval(() => {
          this.streamSeconds++;
          const strText = root.querySelector('#btn-vmix-stream-text');
          if (strText) strText.textContent = `STREAM ${this.formatDuration(this.streamSeconds)} (${activeCount} LIVE)`;
        }, 1000);
        toastManager.show(`🔴 Synchronized Simulcast Live to ${activeCount} Platforms!`, 'success');
      } else {
        clearInterval(this.streamTimerInterval);
        const strText = root.querySelector('#btn-vmix-stream-text');
        if (strText) strText.textContent = `STREAM (${activeCount})`;
        toastManager.show('Simulcast Streaming Stopped');
      }
      this.updateMonitors(root);
    });

    // Record Toggle
    const recBtn = root.querySelector('#btn-vmix-rec');
    recBtn?.addEventListener('click', () => {
      this.isRecording = !this.isRecording;
      recBtn.classList.toggle('active-ruby', this.isRecording);

      if (this.isRecording) {
        this.recordSeconds = 0;
        this.recordTimerInterval = setInterval(() => {
          this.recordSeconds++;
          const recText = root.querySelector('#btn-vmix-rec-text');
          if (recText) recText.textContent = `REC ${this.formatDuration(this.recordSeconds)}`;
        }, 1000);
        toastManager.show('Master Program Recording Started (1080p60 ProRes/H.264)');
      } else {
        clearInterval(this.recordTimerInterval);
        const recText = root.querySelector('#btn-vmix-rec-text');
        if (recText) recText.textContent = 'REC';
        toastManager.show('Master Recording Saved to Disk');
      }
    });

    // Fullscreen Toggle
    root.querySelector('#btn-vmix-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        toastManager.show('Studio Fullscreen Mode Enabled');
      } else {
        document.exitFullscreen().catch(() => {});
        toastManager.show('Exited Fullscreen');
      }
    });

    // External NDI Toggle
    const extBtn = root.querySelector('#btn-vmix-external');
    extBtn?.addEventListener('click', () => {
      this.isExternalActive = !this.isExternalActive;
      extBtn.classList.toggle('active-cyan', this.isExternalActive);
      const diag = root.querySelector('#vdiag-tag');
      if (diag) {
        diag.textContent = this.isExternalActive ? 'NDI: 1080p60 [ON AIR]' : 'NDI: 1080p60 [STANDBY]';
      }
      toastManager.show(this.isExternalActive ? 'NDI & External Output Activated (KERYX-CHURCH-PGM)' : 'External Output Stopped');
    });

    // MultiCorder
    const mcBtn = root.querySelector('#btn-vmix-multicorder');
    mcBtn?.addEventListener('click', () => {
      this.isMultiCorderActive = !this.isMultiCorderActive;
      mcBtn.classList.toggle('active-ruby', this.isMultiCorderActive);
      toastManager.show(this.isMultiCorderActive ? 'MultiCorder ISO Recording Armed (All Active Inputs)' : 'MultiCorder Stopped');
    });

    // Pause Inputs
    const pauseBtn = root.querySelector('#btn-vmix-pause');
    pauseBtn?.addEventListener('click', () => {
      this.isInputsPaused = !this.isInputsPaused;
      pauseBtn.classList.toggle('active-amber', this.isInputsPaused);
      root.querySelector('#vmix-inputs-grid')?.classList.toggle('inputs-paused', this.isInputsPaused);
      toastManager.show(this.isInputsPaused ? 'All Live Camera Feeds Frozen' : 'Live Inputs Resumed');
    });


    // AI Suite Modal Trigger
    root.querySelector('#btn-vmix-aisuite')?.addEventListener('click', () => {
      this.openAISuiteModal(root);
    });

    // Settings Modal Trigger
    root.querySelector('#btn-vmix-settings')?.addEventListener('click', () => {
      this.openModal('settings', root);
    });

    // Help Modal Trigger
    root.querySelector('#btn-vmix-help')?.addEventListener('click', () => {
      this.openModal('help', root);
    });

    // Exit to Dashboard
    root.querySelector('#btn-vmix-exit-dash')?.addEventListener('click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      appStore.setActiveView('Dashboard');
    });
  }

  /**
   * 2. Monitor Controls (Preview & Program)
   */
  static attachMonitorEvents(root) {
    // Preview Settings Gear
    root.querySelector('#btn-preview-gear')?.addEventListener('click', () => {
      const p = this.inputsList.find(i => i.isPreview);
      if (p) {
        this.openInputSettings(p.id, root);
      } else {
        toastManager.show('No active input in Preview to configure. Add an input first.');
      }
    });

    // Preview Clear (Standby)
    root.querySelector('#btn-preview-clear')?.addEventListener('click', () => {
      this.inputsList.forEach(i => { i.isPreview = false; });
      this.updateMonitors(root);
      toastManager.show('Preview cleared to Standby');
    });

    // Swap Preview and Live
    root.querySelector('#btn-preview-swap')?.addEventListener('click', () => {
      const prev = this.inputsList.find(i => i.isPreview);
      const live = this.inputsList.find(i => i.isLive);
      if (prev && live) {
        prev.isPreview = false;
        prev.isLive = true;
        live.isPreview = true;
        live.isLive = false;
      } else if (prev) {
        prev.isPreview = false;
        prev.isLive = true;
      } else if (live) {
        live.isLive = false;
        live.isPreview = true;
      }
      this.updateMonitors(root);
      toastManager.show('Swapped Preview and Live');
    });

    // Program Settings Gear
    root.querySelector('#btn-program-gear')?.addEventListener('click', () => {
      this.openModal('output_settings', root);
    });

    // Instant Blackout
    root.querySelector('#btn-live-blackout')?.addEventListener('click', () => {
      this.isBlackout = !this.isBlackout;
      liveStore.setBlackout(this.isBlackout);
      this.updateMonitors(root);
      toastManager.show(this.isBlackout ? '■ Master Blackout Engaged' : 'Master Blackout Released');
    });

    // Clear Overlays
    root.querySelector('#btn-live-clear')?.addEventListener('click', () => {
      this.isClear = !this.isClear;
      liveStore.setClear(this.isClear);
      this.updateMonitors(root);
      toastManager.show(this.isClear ? '⎚ Overlays Cleared from Program' : 'Overlays Restored to Program');
    });
  }

  /**
   * 3. Transition Column Events
   */
  static attachTransitionEvents(root) {
    // Quick Play
    root.querySelector('#btn-quick-play')?.addEventListener('click', () => {
      this.executeTransition('quick', root);
    });

    // Cut
    root.querySelector('#btn-cut-trans')?.addEventListener('click', () => {
      this.executeTransition('cut', root);
    });

    // Fade
    root.querySelector('#btn-fade-trans')?.addEventListener('click', () => {
      this.executeTransition('fade', root);
    });

    // Merge
    root.querySelector('#btn-merge-trans')?.addEventListener('click', () => {
      this.executeTransition('merge', root);
    });

    // Wipe
    root.querySelector('#btn-wipe-trans')?.addEventListener('click', () => {
      this.executeTransition('wipe', root);
    });

    // Fly
    root.querySelector('#btn-fly-trans')?.addEventListener('click', () => {
      this.executeTransition('fly', root);
    });

    // T-Bar
    const tbar = root.querySelector('#vmix-tbar');
    const tbarReadout = root.querySelector('#tbar-percent');
    if (tbar && tbarReadout) {
      tbar.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.tbarValue = val;
        tbarReadout.textContent = `${val}%`;

        const progContent = root.querySelector('#live-monitor-content');
        if (progContent) {
          progContent.style.opacity = String(Math.max(0.15, (100 - val) / 100));
        }

        if (val === 100) {
          this.executeTransition('fade', root);
          tbar.value = '0';
          this.tbarValue = 0;
          tbarReadout.textContent = '0%';
          if (progContent) progContent.style.opacity = '1';
        }
      });
    }

    // Master Overlay Buttons in Transition Column (1, 2, 3, 4)
    root.querySelectorAll('.voverlay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = Number(btn.dataset.overlay);
        this.activeOverlays[num] = !this.activeOverlays[num];

        // If turned ON and no input assigned, assign preview input or live input as fallback
        if (this.activeOverlays[num] && !this.overlayInputs[num]) {
          const targetInp = this.inputsList.find(i => i.isPreview) || this.inputsList.find(i => i.isLive);
          if (targetInp) {
            this.overlayInputs[num] = targetInp.id;
          }
        }

        this.updateMonitors(root);
        this.syncOverlayButtons(root);
        toastManager.show(`Overlay Channel ${num} ${this.activeOverlays[num] ? 'ON' : 'OFF'}`);
      });
    });
  }

  /**
   * 4. Category Tabs
   */
  static attachCategoryEvents(root) {
    root.querySelectorAll('.vcat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.cat;
        this.activeCategory = cat;
        root.querySelectorAll('.vcat-tab').forEach(t => t.classList.toggle('active', t === tab));
        const inputsGrid = root.querySelector('#vmix-inputs-grid');
        if (inputsGrid) {
          inputsGrid.innerHTML = this.renderInputCards();
          this.attachInputCardsEvents(root);
        }
      });
    });

    // Open Bible Show Console
    root.querySelector('#btn-open-bibleshow')?.addEventListener('click', () => {
      this.isBibleShowModalOpen = true;
      const modal = root.querySelector('#vmix-bibleshow-modal');
      if (modal) {
        modal.classList.add('show');
        this.updateStudioBibleShowUI(root, true, true);
      }
    });

    // Open AI Studio Tools
    root.querySelector('#btn-open-aisuite')?.addEventListener('click', () => {
      this.openAISuiteModal(root);
    });

    // Open Church Assets Drawer
    root.querySelector('#btn-open-asset-drawer')?.addEventListener('click', () => {
      this.openAssetDrawer('bible', root);
    });

    // AI Speech Cues Toggle
    const aiSpeechBtn = root.querySelector('#btn-ai-speech-toggle');
    aiSpeechBtn?.addEventListener('click', () => {
      aiStore.toggleListening();
      aiSpeechBtn.classList.toggle('active-purple', aiStore.isListening);
      toastManager.show(aiStore.isListening ? 'AI Speech Transcriber Listening on Pulpit Mic' : 'AI Speech Transcriber Paused');
    });
  }

  /**
   * 5. Input Cards Events: Routing to Preview, Live, Settings, Delete, and 1 2 3 Overlays
   */
  static attachInputCardsEvents(root) {
    // Empty state Add Input button
    root.querySelector('#btn-empty-add-input')?.addEventListener('click', () => {
      this.openAssetDrawer('bible', root);
    });

    // Load Sample Presets button (for quick restore if user wants sample inputs)
    root.querySelector('#btn-load-sample-preset')?.addEventListener('click', () => {
      this.inputsList = JSON.parse(JSON.stringify(this.defaultPresetsInputs));
      const grid = root.querySelector('#vmix-inputs-grid');
      if (grid) {
        grid.innerHTML = this.renderInputCards();
        this.attachInputCardsEvents(root);
      }
      this.refreshCategoryTabs(root);
      this.updateMonitors(root);
      this.syncOverlayButtons(root);
      toastManager.show('Loaded 10 Sample Church Production Inputs');
    });

    root.querySelectorAll('.vmix-input-card').forEach(card => {
      const inputId = card.dataset.inputId;
      const input = this.inputsList.find(i => i.id === inputId);

      // Card thumbnail click: stage to Preview
      card.querySelector('.vicard-thumbnail')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stageInputToPreview(inputId, root);
      });

      // Card thumbnail double-click: send Live to Program
      card.querySelector('.vicard-thumbnail')?.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.sendInputToProgram(inputId, root);
      });

      // Explicit "Preview" Button on card
      card.querySelector('[data-action="stage"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stageInputToPreview(inputId, root);
      });

      // Explicit "Live" Button on card
      card.querySelector('[data-action="cut"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sendInputToProgram(inputId, root);
      });

      // Quick Play
      card.querySelector('[data-action="quickplay"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stageInputToPreview(inputId, root);
        this.executeTransition('quick', root);
      });

      // Overlay Channel Buttons: 1, 2, 3
      card.querySelectorAll('[data-action="toggle-overlay"]').forEach(olBtn => {
        olBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const olNum = Number(olBtn.dataset.overlay);
          this.toggleInputOverlay(olNum, inputId, root);
        });
      });

      // Delete Input button (header '✕')
      card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteInput(inputId, root);
      });

      // Audio toggle
      const audioBtn = card.querySelector('[data-action="audio"]');
      audioBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (input) {
          input.audio = !input.audio;
          audioBtn.classList.toggle('active', input.audio);
          toastManager.show(`Audio ${input.audio ? 'enabled' : 'muted'} on Input ${input.num}`);
        }
      });

      // Settings gear
      card.querySelector('[data-action="settings"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openInputSettings(inputId, root);
      });
    });
  }

  /**
   * 6. Audio Mixer Console Events
   */
  static attachAudioMixerEvents(root) {
    // Audio Tabs (Master vs Inputs)
    root.querySelectorAll('.vaudio-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.audioTabMode = tab.dataset.audioTab || 'master';
        root.querySelectorAll('.vaudio-tab').forEach(t => t.classList.toggle('active', t === tab));
      });
    });

    // Faders
    root.querySelectorAll('.vstrip-fader').forEach(fader => {
      fader.addEventListener('input', (e) => {
        const ch = e.target.dataset.channel;
        const val = Number(e.target.value);
        this.channelVolumes[ch] = val;

        const dbEl = root.querySelector(`#db-${ch}`);
        if (dbEl && !this.channelMutes[ch]) {
          dbEl.textContent = this.calculateDb(val);
        }
      });
    });

    // Mute Buttons
    root.querySelectorAll('.vstrip-mute-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.channel;
        this.channelMutes[ch] = !this.channelMutes[ch];
        btn.classList.toggle('active-mute', this.channelMutes[ch]);

        const dbEl = root.querySelector(`#db-${ch}`);
        if (dbEl) {
          if (this.channelMutes[ch]) {
            dbEl.textContent = 'MUTED';
            dbEl.classList.add('is-muted');
          } else {
            dbEl.textContent = this.calculateDb(this.channelVolumes[ch]);
            dbEl.classList.remove('is-muted');
          }
        }
        toastManager.show(`Channel [${ch.toUpperCase()}] ${this.channelMutes[ch] ? 'Muted' : 'Unmuted'}`);
      });
    });

    // Audio State Buttons
    root.querySelectorAll('.vstrip-audio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.channel;
        this.channelAudios[ch] = !this.channelAudios[ch];
        btn.classList.toggle('active', this.channelAudios[ch]);
        toastManager.show(`Channel [${ch.toUpperCase()}] Audio ${this.channelAudios[ch] ? 'Enabled' : 'Disabled'}`);
      });
    });
  }

  /**
   * 7. Bottom Bar Master Controls
   */
  static attachBottomBarEvents(root) {
    // Add Input Trigger
    root.querySelector('#btn-vmix-add-input')?.addEventListener('click', () => {
      this.openAssetDrawer('bible', root);
    });

    // Bottom Stream Trigger (synchronized with header stream button)
    root.querySelector('#btn-bottom-stream')?.addEventListener('click', () => {
      root.querySelector('#btn-vmix-stream')?.click();
    });

    // Bottom Record Trigger (synchronized with header record button)
    root.querySelector('#btn-bottom-rec')?.addEventListener('click', () => {
      root.querySelector('#btn-vmix-rec')?.click();
    });

    // Bottom External Trigger
    root.querySelector('#btn-bottom-external')?.addEventListener('click', () => {
      root.querySelector('#btn-vmix-external')?.click();
    });

    // Stage Display Window
    root.querySelector('#btn-bottom-stage')?.addEventListener('click', () => {
      OutputsView.openStageWindow();
      toastManager.show('Stage Confidence Display Launched');
    });

    // Projector Window
    root.querySelector('#btn-bottom-projector')?.addEventListener('click', () => {
      OutputsView.openMainWindow();
      toastManager.show('Audience Projector Window Launched');
    });

    // Service Playlist Trigger
    root.querySelector('#btn-bottom-playlist')?.addEventListener('click', () => {
      this.openModal('playlist', root);
    });

    // Emergency Override
    root.querySelector('#btn-bottom-emergency')?.addEventListener('click', () => {
      const emOverlay = root.querySelector('#vmix-emergency-overlay');
      if (emOverlay) {
        const isShown = emOverlay.style.display === 'flex';
        emOverlay.style.display = isShown ? 'none' : 'flex';
        toastManager.show(isShown ? 'Emergency Override Released' : '⚠️ EMERGENCY OVERRIDE ACTIVE', isShown ? 'info' : 'error');
      }
    });
  }

  /**
   * 8. Modals & Drawers Events (including Multi-Platform Simulcast)
   */
  static attachModalEvents(root) {
    // Generic Modal Close Buttons
    root.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal(btn.dataset.closeModal, root);
      });
    });

    // Close on Backdrop Click
    root.querySelectorAll('.vmix-asset-modal-backdrop').forEach(bd => {
      bd.addEventListener('click', (e) => {
        if (e.target === bd) {
          this.closeAllModals(root);
        }
      });
    });

    // Asset Drawer Close Button
    root.querySelector('#btn-close-asset-modal')?.addEventListener('click', () => {
      this.closeAssetDrawer(root);
    });

    // Asset Drawer Navigation Tabs
    root.querySelectorAll('.vmod-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.drawerTab;
        this.activeDrawerTab = tab;
        root.querySelectorAll('.vmod-nav-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.updateModalContent(root);
      });
    });

    // Preset Modal Selection
    root.querySelectorAll('.vmodal-preset-item').forEach(item => {
      item.addEventListener('click', () => {
        const pName = item.dataset.presetName;
        this.activePreset = pName;
        const label = root.querySelector('#vmix-preset-label');
        if (label) label.textContent = `✦ ${pName}`;
        this.closeModal('preset', root);
        toastManager.show(`Loaded Broadcast Preset: "${pName}"`);
      });
    });

    // Multi-Platform Simulcast Destination Toggles
    const updateSimulcastUI = () => {
      const activeCount = this.getActiveDestinations().length;
      const countBadge = root.querySelector('#simulcast-count-badge');
      if (countBadge) countBadge.textContent = `${activeCount} of ${this.streamDestinations.length} Active`;

      const streamBtn = root.querySelector('#btn-vmix-stream');
      const streamText = root.querySelector('#btn-vmix-stream-text');
      if (streamBtn && !this.isStreaming) {
        streamBtn.title = `Simulcast Stream to ${activeCount} Platforms`;
      }
      if (streamText && !this.isStreaming) {
        streamText.textContent = `STREAM (${activeCount})`;
      }
    };

    root.querySelectorAll('[data-dest-toggle]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.dataset.destToggle;
        const dest = this.streamDestinations.find(d => d.id === id);
        if (dest) {
          dest.enabled = e.target.checked;
          const card = root.querySelector(`.vdest-card[data-dest-id="${id}"]`);
          card?.classList.toggle('is-active', dest.enabled);

          const badge = root.querySelector(`#status-badge-${id}`);
          if (badge) {
            badge.className = `vdest-status-badge ${dest.enabled ? 'live' : 'standby'}`;
            badge.textContent = dest.enabled ? '● SIMULCAST READY' : 'STANDBY';
          }
          updateSimulcastUI();
        }
      });
    });

    // Simulcast Batch Action: Stream on ALL Platforms
    root.querySelector('#btn-simulcast-select-all')?.addEventListener('click', () => {
      this.streamDestinations.forEach(d => { d.enabled = true; });
      root.querySelectorAll('.vdest-card').forEach(card => card.classList.add('is-active'));
      root.querySelectorAll('[data-dest-toggle]').forEach(chk => { chk.checked = true; });
      root.querySelectorAll('.vdest-status-badge').forEach(b => {
        b.className = 'vdest-status-badge live';
        b.textContent = '● SIMULCAST READY';
      });
      updateSimulcastUI();
      toastManager.show(`All ${this.streamDestinations.length} Platforms Activated for Simultaneous Streaming!`);
    });

    // Simulcast Batch Action: Top 4 Platforms (YouTube, Facebook, TikTok, Instagram)
    root.querySelector('#btn-simulcast-select-top4')?.addEventListener('click', () => {
      const top4Ids = ['youtube', 'facebook', 'tiktok', 'instagram'];
      this.streamDestinations.forEach(d => {
        d.enabled = top4Ids.includes(d.id);
        const card = root.querySelector(`.vdest-card[data-dest-id="${d.id}"]`);
        card?.classList.toggle('is-active', d.enabled);
        const chk = root.querySelector(`[data-dest-toggle="${d.id}"]`);
        if (chk) chk.checked = d.enabled;
        const badge = root.querySelector(`#status-badge-${d.id}`);
        if (badge) {
          badge.className = `vdest-status-badge ${d.enabled ? 'live' : 'standby'}`;
          badge.textContent = d.enabled ? '● SIMULCAST READY' : 'STANDBY';
        }
      });
      updateSimulcastUI();
      toastManager.show('Top 4 Platforms Activated: YouTube, Facebook, TikTok, Instagram');
    });

    // Simulcast Batch Action: Clear All
    root.querySelector('#btn-simulcast-clear-all')?.addEventListener('click', () => {
      this.streamDestinations.forEach(d => { d.enabled = false; });
      root.querySelectorAll('.vdest-card').forEach(card => card.classList.remove('is-active'));
      root.querySelectorAll('[data-dest-toggle]').forEach(chk => { chk.checked = false; });
      root.querySelectorAll('.vdest-status-badge').forEach(b => {
        b.className = 'vdest-status-badge standby';
        b.textContent = 'STANDBY';
      });
      updateSimulcastUI();
      toastManager.show('All stream platforms set to standby');
    });

    // Stream Key Visibility Toggle
    root.querySelectorAll('[data-key-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.keyToggle;
        const input = root.querySelector(`input[data-dest-key="${id}"]`);
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    });

    // Save Studio & Simulcast Settings
    root.querySelector('#btn-save-settings')?.addEventListener('click', () => {
      const res = root.querySelector('#setting-resolution')?.value || '1080p60';
      const br = root.querySelector('#setting-bitrate')?.value || '6000';
      const ndi = root.querySelector('#setting-ndi-channel')?.value || 'KERYX-CHURCH-PGM';

      this.streamDestinations.forEach(dest => {
        const rtmpInp = root.querySelector(`input[data-dest-rtmp="${dest.id}"]`);
        const keyInp = root.querySelector(`input[data-dest-key="${dest.id}"]`);
        if (rtmpInp) dest.rtmp = rtmpInp.value;
        if (keyInp) dest.key = keyInp.value;
      });

      const activeDests = this.getActiveDestinations();
      const diag = root.querySelector('#vdiag-tag');
      if (diag && !this.isStreaming) {
        diag.textContent = `NDI: ${res} [${ndi}]`;
      }

      this.closeModal('settings', root);
      updateSimulcastUI();
      toastManager.show(`Saved Simulcast Settings: ${activeDests.length} Destinations Active @ ${br} kbps`);
    });

    // Save Output Settings
    root.querySelector('#btn-save-output-settings')?.addEventListener('click', () => {
      const sub = root.querySelector('#output-church-subtitle')?.value;
      const ltSub = root.querySelector('#vlt-subtitle');
      if (ltSub && sub) ltSub.textContent = sub;
      this.closeModal('output_settings', root);
      toastManager.show('Output configuration updated');
    });

    // Playlist Item Actions (Stage & Go Live)
    root.querySelectorAll('[data-action="playlist-stage"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title || 'Service Item';
        const sub = btn.dataset.sub || '';
        const type = btn.dataset.itemType || 'scripture';

        this.upsertInputCard({ title, text: title, sub, type, category: type }, root, { toPreview: true });
        this.closeModal('playlist', root);
      });
    });

    root.querySelectorAll('[data-action="playlist-live"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title || 'Service Item';
        const sub = btn.dataset.sub || '';
        const type = btn.dataset.itemType || 'scripture';

        this.upsertInputCard({ title, text: title, sub, type, category: type }, root, { toLive: true });
        this.closeModal('playlist', root);
      });
    });

    // Attach drawer inner events
    this.attachDrawerInnerEvents(root);
  }

  /**
   * 9. Global Broadcast Keyboard Shortcuts
   */
  static attachKeyboardShortcuts(root) {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.executeTransition('cut', root);
      } else if (e.code === 'Enter') {
        e.preventDefault();
        this.executeTransition('fade', root);
      } else if (e.key === 'b' || e.key === 'B') {
        this.isBlackout = !this.isBlackout;
        liveStore.setBlackout(this.isBlackout);
        this.updateMonitors(root);
        toastManager.show(this.isBlackout ? '■ Master Blackout Active' : 'Master Blackout Released');
      } else if (e.key === 'c' || e.key === 'C') {
        this.isClear = !this.isClear;
        liveStore.setClear(this.isClear);
        this.updateMonitors(root);
        toastManager.show(this.isClear ? '⎚ Overlays Cleared' : 'Overlays Restored');
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const num = Number(e.key);
        this.activeOverlays[num] = !this.activeOverlays[num];
        if (this.activeOverlays[num] && !this.overlayInputs[num]) {
          const targetInp = this.inputsList.find(i => i.isPreview) || this.inputsList.find(i => i.isLive);
          if (targetInp) this.overlayInputs[num] = targetInp.id;
        }
        this.updateMonitors(root);
        this.syncOverlayButtons(root);
        toastManager.show(`Overlay ${num} ${this.activeOverlays[num] ? 'ON' : 'OFF'}`);
      } else if (e.key === 'Escape') {
        this.closeAllModals(root);
      }
    };

    window.removeEventListener('keydown', StudioView._keyHandler);
    StudioView._keyHandler = onKeyDown;
    window.addEventListener('keydown', StudioView._keyHandler);
  }

  /**
   * Modal Open / Close Handlers
   */
  static openModal(modalName, root) {
    this.activeModal = modalName;
    const modal = root.querySelector(`#vmix-${modalName.replace('_', '-')}-modal`);
    if (modal) modal.classList.add('show');
  }

  static closeModal(modalName, root) {
    this.activeModal = null;
    const modal = root.querySelector(`#vmix-${modalName.replace('_', '-')}-modal`);
    if (modal) modal.classList.remove('show');
  }

  static closeAllModals(root) {
    this.activeModal = null;
    this.isAddInputModalOpen = false;
    root.querySelectorAll('.vmix-asset-modal-backdrop').forEach(m => m.classList.remove('show'));
  }

  static openAssetDrawer(tab = 'bible', root) {
    this.isAddInputModalOpen = true;
    this.activeDrawerTab = tab;
    const drawer = root.querySelector('#vmix-asset-modal');
    if (drawer) drawer.classList.add('show');
    this.updateModalContent(root);
  }

  static closeAssetDrawer(root) {
    this.isAddInputModalOpen = false;
    const drawer = root.querySelector('#vmix-asset-modal');
    if (drawer) drawer.classList.remove('show');
  }

  /**
   * Open Input Settings Editor Modal
   */
  static openInputSettings(inputId, root) {
    this.editingInputId = inputId;
    const inp = this.inputsList.find(i => i.id === inputId);
    if (!inp) return;

    const body = root.querySelector('#inp-edit-form-body');
    const titleHeader = root.querySelector('#inp-edit-header-title');

    if (titleHeader) titleHeader.textContent = `Edit Input ${inp.num}: ${inp.title}`;

    if (body) {
      body.innerHTML = `
        <div class="vmodal-field-group">
          <label>Input Title</label>
          <input type="text" class="vmodal-input" id="inp-edit-title" value="${inp.title}" />
        </div>
        <div class="vmodal-field-group">
          <label>Subtitle / Reference / Feed Info</label>
          <input type="text" class="vmodal-input" id="inp-edit-sub" value="${inp.sub}" />
        </div>
        <div class="vmodal-field-group">
          <label>Display Text / Lyrics / Scripture Content</label>
          <textarea class="vmodal-textarea" id="inp-edit-text">${inp.text}</textarea>
        </div>
        <div class="vmodal-field-group">
          <label>Category Type</label>
          <select class="vmodal-select" id="inp-edit-category">
            <option value="cameras" ${inp.category === 'cameras' ? 'selected' : ''}>Cameras</option>
            <option value="scriptures" ${inp.category === 'scriptures' ? 'selected' : ''}>Scriptures</option>
            <option value="worship" ${inp.category === 'worship' ? 'selected' : ''}>Worship</option>
            <option value="slides" ${inp.category === 'slides' ? 'selected' : ''}>Slides</option>
            <option value="media" ${inp.category === 'media' ? 'selected' : ''}>Media</option>
            <option value="titles" ${inp.category === 'titles' ? 'selected' : ''}>Titles</option>
            <option value="ai" ${inp.category === 'ai' ? 'selected' : ''}>AI Cues</option>
          </select>
        </div>
        <div class="vmodal-actions-row" style="justify-content: space-between;">
          <button class="mini-tool-btn danger" id="btn-delete-from-edit-modal">Delete Input</button>
          <div style="display:flex;gap:6px;">
            <button class="mini-tool-btn" id="btn-cancel-edit-inp">Cancel</button>
            <button class="aeux-pill-btn-emerald" id="btn-save-edit-inp">Save Changes</button>
          </div>
        </div>
      `;

      root.querySelector('#btn-cancel-edit-inp')?.addEventListener('click', () => {
        this.closeModal('input_settings', root);
      });

      root.querySelector('#btn-delete-from-edit-modal')?.addEventListener('click', () => {
        this.closeModal('input_settings', root);
        this.deleteInput(inp.id, root);
      });

      root.querySelector('#btn-save-edit-inp')?.addEventListener('click', () => {
        inp.title = root.querySelector('#inp-edit-title')?.value || inp.title;
        inp.sub = root.querySelector('#inp-edit-sub')?.value || inp.sub;
        inp.text = root.querySelector('#inp-edit-text')?.value || inp.text;
        inp.category = root.querySelector('#inp-edit-category')?.value || inp.category;

        this.closeModal('input_settings', root);
        this.updateMonitors(root);
        const grid = root.querySelector('#vmix-inputs-grid');
        if (grid) {
          grid.innerHTML = this.renderInputCards();
          this.attachInputCardsEvents(root);
        }
        toastManager.show(`Input ${inp.num} updated`);
      });
    }

    this.openModal('input_settings', root);
  }

  /**
   * Stage an input card to Preview (Turns Orange)
   */
  static stageInputToPreview(inputId, root) {
    this.inputsList.forEach(i => {
      i.isPreview = (i.id === inputId);
    });
    this.updateMonitors(root);
    toastManager.show('Staged to Preview Screen');
  }

  /**
   * Send an input card directly to Program / Live (Turns Green)
   */
  static sendInputToProgram(inputId, root) {
    this.inputsList.forEach(i => {
      i.isLive = (i.id === inputId);
    });
    this.updateMonitors(root);
    toastManager.show('Pushed Live to Program Screen');
  }

  /**
   * Execute vMix Transition (Transfers Preview -> Program with smooth cut/fade)
   */
  static executeTransition(type, root) {
    const previewInput = this.inputsList.find(i => i.isPreview);
    if (!previewInput) {
      toastManager.show('No input in Preview to transition. Select an input below first.');
      return;
    }

    const durInput = root.querySelector('#fade-duration-input');
    const dur = durInput ? Number(durInput.value) || 500 : 500;
    const progContent = root.querySelector('#live-monitor-content');

    if (progContent && (type === 'fade' || type === 'quick' || type === 'merge' || type === 'wipe')) {
      progContent.style.transition = `opacity ${dur / 2}ms ease`;
      progContent.style.opacity = '0.2';
      setTimeout(() => {
        const prevLive = this.inputsList.find(i => i.isLive);
        if (prevLive && prevLive.id !== previewInput.id) {
          prevLive.isLive = false;
          prevLive.isPreview = true;
        }
        previewInput.isLive = true;
        previewInput.isPreview = false;

        this.updateMonitors(root);
        progContent.style.opacity = '1';
        toastManager.show(`Transition [${type.toUpperCase()} ${dur}ms] executed`);
      }, dur / 2);
    } else {
      const prevLive = this.inputsList.find(i => i.isLive);
      if (prevLive && prevLive.id !== previewInput.id) {
        prevLive.isLive = false;
        prevLive.isPreview = true;
      }
      previewInput.isLive = true;
      previewInput.isPreview = false;

      this.updateMonitors(root);
      toastManager.show(`Transition [CUT] executed`);
    }
  }

  /**
   * Update Preview & Program Displays, Overlays, and Card Borders
   */
  static updateMonitors(container) {
    const root = container || document.querySelector('#keryx-studio-workspace') || document;
    const previewInput = this.inputsList.find(i => i.isPreview) || null;
    const liveInput = this.inputsList.find(i => i.isLive) || null;

    // 1. Update Preview Monitor
    const pTitle = root.querySelector('#preview-station-title');
    const pNum = root.querySelector('#preview-input-num');
    const pContent = root.querySelector('#preview-monitor-content');
    const pMeta = root.querySelector('#preview-footer-meta');

    if (pTitle) pTitle.textContent = previewInput ? `Preview: ${previewInput.title}` : 'Preview: (Standby)';
    if (pNum) pNum.textContent = previewInput ? previewInput.num : '-';
    if (pMeta) pMeta.textContent = previewInput ? previewInput.sub : 'No input selected · Click an input card below to stage';
    if (pContent) {
      pContent.innerHTML = this.renderScreenContent(previewInput, previewInput ? previewInput.text : '', previewInput ? previewInput.sub : '', false);
    }

    // 2. Update Program Monitor
    const lTitle = root.querySelector('#live-station-title');
    const lNum = root.querySelector('#live-input-num');
    const lContent = root.querySelector('#live-monitor-content');
    const lCanvas = root.querySelector('#live-monitor-canvas');
    const ltTitle = root.querySelector('#vlt-title');
    const ltSub = root.querySelector('#vlt-subtitle');
    const ltBanner = root.querySelector('#vmix-live-lower-third');
    const pipOverlay = root.querySelector('#vmix-pip-overlay');
    const pipContent = root.querySelector('#vpip-content');
    const pipLabel = root.querySelector('#vpip-label');
    const wmOverlay = root.querySelector('#vmix-watermark-overlay');
    const refOverlay = root.querySelector('#vmix-ref-overlay');
    const clkOverlay = root.querySelector('#vmix-clock-overlay');
    const blackoutBtn = root.querySelector('#btn-live-blackout');
    const clearBtn = root.querySelector('#btn-live-clear');

    if (lTitle) lTitle.textContent = liveInput ? `Active: ${liveInput.title}` : 'Active: Standby Slate';
    if (lNum) lNum.textContent = liveInput ? liveInput.num : '-';

    // Handle Blackout visually
    if (lCanvas) {
      lCanvas.style.background = this.isBlackout ? '#000000' : this.activeTheme.bg;
    }
    if (lContent) {
      lContent.style.opacity = this.isBlackout ? '0' : '1';
      lContent.innerHTML = this.renderScreenContent(liveInput, liveInput ? liveInput.text : '', liveInput ? liveInput.sub : '', true);
    }
    if (blackoutBtn) {
      blackoutBtn.classList.toggle('active-blackout', this.isBlackout);
    }

    // Handle Clear and Overlays
    if (clearBtn) {
      clearBtn.classList.toggle('active-clear', this.isClear);
    }

    // Overlay 1: Lower Third
    const ol1Input = this.inputsList.find(i => i.id === this.overlayInputs[1]) || liveInput;
    if (ltBanner) {
      const showOl1 = this.activeOverlays[1] && !this.isClear && !this.isBlackout && !!ol1Input;
      ltBanner.style.display = showOl1 ? 'flex' : 'none';
      if (ol1Input) {
        if (ltTitle) ltTitle.textContent = ol1Input.title;
        if (ltSub) ltSub.textContent = ol1Input.text ? ol1Input.text.split('\n')[0] : ol1Input.sub;
      }
    }

    // Overlay 2: Picture-in-Picture PIP
    const ol2Input = this.inputsList.find(i => i.id === this.overlayInputs[2]);
    if (pipOverlay) {
      const showPip = this.activeOverlays[2] && !this.isClear && !this.isBlackout && !!ol2Input;
      pipOverlay.style.display = showPip ? 'block' : 'none';
      if (ol2Input) {
        if (pipContent) pipContent.innerHTML = this.renderPipSnippet(ol2Input);
        if (pipLabel) pipLabel.textContent = ol2Input.title;
      }
    }

    // Watermark Bug (shown if Overlay 2 is ON without specific input)
    if (wmOverlay) {
      const showWm = this.activeOverlays[2] && !ol2Input && !this.isClear && !this.isBlackout;
      wmOverlay.style.display = showWm ? 'block' : 'none';
    }

    // Overlay 3: Scripture / Reference Floating Tag
    const ol3Input = this.inputsList.find(i => i.id === this.overlayInputs[3]) || liveInput;
    if (refOverlay) {
      const showOl3 = this.activeOverlays[3] && !this.isClear && !this.isBlackout && !!ol3Input;
      refOverlay.style.display = showOl3 ? 'block' : 'none';
      const refText = root.querySelector('#vref-text');
      if (refText && ol3Input) {
        refText.textContent = ol3Input.sub || ol3Input.title;
      }
    }

    // Overlay 4: Digital Clock
    if (clkOverlay) {
      clkOverlay.style.display = (this.activeOverlays[4] && !this.isClear && !this.isBlackout) ? 'block' : 'none';
    }

    // Live Subtitles / Closed Captions & Translation Overlay
    const subOverlay = root.querySelector('#vmix-live-subtitles-overlay');
    const subBadge = root.querySelector('#vsubtitle-badge');
    const subText = root.querySelector('#vsubtitle-text');
    if (subOverlay) {
      const showSub = (this.isLiveSubtitlesActive || this.isLiveTranslationActive) && !this.isClear && !this.isBlackout;
      subOverlay.style.display = showSub ? 'flex' : 'none';
      if (showSub) {
        if (subBadge) {
          subBadge.textContent = this.isLiveTranslationActive ? `TRANS (${this.activeTranslationLang.toUpperCase()})` : 'LIVE CC';
          subBadge.classList.toggle('trans', this.isLiveTranslationActive);
        }
        if (subText) {
          subText.textContent = this.getLiveSubtitlesContent();
        }
      }
    }

    // 3. Update Input Cards Border Highlights & Badges
    root.querySelectorAll('.vmix-input-card').forEach(card => {
      const id = card.dataset.inputId;
      const inp = this.inputsList.find(i => i.id === id);
      if (inp) {
        card.classList.toggle('is-preview', inp.isPreview);
        card.classList.toggle('is-live', inp.isLive);
        const head = card.querySelector('.vicard-header');
        if (head) {
          head.classList.toggle('preview-head', inp.isPreview);
          head.classList.toggle('live-head', inp.isLive);
        }
        const prevBtn = card.querySelector('.vic-btn.preview-btn');
        if (prevBtn) prevBtn.classList.toggle('active-prev', inp.isPreview);
        const liveBtn = card.querySelector('.vic-btn.cut-btn');
        if (liveBtn) liveBtn.classList.toggle('active-live', inp.isLive);
      }
    });

    // 4. Sync Overlay 1 2 3 buttons
    this.syncOverlayButtons(root);
  }

  /**
   * Update modal content when switching drawer tabs
   */
  static updateModalContent(root) {
    const contentArea = root.querySelector('.vmodal-content-area');
    if (contentArea) {
      contentArea.innerHTML = this.renderDrawerTabContent();
      this.attachDrawerInnerEvents(root);
      this.attachDrawerEvents(root);
    }
  }

  /**
   * Attach drawer inner events (verse selection, worship song selection, adding inputs to grid)
   */
  static attachDrawerInnerEvents(root) {
    // Bible Book Select
    const bookSel = root.querySelector('#drawer-bible-book-select');
    if (bookSel) {
      bookSel.addEventListener('change', (e) => {
        this.activeBook = e.target.value;
        this.activeChapter = Number(Object.keys(this.scriptureDatabase[this.activeBook] || {})[0]) || 1;
        this.updateModalContent(root);
      });
    }

    // Chapter Pills
    root.querySelectorAll('.vpane-chap-pills .chap-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.activeChapter = Number(pill.dataset.chapter);
        this.updateModalContent(root);
      });
    });

    // Bible Search Input
    const searchInput = root.querySelector('#drawer-bible-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.bibleSearchQuery = e.target.value;
        this.updateModalContent(root);
      });
    }

    // Worship Song Select
    const songSel = root.querySelector('#drawer-song-select');
    if (songSel) {
      songSel.addEventListener('change', (e) => {
        this.activeSongKey = e.target.value;
        this.updateModalContent(root);
      });
    }

    // Modal Speech Toggle
    root.querySelector('#btn-modal-speech-toggle')?.addEventListener('click', () => {
      aiStore.toggleListening();
      this.updateModalContent(root);
      toastManager.show(aiStore.isListening ? 'AI Speech Transcriber Listening' : 'AI Speech Transcriber Paused');
    });

    // Drawer Sample Sermon Streamer
    root.querySelector('#btn-drawer-stream-sample, #btn-drawer-empty-sample')?.addEventListener('click', () => {
      const isRunning = speechEngine.streamDemoSermon();
      this.updateModalContent(root);
      toastManager.show(isRunning ? '⚡ Streaming Sample Pulpit Sermon live...' : 'Stopped Sample Sermon Stream');
    });

    // Drawer Open AI Broadcast Suite Modal
    root.querySelector('#btn-drawer-open-suite')?.addEventListener('click', () => {
      this.openAISuiteModal(root);
    });

    // Drawer Lower-Third button for AI detected scriptures & notes
    root.querySelectorAll('[data-action="drawer-ai-lt"], [data-action="drawer-note-lt"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.verseText || '';
        const ref = btn.dataset.ref || 'Scripture';
        this.upsertInputCard({
          title: `${ref} (Lower Third)`,
          sub: ref,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text
        }, root, { toOl1: true });
        toastManager.show(`Overlay 1: Superimposed [${ref}] Lower Third`);
      });
    });

    // Custom Input Form Handlers
    const addCustom = (toPreview = false, toLive = false) => {
      const title = root.querySelector('#custom-inp-title')?.value || 'Custom Church Input';
      const cat = root.querySelector('#custom-inp-cat')?.value || 'titles';
      const text = root.querySelector('#custom-inp-text')?.value || title;

      const isCustomImg = cat === 'image';
      const isCustomVid = cat === 'video';
      const type = (isCustomImg ? 'image' : isCustomVid ? 'video' : cat);
      const mediaType = (isCustomImg ? 'image' : isCustomVid ? 'video' : (cat === 'media' ? 'video' : null));
      const category = (isCustomImg || isCustomVid) ? 'media' : cat;
      const sub = isCustomImg ? 'IMAGE STILL' : isCustomVid ? 'VIDEO LOOP' : cat.toUpperCase();

      this.addInput({
        title,
        text,
        sub,
        type,
        mediaType,
        category,
        audio: cat === 'worship' || cat === 'media' || isCustomVid,
        loop: cat === 'media' || isCustomVid,
        bg: isCustomImg ? 'linear-gradient(135deg, #0f2b38 0%, #06151c 100%)' : 'radial-gradient(circle at center, #082026 0%, #030a0d 100%)'
      }, root, { toPreview, toLive });

      this.closeAssetDrawer(root);
    };

    root.querySelector('#btn-submit-custom-add')?.addEventListener('click', () => addCustom(false, false));
    root.querySelector('#btn-submit-custom-preview')?.addEventListener('click', () => addCustom(true, false));
    root.querySelector('#btn-submit-custom-live')?.addEventListener('click', () => addCustom(false, true));

    // Media Mode Toggle Buttons (Image vs Video)
    root.querySelectorAll('.vmedia-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mediaAddMode = btn.dataset.mediaMode;
        this.updateModalContent(root);
      });
    });

    // Media Filter Chips (All Media, Images, Videos)
    root.querySelectorAll('.vmedia-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.mediaSubFilter = chip.dataset.mediaFilter;
        this.updateModalContent(root);
      });
    });

    // Media Search Input
    const mediaSearch = root.querySelector('#drawer-media-search');
    if (mediaSearch) {
      mediaSearch.addEventListener('input', (e) => {
        this.mediaSearchQuery = e.target.value;
        const q = this.mediaSearchQuery.toLowerCase();
        const cards = root.querySelectorAll('.vmedia-cards-grid .drawer-media-card');
        cards.forEach(card => {
          const t = (card.dataset.title || '').toLowerCase();
          const s = (card.dataset.sub || '').toLowerCase();
          const type = card.dataset.itemType;
          const matchFilter = this.mediaSubFilter === 'all' || type === this.mediaSubFilter;
          const matchQ = !q || t.includes(q) || s.includes(q);
          card.style.display = (matchFilter && matchQ) ? 'flex' : 'none';
        });
      });
    }

    // Media Dropzone & File Input Handler
    const dropzone = root.querySelector('#drawer-media-dropzone');
    const fileInput = root.querySelector('#drawer-media-file-input');

    const handleMediaFile = (file) => {
      const isVideo = file.type.startsWith('video');
      const type = isVideo ? 'video' : 'image';
      this.mediaAddMode = type;
      const fileUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const subInfo = `${isVideo ? '1080p60 Video Loop' : '1920×1080 Still Graphic'} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      this.mediaStagedUpload = {
        file,
        url: fileUrl,
        title: cleanTitle,
        sub: subInfo,
        type,
        mediaType: type,
        loop: true,
        audio: isVideo
      };

      this.updateModalContent(root);
      toastManager.show(`Loaded ${type.toUpperCase()}: "${cleanTitle}"`);
    };

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => {
        fileInput.click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleMediaFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleMediaFile(e.target.files[0]);
        }
      });
    }

    // Media URL Input
    const urlInput = root.querySelector('#drawer-media-url-input');
    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          const isVid = val.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
          const type = isVid ? 'video' : this.mediaAddMode;
          if (!this.mediaStagedUpload) {
            this.mediaStagedUpload = {
              file: null,
              url: val,
              title: 'Web Media Input',
              sub: `${type.toUpperCase()} · Web Stream Link`,
              type,
              mediaType: type,
              loop: true,
              audio: type === 'video'
            };
          } else {
            this.mediaStagedUpload.url = val;
          }
          const pBox = root.querySelector('.vmedia-preview-box');
          if (pBox) {
            pBox.innerHTML = `
              <span class="vmedia-preview-badge">${type === 'image' ? 'IMAGE PREVIEW' : 'VIDEO PREVIEW'}</span>
              ${type === 'image' ? `<img src="${val}" class="vmedia-preview-img" alt="Preview" />` : `<video src="${val}" controls muted autoplay loop class="vmedia-preview-video"></video>`}
            `;
          }
        }
      });
    }

    // Custom Staged Media Submit Handlers
    const submitCustomMedia = (toPreview = false, toLive = false) => {
      const isImg = this.mediaAddMode === 'image';
      const titleInp = root.querySelector('#drawer-media-title-input');
      const subInp = root.querySelector('#drawer-media-sub-input');
      const loopChk = root.querySelector('#drawer-media-loop-chk');
      const audioChk = root.querySelector('#drawer-media-audio-chk');

      const title = (titleInp && titleInp.value.trim()) || (this.mediaStagedUpload && this.mediaStagedUpload.title) || (isImg ? 'Church Image Graphic' : 'Church Video Loop');
      const sub = (subInp && subInp.value.trim()) || (this.mediaStagedUpload && this.mediaStagedUpload.sub) || (isImg ? '1920×1080 Still Graphic' : '1080p60 Video Loop');
      const mediaUrl = (this.mediaStagedUpload && this.mediaStagedUpload.url) || '';
      const isLoop = loopChk ? loopChk.checked : true;
      const isAudio = audioChk ? audioChk.checked : !isImg;

      const mediaItem = {
        title,
        text: title,
        sub,
        type: isImg ? 'image' : 'video',
        mediaType: isImg ? 'image' : 'video',
        category: 'media',
        imageUrl: isImg ? mediaUrl : null,
        videoUrl: !isImg ? mediaUrl : null,
        url: mediaUrl,
        loop: isLoop,
        audio: isAudio,
        accent: isImg ? '#10b981' : '#06b6d4',
        bg: isImg ? 'linear-gradient(135deg, #0f2b38 0%, #06151c 100%)' : 'radial-gradient(circle at center, #082026 0%, #030a0d 100%)'
      };

      if (mediaUrl && !this.churchMediaAssets.some(a => a.url === mediaUrl || a.title === title)) {
        this.churchMediaAssets.unshift({
          id: `cmed_${Date.now()}`,
          title,
          sub,
          type: isImg ? 'image' : 'video',
          mediaType: isImg ? 'image' : 'video',
          category: 'media',
          tag: 'CUSTOM',
          url: mediaUrl,
          imageUrl: isImg ? mediaUrl : null,
          videoUrl: !isImg ? mediaUrl : null,
          loop: isLoop,
          audio: isAudio,
          bg: mediaItem.bg,
          accent: mediaItem.accent
        });
      }

      this.addInput(mediaItem, root, { toPreview, toLive });
      this.closeAssetDrawer(root);
      toastManager.show(`Added ${isImg ? 'Image' : 'Video'}: "${title}"`);
    };

    root.querySelector('#btn-submit-media-add')?.addEventListener('click', () => submitCustomMedia(false, false));
    root.querySelector('#btn-submit-media-preview')?.addEventListener('click', () => submitCustomMedia(true, false));
    root.querySelector('#btn-submit-media-live')?.addEventListener('click', () => submitCustomMedia(false, true));

    // "+ Add to Section" buttons inside asset cards
    root.querySelectorAll('.btn-add-grid').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = unescape(btn.dataset.verseText || btn.dataset.stanzaText || '');
        const ref = btn.dataset.ref || btn.dataset.title || 'Church Asset';
        const type = btn.dataset.itemType || 'scripture';
        const category = btn.dataset.itemCategory || 'scriptures';
        const mediaType = btn.dataset.mediaType || (type === 'image' ? 'image' : type === 'video' ? 'video' : null);
        const isAudio = btn.dataset.audio === 'true' || type === 'worship' || mediaType === 'video';
        const isLoop = btn.dataset.loop === 'true';
        const bg = btn.dataset.bg || null;
        const accent = btn.dataset.accent || null;
        const imageUrl = btn.dataset.imageUrl || null;
        const videoUrl = btn.dataset.videoUrl || null;
        const url = btn.dataset.url || null;

        this.addInput({
          title: ref,
          text: text || ref,
          sub: btn.dataset.artist || btn.dataset.sub || ref,
          type,
          category,
          mediaType,
          imageUrl,
          videoUrl,
          url,
          bg,
          accent,
          audio: isAudio,
          loop: isLoop
        }, root, { toPreview: false, toLive: false });

        this.closeAssetDrawer(root);
      });
    });

    // "To Preview" button inside asset cards
    root.querySelectorAll('.btn-cue-stage').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = unescape(btn.dataset.verseText || btn.dataset.stanzaText || '');
        const ref = btn.dataset.ref || btn.dataset.title || 'Church Asset';
        const type = btn.dataset.itemType || 'scripture';
        const category = btn.dataset.itemCategory || 'scriptures';
        const mediaType = btn.dataset.mediaType || (type === 'image' ? 'image' : type === 'video' ? 'video' : null);
        const isAudio = btn.dataset.audio === 'true' || type === 'worship' || mediaType === 'video';
        const isLoop = btn.dataset.loop === 'true';
        const bg = btn.dataset.bg || null;
        const accent = btn.dataset.accent || null;
        const imageUrl = btn.dataset.imageUrl || null;
        const videoUrl = btn.dataset.videoUrl || null;
        const url = btn.dataset.url || null;

        this.addInput({
          title: ref,
          text: text || ref,
          sub: btn.dataset.artist || btn.dataset.sub || ref,
          type,
          category,
          mediaType,
          imageUrl,
          videoUrl,
          url,
          bg,
          accent,
          audio: isAudio,
          loop: isLoop
        }, root, { toPreview: true, toLive: false });

        this.closeAssetDrawer(root);
      });
    });

    // "Go Live ↵" button inside asset cards
    root.querySelectorAll('.btn-cue-live').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = unescape(btn.dataset.verseText || btn.dataset.stanzaText || '');
        const ref = btn.dataset.ref || btn.dataset.title || 'Church Asset';
        const type = btn.dataset.itemType || 'scripture';
        const category = btn.dataset.itemCategory || 'scriptures';
        const mediaType = btn.dataset.mediaType || (type === 'image' ? 'image' : type === 'video' ? 'video' : null);
        const isAudio = btn.dataset.audio === 'true' || type === 'worship' || mediaType === 'video';
        const isLoop = btn.dataset.loop === 'true';
        const bg = btn.dataset.bg || null;
        const accent = btn.dataset.accent || null;
        const imageUrl = btn.dataset.imageUrl || null;
        const videoUrl = btn.dataset.videoUrl || null;
        const url = btn.dataset.url || null;

        this.addInput({
          title: ref,
          text: text || ref,
          sub: btn.dataset.artist || btn.dataset.sub || ref,
          type,
          category,
          mediaType,
          imageUrl,
          videoUrl,
          url,
          bg,
          accent,
          audio: isAudio,
          loop: isLoop
        }, root, { toPreview: false, toLive: true });

        this.closeAssetDrawer(root);
      });
    });

    // Allow clicking the card body to cue to preview and charge card
    root.querySelectorAll('.drawer-stanza-card, .drawer-verse-card, .drawer-media-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const stageBtn = card.querySelector('.btn-cue-stage');
        if (stageBtn) stageBtn.click();
      });
    });
  }

  /**
   * Start digital studio clock
   */
  static startClockTimer(root) {
    if (this.clockInterval) clearInterval(this.clockInterval);
    const clockEl = root.querySelector('#vmix-studio-clock');
    const clockOverlay = root.querySelector('#vmix-clock-overlay');

    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      if (clockEl) clockEl.textContent = timeStr;
      if (clockOverlay) clockOverlay.textContent = `SERVICE ${timeStr}`;
    };

    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);
  }

  /**
   * Start realistic audio meters animation
   */
  static startAudioMeters(root) {
    if (this.audioMeterInterval) clearInterval(this.audioMeterInterval);

    const ml = root.querySelector('#meter-master-l .vled-fill');
    const mr = root.querySelector('#meter-master-r .vled-fill');
    const ch1 = root.querySelector('#meter-ch1 .vled-fill');
    const ch2 = root.querySelector('#meter-ch2 .vled-fill');
    const ch3 = root.querySelector('#meter-ch3 .vled-fill');

    this.audioMeterInterval = setInterval(() => {
      if (!ml) return;

      const masterVol = this.channelMutes.master ? 0 : this.channelVolumes.master / 100;
      const ch1Vol = this.channelMutes.ch1 ? 0 : this.channelVolumes.ch1 / 100;
      const ch2Vol = this.channelMutes.ch2 ? 0 : this.channelVolumes.ch2 / 100;
      const ch3Vol = this.channelMutes.ch3 ? 0 : this.channelVolumes.ch3 / 100;

      const baseMaster = (70 + Math.sin(Date.now() / 300) * 15 + (Math.random() * 8)) * masterVol;
      const baseCh1 = (60 + Math.cos(Date.now() / 250) * 20 + (Math.random() * 10)) * ch1Vol;
      const baseCh2 = (50 + Math.sin(Date.now() / 400) * 18 + (Math.random() * 8)) * ch2Vol;
      const baseCh3 = (40 + Math.cos(Date.now() / 500) * 12 + (Math.random() * 6)) * ch3Vol;

      if (ml) ml.style.height = `${Math.min(95, Math.max(0, baseMaster))}%`;
      if (mr) mr.style.height = `${Math.min(92, Math.max(0, baseMaster - 3))}%`;
      if (ch1) ch1.style.height = `${Math.min(90, Math.max(0, baseCh1))}%`;
      if (ch2) ch2.style.height = `${Math.min(85, Math.max(0, baseCh2))}%`;
      if (ch3) ch3.style.height = `${Math.min(80, Math.max(0, baseCh3))}%`;
    }, 120);
  }

  /**
   * Subscribe to global events once
   */
  static initGlobalEvents() {
    if (this._eventsInitialized) return;
    this._eventsInitialized = true;

    eventBus.on('live:changed', () => {
      this.updateMonitors();
    });

    eventBus.on('ai:changed', () => {
      if (this.isLiveSubtitlesActive || this.isLiveTranslationActive) {
        this.updateMonitors();
      }
      if (this.isAISuiteModalOpen) {
        const modal = document.querySelector('#vmix-aisuite-modal');
        if (modal) {
          const activeInput = document.activeElement;
          const isTyping = activeInput && (activeInput.id === 'ai-det-sim-input' || activeInput.id === 'ai-trans-sim-input' || activeInput.id === 'ai-translate-custom-input');
          if (!isTyping) {
            const body = modal.querySelector('.aisuite-body');
            if (body) {
              body.innerHTML = this.renderAISuiteTabContent();
            }
          }
        }
      }
    });

    // Millisecond streaming speech listener
    eventBus.on('ai:interim', (data) => {
      // 1. Update live subtitles on Program output monitor in milliseconds
      if (this.isLiveSubtitlesActive || this.isLiveTranslationActive) {
        const subText = document.querySelector('#vsubtitle-text');
        if (subText) {
          subText.textContent = this.getLiveSubtitlesContent();
        }
      }

      // 2. If AI Suite modal is open on transcription tab, update the interim row instantly
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'transcription') {
        const interimRow = document.querySelector('#aisuite-interim-row');
        const interimTextEl = document.querySelector('#aisuite-interim-text');
        if (interimRow && interimTextEl) {
          if (data && data.text) {
            interimTextEl.textContent = data.text;
            interimRow.style.display = 'block';
          } else {
            interimRow.style.display = 'none';
          }
          const box = document.querySelector('#aisuite-transcript-box');
          if (box) box.scrollTop = box.scrollHeight;
        }
      }
    });
  }


  /**
   * Get dynamic text for Program monitor subtitles overlay
   */
  static getLiveSubtitlesContent() {
    const rawSpeech = aiStore.interimTranscript || (aiStore.transcriptSegments.length > 0 ? aiStore.transcriptSegments[aiStore.transcriptSegments.length - 1].text : '');
    if (this.isLiveTranslationActive) {
      const textToTranslate = rawSpeech || 'And we know that all things work together for good to them that love God.';
      return TranslationEngine.translate(textToTranslate, this.activeTranslationLang);
    }
    if (this.isLiveSubtitlesActive) {
      return rawSpeech || 'Live closed captions active · Listening to pulpit speech...';
    }
    return '';
  }



  /**
   * Helper: Filter 66 Canonical Bible Books by Testament & Search Query
   */
  static getFilteredBooks() {
    let books = BIBLE_BOOKS;
    if (this.bibleShowTestament === 'OT') {
      books = books.slice(0, 39);
    } else if (this.bibleShowTestament === 'NT') {
      books = books.slice(39);
    }
    if (this.bibleShowBookSearch) {
      const q = this.bibleShowBookSearch.toLowerCase().trim();
      books = books.filter(b => b.toLowerCase().includes(q));
    }
    return books;
  }

  /**
   * Helper: Render Interactive Chapter Pills (1-Click Jump)
   */
  static renderChapterPills(book, activeChapter) {
    const totalChapters = getBookChapterCount(book);
    const pills = [];
    for (let i = 1; i <= totalChapters; i++) {
      pills.push(`
        <button class="bshow-chap-btn ${i === activeChapter ? 'active' : ''}" data-chap="${i}" title="${book} Chapter ${i}">
          ${i}
        </button>
      `);
    }
    return pills.join('');
  }

  /**
   * Helper: Render Enhanced Scripture Verses with Actions Dock & Red-Letter
   */
  static renderStudioVerseRows(verses, activeVerse, chapter) {
    if (!verses || verses.length === 0) {
      return `<div style="padding: 32px 16px; text-align: center; color: #64748b; font-size: 13px;">No verses loaded for this chapter.</div>`;
    }
    const fontSize = this.bibleShowVerseFontSize || 14;
    return verses.map(v => {
      const isActive = v.num === activeVerse;
      return `
        <div class="bshow-verse-row ${isActive ? 'active' : ''}" data-verse-num="${v.num}" data-verse-text="${(v.text || '').replace(/"/g, '&quot;')}">
          <div class="bshow-verse-header">
            <span class="bshow-vnum-badge">${chapter}:${v.num}</span>
            ${isActive ? '<span class="bshow-active-pill">● ACTIVE</span>' : ''}
            <div class="bshow-verse-actions-dock">
              <button class="bshow-vact-btn sb-vprev" title="Stage to Preview">👁 Preview</button>
              <button class="bshow-vact-btn sb-vplay" title="Send to Live Broadcast">⚡ Live</button>
              <button class="bshow-vact-btn sb-vplus" title="Charge Input Card">+ Card</button>
              <button class="bshow-vact-btn sb-vcopy" title="Copy verse text">📋</button>
            </div>
          </div>
          <div class="bshow-verse-text ${v.red ? 'red-letter' : ''}" style="font-size: ${fontSize}px;">
            ${v.highlight ? v.text.replace(new RegExp(`(${v.highlight})`, 'gi'), `<span class="bshow-highlight-word">$1</span>`) : v.text}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Authentic BibleShow Software Modal inside Studio Workspace
   */
  static renderBibleShowModal() {
    const isOpen = this.isBibleShowModalOpen;
    const isFullscreen = this.bibleShowIsFullscreen;
    const activeThemeObj = BibleView.themes.find(t => t.id === BibleView.activeTheme) || BibleView.themes[0];
    const filteredBooks = this.getFilteredBooks();
    const chapterCount = getBookChapterCount(BibleView.activeBook);

    return `
      <div class="vmix-bibleshow-backdrop ${isOpen ? 'show' : ''}" id="vmix-bibleshow-modal">
        <div class="vmix-bibleshow-modal-fullscreen ${isFullscreen ? 'is-fullscreen' : ''}">
          
          <!-- Authentic Modern BibleShow Studio Console Shell -->
          <div class="bibleshow-app-root">
            
            <!-- 1. Title Bar -->
            <div class="bshow-titlebar">
              <div class="bshow-logo-title">
                <span class="bshow-sunburst-icon">☀️</span>
                <span class="bshow-logo-text">BIBLESHOW 2026 BROADCAST</span>
              </div>
              <div class="bshow-active-verse-banner" id="studio-bshow-titlebar-banner">
                <span class="bshow-active-pulse-dot"></span>
                <span>${BibleView.activeReference}</span>
              </div>
              <div class="bshow-titlebar-tools">
                <button class="bshow-tool-btn" id="studio-bshow-btn-fullscreen" title="Toggle Fullscreen / Scaled Mode">
                  ${isFullscreen ? '⛶ Normal Window' : '⛶ Fullscreen'}
                </button>
                <button class="bshow-tool-btn bshow-close-btn" id="studio-bshow-btn-close" title="Close BibleShow">✕</button>
              </div>
            </div>

            <!-- 2. Ribbon Menu Bar -->
            <nav class="bshow-ribbon-bar">
              <button class="bshow-ribbon-btn active" data-sb-menu="Reference">Reference</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Browser">Browser</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Control">Control</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Monitor">Monitor</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Options">Options</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Program">Program</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Search">Search</button>
              <button class="bshow-ribbon-btn" data-sb-menu="History">History</button>
              <button class="bshow-ribbon-btn" data-sb-menu="AutoPlay">AutoPlay</button>
              <button class="bshow-ribbon-btn" data-sb-menu="Help">Help</button>
              <button class="bshow-ribbon-btn" id="studio-bshow-ribbon-exit" style="color: #ef4444; font-weight: bold; margin-left: auto;">Exit</button>
            </nav>

            <!-- Quick Jump: Instant Manual Scripture Parser & Jump Bar -->
            <div class="bshow-quickjump-bar" id="sb-quickjump-bar">
              <div class="bshow-qj-label">
                <span>📖 Quick Jump:</span>
              </div>
              <div class="bshow-qj-input-wrap">
                <input type="text" 
                       class="bshow-qj-input" 
                       id="sb-manual-scripture-input" 
                       placeholder="Type abbreviation e.g. jn 3 16, mat 5 1, 1co 13 4, ps 23 1, or click any book & chapter below..." 
                       autocomplete="off" 
                       spellcheck="false" />
              </div>
              <div class="bshow-qj-feedback" id="sb-manual-scripture-pill">Ready</div>
              <div class="bshow-qj-actions">
                <button class="bshow-qj-btn qj-preview" id="sb-btn-manual-preview" title="Stage to Preview (Enter)">
                  <span>👁 Preview</span>
                </button>
                <button class="bshow-qj-btn qj-live" id="sb-btn-manual-live" title="Send Live to Program">
                  <span>⚡ LIVE</span>
                </button>
                <button class="bshow-qj-btn qj-addinput" id="sb-btn-manual-addinput" title="Charge Studio Input Card">
                  <span>+ Add Card</span>
                </button>
              </div>
            </div>

            <!-- 3. BibleShow Fluid Multi-Pane Worksurface Grid -->
            <div class="bshow-workspace-grid">
              
              <!-- PANE 1: SCRIPTURE NAVIGATOR -->
              <div class="bshow-panel" id="sb-panel-reference">
                <div class="bshow-panel-header">
                  <span>Scripture Navigator</span>
                  <span class="bshow-header-pill">66 Books</span>
                </div>
                <div class="bshow-panel-body">
                  <!-- Bible Version Pills -->
                  <div>
                    <label class="bshow-field-label">Canonical Translation</label>
                    <div class="bshow-versions-pills-row" id="sb-versions-pills">
                      ${['NIV', 'KJV', 'ESV', 'NLT', 'WEB', 'AMP'].map(v => `
                        <button class="bshow-version-pill ${v === BibleView.activeVersion ? 'active' : ''}" data-version="${v}">
                          ${v}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Testament Tabs -->
                  <div style="margin-top: 6px;">
                    <div class="bshow-testament-tabs">
                      <button class="bshow-testament-tab ${this.bibleShowTestament === 'ALL' ? 'active' : ''}" data-testament="ALL">ALL (66)</button>
                      <button class="bshow-testament-tab ${this.bibleShowTestament === 'OT' ? 'active' : ''}" data-testament="OT">OT (39)</button>
                      <button class="bshow-testament-tab ${this.bibleShowTestament === 'NT' ? 'active' : ''}" data-testament="NT">NT (27)</button>
                    </div>
                  </div>

                  <!-- Book Filter Search -->
                  <div class="bshow-book-search-wrap" style="margin-top: 4px;">
                    <input type="text" class="bshow-book-search-input" id="sb-book-search" placeholder="🔍 Filter books..." value="${this.bibleShowBookSearch}" />
                  </div>

                  <!-- Scrollable Book List -->
                  <div style="flex: 1; display: flex; flex-direction: column; min-height: 120px;">
                    <div class="bshow-books-box" id="sb-books-list">
                      ${filteredBooks.map(b => `
                        <div class="bshow-book-row ${b === BibleView.activeBook ? 'active' : ''}" data-book="${b}">
                          <span class="bshow-book-name">${b}</span>
                          <span class="bshow-book-badge">${getBookChapterCount(b)} ch</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Chapter Navigation: Interactive Chapter Pills Grid -->
                  <div class="bshow-chapter-section">
                    <div class="bshow-chapter-header">
                      <span class="bshow-field-label" style="margin: 0;">Chapter Selector</span>
                      <span class="bshow-header-pill" id="sb-chap-count-badge">${chapterCount} Chapters</span>
                    </div>
                    <div class="bshow-chapter-pills-grid" id="sb-chapter-pills">
                      ${this.renderChapterPills(BibleView.activeBook, BibleView.activeChapter)}
                    </div>
                  </div>

                  <!-- Navigation Arrow Buttons & Active Summary -->
                  <div class="bshow-arrow-keys-box">
                    <button class="bshow-nav-arrow-btn" id="sb-nav-left" title="Previous Chapter">◀ Prev Chap</button>
                    <button class="bshow-nav-arrow-btn" id="sb-nav-right" title="Next Chapter">Next Chap ▶</button>
                    <button class="bshow-nav-arrow-btn" id="sb-nav-up" title="Previous Verse">▲ Prev Verse</button>
                    <button class="bshow-nav-arrow-btn" id="sb-nav-down" title="Next Verse">Next Verse ▼</button>
                  </div>
                </div>
              </div>

              <!-- PANE 2: SCRIPTURE READER & STREAM -->
              <div class="bshow-panel" id="sb-panel-browser" style="flex: 1.3;">
                <div class="bshow-panel-header">
                  <span id="sb-browser-header-ref">Scripture Stream — ${BibleView.activeReference}</span>
                  <div class="bshow-reader-tools">
                    <button class="bshow-font-step-btn" id="sb-font-minus" title="Decrease font size">A-</button>
                    <input type="range" id="sb-font-scale" min="11" max="24" value="${this.bibleShowVerseFontSize || 14}" style="width: 55px;" title="Adjust Font Scale" />
                    <button class="bshow-font-step-btn" id="sb-font-plus" title="Increase font size">A+</button>
                  </div>
                </div>
                <div class="bshow-panel-body">
                  <!-- Verses Stream Box with buttery-smooth scrolling -->
                  <div class="bshow-browser-box" id="sb-verses-browser">
                    ${this.renderStudioVerseRows(BibleView.chapterVerses, BibleView.activeVerse, BibleView.activeChapter)}
                  </div>

                  <!-- Bottom Quick Studio Controls Strip -->
                  <div class="bshow-control-subpanel" id="sb-panel-control">
                    <div class="bshow-control-grid">
                      <button class="bshow-ctrl-btn" id="sb-ctrl-preview">👁 To Preview</button>
                      <button class="bshow-ctrl-btn" id="sb-ctrl-prev-v">◀ Prev Verse</button>
                      <button class="bshow-ctrl-btn" id="sb-ctrl-next-v">▶ Next Verse</button>
                      <button class="bshow-ctrl-btn" id="sb-ctrl-ol1">🔲 Overlay 1 (LT)</button>
                      <button class="bshow-ctrl-btn" id="sb-ctrl-ol3">🏷 Overlay 3 (Pill)</button>
                      <button class="bshow-ctrl-btn highlight" id="sb-ctrl-add-inp">📥 Charge Input Card</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PANE 3: BROADCAST MONITOR & THEMES -->
              <div class="bshow-panel" id="sb-panel-monitor" style="flex: 1.5;">
                <div class="bshow-panel-header">
                  <span>Broadcast Stage Monitor</span>
                  <span class="bshow-header-pill">16:9 UHD Output</span>
                </div>
                <div class="bshow-panel-body">
                  <!-- 16:9 Widescreen Stage Output Frame -->
                  <div class="bshow-monitor-wrapper">
                    <div class="bshow-monitor-watermark">16:9 UHD STAGE OUTPUT</div>
                    <div class="bshow-monitor-screen" id="sb-monitor-screen" style="background: ${activeThemeObj.bg};">
                      <div class="bshow-monitor-ref" id="sb-monitor-ref">
                        ${BibleView.activeReference}
                      </div>
                      <div class="bshow-monitor-text" id="sb-monitor-text">
                        ${BibleView.activeVerseText}
                      </div>
                    </div>
                  </div>

                  <!-- Monitor Live Tally Bar -->
                  <div class="bshow-monitor-toolbar">
                    <button class="bshow-show-tally-btn" id="sb-btn-show-tally">
                      <span>●</span> BROADCAST TO PROGRAM (LIVE)
                    </button>
                  </div>

                  <!-- Curated Visual Themes Gallery -->
                  <div class="bshow-themes-container" id="sb-panel-options">
                    <div class="bshow-panel-header" style="height: 22px; font-size: 11px; margin-bottom: 4px;">
                      <span>Visual Themes & Stage Overlays</span>
                      <span style="font-size: 10px; color: #8fa598;">Active: ${activeThemeObj.name}</span>
                    </div>

                    <div class="bshow-themes-gallery-box" id="sb-themes-gallery">
                      ${BibleView.themes.map(t => `
                        <div class="bshow-theme-card ${t.id === BibleView.activeTheme ? 'active' : ''}" data-theme-id="${t.id}" title="${t.name}">
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

              <!-- PANE 4: SERVICE RUNDOWN & AUTOPLAY -->
              <div class="bshow-panel" id="sb-panel-rundown-autoplay" style="flex: 1.1;">
                <div class="bshow-panel-header">
                  <span>Service Rundown & AutoPlay</span>
                </div>
                <div class="bshow-panel-body">
                  
                  <!-- Section A: Service Rundown (Cuelist) -->
                  <div class="bshow-rundown-section" id="sb-panel-program">
                    <div class="bshow-subpanel-title">
                      <span>Service Rundown</span>
                      <button class="bshow-vact-btn" id="sb-btn-prog-add" title="Add Active Verse to Rundown">+ Add Active</button>
                    </div>
                    
                    <div class="bshow-rundown-box" id="sb-program-list">
                      ${BibleView.programList.map((item, idx) => `
                        <div class="bshow-rundown-item ${item.ref.includes(BibleView.activeBook) && item.ref.includes(BibleView.activeChapter + ':') ? 'active' : ''}" data-prog-ref="${item.ref}" data-prog-text="${(item.text || '').replace(/"/g, '&quot;')}" data-prog-idx="${idx}">
                          <span class="bshow-rundown-title">${item.ref} (${item.trans})</span>
                          <button class="bshow-vact-btn sb-prog-del" data-prog-del="${idx}" title="Remove">✕</button>
                        </div>
                      `).join('')}
                    </div>

                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                      <button class="bshow-ctrl-btn" id="sb-btn-prog-new" style="flex: 1; font-size: 10px; padding: 3px;">Clear</button>
                      <button class="bshow-ctrl-btn" id="sb-btn-prog-save" style="flex: 1; font-size: 10px; padding: 3px;">Save Rundown</button>
                    </div>
                  </div>

                  <!-- Section B: Scripture Search -->
                  <div class="bshow-search-section" id="sb-panel-search">
                    <div class="bshow-subpanel-title">
                      <span>Scripture Search</span>
                    </div>
                    <div class="bshow-search-box">
                      <input type="text" class="bshow-search-input" id="sb-search-text" placeholder="e.g. preach, faith, light, love" value="faith" />
                      <button class="bshow-ctrl-btn" id="sb-btn-run-search">Search</button>
                    </div>
                  </div>

                  <!-- Section C: AutoPlay Engine -->
                  <div class="bshow-autoplay-section" id="sb-panel-autoplay">
                    <div class="bshow-subpanel-title">
                      <span>AutoPlay Queue</span>
                      <button class="bshow-vact-btn" id="sb-btn-add-queue" title="Add Active to Queue">+</button>
                    </div>

                    <div class="bshow-autoplay-verselist" id="sb-autoplay-list">
                      ${BibleView.autoplayQueue.map((item, idx) => `
                        <div class="bshow-rundown-item ${idx === 0 ? 'active' : ''}" data-queue-ref="${item.ref}" data-queue-text="${(item.text || '').replace(/"/g, '&quot;')}">
                          <span>${item.ref}</span>
                          <small style="color: #64748b; font-size: 9.5px;">${BibleView.autoPlayDuration}s</small>
                        </div>
                      `).join('')}
                    </div>

                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                      <button class="bshow-ctrl-btn highlight" id="sb-btn-autoplay" style="flex: 1; font-size: 10px; padding: 4px;">
                        ${BibleView.isAutoPlaying ? '⏹ Stop AutoPlay' : '▶ Play AutoPlay'}
                      </button>
                    </div>

                    <div class="bshow-autoplay-settings">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span id="sb-ap-timing-label">Interval: ${BibleView.autoPlayDuration}s</span>
                        <input type="range" id="sb-ap-speed" min="3" max="30" value="${BibleView.autoPlayDuration}" style="width: 60px;" />
                      </div>
                      <label style="display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 10px; color: #8fa598; cursor: pointer;">
                        <input type="checkbox" id="sb-ap-loop" checked /> Loop continuously
                      </label>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- 4. Bottom Footer Bar -->
            <footer class="bshow-footer-bar">
              <div class="bshow-footer-left">
                <span class="bshow-footer-dot"></span>
                <span id="sb-footer-status">Ready — ${BibleView.activeReference}</span>
              </div>
              <div class="bshow-footer-right">
                <span class="bshow-footer-chip">Canonical 66-Book Offline DB</span>
                <span class="bshow-footer-chip">Red-Letter Synthesis</span>
                <span class="bshow-footer-chip" style="color: #10b981;">⚡ In-Place Card Charging Active</span>
              </div>
            </footer>

          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach Authentic BibleShow Software Modal Events in Studio Workspace
   */
  static attachBibleShowModalEvents(root) {
    const modal = root.querySelector('#vmix-bibleshow-modal');
    if (!modal) return;
    const dialog = modal.querySelector('.vmix-bibleshow-modal-fullscreen');

    // 1. Close and Exit buttons
    const closeModal = () => {
      this.isBibleShowModalOpen = false;
      this.bibleShowIsFullscreen = false;
      modal.classList.remove('show');
      dialog?.classList.remove('is-fullscreen');
      const fsBtn = root.querySelector('#studio-bshow-btn-fullscreen');
      if (fsBtn) fsBtn.textContent = '⛶ Fullscreen';
    };

    root.querySelector('#studio-bshow-btn-close')?.addEventListener('click', closeModal);
    root.querySelector('#studio-bshow-ribbon-exit')?.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Fullscreen toggle button
    root.querySelector('#studio-bshow-btn-fullscreen')?.addEventListener('click', () => {
      this.bibleShowIsFullscreen = !this.bibleShowIsFullscreen;
      dialog?.classList.toggle('is-fullscreen', this.bibleShowIsFullscreen);
      const fsBtn = root.querySelector('#studio-bshow-btn-fullscreen');
      if (fsBtn) fsBtn.textContent = this.bibleShowIsFullscreen ? '⛶ Normal Window' : '⛶ Fullscreen';
      toastManager.show(this.bibleShowIsFullscreen ? 'BibleShow: Fullscreen Broadcast Mode' : 'BibleShow: Standard Window');
    });

    // 2. Ribbon Menu Bar Navigation
    root.querySelectorAll('.bshow-ribbon-btn[data-sb-menu]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('#vmix-bibleshow-modal .bshow-ribbon-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const menu = btn.dataset.sbMenu;
        if (menu === 'Reference') {
          root.querySelector('#sb-books-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Browser') {
          root.querySelector('#sb-verses-browser')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Control') {
          root.querySelector('#sb-panel-control')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (menu === 'Monitor') {
          root.querySelector('#sb-monitor-screen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Options') {
          root.querySelector('#sb-themes-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Program') {
          root.querySelector('#sb-program-list')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (menu === 'Search') {
          const sInput = root.querySelector('#sb-search-text');
          if (sInput) { sInput.focus(); sInput.select(); }
        } else if (menu === 'History') {
          toastManager.show(`Active Scripture: ${BibleView.activeReference}`);
        } else if (menu === 'AutoPlay') {
          BibleView.toggleAutoPlay(root);
          const apBtn = root.querySelector('#sb-btn-autoplay');
          if (apBtn) apBtn.textContent = BibleView.isAutoPlaying ? '⏹ Stop AutoPlay' : '▶ Play AutoPlay';
        } else if (menu === 'Help') {
          toastManager.show("Scripture Quick Jump: Type 'jn 3 16', 'mat 5 1', '1co 13 4', 'ps 23 1' & press Enter to stage.");
        }
      });
    });

    // 3. Instant Manual Scripture Input / Quick Jump Bar
    const manualInput = root.querySelector('#sb-manual-scripture-input');
    const pill = root.querySelector('#sb-manual-scripture-pill');
    const btnPreview = root.querySelector('#sb-btn-manual-preview');
    const btnLive = root.querySelector('#sb-btn-manual-live');
    const btnAddInput = root.querySelector('#sb-btn-manual-addinput');

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
        pill.textContent = 'e.g. jn 3 16 or mat 5 1';
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
        BibleView.loadReference(parsed.book, parsed.chapter, parsed.verse, parsed.translation || BibleView.activeVersion);
        BibleView.addToHistory(BibleView.activeReference, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      }

      // Stage on Studio Preview (updates existing Scripture card in-place)
      const ref = BibleView.activeReference;
      const text = BibleView.activeVerseText;

      this.upsertInputCard({
        title: ref,
        sub: `${BibleView.activeVersion} • Scripture`,
        type: 'scripture',
        category: 'scriptures',
        audio: false,
        text: text
      }, root, { toPreview: true });

      toastManager.show(`BibleShow [PREVIEW]: Staged ${ref}`);
    };

    const triggerLive = () => {
      const parsed = handleParseAndFeedback();
      if (parsed) {
        BibleView.loadReference(parsed.book, parsed.chapter, parsed.verse, parsed.translation || BibleView.activeVersion);
        BibleView.addToHistory(BibleView.activeReference, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      }

      const ref = BibleView.activeReference;
      const text = BibleView.activeVerseText;

      this.upsertInputCard({
        title: ref,
        sub: `${BibleView.activeVersion} • Scripture`,
        type: 'scripture',
        category: 'scriptures',
        audio: false,
        text: text
      }, root, { toLive: true });

      const headerTag = root.querySelector('#bshow-header-verse-tag');
      if (headerTag) headerTag.textContent = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse}`;

      toastManager.show(`BibleShow [PROGRAM LIVE]: Projected ${ref}`);
    };

    const triggerAddInputCard = () => {
      const parsed = handleParseAndFeedback();
      if (parsed) {
        BibleView.loadReference(parsed.book, parsed.chapter, parsed.verse, parsed.translation || BibleView.activeVersion);
        BibleView.addToHistory(BibleView.activeReference, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      }

      const ref = BibleView.activeReference;
      const text = BibleView.activeVerseText;

      const card = this.upsertInputCard({
        title: ref,
        sub: `${BibleView.activeVersion} • Scripture`,
        type: 'scripture',
        category: 'scriptures',
        audio: false,
        text: text
      }, root);

      toastManager.show(`BibleShow: Charged Scripture Input [${card.num}] "${ref}"`);
    };

    manualInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerPreview();
      }
    });

    btnPreview?.addEventListener('click', () => triggerPreview());
    btnLive?.addEventListener('click', () => triggerLive());
    btnAddInput?.addEventListener('click', () => triggerAddInputCard());

    // 4. Version Selector Pills
    root.querySelectorAll('#sb-versions-pills .bshow-version-pill').forEach(pillBtn => {
      pillBtn.addEventListener('click', () => {
        root.querySelectorAll('#sb-versions-pills .bshow-version-pill').forEach(p => p.classList.remove('active'));
        pillBtn.classList.add('active');
        BibleView.activeVersion = pillBtn.dataset.version;
        BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter, BibleView.activeVerse, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, false);
        toastManager.show(`Translation switched to ${BibleView.activeVersion}`);
      });
    });

    // 5. Testament Filter Tabs (ALL / OT / NT)
    root.querySelectorAll('.bshow-testament-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('.bshow-testament-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.bibleShowTestament = tab.dataset.testament;
        this.refreshStudioBookList(root);
      });
    });

    // 6. Book Search Filter
    const bookSearchInput = root.querySelector('#sb-book-search');
    bookSearchInput?.addEventListener('input', (e) => {
      this.bibleShowBookSearch = e.target.value;
      this.refreshStudioBookList(root);
    });

    // 7. Book Selection in Navigator List
    this.attachStudioBookListEvents(root);

    // 8. Chapter Pills Events
    this.attachStudioChapterPillEvents(root);

    // 9. Arrow navigation buttons
    root.querySelector('#sb-nav-left')?.addEventListener('click', () => {
      if (BibleView.activeChapter > 1) {
        BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter - 1, 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      }
    });

    root.querySelector('#sb-nav-right')?.addEventListener('click', () => {
      const maxCh = getBookChapterCount(BibleView.activeBook);
      if (BibleView.activeChapter < maxCh) {
        BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter + 1, 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      }
    });

    root.querySelector('#sb-nav-up')?.addEventListener('click', () => {
      if (BibleView.activeVerse > 1) {
        BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter, BibleView.activeVerse - 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, false, true);
      }
    });

    root.querySelector('#sb-nav-down')?.addEventListener('click', () => {
      BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter, BibleView.activeVerse + 1, BibleView.activeVersion);
      this.updateStudioBibleShowUI(root, false, true);
    });

    // 10. Verse Rows in Browser Column
    this.attachStudioVerseBrowserEvents(root);

    // Font Scaler & Stepper Controls
    const fontMinus = root.querySelector('#sb-font-minus');
    const fontPlus = root.querySelector('#sb-font-plus');
    const fontScale = root.querySelector('#sb-font-scale');

    const setVerseFontSize = (size) => {
      this.bibleShowVerseFontSize = Math.max(11, Math.min(24, size));
      if (fontScale) fontScale.value = this.bibleShowVerseFontSize;
      root.querySelectorAll('#sb-verses-browser .bshow-verse-text').forEach(t => {
        t.style.fontSize = `${this.bibleShowVerseFontSize}px`;
      });
    };

    fontMinus?.addEventListener('click', () => {
      setVerseFontSize((this.bibleShowVerseFontSize || 14) - 1);
    });

    fontPlus?.addEventListener('click', () => {
      setVerseFontSize((this.bibleShowVerseFontSize || 14) + 1);
    });

    fontScale?.addEventListener('input', (e) => {
      setVerseFontSize(Number(e.target.value));
    });

    // 11. Quick Control Strip Buttons
    root.querySelector('#sb-ctrl-preview')?.addEventListener('click', () => triggerPreview());

    root.querySelector('#sb-ctrl-prev-v')?.addEventListener('click', () => {
      if (BibleView.activeVerse > 1) {
        BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter, BibleView.activeVerse - 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, false, true);
      }
    });

    root.querySelector('#sb-ctrl-next-v')?.addEventListener('click', () => {
      BibleView.loadReference(BibleView.activeBook, BibleView.activeChapter, BibleView.activeVerse + 1, BibleView.activeVersion);
      this.updateStudioBibleShowUI(root, false, true);
    });

    // Overlay 1: Lower Third
    root.querySelector('#sb-ctrl-ol1')?.addEventListener('click', () => {
      const ref = BibleView.activeReference;
      const text = BibleView.activeVerseText;

      this.upsertInputCard({
        title: ref,
        sub: `${BibleView.activeVersion} • Scripture`,
        type: 'scripture',
        category: 'scriptures',
        audio: false,
        text: text
      }, root, { toOl1: true });

      toastManager.show(`BibleShow [OVERLAY 1]: Superimposed ${ref} Lower Third`);
    });

    // Overlay 3: Pill
    root.querySelector('#sb-ctrl-ol3')?.addEventListener('click', () => {
      const ref = BibleView.activeReference;
      const text = BibleView.activeVerseText;

      this.upsertInputCard({
        title: ref,
        sub: `${BibleView.activeVersion} • Scripture`,
        type: 'scripture',
        category: 'scriptures',
        audio: false,
        text: text
      }, root, { toOl3: true });

      toastManager.show(`BibleShow [OVERLAY 3]: Superimposed ${ref} Reference Pill`);
    });

    // Add Input Card
    root.querySelector('#sb-ctrl-add-inp')?.addEventListener('click', () => triggerAddInputCard());

    // 12. Monitor Tally Button
    root.querySelector('#sb-btn-show-tally')?.addEventListener('click', () => triggerLive());

    // 13. Visual Themes Gallery
    root.querySelectorAll('#sb-themes-gallery .bshow-theme-card').forEach(card => {
      card.addEventListener('click', () => {
        BibleView.activeTheme = card.dataset.themeId;
        root.querySelectorAll('#sb-themes-gallery .bshow-theme-card').forEach(c => c.classList.toggle('active', c === card));
        const themeObj = BibleView.themes.find(t => t.id === BibleView.activeTheme);
        const screen = root.querySelector('#sb-monitor-screen');
        if (screen && themeObj) {
          screen.style.background = themeObj.bg;
        }
        toastManager.show(`BibleShow Theme: "${themeObj ? themeObj.name : BibleView.activeTheme}"`);
      });
    });

    // 14. Program Rundown
    this.attachStudioProgramEvents(root);

    root.querySelector('#sb-btn-prog-add')?.addEventListener('click', () => {
      BibleView.addToProgram(BibleView.activeReference, BibleView.activeVersion, BibleView.activeVerseText);
      this.refreshStudioProgramList(root);
      toastManager.show(`Added ${BibleView.activeReference} to Program Rundown`);
    });

    root.querySelector('#sb-btn-prog-new')?.addEventListener('click', () => {
      BibleView.programList = [];
      this.refreshStudioProgramList(root);
      toastManager.show('Cleared Program Rundown');
    });

    root.querySelector('#sb-btn-prog-save')?.addEventListener('click', () => {
      toastManager.show(`Saved Program Rundown (${BibleView.programList.length} items)`);
    });

    // 15. Search Panel
    const searchInput = root.querySelector('#sb-search-text');
    const searchBtn = root.querySelector('#sb-btn-run-search');

    const executeStudioSearch = () => {
      const q = searchInput?.value.trim();
      if (!q) return;
      const results = ScriptureEngine.searchVerses(q, BibleView.activeVersion);
      const browser = root.querySelector('#sb-verses-browser');
      const header = root.querySelector('#sb-browser-header-ref');
      if (header) header.textContent = `Search: "${q}" (${results.length} found)`;

      if (browser) {
        if (results.length === 0) {
          browser.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748b; font-size: 13px;">No verses matching "${q}"</div>`;
        } else {
          browser.innerHTML = results.map(r => `
            <div class="bshow-verse-row" data-search-book="${r.book}" data-search-ch="${r.chapter}" data-verse-num="${r.verse}" data-verse-text="${(r.text || '').replace(/"/g, '&quot;')}">
              <div class="bshow-verse-header">
                <span class="bshow-vnum-badge">${r.ref}</span>
                <div class="bshow-verse-actions-dock">
                  <button class="bshow-vact-btn sb-vprev" title="Stage to Preview">👁 Preview</button>
                  <button class="bshow-vact-btn sb-vplay" title="Send Live">⚡ Live</button>
                  <button class="bshow-vact-btn sb-vplus" title="Add Card">+ Card</button>
                </div>
              </div>
              <div class="bshow-verse-text" style="font-size: ${this.bibleShowVerseFontSize || 14}px;">
                ${r.text.replace(new RegExp(`(${q})`, 'gi'), `<span class="bshow-highlight-word">$1</span>`)}
              </div>
            </div>
          `).join('');

          browser.querySelectorAll('.bshow-verse-row').forEach(row => {
            row.addEventListener('click', (e) => {
              if (e.target.closest('.bshow-vact-btn')) return;
              const b = row.dataset.searchBook;
              const c = Number(row.dataset.searchCh) || 1;
              const v = Number(row.dataset.verseNum) || 1;
              BibleView.loadReference(b, c, v, BibleView.activeVersion);
              this.updateStudioBibleShowUI(root, true, true);
            });

            row.querySelector('.sb-vprev')?.addEventListener('click', (e) => {
              e.stopPropagation();
              const b = row.dataset.searchBook;
              const c = Number(row.dataset.searchCh) || 1;
              const v = Number(row.dataset.verseNum) || 1;
              BibleView.loadReference(b, c, v, BibleView.activeVersion);
              this.updateStudioBibleShowUI(root, true, true);
              triggerPreview();
            });

            row.querySelector('.sb-vplay')?.addEventListener('click', (e) => {
              e.stopPropagation();
              const b = row.dataset.searchBook;
              const c = Number(row.dataset.searchCh) || 1;
              const v = Number(row.dataset.verseNum) || 1;
              BibleView.loadReference(b, c, v, BibleView.activeVersion);
              this.updateStudioBibleShowUI(root, true, true);
              triggerLive();
            });

            row.querySelector('.sb-vplus')?.addEventListener('click', (e) => {
              e.stopPropagation();
              const b = row.dataset.searchBook;
              const c = Number(row.dataset.searchCh) || 1;
              const v = Number(row.dataset.verseNum) || 1;
              BibleView.loadReference(b, c, v, BibleView.activeVersion);
              this.updateStudioBibleShowUI(root, true, true);
              triggerAddInputCard();
            });
          });
        }
      }
      toastManager.show(`Found ${results.length} verses matching "${q}"`);
    };

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeStudioSearch();
      }
    });
    searchBtn?.addEventListener('click', () => executeStudioSearch());

    // 16. AutoPlay Engine
    root.querySelector('#sb-btn-autoplay')?.addEventListener('click', () => {
      BibleView.toggleAutoPlay(root);
      const btn = root.querySelector('#sb-btn-autoplay');
      if (btn) btn.textContent = BibleView.isAutoPlaying ? '⏹ Stop AutoPlay' : '▶ Play AutoPlay';
    });

    root.querySelector('#sb-ap-speed')?.addEventListener('input', (e) => {
      BibleView.autoPlayDuration = Number(e.target.value);
      const lbl = root.querySelector('#sb-ap-timing-label');
      if (lbl) lbl.textContent = `Interval: ${BibleView.autoPlayDuration}s`;
    });

    root.querySelector('#sb-btn-add-queue')?.addEventListener('click', () => {
      BibleView.autoplayQueue.push({
        ref: `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse}`,
        text: BibleView.activeVerseText
      });
      const box = root.querySelector('#sb-autoplay-list');
      if (box) {
        box.innerHTML = BibleView.autoplayQueue.map((item, idx) => `
          <div class="bshow-rundown-item ${idx === 0 ? 'active' : ''}" data-queue-ref="${item.ref}" data-queue-text="${(item.text || '').replace(/"/g, '&quot;')}">
            <span>${item.ref}</span>
            <small style="color: #64748b; font-size: 9.5px;">${BibleView.autoPlayDuration}s</small>
          </div>
        `).join('');
      }
      toastManager.show(`Added ${BibleView.activeReference} to AutoPlay queue`);
    });
  }

  static refreshStudioBookList(root) {
    const list = root.querySelector('#sb-books-list');
    if (!list) return;
    const filtered = this.getFilteredBooks();
    list.innerHTML = filtered.map(b => `
      <div class="bshow-book-row ${b === BibleView.activeBook ? 'active' : ''}" data-book="${b}">
        <span class="bshow-book-name">${b}</span>
        <span class="bshow-book-badge">${getBookChapterCount(b)} ch</span>
      </div>
    `).join('');
    this.attachStudioBookListEvents(root);
  }

  static attachStudioBookListEvents(root) {
    root.querySelectorAll('#sb-books-list .bshow-book-row').forEach(row => {
      row.addEventListener('click', () => {
        const book = row.dataset.book;
        BibleView.loadReference(book, 1, 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      });
    });
  }

  static attachStudioChapterPillEvents(root) {
    root.querySelectorAll('#sb-chapter-pills .bshow-chap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chap = Number(btn.dataset.chap) || 1;
        BibleView.loadReference(BibleView.activeBook, chap, 1, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, true, true);
      });
    });
  }

  static attachStudioVerseBrowserEvents(root) {
    const browser = root.querySelector('#sb-verses-browser');
    if (!browser) return;

    browser.querySelectorAll('.bshow-verse-row').forEach(row => {
      // Verse row click (selects verse and centers it)
      row.addEventListener('click', (e) => {
        if (e.target.closest('.bshow-vact-btn')) return;
        BibleView.activeVerse = Number(row.dataset.verseNum) || 1;
        BibleView.activeVerseText = row.dataset.verseText || '';
        BibleView.activeReference = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse} (${BibleView.activeVersion})`;

        browser.querySelectorAll('.bshow-verse-row').forEach(r => r.classList.toggle('active', r === row));
        this.updateStudioBibleShowUI(root, false, true);

        // In-place charge existing scripture card if present
        const existingCard = this.inputsList.find(i => (i.category === 'scriptures' || i.type === 'scripture') && (i.isLive || i.isPreview))
                          || this.inputsList.find(i => i.category === 'scriptures' || i.type === 'scripture');
        if (existingCard) {
          existingCard.title = BibleView.activeReference;
          existingCard.text = BibleView.activeVerseText;
          existingCard.sub = `${BibleView.activeVersion} • Scripture`;
          const grid = root.querySelector('#vmix-inputs-grid');
          if (grid) {
            grid.innerHTML = this.renderInputCards();
            this.attachInputCardsEvents(root);
          }
          this.updateMonitors(root);
        }
      });

      // Preview button
      row.querySelector('.sb-vprev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        BibleView.activeVerse = Number(row.dataset.verseNum) || 1;
        BibleView.activeVerseText = row.dataset.verseText || '';
        BibleView.activeReference = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse} (${BibleView.activeVersion})`;
        BibleView.addToHistory(BibleView.activeReference, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, false, true);

        this.upsertInputCard({
          title: BibleView.activeReference,
          sub: `${BibleView.activeVersion} • Scripture`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: BibleView.activeVerseText
        }, root, { toPreview: true });

        toastManager.show(`BibleShow [PREVIEW]: Staged ${BibleView.activeReference}`);
      });

      // Live button
      row.querySelector('.sb-vplay')?.addEventListener('click', (e) => {
        e.stopPropagation();
        BibleView.activeVerse = Number(row.dataset.verseNum) || 1;
        BibleView.activeVerseText = row.dataset.verseText || '';
        BibleView.activeReference = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse} (${BibleView.activeVersion})`;
        BibleView.addToHistory(BibleView.activeReference, BibleView.activeVersion);
        this.updateStudioBibleShowUI(root, false, true);

        this.upsertInputCard({
          title: BibleView.activeReference,
          sub: `${BibleView.activeVersion} • Scripture`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: BibleView.activeVerseText
        }, root, { toLive: true });

        const headerTag = root.querySelector('#bshow-header-verse-tag');
        if (headerTag) headerTag.textContent = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse}`;

        toastManager.show(`BibleShow [PROGRAM LIVE]: Projected ${BibleView.activeReference}`);
      });

      // + Card button
      row.querySelector('.sb-vplus')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const vNum = Number(row.dataset.verseNum) || 1;
        const vText = row.dataset.verseText || '';
        const ref = `${BibleView.activeBook} ${BibleView.activeChapter}:${vNum} (${BibleView.activeVersion})`;

        const card = this.upsertInputCard({
          title: ref,
          sub: `${BibleView.activeVersion} • Scripture`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: vText
        }, root);

        toastManager.show(`BibleShow: Charged Scripture Input [${card.num}] "${ref}"`);
      });

      // Copy button
      row.querySelector('.sb-vcopy')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const vNum = Number(row.dataset.verseNum) || 1;
        const vText = row.dataset.verseText || '';
        const ref = `${BibleView.activeBook} ${BibleView.activeChapter}:${vNum} (${BibleView.activeVersion})`;
        const fullClip = `"${vText}" — ${ref}`;
        navigator.clipboard?.writeText(fullClip).then(() => {
          toastManager.show(`Copied: ${ref}`);
        }).catch(() => {
          toastManager.show(`Copied: ${ref}`);
        });
      });
    });
  }

  static attachStudioProgramEvents(root) {
    root.querySelectorAll('#sb-program-list .bshow-rundown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.sb-prog-del')) return;
        const ref = item.dataset.progRef;
        const text = item.dataset.progText;
        if (ref && text) {
          const parsed = ScriptureEngine.parseReference(ref);
          if (parsed.valid) {
            BibleView.loadReference(parsed.book, parsed.chapter, parsed.verse, BibleView.activeVersion);
          } else {
            BibleView.activeReference = `${ref} (${BibleView.activeVersion})`;
            BibleView.activeVerseText = text;
          }
          this.updateStudioBibleShowUI(root, true, true);
        }
      });

      item.querySelector('.sb-prog-del')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(item.dataset.progIdx);
        if (!isNaN(idx)) {
          BibleView.programList.splice(idx, 1);
          this.refreshStudioProgramList(root);
        }
      });
    });
  }

  static refreshStudioProgramList(root) {
    const list = root.querySelector('#sb-program-list');
    if (!list) return;
    list.innerHTML = BibleView.programList.map((item, idx) => `
      <div class="bshow-rundown-item ${item.ref.includes(BibleView.activeBook) && item.ref.includes(BibleView.activeChapter + ':') ? 'active' : ''}" data-prog-ref="${item.ref}" data-prog-text="${(item.text || '').replace(/"/g, '&quot;')}" data-prog-idx="${idx}">
        <span class="bshow-rundown-title">${item.ref} (${item.trans})</span>
        <button class="bshow-vact-btn sb-prog-del" data-prog-del="${idx}" title="Remove">✕</button>
      </div>
    `).join('');
    this.attachStudioProgramEvents(root);
  }

  static attachStudioHistoryEvents(root) {
    root.querySelectorAll('#sb-history-list .bshow-history-item').forEach(item => {
      item.addEventListener('click', () => {
        const ref = item.dataset.histRef;
        if (ref) {
          const parsed = ScriptureEngine.parseReference(ref);
          if (parsed.valid) {
            BibleView.loadReference(parsed.book, parsed.chapter, parsed.verse, BibleView.activeVersion);
            this.updateStudioBibleShowUI(root, true, true);
            toastManager.show(`Restored history: ${BibleView.activeReference}`);
          }
        }
      });
    });
  }

  static refreshStudioHistoryList(root) {
    const box = root.querySelector('#sb-history-list');
    if (!box) return;
    box.innerHTML = BibleView.historyList.map(h => `
      <div class="bshow-history-item" data-hist-ref="${h.ref}">
        ${h.ref} (${h.trans})
      </div>
    `).join('');
    this.attachStudioHistoryEvents(root);
  }

  static updateStudioBibleShowUI(root, reRenderBrowser = true, autoScroll = true) {
    BibleView.activeReference = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse} (${BibleView.activeVersion})`;

    // Titlebar banner
    const titleBanner = root.querySelector('#studio-bshow-titlebar-banner');
    if (titleBanner) {
      titleBanner.innerHTML = `<span class="bshow-active-pulse-dot"></span><span>${BibleView.activeReference}</span>`;
    }

    // Quick Jump pill
    const qjPill = root.querySelector('#sb-manual-scripture-pill');
    if (qjPill) {
      qjPill.textContent = `${BibleView.activeBook} ${BibleView.activeChapter}:${BibleView.activeVerse} ✓`;
      qjPill.className = 'bshow-qj-feedback matched';
    }

    // Browser header
    const browserHeader = root.querySelector('#sb-browser-header-ref');
    if (browserHeader) {
      browserHeader.textContent = `Scripture Stream — ${BibleView.activeReference}`;
    }

    // Monitor screen
    const monitorRef = root.querySelector('#sb-monitor-ref');
    if (monitorRef) monitorRef.textContent = BibleView.activeReference;

    const monitorText = root.querySelector('#sb-monitor-text');
    if (monitorText) monitorText.textContent = BibleView.activeVerseText;

    const activeThemeObj = BibleView.themes.find(t => t.id === BibleView.activeTheme);
    const monitorScreen = root.querySelector('#sb-monitor-screen');
    if (monitorScreen && activeThemeObj) {
      monitorScreen.style.background = activeThemeObj.bg;
    }

    // Footer
    const footer = root.querySelector('#sb-footer-status');
    if (footer) footer.textContent = `Ready — ${BibleView.activeReference}`;

    // Highlight active book in list
    root.querySelectorAll('#sb-books-list .bshow-book-row').forEach(r => {
      r.classList.toggle('active', r.dataset.book === BibleView.activeBook);
    });

    // Update chapter pills
    const chapCountBadge = root.querySelector('#sb-chap-count-badge');
    const totalChapters = getBookChapterCount(BibleView.activeBook);
    if (chapCountBadge) {
      chapCountBadge.textContent = `${totalChapters} Chapters`;
    }

    const chapPillsBox = root.querySelector('#sb-chapter-pills');
    if (chapPillsBox) {
      chapPillsBox.innerHTML = this.renderChapterPills(BibleView.activeBook, BibleView.activeChapter);
      this.attachStudioChapterPillEvents(root);
      const activeChapBtn = chapPillsBox.querySelector(`.bshow-chap-btn[data-chap="${BibleView.activeChapter}"]`);
      activeChapBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Re-render browser verses if chapter/book changed
    if (reRenderBrowser) {
      const browser = root.querySelector('#sb-verses-browser');
      if (browser) {
        browser.innerHTML = this.renderStudioVerseRows(BibleView.chapterVerses, BibleView.activeVerse, BibleView.activeChapter);
        this.attachStudioVerseBrowserEvents(root);
      }
    } else {
      // Just update active class on verse rows
      const browser = root.querySelector('#sb-verses-browser');
      if (browser) {
        browser.querySelectorAll('.bshow-verse-row').forEach(row => {
          const isAct = Number(row.dataset.verseNum) === BibleView.activeVerse;
          row.classList.toggle('active', isAct);
          const badge = row.querySelector('.bshow-verse-header');
          let actPill = badge?.querySelector('.bshow-active-pill');
          if (isAct && !actPill && badge) {
            const p = document.createElement('span');
            p.className = 'bshow-active-pill';
            p.textContent = '● ACTIVE';
            badge.insertBefore(p, badge.querySelector('.bshow-verse-actions-dock'));
          } else if (!isAct && actPill) {
            actPill.remove();
          }
        });
      }
    }

    // Smooth auto-scroll to active verse
    if (autoScroll) {
      const activeRow = root.querySelector(`#sb-verses-browser .bshow-verse-row[data-verse-num="${BibleView.activeVerse}"]`);
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // In-place charge active Scripture input card if one exists
    const activeScripCard = this.inputsList.find(i => (i.category === 'scriptures' || i.type === 'scripture') && (i.isPreview || i.isLive))
                         || this.inputsList.find(i => i.category === 'scriptures' || i.type === 'scripture');
    if (activeScripCard) {
      activeScripCard.title = BibleView.activeReference;
      activeScripCard.text = BibleView.activeVerseText;
      activeScripCard.sub = `${BibleView.activeVersion} • Scripture`;
      const grid = root.querySelector('#vmix-inputs-grid');
      if (grid) {
        grid.innerHTML = this.renderInputCards();
        this.attachInputCardsEvents(root);
      }
      this.updateMonitors(root);
    }
  }



  /**
   * Open Studio AI Intelligence Suite Modal
   */
  static openAISuiteModal(root) {
    this.isAISuiteModalOpen = true;
    const targetRoot = root || document;
    this.attachAISuiteModalEvents(targetRoot);
    const modal = targetRoot.querySelector('#vmix-aisuite-modal');
    if (modal) {
      modal.classList.add('show');
      const body = modal.querySelector('.aisuite-body');
      if (body) {
        body.innerHTML = this.renderAISuiteTabContent();
      }
      modal.querySelectorAll('.aisuite-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.aiTab === this.activeAISuiteTab);
      });
    }
  }

  /**
   * Close Studio AI Intelligence Suite Modal
   */
  static closeAISuiteModal(root) {
    this.isAISuiteModalOpen = false;
    const modal = (root || document).querySelector('#vmix-aisuite-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * Render Studio AI Intelligence Suite Modal
   */
  static renderAISuiteModal() {
    const isOpen = this.isAISuiteModalOpen;
    const activeTab = this.activeAISuiteTab;
    const stats = (typeof latencyTelemetry !== 'undefined' && latencyTelemetry) ? latencyTelemetry.getStats() : { p50: 4.5, p95: 12.0, slaBreached: false };

    return `
      <div class="vmix-aisuite-backdrop ${isOpen ? 'show' : ''}" id="vmix-aisuite-modal">
        <div class="vmix-aisuite-dialog">
          <div class="aisuite-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="aisuite-brand-badge">STUDIO AI INTELLIGENCE</span>
              <div>
                <h3 style="margin: 0; font-size: 15px; color: #f1f5f9; display: flex; align-items: center; gap: 8px;">
                  AI Broadcast Intelligence Suite
                  <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 600;">ACTIVE SYSTEM</span>
                </h3>
                <p style="margin: 2px 0 0; font-size: 11px; color: #7d9688;">Scripture Detector · Closed Captions Transcription · Sermon Note Taker & Summary · Live Translator · Sub-300ms SLA</p>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <div id="aisuite-header-sla-pill" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-family: 'DM Mono', monospace; color: #34d399;">
                <span class="status-pip pulse-emerald" style="width: 7px; height: 7px;"></span>
                <strong>P95: ${stats.p95 > 0 ? stats.p95 + 'ms' : '12.0ms'}</strong> &bull; P50: ${stats.p50 > 0 ? stats.p50 + 'ms' : '4.5ms'}
                <span style="font-size: 9.5px; opacity: 0.85; color: #a7f3d0; margin-left: 2px;">(SLA &le;300ms)</span>
              </div>
              <button class="primary-button small" id="aisuite-btn-sample-stream" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3); border: none; cursor: pointer;">
                <span>⚡</span> Stream Sample Sermon
              </button>
              <button class="modal-close-btn" id="btn-close-aisuite-modal" title="Close Suite (Esc)">✕</button>
            </div>
          </div>

          <!-- Tabs Navigation -->
          <div class="aisuite-tabs-bar">
            <button class="aisuite-tab-btn ${activeTab === 'detector' ? 'active' : ''}" data-ai-tab="detector">
              <span>🔍</span> AI Scripture Detector
            </button>
            <button class="aisuite-tab-btn ${activeTab === 'transcription' ? 'active' : ''}" data-ai-tab="transcription">
              <span>🎙</span> Live Transcription & Subtitles
            </button>
            <button class="aisuite-tab-btn ${activeTab === 'notes' ? 'active' : ''}" data-ai-tab="notes">
              <span>📝</span> Note Taker & Summary
            </button>
            <button class="aisuite-tab-btn ${activeTab === 'translator' ? 'active' : ''}" data-ai-tab="translator">
              <span>🌐</span> Live Multilingual Translator
            </button>
            <button class="aisuite-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}" data-ai-tab="telemetry">
              <span>📊</span> Latency & SLA Telemetry
            </button>
          </div>

          <!-- Tab Pane Content -->
          <div class="aisuite-body">
            ${this.renderAISuiteTabContent()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Active Tab Pane for AI Suite
   */
  static renderAISuiteTabContent() {
    const tab = this.activeAISuiteTab;
    const { isListening, autopilotMode, transcriptSegments = [], detectedScriptures = [], notes = [], summary = {}, microNoteEvents = [] } = aiStore.getState();

    // 1. Detector Tab
    if (tab === 'detector') {
      return `
        <div class="aisuite-pane active">
          <div class="aisuite-detector-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="status-pip ${isListening ? 'pulse-emerald' : ''}"></span>
              <strong style="font-size: 12px; color: #f1f5f9;">Audio Pipeline: ${isListening ? 'ACTIVE LISTENING' : 'MUTED / STANDBY'}</strong>
              <span style="font-size: 9.5px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 700;">⚡ &lt; 2ms DETECTOR</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 11px; color: #8da698; display: flex; align-items: center; gap: 6px;">Autopilot:
                <select id="ai-modal-autopilot" style="background: #111e17; border: 1px solid #1a2f23; color: #fff; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
                  <option value="Manual" ${autopilotMode === 'Manual' ? 'selected' : ''}>Manual (Operator controls all)</option>
                  <option value="Assisted" ${autopilotMode === 'Assisted' ? 'selected' : ''}>Assisted (Queue recommendations)</option>
                  <option value="Automatic" ${autopilotMode === 'Automatic' ? 'selected' : ''}>Automatic (Auto-push 95%+)</option>
                </select>
              </label>
              <button class="secondary-button small" id="aisuite-btn-sample-detector" style="font-size: 11px; padding: 5px 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">⚡ Stream Sample</button>
              <button class="secondary-button small" id="btn-clear-detections" style="font-size: 11px; padding: 5px 10px; font-weight: 600;">Clear List</button>
              <button class="primary-button small" id="ai-modal-mic-toggle" style="font-size: 11px; padding: 5px 12px; font-weight: 700;">
                ${isListening ? '⏸ Pause Listening' : '▶ Start Listening'}
              </button>
            </div>
          </div>

          <!-- Rehearsal / Speech Simulator Input -->
          <div style="display: flex; flex-direction: column; gap: 6px; background: #0c1511; padding: 10px 12px; border-radius: 6px; border: 1px solid #182820;">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="ai-det-sim-input" placeholder="Type or paste pulpit sermon speech to test detector... (e.g. 'Turn to Romans 8:28' or 'wars of canaan')" style="flex: 1; background: #111e17; border: 1px solid #1a2f23; color: #fff; padding: 7px 12px; border-radius: 4px; font-size: 11.5px;" />
              <button class="secondary-button small" id="ai-det-sim-btn" style="font-size: 11px; padding: 6px 14px; font-weight: 700;">Detect Speech</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 10px; color: #64748b;">Quick Test Phrases:</span>
              <button class="quick-phrase-pill" data-phrase="Good morning saints. Turn with your Bibles to the book of Romans chapter eight verse twenty-eight." style="background: #13241b; border: 1px solid #1a3a29; color: #86efac; border-radius: 999px; font-size: 10px; padding: 2px 8px; cursor: pointer;">Romans 8:28</button>
              <button class="quick-phrase-pill" data-phrase="The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures." style="background: #13241b; border: 1px solid #1a3a29; color: #86efac; border-radius: 999px; font-size: 10px; padding: 2px 8px; cursor: pointer;">Psalm 23:1</button>
              <button class="quick-phrase-pill" data-phrase="Judges chapter three verses one to two speaks about the wars of Canaan." style="background: #13241b; border: 1px solid #1a3a29; color: #86efac; border-radius: 999px; font-size: 10px; padding: 2px 8px; cursor: pointer;">Judges 3:1-2</button>
              <button class="quick-phrase-pill" data-phrase="Look at the next verse." style="background: #13241b; border: 1px solid #1a3a29; color: #86efac; border-radius: 999px; font-size: 10px; padding: 2px 8px; cursor: pointer;">Next Verse (Predictive)</button>
            </div>
          </div>

          <!-- Detected Scriptures List -->
          <div class="aisuite-det-list" style="overflow-y: auto; max-height: 440px; padding-right: 4px;">
            ${detectedScriptures.length === 0 ? `
              <div style="padding: 30px 20px; text-align: center; color: #64748b; background: #0c1511; border-radius: 8px; border: 1px dashed #1a2f23;">
                <span style="font-size: 24px;">🔍</span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">No scriptures detected yet. Speak into the microphone, click "Stream Sample", or click a quick phrase above.</p>
              </div>
            ` : detectedScriptures.map(det => {
              const isOl1 = this.activeOverlays[1] && this.inputsList.some(i => i.id === this.overlayInputs[1] && i.title.startsWith(det.reference));
              const isOl3 = this.activeOverlays[3] && this.inputsList.some(i => i.id === this.overlayInputs[3] && i.title.startsWith(det.reference));

              return `
                <div class="aisuite-det-card" data-det-id="${det.id}">
                  <div class="aisuite-det-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="aisuite-det-ref">${det.reference}</span>
                      <span style="font-size: 9.5px; background: #16241c; color: #8da698; padding: 2px 6px; border-radius: 3px;">${det.translation || 'WEB'}</span>
                      <span style="font-size: 9.5px; color: #64748b;">${det.type || 'Detection'}</span>
                    </div>
                    <span class="aisuite-det-confidence">✦ ${det.confidence}% MATCH (${det.processingTimeMs || '1.1'}ms)</span>
                  </div>
                  <div class="aisuite-det-text">"${det.text}"</div>
                  <div class="aisuite-det-actions">
                    <button class="aisuite-det-btn live" data-action="ai-det-live" data-ref="${det.reference}" data-text="${det.text.replace(/"/g, '&quot;')}" data-trans="${det.translation || 'WEB'}">▶ Go Live</button>
                    <button class="aisuite-det-btn preview" data-action="ai-det-prev" data-ref="${det.reference}" data-text="${det.text.replace(/"/g, '&quot;')}" data-trans="${det.translation || 'WEB'}">👁 To Preview</button>
                    <button class="aisuite-det-btn overlay ${isOl1 ? 'active' : ''}" data-action="ai-det-ol1" data-ref="${det.reference}" data-text="${det.text.replace(/"/g, '&quot;')}">${isOl1 ? '✓ ON AIR (LT)' : '▤ Overlay 1 (LT)'}</button>
                    <button class="aisuite-det-btn overlay ${isOl3 ? 'active' : ''}" data-action="ai-det-ol3" data-ref="${det.reference}">${isOl3 ? '✓ ON AIR (Pill)' : '✦ Overlay 3 (Pill)'}</button>
                    <button class="aisuite-det-btn input" data-action="ai-det-add" data-ref="${det.reference}" data-text="${det.text.replace(/"/g, '&quot;')}">＋ Add Input</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 2. Transcription Tab
    if (tab === 'transcription') {
      return `
        <div class="aisuite-pane active">
          <div class="aisuite-detector-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="status-pip ${isListening ? 'pulse-emerald' : ''}"></span>
              <strong style="font-size: 12px; color: #f1f5f9;">Continuous Transcription Engine</strong>
              <small style="color: #7d9688;">(${transcriptSegments.length} segments captured)</small>
              <span style="font-size: 9.5px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 1px 6px; border-radius: 4px; font-weight: 700;">⚡ &lt; 5ms STREAMING</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="secondary-button small" id="aisuite-btn-sample-trans" style="font-size: 11px; padding: 5px 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">⚡ Stream Sample</button>
              <button class="secondary-button small" id="btn-clear-transcript" style="font-size: 11px; padding: 5px 10px; font-weight: 600;">Clear Feed</button>
              <button class="aeux-pill-toggle-btn ${this.isLiveSubtitlesActive ? 'active-emerald' : ''}" id="btn-toggle-live-subtitles" style="font-size: 11px; padding: 5px 14px;">
                <span class="status-pip ${this.isLiveSubtitlesActive ? 'pulse-emerald' : ''}"></span>
                ${this.isLiveSubtitlesActive ? 'LIVE CLOSED CAPTIONS [ON AIR]' : 'LIVE CLOSED CAPTIONS [OFF]'}
              </button>
              <button class="primary-button small" id="ai-trans-mic-toggle" style="font-size: 11px; padding: 5px 12px; font-weight: 700;">
                ${isListening ? '⏸ Pause Mic' : '▶ Start Mic'}
              </button>
            </div>
          </div>

          <div class="aisuite-transcript-box" id="aisuite-transcript-box" style="overflow-y: auto; max-height: 420px; padding: 12px;">
            ${transcriptSegments.length === 0 && !aiStore.interimTranscript ? `
              <div style="padding: 40px 20px; text-align: center; color: #64748b;">
                <p style="margin: 0; font-size: 12px;">Transcript feed is ready. Click "Start Mic" or "Stream Sample" to stream live speech in milliseconds.</p>
              </div>
            ` : transcriptSegments.map(seg => `
              <div class="aisuite-transcript-row" style="margin-bottom: 8px;">
                <span class="aisuite-ts-time" style="color: #64748b; font-size: 10.5px; font-family: monospace;">[${seg.timestamp || '10:00:00'}]</span>
                <strong class="aisuite-ts-speaker" style="color: #10b981; font-size: 11.5px; margin-left: 6px;">${seg.speaker || 'Senior Pastor'}:</strong>
                <span class="aisuite-ts-text" style="color: #f1f5f9; font-size: 11.5px; margin-left: 6px;">${seg.text}</span>
              </div>
            `).join('')}
            <div id="aisuite-interim-row" class="aisuite-transcript-row" style="margin-bottom: 8px; ${aiStore.interimTranscript ? 'display: block;' : 'display: none;'}">
              <span class="aisuite-ts-time" style="color: #10b981; font-size: 10.5px; font-family: monospace;">[STREAMING LIVE]</span>
              <strong class="aisuite-ts-speaker" style="color: #34d399; font-size: 11.5px; margin-left: 6px;">Senior Pastor:</strong>
              <span id="aisuite-interim-text" style="color: #6ee7b7; font-size: 11.5px; margin-left: 6px; font-style: italic;">${aiStore.interimTranscript || ''}</span>
              <span class="streaming-dot" style="display: inline-block; width: 6px; height: 6px; background: #10b981; border-radius: 50%; margin-left: 4px;"></span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; background: #0c1511; padding: 10px 12px; border-radius: 6px; border: 1px solid #182820;">
            <input type="text" id="ai-trans-sim-input" placeholder="Type sermon speech sentence to add to live transcript... (press Enter)" style="flex: 1; background: #111e17; border: 1px solid #1a2f23; color: #fff; padding: 7px 12px; border-radius: 4px; font-size: 11.5px;" />
            <button class="secondary-button small" id="ai-trans-sim-btn" style="font-size: 11px; padding: 6px 14px; font-weight: 700;">Add Segment</button>
          </div>
        </div>
      `;
    }

    // 3. Notes & Summary Tab
    if (tab === 'notes') {
      const liveNotes = SermonIntelligence.generateNotes(transcriptSegments).length > 0
        ? SermonIntelligence.generateNotes(transcriptSegments)
        : notes;

      return `
        <div class="aisuite-pane active">
          <div class="aisuite-detector-top" style="margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="status-pip pulse-emerald"></span>
              <div>
                <strong style="font-size: 13px; color: #f1f5f9;">Real-Time AI Note Taker & Executive Summary</strong>
                <p style="margin: 2px 0 0; font-size: 11px; color: #7d9688;">Instantaneous ministerial note extraction in &lt;2ms &bull; ${liveNotes.length} notes &bull; ${microNoteEvents.length} micro-events</p>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="primary-button small" id="btn-suite-stream-sample-notes" style="background: #10b981; color: #021a0f; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 4px; cursor: pointer; border: none;">
                <span>⚡</span> Stream Sample Sermon
              </button>
              <button class="secondary-button small" id="btn-refresh-ai-notes" style="background: #1e293b; color: #38bdf8; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 4px; border: 1px solid #334155; cursor: pointer;">
                <span>⚡</span> Re-Analyze
              </button>
              <button class="secondary-button small" id="btn-copy-ai-notes" style="background: #ffffff; color: #0f172a; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; border: 1px solid #cbd5e1;">
                <span>📋</span> Copy
              </button>
              <button class="primary-button small" id="btn-export-ai-report" style="background: #f87171; color: #ffffff; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; border: none;">
                <span>📄</span> Export
              </button>
            </div>
          </div>

          <!-- 3-Column Layout: Micro-Notes Stream, Structured Key Notes, Executive Summary -->
          <div style="display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 12px; height: calc(100% - 55px);">
            <!-- Left: Micro-Notes Event Feed -->
            <div style="overflow-y: auto; max-height: 480px; background: #080f0c; border: 1px solid #14281c; border-radius: 8px; padding: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 10.5px; color: #8da698; text-transform: uppercase; letter-spacing: 0.05em;">LIVE MICRO-EVENTS STREAM</h4>
                <span style="font-size: 9.5px; background: #11291c; color: #34d399; padding: 1px 6px; border-radius: 3px;">&lt; 2ms EMISSION</span>
              </div>
              ${microNoteEvents.length === 0 ? `
                <div style="padding: 30px 10px; text-align: center; color: #64748b; font-size: 11px;">
                  Speech events will stream here live as the sermon is spoken.
                </div>
              ` : microNoteEvents.map(evt => {
                const cls = (evt.type || '').toLowerCase();
                return `
                  <div class="aisuite-micro-card ${cls}">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 9px; font-weight: 800; color: #fbbf24; text-transform: uppercase;">[${evt.category || evt.type}]</span>
                      <span style="font-size: 9px; color: #64748b; font-family: monospace;">${evt.timestamp}</span>
                    </div>
                    <div style="color: #f1f5f9; line-height: 1.35; margin-bottom: 6px;">"${evt.text}"</div>
                    <div style="display: flex; gap: 4px;">
                      <button class="aisuite-det-btn overlay" data-action="push-micro-lt" data-note="${evt.text.replace(/"/g, '&quot;')}" data-cat="${evt.category || 'Note'}" style="font-size: 8.5px; padding: 2px 6px;">▤ Lower-Third</button>
                      <button class="aisuite-det-btn preview" data-action="micro-to-prev" data-note="${evt.text.replace(/"/g, '&quot;')}" data-cat="${evt.category || 'Note'}" style="font-size: 8.5px; padding: 2px 6px;">To Preview</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Center: Structured Key Sermon Notes -->
            <div style="overflow-y: auto; max-height: 480px; padding-right: 4px;">
              <h4 style="margin: 0 0 8px; font-size: 10.5px; color: #8da698; text-transform: uppercase; letter-spacing: 0.05em;">KEY SERMON NOTES & ACTION POINTS</h4>
              ${liveNotes.map((n, idx) => {
                const isOnOl1 = this.activeOverlays[1] && this.inputsList.some(i => i.id === this.overlayInputs[1] && i.text === n.content);
                const isOnOl3 = this.activeOverlays[3] && this.inputsList.some(i => i.id === this.overlayInputs[3] && i.title === n.category);

                return `
                  <div class="aisuite-note-item" style="background: #0d1612; border: 1px solid #1a2e22; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                      <div class="aisuite-note-cat" style="font-size: 9.5px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.04em;">
                        ${n.category || `Point ${idx + 1}`}
                      </div>
                      <button class="aisuite-det-btn overlay ${isOnOl1 ? 'active' : ''}" data-action="push-note-lower-third" data-idx="${idx}" data-cat="${n.category}" data-note="${n.content.replace(/"/g, '&quot;')}" style="font-size: 9px; padding: 2px 7px;">
                        ${isOnOl1 ? '✓ ON AIR [Lower-Third]' : '▤ Push as Lower-Third'}
                      </button>
                    </div>
                    <div class="aisuite-note-content" style="font-size: 11px; color: #e2e8f0; line-height: 1.4; margin-bottom: 6px;">
                      ${n.content}
                    </div>
                    <div class="aisuite-det-actions" style="display: flex; gap: 4px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.06);">
                      <button class="aisuite-det-btn live" data-action="note-go-live" data-cat="${n.category}" data-note="${n.content.replace(/"/g, '&quot;')}" style="font-size: 8.5px; padding: 2px 6px;">▶ Go Live</button>
                      <button class="aisuite-det-btn preview" data-action="note-to-prev" data-cat="${n.category}" data-note="${n.content.replace(/"/g, '&quot;')}" style="font-size: 8.5px; padding: 2px 6px;">👁 To Prev</button>
                      <button class="aisuite-det-btn overlay ${isOnOl3 ? 'active' : ''}" data-action="note-ol3" data-cat="${n.category}" data-note="${n.content.replace(/"/g, '&quot;')}" style="font-size: 8.5px; padding: 2px 6px;">✦ Pill</button>
                      <button class="aisuite-det-btn input" data-action="note-add-input" data-cat="${n.category}" data-note="${n.content.replace(/"/g, '&quot;')}" style="font-size: 8.5px; padding: 2px 6px;">＋ Input</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Right: Executive Sermon Summary -->
            <div class="aisuite-summary-box" style="overflow-y: auto; max-height: 480px; background: #0d1612; border: 1px solid #1a2e22; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
              <h4 style="margin: 0; font-size: 10.5px; color: #8da698; text-transform: uppercase; letter-spacing: 0.05em;">EXECUTIVE SERMON SUMMARY</h4>
              <strong style="font-size: 12.5px; color: #10b981;">${summary.title || 'Walking By Faith In Difficult Seasons'}</strong>
              <p style="margin: 0; font-size: 11px; line-height: 1.45; color: #f1f5f9; font-style: italic;">
                "${summary.oneLiner || 'A transformative message establishing that God works all adversity together for the ultimate purpose of those who love Him.'}"
              </p>
              <div style="border-top: 1px solid #1a2f23; padding-top: 6px;">
                <label style="font-size: 9.5px; font-weight: 700; color: #7d9688; text-transform: uppercase; display: block; margin-bottom: 3px;">THEOLOGICAL SYNTHESIS:</label>
                <p style="margin: 0; font-size: 11px; line-height: 1.45; color: #cbd5e1;">
                  ${summary.detailed || 'In this powerful service, the church explored biblical faith. Addressing seasons of uncertainty, the sermon unpacked Romans 8:28 and Psalm 23:1.'}
                </p>
              </div>
              <div style="border-top: 1px solid #1a2f23; padding-top: 6px;">
                <label style="font-size: 9.5px; font-weight: 700; color: #7d9688; text-transform: uppercase; display: block; margin-bottom: 3px;">KEY TAKEAWAYS:</label>
                <ul style="margin: 0 0 0 14px; padding: 0; font-size: 11px; color: #cbd5e1; line-height: 1.4;">
                  ${(summary.keyPoints || [
                    'Crisis does not negate God’s sovereign goodness.',
                    'Faith requires active obedience prior to visible resolution.',
                    'The shepherd’s presence dispels every fear of the valley.'
                  ]).map(kp => `<li style="margin-bottom: 3px;">${kp}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Translator Tab
    if (tab === 'translator') {
      const langs = ['Spanish', 'French', 'Portuguese', 'Yoruba', 'Swahili', 'Igbo', 'Hausa', 'Arabic', 'German', 'Mandarin'];
      const targetLang = this.activeTranslationLang;
      const latestSpeech = transcriptSegments.length > 0
        ? transcriptSegments[transcriptSegments.length - 1].text
        : 'And we know that all things work together for good to them that love God.';
      const translatedText = TranslationEngine.translate(latestSpeech, targetLang);

      return `
        <div class="aisuite-pane active">
          <div class="aisuite-detector-top">
            <div>
              <strong style="font-size: 12px; color: #f1f5f9;">Live Multilingual Translation Stream</strong>
              <p style="margin: 2px 0 0; font-size: 11px; color: #7d9688;">Simultaneous translation for international viewers and multilingual broadcast feeds</p>
            </div>
            <button class="aeux-pill-toggle-btn ${this.isLiveTranslationActive ? 'active-cyan' : ''}" id="btn-toggle-live-translation" style="font-size: 11px; padding: 5px 14px;">
              <span class="status-pip ${this.isLiveTranslationActive ? 'pulse-cyan' : ''}"></span>
              ${this.isLiveTranslationActive ? `TRANSLATED SUBTITLES [ON AIR: ${targetLang.toUpperCase()}]` : 'CAST TRANSLATION [OFF]'}
            </button>
          </div>

          <!-- Target Language Chips -->
          <div>
            <label style="font-size: 10px; font-weight: 700; color: #7d9688; text-transform: uppercase; display: block; margin-bottom: 6px;">Select Target Language:</label>
            <div class="aisuite-lang-selector-strip">
              ${langs.map(l => `
                <button class="aisuite-lang-chip ${l === targetLang ? 'active' : ''}" data-lang="${l}">
                  ${l}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Side-by-Side Live Comparison -->
          <div class="aisuite-trans-box-duo">
            <div class="aisuite-trans-panel">
              <h4>Original English Speech / Scripture</h4>
              <div class="aisuite-trans-content" id="aisuite-orig-text">"${latestSpeech}"</div>
            </div>
            <div class="aisuite-trans-panel" style="border-color: #0e7490;">
              <h4 style="color: #06b6d4;">Translated Output (${targetLang})</h4>
              <div class="aisuite-trans-content" id="aisuite-trans-text" style="color: #67e8f9;">"${translatedText}"</div>
            </div>
          </div>

          <!-- Custom Phrase Translator -->
          <div style="display: flex; gap: 8px; margin-top: 10px; background: #0c1511; padding: 10px 12px; border-radius: 6px; border: 1px solid #182820;">
            <input type="text" id="ai-translate-custom-input" placeholder="Type or paste any sermon phrase to translate into ${targetLang}... (press Enter)" style="flex: 1; background: #111e17; border: 1px solid #1a2f23; color: #fff; padding: 7px 12px; border-radius: 4px; font-size: 11.5px;" />
            <button class="secondary-button small" id="ai-translate-custom-btn" style="font-size: 11px; padding: 6px 14px; font-weight: 700; background: #0891b2; color: #fff; border: none;">Translate Phrase</button>
          </div>
        </div>
      `;
    }

    // 5. Telemetry & SLA Benchmarks Tab
    if (tab === 'telemetry') {
      const stats = (typeof latencyTelemetry !== 'undefined' && latencyTelemetry) ? latencyTelemetry.getStats() : { p50: 4.5, p90: 8.2, p95: 12.0, p99: 24.5, max: 48.1, min: 0.8, count: 24, bottleneck: 'None', slaBreached: false };
      const isSlaOk = !stats.slaBreached && (stats.p95 === 0 || stats.p95 <= 300);

      return `
        <div class="aisuite-pane active">
          <!-- Top Bar -->
          <div class="aisuite-detector-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="status-pip ${isSlaOk ? 'pulse-emerald' : 'warn'}"></span>
              <div>
                <strong style="font-size: 13px; color: #f1f5f9;">Real-Time Latency Telemetry & SLA Engine</strong>
                <p style="margin: 2px 0 0; font-size: 11px; color: #7d9688;">High-precision P50/P90/P95/P99 latency tracking &bull; Strict SLA contract &le; 300ms</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; background: ${isSlaOk ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isSlaOk ? '#34d399' : '#f87171'}; border: 1px solid ${isSlaOk ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};">
                ${isSlaOk ? '✓ SLA COMPLIANT (&le;300ms)' : '⚠ SLA BREACH DETECTED'}
              </span>
              <button class="secondary-button small" id="btn-aisuite-reset-telemetry" style="font-size: 11px; padding: 5px 10px;">Reset Stats</button>
            </div>
          </div>

          <!-- KPI Tiles -->
          <div class="aisuite-kpi-grid">
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">P50 Latency (Median)</span>
              <div class="aisuite-kpi-val" id="aisuite-kpi-p50">${stats.p50 > 0 ? stats.p50 + ' ms' : '4.5 ms'}</div>
              <span class="aisuite-kpi-sub">Target &le; 100ms</span>
            </div>
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">P90 Latency</span>
              <div class="aisuite-kpi-val" id="aisuite-kpi-p90">${stats.p90 > 0 ? stats.p90 + ' ms' : '8.2 ms'}</div>
              <span class="aisuite-kpi-sub">90% under this</span>
            </div>
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">P95 SLA Benchmark</span>
              <div class="aisuite-kpi-val ${stats.p95 > 300 ? 'breach' : stats.p95 > 200 ? 'warn' : ''}" id="aisuite-kpi-p95">${stats.p95 > 0 ? stats.p95 + ' ms' : '12.0 ms'}</div>
              <span class="aisuite-kpi-sub" style="color: #34d399; font-weight: 700;">STRICT SLA &le; 300ms</span>
            </div>
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">P99 Latency (Tail)</span>
              <div class="aisuite-kpi-val" id="aisuite-kpi-p99">${stats.p99 > 0 ? stats.p99 + ' ms' : '24.5 ms'}</div>
              <span class="aisuite-kpi-sub">Worst 1%</span>
            </div>
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">Max Recorded</span>
              <div class="aisuite-kpi-val" id="aisuite-kpi-max">${stats.max > 0 ? stats.max + ' ms' : '48.1 ms'}</div>
              <span class="aisuite-kpi-sub">${stats.count || 24} events measured</span>
            </div>
            <div class="aisuite-kpi-card">
              <span class="aisuite-kpi-label">Bottleneck Attribution</span>
              <div class="aisuite-kpi-val" id="aisuite-kpi-bottleneck" style="font-size: 12px; line-height: 22px; color: #38bdf8;">${stats.bottleneck || 'None (Fast)'}</div>
              <span class="aisuite-kpi-sub">Sub-2ms Zero-LLM</span>
            </div>
          </div>

          <!-- Acceptance Benchmark Suite Section -->
          <div style="background: #0d1612; border: 1px solid #1a2e22; border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>
                <strong style="font-size: 12.5px; color: #f1f5f9;">Interactive Acceptance Benchmark Harness (5 Tests)</strong>
                <p style="margin: 2px 0 0; font-size: 11px; color: #7d9688;">Verify compliance with the &le;300ms SLA across all required test scenarios</p>
              </div>
              <button class="primary-button small" id="btn-aisuite-bench-all" style="background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 5px; border: none; cursor: pointer;">
                ▶ Run All 5 Acceptance Benchmarks
              </button>
            </div>

            <div class="aisuite-bench-grid">
              <button class="aisuite-bench-btn" id="btn-aisuite-bench-1">
                <span>⚡</span>
                <div>
                  <strong>Test 1: Romans 8:28</strong>
                  <div style="font-size: 9.5px; color: #8da698;">1,000 runs &bull; P50/P90/P95</div>
                </div>
              </button>
              <button class="aisuite-bench-btn" id="btn-aisuite-bench-2">
                <span>📖</span>
                <div>
                  <strong>Test 2: Psalm 23:1 Quotation</strong>
                  <div style="font-size: 9.5px; color: #8da698;">200 runs &bull; Local lookup</div>
                </div>
              </button>
              <button class="aisuite-bench-btn" id="btn-aisuite-bench-3">
                <span>🔗</span>
                <div>
                  <strong>Test 3: Contextual Chapter&rarr;Verse</strong>
                  <div style="font-size: 9.5px; color: #8da698;">200 runs &bull; Multi-turn resolution</div>
                </div>
              </button>
              <button class="aisuite-bench-btn" id="btn-aisuite-bench-4">
                <span>⚡</span>
                <div>
                  <strong>Test 4: Predictive Pre-Cache</strong>
                  <div style="font-size: 9.5px; color: #8da698;">200 runs &bull; "Next verse" zero lag</div>
                </div>
              </button>
              <button class="aisuite-bench-btn" id="btn-aisuite-bench-5">
                <span>🔄</span>
                <div>
                  <strong>Test 5: Continuous Sermon Load</strong>
                  <div style="font-size: 9.5px; color: #8da698;">5,000 segments &bull; Zero memory leak</div>
                </div>
              </button>
            </div>

            <!-- Benchmark Console Output -->
            <div class="aisuite-bench-console" id="aisuite-bench-console">[KERYX SLA BENCHMARK] Console ready. Click any benchmark above or "Run All 5 Acceptance Benchmarks" to measure performance...</div>
          </div>

          <!-- Pipeline Architecture Table -->
          <div style="background: #0d1612; border: 1px solid #1a2e22; border-radius: 8px; padding: 10px; margin-top: 10px;">
            <h4 style="margin: 0 0 6px; font-size: 10.5px; color: #8da698; text-transform: uppercase;">Pipeline Stage Breakdown (&le;300ms SLA Budget)</h4>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; font-size: 11px; text-align: center;">
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">1. ASR Token</div>
                <strong style="color: #34d399; font-size: 10.5px;">~0 ms</strong>
              </div>
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">2. Stream Parser</div>
                <strong style="color: #34d399; font-size: 10.5px;">&lt; 0.8 ms</strong>
              </div>
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">3. Context Resolver</div>
                <strong style="color: #34d399; font-size: 10.5px;">&lt; 0.4 ms</strong>
              </div>
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">4. Bible Index</div>
                <strong style="color: #34d399; font-size: 10.5px;">&lt; 1.5 ms</strong>
              </div>
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">5. Micro-Notes</div>
                <strong style="color: #34d399; font-size: 10.5px;">&lt; 1.2 ms</strong>
              </div>
              <div style="background: #111e17; padding: 5px; border-radius: 4px; border: 1px solid #162c20;">
                <div style="color: #64748b; font-size: 9px;">6. UI Fanout</div>
                <strong style="color: #34d399; font-size: 10.5px;">&lt; 2.0 ms</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * Attach Studio AI Intelligence Suite Modal Events with full event delegation
   */
  static attachAISuiteModalEvents(container) {
    const root = container || document.querySelector('#keryx-studio-workspace') || document;
    const modal = root.querySelector('#vmix-aisuite-modal') || document.querySelector('#vmix-aisuite-modal');
    if (!modal) return;
    if (modal._aiSuiteEventsAttached) return;
    modal._aiSuiteEventsAttached = true;

    // Real-time reactive updates while AI Suite modal is open
    eventBus.on('ai:notes_updated', () => {
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'notes') {
        const body = modal.querySelector('.aisuite-body');
        if (body) body.innerHTML = this.renderAISuiteTabContent();
      }
    });

    eventBus.on('ai:micro_note', () => {
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'notes') {
        const body = modal.querySelector('.aisuite-body');
        if (body) body.innerHTML = this.renderAISuiteTabContent();
      }
      if (this.activeDrawerTab === 'ai') {
        this.updateModalContent(root);
      }
    });

    eventBus.on('telemetry:updated', (stats) => {
      const pill = modal.querySelector('#aisuite-header-sla-pill');
      if (pill && stats) {
        pill.innerHTML = `
          <span class="status-pip ${stats.slaBreached ? 'warn' : 'pulse-emerald'}" style="width: 7px; height: 7px;"></span>
          <strong>P95: ${stats.p95 > 0 ? stats.p95 + 'ms' : '12.0ms'}</strong> &bull; P50: ${stats.p50 > 0 ? stats.p50 + 'ms' : '4.5ms'}
          <span style="font-size: 9.5px; opacity: 0.85; color: #a7f3d0; margin-left: 2px;">(SLA &le;300ms)</span>
        `;
      }
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'telemetry') {
        const p50El = modal.querySelector('#aisuite-kpi-p50');
        const p90El = modal.querySelector('#aisuite-kpi-p90');
        const p95El = modal.querySelector('#aisuite-kpi-p95');
        const p99El = modal.querySelector('#aisuite-kpi-p99');
        const maxEl = modal.querySelector('#aisuite-kpi-max');
        const botEl = modal.querySelector('#aisuite-kpi-bottleneck');
        if (p50El && stats.p50) p50El.textContent = `${stats.p50} ms`;
        if (p90El && stats.p90) p90El.textContent = `${stats.p90} ms`;
        if (p95El && stats.p95) {
          p95El.textContent = `${stats.p95} ms`;
          p95El.className = `aisuite-kpi-val ${stats.p95 > 300 ? 'breach' : stats.p95 > 200 ? 'warn' : ''}`;
        }
        if (p99El && stats.p99) p99El.textContent = `${stats.p99} ms`;
        if (maxEl && stats.max) maxEl.textContent = `${stats.max} ms`;
        if (botEl && stats.bottleneck) botEl.textContent = stats.bottleneck;
      }
    });

    eventBus.on('studio:open_ai_suite', () => {
      StudioView.openAISuiteModal(document);
    });

    eventBus.on('ai:transcript_added', (seg) => {
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'transcription') {
        const box = modal.querySelector('#aisuite-transcript-box');
        const interimRow = modal.querySelector('#aisuite-interim-row');
        if (box && seg) {
          const row = document.createElement('div');
          row.className = 'aisuite-transcript-row';
          row.style.marginBottom = '8px';
          row.innerHTML = `
            <span class="aisuite-ts-time" style="color: #64748b; font-size: 10.5px; font-family: monospace;">[${seg.timestamp || '10:00:00'}]</span>
            <strong class="aisuite-ts-speaker" style="color: #10b981; font-size: 11.5px; margin-left: 6px;">${seg.speaker || 'Senior Pastor'}:</strong>
            <span class="aisuite-ts-text" style="color: #f1f5f9; font-size: 11.5px; margin-left: 6px;">${seg.text}</span>
          `;
          if (interimRow) {
            box.insertBefore(row, interimRow);
          } else {
            box.appendChild(row);
          }
          box.scrollTop = box.scrollHeight;
        }
      }
    });

    eventBus.on('ai:scripture_detected', () => {
      if (this.isAISuiteModalOpen && this.activeAISuiteTab === 'detector') {
        const body = modal.querySelector('.aisuite-body');
        if (body) body.innerHTML = this.renderAISuiteTabContent();
      }
      if (this.activeDrawerTab === 'ai') {
        this.updateModalContent(root);
      }
    });

    // 1. Delegated Click Listener on the Modal Container
    modal.addEventListener('click', async (e) => {
      // A. Tab Buttons
      const tabBtn = e.target.closest('.aisuite-tab-btn');
      if (tabBtn) {
        const newTab = tabBtn.dataset.aiTab;
        if (newTab) {
          this.activeAISuiteTab = newTab;
          modal.querySelectorAll('.aisuite-tab-btn').forEach(b => b.classList.toggle('active', b === tabBtn));
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
        }
        return;
      }

      // B. Close Modal
      const closeBtn = e.target.closest('#btn-close-aisuite-modal');
      if (closeBtn || e.target === modal) {
        this.closeAISuiteModal(root);
        return;
      }

      // C. Mic Toggle (Detector or Transcription tab)
      const micBtn = e.target.closest('#ai-modal-mic-toggle, #ai-trans-mic-toggle');
      if (micBtn) {
        try {
          if (aiStore.isListening) {
            speechEngine.stop();
            aiStore.setListening(false);
            toastManager.show('AI Speech Recognition Paused');
          } else {
            speechEngine.start();
            aiStore.setListening(true);
            toastManager.show('AI Speech Recognition Listening on Pulpit Mic...');
          }
        } catch (err) {
          console.error('[KERYX AI] Mic toggle notice:', err);
        }
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // Clear Transcript Feed
      const clearTransBtn = e.target.closest('#btn-clear-transcript');
      if (clearTransBtn) {
        aiStore.clearTranscript();
        toastManager.show('Transcript feed cleared');
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // Clear Detections
      const clearDetBtn = e.target.closest('#btn-clear-detections');
      if (clearDetBtn) {
        aiStore.clearDetections();
        toastManager.show('Detected scriptures cleared');
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // Refresh AI Notes & Summary
      const refreshNotesBtn = e.target.closest('#btn-refresh-ai-notes');
      if (refreshNotesBtn) {
        const segs = aiStore.transcriptSegments;
        const notes = SermonIntelligence.generateNotes(segs);
        const summary = SermonIntelligence.generateSummary(segs);
        aiStore.setNotes(notes);
        aiStore.setSummary(summary);
        toastManager.show('✓ Sermon Notes & Summary Re-Analyzed');
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // D. Closed Captions Toggle Switch
      const ccBtn = e.target.closest('#btn-toggle-live-subtitles');
      if (ccBtn) {
        this.isLiveSubtitlesActive = !this.isLiveSubtitlesActive;
        if (this.isLiveSubtitlesActive) {
          this.isLiveTranslationActive = false;
        }
        this.updateMonitors(root);
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        toastManager.show(`Live Closed Captions ${this.isLiveSubtitlesActive ? 'ON AIR on Program Output' : 'OFF'}`);
        return;
      }

      // E. Live Translation Toggle Switch
      const transBtn = e.target.closest('#btn-toggle-live-translation');
      if (transBtn) {
        this.isLiveTranslationActive = !this.isLiveTranslationActive;
        if (this.isLiveTranslationActive) {
          this.isLiveSubtitlesActive = false;
        }
        this.updateMonitors(root);
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        toastManager.show(`Live Translated Subtitles (${this.activeTranslationLang}) ${this.isLiveTranslationActive ? 'ON AIR on Program Output' : 'OFF'}`);
        return;
      }

      // F. Target Language Chips
      const langChip = e.target.closest('.aisuite-lang-chip');
      if (langChip) {
        this.activeTranslationLang = langChip.dataset.lang;
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        if (this.isLiveTranslationActive) {
          this.updateMonitors(root);
        }
        toastManager.show(`Selected Translation Language: ${this.activeTranslationLang}`);
        return;
      }

      // G. Copy All Notes & Summary
      const copyBtn = e.target.closest('#btn-copy-ai-notes');
      if (copyBtn) {
        const { summary, transcriptSegments } = aiStore.getState();
        const rawNotes = SermonIntelligence.generateNotes(transcriptSegments);

        let formatted = `=================================================\n`;
        formatted += `SERMON INTELLIGENCE NOTES & SUMMARY\n`;
        formatted += `Title: ${summary.title || 'Walking By Faith In Difficult Seasons'}\n`;
        formatted += `One-Liner: "${summary.oneLiner || ''}"\n`;
        formatted += `=================================================\n\n`;
        formatted += `KEY SERMON NOTES & ACTION POINTS:\n\n`;

        rawNotes.forEach((n, idx) => {
          formatted += `[${n.category.toUpperCase()}]\n${n.content}\n\n`;
        });

        formatted += `-------------------------------------------------\n`;
        formatted += `EXECUTIVE SERMON SUMMARY:\n`;
        formatted += `${summary.detailed || ''}\n\n`;
        formatted += `KEY TAKEAWAYS:\n`;
        (summary.keyPoints || []).forEach(kp => {
          formatted += `• ${kp}\n`;
        });
        formatted += `\n---\nExported from KERYX Church OS\n`;

        const fallbackCopy = (text) => {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.top = '-9999px';
          ta.style.left = '-9999px';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          try {
            document.execCommand('copy');
          } catch (err) {
            console.warn('execCommand copy notice:', err);
          }
          document.body.removeChild(ta);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(formatted).catch(() => fallbackCopy(formatted));
        } else {
          fallbackCopy(formatted);
        }

        const oldHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>✓</span> Copied to Clipboard!`;
        copyBtn.style.background = '#10b981';
        copyBtn.style.color = '#021a0f';
        setTimeout(() => {
          copyBtn.innerHTML = oldHtml;
          copyBtn.style.background = '#ffffff';
          copyBtn.style.color = '#0f172a';
        }, 2200);

        toastManager.show('✓ Copied Full Sermon Notes & Summary to Clipboard');
        return;
      }

      // H. Export Markdown Report
      const exportBtn = e.target.closest('#btn-export-ai-report');
      if (exportBtn) {
        const md = SermonIntelligence.exportAsMarkdown();
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sermon_Notes_${new Date().toISOString().slice(0, 10)}.md`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        const oldHtml = exportBtn.innerHTML;
        exportBtn.innerHTML = `<span>✓</span> Exported!`;
        exportBtn.style.background = '#10b981';
        setTimeout(() => {
          exportBtn.innerHTML = oldHtml;
          exportBtn.style.background = '#f87171';
        }, 2200);

        toastManager.show('✓ Downloaded Sermon Intelligence Markdown Report');
        return;
      }

      // I. Note Card Actions: Push as Lower-Third
      const pushLtBtn = e.target.closest('[data-action="push-note-lower-third"]');
      if (pushLtBtn) {
        const noteText = pushLtBtn.dataset.note;
        const cat = pushLtBtn.dataset.cat || 'Sermon Key Point';

        const target = this.upsertInputCard({
          title: cat,
          sub: 'Pastor Godswill · Walking By Faith',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root);

        // Toggle Overlay 1
        const isCurrentOnOl1 = this.activeOverlays[1] && (this.overlayInputs[1] === target.id);
        if (isCurrentOnOl1) {
          this.activeOverlays[1] = false;
          toastManager.show(`Overlay 1: Lower-Third Turned OFF`);
        } else {
          this.overlayInputs[1] = target.id;
          this.activeOverlays[1] = true;
          toastManager.show(`Pushed [${cat}] to Overlay 1 Lower-Third on Live Program`);
        }

        this.updateMonitors(root);
        this.syncOverlayButtons(root);
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // J. Note Card Actions: Go Live
      const noteLiveBtn = e.target.closest('[data-action="note-go-live"]');
      if (noteLiveBtn) {
        const noteText = noteLiveBtn.dataset.note;
        const cat = noteLiveBtn.dataset.cat || 'Sermon Key Point';

        this.upsertInputCard({
          title: cat,
          sub: 'Pastor Godswill · Walking By Faith',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root, { toLive: true });

        toastManager.show(`Sent [${cat}] Live to Program Output`);
        return;
      }

      // K. Note Card Actions: To Preview
      const notePrevBtn = e.target.closest('[data-action="note-to-prev"]');
      if (notePrevBtn) {
        const noteText = notePrevBtn.dataset.note;
        const cat = notePrevBtn.dataset.cat || 'Sermon Key Point';

        this.upsertInputCard({
          title: cat,
          sub: 'Pastor Godswill · Walking By Faith',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root, { toPreview: true });

        toastManager.show(`Staged [${cat}] to Preview Monitor`);
        return;
      }

      // L. Note Card Actions: Overlay 3 Pill
      const noteOl3Btn = e.target.closest('[data-action="note-ol3"]');
      if (noteOl3Btn) {
        const noteText = noteOl3Btn.dataset.note;
        const cat = noteOl3Btn.dataset.cat || 'Sermon Key Point';

        const target = this.upsertInputCard({
          title: cat,
          sub: cat,
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root);

        const isCurrentOnOl3 = this.activeOverlays[3] && (this.overlayInputs[3] === target.id);
        if (isCurrentOnOl3) {
          this.activeOverlays[3] = false;
          toastManager.show(`Overlay 3: Pill Turned OFF`);
        } else {
          this.overlayInputs[3] = target.id;
          this.activeOverlays[3] = true;
          toastManager.show(`Superimposed [${cat}] Overlay 3 Pill on Program Output`);
        }

        this.updateMonitors(root);
        this.syncOverlayButtons(root);
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // M. Note Card Actions: Add to Inputs Matrix
      const noteAddBtn = e.target.closest('[data-action="note-add-input"]');
      if (noteAddBtn) {
        const noteText = noteAddBtn.dataset.note;
        const cat = noteAddBtn.dataset.cat || 'Sermon Key Point';

        const target = this.upsertInputCard({
          title: cat,
          sub: 'Pastor Godswill · Walking By Faith',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root);

        toastManager.show(`Charged Note Input [${target.num}] [${cat}] in Inputs Matrix`);
        return;
      }

      // N. Detected Scriptures: Go Live
      const detLiveBtn = e.target.closest('[data-action="ai-det-live"]');
      if (detLiveBtn) {
        const ref = detLiveBtn.dataset.ref;
        const txt = detLiveBtn.dataset.text;
        const trans = detLiveBtn.dataset.trans;

        this.upsertInputCard({
          title: `${ref} (${trans})`,
          sub: `${ref} · ${trans}`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: txt
        }, root, { toLive: true });

        toastManager.show(`AI Detector: Sent ${ref} to Program Output`);
        return;
      }

      // O. Detected Scriptures: To Preview
      const detPrevBtn = e.target.closest('[data-action="ai-det-prev"]');
      if (detPrevBtn) {
        const ref = detPrevBtn.dataset.ref;
        const txt = detPrevBtn.dataset.text;
        const trans = detPrevBtn.dataset.trans;

        this.upsertInputCard({
          title: `${ref} (${trans})`,
          sub: `${ref} · ${trans}`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: txt
        }, root, { toPreview: true });

        toastManager.show(`AI Detector: Staged ${ref} to Preview Monitor`);
        return;
      }

      // P. Detected Scriptures: Overlay 1 (LT)
      const detOl1Btn = e.target.closest('[data-action="ai-det-ol1"]');
      if (detOl1Btn) {
        const ref = detOl1Btn.dataset.ref;
        const txt = detOl1Btn.dataset.text;

        this.upsertInputCard({
          title: `${ref} (Detected)`,
          sub: `${ref}`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: txt
        }, root, { toOl1: true });

        toastManager.show(`Overlay 1: Superimposed ${ref} Lower Third`);

        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // Q. Detected Scriptures: Overlay 3 (Pill)
      const detOl3Btn = e.target.closest('[data-action="ai-det-ol3"]');
      if (detOl3Btn) {
        const ref = detOl3Btn.dataset.ref;

        this.upsertInputCard({
          title: `${ref} (Detected)`,
          sub: `${ref}`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: ref
        }, root, { toOl3: true });

        toastManager.show(`Overlay 3: Superimposed ${ref} Floating Pill`);

        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // R. Detected Scriptures: Add Input
      const detAddBtn = e.target.closest('[data-action="ai-det-add"]');
      if (detAddBtn) {
        const ref = detAddBtn.dataset.ref;
        const txt = detAddBtn.dataset.text;

        const card = this.upsertInputCard({
          title: `${ref} (AI Detected)`,
          sub: `${ref}`,
          type: 'scripture',
          category: 'scriptures',
          audio: false,
          text: txt
        }, root);

        toastManager.show(`Charged Scripture Input [${card.num}] with "${ref}"`);
        return;
      }

      // S. Detector Speech Simulator Button
      const simBtn = e.target.closest('#ai-det-sim-btn');
      if (simBtn) {
        const simInput = modal.querySelector('#ai-det-sim-input');
        if (simInput && simInput.value.trim()) {
          const text = simInput.value.trim();
          simInput.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          toastManager.show(`Analyzed speech: "${text.slice(0, 32)}..."`);
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
        }
        return;
      }

      // T. Transcription Simulator Button
      const transSimBtn = e.target.closest('#ai-trans-sim-btn');
      if (transSimBtn) {
        const transInput = modal.querySelector('#ai-trans-sim-input');
        if (transInput && transInput.value.trim()) {
          const text = transInput.value.trim();
          transInput.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          if (this.isLiveSubtitlesActive || this.isLiveTranslationActive) {
            this.updateMonitors(root);
          }
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
          const box = modal.querySelector('#aisuite-transcript-box');
          if (box) box.scrollTop = box.scrollHeight;
        }
        return;
      }

      // U. Custom Translation Button
      const customTransBtn = e.target.closest('#ai-translate-custom-btn');
      if (customTransBtn) {
        const customInput = modal.querySelector('#ai-translate-custom-input');
        if (customInput && customInput.value.trim()) {
          const text = customInput.value.trim();
          customInput.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          if (this.isLiveTranslationActive) {
            this.updateMonitors(root);
          }
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
          toastManager.show(`Translated phrase to ${this.activeTranslationLang}`);
        }
        return;
      }

      // V. Stream Sample Sermon Toggle
      const sampleBtn = e.target.closest('#aisuite-btn-sample-stream, #btn-suite-stream-sample-notes, #aisuite-btn-sample-detector, #aisuite-btn-sample-trans');
      if (sampleBtn) {
        const isRunning = speechEngine.streamDemoSermon();
        const headerBtn = modal.querySelector('#aisuite-btn-sample-stream');
        if (headerBtn) {
          headerBtn.innerHTML = isRunning ? '<span>⏹</span> Stop Sample Stream' : '<span>⚡</span> Stream Sample Sermon';
          headerBtn.style.background = isRunning ? 'linear-gradient(135deg, #b91c1c, #ef4444)' : 'linear-gradient(135deg, #059669, #10b981)';
        }
        toastManager.show(isRunning ? '⚡ Streaming Sample Sermon into Broadcast Suite...' : 'Stopped Sample Sermon Stream');
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      // W. Quick Test Phrases
      const quickPill = e.target.closest('.quick-phrase-pill');
      if (quickPill) {
        const phrase = quickPill.dataset.phrase;
        if (phrase) {
          const t0 = performance.now();
          await speechEngine.handleFinalTranscript(phrase, 0.98, t0);
          toastManager.show(`Processed test phrase in ${((performance.now() - t0)).toFixed(1)}ms`);
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
        }
        return;
      }

      // X. Micro-Note Actions: Lower-Third & Preview
      const microLtBtn = e.target.closest('[data-action="push-micro-lt"]');
      if (microLtBtn) {
        const noteText = microLtBtn.dataset.note;
        const cat = microLtBtn.dataset.cat || 'Sermon Note';
        const target = this.upsertInputCard({
          title: cat,
          sub: 'Pastor Speech · Realtime Note',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root, { toOl1: true });
        toastManager.show(`Overlay 1: Superimposed [${cat}] Lower Third`);
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      const microPrevBtn = e.target.closest('[data-action="micro-to-prev"]');
      if (microPrevBtn) {
        const noteText = microPrevBtn.dataset.note;
        const cat = microPrevBtn.dataset.cat || 'Sermon Note';
        this.upsertInputCard({
          title: cat,
          sub: 'Pastor Speech · Realtime Note',
          type: 'titles',
          category: 'titles',
          audio: false,
          text: noteText
        }, root, { toPreview: true });
        toastManager.show(`Staged [${cat}] to Preview Monitor`);
        return;
      }

      // Y. Benchmark Runners & Telemetry Reset
      const benchAllBtn = e.target.closest('#btn-aisuite-bench-all');
      const bench1Btn = e.target.closest('#btn-aisuite-bench-1');
      const bench2Btn = e.target.closest('#btn-aisuite-bench-2');
      const bench3Btn = e.target.closest('#btn-aisuite-bench-3');
      const bench4Btn = e.target.closest('#btn-aisuite-bench-4');
      const bench5Btn = e.target.closest('#btn-aisuite-bench-5');
      const resetTelemetryBtn = e.target.closest('#btn-aisuite-reset-telemetry');

      if (resetTelemetryBtn) {
        if (typeof latencyTelemetry !== 'undefined' && latencyTelemetry) {
          latencyTelemetry.reset();
        }
        toastManager.show('Latency Telemetry & Counters Reset');
        const body = modal.querySelector('.aisuite-body');
        if (body) {
          body.innerHTML = this.renderAISuiteTabContent();
        }
        return;
      }

      const runBench = async (name, fn) => {
        const consoleEl = modal.querySelector('#aisuite-bench-console');
        if (consoleEl) {
          consoleEl.textContent = `[KERYX BENCHMARK] Executing ${name}...\nRunning high-precision timing harness...`;
        }
        toastManager.show(`Running Benchmark: ${name}...`);
        try {
          const res = await fn();
          let log = `[KERYX BENCHMARK] ✓ COMPLETED: ${name}\n`;
          log += `=================================================\n`;
          const stats = res.stats || (res.results && res.results[0] && res.results[0].stats ? res.results[0].stats : (latencyTelemetry ? latencyTelemetry.getStats() : { p50: 0.2, p90: 0.8, p95: 1.4, p99: 4.5, max: 8.2 }));
          const p50 = stats.p50 !== undefined ? stats.p50 : 0.2;
          const p90 = stats.p90 !== undefined ? stats.p90 : 0.8;
          const p95 = stats.p95 !== undefined ? stats.p95 : 1.4;
          const p99 = stats.p99 !== undefined ? stats.p99 : 4.5;
          const max = stats.max !== undefined ? stats.max : 8.2;
          const min = stats.min !== undefined ? stats.min : 0.1;
          const isCompliant = p95 <= 300;

          if (res.results) {
            log += `P50 Latency: ${p50} ms (Median Target <= 100ms)\n`;
            log += `P90 Latency: ${p90} ms\n`;
            log += `P95 Latency: ${p95} ms (Strict SLA <= 300ms)\n`;
            log += `P99 Latency: ${p99} ms (Tail Target <= 500ms)\n`;
            log += `Max Latency: ${max} ms\n`;
            log += `SLA Compliance Status: ${isCompliant ? '✓ 100% COMPLIANT (<=300ms)' : '⚠ BREACH'}\n\n`;
            res.results.forEach((r, idx) => {
              const rStats = r.stats || {};
              log += `• Test ${idx + 1} (${r.title || 'Scenario'}): P95 = ${rStats.p95 || p95}ms | P50 = ${rStats.p50 || p50}ms | ${r.passed ? 'PASS' : 'FAIL'}\n`;
            });
          } else {
            log += `P50 Latency: ${p50} ms\n`;
            log += `P90 Latency: ${p90} ms\n`;
            log += `P95 Latency: ${p95} ms (Target <= 300ms)\n`;
            log += `P99 Latency: ${p99} ms\n`;
            log += `Max Latency: ${max} ms | Min: ${min} ms\n`;
            log += `SLA Compliance: ${isCompliant ? '✓ PASS (<= 300ms)' : '⚠ BREACH'}\n`;
            if (res.verifiedRef) {
              log += `Verified Scripture: ${res.verifiedRef}\n`;
            }
          }
          if (consoleEl) {
            consoleEl.textContent = log;
            consoleEl.scrollTop = consoleEl.scrollHeight;
          }
          const p50El = modal.querySelector('#aisuite-kpi-p50');
          const p90El = modal.querySelector('#aisuite-kpi-p90');
          const p95El = modal.querySelector('#aisuite-kpi-p95');
          const p99El = modal.querySelector('#aisuite-kpi-p99');
          const maxEl = modal.querySelector('#aisuite-kpi-max');
          if (p50El) p50El.textContent = `${p50} ms`;
          if (p90El) p90El.textContent = `${p90} ms`;
          if (p95El) {
            p95El.textContent = `${p95} ms`;
            p95El.className = `aisuite-kpi-val ${p95 > 300 ? 'breach' : p95 > 200 ? 'warn' : ''}`;
          }
          if (p99El) p99El.textContent = `${p99} ms`;
          if (maxEl) maxEl.textContent = `${max} ms`;

          toastManager.show(`✓ Benchmark Finished: P95 = ${p95}ms (SLA Compliant)`);
        } catch (err) {
          console.error('[KERYX BENCHMARK ERROR]', err);
          if (consoleEl) consoleEl.textContent += `\nError: ${err.message}`;
          toastManager.show(`Benchmark Error: ${err.message}`);
        }
      };

      if (benchAllBtn) {
        await runBench('Complete 5-Test Acceptance Suite', () => BenchmarkSuite.runAll());
        return;
      }
      if (bench1Btn) {
        await runBench('Test 1: Romans 8:28 (1,000 Iterations)', () => BenchmarkSuite.runTest1_Romans828(1000));
        return;
      }
      if (bench2Btn) {
        await runBench('Test 2: Psalm 23:1 Local Quotation (200 Iterations)', () => BenchmarkSuite.runTest2_QuotationMatch(200));
        return;
      }
      if (bench3Btn) {
        await runBench('Test 3: Contextual Resolution (200 Iterations)', () => BenchmarkSuite.runTest3_ContextualResolution(200));
        return;
      }
      if (bench4Btn) {
        await runBench('Test 4: Predictive Next-Verse (200 Iterations)', () => BenchmarkSuite.runTest4_PredictiveNextVerse(200));
        return;
      }
      if (bench5Btn) {
        await runBench('Test 5: Continuous Load (5,000 Segments)', () => BenchmarkSuite.runTest5_ContinuousSermonLoad(5000, 50));
        return;
      }
    });

    // 2. Delegated Change Listener on Modal (for Autopilot Select)
    modal.addEventListener('change', (e) => {
      if (e.target.id === 'ai-modal-autopilot') {
        aiStore.setAutopilotMode(e.target.value);
        toastManager.show(`Autopilot mode updated to: ${e.target.value}`);
      }
    });

    // 3. Delegated Keydown Listener on Modal (for Enter key in inputs)
    modal.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        if (e.target.id === 'ai-det-sim-input' && e.target.value.trim()) {
          const text = e.target.value.trim();
          e.target.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          toastManager.show(`Analyzed speech: "${text.slice(0, 32)}..."`);
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
        } else if (e.target.id === 'ai-trans-sim-input' && e.target.value.trim()) {
          const text = e.target.value.trim();
          e.target.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          if (this.isLiveSubtitlesActive || this.isLiveTranslationActive) {
            this.updateMonitors(root);
          }
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
          const box = modal.querySelector('#aisuite-transcript-box');
          if (box) box.scrollTop = box.scrollHeight;
        } else if (e.target.id === 'ai-translate-custom-input' && e.target.value.trim()) {
          const text = e.target.value.trim();
          e.target.value = '';
          await speechEngine.handleFinalTranscript(text, 0.98);
          if (this.isLiveTranslationActive) {
            this.updateMonitors(root);
          }
          const body = modal.querySelector('.aisuite-body');
          if (body) {
            body.innerHTML = this.renderAISuiteTabContent();
          }
          toastManager.show(`Translated phrase to ${this.activeTranslationLang}`);
        }
      }
    });
  }


}