import { useGame } from "./store";
import { queueMenuGo } from "./menu-boot";

export function applyMenuGo(go: string | null | undefined) {
  if (!go) return;
  if (queueMenuGo(go)) return;
  const st = useGame.getState();
  if (go === "career") st.openSelect("career");
  else if (go === "dynasty") st.openSelect("dynasty");
  else if (go === "eras") st.openSelect("eras");
  else if (go === "hof") st.openHof();
  else if (go === "saves") st.openSaves();
  else if (go === "continue") st.continueSave();
}

if (typeof window !== "undefined") {
  window.__dribbleApply = applyMenuGo;
  if (!window.__dribbleListen) {
    window.__dribbleListen = true;
    document.addEventListener(
      "click",
      (e) => {
        const raw = e.target;
        const node = raw instanceof Element ? raw : (raw as Node | null)?.parentElement;
        const el = node?.closest?.("[data-go]");
        if (!el) return;
        applyMenuGo(el.getAttribute("data-go"));
      },
      true,
    );
  }
}
