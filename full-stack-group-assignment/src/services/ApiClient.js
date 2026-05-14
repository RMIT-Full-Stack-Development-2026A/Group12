import { API_ROOT_URL, TOKEN_STORAGE_KEY } from '../config/appConfig';

class ApiClient {
  constructor(baseUrl = API_ROOT_URL) {
    this.baseUrl = baseUrl;
  }

  _getToken() {
    // sessionStorage (per-tab) so multi-account login on the same browser
    // doesn't clobber across tabs.
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  }

  _authHeaders() {
    const token = this._getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async _request(method, path, { body, isFormData = false } = {}) {
    const headers = { ...this._authHeaders() };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options = { method, headers };
    if (body !== undefined) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || data.message || 'Request failed';
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return { data, status: response.status, headers: response.headers };
  }

  get(path) {
    return this._request('GET', path);
  }

  post(path, body) {
    return this._request('POST', path, { body });
  }

  put(path, body) {
    return this._request('PUT', path, { body });
  }

  patch(path, body, isFormData = false) {
    return this._request('PATCH', path, { body, isFormData });
  }

  delete(path) {
    return this._request('DELETE', path);
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
