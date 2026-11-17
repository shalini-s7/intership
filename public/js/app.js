/**
 * TaskPulse - Complete Full-Stack CRUD Client
 * Integrates POST, GET (all), GET (one), PUT, and DELETE via modern fetch()
 */

const API_BASE = '/api/tasks';

// DOM Element References
const tasksGrid = document.getElementById('tasksGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const createTaskForm = document.getElementById('createTaskForm');
const submitBtn = document.getElementById('submitBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

// Stats Counters
const statTotal = document.getElementById('statTotal');
const statCompleted = document.getElementById('statCompleted');
const statInProgress = document.getElementById('statInProgress');
const statPending = document.getElementById('statPending');
const dbStatusText = document.getElementById('dbStatusText');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseAction = document.getElementById('modalCloseAction');

// Edit Modal Elements
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTitle = document.getElementById('editTitle');
const editDescription = document.getElementById('editDescription');
const editCategory = document.getElementById('editCategory');
const editPriority = document.getElementById('editPriority');
const editStatus = document.getElementById('editStatus');
const editDueDate = document.getElementById('editDueDate');
const editAssignee = document.getElementById('editAssignee');
const editTitleError = document.getElementById('editTitleError');
const editDescriptionError = document.getElementById('editDescriptionError');
const editSubmitBtn = document.getElementById('editSubmitBtn');
const editModalCloseBtn = document.getElementById('editModalCloseBtn');
const editModalCancelBtn = document.getElementById('editModalCancelBtn');

const toastContainer = document.getElementById('toastContainer');

// Local in-memory task cache
let currentTasks = [];

/* ==========================================================
   INITIALIZATION
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkDatabaseHealth();
  loadTasks();
});

function setupEventListeners() {
  // Mobile Nav Toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Close mobile nav on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Create Task Form Submit (POST)
  if (createTaskForm) {
    createTaskForm.addEventListener('submit', handleCreateFormSubmit);
  }

  // Edit Task Form Submit (PUT)
  if (editTaskForm) {
    editTaskForm.addEventListener('submit', handleEditFormSubmit);
  }

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing tasks from API...', 'info');
      loadTasks();
      checkDatabaseHealth();
    });
  }

  // Filters & Search
  if (searchInput) {
    searchInput.addEventListener('input', applyClientFilters);
  }
  if (filterCategory) {
    filterCategory.addEventListener('change', applyClientFilters);
  }
  if (filterStatus) {
    filterStatus.addEventListener('change', applyClientFilters);
  }

  // Detail Modal Close Handlers
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
  if (modalCloseAction) modalCloseAction.addEventListener('click', closeDetailModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  // Edit Modal Close Handlers
  if (editModalCloseBtn) editModalCloseBtn.addEventListener('click', closeEditModal);
  if (editModalCancelBtn) editModalCancelBtn.addEventListener('click', closeEditModal);
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  // Global Escape Key to Close Open Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (detailModal && detailModal.classList.contains('active')) closeDetailModal();
      if (editModal && editModal.classList.contains('active')) closeEditModal();
    }
  });
}

/* ==========================================================
   HEALTH CHECK: fetch('/api/health')
   ========================================================== */
async function checkDatabaseHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (dbStatusText) {
      if (data.databaseReadyState === 1) {
        dbStatusText.textContent = 'MongoDB Atlas Connected';
      } else {
        dbStatusText.textContent = 'Ready (Memory Store / Connect Atlas in .env)';
      }
    }
  } catch (e) {
    console.warn('Health check unreachable:', e);
  }
}

/* ==========================================================
   1. GET ALL TASKS: fetch('/api/tasks')
   ========================================================== */
async function loadTasks() {
  setLoading(true);
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      currentTasks = result.data;
      updateStats(currentTasks);
      applyClientFilters();
    } else {
      throw new Error(result.message || 'Malformed server response');
    }
  } catch (error) {
    console.error('Error fetching tasks via GET /api/tasks:', error);
    showToast(`Failed to load tasks: ${error.message}`, 'error');
    tasksGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
  } finally {
    setLoading(false);
  }
}

/* ==========================================================
   2. GET ONE TASK BY ID: fetch('/api/tasks/:id')
   ========================================================== */
async function viewTaskDetails(taskId) {
  try {
    showToast(`Fetching task details...`, 'info');

    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      renderModalDetails(result.data);
      openDetailModal();
    }
  } catch (error) {
    console.error(`Error fetching task #${taskId}:`, error);
    showToast(`Could not retrieve task: ${error.message}`, 'error');
  }
}

/* ==========================================================
   3. POST CREATE TASK: fetch('/api/tasks')
   ========================================================== */
async function handleCreateFormSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('taskTitle');
  const descInput = document.getElementById('taskDescription');
  const catInput = document.getElementById('taskCategory');
  const priorityInput = document.getElementById('taskPriority');
  const statusInput = document.getElementById('taskStatus');
  const assigneeInput = document.getElementById('taskAssignee');
  const dueDateInput = document.getElementById('taskDueDate');

  const titleError = document.getElementById('titleError');
  const descError = document.getElementById('descriptionError');

  titleError.textContent = '';
  descError.textContent = '';

  let hasError = false;
  if (!titleInput.value.trim() || titleInput.value.trim().length < 3) {
    titleError.textContent = 'Title must be at least 3 characters long.';
    hasError = true;
  }
  if (!descInput.value.trim() || descInput.value.trim().length < 5) {
    descError.textContent = 'Description must be at least 5 characters long.';
    hasError = true;
  }

  if (hasError) return;

  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    category: catInput.value,
    priority: priorityInput.value,
    status: statusInput.value,
    assignedTo: assigneeInput.value.trim() || 'Shalini S',
    dueDate: dueDateInput.value || undefined
  };

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const detailsMsg = result.details ? result.details.map(d => d.message).join(' ') : result.message;
      throw new Error(detailsMsg || `HTTP ${response.status}`);
    }

    showToast(`Success! "${result.data.title}" created.`, 'success');
    createTaskForm.reset();

    await loadTasks();

    const tasksSection = document.getElementById('tasks-section');
    if (tasksSection) {
      tasksSection.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Error creating task via POST /api/tasks:', error);
    showToast(`Validation / Create error: ${error.message}`, 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

/* ==========================================================
   4. PUT UPDATE TASK: fetch('/api/tasks/:id')
   ========================================================== */
async function openEditModal(taskId) {
  try {
    const response = await fetch(`${API_BASE}/${taskId}`);
    if (!response.ok) throw new Error('Could not load task data for editing');

    const result = await response.json();
    const task = result.data;

    editTaskId.value = task.id || task._id;
    editTitle.value = task.title;
    editDescription.value = task.description;
    editCategory.value = task.category;
    editPriority.value = task.priority;
    editStatus.value = task.status;
    editAssignee.value = task.assignedTo || '';
    editDueDate.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';

    editTitleError.textContent = '';
    editDescriptionError.textContent = '';

    editModal.classList.add('active');
    editModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    showToast(`Edit error: ${error.message}`, 'error');
  }
}

async function handleEditFormSubmit(e) {
  e.preventDefault();

  const taskId = editTaskId.value;
  editTitleError.textContent = '';
  editDescriptionError.textContent = '';

  if (!editTitle.value.trim() || editTitle.value.trim().length < 3) {
    editTitleError.textContent = 'Title must be at least 3 characters long.';
    return;
  }
  if (!editDescription.value.trim() || editDescription.value.trim().length < 5) {
    editDescriptionError.textContent = 'Description must be at least 5 characters long.';
    return;
  }

  const payload = {
    title: editTitle.value.trim(),
    description: editDescription.value.trim(),
    category: editCategory.value,
    priority: editPriority.value,
    status: editStatus.value,
    assignedTo: editAssignee.value.trim(),
    dueDate: editDueDate.value || undefined
  };

  editSubmitBtn.classList.add('loading');
  editSubmitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const detailsMsg = result.details ? result.details.map(d => d.message).join(' ') : result.message;
      throw new Error(detailsMsg || `HTTP ${response.status}`);
    }

    showToast(`Task updated successfully!`, 'success');
    closeEditModal();
    await loadTasks();
  } catch (error) {
    console.error(`Error updating task #${taskId}:`, error);
    showToast(`Update error: ${error.message}`, 'error');
  } finally {
    editSubmitBtn.classList.remove('loading');
    editSubmitBtn.disabled = false;
  }
}

function closeEditModal() {
  editModal.classList.remove('active');
  editModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ==========================================================
   5. DELETE TASK: fetch('/api/tasks/:id')
   ========================================================== */
async function deleteTask(taskId, taskTitle) {
  const confirmed = confirm(`Are you sure you want to permanently delete:\n"${taskTitle}"?`);
  if (!confirmed) return;

  try {
    showToast(`Deleting task...`, 'info');

    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to delete with status ${response.status}`);
    }

    showToast(`Task deleted successfully!`, 'success');
    await loadTasks();
  } catch (error) {
    console.error(`Error deleting task #${taskId}:`, error);
    showToast(`Delete failed: ${error.message}`, 'error');
  }
}

/* ==========================================================
   RENDER & FILTER FUNCTIONS
   ========================================================== */
function applyClientFilters() {
  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const selectedCat = filterCategory ? filterCategory.value : 'All';
  const selectedStatus = filterStatus ? filterStatus.value : 'All';

  const filtered = currentTasks.filter(task => {
    const matchesSearch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm) ||
      (task.assignedTo && task.assignedTo.toLowerCase().includes(searchTerm));

    const matchesCat = selectedCat === 'All' || task.category === selectedCat;
    const matchesStatus = selectedStatus === 'All' || task.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  renderTaskList(filtered);
}

function renderTaskList(tasks) {
  tasksGrid.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tasks.forEach(task => {
    const card = document.createElement('article');
    card.className = 'task-card';

    const safeCategory = escapeHtml(task.category);
    const categoryClass = `category-${safeCategory.replace(/\s+/g, '')}`;
    const safeStatus = escapeHtml(task.status);
    const statusClass = `status-${safeStatus.replace(/\s+/g, '')}`;
    const initials = getInitials(task.assignedTo);
    const taskId = task.id || task._id;

    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-card-meta">
          <span class="category-badge ${categoryClass}">${safeCategory}</span>
          <span class="status-badge ${statusClass}">
            <span class="status-indicator"></span>
            ${safeStatus}
          </span>
        </div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <p class="task-desc">${escapeHtml(task.description)}</p>
      </div>

      <div class="task-card-footer">
        <div class="task-assignee" title="Assigned to ${escapeHtml(task.assignedTo || 'Unassigned')}">
          <span class="avatar-chip">${initials}</span>
          <span>${escapeHtml(task.assignedTo || 'Unassigned')}</span>
        </div>
        <div class="card-actions">
          <button class="btn-sm btn-detail" data-id="${taskId}" title="View Details (GET)">
            Details
          </button>
          <button class="btn-sm btn-edit" data-id="${taskId}" title="Edit Task (PUT)">
            Edit
          </button>
          <button class="btn-sm btn-delete" data-id="${taskId}" title="Delete Task (DELETE)">
            &times;
          </button>
        </div>
      </div>
    `;

    // Event Listeners for CRUD buttons
    card.querySelector('.btn-detail').addEventListener('click', () => viewTaskDetails(taskId));
    card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(taskId));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteTask(taskId, task.title));

    tasksGrid.appendChild(card);
  });
}

function renderModalDetails(task) {
  modalTitle.textContent = task.title;

  const formattedCreated = new Date(task.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const formattedUpdated = task.updatedAt ? new Date(task.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : 'N/A';

  const taskId = task.id || task._id;

  modalBody.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">MongoDB ID</span>
      <span class="detail-val"><code>${taskId}</code></span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Category</span>
      <span class="detail-val">
        <span class="category-badge category-${escapeHtml(task.category).replace(/\s+/g, '')}">
          ${escapeHtml(task.category)}
        </span>
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Status</span>
      <span class="detail-val">
        <span class="status-badge status-${escapeHtml(task.status).replace(/\s+/g, '')}">
          ${escapeHtml(task.status)}
        </span>
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Priority Level</span>
      <span class="detail-val"><strong>${escapeHtml(task.priority)}</strong></span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Assigned To</span>
      <span class="detail-val">${escapeHtml(task.assignedTo || 'Unassigned')}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date</span>
      <span class="detail-val">${task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'None specified'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Created At</span>
      <span class="detail-val">${formattedCreated}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Last Updated</span>
      <span class="detail-val">${formattedUpdated}</span>
    </div>
    <div class="detail-desc-block">
      <strong>Full Task Description:</strong>
      <p style="margin-top: 0.5rem;">${escapeHtml(task.description)}</p>
    </div>
  `;
}

function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;

  if (statTotal) statTotal.textContent = total;
  if (statCompleted) statCompleted.textContent = completed;
  if (statInProgress) statInProgress.textContent = inProgress;
  if (statPending) statPending.textContent = pending;
}

/* ==========================================================
   UI UTILITIES (MODALS, TOASTS, LOADERS)
   ========================================================== */
function openDetailModal() {
  detailModal.classList.add('active');
  detailModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  detailModal.classList.remove('active');
  detailModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function setLoading(isLoading) {
  if (loadingState) {
    if (isLoading) {
      loadingState.classList.remove('hidden');
      emptyState.classList.add('hidden');
    } else {
      loadingState.classList.add('hidden');
    }
  }
}

function showToast(message, type = 'info') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || '🔔'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
