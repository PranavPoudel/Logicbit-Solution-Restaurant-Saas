export const safeHref = (url?: string | null) => (url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : undefined);
