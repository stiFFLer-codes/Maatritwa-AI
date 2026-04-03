/**
 * Single entry point for backend calls.
 *
 * Tries the real FastAPI backend first. If it is not running, or is running but
 * cannot reach Supabase, falls back to the in-browser demo backend so the
 * dashboards stay usable. See demoBackend.js.
 *
 * Fallback covers network errors and 5xx only. A 4xx is a real answer from a
 * real server and is passed straight through — masking those would hide genuine
 * bugs behind fake data, which is worse than an error state.
 */

import { handleDemoRequest, DemoHttpError } from './demoBackend';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const FORCE_DEMO = import.meta.env.VITE_DEMO_MODE === '1';
const TIMEOUT_MS = 2500;

let demoMode = FORCE_DEMO;

/** True once we have given up on the real backend for this page session. */
export function isDemoMode() {
  return demoMode;
}

/** Response-shaped object so call sites can keep using res.ok / res.json(). */
function demoResponse(method, path, body) {
  try {
    const data = handleDemoRequest(method, path, body);
    return {
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  } catch (err) {
    const status = err instanceof DemoHttpError ? err.status : 500;
    const detail = err?.detail || err?.message || 'Demo backend error';
    return {
      ok: false,
      status,
      json: async () => ({ detail }),
      text: async () => detail,
    };
  }
}

/**
 * @param {string} path Path only, e.g. "/asha/patients". Not a full URL.
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : undefined;

  if (demoMode) return demoResponse(method, path, body);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Backend is up but broken — most often Supabase credentials are missing.
    if (response.status >= 500) {
      demoMode = true;
      console.info(
        `[maatritwa] Backend returned ${response.status}. Switching to demo data. ` +
        'See backend/.env.example to configure the real backend.',
      );
      return demoResponse(method, path, body);
    }

    return response;
  } catch {
    demoMode = true;
    console.info(
      `[maatritwa] No backend at ${API_BASE_URL}. Serving demo data from the browser. ` +
      'See SETUP.md to run the real backend.',
    );
    return demoResponse(method, path, body);
  }
}
