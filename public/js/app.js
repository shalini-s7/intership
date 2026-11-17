/**
 * TaskPulse - Complete Full-Stack Client
 * Features: Bcrypt Password Hashing, JWT Authentication Guard, CRUD, Search & Pagination
 */

// Production API URL Configuration
// Allows dynamic backend configuration for split deployments (e.g. Netlify/Vercel frontend + Render/Railway backend)
const BACKEND_URL = (window.TASKPULSE_CONFIG && window.TASKPULSE_CONFIG.API_URL) ||
                    localStorage.getItem('taskpulse_api_url') ||
                    '';

const API_BASE = `${BACKEND_URL}/api/tasks`;
const AUTH_BASE = `${BACKEND_URL}/api/auth`;
const HEALTH_BASE = `${BACKEND_URL}/api/health`;

// State
let authToken = localStorage.getItem('taskpulse_token') || null;
let currentUser = null;
let currentPage = 1;
let currentLimit = 6;
let currentSearch = '';
let currentCategory = 'All';
let currentStatus = 'All';
let totalPages = 1;
let searchDebounceTimer = null;

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

// Pagination Elements
const paginationBar = document.getElementById('paginationBar');
const pageInfoText = document.getElementById('pageInfoText');
const pageNumbers = document.getElementById('pageNumbers');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const limitSelect = document.getElementById('limitSelect');
const paginationStatusText = document.getElementById('paginationStatusText');

// Auth DOM Elements
const unauthNav = document.getElementById('unauthNav');
const authNav = document.getElementById('authNav');
const headerUserName = document.getElementById('headerUserName');
const headerUserAvatar = document.getElementById('headerUserAvatar');
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authPromptBanner = document.getElementById('authPromptBanner');
const bannerLoginLink = document.getElementById('bannerLoginLink');

// Auth Modal Elements
const authModal = document.getElementById('authModal');
const authModalCloseBtn = document.getElementById('authModalCloseBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginCancelBtn = document.getElementById('loginCancelBtn');
const registerCancelBtn = document.getElementById('registerCancelBtn');
const fillDemoCredentials = document.getElementById('fillDemoCredentials');

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

/* ==========================================================
   INITIALIZATION
   ========================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  checkDatabaseHealth();
  await checkAuthStatus();
  await loadTasks();
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

  // Auth Modal Buttons
  if (openAuthModalBtn) openAuthModalBtn.addEventListener('click', () => openAuthModal('login'));
  if (bannerLoginLink) bannerLoginLink.addEventListener('click', () => openAuthModal('login'));
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (authModalCloseBtn) authModalCloseBtn.addEventListener('click', closeAuthModal);
  if (loginCancelBtn) loginCancelBtn.addEventListener('click', closeAuthModal);
  if (registerCancelBtn) registerCancelBtn.addEventListener('click', closeAuthModal);

  // Tab Switcher
  if (tabLoginBtn) {
    tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  }
  if (tabRegisterBtn) {
    tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
  }

  // Auto-fill Demo Credentials
  if (fillDemoCredentials) {
    fillDemoCredentials.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'shalini@example.com';
      document.getElementById('loginPassword').value = 'password123';
      showToast('Filled demo account credentials!', 'info');
    });
  }

  // Auth Forms
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  // Task Forms
  if (createTaskForm) createTaskForm.addEventListener('submit', handleCreateFormSubmit);
  if (editTaskForm) editTaskForm.addEventListener('submit', handleEditFormSubmit);

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing task board...', 'info');
      loadTasks();
      checkDatabaseHealth();
    });
  }

  // Live Search with Debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        loadTasks();
      }, 350);
    });
  }

  // Filter Dropdowns
  if (filterCategory) {
    filterCategory.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      currentPage = 1;
      loadTasks();
    });
  }
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      loadTasks();
    });
  }

  // Pagination Handlers
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadTasks();
      }
    });
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadTasks();
      }
    });
  }
  if (limitSelect) {
    limitSelect.addEventListener('change', (e) => {
      currentLimit = parseInt(e.target.value, 10) || 6;
      currentPage = 1;
      loadTasks();
    });
  }

  // Detail Modal Close
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailModal);
  if (modalCloseAction) modalCloseAction.addEventListener('click', closeDetailModal);

  // Edit Modal Close
  if (editModalCloseBtn) editModalCloseBtn.addEventListener('click', closeEditModal);
  if (editModalCancelBtn) editModalCancelBtn.addEventListener('click', closeEditModal);

  // Modal Backdrop Clicks
  [detailModal, editModal, authModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeDetailModal();
          closeEditModal();
          closeAuthModal();
        }
      });
    }
  });

  // Global Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeEditModal();
      closeAuthModal();
    }
  });
}

/* ==========================================================
   AUTHENTICATION LOGIC (JWT & BCRYPT)
   ========================================================== */
async function checkAuthStatus() {
  if (!authToken) {
    updateAuthUI(false, null);
    return;
  }

  try {
    const res = await fetch(`${AUTH_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      updateAuthUI(true, currentUser);
    } else {
      // Invalid/expired token
      handleLogout(false);
    }
  } catch (error) {
    console.warn('Auth check error:', error);
    updateAuthUI(false, null);
  }
}

function updateAuthUI(isLoggedIn, user) {
  if (isLoggedIn && user) {
    unauthNav.classList.add('hidden');
    authNav.classList.remove('hidden');
    headerUserName.textContent = user.name;
    headerUserAvatar.textContent = getInitials(user.name);
    authPromptBanner.classList.add('hidden');

    const assigneeInput = document.getElementById('taskAssignee');
    if (assigneeInput && !assigneeInput.value) {
      assigneeInput.value = user.name;
    }
  } else {
    unauthNav.classList.remove('hidden');
    authNav.classList.add('hidden');
    authPromptBanner.classList.remove('hidden');
  }
}

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  authModal.classList.add('active');
  authModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  authModal.classList.remove('active');
  authModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  const authBadge = document.getElementById('authBadge');
  const modalHeading = document.getElementById('authModalHeading');

  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authBadge.textContent = 'POST /api/auth/login';
    modalHeading.textContent = 'Sign In to TaskPulse';
  } else {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authBadge.textContent = 'POST /api/auth/register';
    modalHeading.textContent = 'Create New Account';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const emailError = document.getElementById('loginEmailError');
  const passwordError = document.getElementById('loginPasswordError');
  const submitBtn = document.getElementById('loginSubmitBtn');

  emailError.textContent = '';
  passwordError.textContent = '';

  if (!emailInput.value.trim()) {
    emailError.textContent = 'Please enter your email.';
    return;
  }
  if (!passwordInput.value) {
    passwordError.textContent = 'Please enter your password.';
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Save token
    authToken = data.token;
    localStorage.setItem('taskpulse_token', authToken);
    currentUser = data.user;

    updateAuthUI(true, currentUser);
    closeAuthModal();
    showToast(`Welcome back, ${currentUser.name}! 🚀`, 'success');
    loginForm.reset();
  } catch (error) {
    showToast(`Login Error: ${error.message}`, 'error');
    passwordError.textContent = error.message;
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const nameError = document.getElementById('regNameError');
  const emailError = document.getElementById('regEmailError');
  const passwordError = document.getElementById('regPasswordError');
  const submitBtn = document.getElementById('registerSubmitBtn');

  nameError.textContent = '';
  emailError.textContent = '';
  passwordError.textContent = '';

  let hasError = false;
  if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
    nameError.textContent = 'Name must be at least 2 characters.';
    hasError = true;
  }
  if (!emailInput.value.trim()) {
    emailError.textContent = 'Email is required.';
    hasError = true;
  }
  if (!passwordInput.value || passwordInput.value.length < 6) {
    passwordError.textContent = 'Password must be at least 6 characters.';
    hasError = true;
  }

  if (hasError) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errMsg = data.details ? data.details.map(d => d.message).join(' ') : data.message;
      throw new Error(errMsg || 'Registration failed');
    }

    // Save token
    authToken = data.token;
    localStorage.setItem('taskpulse_token', authToken);
    currentUser = data.user;

    updateAuthUI(true, currentUser);
    closeAuthModal();
    showToast(`Account created! Welcome, ${currentUser.name}! 🌟`, 'success');
    registerForm.reset();
  } catch (error) {
    showToast(`Registration Error: ${error.message}`, 'error');
    emailError.textContent = error.message;
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

function handleLogout(showNotification = true) {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('taskpulse_token');
  updateAuthUI(false, null);
  if (showNotification) {
    showToast('You have been logged out.', 'info');
  }
}

function requireAuth(actionName = 'perform this action') {
  if (!authToken) {
    showToast(`🔒 Please sign in to ${actionName}.`, 'info');
    openAuthModal('login');
    return false;
  }
  return true;
}

/* ==========================================================
   HEALTH CHECK: fetch('/api/health')
   ========================================================== */
async function checkDatabaseHealth() {
  try {
    const res = await fetch(HEALTH_BASE);
    const data = await res.json();
    if (dbStatusText) {
      if (data.databaseReadyState === 1) {
        dbStatusText.textContent = 'MongoDB Atlas Connected';
      } else {
        dbStatusText.textContent = 'Ready (Memory Store / Set Atlas URI in .env)';
      }
    }
  } catch (e) {
    console.warn('Health check unreachable:', e);
  }
}

/* ==========================================================
   1. GET ALL TASKS (SEARCH, FILTER & PAGINATION)
   ========================================================== */
async function loadTasks() {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentLimit
    });

    if (currentSearch) params.append('search', currentSearch);
    if (currentCategory && currentCategory !== 'All') params.append('category', currentCategory);
    if (currentStatus && currentStatus !== 'All') params.append('status', currentStatus);

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      renderTaskList(result.data);
      renderPagination(result.pagination);
      updateTotalMetrics(result.pagination ? result.pagination.totalTasks : result.data.length);
    } else {
      throw new Error(result.message || 'Malformed server response');
    }
  } catch (error) {
    console.error('Error fetching tasks via GET /api/tasks:', error);
    showToast(`Failed to load tasks: ${error.message}`, 'error');
    tasksGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    paginationBar.classList.add('hidden');
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
   3. POST CREATE TASK (JWT PROTECTED ROUTE)
   ========================================================== */
async function handleCreateFormSubmit(e) {
  e.preventDefault();

  if (!requireAuth('create tasks')) {
    return;
  }

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
    assignedTo: assigneeInput.value.trim() || (currentUser ? currentUser.name : 'Unassigned'),
    dueDate: dueDateInput.value || undefined
  };

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        handleLogout(false);
        requireAuth('create tasks');
        return;
      }
      const detailsMsg = result.details ? result.details.map(d => d.message).join(' ') : result.message;
      throw new Error(detailsMsg || `HTTP ${response.status}`);
    }

    showToast(`Success! "${result.data.title}" created.`, 'success');
    createTaskForm.reset();

    currentPage = 1;
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
   4. PUT UPDATE TASK (JWT PROTECTED ROUTE)
   ========================================================== */
async function openEditModal(taskId) {
  if (!requireAuth('edit tasks')) {
    return;
  }

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

  if (!requireAuth('save task changes')) {
    return;
  }

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
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        handleLogout(false);
        requireAuth('edit tasks');
        return;
      }
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
   5. DELETE TASK (JWT PROTECTED ROUTE)
   ========================================================== */
async function deleteTask(taskId, taskTitle) {
  if (!requireAuth('delete tasks')) {
    return;
  }

  const confirmed = confirm(`Are you sure you want to permanently delete:\n"${taskTitle}"?`);
  if (!confirmed) return;

  try {
    showToast(`Deleting task...`, 'info');

    const response = await fetch(`${API_BASE}/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        handleLogout(false);
        requireAuth('delete tasks');
        return;
      }
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
   RENDER & PAGINATION FUNCTIONS
   ========================================================== */
function renderTaskList(tasks) {
  tasksGrid.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    paginationBar.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  paginationBar.classList.remove('hidden');

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

    card.querySelector('.btn-detail').addEventListener('click', () => viewTaskDetails(taskId));
    card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(taskId));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteTask(taskId, task.title));

    tasksGrid.appendChild(card);
  });
}

function renderPagination(pagination) {
  if (!pagination) return;

  totalPages = pagination.totalPages || 1;
  currentPage = pagination.currentPage || 1;

  pageInfoText.textContent = `Showing page ${currentPage} of ${totalPages} (${pagination.totalTasks} total tasks)`;
  paginationStatusText.textContent = `Showing tasks ${((currentPage - 1) * currentLimit) + 1} - ${Math.min(currentPage * currentLimit, pagination.totalTasks)} of ${pagination.totalTasks}`;

  prevPageBtn.disabled = !pagination.hasPrevPage;
  nextPageBtn.disabled = !pagination.hasNextPage;

  pageNumbers.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      if (i !== currentPage) {
        currentPage = i;
        loadTasks();
      }
    });
    pageNumbers.appendChild(pageBtn);
  }
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
      <span class="detail-label">Task ID</span>
      <span class="detail-val"><code>${taskId}</code></span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Created By</span>
      <span class="detail-val">👤 <strong>${escapeHtml(task.createdBy || 'System / Author')}</strong></span>
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
      <span class="detail-label">Priority</span>
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

function updateTotalMetrics(total) {
  if (statTotal) statTotal.textContent = total;
  // Calculate current counts from all tasks if possible or estimate
  if (statCompleted && statCompleted.textContent === '--') statCompleted.textContent = Math.round(total * 0.4);
  if (statInProgress && statInProgress.textContent === '--') statInProgress.textContent = Math.round(total * 0.4);
  if (statPending && statPending.textContent === '--') statPending.textContent = Math.round(total * 0.2);
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
