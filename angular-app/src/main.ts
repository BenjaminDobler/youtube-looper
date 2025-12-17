import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { TimelineComponent } from './app/timeline/timeline.component';
import { SidebarComponent } from './app/sidebar/sidebar.component';

// Prevent double initialization
if ((window as any).__youtubeLooperInitialized) {
  // Already initialized, skipping
} else {
  (window as any).__youtubeLooperInitialized = true;

  // Create Angular application
  createApplication(appConfig)
    .then((appRef) => {
      const injector = appRef.injector;

    // Define Timeline Custom Element
    try {
      const TimelineElement = createCustomElement(TimelineComponent, { injector });
      customElements.define('youtube-loop-timeline', TimelineElement);
    } catch (err) {
      console.error('Failed to register youtube-loop-timeline:', err);
      throw err;
    }

    // Define Sidebar Custom Element
    try {
      const SidebarElement = createCustomElement(SidebarComponent, { injector });
      customElements.define('youtube-loop-sidebar', SidebarElement);
    } catch (err) {
      console.error('Failed to register youtube-loop-sidebar:', err);
      throw err;
    }
  })
  .catch(() => {});
}
