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

  // HEADER ROW 1
  let header1 = [
    "No","Government Institute","Category",
    "A","","","B","","","C","","","D","","","E","",""
  ];

  // HEADER ROW 2
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
          let g = file.given[key]||0;
          let u = file.used[key]||0;

          row.push(g,u,g-u);
        });

        data.push(row);
        count++;
      }
    }
  }

  let ws = XLSX.utils.aoa_to_sheet(data);

  /* COLUMN WIDTHS */
  ws['!cols'] = [
    {wch:6},
    {wch:20},
    {wch:26},
    ...Array(15).fill({wch:14.5})
  ];

  /* MERGES */
  ws['!merges'] = [
    // vertical merge
    {s:{r:0,c:0}, e:{r:1,c:0}},
    {s:{r:0,c:1}, e:{r:1,c:1}},
    {s:{r:0,c:2}, e:{r:1,c:2}},

    // horizontal A-E
    {s:{r:0,c:3}, e:{r:0,c:5}},
    {s:{r:0,c:6}, e:{r:0,c:8}},
    {s:{r:0,c:9}, e:{r:0,c:11}},
    {s:{r:0,c:12}, e:{r:0,c:14}},
    {s:{r:0,c:15}, e:{r:0,c:17}}
  ];

  /* STYLING */
  for(let R=0; R<data.length; R++){
    for(let C=0; C<18; C++){

      let cell = ws[XLSX.utils.encode_cell({r:R,c:C})];
      if(!cell) continue;

      cell.s = {
        border:{
          top:{style:"thin"},
          bottom:{style:"thin"},
          left:{style:"thin"},
          right:{style:"thin"}
        },
        alignment:{
          horizontal: (C>=3 && R===0) ? "center" :
                      (C<3 ? "left" : "center")
        }
      };

      /* A-E HEADER COLOR */
      if(R===0 && C>=3){
        cell.s.fill = { fgColor:{rgb:"BFBFBF"} };
      }

      /* SUB HEADER */
      if(R===1){
        if((C-3)%3===0){ // Allo
          cell.s.fill = { fgColor:{rgb:"A6A6A6"} };
        }
        if((C-3)%3===2){ // Balance
          cell.s.fill = { fgColor:{rgb:"808080"} };
        }
      }

      /* BALANCE COLUMN FULL COLOR */
      if(C>=3 && (C-3)%3===2 && R>1){
        cell.s.fill = { fgColor:{rgb:"BFBFBF"} };
      }
    }
  }

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  XLSX.writeFile(wb, file.name + ".xlsx");
}
function goDashboard(){
  window.location="dashboard.html";
}

render();
