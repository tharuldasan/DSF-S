const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

/* LOGOUT */
async function logout(){

  await supabaseClient.auth.signOut();

  localStorage.setItem("loggedOut", "true");

  window.location.href = "index.html";
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
async function createFileConfirm(){

  let name = document.getElementById("fileNameInput").value.trim();
  if(!name){
    alert("Enter file name");
    return;
  }

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

  // 🔥 GET LOGGED USER EMAIL FROM SUPABASE
  const { data: sessionData } = await supabaseClient.auth.getSession();

  if(!sessionData.session){
    alert("User not logged in");
    return;
  }

  let userEmail = sessionData.session.user.email;

  // 🔥 INSERT INTO DATABASE
  let { error } = await supabaseClient
    .from("files")
    .insert({
      id: id,
      user_email: userEmail,
      name: name,
      data: file
    });

  if(error){
    console.log(error);
    alert("Error saving file");
    return;
  }

  // SAVE CURRENT FILE ID
  localStorage.setItem("currentFile", id);

  // CLOSE MODAL
  closeCreateModal();

  // GO TO RESULT PAGE
  window.location = "result.html";
}

function goAdmin(){
  window.location = "administrator.html";
}

/* GO HISTORY */
function goHistory(){
  window.location = "history.html";
}
