// Google Maps JS API global declaration for the Campus Map feature.
// The actual API is loaded dynamically at runtime; no npm package needed.

declare global {
  interface Window {
    google: any;
  }
}

export {};
