// Build base API URL from current host so frontend and backend stay aligned.
const API_URL = `${window.location.origin}/api`;

// Render a visible error message in the login form.
function showError(message) {
  // Grab the error display element.
  const errorDiv = document.getElementById('error-message');
  // Stop silently if the container does not exist in current page layout.
  if (!errorDiv) return;

  // Set user-friendly error text.
  errorDiv.textContent = message;
  // Make the message area visible.
  errorDiv.style.display = 'block';
}

// Clear and hide any existing error message.
function clearError() {
  // Grab the error display element.
  const errorDiv = document.getElementById('error-message');
  // Stop silently if missing.
  if (!errorDiv) return;

  // Remove old message text.
  errorDiv.textContent = '';
  // Hide the element to keep UI clean.
  errorDiv.style.display = 'none';
}

// Map each user role to its dashboard URL.
function getRedirectByRole(role) {
  // Directors go to director dashboard.
  if (role === 'Director') return '/html/Directors-dashboard.html';
  // Managers go to manager dashboard.
  if (role === 'Manager') return '/html/managers-dashboard.html';
  // Sales agents go to sales page.
  if (role === 'Sales Agent') return '/html/sales-agent.html';
  // Fallback route for unknown role values.
  return '/login.html';
}

// Persist token and user details in localStorage after successful login.
function persistAuth(data) {
  // Save JWT for authenticated API calls.
  localStorage.setItem('token', data.token);
  // Save user object for role-based UI logic.
  localStorage.setItem('user', JSON.stringify(data.user));
}

// Send login request to backend and validate response.
async function login(username, password) {
  // Make POST request to auth login endpoint.
  const response = await fetch(`${API_URL}/auth/login`, {
    // Use POST because credentials are being submitted.
    method: 'POST',
    // Tell server we are sending JSON payload.
    headers: {
      'Content-Type': 'application/json',
    },
    // Serialize credentials into request body.
    body: JSON.stringify({ username, password }),
  });

  // Detect returned content type to avoid JSON parse crash on non-JSON responses.
  const contentType = response.headers.get('content-type') || '';
  // Parse JSON only when response is JSON; otherwise return a fallback error object.
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: 'Server returned an invalid response format.' };

  // Throw on non-2xx HTTP responses.
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  // Validate required auth fields before using response.
  if (!data.token || !data.user || !data.user.role) {
    throw new Error('Invalid login response from server');
  }

  // Return normalized login payload.
  return data;
}

// Initialize page behavior once DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  // Cache frequently used form nodes.
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Abort setup if expected form elements are not present.
  if (!loginForm || !usernameInput || !passwordInput || !loginBtn) {
    return;
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.alert('Contact the director to change password.');
    });
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      togglePasswordBtn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    });
  }

  // Handle submit event with async login flow.
  loginForm.addEventListener('submit', async (event) => {
    // Prevent full page reload.
    event.preventDefault();
    // Reset any previous error.
    clearError();

    // Read and normalize input values.
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Stop and show validation message if fields are empty.
    if (!username || !password) {
      showError('Please enter username and password.');
      return;
    }

    // Give visual feedback while request is in progress.
    loginBtn.textContent = 'Signing in...';
    // Disable button to prevent duplicate submissions.
    loginBtn.disabled = true;

    try {
      // Attempt server login.
      const authData = await login(username, password);
      // Store auth data locally.
      persistAuth(authData);
      // Redirect user to role-specific destination.
      window.location.href = getRedirectByRole(authData.user.role);
    } catch (error) {
      // Show friendly error message.
      showError(error.message || 'Login failed. Check credentials and try again.');
      // Reset button text on failure.
      loginBtn.textContent = 'Sign In';
      // Re-enable login button for retry.
      loginBtn.disabled = false;
    }
  });
});
