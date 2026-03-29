function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

let div = document.getElementById("files");
let renameIndex = null;

function renderHistory(){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");
  div.innerHTML = "";

  files.forEach((f,index)=>{
    let box = document.createElement("div");
    box.style.margin="10px";
    box.style.padding="15px";
    box.style.background="#eee";

    box.innerHTML = `
      <b>${f.name}</b><br><br>
      <button onclick="openFile('${f.id}')">Open</button>
      <button onclick="openRename(${index})">Rename</button>
      <button onclick="deleteFile(${index})">Delete</button>
    `;

    div.appendChild(box);
  });
}

function openFile(id){
  localStorage.setItem("currentFile", id);
  window.location="result.html";
}

function openRename(index){
  renameIndex = index;
  document.getElementById("renameModal").style.display="flex";
}

function closeRename(){
  document.getElementById("renameModal").style.display="none";
}

function confirmRename(){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");

  let newName = document.getElementById("renameInput").value.trim();
  if(!newName) return;

  files[renameIndex].name = newName;

  localStorage.setItem(getUserKey(), JSON.stringify(files));

  closeRename();
  renderHistory();
}

function deleteFile(index){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");

  files.splice(index,1);

  localStorage.setItem(getUserKey(), JSON.stringify(files));
  renderHistory();
}

renderHistory();
