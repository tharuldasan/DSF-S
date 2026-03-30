function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

let currentId = localStorage.getItem("currentFile");

/* FILE FUNCTIONS */
function getFiles(){
  return JSON.parse(localStorage.getItem(getUserKey()) || "[]");
}

function saveFiles(files){
  localStorage.setItem(getUserKey(), JSON.stringify(files));
}

function getCurrentFile(){
  return getFiles().find(f => f.id === currentId);
}

/* GLOBAL */
let currentKey = "";
let currentType = "";

/* FORMAT */
function formatRs(num){
  return "Rs. " + Number(num).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* DATE */
function getDate(){
  let d = new Date();
  return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

/* RENDER TABLE */
function render(){
  let file = getCurrentFile();
  if(!file) return;

  let given = file.given || {};
  let used = file.used || {};

  let div = document.getElementById("totals");

  let html = `
  <table>
    <tr>
      <th rowspan="2">No</th>
      <th rowspan="2">Government Institute</th>
      <th rowspan="2">Category</th>

      <th colspan="3">A</th>
      <th colspan="3">B</th>
      <th colspan="3">C</th>
      <th colspan="3">D</th>
      <th colspan="3">E</th>
    </tr>

    <tr>
      ${["A","B","C","D","E"].map(()=>`
        <th>Allo/Distribution</th>
        <th>Expenditure</th>
        <th>Balance</th>
      `).join("")}
    </tr>
  `;

  let count = 1;

  for(let letter of ["A","B","C","D","E"]){
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){

        let base = `${letter}${i}.${j}`;

        html += `<tr>
          <td>${count}</td>
          <td>${letter}${i}</td>
          <td>${base}</td>
        `;

        ["A","B","C","D","E"].forEach(col=>{
          let key = `${col}${i}.${j}`;

          let g = given[key] || 0;
          let u = used[key] || 0;

          html += `
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

          <td class="balance-cell">${formatRs(g-u)}</td>
          `;
        });

        html += "</tr>";
        count++;
      }
    }
  }

  html += "</table>";
  div.innerHTML = html;
}

/* EDIT */
function edit(key,type){
  currentKey = key;
  currentType = type;

  document.getElementById("modalTitle").innerText = key;
  document.getElementById("modalInput").value = "";
  document.getElementById("modal").style.display = "flex";
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

/* SAVE VALUE */
function saveModal(){
  let val = Number(document.getElementById("modalInput").value) || 0;
  let plus = document.getElementById("plusToggle").checked;

  let files = getFiles();
  let index = files.findIndex(f => f.id === currentId);
  let file = files[index];

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};

  let old = file[currentType][currentKey] || 0;
  let newVal = plus ? old + val : val;

  file[currentType][currentKey] = newVal;

  /* HISTORY */
  if(!file.history) file.history = {};
  if(!file.history[currentKey]){
    file.history[currentKey] = { given: [], used: [] };
  }

  file.history[currentKey][currentType].push({
    date: getDate(),
    status: plus ? "Added" : "Changed",
    amount: val
  });

  files[index] = file;
  saveFiles(files);

  closeModal();
  render();
}

/* RIGHT CLICK HISTORY */
function viewHistory(e,key,type){
  e.preventDefault();
  localStorage.setItem("historyKey", key);
  window.location = "item-history.html";
}

/* EXPORT EXCEL */
function exportExcel(){

  let file = getCurrentFile();

  if(!file){
    alert("No file selected!");
    return;
  }

  let data = [];

  let header1 = [
    "No","Government Institute","Category",
    "A","","","B","","","C","","","D","","","E","",""
  ];

  let header2 = [
    "","","",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance"
  ];

  data.push(header1);
  data.push(header2);

  let count = 1;

  for(let letter of ["A","B","C","D","E"]){
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){

        let row = [
          count,
          letter+i,
          `${letter}${i}.${j}`
        ];

        ["A","B","C","D","E"].forEach(col=>{
          let key = `${col}${i}.${j}`;

          let g = (file.given && file.given[key]) || 0;
          let u = (file.used && file.used[key]) || 0;

          row.push(g,u,g-u);
        });

        data.push(row);
        count++;
      }
    }
  }

  let ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    {wch:6},{wch:20},{wch:26},
    ...Array(15).fill({wch:14.5})
  ];

  ws['!merges'] = [
    {s:{r:0,c:0},e:{r:1,c:0}},
    {s:{r:0,c:1},e:{r:1,c:1}},
    {s:{r:0,c:2},e:{r:1,c:2}},
    {s:{r:0,c:3},e:{r:0,c:5}},
    {s:{r:0,c:6},e:{r:0,c:8}},
    {s:{r:0,c:9},e:{r:0,c:11}},
    {s:{r:0,c:12},e:{r:0,c:14}},
    {s:{r:0,c:15},e:{r:0,c:17}}
  ];

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  let wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

  function s2ab(s){
    let buf = new ArrayBuffer(s.length);
    let view = new Uint8Array(buf);
    for(let i=0;i<s.length;i++) view[i]=s.charCodeAt(i)&0xFF;
    return buf;
  }

  let blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file.name + ".xlsx";
  link.click();
}

/* NAVIGATION */
function goDashboard(){
  window.location = "dashboard.html";
}

/* INIT */
render();
