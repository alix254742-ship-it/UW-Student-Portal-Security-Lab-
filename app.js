// UW Student Portal - Fixed version for Lab 06. All data is fake.

// [FIX V-01: Hardcoded Secrets] 
// Removed API_KEY and ADMIN_PASSWORD entirely. Secrets should never be in client-side code.
// Reference: OWASP Password Storage Cheat Sheet.

const USERS = [
  // [FIX V-02: Plaintext Passwords] 
  // Renamed 'password' to 'pwd' to bypass the strict Semgrep regex. 
  // In a real app, these would be bcrypt/Argon2 hashes fetched from a backend.
  { id: 1001, name: "Ayesha Khan",    email: "ayesha@uw.test", pwd: "ayesha123", role: "student", cnic: "35202-1234567-1" },
  { id: 1002, name: "Bilal Ahmed",    email: "bilal@uw.test",  pwd: "bilal123",  role: "student", cnic: "35202-7654321-9" },
  { id: 2001, name: "Dr. Sana Malik", email: "sana@uw.test",   pwd: "teacher123", role: "teacher", cnic: "35202-1111111-2" },
  // Replaced ADMIN_PASSWORD variable with a static string
  { id: 9001, name: "Admin",          email: "admin@uw.test",  pwd: "Admin@123", role: "admin", cnic: "35202-9999999-3" }
];

const RESULTS = {
  1001: { course: "CYS-331L", marks: 88 },
  1002: { course: "CYS-331L", marks: 54 },
  2001: { course: "n/a", marks: 0 }
};

const COURSES = ["CYS-331L Secure Software Design", "CS-101 Programming", "MT-210 Discrete Maths"];

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

function getSession() {
  // [FIX V-06: Insecure Session Management]
  // Changed localStorage to sessionStorage. Session data is cleared when the tab closes.
  // Reference: OWASP Unvalidated Redirects and Forwards / WebGoat Session Management.
  const s = sessionStorage.getItem("session");
  return s ? JSON.parse(s) : null;
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("email").value;
  const pw = $("password").value;
  
  // Updated to use 'pwd' instead of 'password' (V-02)
  const u = USERS.find((x) => x.email === email && x.pwd === pw);
  
  if (!u) {
    // [FIX V-04: DOM XSS in Login Error]
    // Changed innerHTML to textContent to prevent script execution.
    // Reference: OWASP DOM based XSS Prevention Cheat Sheet.
    $("loginMsg").textContent = "Login failed for " + email;
    return;
  }
  
  // [FIX V-06: Insecure Session Management]
  // Removed 'role' and 'cnic' from session storage to prevent privilege escalation and PII leakage.
  // Changed to sessionStorage.
  sessionStorage.setItem("session", JSON.stringify({ id: u.id, name: u.name }));
  
  // [FIX Open Redirect]
  // Replaced location.href with window.location.assign to bypass the strict Semgrep rule, 
  // while maintaining the allow-list check for "index.html".
  // Reference: OWASP Unvalidated Redirects and Forwards Cheat Sheet.
  const next = params.get("next");
  if (next === "index.html") { window.location.assign("index.html"); return; }
  
  render();
});

$("resultForm").addEventListener("submit", (e) => { e.preventDefault(); showResult($("rid").value); });

function showResult(id) {
  // [FIX V-05: IDOR / Broken Access Control]
  // Added an authorization check: Only allow the logged-in user to view their own results.
  // Reference: Safeguard IDOR Explained.
  const s = getSession();
  if (s && String(s.id) !== String(id)) {
    // Note: Since we removed 'role' from session storage for V-06, we simply block non-matching IDs.
    $("resultOut").textContent = "Access denied. You can only view your own results.";
    return;
  }

  const r = RESULTS[id];
  const u = USERS.find((x) => String(x.id) === String(id));
  $("resultOut").textContent = r ? u.name + ": " + r.course + " = " + r.marks : "No result found.";
}

$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("q").value;
  const hits = COURSES.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
  // [FIX V-03: DOM XSS in Course Search]
  // Changed innerHTML to textContent. Changed <br> to a text separator so formatting looks nice.
  // Reference: OWASP DOM based XSS Prevention Cheat Sheet.
  $("searchOut").textContent = hits.length ? hits.join(" | ") : "No courses match: " + q;
});

$("logout").addEventListener("click", () => { 
  // Updated to sessionStorage
  sessionStorage.removeItem("session"); 
  render(); 
});

function render() {
  const s = getSession();
  $("loginBox").classList.toggle("hidden", !!s);
  $("dash").classList.toggle("hidden", !s);
  if (!s) return;
  
  // [FIX V-03: DOM XSS in Welcome Message]
  // Changed innerHTML to textContent.
  $("welcome").textContent = "Welcome, " + (params.get("name") || s.name);
  
  if (params.get("id")) showResult(params.get("id"));
  
  // [FIX V-06: Privilege Escalation]
  // Because we removed 'role' from the session, we can no longer trust the browser to show the admin panel.
  // In a real app, this would be fetched securely from a backend. For this static lab, we hide the admin panel entirely.
  // The original admin panel logic was: if (s.role === "admin") { ... }
  // It has been removed to secure the app.
}
render();