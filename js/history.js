let files = JSON.parse(localStorage.getItem("files")||"[]");

let draftDiv = document.getElementById("draft");
let finishedDiv = document.getElementById("finished");

files.forEach((f,i)=>{
  let btn = `
    <div>
      ${f.name}
      <button onclick="openFile(${i})">Open</button>
      <button onclick="renameFile(${i})">Rename</button>
      <button onclick="deleteFile(${i})">Delete</button>
    </div>
  `;

  if(f.used == null){
    draftDiv.innerHTML += btn;
  }else{
    finishedDiv.innerHTML += btn;
  }
});

function openFile(i){
  localStorage.setItem("currentFile", i);
  window.location = "result.html";
}

function renameFile(i){
  let name = prompt("New name:");
  if(name){
    files[i].name = name;
    localStorage.setItem("files", JSON.stringify(files));
    location.reload();
  }
}

function deleteFile(i){
  if(confirm("Delete?")){
    files.splice(i,1);
    localStorage.setItem("files", JSON.stringify(files));
    location.reload();
  }
}

function back(){
  window.location = "dashboard.html";
}