function getUserKey(){
  let user = localStorage.getItem("currentUser");
  return "files_" + user;
}

let div = document.getElementById("files");

function renderHistory(){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");
  div.innerHTML = "";

  files.forEach((f,index)=>{
    let box = document.createElement("div");
    box.style.margin="10px";
    box.style.padding="10px";
    box.style.background="#eee";

    box.innerHTML = `
      <b>${f.name}</b><br><br>
      <button onclick="openFile('${f.id}')">Open</button>
      <button onclick="renameFile(${index})">Rename</button>
      <button onclick="deleteFile(${index})">Delete</button>
    `;

    div.appendChild(box);
  });
}

function openFile(id){
  localStorage.setItem("currentFile", id);
  window.location="result.html";
}

function renameFile(index){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");

  let name = prompt("New name:", files[index].name);
  if(!name) return;

  files[index].name = name;
  localStorage.setItem(getUserKey(), JSON.stringify(files));
  renderHistory();
}

function deleteFile(index){
  let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");

  if(confirm("Delete?")){
    files.splice(index,1);
    localStorage.setItem(getUserKey(), JSON.stringify(files));
    renderHistory();
  }
}

renderHistory();
