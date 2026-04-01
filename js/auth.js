const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_KEY = "YOUR_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* LOGIN */
async function login(){

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if(!email || !password){
    alert("Enter email and password");
    return;
  }

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert(error.message);
  }else{
    localStorage.setItem("user", email); // keep for now
    window.location = "dashboard.html";
  }
}

/* SIGNUP */
async function signup(){

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if(!email || !password){
    alert("Enter email and password");
    return;
  }

  let { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if(error){
    alert(error.message);
  }else{
    alert("Account created! Now login.");
  }
}
