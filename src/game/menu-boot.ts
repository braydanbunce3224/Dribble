export const TITLE_BOOT_CLASS = "title-booting";
export const TITLE_ARMED_CLASS = "title-armed";

declare global {
  interface Window {
    __dribbleBoot?: { go: string | null; ready: boolean };
    __dribbleApply?: (go: string) => void;
    __dribbleListen?: boolean;
  }
}

/** Runs in the first HTML byte so taps before JS still count. */
export const TITLE_BOOT_SCRIPT = `(function(){
  var w=window;
  w.__dribbleBoot=w.__dribbleBoot||{go:null,ready:false};
  if(w.__dribbleBoot.ready)return;
  var d=document.documentElement;
  d.classList.add("${TITLE_BOOT_CLASS}");
  d.classList.remove("${TITLE_ARMED_CLASS}");
  document.addEventListener("click",function(e){
    if(w.__dribbleBoot&&w.__dribbleBoot.ready)return;
    var t=e.target;
    var n=t&&t.nodeType===1?t:t&&t.parentElement;
    var el=n&&n.closest?n.closest("[data-go]"):null;
    if(!el)return;
    var go=el.getAttribute("data-go");
    if(!go)return;
    e.preventDefault();
    e.stopPropagation();
    w.__dribbleBoot.go=go;
    var btns=document.querySelectorAll("[data-go]");
    for(var i=0;i<btns.length;i++)btns[i].classList.remove("is-queued");
    el.classList.add("is-queued");
  },true);
})();`;

let armed = false;
const listeners = new Set<() => void>();

function boot() {
  if (typeof window === "undefined") return { go: null, ready: false };
  return (window.__dribbleBoot ??= { go: null, ready: false });
}

export function isMenuArmed() {
  return armed;
}

export function peekQueuedGo() {
  return boot().go;
}

export function queueMenuGo(go: string) {
  const b = boot();
  if (b.ready) return false;
  b.go = go;
  return true;
}

export function onMenuArmed(fn: () => void) {
  if (armed) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function armMenu(): string | null {
  const b = boot();
  const go = b.go;
  b.go = null;
  b.ready = true;
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove(TITLE_BOOT_CLASS);
    document.documentElement.classList.add(TITLE_ARMED_CLASS);
  }
  if (!armed) {
    armed = true;
    for (const fn of listeners) fn();
    listeners.clear();
  }
  return go;
}
