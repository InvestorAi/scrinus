/**
 * KERYX Application Router & Shell Coordinator
 * Orchestrates mega menu, sidebar navigation, view rendering, and broadcast controller bar.
 * Expanded with V2 features: Stream Studio, Analytics, Marketplace, and AI Copilot.
 */

import { appStore } from '../stores/appStore.js';
import { liveStore } from '../stores/liveStore.js';
import { aiStore } from '../stores/aiStore.js';
import { eventBus } from '../core/eventBus.js';
import { MegaMenuController } from './megaMenu.js';
import { CommandPalette } from './commandPalette.js';
import { KeyboardShortcuts } from './keyboardShortcuts.js';
import { PreflightDiagnostics } from './preflight.js';
import { PreviewLiveBar } from '../features/preview-live/previewLiveBar.js';
import { toastManager } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { DEFAULT_ROLES } from '../database/schema.js';
import { AICopilot } from '../features/ai/aiCopilot.js';
import { timerWidget } from '../features/tools/timerWidget.js';

// Feature Views
import { DashboardView } from '../features/dashboard/dashboardView.js';
import { ServiceView } from '../features/service/serviceView.js';
import { PresentationView } from '../features/presentation/presentationView.js';
import { BibleView } from '../features/bible/bibleView.js';
import { CustomScriptureView } from '../features/custom-scripture/customScriptureView.js';
import { SongsView } from '../features/songs/songsView.js';
import { MediaView } from '../features/media/mediaView.js';
import { SermonsView } from '../features/sermons/sermonsView.js';
import { AICenterView } from '../features/ai/aiCenterView.js';
import { OutputsView } from '../features/outputs/outputsView.js';
import { StreamView } from '../features/streaming/streamView.js';
import { AnalyticsView } from '../features/analytics/analyticsView.js';
import { MarketplaceView } from '../features/marketplace/marketplaceView.js';
import { ChurchView } from '../features/church/churchView.js';
import { SettingsView } from '../features/settings/settingsView.js';
import { RemoteView } from '../features/remote/remoteView.js';
import { StudioView } from '../features/studio/studioView.js';
import { AuthView } from '../features/auth/authView.js';

export class AppRouter {
  static init() {
    KeyboardShortcuts.init();
    PreflightDiagnostics.init();

    // Re-render on app state change, live change, or explicit refresh
    eventBus.on('app:changed', () => this.render());
    eventBus.on('live:changed', () => this.updateBroadcastBar());
    eventBus.on('view:navigate', () => this.render());
    eventBus.on('view:refresh', () => this.render());

    // Support browser back/forward and direct hash navigation (e.g. #Studio, #Dashboard, #ai, #settings)
    window.addEventListener('hashchange', () => {
      let hash = window.location.hash.replace('#', '').trim();
      if (hash.startsWith('/')) hash = hash.slice(1);
      const view = AppRouter.normalizeViewName(hash);
      if (view && view !== appStore.getState().activeView) {
        appStore.setActiveView(view);
      }
    });

    // Handle initial hash on boot
    let initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash.startsWith('/')) initialHash = initialHash.slice(1);
    if (initialHash) {
      const view = AppRouter.normalizeViewName(initialHash);
      if (view) {
        appStore.activeView = view;
      }
    }

    this.render();
  }

  static normalizeViewName(raw) {
    if (!raw) return 'Dashboard';
    const clean = raw.toLowerCase().replace(/[-_/]/g, '');
    const map = {
      'dashboard': 'Dashboard',
      'studio': 'Studio',
      'service': 'Service',
      'present': 'Present',
      'bible': 'Bible',
      'bibleshow': 'Bible',
      'customscripture': 'CustomScripture',
      'scriptures': 'CustomScripture',
      'songs': 'Songs',
      'media': 'Media',
      'sermons': 'Sermons',
      'ai': 'AI Center',
      'aicenter': 'AI Center',
      'stream': 'Stream',
      'outputs': 'Outputs',
      'remote': 'Remote',
      'analytics': 'Analytics',
      'marketplace': 'Marketplace',
      'church': 'Church',
      'settings': 'Settings'
    };
    return map[clean] || raw;
  }

  static render() {
    const root = document.querySelector('#app');
    if (!root) return;

    try {
      const state = appStore.getState() || {};
      const church = state.church || { name: 'Grace City Community Church' };
      const currentUser = state.currentUser || { name: 'Godswill Johnson', role: 'role_owner', title: 'Senior Pastor & System Overseer' };
      const activeView = state.activeView || 'Dashboard';
      const liveState = liveStore.getState() || {};

      const userName = currentUser.name || 'Godswill Johnson';
      const userInitials = (userName.slice(0, 2) || 'GJ').toUpperCase();

      // If church has not been setup, show onboarding
      if (!church || !church.name) {
        root.innerHTML = AuthView.renderOnboarding();
        AuthView.attachEvents(root);
        return;
      }

      const navItems = [
        { id: 'Dashboard', icon: '▦', label: 'Dashboard' },
        { id: 'Studio', icon: '🎛', label: 'Church Studio', badge: 'LIVE' },
        { id: 'Service', icon: '◫', label: 'Service' },
        { id: 'Present', icon: '▶', label: 'Present' },
        { id: 'Bible', icon: '📖', label: 'Bible Show' },
        { id: 'CustomScripture', icon: '✎', label: 'Scriptures' },
        { id: 'Songs', icon: '♫', label: 'Songs' },
        { id: 'Media', icon: '▣', label: 'Media' },
        { id: 'Sermons', icon: '▤', label: 'Sermons' },
        { id: 'AI Center', icon: '✳', label: 'AI Center', badge: aiStore.detectedScriptures?.length || '3' },
        { id: 'Stream', icon: '◉', label: 'Stream' },
        { id: 'Outputs', icon: '🖥', label: 'Outputs' },
        { id: 'Remote', icon: '📱', label: 'Remote' },
        { id: 'Analytics', icon: '◒', label: 'Analytics' },
        { id: 'Marketplace', icon: '🛒', label: 'Marketplace' },
        { id: 'Church', icon: '⌂', label: 'Church' },
        { id: 'Settings', icon: '⚙', label: 'Settings' }
      ];

      root.innerHTML = `
        <div class="keryx-desktop-root ${activeView === 'Studio' ? 'is-studio-mode' : ''}">
          <div class="keryx-window-frame">
            <!-- Top Application Mega Menu Bar -->
            <header class="keryx-top-menu-strip">
              <div class="brand-badge-mini">
                <div class="brand-mark-mini">K</div>
                <strong>KERYX</strong>
              </div>
              ${MegaMenuController.renderBar()}

              <!-- Center Search Pill (Matching Reference) -->
              <div class="header-center-search-pill" id="top-header-search-box" title="Search KERYX (Ctrl+K)">
                <span class="header-search-ico">🔍</span>
                <span class="header-search-placeholder">Search KERYX...</span>
                <kbd>⌘K</kbd>
              </div>

              <div class="top-menu-actions">
                <!-- Active Countdown Timer Chip if running -->
                ${
                  liveState.activeCountdown
                    ? `<div class="top-timer-chip"><span>⏱</span> ${liveState.activeCountdown.formatted || '05:00'}</div>`
                    : ''
                }

                <!-- Church Studio Flagship Mode Button -->
                <button class="topbar-pill-btn studio-flagship-btn ${activeView === 'Studio' ? 'active-studio-top' : ''}" id="top-btn-studio" title="Toggle Church Studio Console">
                  <span class="studio-pulse">🎛</span> ${activeView === 'Studio' ? 'Exit Studio' : 'Studio Mode'}
                </button>

                <!-- AI Copilot Trigger Button -->
                <button class="topbar-pill-btn copilot-top-btn" id="top-btn-copilot" title="Ask KERYX AI Copilot">
                  <span class="copilot-sparkle">✳</span> Copilot
                </button>

                <button class="topbar-icon-pill-btn" id="top-btn-preflight" title="Pre-Flight Diagnostics">
                  <span>🔔</span>
                  <span class="topbar-dot"></span>
                </button>

                <!-- User Profile Avatar Circle (Matching Reference) -->
                <div class="topbar-avatar-btn" id="top-btn-user-avatar" title="Switch Operator Role: ${userName}">
                  <span>${userInitials}</span>
                  <span class="avatar-online-dot"></span>
                </div>
              </div>
            </header>

            <!-- Main Body: Sidebar + Dynamic Workspace View -->
            <div class="keryx-workspace-body ${activeView === 'Studio' ? 'studio-active-mode' : ''}">
              <!-- Primary Navigation Sidebar (Frosted Glass Aesthetic) -->
              <aside class="sidebar aeux-sidebar ${activeView === 'Studio' ? 'studio-collapsed-sidebar' : ''}">
                <!-- Workspace Pill Switcher -->
                <div class="aeux-workspace-pill" id="sidebar-workspace-switcher" title="Active Church Workspace">
                  <div class="ws-icon-box">✦</div>
                  <div class="ws-info">
                    <small>Church Workspace</small>
                    <strong title="${church.name || 'Grace City Community Church'}">${church.name || 'Grace City Community Church'}</strong>
                  </div>
                  <span class="ws-chevron">▾</span>
                </div>

                <!-- Navigation Items Group -->
                <span class="aeux-nav-section-title">NAVIGATION</span>
                <nav class="primary-nav aeux-nav-list">
                  ${navItems
                    .map(
                      (item) => `
                    <button class="nav-item aeux-nav-item ${activeView === item.id ? 'active' : ''} ${item.id === 'Studio' ? 'studio-nav-highlight' : ''}" data-nav-target="${item.id}">
                      <span class="nav-icon">${item.icon}</span>
                      <span class="nav-text">${item.label}</span>
                      ${item.badge ? `<span class="aeux-nav-badge ${item.id === 'Studio' ? 'badge-live' : 'badge-count'}">${item.badge}</span>` : ''}
                    </button>
                  `
                    )
                    .join('')}
                </nav>

                <!-- Recent Cues Section (Matching Reference Recent Chats) -->
                <div class="sidebar-recent-section">
                  <div class="recent-section-header">
                    <span>Recent Services</span>
                    <span class="sparkle-ico">✦</span>
                  </div>
                  <div class="recent-items-list">
                    <div class="recent-cue-item" data-view="Service">
                      <strong>Sunday Main Service</strong>
                      <small>Today · 09:45 AM</small>
                    </div>
                    <div class="recent-cue-item" data-view="Bible">
                      <strong>Romans 8:28 Scripture Cue</strong>
                      <small>Today · Live On-Air</small>
                    </div>
                    <div class="recent-cue-item" data-view="Songs">
                      <strong>Worship Set · Living Hope</strong>
                      <small>Yesterday</small>
                    </div>
                  </div>
                </div>

                <!-- User Account Footer Lockup -->
                <div class="aeux-user-section">
                  <div class="aeux-user-card" id="sidebar-role-btn" title="Click to switch operator role">
                    <div class="aeux-avatar-wrapper">
                      <span class="aeux-avatar-initials">${userInitials}</span>
                      <span class="aeux-status-ring"></span>
                    </div>
                    <div class="aeux-user-meta">
                      <strong class="aeux-user-name">${userName}</strong>
                      <small class="aeux-user-handle">#${currentUser.role || 'owner'}</small>
                    </div>
                    <button class="aeux-more-btn">⋮</button>
                  </div>
                </div>
              </aside>

              <!-- Main Dynamic Content Workspace -->
              <main class="main-content-viewport ${activeView === 'Studio' ? 'studio-viewport-fill' : ''}" id="main-content-viewport">
                <div class="view-content-wrapper ${activeView === 'Studio' ? 'studio-viewport-fill' : ''}" id="view-content-wrapper">
                  ${this.renderActiveViewContent(activeView)}
                </div>

                <!-- Bottom Broadcast Controller Bar — Included inside layout flow (No more hanging fixed bar!) -->
                ${
                  activeView !== 'Studio'
                    ? `<div class="keryx-integrated-dock-container">
                        <footer class="keryx-bottom-broadcast-strip" id="keryx-bottom-broadcast-strip">
                          ${PreviewLiveBar.render()}
                        </footer>
                      </div>`
                    : ''
                }
              </main>
            </div>
          </div>
        </div>
      `;

      this.attachShellEvents(root, activeView);
    } catch (renderError) {
      console.error('[KERYX AppRouter Render Failure]:', renderError);
      root.innerHTML = `
        <div style="background:#0d1417; color:#fff; padding:40px; font-family:sans-serif; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
          <div style="background:rgba(223,101,78,0.15); border:1px solid #df654e; border-radius:12px; padding:32px; max-width:600px;">
            <h2 style="color:#df654e; margin-bottom:12px;">KERYX Workspace Recovery</h2>
            <p style="color:#a0b0b8; margin-bottom:20px;">An error occurred while rendering the workspace: ${renderError.message}</p>
            <button onclick="localStorage.clear(); window.location.reload();" style="background:#df654e; color:#fff; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; cursor:pointer;">Reset Local Storage &amp; Reload</button>
          </div>
        </div>
      `;
    }
  }

  static renderActiveViewContent(activeView) {
    try {
      switch (activeView) {
        case 'Studio':
          return StudioView.render();
        case 'Dashboard':
          return DashboardView.render();
        case 'Service':
          return ServiceView.render();
        case 'Present':
          return PresentationView.render();
        case 'Bible':
          return BibleView.render();
        case 'CustomScripture':
          return CustomScriptureView.render();
        case 'Songs':
          return SongsView.render();
        case 'Media':
          return MediaView.render();
        case 'Sermons':
          return SermonsView.render();
        case 'AI Center':
          return AICenterView.render();
        case 'Stream':
          return StreamView.render();
        case 'Outputs':
          return OutputsView.render();
        case 'Remote':
          return RemoteView.render();
        case 'Analytics':
          return AnalyticsView.render();
        case 'Marketplace':
          return MarketplaceView.render();
        case 'Church':
          return ChurchView.render();
        case 'Settings':
          return SettingsView.render();
        default:
          return DashboardView.render();
      }
    } catch (e) {
      console.error(`[KERYX View Render Error in ${activeView}]:`, e);
      return `
        <div style="padding:40px; text-align:center; color:#df654e;">
          <h3>Failed to load view: ${activeView}</h3>
          <p>${e.message}</p>
          <button onclick="window.location.hash='#Dashboard'; location.reload();" style="padding:8px 16px; margin-top:12px; cursor:pointer; background:#df654e; color:white; border:none; border-radius:6px;">Return to Dashboard</button>
        </div>
      `;
    }
  }

  static attachShellEvents(root, activeView) {
    // Mega Menu events
    const menuBar = root.querySelector('#mega-menu-bar');
    if (menuBar) MegaMenuController.attachEvents(menuBar);

    // Sidebar navigation clicks
    root.querySelectorAll('[data-nav-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.navTarget;
        appStore.setActiveView(view);
      });
    });

    // Delegated data-view clicks inside any page
    root.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appStore.setActiveView(btn.dataset.view);
      });
    });

    // Top action buttons
    root.querySelector('.brand-badge-mini')?.addEventListener('click', () => {
      appStore.setActiveView('Dashboard');
    });

    root.querySelector('#top-btn-studio')?.addEventListener('click', () => {
      const current = appStore.getState().activeView;
      appStore.setActiveView(current === 'Studio' ? 'Dashboard' : 'Studio');
    });

    root.querySelector('#top-btn-copilot')?.addEventListener('click', () => AICopilot.open());
    root.querySelector('#top-btn-cmd')?.addEventListener('click', () => CommandPalette.open());
    root.querySelector('#top-header-search-box')?.addEventListener('click', () => CommandPalette.open());
    root.querySelector('#top-btn-preflight')?.addEventListener('click', () => eventBus.emit('preflight:open'));
    root.querySelector('#top-btn-shortcuts')?.addEventListener('click', () => eventBus.emit('shortcuts:open'));
    root.querySelector('#top-btn-user-avatar')?.addEventListener('click', () => {
      root.querySelector('#sidebar-role-btn')?.click();
    });

    // Operator Role Switcher Modal
    root.querySelector('#sidebar-role-btn')?.addEventListener('click', () => {
      const current = appStore.getState().currentUser;
      Modal.open({
        title: 'Switch Operator Role (RBAC)',
        content: `
          <div class="role-switcher-modal-content">
            <p>Test presentation, live broadcast, and AI permissions across various church media roles:</p>
            <div class="roles-choice-list">
              ${DEFAULT_ROLES.map(
                (r) => `
                <div class="role-choice-card ${current.role === r.id ? 'active-role' : ''}" data-role-id="${r.id}">
                  <strong>${r.name}</strong>
                  <small>${r.description}</small>
                </div>
              `
              ).join('')}
            </div>
          </div>
        `,
        confirmText: 'Done',
        cancelText: null
      });

      document.querySelectorAll('.role-choice-card').forEach((card) => {
        card.addEventListener('click', () => {
          const roleId = card.dataset.roleId;
          const roleDef = DEFAULT_ROLES.find((r) => r.id === roleId);
          appStore.setCurrentUser({
            ...current,
            role: roleId,
            title: roleDef.name
          });
          document.querySelector('.keryx-modal-backdrop')?.remove();
          this.render();
        });
      });
    });

    // Attach broadcast bar events
    const broadcastBar = root.querySelector('#keryx-bottom-broadcast-strip');
    if (broadcastBar) PreviewLiveBar.attachEvents(broadcastBar);

    // Attach active feature view events
    const viewContainer = root.querySelector('#view-content-wrapper');
    if (viewContainer) {
      switch (activeView) {
        case 'Studio':
          StudioView.attachEvents(viewContainer);
          break;
        case 'Dashboard':
          DashboardView.attachEvents(viewContainer);
          break;
        case 'Service':
          ServiceView.attachEvents(viewContainer);
          break;
        case 'Present':
          PresentationView.attachEvents(viewContainer);
          break;
        case 'Bible':
          BibleView.attachEvents(viewContainer);
          break;
        case 'CustomScripture':
          CustomScriptureView.attachEvents(viewContainer);
          break;
        case 'Songs':
          SongsView.attachEvents(viewContainer);
          break;
        case 'Media':
          MediaView.attachEvents(viewContainer);
          break;
        case 'Sermons':
          SermonsView.attachEvents(viewContainer);
          break;
        case 'AI Center':
          AICenterView.attachEvents(viewContainer);
          break;
        case 'Stream':
          StreamView.attachEvents(viewContainer);
          break;
        case 'Outputs':
          OutputsView.attachEvents(viewContainer);
          break;
        case 'Remote':
          RemoteView.attachEvents(viewContainer);
          break;
        case 'Analytics':
          AnalyticsView.attachEvents(viewContainer);
          break;
        case 'Marketplace':
          MarketplaceView.attachEvents(viewContainer);
          break;
        case 'Church':
          ChurchView.attachEvents(viewContainer);
          break;
        case 'Settings':
          SettingsView.attachEvents(viewContainer);
          break;
      }
    }
  }

  static updateBroadcastBar() {
    const strip = document.querySelector('#keryx-bottom-broadcast-strip');
    if (strip) {
      strip.innerHTML = PreviewLiveBar.render();
      PreviewLiveBar.attachEvents(strip);
    }
  }
}
