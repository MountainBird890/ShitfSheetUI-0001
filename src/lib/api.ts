const BASE = window.location.protocol === "file:"
  ? "http://localhost:3000"
  : "";  // dev時はviteのproxyがあるのでそのまま

export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}