const ACTIVE_MODE_KEY = 'ogajobs_active_mode';

export type ActiveMode = 'client' | 'artisan';

export function getStoredActiveMode(): ActiveMode | null {
  try {
    const stored = localStorage.getItem(ACTIVE_MODE_KEY);
    if (stored === 'client' || stored === 'artisan') return stored;
    return null;
  } catch {
    return null;
  }
}

export function setStoredActiveMode(mode: ActiveMode): void {
  try {
    localStorage.setItem(ACTIVE_MODE_KEY, mode);
  } catch {}
}

export function clearStoredActiveMode(): void {
  try {
    localStorage.removeItem(ACTIVE_MODE_KEY);
  } catch {}
}
