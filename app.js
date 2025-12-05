// public/app.js
// Narrekappe front-end helpers & placeholder APIs

(function () {
  if (typeof window === 'undefined') return;

  //
  // LOGIN SYSTEM (front-end mock until real backend exists)
  //

  function handleLogin(role) {
    const user =
      document.querySelector('#username')?.value ||
      document.querySelector('#studentid')?.value;
    const pass = document.querySelector('#password')?.value;

    if (!user || !pass) {
      alert('Please fill in all fields.');
      return false;
    }

    // Admin login
    if (role === 'admin') {
      if (user === 'admin' && pass === 'admin123') {
        window.location.href = '/admin-dashboard';
      } else {
        alert('Invalid admin credentials');
      }
      return false;
    }

    // Student login
    if (role === 'student') {
      if (pass.length >= 4) {
        window.location.href = '/student-dashboard';
      } else {
        alert('Invalid student credentials');
      }
      return false;
    }
  }

  // Expose if you ever use onclick="handleLogin('admin')" in markup
  window.handleLogin = handleLogin;

  //
  // PROXMOX API PLACEHOLDERS
  // (these hit Next.js API routes under /api/proxmox/...)
  //

  // Get list of VMs (from S3/Proxmox helper)
  async function api_getProxmoxVMs() {
    return fetch('/api/proxmox/vms')
      .then((res) => res.json())
      .catch((err) => console.error('Proxmox VM fetch failed:', err));
  }

  // Start VM
  async function api_startProxmoxVM(vmid) {
    return fetch(`/api/proxmox/vm/${vmid}/start`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .catch((err) => console.error('Proxmox start failed:', err));
  }

  // Stop VM
  async function api_stopProxmoxVM(vmid) {
    return fetch(`/api/proxmox/vm/${vmid}/stop`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .catch((err) => console.error('Proxmox stop failed:', err));
  }

  //
  // VMWARE API PLACEHOLDERS
  //

  async function api_getVMwareVMs() {
    return fetch('/api/vmware/vms')
      .then((res) => res.json())
      .catch((err) => console.error('VMware VM list failed:', err));
  }

  async function api_powerOnVMwareVM(vmid) {
    return fetch(`/api/vmware/vm/${vmid}/poweron`, { method: 'POST' })
      .then((res) => res.json())
      .catch((err) => console.error('VMware power on failed:', err));
  }

  async function api_powerOffVMwareVM(vmid) {
    return fetch(`/api/vmware/vm/${vmid}/poweroff`, { method: 'POST' })
      .then((res) => res.json())
      .catch((err) => console.error('VMware power off failed:', err));
  }

  //
  // VulnHub import placeholder (kept as-is for when you implement it)
  //

  async function api_downloadVulnHubMachine(url) {
    return fetch('/api/vulnhub/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ download_url: url }),
    })
      .then((res) => res.json())
      .catch((err) => console.error('VulnHub import failed:', err));
  }

  //
  // Helper: build a VM card block
  //

  function createVMCard(vm) {
    return `
      <div class="card">
        <h3>${vm.name}</h3>
        <p>Status: ${vm.status || 'unknown'}</p>
        <button onclick="window.api_startProxmoxVM('${vm.id || vm.vmid}')" class="btn">Start</button>
        <button onclick="window.api_stopProxmoxVM('${vm.id || vm.vmid}')" class="btn btn-danger">Stop</button>
      </div>
    `;
  }

  //
  // Admin login form using localStorage "users"
  //

  function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      const users = JSON.parse(localStorage.getItem('users')) || [];

      const found = users.find(
        (u) => u.username === username && u.password === password
      );

      if (!found) {
        alert('Incorrect username or password.');
        return;
      }

      localStorage.setItem('loggedIn', 'yes');
      localStorage.setItem('currentRole', found.role);

      window.location.href = '/admin-dashboard';
    });
  }

  //
  // Load Proxmox VMs into admin dashboard container
  //

  async function loadProxmoxVMsIntoDashboard() {
    const container = document.querySelector('#vm-container');
    if (!container) return;

    const data = await api_getProxmoxVMs();
    const vms = data.vms || data.deployments || [];

    container.innerHTML = vms.map((vm) => createVMCard(vm)).join('');
  }

  //
  // LocalStorage user management
  //

  function ensureDefaultUsers() {
    if (!localStorage.getItem('users')) {
      const defaultUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' },
      ];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  }

  function addUser(username, password, role = 'user') {
    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.some((u) => u.username === username)) {
      alert('User already exists!');
      return;
    }

    users.push({ username, password, role });
    localStorage.setItem('users', JSON.stringify(users));

    alert('User created successfully!');
  }

  // export some helpers for inline onclick/onload, if you ever need them
  window.api_getProxmoxVMs = api_getProxmoxVMs;
  window.api_startProxmoxVM = api_startProxmoxVM;
  window.api_stopProxmoxVM = api_stopProxmoxVM;
  window.loadProxmoxVMsIntoDashboard = loadProxmoxVMsIntoDashboard;
  window.addUser = addUser;
  window.api_downloadVulnHubMachine = api_downloadVulnHubMachine;

  // Init once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    ensureDefaultUsers();
    initLoginForm();
    loadProxmoxVMsIntoDashboard();
    console.log('app.js loaded successfully (Next.js compatible)');
  });
})();
