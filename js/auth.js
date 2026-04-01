/* SUPABASE CONFIG */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* LOGIN */
async function login(){

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if(!email || !password){
    alert("Enter email and password");
    return;
  }

  let { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error){
    alert(error.message);
    return;
  }

  // 🔥 GET SESSION (important)
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if(sessionData.session){
    localStorage.setItem("user", email);
    window.location.href = "dashboard.html";
  }else{
    alert("Login failed, try again");
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

  let { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if(error){
    alert(error.message);
  }else{
    alert("Account created! Now login.");
  }
}
window.onload = async function(){

  const { data } = await supabaseClient.auth.getSession();

  if(data.session){
    window.location.href = "dashboard.html";
  }
};
