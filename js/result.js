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
let currentKey = "";
let currentType = "";
let lastSearch = null;
let highlightTimer = null;
let selectedDS = null;

let addMode = false;
let minzeMode = false;

const DS = [
  "Total Allocation",
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];

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

  let { data, error } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", user)
    .eq("id", id)
    .single();

  if(error){ console.log(error); return null; }
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
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* =========================
   VOTE CODE ANALYSIS
========================= */
function getVoteCode(vote){
  let matches = vote?.match(/\d{4}/g);
  return matches ? matches[matches.length - 1] : "";
}

/* =========================
   SUMMARY CALC
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

/* =========================
   EDIT SYSTEM (ADD/MINZE)
========================= */
async function edit(key, type){

  let val = prompt("Enter amount:");
  if(val === null) return;

  val = Number(val);
  if(isNaN(val)) return;

  let file = await getCurrentFile();

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};
  if(!file.history) file.history = {};

  if(!file.history[key]){
    file.history[key] = { given: [], used: [] };
  }

  let current = type==="given"
    ? (file.given[key]||0)
    : (file.used[key]||0);

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

  if(type==="given"){
    file.given[key] = newValue;
  }else{
    file.used[key] = newValue;
  }

  file.history[key][type].push({
    amount: val,
    mode: mode,
    date: new Date().toLocaleDateString()
  });

  await saveFile(file);
  render();
}

/* =========================
   RENDER TABLE
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
        <td class="clickable"
          onclick="edit('${key}','given')"
          oncontextmenu="viewHistory(event,'${key}')">
          ${formatRs(g)}
        </td>

        <td class="clickable"
          ${col==="Total Allocation"?"":`onclick="edit('${key}','used')"` }
          oncontextmenu="viewHistory(event,'${key}')">
          ${formatRs(u)}
        </td>

        <td class="balance-cell">${formatRs(g-u)}</td>
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

/* =========================
   HISTORY
========================= */
function viewHistory(e, key){
  e.preventDefault();
  localStorage.setItem("historyKey", key);
  window.location = "item-history.html";
}

/* =========================
   NAV
========================= */
function goBack(){ history.back(); }
function goDashboard(){ window.location="dashboard.html"; }      minzeMode = false;
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
   LOAD DATA
========================= */
async function loadRows(){

  let { data, error } = await supabaseClient
    .from("rows")
    .select("*");

  if(error){
    console.log(error);
    return [];
  }

  return data || [];
}

async function getCurrentFile(){

  let user = localStorage.getItem("currentUser");
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
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* =========================
   VOTE CODE
========================= */
function getVoteCode(vote){
  let matches = vote?.match(/\d{4}/g);
  return matches ? matches[matches.length - 1] : "";
}

/* =========================
   SUMMARY CALC
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
    else if(code>=1000 && code<2000) type="recurrent";
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

/* =========================
   EDIT SYSTEM
========================= */
async function edit(key, type){

  let val = prompt("Enter amount:");
  if(val === null) return;

  val = Number(val);
  if(isNaN(val)) return;

  let file = await getCurrentFile();

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};
  if(!file.history) file.history = {};

  if(!file.history[key]){
    file.history[key] = { given: [], used: [] };
  }

  let current = type==="given"
    ? (file.given[key]||0)
    : (file.used[key]||0);

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

  if(type==="given"){
    file.given[key] = newValue;
  }else{
    file.used[key] = newValue;
  }

  file.history[key][type].push({
    amount: val,
    mode: mode,
    date: new Date().toLocaleDateString()
  });

  await saveFile(file);
  render();
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
        <td class="clickable"
          onclick="edit('${key}','given')"
          oncontextmenu="viewHistory(event,'${key}')">
          ${formatRs(g)}
        </td>

        <td class="clickable"
          ${col==="Total Allocation"?"":`onclick="edit('${key}','used')"` }
          oncontextmenu="viewHistory(event,'${key}')">
          ${formatRs(u)}
        </td>

        <td class="balance-cell">${formatRs(g-u)}</td>
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

/* =========================
   HISTORY
========================= */
function viewHistory(e, key){
  e.preventDefault();
  localStorage.setItem("historyKey", key);
  window.location = "item-history.html";
}

/* =========================
   NAV
========================= */
function goBack(){ history.back(); }
function goDashboard(){ window.location="dashboard.html"; }
