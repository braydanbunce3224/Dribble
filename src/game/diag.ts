const last: string[] = [];

export function noteError(e: unknown) {
  const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e ?? "error");
  last.push(msg.slice(0, 240));
  if (last.length > 5) last.shift();
}

export function recentErrors(): string[] {
  return last.slice();
}
