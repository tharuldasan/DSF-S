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

  keys.forEach(k => {
    emptyGiven[k] = 0;
    emptyUsed[k] = 0;
  });

  let file = {
    id: id,
    name: name,
    given: emptyGiven,
    used: emptyUsed
  };

  let files = JSON.parse(localStorage.getItem("files")||"[]");
  files.push(file);

  localStorage.setItem("files", JSON.stringify(files));
  localStorage.setItem("currentFile", id);

  window.location = "result.html";
}

function goHistory(){
  window.location = "history.html";
}
