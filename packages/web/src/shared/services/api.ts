export class ApiError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly errors?: Array<{ detail: string; pointer: string }>;

  constructor(data: {
    type: string;
    title: string;
    status: number;
    detail: string;
    errors?: Array<{ detail: string; pointer: string }>;
  }) {
    super(data.detail);
    this.type = data.type;
    this.title = data.title;
    this.status = data.status;
    this.detail = data.detail;
    this.errors = data.errors;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const errorData = await res.json();
      throw new ApiError(errorData);
    }
    throw new ApiError({
      type: 'https://vansh.app/errors/network-error',
      title: 'Network Error',
      status: res.status,
      detail: `Request failed with status ${res.status}`,
    });
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(url: string, data: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};
