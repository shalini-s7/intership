/**
 * TaskPulse - Client-Side REST API Integration
 * Demonstrates fetch() usage for GET all, GET one, and POST create
 */

// Base API URL (relative so it works automatically on localhost:3000 or any hosted URL)
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

// Modal Elements
const detailModal = document.getElementById('detailModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCloseAction = document.getElementById('modalCloseAction');
const toastContainer = document.getElementById('toastContainer');

// Local cache of tasks
let currentTasks = [];

/* ==========================================================
   INITIALIZATION
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
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
    createTaskForm.addEventListener('submit', handleFormSubmit);
  }

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing task list from server...', 'info');
      loadTasks();
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

  // Modal Close Handlers
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCloseAction) modalCloseAction.addEventListener('click', closeModal);
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ==========================================================
   1. GET ALL TASKS: fetch('/api/tasks')
   ========================================================== */
async function loadTasks() {
  setLoading(true);
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    showToast(`Fetching task #${taskId} details...`, 'info');

    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Task #${taskId} not found.`);
      }
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      renderModalDetails(result.data);
      openModal();
    } else {
      throw new Error(result.message || 'Task data unavailable');
    }
  } catch (error) {
    console.error(`Error fetching task #${taskId}:`, error);
    showToast(`Could not retrieve task: ${error.message}`, 'error');
  }
}

/* ==========================================================
   3. POST CREATE TASK: fetch('/api/tasks')
   ========================================================== */
async function handleFormSubmit(e) {
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

  // Clear errors
  titleError.textContent = '';
  descError.textContent = '';

  // Validation
  let hasError = false;
  if (!titleInput.value.trim()) {
    titleError.textContent = 'Please enter a task title.';
    hasError = true;
  }
  if (!descInput.value.trim()) {
    descError.textContent = 'Please enter a task description.';
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

  // Submit button loading animation
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
      throw new Error(result.message || `Failed with status ${response.status}`);
    }

    // Success: notify and update UI
    showToast(`Success! "${result.data.title}" created.`, 'success');
    createTaskForm.reset();

    // Reload list to synchronize with backend
    await loadTasks();

    // Scroll to tasks section smoothly
    const tasksSection = document.getElementById('tasks-section');
    if (tasksSection) {
      tasksSection.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Error creating task via POST /api/tasks:', error);
    showToast(`Error creating task: ${error.message}`, 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
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
      task.assignedTo.toLowerCase().includes(searchTerm);

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
        <div class="task-assignee" title="Assigned to ${escapeHtml(task.assignedTo)}">
          <span class="avatar-chip">${initials}</span>
          <span>${escapeHtml(task.assignedTo)}</span>
        </div>
        <button class="btn-detail" data-id="${task.id}" aria-label="View details for ${escapeHtml(task.title)}">
          View Details →
        </button>
      </div>
    `;

    // Hook up "View Details" button to trigger GET /api/tasks/:id
    const detailBtn = card.querySelector('.btn-detail');
    detailBtn.addEventListener('click', () => {
      viewTaskDetails(task.id);
    });

    tasksGrid.appendChild(card);
  });
}

function renderModalDetails(task) {
  modalTitle.textContent = task.title;

  const formattedCreated = new Date(task.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  modalBody.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">Task ID</span>
      <span class="detail-val">#${task.id} (Database Identifier)</span>
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
      <span class="detail-label">Current Status</span>
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
      <span class="detail-val">${escapeHtml(task.assignedTo)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date</span>
      <span class="detail-val">${task.dueDate ? escapeHtml(task.dueDate) : 'No due date'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Created At</span>
      <span class="detail-val">${formattedCreated}</span>
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
   UI UTILITIES (MODAL, TOAST, SPINNER)
   ========================================================== */
function openModal() {
  detailModal.classList.add('active');
  detailModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
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
