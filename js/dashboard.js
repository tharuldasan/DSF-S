function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

function createNew(){
  document.getElementById("createModal").style.display = "flex";
}

function closeCreateModal(){
  document.getElementById("createModal").style.display = "none";
}

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
        given[key]=0;
        used[key]=0;
      }
    }
  });

  let file = { id, name, given, used };

  let key = getUserKey();
  let files = JSON.parse(localStorage.getItem(key)||"[]");

  files.push(file);

  localStorage.setItem(key, JSON.stringify(files));
  localStorage.setItem("currentFile", id);

  closeCreateModal();
  window.location = "result.html";
}

function goHistory(){
  window.location = "history.html";
}
