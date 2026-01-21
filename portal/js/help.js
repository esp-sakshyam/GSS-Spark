/* ===== LifeLine Portal - Help Resources JavaScript ===== */
console.log('[Help] help.js loading...');
console.log('[Help] window.LifeLine =', window.LifeLine);

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('[Help] LifeLine not loaded! Make sure shared.js is included before this file.');
    throw new Error('LifeLine not loaded');
}

const LL = window.LifeLine;
const apiGet = LL.apiGet;
const apiPost = LL.apiPost;
const apiPut = LL.apiPut;
const apiDelete = LL.apiDelete;
const formatTime = LL.formatTime;
const showToast = LL.showToast;
const openModal = LL.openModal;
const closeModal = LL.closeModal;
const initModalClose = LL.initModalClose;
const getIcon = LL.getIcon;
const debounce = LL.debounce;

console.log('[Help] Functions loaded - apiGet:', typeof apiGet);

// ===== State =====
let allHelps = [];
let filteredHelps = [];
let deleteTargetId = null;
let dispatchTargetId = null;

// ===== DOM Elements =====
let helpTableBody;
let filterStatus, searchInput;
let refreshBtn, addHelpBtn, saveHelpBtn, confirmDeleteBtn, confirmDispatchBtn;
let helpForm, helpId, helpName, helpContact, helpEta, helpStatus, helpLocation;
let availableCount, busyCount, dispatchedCount, totalCount;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadData();
});

function initElements() {
    helpTableBody = document.getElementById('helpTableBody');
    filterStatus = document.getElementById('filterStatus');
    searchInput = document.getElementById('searchInput');
    refreshBtn = document.getElementById('refreshBtn');
    addHelpBtn = document.getElementById('addHelpBtn');
    saveHelpBtn = document.getElementById('saveHelpBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDispatchBtn = document.getElementById('confirmDispatchBtn');

    helpForm = document.getElementById('helpForm');
    helpId = document.getElementById('helpId');
    helpName = document.getElementById('helpName');
    helpContact = document.getElementById('helpContact');
    helpEta = document.getElementById('helpEta');
    helpStatus = document.getElementById('helpStatus');
    helpLocation = document.getElementById('helpLocation');

    availableCount = document.getElementById('availableCount');
    busyCount = document.getElementById('busyCount');
    dispatchedCount = document.getElementById('dispatchedCount');
    totalCount = document.getElementById('totalCount');
}

function initEventListeners() {
    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('spin');
        loadData().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spin'), 500);
        });
    });

    addHelpBtn?.addEventListener('click', () => openAddModal());
    saveHelpBtn?.addEventListener('click', saveHelp);
    confirmDeleteBtn?.addEventListener('click', confirmDelete);
    confirmDispatchBtn?.addEventListener('click', confirmDispatch);

    filterStatus?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', debounce(applyFilters, 300));

    initModalClose('helpModal');
    initModalClose('deleteModal');
    initModalClose('dispatchModal');
}

// ===== Load Data =====
async function loadData() {
    try {
        const response = await apiGet('Read/helps.php');
        allHelps = response.data?.helps || [];

        updateStatusCounts();
        applyFilters();

    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load help resources', 'error');
        helpTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Failed to load resources</td></tr>';
    }
}

// ===== Update Status Counts =====
function updateStatusCounts() {
    const available = allHelps.filter(h => h.status === 'available').length;
    const busy = allHelps.filter(h => h.status === 'busy').length;
    const dispatched = allHelps.filter(h => h.status === 'dispatched').length;

    if (availableCount) availableCount.textContent = available;
    if (busyCount) busyCount.textContent = busy;
    if (dispatchedCount) dispatchedCount.textContent = dispatched;
    if (totalCount) totalCount.textContent = allHelps.length;
}

// ===== Apply Filters =====
function applyFilters() {
    const statusFilter = filterStatus?.value || '';
    const searchTerm = searchInput?.value?.toLowerCase() || '';

    filteredHelps = allHelps.filter(help => {
        if (statusFilter && help.status !== statusFilter) return false;
        if (searchTerm) {
            const name = (help.name || '').toLowerCase();
            const contact = (help.contact || '').toLowerCase();
            const location = (help.location || '').toLowerCase();
            if (!name.includes(searchTerm) && !contact.includes(searchTerm) && !location.includes(searchTerm)) {
                return false;
            }
        }
        return true;
    });

    renderTable();
}

// ===== Render Table =====
function renderTable() {
    if (!helpTableBody) return;

    if (filteredHelps.length === 0) {
        helpTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No help resources found</td></tr>';
        return;
    }

    helpTableBody.innerHTML = filteredHelps.map(help => `
        <tr data-hid="${help.HID}">
            <td><span class="help-id">#${help.HID}</span></td>
            <td><span class="help-name">${help.name || 'Unknown'}</span></td>
            <td><span class="help-contact">${help.contact || 'N/A'}</span></td>
            <td>
                <span class="help-eta">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${help.eta ? `${help.eta} min` : 'N/A'}
                </span>
            </td>
            <td><span class="help-location">${help.location || 'Not specified'}</span></td>
            <td><span class="status-badge ${help.status || 'available'}">${help.status || 'available'}</span></td>
            <td>
                <div class="action-btns">
                    ${help.status === 'available' ? `
                        <button class="action-btn dispatch" title="Dispatch" onclick="openDispatchModal(${help.HID})">
                            ${getIcon('send')}
                        </button>
                    ` : help.status === 'dispatched' ? `
                        <button class="action-btn recall" title="Mark Available" onclick="recallHelp(${help.HID})">
                            ${getIcon('check')}
                        </button>
                    ` : ''}
                    <button class="action-btn edit" title="Edit" onclick="editHelp(${help.HID})">
                        ${getIcon('edit')}
                    </button>
                    <button class="action-btn delete" title="Delete" onclick="openDeleteModal(${help.HID})">
                        ${getIcon('trash')}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== Modal Actions =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Resource';
    helpForm.reset();
    helpId.value = '';
    helpStatus.value = 'available';
    openModal('helpModal');
}

function editHelp(hid) {
    const help = allHelps.find(h => h.HID == hid);
    if (!help) return;

    document.getElementById('modalTitle').textContent = 'Edit Resource';
    helpId.value = help.HID;
    helpName.value = help.name || '';
    helpContact.value = help.contact || '';
    helpEta.value = help.eta || '';
    helpStatus.value = help.status || 'available';
    helpLocation.value = help.location || '';

    openModal('helpModal');
}

function openDeleteModal(hid) {
    const help = allHelps.find(h => h.HID == hid);
    if (!help) return;

    deleteTargetId = hid;
    document.getElementById('deleteHelpName').textContent = help.name || `Resource #${hid}`;
    openModal('deleteModal');
}

function openDispatchModal(hid) {
    const help = allHelps.find(h => h.HID == hid);
    if (!help) return;

    dispatchTargetId = hid;
    document.getElementById('dispatchHelpName').textContent = help.name || `Resource #${hid}`;
    openModal('dispatchModal');
}

// ===== CRUD Operations =====
async function saveHelp() {
    const name = helpName.value.trim();
    const contact = helpContact.value.trim();
    const eta = helpEta.value;
    const status = helpStatus.value;
    const location = helpLocation.value.trim();
    const id = helpId.value;

    if (!name) {
        showToast('Please enter a name', 'error');
        return;
    }

    try {
        saveHelpBtn.disabled = true;
        saveHelpBtn.textContent = 'Saving...';

        const data = {
            name,
            contact: contact || null,
            eta: eta || null,
            status,
            location: location || null
        };

        if (id) {
            data.HID = id;
            await apiPut('Update/helps.php', data);
            showToast('Resource updated successfully', 'success');
        } else {
            await apiPost('Create/helps.php', data);
            showToast('Resource created successfully', 'success');
        }

        closeModal('helpModal');
        await loadData();

    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save resource', 'error');
    } finally {
        saveHelpBtn.disabled = false;
        saveHelpBtn.textContent = 'Save Resource';
    }
}

async function confirmDelete() {
    if (!deleteTargetId) return;

    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        await apiDelete(`Delete/helps.php?HID=${deleteTargetId}`);
        showToast('Resource deleted successfully', 'success');

        closeModal('deleteModal');
        deleteTargetId = null;
        await loadData();

    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete resource', 'error');
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
    }
}

async function confirmDispatch() {
    if (!dispatchTargetId) return;

    try {
        confirmDispatchBtn.disabled = true;

        await apiPut('Update/helps.php', {
            HID: dispatchTargetId,
            status: 'dispatched'
        });
        showToast('Resource dispatched successfully', 'success');

        closeModal('dispatchModal');
        dispatchTargetId = null;
        await loadData();

    } catch (error) {
        console.error('Dispatch error:', error);
        showToast('Failed to dispatch resource', 'error');
    } finally {
        confirmDispatchBtn.disabled = false;
    }
}

async function recallHelp(hid) {
    try {
        await apiPut('Update/helps.php', {
            HID: hid,
            status: 'available'
        });
        showToast('Resource marked as available', 'success');
        await loadData();

    } catch (error) {
        console.error('Recall error:', error);
        showToast('Failed to update resource', 'error');
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
window.editHelp = editHelp;
window.openAddModal = openAddModal;
window.openDeleteModal = openDeleteModal;
window.openDispatchModal = openDispatchModal;
window.recallHelp = recallHelp;
window.closeModal = closeModal;
