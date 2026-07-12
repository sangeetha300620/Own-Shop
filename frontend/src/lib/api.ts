const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API_V1 = `${API_BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  const isFormData = rest.body instanceof FormData;
  if (!isFormData && rest.body) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_V1}${path}`, { ...rest, headers: finalHeaders });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, auth }),
  put: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, auth }),
  del: <T>(path: string, auth = false) => request<T>(path, { method: "DELETE", auth }),
  upload: <T>(path: string, formData: FormData, auth = true) =>
    request<T>(path, { method: "POST", body: formData, auth }),
};

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}
