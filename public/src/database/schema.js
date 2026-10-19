/**
 * KERYX Database Schema & Entity Definitions
 * Strongly typed relational entity models for offline-first church operations.
 */

export const SCHEMA_VERSION = 1;

export const TABLE_NAMES = {
  ORGANIZATIONS: 'organizations',
  CHURCHES: 'churches',
  CAMPUSES: 'campuses',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  SERVICES: 'services',
  SERVICE_ITEMS: 'service_items',
  PRESENTATIONS: 'presentations',
  SLIDES: 'slides',
  SONGS: 'songs',
  SONG_SECTIONS: 'song_sections',
  BIBLE_TRANSLATIONS: 'bible_translations',
  BIBLE_BOOKS: 'bible_books',
  BIBLE_VERSES: 'bible_verses',
  CUSTOM_SCRIPTURES: 'custom_scriptures',
  SCRIPTURE_QUEUE: 'scripture_queue',
  MEDIA_ASSETS: 'media_assets',
  SERMONS: 'sermons',
  TRANSCRIPTS: 'transcripts',
  TRANSCRIPT_SEGMENTS: 'transcript_segments',
  AI_NOTES: 'ai_notes',
  AI_SUMMARIES: 'ai_summaries',
  SCRIPTURE_DETECTIONS: 'scripture_detections',
  AI_EVENTS: 'ai_events',
  OUTPUT_SCREENS: 'output_screens',
  TEMPLATES: 'templates',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs'
};

export const DEFAULT_ROLES = [
  {
    id: 'role_owner',
    name: 'Owner',
    description: 'Full organizational authority and church administrative ownership',
    permissions: ['*']
  },
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    description: 'System administration across all campuses and settings',
    permissions: ['*']
  },
  {
    id: 'role_pastor',
    name: 'Pastor',
    description: 'Sermon preparation, Bible research, notes, sermon archive, presentation approval',
    permissions: [
      'can_view_dashboard',
      'can_manage_bible',
      'can_manage_custom_scriptures',
      'can_edit_presentations',
      'can_manage_services',
      'can_manage_sermons',
      'can_export_sermons',
      'can_manage_ai',
      'can_view_analytics'
    ]
  },
  {
    id: 'role_media_director',
    name: 'Media Director',
    description: 'Full live production, screen routing, livestream, media, and presentations',
    permissions: [
      'can_view_dashboard',
      'can_manage_services',
      'can_edit_presentations',
      'can_control_live',
      'can_control_outputs',
      'can_manage_media',
      'can_manage_bible',
      'can_manage_songs',
      'can_manage_stream',
      'can_manage_ai',
      'can_manage_settings'
    ]
  },
  {
    id: 'role_presentation_operator',
    name: 'Presentation Operator',
    description: 'Live control room operator: preview, live, lyrics, scriptures, detection queue',
    permissions: [
      'can_view_dashboard',
      'can_control_live',
      'can_control_outputs',
      'can_view_bible',
      'can_view_songs',
      'can_view_media',
      'can_manage_custom_scriptures',
      'can_approve_ai_scriptures'
    ]
  },
  {
    id: 'role_worship_leader',
    name: 'Worship Leader',
    description: 'Songs library, lyrics structuring, setlists, and worship presentations',
    permissions: [
      'can_view_dashboard',
      'can_manage_songs',
      'can_edit_presentations',
      'can_view_bible'
    ]
  },
  {
    id: 'role_volunteer',
    name: 'Volunteer',
    description: 'Simple live slide advancement and assigned service tasks with safe boundaries',
    permissions: [
      'can_view_dashboard',
      'can_control_live'
    ]
  }
];

export const ALL_PERMISSIONS = [
  { id: 'can_manage_users', label: 'Manage Users & Permissions' },
  { id: 'can_manage_church', label: 'Manage Church Profile & Campuses' },
  { id: 'can_manage_bible', label: 'Manage Bible Translations & Books' },
  { id: 'can_manage_custom_scriptures', label: 'Create & Edit Custom Scriptures' },
  { id: 'can_manage_songs', label: 'Manage Worship Songs & Lyrics' },
  { id: 'can_manage_media', label: 'Manage Media Asset Library' },
  { id: 'can_manage_services', label: 'Plan & Build Service Timelines' },
  { id: 'can_edit_presentations', label: 'Create & Edit Presentation Slides' },
  { id: 'can_control_live', label: 'Control Live Broadcast & Outputs' },
  { id: 'can_control_outputs', label: 'Configure Display Screen Routing' },
  { id: 'can_manage_ai', label: 'Configure AI Speech & Autopilot Modes' },
  { id: 'can_approve_ai_scriptures', label: 'Approve AI Detected Scriptures' },
  { id: 'can_manage_stream', label: 'Control Livestream & Recording' },
  { id: 'can_manage_sermons', label: 'Manage Sermon Archive & Transcripts' },
  { id: 'can_export_sermons', label: 'Export Sermon Notes & Summaries' },
  { id: 'can_view_analytics', label: 'View Ministry & Service Analytics' },
  { id: 'can_manage_settings', label: 'Manage System & Control Room Settings' }
];

