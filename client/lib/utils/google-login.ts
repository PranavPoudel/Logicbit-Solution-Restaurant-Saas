import { googleLoginUrl } from "@/lib/api/customer-auth";

// Where to send the customer after Google brings them back: the page they were headed for before they left.
const NEXT_KEY = "logicbit-login-next";

const isSafePath = (path: string | null): path is string => !!path && path.startsWith("/") && !path.startsWith("//");

/** Remembers the page the customer wanted, then hands the browser to the API, which redirects on to Google. */
export function startGoogleLogin(locale: string) {
  const next = new URLSearchParams(window.location.search).get("next");
  try {
    if (isSafePath(next)) sessionStorage.setItem(NEXT_KEY, next);
    else sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // Storage can be blocked; the customer then simply lands on the home page.
  }
  window.location.href = googleLoginUrl(locale);
}

/** The remembered page (once), or the home page. */
export function takeGoogleNext(): string {
  try {
    const next = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return isSafePath(next) ? next : "/";
  } catch {
    return "/";
  }
}
