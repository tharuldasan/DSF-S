/* =========================
   SUPABASE CONFIG
========================= */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   CREATE FILE
========================= */
function createNew(){
  document.getElementById("createModal").style.display = "flex";
}

function closeCreateModal(){
  document.getElementById("createModal").style.display = "none";
}

async function createFileConfirm(){

  let name = document.getElementById("fileNameInput").value.trim();
  if(!name){
    alert("Enter file name");
    return;
  }

  let id = "file_" + Date.now();

  let file = {
    id,
    name,
    given: {},
    used: {}
  };

  const { data: sessionData } = await supabaseClient.auth.getSession();

  if(!sessionData.session){
    alert("User not logged in");
    return;
  }

  let userEmail = sessionData.session.user.email;

  localStorage.setItem("currentUser", userEmail);

  let { error } = await supabaseClient
    .from("files")
    .insert([{
      id: id,
      user_email: userEmail,
      name: name,
      data: file
    }]);

  if(error){
    console.log(error);
    alert("Error saving file");
    return;
  }

  localStorage.setItem("currentFile", id);

  closeCreateModal();

  window.location = "result.html";
}

/* =========================
   LOGOUT
========================= */
async function logout(){

  await supabaseClient.auth.signOut();

  localStorage.setItem("loggedOut", "true");

  window.location.href = "index.html";
}

/* =========================
   NAV
========================= */
function goAdmin(){
  window.location = "administrator.html";
}

function goHistory(){
  window.location = "history.html";
}
