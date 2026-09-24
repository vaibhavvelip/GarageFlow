/* GarageFlow Auth Guard and Session Script */

document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
});

// Initialize Nav Auth UI
function initAuthUI() {
    const currentUser = getCurrentUser();
    const navUserContainer = document.getElementById('navUserContainer');

    if (navUserContainer) {
        if (currentUser) {
            const roleBadge = currentUser.role === 'ADMIN'
                ? '<span class="badge bg-danger ms-2">ADMIN</span>'
                : '<span class="badge bg-info ms-2">CUSTOMER</span>';

            navUserContainer.innerHTML = `
                <div class="d-flex items-center gap-3">
                    <span class="text-white fw-semibold small">
                        <i class="bi bi-person-circle me-1"></i> ${currentUser.name} ${roleBadge}
                    </span>
                    <button onclick="handleLogout()" class="btn btn-outline-light btn-sm">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </button>
                </div>
            `;
        } else {
            navUserContainer.innerHTML = `
                <a href="/login.html" class="btn btn-outline-light btn-sm me-2">Login</a>
                <a href="/register.html" class="btn btn-gf-primary btn-sm">Register</a>
            `;
        }
    }
}

// Guard Route based on Auth and Role
function requireAuth(requiredRole = null) {
    const user = getCurrentUser();
    const token = getAuthToken();

    if (!token || !user) {
        clearAuthSession();
        window.location.href = '/login.html';
        return false;
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'ADMIN') {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/customer/dashboard.html';
        }
        return false;
    }

    return true;
}

// Logout Action
function handleLogout() {
    clearAuthSession();
    window.location.href = '/login.html';
}
