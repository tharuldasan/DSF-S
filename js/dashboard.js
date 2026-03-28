function getUserKey(){
  let user = localStorage.getItem("currentUser");
  return "files_" + user;
}

function createNew(){
  let name = prompt("Enter File Name:");
  if(!name) return;

  let id = "file_" + Date.now();

  let keys = [];
  ["A","B","C","D","E"].forEach(l=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){
        keys.push(`${l}${i}.${j}`);
      }
    }
  });

  let emptyGiven = {};
  let emptyUsed = {};

  keys.forEach(k=>{
    emptyGiven[k]=0;
    emptyUsed[k]=0;
  });

  let file = {
    id,
    name,
    given: emptyGiven,
    used: emptyUsed
  };

  let key = getUserKey();
  let files = JSON.parse(localStorage.getItem(key)||"[]");

  files.push(file);

  localStorage.setItem(key, JSON.stringify(files));
  localStorage.setItem("currentFile", id);

  window.location = "result.html";
}

function goHistory(){
  window.location = "history.html";
}
