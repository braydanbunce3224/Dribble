import { useEffect } from "react";
import { HeadContent, Outlet, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { TriangleAlert } from "lucide-react";
import { z } from "zod";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/game/brand.ts
/** User-facing labels. Internal ids (ncaa, nit, crown, kenpom) stay in saves. */
var APP_NAME = "Dribble";
var NCAA = "NCAA Tournament";
var NCAA_SHORT = "NCAA";
var FIRST_FOUR = "First Four";
var SELECTION_SUNDAY = "Selection Sunday";
var CONFERENCE_TOURNEY = "Conference tournament";
function gameKindLabel(kind) {
	switch (kind) {
		case "conference": return "Conference";
		case "noncon": return "Non-conference";
		case "mte": return "Classic";
		case "conf-tourney": return CONFERENCE_TOURNEY;
		case "ncaa": return NCAA;
		case "nit": return "NIT";
		case "crown": return "CBI";
		default: return "College basketball";
	}
}
function gameKindShort(kind) {
	switch (kind) {
		case "conference": return "Conference";
		case "noncon": return "Non-con";
		case "mte": return "Classic";
		case "conf-tourney": return "Conf. tourney";
		case "ncaa": return NCAA_SHORT;
		case "nit": return "NIT";
		case "crown": return "CBI";
		default: return "College basketball";
	}
}
function phaseLabel(phase, week) {
	switch (phase) {
		case "preseason": return "Preseason";
		case "regular": return week != null ? `Week ${week}` : "Regular season";
		case "conference": return CONFERENCE_TOURNEY;
		case "selection": return SELECTION_SUNDAY;
		case "ncaa": return NCAA;
		case "nit": return "NIT";
		case "crown": return "CBI";
		case "offseason": return "Offseason";
		default: return phase;
	}
}
function ncaaRoundLabel(slotId) {
	if (slotId.startsWith("ncaa-ff-")) return FIRST_FOUR;
	if (slotId.startsWith("ncaa-64-")) return "1st Round";
	if (slotId.startsWith("ncaa-32-")) return "2nd Round";
	if (slotId.startsWith("ncaa-16-")) return "Sweet 16";
	if (slotId.startsWith("ncaa-8-")) return "Elite Eight";
	if (slotId.startsWith("ncaa-f4-")) return "Final Four";
	if (slotId.startsWith("ncaa-title-")) return "National Championship";
	if (slotId.startsWith("nit-title-")) return `NIT championship`;
	if (slotId.startsWith("nit-")) return "NIT";
	if (slotId.startsWith("crown-title-")) return `CBI championship`;
	if (slotId.startsWith("crown-")) return "CBI";
	return NCAA_SHORT;
}
//#endregion
//#region src/lib/error-component.tsx
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ jsxs("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ jsx(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
//#endregion
//#region src/lib/auth/provider.tsx
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ jsx(Fragment$1, { children });
}
//#endregion
//#region src/lib/preview-embedder-origin.ts
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
//#endregion
//#region src/lib/preview-host-bridge.ts
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = z.object({
	channel: z.literal(PREVIEW_BRIDGE_CHANNEL),
	version: z.number().int().positive(),
	type: z.string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: z.literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: z.literal("navigate"),
	path: z.string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: z.literal("history"),
	delta: z.union([z.literal(-1), z.literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
//#endregion
//#region src/components/preview-host-bridge.tsx
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	useEffect(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
//#endregion
//#region src/styles.css?url
var styles_default = "./assets/styles-CmhDdkdU.css";
//#endregion
//#region src/game/menu-boot.ts
var TITLE_BOOT_CLASS = "title-booting";
var TITLE_ARMED_CLASS = "title-armed";
/** Runs in the first HTML byte so taps before JS still count. */
var TITLE_BOOT_SCRIPT = `(function(){
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
var armed = false;
var listeners = /* @__PURE__ */ new Set();
function boot() {
	if (typeof window === "undefined") return {
		go: null,
		ready: false
	};
	return window.__dribbleBoot ??= {
		go: null,
		ready: false
	};
}
function isMenuArmed() {
	return armed;
}
function peekQueuedGo() {
	return boot().go;
}
function queueMenuGo(go) {
	const b = boot();
	if (b.ready) return false;
	b.go = go;
	return true;
}
function onMenuArmed(fn) {
	if (armed) {
		fn();
		return () => {};
	}
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function armMenu() {
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
//#endregion
//#region src/routes/__root.tsx
var Route$1 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#0b0b0c"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				name: "format-detection",
				content: "telephone=no"
			},
			{
				name: "description",
				content: "College basketball dynasty sim. 365 teams, recruiting, schedules, the NCAA Tournament, NIT, and CBI."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ jsxs("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: TITLE_BOOT_SCRIPT } }),
			/* @__PURE__ */ jsx(PreviewHostBridge, {}),
			/* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) }),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	})
});
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-D3dkP7Er.js").then((n) => n.t);
var GO = /* @__PURE__ */ new Set([
	"career",
	"dynasty",
	"eras",
	"hof",
	"saves",
	"continue"
]);
var Route = createFileRoute("/")({
	validateSearch: (raw) => {
		const go = typeof raw.go === "string" && GO.has(raw.go) ? raw.go : void 0;
		return go ? { go } : {};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = { IndexRoute: Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$1
}) };
var routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { onMenuArmed as a, FIRST_FOUR as c, SELECTION_SUNDAY as d, gameKindLabel as f, __exportAll as g, getRouter, phaseLabel as h, isMenuArmed as i, NCAA as l, ncaaRoundLabel as m, Route as n, peekQueuedGo as o, gameKindShort as p, armMenu as r, queueMenuGo as s, router_exports as t, NCAA_SHORT as u };
