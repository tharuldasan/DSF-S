const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

/* LOGOUT */
function logout(){
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentFile");
  window.location = "index.html";
}

/* OPEN CREATE MODAL */
function createNew(){
  document.getElementById("createModal").style.display = "flex";
}

/* CLOSE MODAL */
function closeCreateModal(){
  document.getElementById("createModal").style.display = "none";
}

/* CREATE FILE */
function createFileConfirm(){
  let name = document.getElementById("fileNameInput").value.trim();
  if(!name) return;

  let id = "file_" + Date.now();

  let given = {};
  let used = {};

  ["A","B","C","D","E"].forEach(l=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){
        let key = `${l}${i}.${j}`;
        given[key] = 0;
        used[key] = 0;
      }
    }
  });

  let file = { id, name, given, used };

  let key = getUserKey();
  let files = JSON.parse(localStorage.getItem(key) || "[]");

  files.push(file);

  localStorage.setItem(key, JSON.stringify(files));
  localStorage.setItem("currentFile", id);

  closeCreateModal();
  window.location = "result.html";
}

async function logout(){

  await supabaseClient.auth.signOut();

  localStorage.setItem("loggedOut", "true");

  window.location.href = "index.html";
}

/* GO HISTORY */
function goHistory(){
  window.location = "history.html";
}
