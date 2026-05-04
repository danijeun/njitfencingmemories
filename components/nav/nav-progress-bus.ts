const EVT = "nav-progress:start";

export function emitNavStart() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVT));
}

export function onNavStart(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
