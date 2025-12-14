import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { appConfig } from './app/app.config';
import { TimelineComponent } from './app/timeline/timeline.component';
import { SidebarComponent } from './app/sidebar/sidebar.component';

// Prevent double initialization
if ((window as any).__youtubeLooperInitialized) {
  console.log('YouTube Looper: Already initialized, skipping');
} else {
  (window as any).__youtubeLooperInitialized = true;
  console.log('YouTube Looper: Initializing Web Components...');

  // Create Angular application
  createApplication(appConfig)
    .then((appRef) => {
      const injector = appRef.injector;

    // Define Timeline Custom Element
    try {
      const TimelineElement = createCustomElement(TimelineComponent, { injector });
      console.log('Timeline element created:', TimelineElement);
      console.log('Timeline element prototype:', Object.getPrototypeOf(TimelineElement));
      console.log('Is Timeline constructor?', typeof TimelineElement === 'function');
      
      customElements.define('youtube-loop-timeline', TimelineElement);
      console.log('YouTube Looper: <youtube-loop-timeline> registered');
    } catch (err) {
      console.error('Failed to register youtube-loop-timeline:', err);
      throw err;
    }

    // Define Sidebar Custom Element
    try {
      const SidebarElement = createCustomElement(SidebarComponent, { injector });
      console.log('Sidebar element created:', SidebarElement);
      console.log('Sidebar element prototype:', Object.getPrototypeOf(SidebarElement));
      console.log('Is Sidebar constructor?', typeof SidebarElement === 'function');
      
      customElements.define('youtube-loop-sidebar', SidebarElement);
      console.log('YouTube Looper: <youtube-loop-sidebar> registered');
    } catch (err) {
      console.error('Failed to register youtube-loop-sidebar:', err);
      throw err;
    }

    console.log('YouTube Looper: Web Components ready');
  })
  .catch((err) => console.error('Failed to initialize Web Components:', err));
}
