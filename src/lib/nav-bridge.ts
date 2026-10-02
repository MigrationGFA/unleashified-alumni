// ============================================================
// Navigation bridge — lets the zustand store drive the React
// Router instance without creating an import cycle between
// the store and the route components.
// ============================================================

export interface NavOptions {
  replace?: boolean;
}

type NavigateFn = (to: string, opts?: NavOptions) => void;

let navigateFn: NavigateFn | null = null;

/** Called once from main.tsx after the router is created. */
export function setRouterNavigate(fn: NavigateFn) {
  navigateFn = fn;
}

/** Imperatively navigate the React Router instance. */
export function navTo(to: string, opts?: NavOptions) {
  navigateFn?.(to, opts);
}
