/* =========================
   SUPABASE
========================= */
const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   GLOBALS
========================= */
let addMode = false;
let minzeMode = false;
let selectedDS = null;

const DS = [
  "Total Allocation",
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];

function closeDateModal(){
  document.getElementById("dateModal").style.display = "none";
}

function toggleDropdown(){
  let list = document.getElementById("dropdownList");
  list.classList.toggle("show");
}

function selectDS(value){

  document.getElementById("searchDS").innerText = value;

  // close dropdown after select
  document.getElementById("dropdownList").classList.remove("show");
}

/* =========================
   SEARCH SYSTEM
========================= */

let lastSearch = null;
let highlightTimer = null;

/* OPEN SEARCH MODAL */
function openSearch(){
  document.getElementById("searchModal").style.display = "flex";
}

/* CLOSE SEARCH */
function closeSearch(){
  document.getElementById("searchModal").style.display = "none";
}

/* SEARCH ACTION */
function doSearch(){

  let head = document.getElementById("searchHead").value.trim();
  let vote = document.getElementById("searchVote").value.trim();
  let ds = document.getElementById("searchDS").innerText;

  lastSearch = { head, vote, ds };

  applyHighlight();

  closeSearch();
}

/* =========================
   HIGHLIGHT RESULT
========================= */
function applyHighlight(){

  if(!lastSearch) return;

  let { head, vote, ds } = lastSearch;

  // remove old highlight
  document.querySelectorAll(".highlight-cell").forEach(c=>{
    c.classList.remove("highlight-cell");
  });

  let found = false;

  let rows = document.querySelectorAll("#totals table tr");

  rows.forEach(row=>{

    let cells = row.children;

    if(cells.length > 3){

      let headVal = cells[1].innerText.trim();
      let voteVal = cells[2].innerText.trim();

      if(headVal === head && voteVal === vote){

        let index = DS.indexOf(ds);

        if(index !== -1){

          let start = 3 + index*3;

          for(let i=0;i<3;i++){
            let cell = cells[start+i];

            cell.classList.add("highlight-cell");

            cell.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center"
            });
          }
        }

        found = true;
      }
    }
  });

  if(!found){
    alert("Not found");
  }

  // auto remove highlight after 1 min
  if(highlightTimer){
    clearTimeout(highlightTimer);
  }

  highlightTimer = setTimeout(()=>{
    document.querySelectorAll(".highlight-cell").forEach(c=>{
      c.classList.remove("highlight-cell");
    });
  }, 60000);
}

/* =========================
   MODE CONTROL
========================= */
function toggleMode(type){
  if(type === "add"){
    addMode = document.getElementById("addMode").checked;
    if(addMode){
      minzeMode = false;
      document.getElementById("minzeMode").checked = false;
    }
  }

  if(type === "minze"){
    minzeMode = document.getElementById("minzeMode").checked;
    if(minzeMode){
      addMode = false;
      document.getElementById("addMode").checked = false;
    }
  }
}

/* =========================
   HEADER RIGHT CLICK
========================= */
function handleHeaderRightClick(e, ds){
  e.preventDefault();
  e.stopPropagation();

  if(ds === "Total Allocation") return;

  selectedDS = { ds: ds };
  document.getElementById("dateModal").style.display = "flex";
}

/* =========================
   DATA LOAD
========================= */
async function loadRows(){
  let { data, error } = await supabaseClient.from("rows").select("*");
  if(error){ console.log(error); return []; }
  return data || [];
}

async function getCurrentFile(){

  let user = localStorage.getItem("currentUser");
  let id = localStorage.getItem("currentFile");

  if(!user){
    console.log("User missing");
    return null;
  }

  let { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", user)
    .eq("id", id)
    .single();

  if(error){
    console.log(error);
    return null;
  }

  return data.data;
}

async function saveFile(file){

  let user = localStorage.getItem("currentUser");

  let { error } = await supabaseClient
    .from("files")
    .update({ data: file })
    .eq("user_email", user)
    .eq("id", file.id);

  if(error){
    console.log(error);
    alert("Save failed");
  }
}

/* =========================
   FORMAT
========================= */
function formatRs(val){
  return "Rs. " + Number(val || 0).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* =========================
   VOTE CODE
========================= */
function getVoteCode(vote){
  let matches = vote?.match(/\d{4}/g);
  return matches ? matches[matches.length - 1] : "";
}

/* =========================
   SUMMARY
========================= */
function calculateFullSummary(rows, given, used){

  let summary = {
    "1001":{}, "1002":{}, "1003":{},
    "recurrent":{}, "capital":{}, "total":{}
  };

  Object.keys(summary).forEach(t=>{
    DS.forEach(col=>{
      summary[t][col] = { g:0, u:0 };
    });
  });

  rows.forEach((r,i)=>{

    let code = getVoteCode(r.vote);
    let type = null;

    if(code==="1001") type="1001";
    else if(code==="1002") type="1002";
    else if(code==="1003") type="1003";
    else if(code>=1000 && code<2000 && !["1001","1002","1003"].includes(code)) type="recurrent";
    else if(code>=2000 && code<3000) type="capital";

    if(!type) return;

    DS.forEach(col=>{

      let key = col+"_"+(i+1);

      let g = given[key] || 0;
      let u = used[key] || 0;

      if(col==="Total Allocation"){
        let sum=0;
        DS.forEach(c=>{
          if(c!=="Total Allocation"){
            sum += given[c+"_"+(i+1)] || 0;
          }
        });
        u = sum;
      }

      summary[type][col].g += g;
      summary[type][col].u += u;
    });
  });

  ["1001","1002","1003"].forEach(t=>{
    DS.forEach(col=>{
      summary["total"][col].g += summary[t][col].g;
      summary["total"][col].u += summary[t][col].u;
    });
  });

  return summary;
}

async function generateDSReport(){

  let day = document.getElementById("dateDay").value;
  let month = document.getElementById("dateMonth").value;
  let year = document.getElementById("dateYear").value;

  if(!day || !month || !year){
    alert("Fill all fields");
    return;
  }

  let targetDate = new Date(year, month-1, day).toLocaleDateString();

  let file = await getCurrentFile();
  let rows = await loadRows();

  let history = file.history || {};
   
  if(!selectedDS){
  alert("Select a DS first");
  return;
}

let ds = selectedDS.ds;

  let html = `
    <h3 style="text-align:center;">${ds}</h3>
    <h2 style="text-align:center;">DS Report (${targetDate})</h2>

    <table>
      <tr>
        <th>No</th>
        <th>Head</th>
        <th>Vote</th>
        <th>Allocation Today</th>
        <th>Expenditure (Up To Now)</th>
      </tr>
  `;

  for(let i=0;i<rows.length;i++){

  let key = ds + "_" + (i+1);
  let h = history[key] || { given: [], used: [] };

  let allocationToday = 0;
  let totalExpenditure = 0;

  // allocation (ONLY selected date)
  h.given?.forEach(x=>{
  if(x.date === targetDate){

    if(x.mode === "Added"){
      allocationToday += Number(x.amount);
    }
    else if(x.mode === "Minzed"){
      allocationToday -= Number(x.amount);
    }
    else if(x.mode === "Changed"){
      allocationToday = Number(x.amount);
    }

  }
});

h.used?.forEach(x=>{

  if(x.mode === "Added"){
    totalExpenditure += Number(x.amount);
  }
  else if(x.mode === "Minzed"){
    totalExpenditure -= Number(x.amount);
  }
  else if(x.mode === "Changed"){
    totalExpenditure = Number(x.amount);
  }

});

  if(allocationToday === 0 && totalExpenditure === 0) continue;

  html += `
    <tr>
      <td>${i+1}</td>
      <td>${rows[i].head}</td>
      <td>${rows[i].vote}</td>
      <td>${formatRs(allocationToday)}</td>
      <td>${formatRs(totalExpenditure)}</td>
    </tr>
  `;
}

  html += "</table>";

  localStorage.setItem("dsReportHTML", html);

  // 🔥 IMPORTANT FIX (no popup block)
  window.location.href = "ds-report.html";

  closeDateModal();
}

/* =========================
   RENDER
========================= */
async function render(){

  let rows = await loadRows();
  let file = await getCurrentFile();
  if(!file) return;

  let given = file.given || {};
  let used = file.used || {};

  let html = `
  <table>
  <tr>
    <th rowspan="2">No</th>
    <th rowspan="2">Head</th>
    <th rowspan="2">Vote</th>
    ${DS.map(d=>`
      <th colspan="3"
        oncontextmenu="handleHeaderRightClick(event,'${d}')">
        ${d}
      </th>`).join("")}
  </tr>
  <tr>
    ${DS.map(d=>`
      <th>${d==="Total Allocation"?"Received":"Allo/Distribution"}</th>
      <th>${d==="Total Allocation"?"Issued":"Expenditure"}</th>
      <th>Balance</th>
    `).join("")}
  </tr>
  `;

  for(let i=0;i<rows.length;i++){

    html += `<tr>
      <td>${i+1}</td>
      <td>${rows[i].head}</td>
      <td>${rows[i].vote}</td>
    `;

    DS.forEach(col=>{

      let key = col+"_"+(i+1);

      let g = given[key] || 0;
      let u = used[key] || 0;

      if(col==="Total Allocation"){
        let sum=0;
        DS.forEach(c=>{
          if(c!=="Total Allocation"){
            sum += given[c+"_"+(i+1)] || 0;
          }
        });
        u = sum;
      }

      html += `
        <td onclick="edit('${key}','given')" oncontextmenu="viewHistory(event,'${key}')">${formatRs(g)}</td>
        <td ${col==="Total Allocation"?"":`onclick="edit('${key}','used')"`} oncontextmenu="viewHistory(event,'${key}')">${formatRs(u)}</td>
        <td>${formatRs(g-u)}</td>
      `;
    });

    html += "</tr>";
  }

  let summary = calculateFullSummary(rows, given, used);

  html += `<tr><td colspan="${3+DS.length*3}"></td></tr>`;

  ["1001","1002","1003","total","recurrent","capital"].forEach(type=>{
    html += buildSummaryRow(type, summary[type]);
  });

  html += "</table>";

  document.getElementById("totals").innerHTML = html;
}

/* =========================
   SUMMARY ROW
========================= */
function buildSummaryRow(title, data){

  let row = `<tr>
    <td></td>
    <td>${title}</td>
    <td></td>
  `;

  DS.forEach(col=>{
    let g = data[col].g;
    let u = data[col].u;
    let b = g - u;

    row += `
      <td>${formatRs(g)}</td>
      <td>${formatRs(u)}</td>
      <td>${formatRs(b)}</td>
    `;
  });

  row += "</tr>";
  return row;
}

window.addEventListener("DOMContentLoaded", () => {

  let dsBtn = document.getElementById("searchDS");

  if(dsBtn){
    dsBtn.addEventListener("click", toggleDropdown);
  }

});

/* =========================
   HISTORY
========================= */
function viewHistory(e, key){
  if(e) e.preventDefault();
  localStorage.setItem("historyKey", key);
  window.location = "item-history.html";
}

function edit(key, type){

  currentKey = key;
  currentType = type;

  document.getElementById("modalInput").value = "";
  document.getElementById("modalTitle").innerText =
    (type === "given" ? "Enter Allocation" : "Enter Expenditure");

  document.getElementById("modal").style.display = "flex";
}

async function saveModal(){

  let val = Number(document.getElementById("modalInput").value);
  if(isNaN(val)){
    closeModal();
    return;
  }

  let file = await getCurrentFile();

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};
  if(!file.history) file.history = {};

  if(!file.history[currentKey]){
    file.history[currentKey] = { given: [], used: [] };
  }

  let current = currentType === "given"
    ? (file.given[currentKey] || 0)
    : (file.used[currentKey] || 0);

  let newValue = val;
  let mode = "Changed";

  if(addMode){
    newValue = current + val;
    mode = "Added";
  }
  else if(minzeMode){
    newValue = current - val;
    mode = "Minzed";
  }

  if(currentType === "given"){
    file.given[currentKey] = newValue;
  }else{
    file.used[currentKey] = newValue;
  }

  file.history[currentKey][currentType].push({
    amount: val,
    mode: mode,
    date: new Date().toLocaleDateString()
  });

  await saveFile(file);

  closeModal();
  render();
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

async function exportExcel(){

  let file = await getCurrentFile();

  if(!file){
    alert("No file found");
    return;
  }

  let rows = await loadRows();

  let given = file.given || {};
  let used = file.used || {};

  let wb = XLSX.utils.book_new();

  /* =========================
     HELPER
  ========================= */

  function getRowData(i, cols){

    let row = [
      i + 1,
      rows[i]?.head || "",
      rows[i]?.vote || ""
    ];

    cols.forEach(col=>{

      let key = col + "_" + (i+1);

      let g = given[key] || 0;
      let u = used[key] || 0;

      // TOTAL ALLOCATION AUTO CALC
      if(col === "Total Allocation"){

        let total = 0;

        DS.forEach(c=>{
          if(c !== "Total Allocation"){
            total += given[c+"_"+(i+1)] || 0;
          }
        });

        u = total;
      }

      row.push(g);
      row.push(u);
      row.push(g - u);
    });

    return row;
  }

  /* =========================
     BUILD SHEET
  ========================= */

  function buildSheet(name, cols){

    let data = [];

    function addHeaders(){

      let h1 = [
        "No",
        "Head",
        "Vote",
        ...cols.flatMap(c=>[c,"",""])
      ];

      let h2 = [
        "",
        "",
        "",
        ...cols.flatMap(c=>[
          c === "Total Allocation"
            ? "Received"
            : "Allo/Distribution",

          c === "Total Allocation"
            ? "Issued"
            : "Expenditure",

          "Balance"
        ])
      ];

      data.push(h1);
      data.push(h2);
    }

    addHeaders();

    let chunkSize = 40;

    for(let start=0; start<rows.length; start += chunkSize){

      let end = Math.min(start + chunkSize, rows.length);

      for(let i=start; i<end; i++){
        data.push(getRowData(i, cols));
      }

      // repeat headers
      if(end < rows.length){

        for(let s=0; s<3; s++){
          data.push([]);
        }

        addHeaders();
      }
    }

    /* =========================
       SUMMARY
    ========================= */

    let summary = calculateFullSummary(rows, given, used);

    data.push([]);
    data.push([]);

    ["1001","1002","1003","total","recurrent","capital"]
    .forEach(type=>{

      let row = ["", type, ""];

      cols.forEach(col=>{

        let g = summary[type][col].g;
        let u = summary[type][col].u;
        let b = g - u;

        row.push(g);
        row.push(u);
        row.push(b);
      });

      data.push(row);
    });

    /* =========================
       CREATE SHEET
    ========================= */

    let ws = XLSX.utils.aoa_to_sheet(data);

    /* =========================
       STYLING
    ========================= */

    for(let R=0; R<data.length; R++){

      for(let C=0; C<(data[R]?.length || 0); C++){

        let ref = XLSX.utils.encode_cell({r:R,c:C});

        let cell = ws[ref];

        if(!cell) continue;

        let isHeader1 = data[R][0] === "No";
        let isHeader2 = R>0 && data[R-1]?.[0] === "No";

        let isEmpty =
          !data[R] ||
          data[R].every(v => v === "" || v === undefined);

        if(isEmpty){
          cell.s = {};
          continue;
        }

        cell.s = {
          border:{
            top:{style:"thin"},
            bottom:{style:"thin"},
            left:{style:"thin"},
            right:{style:"thin"}
          },

          alignment:{
            horizontal:
              (isHeader1 || isHeader2)
                ? "center"
                : (C >= 3 ? "right" : "left"),

            vertical:"center"
          }
        };

        // HEADER 1
        if(isHeader1){

          cell.s.fill = {
            fgColor:{rgb:"BFBFBF"}
          };

          cell.s.font = {
            bold:true
          };
        }

        // HEADER 2
        if(isHeader2){

          cell.s.fill = {
            fgColor:{rgb:"808080"}
          };

          cell.s.font = {
            bold:true
          };
        }

        // BALANCE COLUMN
        if(C >= 3 && ((C-3)%3===2)){

          cell.s.fill = {
            fgColor:{rgb:"E7E7E7"}
          };
        }

        // SUMMARY ROWS
        let name = data[R]?.[1];

        if(
          name === "total" ||
          name === "capital"
        ){

          cell.s.fill = {
            fgColor:{rgb:"A6A6A6"}
          };

          cell.s.font = {
            bold:true
          };
        }

        // number format
        if(C >= 3){
          cell.z = '#,##0.00';
        }
      }
    }

    /* =========================
       WIDTHS
    ========================= */

if(name === "FT"){

  // FULL TABLE
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },

    ...Array(cols.length).flatMap(() => [
      { wch: 60 },
      { wch: 60 },
      { wch: 60 }
    ])
  ];

}else{

  // TA + SINGLE DS
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },

    ...Array(cols.length).flatMap(() => [
      { wch: 90 },
      { wch: 90 },
      { wch: 90 }
    ])
  ];

}

    /* =========================
       MERGES
    ========================= */

    let merges = [];

    for(let i=0;i<data.length;i++){

      if(data[i][0] === "No"){

        // merge main headers
        for(let j=0;j<cols.length;j++){

          let start = 3 + (j*3);

          merges.push({
            s:{r:i,c:start},
            e:{r:i,c:start+2}
          });
        }

        merges.push(
          {s:{r:i,c:0},e:{r:i+1,c:0}},
          {s:{r:i,c:1},e:{r:i+1,c:1}},
          {s:{r:i,c:2},e:{r:i+1,c:2}}
        );
      }
    }

    ws['!merges'] = merges;

    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  /* =========================
     FULL TABLE
  ========================= */

  buildSheet("FT", DS);

  /* =========================
     TOTAL ALLOCATION
  ========================= */

  buildSheet("TA", ["Total Allocation"]);

  /* =========================
     GROUPED DS SHEETS
  ========================= */

  let pureDS = DS.filter(d => d !== "Total Allocation");

pureDS.forEach(ds=>{

  let sheetName = ds.substring(0, 31); // excel limit

  buildSheet(sheetName, [ds]);

});

  /* =========================
     SAVE
  ========================= */

  XLSX.writeFile(wb, file.name + ".xlsx");
}

/* =========================
   NAV
========================= */
function goBack(){ history.back(); }
function goDashboard(){ window.location="dashboard.html"; }
