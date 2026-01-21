<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | LifeLine Emergency Response System</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="CSS/login.css">
</head>

<body>
    <div class="login-container">
        <!-- Background Elements -->
        <div class="bg-pattern"></div>
        <div class="bg-gradient"></div>

        <!-- Login Card -->
        <div class="login-card">
            <!-- Logo Section -->
            <div class="login-header">
                <a href="index.html" class="logo-link">
                    <div class="logo">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" />
                            <circle cx="20" cy="20" r="8" fill="currentColor" />
                            <path d="M20 2 L20 8 M20 32 L20 38 M2 20 L8 20 M32 20 L38 20" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" />
                        </svg>
                    </div>
                    <span class="logo-text">LifeLine</span>
                </a>
                <p class="login-subtitle">Emergency Response System</p>
            </div>

            <!-- Login Form -->
            <form id="loginForm" class="login-form" novalidate>
                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <div class="input-wrapper">
                        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email"
                            autocomplete="email" required>
                    </div>
                    <span class="error-message" id="emailError"></span>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-wrapper">
                        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <input type="password" id="password" name="password" class="form-input"
                            placeholder="Enter your password" autocomplete="current-password" required>
                        <button type="button" class="toggle-password" id="togglePassword"
                            aria-label="Toggle password visibility">
                            <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <svg class="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        </button>
                    </div>
                    <span class="error-message" id="passwordError"></span>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <input type="checkbox" name="remember" id="remember">
                        <span class="checkmark"></span>
                        <span class="label-text">Remember me</span>
                    </label>
                </div>

                <!-- Alert Message -->
                <div class="alert" id="alertMessage" role="alert"></div>

                <!-- Submit Button -->
                <button type="submit" class="btn-login" id="submitBtn">
                    <span class="btn-text">Sign In</span>
                    <span class="btn-loader">
                        <svg class="spinner" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                                stroke-dasharray="31.4 31.4" stroke-linecap="round" />
                        </svg>
                    </span>
                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </form>

            <!-- Footer -->
            <div class="login-footer">
                <a href="index.html" class="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
                </a>
            </div>
        </div>

        <!-- Side Info Panel -->
        <div class="info-panel">
            <div class="info-content">
                <div class="info-icon">
                    <svg viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" opacity="0.3" />
                        <circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="2" opacity="0.5" />
                        <circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="2" opacity="0.7" />
                        <circle cx="32" cy="32" r="4" fill="currentColor" />
                        <!-- Signal waves -->
                        <path d="M32 4 L32 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M32 52 L32 60" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M4 32 L12 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M52 32 L60 32" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </div>
                <h2 class="info-title">LifeLine Control Center</h2>
                <p class="info-description">
                    Access the emergency response dashboard to monitor LoRa mesh network status,
                    manage alerts, and coordinate rescue operations across rural Nepal.
                </p>
                <div class="info-features">
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Real-time device monitoring</span>
                    </div>
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Emergency alert management</span>
                    </div>
                    <div class="feature-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Resource coordination</span>
                    </div>
                </div>
            </div>

            <!-- Decorative Elements -->
            <div class="mesh-lines">
                <svg viewBox="0 0 200 200" fill="none">
                    <line x1="0" y1="50" x2="200" y2="50" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <line x1="0" y1="150" x2="200" y2="150" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <line x1="50" y1="0" x2="50" y2="200" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <line x1="150" y1="0" x2="150" y2="200" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
                    <!-- Connection dots -->
                    <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="100" cy="100" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="150" cy="150" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="50" cy="150" r="3" fill="currentColor" opacity="0.4" />
                    <circle cx="150" cy="50" r="3" fill="currentColor" opacity="0.4" />
                </svg>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="JS/login.js"></script>
</body>

</html>