// Get all users
function getUsers(){
  return JSON.parse(localStorage.getItem("users") || "[]");
}

// Save users
function saveUsers(users){
  localStorage.setItem("users", JSON.stringify(users));
}

// LOGIN / REGISTER SYSTEM
function login(){
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();

  if(!email || !pass){
    alert("Enter email and password");
    return;
  }

  let users = getUsers();

  // Check if email exists
  let existingUser = users.find(u => u.email === email);

  if(existingUser){
    // Email exists → check password
    if(existingUser.password === pass){
      localStorage.setItem("user", JSON.stringify(existingUser));
      window.location = "dashboard.html";
    }else{
      alert("❌ Email already used with a different password");
    }
  }else{
    // New user → register
    users.push({email: email, password: pass});
    saveUsers(users);

    localStorage.setItem("user", JSON.stringify({email}));
    alert("✅ Account created!");
    window.location = "dashboard.html";
  }
}
