function createNew(){
  let name = prompt("Enter File Name:");
  if(!name) return;

  let keys = [];
  ["A","B","C","D","E"].forEach(l=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){
        keys.push(`${l}${i}.${j}`);
      }
    }
  });

  let emptyData = {};
  keys.forEach(k => emptyData[k] = 0);

  localStorage.setItem("givenData", JSON.stringify(emptyData));
  localStorage.setItem("usedData", JSON.stringify(emptyData));
  localStorage.setItem("fileName", name);

  window.location = "result.html";
}

function goHistory(){
  window.location = "history.html";
}
