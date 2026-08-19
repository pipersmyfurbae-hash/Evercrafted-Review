// Navigate to the sign-in page. Call this from an event handler or effect at
// the moment you want to navigate, e.g. `onClick={() => startLogin()}`.
export const startLogin = (redirectTo?: string) => {
  const target = redirectTo ?? window.location.pathname + window.location.search;
  window.location.href = `/login?redirect=${encodeURIComponent(target)}`;
};
