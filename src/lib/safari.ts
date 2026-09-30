/**
 * Lock the app to the visible visual viewport so URL bars, home indicators,
 * and the preview chrome never cover buttons or clip the screen.
 */
export function installSafariChrome(): () => void {
  const root = document.documentElement;

  const framed = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  if (framed) root.classList.add("is-framed");

  let raf = 0;
  let raf2 = 0;
  let lastGap = -1;
  let lastTop = -1;
  let lastHeight = -1;

  const measure = () => {
    raf = 0;
    raf2 = 0;
    const vv = window.visualViewport;
    let gap = 0;
    let top = 0;
    let height = framed
      ? Math.max(240, Math.round(document.documentElement.clientHeight || window.innerHeight))
      : window.innerHeight;
    if (vv && !framed) {
      top = Math.max(0, Math.round(vv.offsetTop));
      height = Math.max(240, Math.round(vv.height));
      const zoomed = vv.scale > 1.02 || vv.scale < 0.98;
      if (!zoomed) {
        gap = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      }
    }
    if (gap === lastGap && top === lastTop && height === lastHeight) return;
    lastGap = gap;
    lastTop = top;
    lastHeight = height;
    root.style.setProperty("--vv-bottom", `${gap}px`);
    root.style.setProperty("--vv-top", `${top}px`);
    root.style.setProperty("--vv-height", `${height}px`);
    root.classList.toggle("vv-keyboard", gap > 80);
  };

  const onResize = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measure);
    });
  };

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(measure);
  };

  const opts: AddEventListenerOptions = { passive: true };
  measure();
  window.visualViewport?.addEventListener("resize", onResize, opts);
  window.visualViewport?.addEventListener("scroll", onScroll, opts);
  window.addEventListener("orientationchange", onResize, opts);
  window.addEventListener("resize", onResize, opts);
  document.addEventListener("focusin", onResize, opts);
  document.addEventListener("focusout", onResize, opts);
  return () => {
    if (raf) cancelAnimationFrame(raf);
    if (raf2) cancelAnimationFrame(raf2);
    window.visualViewport?.removeEventListener("resize", onResize);
    window.visualViewport?.removeEventListener("scroll", onScroll);
    window.removeEventListener("orientationchange", onResize);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("focusin", onResize);
    document.removeEventListener("focusout", onResize);
  };
}
