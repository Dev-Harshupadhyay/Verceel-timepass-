import type { Config, PublishResponse, RevisionSummary, ValidationError } from "@/types";

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export interface PublicConfigResponse {
  ok?: boolean;
  configured?: boolean;
  data: Config | null;
  revision?: number;
  updatedAt?: string | null;
  migrated?: boolean;
  error?: string;
  message?: string;
}

export async function fetchPublicConfig(): Promise<PublicConfigResponse> {
  const res = await fetch("/api/pricing", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
  const json = await readJson(res);
  if (!res.ok) {
    return { ok: false, configured: false, data: null, error: json.error || `HTTP ${res.status}` };
  }
  return json as PublicConfigResponse;
}

export async function verifyPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const json = await readJson(res);
    if (res.ok && json.ok === true) return { ok: true };
    return { ok: false, error: res.status === 401 ? "Galat password" : json.error || "Verification fail" };
  } catch {
    return { ok: false, error: "Server reachable nahi — deployed site par try karo" };
  }
}

async function post(body: Record<string, unknown>): Promise<PublishResponse & { status: number }> {
  try {
    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await readJson(res);
    return { ...(json as PublishResponse), status: res.status };
  } catch (e) {
    return { ok: false, status: 0, error: "Network error — internet check karo" };
  }
}

export interface PublishResult extends PublishResponse {
  status: number;
  details?: ValidationError[];
}

export function publishConfig(password: string, config: Config): Promise<PublishResult> {
  return post({ password, action: "publish", config }) as Promise<PublishResult>;
}

export function resetConfig(password: string): Promise<PublishResult> {
  return post({ password, action: "reset" }) as Promise<PublishResult>;
}

export function restoreRevision(password: string, id: number): Promise<PublishResult> {
  return post({ password, action: "restore", id }) as Promise<PublishResult>;
}

export async function fetchRevisionConfig(password: string, id: number): Promise<{ ok: boolean; data?: Config; error?: string }> {
  const r = await post({ password, action: "revision", id });
  return { ok: !!r.ok, data: r.data, error: r.error };
}

export async function fetchHistory(
  password: string
): Promise<{ ok: boolean; revisions: RevisionSummary[]; current?: { revision: number; updatedAt: string | null }; error?: string }> {
  const r = await post({ password, action: "history" });
  return {
    ok: !!r.ok,
    revisions: (r as unknown as { revisions?: RevisionSummary[] }).revisions || [],
    current: (r as unknown as { current?: { revision: number; updatedAt: string | null } }).current,
    error: r.error
  };
}
