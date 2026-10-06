const API_BASE = 'http://localhost:5000/api';

export class ApiClient {
  private static currentUserId: string = 'user_dev_a';

  public static setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  public static getCurrentUser(): string {
    return this.currentUserId;
  }

  private static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.message || data.error || 'API Error');
      err.response = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  public static async getUsers() {
    return this.request('/auth/users');
  }

  public static async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  public static async getFiles(projectId: string) {
    return this.request(`/projects/${projectId}/files`);
  }

  public static async getFile(fileId: string) {
    return this.request(`/files/${fileId}`);
  }

  public static async saveFile(fileId: string, content: string, changeSummary?: string) {
    return this.request(`/files/${fileId}/save`, {
      method: 'POST',
      body: JSON.stringify({ content, changeSummary })
    });
  }

  public static async createAccessRequest(projectId: string, fileId: string, reason: string) {
    return this.request('/access-requests', {
      method: 'POST',
      body: JSON.stringify({ projectId, fileId, reason })
    });
  }

  public static async getAccessRequests(projectId: string) {
    return this.request(`/projects/${projectId}/access-requests`);
  }

  public static async decideAccessRequest(requestId: string, decision: 'approved' | 'rejected') {
    return this.request(`/access-requests/${requestId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision })
    });
  }

  public static async getDependencies(projectId: string) {
    return this.request(`/projects/${projectId}/dependencies`);
  }

  public static async reindexDependencies(projectId: string) {
    return this.request(`/projects/${projectId}/dependencies/reindex`, {
      method: 'POST'
    });
  }

  public static async runTests(projectId: string, targetFilePath: string) {
    return this.request(`/projects/${projectId}/tests/run`, {
      method: 'POST',
      body: JSON.stringify({ targetFilePath })
    });
  }

  public static async getTestHistory(projectId: string) {
    return this.request(`/projects/${projectId}/tests/history`);
  }

  public static async analyzeAI(payload: {
    projectId: string;
    currentFilePath: string;
    diffContent?: string;
    testResults?: any;
    mlImpacts?: any[];
  }) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public static async getNotifications() {
    return this.request('/notifications');
  }

  public static async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  public static async getDocuments(projectId: string) {
    return this.request(`/projects/${projectId}/documents`);
  }

  public static async getAuditLogs(projectId: string) {
    return this.request(`/projects/${projectId}/audit-logs`);
  }

  public static async createCommit(projectId: string, message: string) {
    return this.request('/git/commit', {
      method: 'POST',
      body: JSON.stringify({ projectId, message })
    });
  }
}
