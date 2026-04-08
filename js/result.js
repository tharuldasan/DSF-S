const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentKey = "";
let currentType = "";
let lastSearch = null;
let highlightTimer = null;
let selectedDS = null;

const DS = [
  "Total Allocation", // ✅ NEW FIRST
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];


function handleHeaderRightClick(e, ds){
  e.preventDefault();
  e.stopPropagation();

  if(ds === "Total Allocation") return;

  selectedDS = { ds };

  document.getElementById("dateModal").style.display = "flex";
}

function openDateModal(e, ds, row){
  e.preventDefault();

  if(ds === "Total Allocation") return; // only DS

  selectedDS = { ds, row };

  document.getElementById("dateModal").style.display = "flex";
}

function closeDateModal(){
  document.getElementById("dateModal").style.display = "none";
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
  let ds = selectedDS.ds;

  let html = `
   <h2>${ds} DS Report (${targetDate})</h2>

    <table>
      <tr>
        <th>No</th>
        <th>Head</th>
        <th>Vote</th>
        <th>Allo</th>
        <th>Expenditure</th>
        <th>Balance</th>
      </tr>
  `;

  for(let i=0;i<rows.length;i++){

    let key = ds + "_" + (i+1);
    let h = history[key];

    if(!h) continue;

    let g = 0;
    let u = 0;

    h.given.forEach(x=>{
      if(x.date === targetDate) g += x.amount;
    });

    h.used.forEach(x=>{
      if(x.date === targetDate) u += x.amount;
    });

    if(g === 0 && u === 0) continue;

    html += `
      <tr>
        <td>${i+1}</td>
        <td>${rows[i].head}</td>
        <td>${rows[i].vote}</td>
        <td>${formatRs(g)}</td>
        <td>${formatRs(u)}</td>
        <td>${formatRs(g-u)}</td>
      </tr>
    `;
  }

  html += "</table>";

  localStorage.setItem("dsReportHTML", html);
  localStorage.setItem("dsReportName", ds);

  window.open("ds-report.html", "_blank");

  closeDateModal();
}

function handleRightClick(e, ds, row){
  e.preventDefault();
  e.stopPropagation(); // 🔥 VERY IMPORTANT

  if(ds === "Total Allocation") return;

  selectedDS = { ds, row };

  document.getElementById("dateModal").style.display = "flex";
}

function getVoteCode(vote){

  if(!vote) return "";

  // 🔥 find ALL 4-digit numbers in string
  let matches = vote.match(/\d{4}/g);

  // ❌ if none → ignore this row
  if(!matches) return "";

  // ✅ take LAST 4-digit number
  return matches[matches.length - 1];
}

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

  /* 🔥 FIXED TOTAL = ONLY 1001+1002+1003 */
  ["1001","1002","1003"].forEach(t=>{
    DS.forEach(col=>{
      summary["total"][col].g += summary[t][col].g;
      summary["total"][col].u += summary[t][col].u;
    });
  });

  return summary;
}

function calculateFinalTotal(rows, given){

  let totalReceived = 0;
  let totalBalance = 0;

  rows.forEach((r, i)=>{

    let code = getVoteCode(r.vote);

    if(["1001","1002","1003"].includes(code)){

      let rowSum = 0;

      DS.forEach(col=>{
        if(col !== "Total Allocation"){
          let key = col + "_" + (i+1);
          rowSum += given[key] || 0;
        }
      });

      totalReceived += rowSum;

      // balance = received - issued
      // issued = rowSum → so balance = 0 normally
      // but we calculate manually anyway
      let rowBalance = 0;

// calculate real balance from DS
DS.forEach(col=>{
  if(col !== "Total Allocation"){
    let key = col + "_" + (i+1);
    let g = given[key] || 0;
    let u = 0; // DS has no used stored here
    rowBalance += (g - u);
  }
});

totalBalance += rowBalance;
    }

  });

  return {
    received: totalReceived,
    balance: totalBalance
  };
}

async function loadRows(){

  const { data: sessionData } = await supabaseClient.auth.getSession();
  let userEmail = sessionData.session.user.email;

  let { data, error } = await supabaseClient
    .from("rows")
    .select("*")
    
  if(error){
    console.log(error);
    return [];
  }

  return data || [];
}

/* FILE */
async function getCurrentFile(){

  let user = localStorage.getItem("user");
  let id = localStorage.getItem("currentFile");

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

  const { data: sessionData } = await supabaseClient.auth.getSession();
  let userEmail = sessionData.session.user.email;

  let { error } = await supabaseClient
    .from("files")
    .update({ data: file })
    .eq("user_email", userEmail)
    .eq("id", file.id);

  if(error){
    console.log(error);
    alert("Save failed");
  }
}

/* FORMAT */
function formatRs(val){
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

function buildFullSummaryRow(title, data){

  let dark = (title==="total" || title==="capital");

  let row = `<tr class="${dark?'dark-row':''}">
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
      <td class="balance-cell">${formatRs(b)}</td>
    `;
  });

  row += "</tr>";
  return row;
}

/* RENDER */
async function render(){

  let rows = await loadRows(); // ✅ ONLY ONCE
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
  </th>
    `).join("")}
  </tr>
  <tr>
    ${DS.map(d=>`
      <th>${d === "Total Allocation" ? "Received" : "Allo/Distribution"}</th>
      <th>${d === "Total Allocation" ? "Issued" : "Expenditure"}</th>
      <th>Balance</th>
    `).join("")}
  </tr>
  `;

  let summary = calculateFullSummary(rows, given, used);
  
  for(let i=0;i<rows.length;i++){

    html += `<tr>
      <td>${i+1}</td>
      <td>${rows[i].head}</td>
      <td>${rows[i].vote}</td>
    `;

    DS.forEach(col=>{

  let key = col + "_" + (i+1);

  let g = given[key] || 0;
  let u = used[key] || 0;

  /* 🔥 AUTO CALC FOR TOTAL ALLOCATION */
  if(col === "Total Allocation"){

    let totalGiven = 0;

    DS.forEach(c=>{
      if(c !== "Total Allocation"){
        let k = c + "_" + (i+1);
        totalGiven += given[k] || 0;
      }
    });

    u = totalGiven; // 🔥 SET ISSUED = SUM
  }

  html += `
    <td class="clickable"
      onclick="edit('${key}','given')"
      oncontextmenu="viewHistory(event,'${key}')">
      ${formatRs(g)}
  </td>

  <td class="clickable"
      ${col === "Total Allocation" ? "" : `onclick="edit('${key}','used')"` }
      oncontextmenu="viewHistory(event,'${key}')">
      ${formatRs(u)}
  </td>

    <td class="balance-cell">${formatRs(g-u)}</td>
  `;
});

    html += "</tr>";
  }

  // SPACE
for(let i=0;i<3;i++){
  html += `<tr><td colspan="${3 + DS.length*3}"></td></tr>`;
}

// FULL SUMMARY ROWS
html += buildFullSummaryRow("1001", summary["1001"]);
html += buildFullSummaryRow("1002", summary["1002"]);
html += buildFullSummaryRow("1003", summary["1003"]);
html += buildFullSummaryRow("total", summary["total"]);
html += buildFullSummaryRow("recurrent", summary["recurrent"]);
html += buildFullSummaryRow("capital", summary["capital"]);
  
  html += "</table>";

  document.getElementById("totals").innerHTML = html;

  applyHighlight();
}
/* EDIT */
function edit(key,type){
  currentKey = key;
  currentType = type;

  document.getElementById("modalTitle").innerText = key;
  document.getElementById("modalInput").value = "";
  document.getElementById("modal").style.display = "flex";
}

async function saveModal(){

  let val = Number(document.getElementById("modalInput").value);
  if(isNaN(val)) return closeModal();

  let file = await getCurrentFile();

  let addMode = document.getElementById("plusToggle").checked;

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};
  if(!file.history) file.history = {};

  let key = currentKey;

  // 🔥 INIT STRUCTURE
  if(!file.history[key]){
    file.history[key] = {
      given: [],
      used: []
    };
  }

  // 🔥 SAVE VALUE
  if(addMode){
    file[currentType][key] =
      (file[currentType][key] || 0) + val;
  }else{
    file[currentType][key] = val;
  }

  // 🔥 SAVE HISTORY
  file.history[key][currentType].push({
    amount: val,
    mode: addMode ? "Added" : "Set",
    date: new Date().toLocaleDateString()
  });

  await saveFile(file);

  closeModal();
  render();
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

/* SEARCH */
function openSearch(){
  document.getElementById("searchModal").style.display = "flex";
}

function closeSearch(){
  document.getElementById("searchModal").style.display = "none";
}

function doSearch(){
  let head = document.getElementById("searchHead").value.trim();
  let vote = document.getElementById("searchVote").value.trim();
  let ds = document.getElementById("searchDS").innerText;

  lastSearch = { head, vote, ds }; // ✅ save search

  applyHighlight();

  closeSearch();
}

/* POPUP */
function showPopup(msg){
  document.getElementById("popupText").innerText = msg;
  document.getElementById("popup").style.display = "flex";
}

function closePopup(){
  document.getElementById("popup").style.display = "none";
}

/* NAV */
function goBack(){ history.back(); }
function goDashboard(){ window.location.href="dashboard.html"; }

/* 🔥 FULL EXCEL EXPORT (UPDATED STRUCTURE) */
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
     🔥 HELPER FUNCTIONS
  ========================= */

  function getRowData(i, cols){

    let row = [
      i+1,
      rows[i]?.head || "",
      rows[i]?.vote || ""
    ];

    cols.forEach(col=>{

      let key = col + "_" + (i+1);

      let g = given[key] || 0;
      let u = used[key] || 0;

      if(col === "Total Allocation"){
        let sum=0;
        DS.forEach(c=>{
          if(c!=="Total Allocation"){
            sum += given[c+"_"+(i+1)] || 0;
          }
        });
        u = sum;
      }

      row.push(g, u, g-u);
    });

    return row;
  }

function buildSheet(name, cols){

  let data = [];

  /* 🔥 HEADER CREATOR */
  function addHeaders(){

    let header1 = [
      "No","Head","Vote",
      ...cols.flatMap(c => [c,"",""])
    ];

    let header2 = [
      "","","",
      ...cols.flatMap(c => [
        c === "Total Allocation" ? "Received" : "Allo/Distribution",
        c === "Total Allocation" ? "Issued" : "Expenditure",
        "Balance"
      ])
    ];

    data.push(header1);
    data.push(header2);
  }

  /* FIRST HEADER */
  addHeaders();

  let chunkSize = 40;

  /* 🔥 SPLIT INTO 50 ROW BLOCKS */
  for(let start=0; start<rows.length; start+=chunkSize){

    let end = Math.min(start+chunkSize, rows.length);

    for(let i=start;i<end;i++){
      data.push(getRowData(i, cols));
    }

    /* ADD GAP + HEADER (NOT LAST BLOCK) */
    if(end < rows.length){

      for(let s=0;s<5;s++){
        data.push([]);
      }

      addHeaders(); // repeat header
    }
  }

  /* 🔥 SUMMARY */
  let summary = calculateFullSummary(rows, given, used);

  data.push([]);
  data.push([]);

  ["1001","1002","1003","total","recurrent","capital"].forEach(type=>{

    let row = ["", type, ""];

    cols.forEach(col=>{
      let g = summary[type][col].g;
      let u = summary[type][col].u;
      let b = g - u;

      row.push(g, u, b);
    });

    data.push(row);
  });

  /* CREATE SHEET */
  let ws = XLSX.utils.aoa_to_sheet(data);

  /* =========================
     🔥 STYLE (FIXED + CLEAN)
  ========================= */

  for(let R=0; R<data.length; R++){
    for(let C=0; C<(data[R]?.length || 0); C++){

      let ref = XLSX.utils.encode_cell({r:R,c:C});
      let cell = ws[ref];
      if(!cell) continue;

      let isEmptyRow = !data[R] || data[R].every(v => v === "" || v === undefined);

      let isHeader1 = data[R][0] === "No";
      let isHeader2 = (R > 0 && data[R-1]?.[0] === "No");

      let isDataRow = !isEmptyRow && !isHeader1 && !isHeader2;

      /* SKIP EMPTY ROWS */
      if(isEmptyRow){
        cell.s = {};
        continue;
      }

      /* BASE STYLE */
      cell.s = {
        border:{
          top:{style:"thin"},
          bottom:{style:"thin"},
          left:{style:"thin"},
          right:{style:"thin"}
        }
      };

      /* 🔥 ALIGNMENT */
      cell.s.alignment = {
        horizontal: (isHeader1 || isHeader2)
          ? "center"
          : (C>=3 ? "right" : "left"),
        vertical: "center"
      };

      /* HEADER COLORS */
      if(isHeader1){
        cell.s.fill = { fgColor:{rgb:"BFBFBF"} };
        cell.s.font = { bold:true };
      }

      if(isHeader2){
        cell.s.fill = { fgColor:{rgb:"808080"} };
        cell.s.font = { bold:true };
      }

      /* BALANCE COLUMN */
      if((C-3)%3===2 && C>=3){
        cell.s.fill = { fgColor:{rgb:"D9D9D9"} };
      }

      /* NUMBER FORMAT */
      if(isDataRow && C>=3){
        cell.z = "#,##0.00";
      }

      /* DARK ROWS */
      let name = data[R]?.[1];
      if(name === "total" || name === "capital"){
        cell.s.fill = cell.s.fill || {};
        cell.s.fill.fgColor = { rgb:"A6A6A6" };
        cell.s.font = { bold:true };
      }
    }
  }

  /* =========================
     🔥 WIDTH
  ========================= */
  ws['!cols'] = [
    {wch:6},
    {wch:10},
    {wch:20},
    ...Array(cols.length*3).fill({wch:15})
  ];

  /* =========================
     🔥 MERGES (FOR EACH HEADER BLOCK)
  ========================= */
  let merges = [];

  for(let i=0;i<data.length;i++){

    if(data[i][0] === "No"){

      for(let j=0;j<cols.length;j++){
        let start = 3 + j*3;
        merges.push({s:{r:i,c:start}, e:{r:i,c:start+2}});
      }

      merges.push(
        {s:{r:i,c:0},e:{r:i+1,c:0}},
        {s:{r:i,c:1},e:{r:i+1,c:1}},
        {s:{r:i,c:2},e:{r:i+1,c:2}}
      );
    }
  }

  ws['!merges'] = merges;

  /* ADD TO WORKBOOK */
  XLSX.utils.book_append_sheet(wb, ws, name);
}

  /* =========================
     🔥 SHEET 1 — FULL TABLE
  ========================= */

  buildSheet("FT", DS);

  /* =========================
     🔥 SHEET 2 — TA ONLY
  ========================= */

  buildSheet("TA", ["Total Allocation"]);

  /* =========================
     🔥 GROUP DS (3 EACH)
  ========================= */

  let pureDS = DS.filter(d => d !== "Total Allocation");

  for(let i=0;i<pureDS.length;i+=3){

    let group = pureDS.slice(i, i+3);

    let name = group.map(d => d.substring(0,2)).join(""); // DKP style

    buildSheet(name, group);
  }

  /* SAVE */
  XLSX.writeFile(wb, file.name + ".xlsx");
}

function toggleDropdown(){
  let list = document.getElementById("dropdownList");

  if(list.classList.contains("show")){
    list.classList.remove("show"); // close
  }else{
    list.classList.add("show"); // open
  }
}

function selectDS(val){
  document.getElementById("searchDS").innerText = val;
  // ❌ DO NOT CLOSE HERE (removed)
}

function applyHighlight(){
  document.querySelectorAll(".highlight-cell").forEach(c=>{
  c.classList.remove("highlight-cell");
});

  if(!lastSearch) return;

  let { head, vote, ds } = lastSearch;

  // 🔥 clear previous highlights
  document.querySelectorAll(".highlight-cell").forEach(c=>{
    c.classList.remove("highlight-cell");
  });

  // 🔥 clear previous timer
  if(highlightTimer){
    clearTimeout(highlightTimer);
  }

  let found = false;

  let rows = document.querySelectorAll("#totals table tr");

  rows.forEach(row=>{
    let cells = row.children;

    if(cells.length > 3){

      let headVal = cells[1].innerText.trim();
      let voteVal = cells[2].innerText.trim();

      if(headVal == head && voteVal == vote){

        let index = DS.indexOf(ds);

        if(index !== -1){
          let start = 3 + index*3;

          for(let k=0;k<3;k++){
            let cell = cells[start+k];

            cell.classList.add("highlight-cell");

            // scroll to center
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
    showPopup("Couldn't find");
  }

  // 🔥 AUTO CLEAR AFTER 1 MINUTE
  highlightTimer = setTimeout(()=>{
    document.querySelectorAll(".highlight-cell").forEach(c=>{
      c.classList.remove("highlight-cell");
    });
    lastSearch = null;
  }, 60000); // 60000 ms = 1 minute
}

function viewHistory(e, key){
  e.preventDefault(); // stop browser menu

  localStorage.setItem("historyKey", key);

  window.location = "item-history.html";
}
