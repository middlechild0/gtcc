export type AuthCredentials = {
  email: string;
  password: string;
  name?: string;
};

export type AuthResponse = {
  ok: boolean;
  redirectTo?: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  if (response.status === 204) {
    // No content
    return { ok: true } as T;
  }

  return (await response.json()) as T;
}

export async function login(credentials: AuthCredentials) {
  return postJson<AuthResponse>("/api/auth/login", credentials);
}

export async function requestPasswordReset(email: string) {
  return postJson<AuthResponse>("/api/auth/forgot-password", { email });
}

