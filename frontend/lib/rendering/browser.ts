// Browser detection for rendering
export function getBrowser() {
  return typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
}
