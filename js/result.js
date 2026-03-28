function getUserKey(){
  let user = localStorage.getItem("currentUser");
  return "files_" + user;
}

let currentId = localStorage.getItem("currentFile");

function getFiles(){
  return JSON.parse(localStorage.getItem(getUserKey()) || "[]");
}

function saveFiles(files){
  localStorage.setItem(getUserKey(), JSON.stringify(files));
}

function getCurrentFile(){
  let files = getFiles();
  return files.find(f => f.id === currentId);
}

let file = getCurrentFile();

let level = "main";
let current = "";
let currentKey = "";
let currentType = "";

function formatRs(num){
  return "Rs. " + num.toLocaleString(undefined,{minimumFractionDigits:2});
}

function render(){
  file = getCurrentFile();
  let given = file.given;
  let used = file.used;

  let div = document.getElementById("totals");

  let html = `
  <table>
    <tr>
      <th>Category</th>
      <th>Sub</th>
      <th>Item</th>
      <th>Given</th>
      <th>Used</th>
      <th>Balance</th>
    </tr>
  `;

  if(level==="main"){
    ["A","B","C","D","E"].forEach(letter=>{
      let g=0,u=0;

      for(let k in given){
        if(k.startsWith(letter)){
          g+=given[k];
          u+=used[k];
        }
      }

      html+=`
      <tr class="clickable" onclick="goLevel('${letter}')">
        <td>${letter}</td><td></td><td></td>
        <td>${formatRs(g)}</td>
        <td>${formatRs(u)}</td>
        <td>${formatRs(g-u)}</td>
      </tr>`;
    });
  }

  else if(level==="A"){
    for(let i=1;i<=5;i++){
      let key=current+i;
      let g=0,u=0;

      for(let k in given){
        if(k.startsWith(key)){
          g+=given[k];
          u+=used[k];
        }
      }

      html+=`
      <tr class="clickable" onclick="goLevel('${key}')">
        <td>${current}</td><td>${key}</td><td></td>
        <td>${formatRs(g)}</td>
        <td>${formatRs(u)}</td>
        <td>${formatRs(g-u)}</td>
      </tr>`;
    }
  }

  else{
    for(let j=1;j<=5;j++){
      let key=current+"."+j;
      let g=given[key]||0;
      let u=used[key]||0;

      html+=`
      <tr>
        <td>${current[0]}</td>
        <td>${current}</td>
        <td>${key}</td>
        <td class="clickable" onclick="edit('${key}','given')">${formatRs(g)}</td>
        <td class="clickable" onclick="edit('${key}','used')">${formatRs(u)}</td>
        <td>${formatRs(g-u)}</td>
      </tr>`;
    }
  }

  html+="</table>";
  div.innerHTML=html;
}

function goLevel(val){
  current=val;
  level=val.length===1?"A":"A1";
  render();
}

function goBack(){
  if(level==="A1"){current=current[0];level="A";}
  else if(level==="A"){current="";level="main";}
  render();
}

function edit(key,type){
  currentKey=key;
  currentType=type;
  document.getElementById("modal").style.display="flex";
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

function saveModal(){
  let value=Number(document.getElementById("modalInput").value)||0;

  let files=getFiles();
  let index=files.findIndex(f=>f.id===currentId);

  if(currentType==="given"){
    files[index].given[currentKey]=value;
  }else{
    files[index].used[currentKey]=value;
  }

  saveFiles(files);
  closeModal();
  render();
}

function exportExcel(){
  let rows=[];
  file=getCurrentFile();

  ["A","B","C","D","E"].forEach(letter=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){
        let key=`${letter}${i}.${j}`;
        let g=file.given[key]||0;
        let u=file.used[key]||0;

        rows.push([
          letter, letter+i, key,
          formatRs(g),
          formatRs(u),
          formatRs(g-u)
        ]);
      }
    }
  });

  let ws=XLSX.utils.aoa_to_sheet([
    ["Category","Sub","Item","Given","Used","Balance"],
    ...rows
  ]);

  let wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Report");

  XLSX.writeFile(wb,file.name+".xlsx");
}

function goDashboard(){
  window.location="dashboard.html";
}

render();
