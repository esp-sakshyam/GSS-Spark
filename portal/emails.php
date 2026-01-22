<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Receivers - LifeLine</title>
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/emails.css">
</head>

<body>
    <div class="header">
        <h1><i class="fa-solid fa-envelope"></i> Email Receivers</h1>
        <button class="btn btn-primary" onclick="openModal()"><i class="fa-solid fa-plus"></i> Add Email</button>
    </div>

    <div class="info-banner">
        <i class="fa-solid fa-circle-info"></i>
        <span>These email addresses will receive emergency notifications when new messages are created.</span>
    </div>

    <div class="stats-bar">
        <div class="stat-item">
            <span class="stat-number" id="total-count">-</span>
            <span class="stat-label">Total Receivers</span>
        </div>
    </div>

    <div id="table-container">
        <div class="loading">
            <span class="spinner"></span>
            Loading emails...
        </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="modal-overlay">
        <div class="modal" style="max-width: 450px;">
            <div class="modal-header">
                <span class="modal-title" id="modal-title"><i class="fa-solid fa-plus-circle"></i> Add Email</span>
                <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="email-form">
                    <input type="hidden" id="email-sn">
                    <div class="form-group">
                        <label for="email-input"><i class="fa-solid fa-envelope"></i> Email Address *</label>
                        <input type="email" id="email-input" placeholder="responder@example.com" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" onclick="saveEmail()"><i class="fa-solid fa-floppy-disk"></i>
                    Save</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="delete-modal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-trash-can"></i> Confirm Delete</span>
                <button class="modal-close" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> Are you sure you want
                    to delete this email?</p>
                <p id="delete-email-text" style="font-weight: 600; margin-top: 8px;"></p>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-danger" onclick="confirmDelete()"><i class="fa-solid fa-trash-can"></i>
                    Delete</button>
            </div>
        </div>
    </div>

    <script src="js/emails.js"></script>
</body>

</html>