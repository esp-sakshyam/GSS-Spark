/**
 * LifeLine Login Page JavaScript
 * Handles form validation, submission, and UI interactions
 */

document.addEventListener('DOMContentLoaded', function () {
    initLoginForm();
    initPasswordToggle();
});

/**
 * Initialize login form handling
 */
function initLoginForm() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const alertMessage = document.getElementById('alertMessage');

    if (!form) return;

    // Real-time validation on blur
    emailInput.addEventListener('blur', () => validateEmail(emailInput));
    passwordInput.addEventListener('blur', () => validatePassword(passwordInput));

    // Clear errors on focus
    emailInput.addEventListener('focus', () => clearError('email'));
    passwordInput.addEventListener('focus', () => clearError('password'));

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Reset alert
        hideAlert();

        // Validate all fields
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const response = await fetch('API/auth/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    remember: document.getElementById('remember').checked
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Login successful! Redirecting...', 'success');

                // Store session data if needed
                if (data.data && data.data.token) {
                    localStorage.setItem('lifeline_token', data.data.token);
                }

                // Redirect to portal after short delay
                setTimeout(() => {
                    window.location.href = 'portal/index.php';
                }, 1000);
            } else {
                showAlert(data.message || 'Invalid email or password', 'error');
                setLoadingState(false);

                // Shake the form on error
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 500);
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Connection error. Please try again.', 'error');
            setLoadingState(false);
        }
    });
}

/**
 * Validate email field
 */
function validateEmail(input) {
    const email = input.value.trim();
    const errorElement = document.getElementById('emailError');

    if (!email) {
        showError(input, errorElement, 'Email is required');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError(input, errorElement, 'Please enter a valid email address');
        return false;
    }

    clearError('email');
    return true;
}

/**
 * Validate password field
 */
function validatePassword(input) {
    const password = input.value;
    const errorElement = document.getElementById('passwordError');

    if (!password) {
        showError(input, errorElement, 'Password is required');
        return false;
    }

    if (password.length < 6) {
        showError(input, errorElement, 'Password must be at least 6 characters');
        return false;
    }

    clearError('password');
    return true;
}

/**
 * Show error message
 */
function showError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
}

/**
 * Clear error message
 */
function clearError(fieldName) {
    const input = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');

    if (input) input.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
    }
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    const alertElement = document.getElementById('alertMessage');
    if (!alertElement) return;

    alertElement.textContent = message;
    alertElement.className = 'alert visible ' + type;
}

/**
 * Hide alert message
 */
function hideAlert() {
    const alertElement = document.getElementById('alertMessage');
    if (!alertElement) return;

    alertElement.className = 'alert';
    alertElement.textContent = '';
}

/**
 * Set button loading state
 */
function setLoadingState(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Initialize password visibility toggle
 */
function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('active');
    });
}

/**
 * Add shake animation styles dynamically
 */
(function addShakeAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
})();
