/**
 * KERYX Onboarding & Church Setup View
 * Initial church creation, role switching, and offline workspace authentication.
 */

import { appStore } from '../../stores/appStore.js';
import { DEFAULT_ROLES } from '../../database/schema.js';
import { eventBus } from '../../core/eventBus.js';

export class AuthView {
  static renderOnboarding() {
    return `
      <div class="onboarding-container">
        <!-- Left Brand Story Column -->
        <aside class="onboarding-aside">
          <div class="brand-lockup light">
            <div class="brand-mark">K</div>
            <div>
              <strong>KERYX</strong>
              <span>MINISTRY OS</span>
            </div>
          </div>

          <div class="onboarding-message">
            <span class="eyebrow">THE SERVICE, REMEMBERED</span>
            <h1>Run the service.<br /><em>Capture the message.</em><br />Amplify the ministry.</h1>
            <p>A calm, intelligent control room for every moment before, during, and after church.</p>
          </div>

          <div class="quote">
            “AI assists. Humans control. The presentation never fails.”
            <span>KERYX Operating Principle</span>
          </div>
        </aside>

        <!-- Right Registration Form Column -->
        <main class="onboarding-form">
          <div class="form-meta">
            <span>SETUP 01 / 01</span>
            <span>OFFLINE WORKSPACE INITIALIZATION</span>
          </div>

          <div class="form-body">
            <span class="eyebrow">CREATE YOUR CHURCH</span>
            <h2>Let’s make space<br />for your ministry.</h2>
            <p class="form-intro">Start with your primary church details. All slides, scriptures, and media operate locally without cloud lock-in.</p>

            <form id="onboarding-church-form">
              <label>Church Ministry Name
                <input name="name" required placeholder="e.g. Grace City Community Church" value="Grace City Community Church" />
              </label>

              <div class="form-grid">
                <label>Church Email
                  <input name="email" type="email" required placeholder="media@yourchurch.org" value="media@gracecity.org" />
                </label>
                <label>Senior Pastor
                  <input name="pastor" required placeholder="Pastor's Full Name" value="Godswill Johnson" />
                </label>
              </div>

              <div class="form-grid">
                <label>City
                  <input name="city" placeholder="City" value="Lagos" />
                </label>
                <label>Country
                  <select name="country">
                    <option selected>Nigeria</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Ghana</option>
                    <option>South Africa</option>
                    <option>Kenya</option>
                    <option>Canada</option>
                  </select>
                </label>
              </div>

              <div class="form-grid">
                <label>Primary Language
                  <select name="language">
                    <option selected>English</option>
                    <option>French</option>
                    <option>Portuguese</option>
                    <option>Spanish</option>
                    <option>Yoruba</option>
                    <option>Igbo</option>
                    <option>Hausa</option>
                    <option>Swahili</option>
                  </select>
                </label>
                <label>Default Timezone
                  <select name="timezone">
                    <option selected>West Africa Time (WAT)</option>
                    <option>Greenwich Mean Time (GMT)</option>
                    <option>Eastern Time (ET)</option>
                  </select>
                </label>
              </div>

              <button class="primary-button" type="submit">
                Initialize Church Workspace <span>→</span>
              </button>
            </form>

            <div class="onboarding-quick-actions">
              <button class="text-button" id="btn-continue-offline">Continue as Offline Demonstration</button>
            </div>
          </div>
        </main>
      </div>
    `;
  }

  static attachEvents(container) {
    const form = container.querySelector('#onboarding-church-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      appStore.setChurch({
        name: formData.get('name'),
        email: formData.get('email'),
        pastor: formData.get('pastor'),
        city: formData.get('city'),
        country: formData.get('country'),
        language: formData.get('language'),
        timezone: formData.get('timezone')
      });
      appStore.setActiveView('Dashboard');
      eventBus.emit('view:refresh');
    });

    container.querySelector('#btn-continue-offline')?.addEventListener('click', () => {
      appStore.setActiveView('Dashboard');
      eventBus.emit('view:refresh');
    });
  }
}

