function login(){
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  if(email && pass){
    localStorage.setItem("user", JSON.stringify({email}));
    window.location = "dashboard.html";
  }else{
    alert("Enter email and password");
  }
}