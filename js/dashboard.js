/* =========================
   SUPABASE CONFIG
========================= */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   GLOBAL
========================= */
let allFiles = [];

/* =========================
   LOAD FILES
========================= */
async function loadFiles(){

  let user = localStorage.getItem("currentUser");

  if(!user){
    document.getElementById("fileList").innerHTML = "No user found";
    return;
  }

  let { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", user)
    .order("created_at", { ascending: false });

  if(error){
    console.log(error);
    return;
  }

  allFiles = data || [];

  renderFiles(allFiles);
}

/* =========================
   RENDER FILES
========================= */
function renderFiles(files){

  let container = document.getElementById("fileList");

  if(!files || files.length === 0){
    container.innerHTML = "No files available";
    return;
  }

  let html = "";

  files.forEach(file=>{
    html += `
      <div class="file-card">

        <div onclick="openFile('${file.id}')">
          ${file.name}
        </div>

        <div class="file-actions">
          <button onclick="renameFile('${file.id}','${file.name}')">✏️</button>
          <button onclick="deleteFile('${file.id}')">🗑</button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

/* =========================
   OPEN FILE
========================= */
function openFile(id){
  localStorage.setItem("currentFile", id);
  window.location = "result.html";
}

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

  // SAVE USER
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
   DELETE FILE
========================= */
async function deleteFile(id){

  if(!confirm("Delete this file?")) return;

  let { error } = await supabaseClient
    .from("files")
    .delete()
    .eq("id", id);

  if(error){
    console.log(error);
    alert("Delete failed");
    return;
  }

  loadFiles();
}

/* =========================
   RENAME FILE
========================= */
async function renameFile(id, oldName){

  let newName = prompt("Enter new name", oldName);

  if(!newName) return;

  let { error } = await supabaseClient
    .from("files")
    .update({ name: newName })
    .eq("id", id);

  if(error){
    console.log(error);
    alert("Rename failed");
    return;
  }

  loadFiles();
}

/* =========================
   SEARCH FILES
========================= */
function searchFiles(){

  let q = document.getElementById("searchInput").value.toLowerCase();

  let filtered = allFiles.filter(f =>
    f.name.toLowerCase().includes(q)
  );

  renderFiles(filtered);
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

/* =========================
   INIT
========================= */
window.onload = loadFiles;
