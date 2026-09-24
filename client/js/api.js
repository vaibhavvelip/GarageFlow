/* GarageFlow Centralized API Fetch Helper */

const API_BASE_URL = window.GARAGEFLOW_API_URL || '/api';

// Retrieve JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('garageflow_token');
}

// Set JWT token and user details
function setAuthSession(token, user) {
    localStorage.setItem('garageflow_token', token);
    localStorage.setItem('garageflow_user', JSON.stringify(user));
}

// Clear JWT token and user details
function clearAuthSession() {
    localStorage.removeItem('garageflow_token');
    localStorage.removeItem('garageflow_user');
}

// Get logged-in user details
function getCurrentUser() {
    const userStr = localStorage.getItem('garageflow_user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

// Universal API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            clearAuthSession();
            if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('/register.html')) {
                window.location.href = '/login.html?session_expired=true';
            }
        }

        return data;
    } catch (err) {
        console.error(`API Fetch Error [${endpoint}]:`, err);
        return { success: false, message: 'Network or server error. Please try again.' };
    }
}

// UI Alert Toast Helper
function showAlert(message, type = 'danger', targetId = 'alertContainer') {
    const container = document.getElementById(targetId);
    if (!container) return;

    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    container.innerHTML = alertHtml;
}
