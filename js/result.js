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
      ${["A","B","C","D","E"].map(() => `
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

        let keyBase = `${letter}${i}.${j}`;

        html += `<tr>
          <td>${count}</td>
          <td>${letter}${i}</td>
          <td>${keyBase}</td>
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

// ONLY CHANGE THIS PART INSIDE saveModal()

function saveModal(){
  let val = Number(document.getElementById("modalInput").value)||0;
  let plus = document.getElementById("plusToggle").checked;

  let files=getFiles();
  let index=files.findIndex(f=>f.id===currentId);
  let file=files[index];

  let old = file[currentType][currentKey] || 0;
  let newVal = plus ? old + val : val;

  file[currentType][currentKey] = newVal;

  /* 🔥 FIX: SEPARATE HISTORY */
  if(!file.history) file.history = {};
  if(!file.history[currentKey]) {
    file.history[currentKey] = {
      given: [],
      used: []
    };
  }

  file.history[currentKey][currentType].push({
    date: getDate(),
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
  let file = getCurrentFile();
  let data = [];

  let count = 1;

  // HEADER ROW 1 (MAIN GROUPS)
  let header1 = [
    "No",
    "Government Institute",
    "Category",
    "A","","",
    "B","","",
    "C","","",
    "D","","",
    "E","",""
  ];

  // HEADER ROW 2 (SUB HEADERS)
  let header2 = [
    "",
    "",
    "",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance",
    "Allo/Distribution","Expenditure","Balance"
  ];

  data.push(header1);
  data.push(header2);

  // DATA ROWS
  ["A","B","C","D","E"].forEach(letter=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){

        let key = `${letter}${i}.${j}`;

        let row = [
          count,
          letter + i,
          key
        ];

        ["A","B","C","D","E"].forEach(col=>{
          let k = `${col}${i}.${j}`;

          let g = file.given[k] || 0;
          let u = file.used[k] || 0;
          let b = g - u;

          row.push(
            formatRs(g),
            formatRs(u),
            formatRs(b)
          );
        });

        data.push(row);
        count++;
      }
    }
  });

  let ws = XLSX.utils.aoa_to_sheet(data);

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  XLSX.writeFile(wb, file.name + ".xlsx");
}

function goDashboard(){
  window.location="dashboard.html";
}

render();
