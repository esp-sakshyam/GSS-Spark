/* ===== LifeLine Portal - Index Mappings JavaScript ===== */
console.log('[IndexMap] index-map.js loading...');

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('[IndexMap] LifeLine not loaded! Make sure shared.js is included before this file.');
    throw new Error('LifeLine not loaded');
}

const LL = window.LifeLine;
const apiGet = LL.apiGet;
const apiPost = LL.apiPost;
const apiPut = LL.apiPut;
const apiDelete = LL.apiDelete;
const showToast = LL.showToast;
const openModal = LL.openModal;
const closeModal = LL.closeModal;
const initModalClose = LL.initModalClose;
const getIcon = LL.getIcon;

console.log('[IndexMap] Functions loaded - apiGet:', typeof apiGet);

// ===== State =====
let indexMappings = {}; // { location: {...}, message: {...}, help: {...} }
let allHelps = [];

// ===== DOM Elements =====
let mappingsGrid;
let filterType;
let refreshBtn, addEntryBtn, saveEntryBtn, confirmDeleteBtn;
let entryForm, entryType, entryCode, entryValue;
let totalLocations, totalMessages, totalHelps;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadData();
});

function initElements() {
    mappingsGrid = document.getElementById('mappingsGrid');
    filterType = document.getElementById('filterType');
    refreshBtn = document.getElementById('refreshBtn');
    addEntryBtn = document.getElementById('addEntryBtn');
    saveEntryBtn = document.getElementById('saveEntryBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    entryForm = document.getElementById('entryForm');
    entryType = document.getElementById('entryType');
    entryCode = document.getElementById('entryCode');
    entryValue = document.getElementById('entryValue');

    totalLocations = document.getElementById('totalLocations');
    totalMessages = document.getElementById('totalMessages');
    totalHelps = document.getElementById('totalHelps');
}

function initEventListeners() {
    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('spin');
        loadData().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spin'), 500);
        });
    });

    addEntryBtn?.addEventListener('click', () => openAddModal());
    saveEntryBtn?.addEventListener('click', saveEntry);
    confirmDeleteBtn?.addEventListener('click', confirmDelete);

    filterType?.addEventListener('change', renderMappings);

    initModalClose('entryModal');
    initModalClose('deleteModal');
}

// ===== Load Data =====
async function loadData() {
    try {
        const [indexesRes, helpsRes] = await Promise.all([
            apiGet('Read/index.php'),
            apiGet('Read/helps.php')
        ]);

        const indexes = indexesRes.data?.indexes || [];
        allHelps = helpsRes.data?.helps || [];

        // Convert indexes array to object keyed by type
        indexMappings = {};
        indexes.forEach(index => {
            indexMappings[index.type] = {
                IID: index.IID,
                mapping: index.mapping || {},
                description: index.description
            };
        });

        updateStats();
        renderMappings();

    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load mappings', 'error');
        if (mappingsGrid) {
            mappingsGrid.innerHTML = '<div class="empty-state"><p>Failed to load mappings</p></div>';
        }
    }
}

// ===== Update Stats =====
function updateStats() {
    const locationCount = indexMappings.location ? Object.keys(indexMappings.location.mapping).length : 0;
    const messageCount = indexMappings.message ? Object.keys(indexMappings.message.mapping).length : 0;
    const helpCount = indexMappings.help ? Object.keys(indexMappings.help.mapping).length : 0;

    if (totalLocations) totalLocations.textContent = locationCount;
    if (totalMessages) totalMessages.textContent = messageCount;
    if (totalHelps) totalHelps.textContent = helpCount;
}

// ===== Render Mappings =====
function renderMappings() {
    if (!mappingsGrid) return;

    const typeFilter = filterType?.value || '';
    const typesToShow = typeFilter ? [typeFilter] : ['location', 'message', 'help'];

    let html = '';

    typesToShow.forEach(type => {
        const data = indexMappings[type];
        if (!data || !data.mapping) return;

        const entries = Object.entries(data.mapping);

        if (type === 'help') {
            // Special rendering for help mapping (HID -> message codes array)
            html += `
                <div class="index-card help-card">
                    <div class="index-card-header">
                        <div class="index-card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <h3>Help Resource Mapping</h3>
                        </div>
                        <span class="entry-count">${entries.length} resources</span>
                    </div>
                    <div class="index-card-body">
                        ${entries.length === 0 ? '<div class="empty-entries">No mappings defined</div>' : ''}
                        ${entries.map(([hid, msgCodes]) => {
                const help = allHelps.find(h => h.HID == hid);
                const helpName = help ? help.name : `Help #${hid}`;
                const codes = Array.isArray(msgCodes) ? msgCodes : [];

                return `
                                <div class="mapping-item help-mapping-item">
                                    <div class="mapping-item-header">
                                        <span class="help-name">${helpName}</span>
                                        <span class="help-id">HID: ${hid}</span>
                                    </div>
                                    <div class="message-codes">
                                        ${codes.map(code => {
                    const msgText = indexMappings.message?.mapping?.[code] || `Code ${code}`;
                    return `<span class="code-tag" title="${msgText}">${code}</span>`;
                }).join('')}
                                        ${codes.length === 0 ? '<span class="no-codes">No message codes assigned</span>' : ''}
                                    </div>
                                    <div class="mapping-actions">
                                        <button class="action-btn edit" title="Edit" onclick="editEntry('help', '${hid}')">
                                            ${getIcon('edit')}
                                        </button>
                                        <button class="action-btn delete" title="Delete" onclick="openDeleteModal('help', '${hid}')">
                                            ${getIcon('trash')}
                                        </button>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        } else {
            // Standard rendering for location/message mappings
            const icon = type === 'location' ? `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            ` : `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
            `;

            html += `
                <div class="index-card ${type}-card">
                    <div class="index-card-header">
                        <div class="index-card-title">
                            ${icon}
                            <h3>${capitalize(type)} Mapping</h3>
                        </div>
                        <span class="entry-count">${entries.length} entries</span>
                    </div>
                    <div class="index-card-body">
                        ${entries.length === 0 ? '<div class="empty-entries">No mappings defined</div>' : ''}
                        ${entries.map(([code, value]) => `
                            <div class="mapping-item">
                                <span class="mapping-code">${code}</span>
                                <span class="mapping-value">${value}</span>
                                <div class="mapping-actions">
                                    <button class="action-btn edit" title="Edit" onclick="editEntry('${type}', '${code}')">
                                        ${getIcon('edit')}
                                    </button>
                                    <button class="action-btn delete" title="Delete" onclick="openDeleteModal('${type}', '${code}')">
                                        ${getIcon('trash')}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (!html) {
        html = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <h3>No Index Mappings</h3>
                <p>Index mappings define how codes are translated to meaningful text</p>
            </div>
        `;
    }

    mappingsGrid.innerHTML = html;
}

// ===== Helper Functions =====
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Modal Actions =====
let currentEditType = null;
let currentEditCode = null;

function openAddModal() {
    const modalTitle = document.getElementById('entryModalTitle');
    if (modalTitle) modalTitle.textContent = 'Add Entry';

    currentEditType = null;
    currentEditCode = null;

    if (entryForm) entryForm.reset();
    if (entryType) {
        entryType.disabled = false;
        entryType.value = 'location';
    }

    openModal('entryModal');
}

function editEntry(type, code) {
    const modalTitle = document.getElementById('entryModalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Entry';

    currentEditType = type;
    currentEditCode = code;

    if (entryType) {
        entryType.value = type;
        entryType.disabled = true;
    }
    if (entryCode) entryCode.value = code;

    const mapping = indexMappings[type]?.mapping;
    if (mapping && entryValue) {
        const value = mapping[code];
        entryValue.value = Array.isArray(value) ? value.join(', ') : value;
    }

    openModal('entryModal');
}

async function saveEntry() {
    const type = entryType?.value;
    const code = entryCode?.value?.trim();
    const value = entryValue?.value?.trim();

    if (!type || !code || !value) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        // Get current mapping for this type
        const currentData = indexMappings[type];
        if (!currentData) {
            showToast('Invalid type', 'error');
            return;
        }

        // Clone current mapping and update
        const newMapping = { ...currentData.mapping };

        if (type === 'help') {
            // For help, value should be comma-separated message codes
            newMapping[code] = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
        } else {
            newMapping[code] = value;
        }

        // Send update to API
        const response = await apiPut(`Update/index.php`, {
            IID: currentData.IID,
            mapping: newMapping
        });

        if (response.success) {
            showToast('Entry saved successfully', 'success');
            closeModal('entryModal');
            loadData();
        } else {
            showToast(response.message || 'Failed to save', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save entry', 'error');
    }
}

let deleteType = null;
let deleteCode = null;

function openDeleteModal(type, code) {
    deleteType = type;
    deleteCode = code;

    const message = document.getElementById('deleteMessage');
    if (message) {
        const value = indexMappings[type]?.mapping?.[code];
        const displayValue = Array.isArray(value) ? `codes: ${value.join(', ')}` : value;
        message.textContent = `Delete entry "${code}" (${displayValue})?`;
    }

    openModal('deleteModal');
}

async function confirmDelete() {
    if (!deleteType || !deleteCode) return;

    try {
        const currentData = indexMappings[deleteType];
        if (!currentData) return;

        // Clone current mapping and remove entry
        const newMapping = { ...currentData.mapping };
        delete newMapping[deleteCode];

        // Send update to API
        const response = await apiPut(`Update/index.php`, {
            IID: currentData.IID,
            mapping: newMapping
        });

        if (response.success) {
            showToast('Entry deleted successfully', 'success');
            closeModal('deleteModal');
            loadData();
        } else {
            showToast(response.message || 'Failed to delete', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete entry', 'error');
    }
}
