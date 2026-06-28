type ApiOptions = {
  body?: unknown;
  method?: string;
  token?: string;
};

export async function apiRequest<T = unknown>(
  path: string,
  { body, method = "GET", token }: ApiOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  });

  const responseBody = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(responseBody?.error ?? "Request failed");
  }

  return responseBody as T;
}

export function isLocalApp() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
