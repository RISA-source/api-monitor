// Lightweight API client for AppyEye
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear token on unauthorized
          this.logout();
          window.location.href = '/';
        }
        throw new Error(`API Error: ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async loginDev() {
    const data = await this.request('/api/auth/dev', { method: 'POST' });
    this.token = data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/api/v1/dashboard/stats');
  }

  // API management
  async listAPIs(page = 1) {
    return this.request(`/api/v1/apis?page=${page}`);
  }

  async getPublicAPIs(page = 1) {
    return this.request(`/api/public/apis?page=${page}`);
  }

  async createAPI(data: {
    name: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    check_interval?: number;
  }) {
    return this.request('/api/v1/apis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAPI(id: number) {
    return this.request(`/api/v1/apis/${id}`);
  }

  async updateAPI(id: number, data: {
    name?: string;
    check_interval?: number;
    is_active?: boolean;
    headers?: Record<string, string>;
  }) {
    return this.request(`/api/v1/apis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAPI(id: number) {
    return this.request(`/api/v1/apis/${id}`, {
      method: 'DELETE',
    });
  }

  async getAPIChanges(id: number, page = 1) {
    return this.request(`/api/v1/apis/${id}/changes?page=${page}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/api/public/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();