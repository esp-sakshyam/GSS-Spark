/* ===== LifeLine Portal - Index Mappings JavaScript ===== */

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('LifeLine not loaded. Make sure shared.js is included before this file.');
}

const LL = window.LifeLine || {};
const apiGet = LL.apiGet;
const apiPost = LL.apiPost;
const apiPut = LL.apiPut;
const apiDelete = LL.apiDelete;
const showToast = LL.showToast;
const openModal = LL.openModal;
const closeModal = LL.closeModal;
const initModalClose = LL.initModalClose;
const getIcon = LL.getIcon;
const debounce = LL.debounce;

// ===== State =====
let allIndexes = [];
let filteredIndexes = [];
let allHelps = [];
let deleteTargetId = null;

// ===== DOM Elements =====
let mappingsGrid;
let filterLocation, searchInput;
let refreshBtn, addMappingBtn, saveMappingBtn, confirmDeleteBtn;
let mappingForm, mappingId, mappingLocation, mappingMessage, helpSelector;
let totalMappings, uniqueLocations, uniqueMessages, linkedHelps;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadData();
});

function initElements() {
    mappingsGrid = document.getElementById('mappingsGrid');
    filterLocation = document.getElementById('filterLocation');
    searchInput = document.getElementById('searchInput');
    refreshBtn = document.getElementById('refreshBtn');
    addMappingBtn = document.getElementById('addMappingBtn');
    saveMappingBtn = document.getElementById('saveMappingBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    mappingForm = document.getElementById('mappingForm');
    mappingId = document.getElementById('mappingId');
    mappingLocation = document.getElementById('mappingLocation');
    mappingMessage = document.getElementById('mappingMessage');
    helpSelector = document.getElementById('helpSelector');

    totalMappings = document.getElementById('totalMappings');
    uniqueLocations = document.getElementById('uniqueLocations');
    uniqueMessages = document.getElementById('uniqueMessages');
    linkedHelps = document.getElementById('linkedHelps');
}

function initEventListeners() {
    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('spin');
        loadData().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spin'), 500);
        });
    });

    addMappingBtn?.addEventListener('click', () => openAddModal());
    saveMappingBtn?.addEventListener('click', saveMapping);
    confirmDeleteBtn?.addEventListener('click', confirmDelete);

    filterLocation?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', debounce(applyFilters, 300));

    initModalClose('mappingModal');
    initModalClose('deleteModal');
}

// ===== Load Data =====
async function loadData() {
    try {
        const [indexesRes, helpsRes] = await Promise.all([
            apiGet('Read/index.php'),
            apiGet('Read/helps.php')
        ]);

        allIndexes = indexesRes.data || [];
        allHelps = helpsRes.data || [];

        updateStats();
        populateFilters();
        applyFilters();

    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load mappings', 'error');
        mappingsGrid.innerHTML = '<div class="empty-state"><p>Failed to load mappings</p></div>';
    }
}

// ===== Update Stats =====
function updateStats() {
    const locations = new Set(allIndexes.map(i => i.location).filter(Boolean));
    const messages = new Set(allIndexes.map(i => i.message).filter(Boolean));
    const linked = allIndexes.filter(i => i.HID).length;

    if (totalMappings) totalMappings.textContent = allIndexes.length;
    if (uniqueLocations) uniqueLocations.textContent = locations.size;
    if (uniqueMessages) uniqueMessages.textContent = messages.size;
    if (linkedHelps) linkedHelps.textContent = linked;
}

// ===== Populate Filters =====
function populateFilters() {
    if (filterLocation) {
        const locations = [...new Set(allIndexes.map(i => i.location).filter(Boolean))].sort();
        const options = locations.map(l => `<option value="${l}">${l}</option>`).join('');
        filterLocation.innerHTML = `<option value="">All Locations</option>${options}`;
    }
}

// ===== Apply Filters =====
function applyFilters() {
    const locationFilter = filterLocation?.value || '';
    const searchTerm = searchInput?.value?.toLowerCase() || '';

    filteredIndexes = allIndexes.filter(index => {
        if (locationFilter && index.location !== locationFilter) return false;
        if (searchTerm) {
            const location = (index.location || '').toLowerCase();
            const message = (index.message || '').toLowerCase();
            const helpName = getHelpName(index.HID).toLowerCase();
            if (!location.includes(searchTerm) && !message.includes(searchTerm) && !helpName.includes(searchTerm)) {
                return false;
            }
        }
        return true;
    });

    // Sort by location
    filteredIndexes.sort((a, b) => (a.location || '').localeCompare(b.location || ''));

    renderMappings();
}

// ===== Render Mappings =====
function renderMappings() {
    if (!mappingsGrid) return;

    if (filteredIndexes.length === 0) {
        mappingsGrid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <h3>No Mappings Found</h3>
                <p>Create mappings to link message codes to locations and help resources</p>
                <button class="btn btn-primary" onclick="openAddModal()">
                    ${getIcon('plus')} Add Mapping
                </button>
            </div>
        `;
        return;
    }

    mappingsGrid.innerHTML = filteredIndexes.map(index => {
        const help = index.HID ? allHelps.find(h => h.HID == index.HID) : null;

        return `
            <div class="mapping-card" data-lid="${index.LID}">
                <div class="mapping-section">
                    <span class="mapping-label">Location</span>
                    <span class="mapping-value">${index.location || 'Not specified'}</span>
                </div>
                <div class="mapping-section">
                    <span class="mapping-label">Message Code</span>
                    <span class="mapping-value mono">${index.message || 'N/A'}</span>
                </div>
                <div class="mapping-section">
                    <span class="mapping-label">Linked Help Resource</span>
                    <div class="help-tags">
                        ${help ? `
                            <span class="help-tag">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                ${help.name}
                            </span>
                        ` : '<span class="no-helps">No resource linked</span>'}
                    </div>
                </div>
                <div class="mapping-actions">
                    <button class="action-btn edit" title="Edit" onclick="editMapping(${index.LID})">
                        ${getIcon('edit')}
                    </button>
                    <button class="action-btn delete" title="Delete" onclick="openDeleteModal(${index.LID})">
                        ${getIcon('trash')}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Helper Functions =====
function getHelpName(hid) {
    if (!hid) return '';
    const help = allHelps.find(h => h.HID == hid);
    return help?.name || '';
}

// ===== Modal Actions =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Mapping';
    mappingForm.reset();
    mappingId.value = '';
    renderHelpSelector([]);
    openModal('mappingModal');
}

function editMapping(lid) {
    const index = allIndexes.find(i => i.LID == lid);
    if (!index) return;

    document.getElementById('modalTitle').textContent = 'Edit Mapping';
    mappingId.value = index.LID;
    mappingLocation.value = index.location || '';
    mappingMessage.value = index.message || '';

    // Get selected help IDs for this mapping
    const selectedHids = index.HID ? [index.HID] : [];
    renderHelpSelector(selectedHids);

    openModal('mappingModal');
}

function renderHelpSelector(selectedHids) {
    if (!helpSelector) return;

    if (allHelps.length === 0) {
        helpSelector.innerHTML = '<div class="help-selector-empty">No help resources available</div>';
        return;
    }

    helpSelector.innerHTML = allHelps.map(help => `
        <label class="help-option">
            <input type="checkbox" name="selectedHelps" value="${help.HID}" 
                ${selectedHids.includes(help.HID) ? 'checked' : ''}>
            <div class="help-option-info">
                <div class="help-option-name">${help.name}</div>
                <div class="help-option-meta">${help.contact || 'No contact'} • ${help.status}</div>
            </div>
        </label>
    `).join('');
}

function openDeleteModal(lid) {
    const index = allIndexes.find(i => i.LID == lid);
    if (!index) return;

    deleteTargetId = lid;
    document.getElementById('deleteLocation').textContent = index.location || `Mapping #${lid}`;
    openModal('deleteModal');
}

// ===== CRUD Operations =====
async function saveMapping() {
    const location = mappingLocation.value.trim();
    const message = mappingMessage.value.trim();
    const id = mappingId.value;

    if (!location || !message) {
        showToast('Please fill in location and message code', 'error');
        return;
    }

    // Get selected help IDs
    const selectedHelps = Array.from(document.querySelectorAll('input[name="selectedHelps"]:checked'))
        .map(cb => cb.value);

    // For simplicity, we'll use the first selected help (since schema has single HID)
    const hid = selectedHelps.length > 0 ? selectedHelps[0] : null;

    try {
        saveMappingBtn.disabled = true;
        saveMappingBtn.textContent = 'Saving...';

        const data = {
            location,
            message,
            HID: hid
        };

        if (id) {
            data.LID = id;
            await apiPut('Update/index.php', data);
            showToast('Mapping updated successfully', 'success');
        } else {
            await apiPost('Create/index.php', data);
            showToast('Mapping created successfully', 'success');
        }

        closeModal('mappingModal');
        await loadData();

    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save mapping', 'error');
    } finally {
        saveMappingBtn.disabled = false;
        saveMappingBtn.textContent = 'Save Mapping';
    }
}

async function confirmDelete() {
    if (!deleteTargetId) return;

    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        await apiDelete(`Delete/index.php?LID=${deleteTargetId}`);
        showToast('Mapping deleted successfully', 'success');

        closeModal('deleteModal');
        deleteTargetId = null;
        await loadData();

    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete mapping', 'error');
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
    }
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spin svg {
        animation: spin 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.editMapping = editMapping;
window.openAddModal = openAddModal;
window.openDeleteModal = openDeleteModal;
window.closeModal = closeModal;
