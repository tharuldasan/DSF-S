function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

let currentId = localStorage.getItem("currentFile");

function getFiles(){
  return JSON.parse(localStorage.getItem(getUserKey()) || "[]");
}

function saveFiles(files){
  localStorage.setItem(getUserKey(), JSON.stringify(files));
}

function getCurrentFile(){
  return getFiles().find(f => f.id === currentId);
}

let level = "main";
let current = "";
let currentKey = "";
let currentType = "";

/* FORMAT */
function formatRs(num){
  return "Rs. " + num.toLocaleString(undefined,{minimumFractionDigits:2});
}

/* DATE */
function getDate(){
  let d = new Date();
  return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

/* RENDER */
function render(){
  let file = getCurrentFile();
  let given = file.given;
  let used = file.used;

  let div = document.getElementById("totals");

  let html = `
  <table>
    <tr>
      <th>DS</th>
      <th>Government Institute</th>
      <th>Category</th>
      <th>Allo/Distribution</th>
      <th>Expenditure</th>
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

        <td class="clickable"
            onclick="edit('${key}','given')"
            oncontextmenu="viewHistory(event,'${key}','given')">
            ${formatRs(g)}
        </td>

        <td class="clickable"
            onclick="edit('${key}','used')"
            oncontextmenu="viewHistory(event,'${key}','used')">
            ${formatRs(u)}
        </td>

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

/* EDIT */
function edit(key,type){
  currentKey=key;
  currentType=type;
  document.getElementById("modalTitle").innerText = key;
  document.getElementById("modal").style.display="flex";
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

function saveModal(){
  let val = Number(document.getElementById("modalInput").value)||0;
  let plus = document.getElementById("plusToggle").checked;

  let files=getFiles();
  let index=files.findIndex(f=>f.id===currentId);
  let file=files[index];

  let old = file[currentType][currentKey] || 0;
  let newVal = plus ? old + val : val;

  file[currentType][currentKey] = newVal;

  /* HISTORY SAVE */
  if(!file.history) file.history = {};
  if(!file.history[currentKey]) file.history[currentKey] = [];

  file.history[currentKey].push({
    date: getDate(),
    type: currentType,
    status: plus ? "Added" : "Changed",
    amount: val
  });

  files[index]=file;
  saveFiles(files);

  closeModal();
  render();
}

/* RIGHT CLICK HISTORY */
function viewHistory(e,key,type){
  e.preventDefault();
  localStorage.setItem("historyKey", key);
  window.location="item-history.html";
}

/* EXPORT */
function exportExcel(){
  let rows=[];
  let file=getCurrentFile();

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
    ["DS","Government Institute","Category","Allo/Distribution","Expenditure","Balance"],
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
