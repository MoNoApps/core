import type { ApiResponse, User } from "../types/index";

const BASE_URL = "/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("mono_token");
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("mono_token", token);
      } else {
        localStorage.removeItem("mono_token");
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("mono_token");
    }
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers["token"] = currentToken;
    }

    const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get("content-type");
      let data: any = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error:
            data?.error ||
            data?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          ...data,
        };
      }

      return {
        success: true,
        data,
        ...(typeof data === "object" ? data : {}),
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err?.message ||
          "Network error. Please ensure API server is reachable.",
      };
    }
  }

  // Auth Endpoints
  public async login(
    password: string,
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  public async register(email: string): Promise<ApiResponse> {
    return this.request(`/register/${encodeURIComponent(email)}`, {
      method: "POST",
    });
  }

  public async recover(email: string): Promise<ApiResponse> {
    return this.request(`/recover/${encodeURIComponent(email)}`, {
      method: "POST",
    });
  }

  public async getAccount(): Promise<ApiResponse<User>> {
    return this.request("/account", {
      method: "GET",
    });
  }

  public async updateAccount(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request("/account", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  public async getPing(): Promise<
    ApiResponse<{ status: string; uptime: number }>
  > {
    return this.request("/ping", {
      method: "GET",
    });
  }

  public async getTheme(): Promise<ApiResponse<{ theme: string }>> {
    return this.request("/theme", {
      method: "GET",
    });
  }

  // Dynamic Resource CRUD Endpoints
  public async getResources<T = any[]>(
    resource: string,
    query: Record<string, any> = {},
  ): Promise<ApiResponse<T>> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        params.append(k, String(v));
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/${resource}${qs}`, {
      method: "GET",
    });
  }

  public async getResourceById<T = any>(
    resource: string,
    id: string,
  ): Promise<ApiResponse<T>> {
    return this.request(`/${resource}/${id}`, {
      method: "GET",
    });
  }

  public async createResource<T = any>(
    resource: string,
    payload: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    return this.request(`/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async updateResource<T = any>(
    resource: string,
    id: string,
    payload: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    return this.request(`/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  public async deleteResource(
    resource: string,
    id: string,
  ): Promise<ApiResponse> {
    return this.request(`/${resource}/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
export default api;
