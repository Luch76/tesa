import type { Profile } from "@/lib/tesa/data";

/** Calls to the NestJS server that hosts this app (same origin; the session is an HTTP-only cookie). */

export interface Me {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SavedResume {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (res.status === 401) {
    // Session expired or missing: start over at the login page.
    window.location.assign("/login");
    throw new ApiError(401, "Not signed in");
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body ? String(body.message) : res.statusText;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export const getMe = () => request<Me>("/auth/me");

export const getResume = () =>
  request<{ resume: SavedResume | null }>("/api/resume").then((r) => r.resume);

/**
 * Builds a skills profile with AI from the user's saved resume, or from `text` when
 * given (pasted resume text, which isn't stored).
 */
export const analyzeResume = (text?: string) =>
  request<{ profile: Profile }>("/api/resume/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(text ? { text } : {}),
  }).then((r) => r.profile);

export function uploadResume(file: File): Promise<SavedResume> {
  const form = new FormData();
  form.append("resume", file);
  return request<{ resume: SavedResume }>("/api/resume", { method: "POST", body: form }).then(
    (r) => r.resume,
  );
}
