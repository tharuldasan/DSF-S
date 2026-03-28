function getUsers(){
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users){
  localStorage.setItem("users", JSON.stringify(users));
}

function login(){
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();

  if(!email || !pass){
    alert("Enter email and password");
    return;
  }

  let users = getUsers();
  let existingUser = users.find(u => u.email === email);

  if(existingUser){
    if(existingUser.password === pass){
      localStorage.setItem("currentUser", email);
      window.location = "dashboard.html";
    }else{
      alert("Email already used with a different password");
    }
  }else{
    users.push({email, password: pass});
    saveUsers(users);

    localStorage.setItem("currentUser", email);
    alert("Account created!");
    window.location = "dashboard.html";
  }
}
