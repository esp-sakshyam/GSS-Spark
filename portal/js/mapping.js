// Mapping Page JavaScript
const API_BASE = '../API';
let indexes = [];
let currentViewId = null;
let deleteId = null;

// Theme sync
function syncTheme() {
    if (window.parent && window.parent.lifelinePortal) {
        const theme = window.parent.lifelinePortal.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    } else {
        const theme = localStorage.getItem('lifeline-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');

    toast.className = `toast show ${type}`;
    toastMessage.textContent = message;
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load all indexes
async function loadIndexes() {
    const container = document.getElementById('indexes-container');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading index mappings...</div>';

    try {
        const typeFilter = document.getElementById('type-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        let url = `${API_BASE}/Read/index.php`;
        if (typeFilter) {
            url += `?type=${typeFilter}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            // Handle different response formats
            if (data.data.indexes && Array.isArray(data.data.indexes)) {
                // All indexes response: { indexes: [...], total: n }
                indexes = data.data.indexes;
            } else if (Array.isArray(data.data)) {
                indexes = data.data;
            } else if (data.data.mapping) {
                // Single index response
                indexes = [data.data];
            } else {
                indexes = [];
            }

            // Apply search filter
            if (searchTerm) {
                indexes = indexes.filter(index => {
                    const typeMatch = index.type.toLowerCase().includes(searchTerm);
                    const descMatch = (index.description || '').toLowerCase().includes(searchTerm);
                    const mapping = typeof index.mapping === 'string' ? JSON.parse(index.mapping) : index.mapping;
                    const valueMatch = Object.values(mapping).some(val =>
                        val.toLowerCase().includes(searchTerm)
                    );
                    return typeMatch || descMatch || valueMatch;
                });
            }

            updateStats();
            renderCards();
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-text">${data.message}</div></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-circle-xmark"></i></div><div class="empty-state-text">Error loading indexes</div></div>`;
        console.error('Error:', error);
    }
}

// Update stats
function updateStats() {
    document.getElementById('total-count').textContent = indexes.length;
    document.getElementById('location-count').textContent = indexes.filter(i => i.type === 'location').length;
    document.getElementById('message-count').textContent = indexes.filter(i => i.type === 'message').length;
}

// Get type icon
function getTypeIcon(type) {
    const icons = {
        'location': 'fa-solid fa-location-dot',
        'message': 'fa-solid fa-message'
    };
    return icons[type] || 'fa-solid fa-tag';
}

// Render index cards
function renderCards() {
    const container = document.getElementById('indexes-container');

    if (indexes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-diagram-project"></i></div>
                <div class="empty-state-text">No index mappings found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="index-cards">${indexes.map(index => renderCard(index)).join('')}</div>`;
}

// Render single card
function renderCard(index) {
    const mapping = typeof index.mapping === 'string' ? JSON.parse(index.mapping) : index.mapping;
    const entries = Object.entries(mapping).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    const entryCount = entries.length;
    const updatedAt = new Date(index.updated_at).toLocaleString();

    return `
        <div class="index-card" data-id="${index.IID}">
            <div class="index-card-header">
                <div class="index-card-title">
                    <span class="type-badge ${index.type}">
                        <i class="${getTypeIcon(index.type)}"></i> ${index.type}
                    </span>
                    <span style="color: var(--text-muted); font-size: 12px;">ID: ${index.IID}</span>
                </div>
                <div class="index-card-actions">
                    <button class="btn-icon add" onclick="openAddEntryModal(${index.IID})" title="Add Entry">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button class="btn-icon" onclick="viewIndex(${index.IID})" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="editIndex(${index.IID})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteIndex(${index.IID})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="index-card-body">
                ${index.description ? `<p class="index-description">${index.description}</p>` : ''}
                <div class="index-meta">
                    <span><i class="fa-solid fa-list-ol"></i> ${entryCount} entries</span>
                    <span><i class="fa-solid fa-clock"></i> ${updatedAt}</span>
                </div>
                <div class="mapping-table-container">
                    <table class="mapping-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.map(([code, value]) => `
                                <tr data-code="${code}">
                                    <td class="code-cell">${code}</td>
                                    <td class="value-cell" ondblclick="startInlineEdit(this, ${index.IID}, '${code}')">${escapeHtml(value)}</td>
                                    <td class="actions-cell">
                                        <button class="edit-entry" onclick="startInlineEdit(this.closest('tr').querySelector('.value-cell'), ${index.IID}, '${code}')" title="Edit">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        <button class="delete-entry" onclick="deleteEntry(${index.IID}, '${code}')" title="Delete">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Inline edit for table cells
function startInlineEdit(cell, iid, code) {
    if (cell.querySelector('input')) return; // Already editing

    const currentValue = cell.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentValue;

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    // Save on Enter, cancel on Escape
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const newValue = input.value.trim();
            if (newValue && newValue !== currentValue) {
                await updateEntry(iid, code, newValue);
            } else {
                cell.textContent = currentValue;
            }
        } else if (e.key === 'Escape') {
            cell.textContent = currentValue;
        }
    });

    // Save on blur
    input.addEventListener('blur', async () => {
        const newValue = input.value.trim();
        if (newValue && newValue !== currentValue) {
            await updateEntry(iid, code, newValue);
        } else {
            cell.textContent = currentValue;
        }
    });
}

// Update single entry
async function updateEntry(iid, code, newValue) {
    try {
        const res = await fetch(`${API_BASE}/Update/index.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                IID: iid,
                add: { [code]: newValue }
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast('Entry updated successfully');
            loadIndexes();
        } else {
            showToast(data.message || 'Failed to update entry', 'error');
            loadIndexes();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error updating entry', 'error');
        loadIndexes();
    }
}

// Delete single entry
async function deleteEntry(iid, code) {
    if (!confirm(`Delete entry with code "${code}"?`)) return;

    try {
        const res = await fetch(`${API_BASE}/Update/index.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                IID: iid,
                remove: [code]
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast('Entry deleted successfully');
            loadIndexes();
        } else {
            showToast(data.message || 'Failed to delete entry', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error deleting entry', 'error');
    }
}

// Open Create Modal
function openCreateModal() {
    document.getElementById('edit-id').value = '';
    document.getElementById('modal-title').innerHTML = '<i class="fa-solid fa-plus-circle"></i> New Index Mapping';
    document.getElementById('index-form').reset();
    document.getElementById('index-type').disabled = false;
    document.getElementById('mapping-entries').innerHTML = getEntriesHeader();

    // Add initial entry
    addMappingEntry();

    document.getElementById('edit-modal').classList.add('show');
}

// Open Edit Modal
async function editIndex(iid) {
    const index = indexes.find(i => i.IID === iid);
    if (!index) return;

    document.getElementById('edit-id').value = iid;
    document.getElementById('modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Index Mapping';
    document.getElementById('index-type').value = index.type;
    document.getElementById('index-type').disabled = true; // Can't change type
    document.getElementById('index-description').value = index.description || '';

    // Populate mapping entries with header
    const mapping = typeof index.mapping === 'string' ? JSON.parse(index.mapping) : index.mapping;
    const entriesContainer = document.getElementById('mapping-entries');
    entriesContainer.innerHTML = getEntriesHeader();

    Object.entries(mapping).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([code, value]) => {
        addMappingEntry(code, value);
    });

    document.getElementById('edit-modal').classList.add('show');
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
}

// Get header for entries
function getEntriesHeader() {
    return `
        <div class="mapping-entries-header">
            <span class="code-label">Code</span>
            <span class="value-label">Value</span>
            <span class="action-label"></span>
        </div>
    `;
}

// Add mapping entry row
function addMappingEntry(code = '', value = '') {
    const entriesContainer = document.getElementById('mapping-entries');

    // Add header if this is the first entry
    if (!entriesContainer.querySelector('.mapping-entries-header')) {
        entriesContainer.innerHTML = getEntriesHeader();
    }

    const entry = document.createElement('div');
    entry.className = 'mapping-entry';
    entry.innerHTML = `
        <input type="number" class="code-input" placeholder="e.g. 1" value="${code}" min="1">
        <input type="text" class="value-input" placeholder="e.g. Namche Bazaar" value="${escapeHtml(value)}">
        <button type="button" class="remove-entry" onclick="this.parentElement.remove()" title="Remove">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    entriesContainer.appendChild(entry);
}

// Save index
async function saveIndex() {
    const iid = document.getElementById('edit-id').value;
    const type = document.getElementById('index-type').value;
    const description = document.getElementById('index-description').value.trim();

    if (!type) {
        showToast('Please select a type', 'error');
        return;
    }

    // Collect mapping entries
    const entries = document.querySelectorAll('.mapping-entry');
    const mapping = {};

    for (const entry of entries) {
        const code = entry.querySelector('.code-input').value.trim();
        const value = entry.querySelector('.value-input').value.trim();

        if (code && value) {
            mapping[code] = value;
        }
    }

    if (Object.keys(mapping).length === 0) {
        showToast('Please add at least one mapping entry', 'error');
        return;
    }

    try {
        let res;
        if (iid) {
            // Update existing
            res = await fetch(`${API_BASE}/Update/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    IID: parseInt(iid),
                    mapping: mapping,
                    description: description || null
                })
            });
        } else {
            // Create new
            res = await fetch(`${API_BASE}/Create/index.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    mapping: mapping,
                    description: description || null
                })
            });
        }

        const data = await res.json();
        if (data.success) {
            showToast(iid ? 'Index updated successfully' : 'Index created successfully');
            closeEditModal();
            loadIndexes();
        } else {
            showToast(data.message || 'Failed to save index', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error saving index', 'error');
    }
}

// View Index Details
function viewIndex(iid) {
    const index = indexes.find(i => i.IID === iid);
    if (!index) return;

    currentViewId = iid;
    const mapping = typeof index.mapping === 'string' ? JSON.parse(index.mapping) : index.mapping;
    const entries = Object.entries(mapping).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    const updatedAt = new Date(index.updated_at).toLocaleString();

    document.getElementById('view-title').textContent = `${index.type.charAt(0).toUpperCase() + index.type.slice(1)} Index`;
    document.getElementById('view-content').innerHTML = `
        <div class="view-section">
            <div class="view-section-title">Type</div>
            <div class="view-section-content">
                <span class="type-badge ${index.type}">
                    <i class="${getTypeIcon(index.type)}"></i> ${index.type}
                </span>
            </div>
        </div>
        ${index.description ? `
        <div class="view-section">
            <div class="view-section-title">Description</div>
            <div class="view-section-content">${escapeHtml(index.description)}</div>
        </div>
        ` : ''}
        <div class="view-section">
            <div class="view-section-title">Last Updated</div>
            <div class="view-section-content">${updatedAt}</div>
        </div>
        <div class="view-section">
            <div class="view-section-title">Mappings (${entries.length})</div>
            <div class="view-section-content">
                <div class="view-mapping-table">
                    <table class="mapping-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entries.map(([code, value]) => `
                                <tr>
                                    <td class="code-cell">${code}</td>
                                    <td class="value-cell">${escapeHtml(value)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('view-modal').classList.add('show');
}

// Close View Modal
function closeViewModal() {
    document.getElementById('view-modal').classList.remove('show');
    currentViewId = null;
}

// Edit from view modal
function editFromView() {
    closeViewModal();
    if (currentViewId) {
        editIndex(currentViewId);
    }
}

// Delete Index
function deleteIndex(iid) {
    const index = indexes.find(i => i.IID === iid);
    if (!index) return;

    deleteId = iid;
    document.getElementById('delete-type').textContent = index.type;
    document.getElementById('delete-modal').classList.add('show');
}

// Close Delete Modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
    deleteId = null;
}

// Confirm Delete
async function confirmDelete() {
    if (!deleteId) return;

    try {
        const res = await fetch(`${API_BASE}/Delete/index.php?id=${deleteId}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (data.success) {
            showToast('Index deleted successfully');
            closeDeleteModal();
            loadIndexes();
        } else {
            showToast(data.message || 'Failed to delete index', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error deleting index', 'error');
    }
}

// Add Entry Modal (quick add)
function openAddEntryModal(iid) {
    document.getElementById('add-entry-iid').value = iid;
    document.getElementById('new-entry-code').value = '';
    document.getElementById('new-entry-value').value = '';
    document.getElementById('add-entry-modal').classList.add('show');
    document.getElementById('new-entry-code').focus();
}

function closeAddEntryModal() {
    document.getElementById('add-entry-modal').classList.remove('show');
}

async function saveNewEntry() {
    const iid = document.getElementById('add-entry-iid').value;
    const code = document.getElementById('new-entry-code').value.trim();
    const value = document.getElementById('new-entry-value').value.trim();

    if (!code || !value) {
        showToast('Please fill in both code and value', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/Update/index.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                IID: parseInt(iid),
                add: { [code]: value }
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast('Entry added successfully');
            closeAddEntryModal();
            loadIndexes();
        } else {
            showToast(data.message || 'Failed to add entry', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error adding entry', 'error');
    }
}

// Event listeners
document.getElementById('type-filter').addEventListener('change', loadIndexes);
document.getElementById('search-input').addEventListener('input', debounce(loadIndexes, 300));

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard shortcuts for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeViewModal();
        closeDeleteModal();
        closeAddEntryModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    syncTheme();
    loadIndexes();
});
