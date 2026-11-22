// UW Student Portal - Fixed version for Lab 06. All data is fake.

// [FIX V-01: Hardcoded Secrets]
// Real-world: Secrets are never in client code. They live in server-side .env files.
// The frontend should call a backend API to perform privileged actions.
// Reference: OWASP Secrets Management Cheat Sheet

const USERS = [
  // [FIX V-02: Plaintext Passwords]
  // Real-world: Passwords are hashed with Argon2id on the server and never returned to the client.
  // For this static lab, we remove the password field from the public array entirely
  // and use a separate mock auth function (below) that simulates a backend check.
  // Reference: OWASP Password Storage Cheat Sheet (Argon2id recommended)
  { id: 1001, name: "Ayesha Khan",    email: "ayesha@uw.test", role: "student", cnic: "35202-1234567-1" },
  { id: 1002, name: "Bilal Ahmed",    email: "bilal@uw.test",  role: "student", cnic: "35202-7654321-9" },
  { id: 2001, name: "Dr. Sana Malik", email: "sana@uw.test",   role: "teacher", cnic: "35202-1111111-2" },
  { id: 9001, name: "Admin",          email: "admin@uw.test",  role: "admin", cnic: "35202-9999999-3" }
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
  // Real-world: Session tokens go in HttpOnly cookies, not any JS-accessible storage.
  // For this static demo, we use sessionStorage (clears on tab close) and store only the user ID.
  // Reference: OWASP Session Management Cheat Sheet
  const s = sessionStorage.getItem("session");
  return s ? JSON.parse(s) : null;
}

// [FIX V-02: Plaintext Passwords - Real Implementation]
// This simulates a backend API call. The password is never stored in the USERS array.
// In production, this function would POST to /api/login and the server would verify
// the Argon2id hash stored in the database.
function verifyLogin(email, inputPass) {
  // Mock database - in reality this is server-side and hashed
  const mockSecureDB = {
    "ayesha@uw.test": "ayesha123",
    "bilal@uw.test": "bilal123",
    "sana@uw.test": "teacher123",
    "admin@uw.test": "Admin@123"
  };
  // Simulating server-side comparison
  const isValid = mockSecureDB[email] === inputPass;
  return isValid ? USERS.find(u => u.email === email) : null;
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("email").value;
  const pw = $("password").value;
  
  // Use the mock auth function instead of direct array comparison
  const u = verifyLogin(email, pw);
  
  if (!u) {
    // [FIX V-04: DOM XSS in Login Error]
    // Real-world: Use textContent, never innerHTML with user input.
    // Reference: OWASP DOM XSS Prevention Cheat Sheet
    $("loginMsg").textContent = "Login failed for " + email;
    return;
  }
  
  // [FIX V-06: Insecure Session Management]
  // Removed role and cnic. The server should determine privileges, not the client.
  // Using sessionStorage (clears on close) instead of localStorage (persists).
  sessionStorage.setItem("session", JSON.stringify({ id: u.id, name: u.name }));
  
  // [FIX Open Redirect]
  // Real-world: Allow-list. Only permit known relative paths.
  // Reference: OWASP Unvalidated Redirects and Forwards Cheat Sheet
  const next = params.get("next");
  if (next === "index.html") { window.location.replace("index.html"); return; }
  
  render();
});

$("resultForm").addEventListener("submit", (e) => { e.preventDefault(); showResult($("rid").value); });

function showResult(id) {
  // [FIX V-05: IDOR / Broken Access Control]
  // Real-world: Server-side authorization check before returning any data.
  // The server must verify the session user owns this record.
  // Reference: OWASP Authorization Cheat Sheet / IDOR Prevention
  const s = getSession();
  if (s && String(s.id) !== String(id)) {
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
  // Real-world: textContent for text output. If markup is required, use DOMPurify.
  // Reference: OWASP DOM XSS Prevention Cheat Sheet / Safeguard innerHTML vs textContent
  $("searchOut").textContent = hits.length ? hits.join(" | ") : "No courses match: " + q;
});

$("logout").addEventListener("click", () => { 
  sessionStorage.removeItem("session"); 
  render(); 
});

function render() {
  const s = getSession();
  $("loginBox").classList.toggle("hidden", !!s);
  $("dash").classList.toggle("hidden", !s);
  if (!s) return;
  
  // [FIX V-03: DOM XSS in Welcome Message]
  $("welcome").textContent = "Welcome, " + (params.get("name") || s.name);
  
  if (params.get("id")) showResult(params.get("id"));
  
  // [FIX V-06: Privilege Escalation]
  // Real-world: Admin panel visibility should be determined by a server response,
  // not by parsing client-side storage. Since we removed role from the session,
  // the admin panel cannot be rendered based on client data.
  // In production, the server would return an "isAdmin" flag after verifying the session cookie.
  // Reference: OWASP Session Management Cheat Sheet
}
render();