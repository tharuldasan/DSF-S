/* SUPABASE CONNECT */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* GLOBAL */
let div = document.getElementById("files");
let renameId = null;

/* LOAD FILES FROM CLOUD */
async function renderHistory(){

  let user = localStorage.getItem("user");

  let { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", user);

  if(error){
    console.log(error);
    return;
  }

  div.innerHTML = "";

  data.forEach((f)=>{

    let box = document.createElement("div");
    box.style.margin="10px";
    box.style.padding="15px";
    box.style.background="#eee";

    box.innerHTML = `
      <b>${f.name}</b><br><br>
      <button onclick="openFile('${f.id}')">Open</button>
      <button onclick="openRename('${f.id}')">Rename</button>
      <button onclick="deleteFile('${f.id}')">Delete</button>
    `;

    div.appendChild(box);
  });
}

/* OPEN FILE */
function openFile(id){
  localStorage.setItem("currentFile", id);
  window.location="result.html";
}

/* OPEN RENAME MODAL */
function openRename(id){
  renameId = id;
  document.getElementById("renameModal").style.display="flex";
}

/* CLOSE MODAL */
function closeRename(){
  document.getElementById("renameModal").style.display="none";
}

/* CONFIRM RENAME */
async function confirmRename(){

  let newName = document.getElementById("renameInput").value.trim();
  if(!newName) return;

  let user = localStorage.getItem("user");

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

/* DELETE FILE */
async function deleteFile(id){

  let user = localStorage.getItem("user");

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

/* LOAD ON PAGE OPEN */
window.onload = function(){
  renderHistory();
};
