// Loose semver compare for GitHub tags ("v1.2.0" / "1.2.0").
export function isNewer(latest: string, current: string): boolean {
  if (!latest) return false;
  const norm = (v: string) =>
    v.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const a = norm(latest);
  const b = norm(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

// ponytail: one runnable check — the "1.10 > 1.9" trap is exactly what breaks naive compares.
if (import.meta.env.DEV) {
  console.assert(isNewer("1.10.0", "1.9.0"), "1.10.0 > 1.9.0");
  console.assert(isNewer("v1.0.1", "1.0.0"), "v-prefix newer");
  console.assert(!isNewer("1.0.0", "1.0.0"), "equal is not newer");
  console.assert(!isNewer("1.0.0", "1.2.0"), "older is not newer");
}
