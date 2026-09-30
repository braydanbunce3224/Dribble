import type { MouseEvent } from "react";

let hapticsOn = true;

export function setHaptics(on: boolean) {
  hapticsOn = on;
}

export function installIosTaps(): () => void {
  return () => {};
}

export function bindTap(fn: () => void) {
  return {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (hapticsOn) buzz(12);
      fn();
    },
  };
}

export function buzz(ms = 28) {
  if (!hapticsOn) return;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
