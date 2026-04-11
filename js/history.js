/* SUPABASE */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "YOUR_KEY";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* GLOBAL */
let div = document.getElementById("files");
let renameId = null;
let allFiles = [];

/* =========================
   LOAD FILES
========================= */
async function renderHistory(){

  let user = localStorage.getItem("currentUser");

  if(!user){
    div.innerHTML = "User not found";
    return;
  }

  let { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", user);

  if(error){
    console.log(error);
    div.innerHTML = "Error loading files";
    return;
  }

  allFiles = data || [];

  renderFiles(allFiles);
}

/* =========================
   RENDER FILES
========================= */
function renderFiles(files){

  div.innerHTML = "";

  if(!files || files.length === 0){
    div.innerHTML = "No files found";
    return;
  }

  files.forEach((f)=>{

    let box = document.createElement("div");
    box.style.margin="10px";
    box.style.padding="15px";
    box.style.background="#eee";
    box.style.borderRadius="10px";

    box.innerHTML = `
      <b>${f.name}</b><br><br>

      <button onclick="openFile('${f.id}')">Open</button>
      <button onclick="openRename('${f.id}','${f.name}')">Rename</button>
      <button onclick="deleteFile('${f.id}')">Delete</button>
    `;

    div.appendChild(box);
  });
}

/* =========================
   SEARCH
========================= */
function searchFiles(){

  let q = document.getElementById("searchInput").value.toLowerCase();

  let filtered = allFiles.filter(f =>
    f.name.toLowerCase().includes(q)
  );

  renderFiles(filtered);
}

/* =========================
   OPEN FILE
========================= */
function openFile(id){
  localStorage.setItem("currentFile", id);
  window.location = "result.html";
}

/* =========================
   RENAME
========================= */
function openRename(id, name){
  renameId = id;
  document.getElementById("renameInput").value = name;
  document.getElementById("renameModal").style.display = "flex";
}

function closeRename(){
  document.getElementById("renameModal").style.display = "none";
}

async function confirmRename(){

  let newName = document.getElementById("renameInput").value.trim();
  if(!newName) return;

  let user = localStorage.getItem("currentUser");

  let { error } = await supabaseClient
    .from("files")
    .update({ name: newName })
    .eq("user_email", user)
    .eq("id", renameId);

  if(error){
    alert("Rename failed");
    console.log(error);
    return;
  }

  closeRename();
  renderHistory();
}

/* =========================
   DELETE
========================= */
async function deleteFile(id){

  if(!confirm("Delete this file?")) return;

  let user = localStorage.getItem("currentUser");

  let { error } = await supabaseClient
    .from("files")
    .delete()
    .eq("user_email", user)
    .eq("id", id);

  if(error){
    alert("Delete failed");
    console.log(error);
  }else{
    renderHistory();
  }
}

/* =========================
   INIT
========================= */
window.onload = renderHistory;
