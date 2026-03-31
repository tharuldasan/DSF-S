let currentKey = "";
let currentType = "";

/* GET CURRENT FILE */
function getCurrentFile(){
  let user = localStorage.getItem("currentUser");
  let files = JSON.parse(localStorage.getItem("files_" + user)||"[]");
  let id = localStorage.getItem("currentFile");

  return files.find(f => f.id === id);
}

/* SAVE FILE */
function saveFile(file){
  let user = localStorage.getItem("currentUser");
  let files = JSON.parse(localStorage.getItem("files_" + user)||"[]");

  let index = files.findIndex(f => f.id === file.id);
  files[index] = file;

  localStorage.setItem("files_" + user, JSON.stringify(files));
}

/* FORMAT */
function formatRs(val){
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* RENDER TABLE */
function render(){
  let file = getCurrentFile();
  let given = file.given || {};
  let used = file.used || {};

  let html = `
  <table>
    <tr>
      <th rowspan="2">No</th>
      <th rowspan="2">Government Institute</th>
      <th rowspan="2">Category</th>
      <th>Allo/Distribution</th>
      <th>Expenditure</th>
      <th>Balance</th>
    </tr>
  `;

  let count = 1;

  for(let letter of ["A","B","C","D","E"]){
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){

        let key = `${letter}${i}.${j}`;
        let g = given[key] || 0;
        let u = used[key] || 0;

        html += `<tr>
          <td>${count}</td>
          <td>${letter}${i}</td>
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

          <td class="balance-cell">${formatRs(g-u)}</td>
        </tr>`;

        count++;
      }
    }
  }

  html += "</table>";
  document.getElementById("totals").innerHTML = html;
}

/* EDIT */
function edit(key,type){
  currentKey = key;
  currentType = type;

  document.getElementById("modalTitle").innerText = key + " - " + type;
  document.getElementById("modalInput").value = "";
  document.getElementById("modal").style.display = "flex";
}

/* SAVE MODAL */
function saveModal(){
  let val = Number(document.getElementById("modalInput").value);
  if(isNaN(val)) return closeModal();

  let file = getCurrentFile();
  let addMode = document.getElementById("plusToggle").checked;

  // SAFETY (IMPORTANT)
  if(!file.given) file.given = {};
  if(!file.used) file.used = {};
  if(!file.history) file.history = {};
  if(!file.history[currentKey]) file.history[currentKey] = [];

  // CLEAN KEY
  let key = currentKey.trim();

  // UPDATE ONLY THIS KEY (NO SPREAD BUG)
  if(addMode){
    file[currentType][key] = (file[currentType][key] || 0) + val;
  }else{
    file[currentType][key] = val;
  }

  // SAVE HISTORY
  file.history[key].push({
    type: currentType,
    amount: val,
    mode: addMode ? "Added" : "Set",
    date: new Date().toLocaleDateString()
  });

  saveFile(file);
  closeModal();
  render();
}

/* CLOSE MODAL */
function closeModal(){
  document.getElementById("modal").style.display = "none";
}

/* HISTORY (RIGHT CLICK) */
function viewHistory(e,key,type){
  e.preventDefault();

  let file = getCurrentFile();
  let history = (file.history && file.history[key]) || [];

  let html = "<table><tr><th>Date</th><th>Type</th><th>Amount</th></tr>";

  history.forEach(h=>{
    if(h.type === type){
      html += `<tr>
        <td>${h.date}</td>
        <td>${h.mode}</td>
        <td>${formatRs(h.amount)}</td>
      </tr>`;
    }
  });

  html += "</table><br><button onclick='render()'>⬅ Back</button>";

  document.getElementById("totals").innerHTML = html;
}

/* NAVIGATION */
function goBack(){ history.back(); }
function goDashboard(){ window.location.href="dashboard.html"; }

/* EXPORT EXCEL (YOUR FINAL VERSION) */
function exportExcel(){
  let file = getCurrentFile();
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
          let g = file.given[key] || 0;
          let u = file.used[key] || 0;

          row.push(g, u, g-u);
        });

        data.push(row);
        count++;
      }
    }
  }

  let ws = XLSX.utils.aoa_to_sheet(data);

  /* WIDTH */
  ws['!cols'] = [
    {wch:6},
    {wch:20},
    {wch:26},
    ...Array(15).fill({wch:14.5})
  ];

  /* MERGE */
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

  /* STYLE */
  for(let R=0; R<data.length; R++){
    for(let C=0; C<18; C++){

      let cellRef = XLSX.utils.encode_cell({r:R,c:C});
      let cell = ws[cellRef];
      if(!cell) continue;

      cell.s = {
        border:{
          top:{style:"thin"},
          bottom:{style:"thin"},
          left:{style:"thin"},
          right:{style:"thin"}
        },
        alignment:{
          horizontal: (C === 0 ? "left" : (C >= 3 ? "center" : "left")),
          vertical:"center"
        },
        font:{
          bold: (R <= 1)
        }
      };

      /* HEADERS */
      if(R===0 && C>=3){
        cell.s.fill = { fgColor:{rgb:"BFBFBF"} };
      }

      if(R===1 && C>=3){
        cell.s.fill = { fgColor:{rgb:"808080"} };
      }

      /* BALANCE */
      if((C-3)%3===2 && C>=3){
        cell.s.fill = { fgColor:{rgb:"D9D9D9"} };
      }

      /* NUMBER FORMAT 🔥 */
      if(R >= 2 && C >= 3){
        cell.z = "#,##0.00";
        cell.s.alignment.horizontal = "right";
      }
    }
  }

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  XLSX.writeFile(wb, file.name + ".xlsx");
}
