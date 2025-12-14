import { LoopEventDetail } from './types';

// Helper to create typed custom events
export function createLoopEvent(eventName: string, detail: LoopEventDetail): CustomEvent {
  return new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true // Allows event to cross shadow DOM boundary
  });
}

// Type-safe event listener helpers
export type LoopEventListener = (event: CustomEvent<LoopEventDetail>) => void;

export function addLoopEventListener(
  element: HTMLElement,
  eventName: string,
  listener: LoopEventListener
): void {
  element.addEventListener(eventName, listener as EventListener);
}

export function removeLoopEventListener(
  element: HTMLElement,
  eventName: string,
  listener: LoopEventListener
): void {
  element.removeEventListener(eventName, listener as EventListener);
}
