/**
 * The smallest browser this app will render into.
 *
 * `npm run test:ui` renders the real pages with react-dom/server under node.
 * Two things reach for the DOM before any component does: MotherDashboard reads
 * Web Speech API support at module scope, and framer-motion's `layout` prop
 * mounts a projection node that attaches a resize listener. Neither needs to
 * work — they only need to exist. esbuild injects this file ahead of everything
 * else in the bundle.
 */

const noop = () => {};

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: noop,
    removeEventListener: noop,
    getComputedStyle: () => ({}),
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    ResizeObserver: ResizeObserverStub,
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    documentElement: {},
    addEventListener: noop,
    removeEventListener: noop,
  };
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;

export default {};
