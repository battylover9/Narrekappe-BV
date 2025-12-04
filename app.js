
//LOGIN SYSTEM (Front-end mock until backend exists)

function handleLogin(role) {
    const user = document.querySelector('#username')?.value || document.querySelector('#studentid')?.value;
    const pass = document.querySelector('#password')?.value;

    if (!user || !pass) {
        alert("Please fill in all fields.");
        return false;
    }
    // Admin login
    if (role === "admin") {
        if (user === "admin" && pass === "admin123") {
            window.location.href = "admin-dashboard.html";
        } else {
            alert("Invalid admin credentials");
        }
        return false;
    }

    // Student login
    if (role === "student") {
        if (pass.length >= 4) {
            window.location.href = "student-dashboard.html";
        } else {
            alert("Invalid student credentials");
        }
        return false;
    }
}



//
// PROXMOX API PLACEHOLDERS
// 
// NOTE: These do NOT work yet.
// When you build a backend, you will replace the fetch()
// endpoints (`/api/...`) with your server logic.

// Get list of VMs
async function api_getProxmoxVMs() {
    return fetch('/api/proxmox/vms')
        .then(res => res.json())
        .catch(err => console.error('Proxmox VM fetch failed:', err));
}

// Start VM
async function api_startProxmoxVM(vmid) {
    return fetch(`/api/proxmox/vm/${vmid}/start`, { method: 'POST' })
        .then(res => res.json())
        .catch(err => console.error('Proxmox start failed:', err));
}

// Stop VM
async function api_stopProxmoxVM(vmid) {
    return fetch(`/api/proxmox/vm/${vmid}/stop`, { method: 'POST' })
        .then(res => res.json())
        .catch(err => console.error('Proxmox stop failed:', err));
}



//
// 3. VMWARE API PLACEHOLDERS

// Get list of VMware VMs
async function api_getVMwareVMs() {
    return fetch('/api/vmware/vms')
        .then(res => res.json())
        .catch(err => console.error('VMware VM list failed:', err));
}

// Power on VMware VM
async function api_powerOnVMwareVM(vmid) {
    return fetch(`/api/vmware/vm/${vmid}/poweron`, { method: 'POST' })
        .then(res => res.json())
        .catch(err => console.error('VMware power on failed:', err));
}

// Power off VMware VM
async function api_powerOffVMwareVM(vmid) {
    return fetch(`/api/vmware/vm/${vmid}/poweroff`, { method: 'POST' })
        .then(res => res.json())
        .catch(err => console.error('VMware power off failed:', err));
}




async function api_downloadVulnHubMachine(url) {
    return fetch('/api/vulnhub/import', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ download_url: url })
    })
    .then(res => res.json())
    .catch(err => console.error("VulnHub import failed:", err));
}

//  OPTIONAL HELPER FUNCTIONS
// These are ready to connect to UI buttons later.

//  VM card dynamically
function createVMCard(vm) {
    return `
        <div class="card">
            <h3>${vm.name}</h3>
            <p>Status: ${vm.status}</p>
            <button onclick="api_startProxmoxVM(${vm.id})" class="btn">Start</button>
            <button onclick="api_stopProxmoxVM(${vm.id})" class="btn btn-danger">Stop</button>
        </div>
    `;
}

// document.getElementById("loginForm").addEventListener("submit", function (e) {
//     e.preventDefault(); // stop form from submitting normally

//     const username = document.getElementById("username").value.trim();
//     const password = document.getElementById("password").value.trim();

//     // Prevent empty fields
//     if (username === "" || password === "") {
//         alert("Please enter username and password.");
//         return;
//     }

//     // insert names for users here
//     const allowedUsers = [
//         { user: "admin", pass: "12345"},
//         { user: "teacher", pass: "teach2025" }
//     ];

//     // Check if match exists
//     const valid = allowedUsers.some(u => u.user === username && u.pass === password);

//     if (valid) {
//         // Redirect to dashboard
//         window.location.href = "admin-dashboard.html";
//     } else {
//         alert("Incorrect username or password.");
//     }
// });


document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const found = users.find(u => u.username === username && u.password === password);

    if (!found) {
        alert("Incorrect username or password.");
        return;
    }

    localStorage.setItem("loggedIn", "yes");
    localStorage.setItem("currentRole", found.role);

    window.location.href = "admin-dashboard.html";
});


if (valid) {
    // Save login status in local storage of browser
    localStorage.setItem("loggedIn", "yes");

    // Redirect to dashboard
    window.location.href = "admin-dashboard.html";
} else {
    alert("Incorrect username or password.");
}


// Insert cards into admin dashboard
async function loadProxmoxVMsIntoDashboard() {
    const container = document.querySelector('#vm-container');
    if (!container) return;

    const vms = await api_getProxmoxVMs();

    container.innerHTML = vms.map(vm => createVMCard(vm)).join('');
}

// add users 

if (!localStorage.getItem("users")) {
    const defaultUsers = [
        { username: "admin", password: "admin123", role: "admin" }
    ];
    localStorage.setItem("users", JSON.stringify(defaultUsers));
}

function addUser(username, password, role = "user") {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Prevent duplicates
    if (users.some(u => u.username === username)) {
        alert("User already exists!");
        return;
    }

    users.push({ username, password, role });
    localStorage.setItem("users", JSON.stringify(users));

    alert("User created successfully!");
}


console.log("app.js loaded successfully");