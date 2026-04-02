const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentKey = "";
let currentType = "";
let lastSearch = null;
let highlightTimer = null;

const DS = [
  "Total Allocation", // ✅ NEW FIRST
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];

function getVoteCode(vote){
  if(!vote) return "";
  let parts = vote.split("-");
  return parts[parts.length - 1]; // last part
}

function calculateSummary(rows, given){

  let result = {
    "1001": {},
    "1002": {},
    "1003": {},
    "recurrent": {},
    "capital": {},
    "total": {}
  };

  rows.forEach((r, index)=>{

    let code = getVoteCode(r.vote);

    DS.forEach(col=>{
      let key = col + "_" + (index+1);
      let val = given[key] || 0;

      function add(type){
        result[type][col] = (result[type][col] || 0) + val;
      }

      if(code === "1001") add("1001");
      else if(code === "1002") add("1002");
      else if(code === "1003") add("1003");

      else if(Number(code) >= 1000 && Number(code) < 2000 &&
              !["1001","1002","1003"].includes(code)){
        add("recurrent");
      }

      else if(Number(code) >= 2000 && Number(code) < 3000){
        add("capital");
      }
    });

  });

  // total = 1001 + 1002 + 1003
  ["1001","1002","1003"].forEach(type=>{
    DS.forEach(col=>{
      result["total"][col] =
        (result["total"][col] || 0) + (result[type][col] || 0);
    });
  });

  return result;
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
    ${DS.map(d=>`<th colspan="3">${d}</th>`).join("")}
  </tr>
  <tr>
    ${DS.map(d=>`
      <th>${d === "Total Allocation" ? "Received" : "Allo/Distribution"}</th>
      <th>${d === "Total Allocation" ? "Issued" : "Expenditure"}</th>
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

    let summary = calculateSummary(rows, given);

    for(let k=0;k<3;k++){
  html += `<tr><td colspan="${3 + DS.length*3}"></td></tr>`;
}

    html += "</tr>";
  }

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

  let file = await getCurrentFile(); // ✅ FIXED

  if(!file){
    alert("No file found");
    return;
  }

  let data = [];

  /* HEADER 1 */
  let header1 = [
    "No","Head","Vote",
    ...DS.flatMap(d => [d,"",""])
  ];

  /* HEADER 2 (FIXED FOR TOTAL ALLOCATION) */
  let header2 = [
    "","","",
    ...DS.flatMap(d => [
      d === "Total Allocation" ? "Received" : "Allo/Distribution",
      d === "Total Allocation" ? "Issued" : "Expenditure",
      "Balance"
    ])
  ];

  data.push(header1);
  data.push(header2);

  /* DATA */
  let rows = await loadRows(); // ✅ FROM SUPABASE

  for(let i=0;i<rows.length;i++){
    
  let row = [
    i+1,
    rows[i]?.head || "",
    rows[i]?.vote || ""
  ];

    DS.forEach(col=>{

  let key = col + "_" + (i+1);

  let g = file.given?.[key] || 0;
  let u = file.used?.[key] || 0;

  /* 🔥 AUTO CALC FOR TOTAL ALLOCATION */
  if(col === "Total Allocation"){

    let totalGiven = 0;

    DS.forEach(c=>{
      if(c !== "Total Allocation"){
        let k = c + "_" + (i+1);
        totalGiven += file.given?.[k] || 0;
      }
    });

    u = totalGiven; // ✅ FIX
  }

  row.push(g, u, g - u);
});

    data.push(row);
  }

  let ws = XLSX.utils.aoa_to_sheet(data);

  /* WIDTH */
  ws['!cols'] = [
    {wch:6},{wch:20},{wch:20},
    ...Array(DS.length*3).fill({wch:14})
  ];

  /* MERGES */
  let merges = [];

  for(let i=0;i<DS.length;i++){
    let start = 3 + i*3;
    merges.push({s:{r:0,c:start}, e:{r:0,c:start+2}});
  }

  merges.push(
    {s:{r:0,c:0},e:{r:1,c:0}},
    {s:{r:0,c:1},e:{r:1,c:1}},
    {s:{r:0,c:2},e:{r:1,c:2}}
  );

  ws['!merges'] = merges;

  /* STYLE */
  for(let R=0; R<data.length; R++){
    for(let C=0; C<data[0].length; C++){

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
          horizontal: (C>=3 ? "center" : "left"),
          vertical:"center"
        }
      };

      if(R===0 && C>=3){
        cell.s.fill = { fgColor:{rgb:"BFBFBF"} };
      }

      if(R===1 && C>=3){
        cell.s.fill = { fgColor:{rgb:"808080"} };
      }

      if((C-3)%3===2 && C>=3){
        cell.s.fill = { fgColor:{rgb:"D9D9D9"} };
      }

      if(R>=2 && C>=3){
        cell.z = "#,##0.00";
        cell.s.alignment.horizontal = "right";
      }
    }
  }

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

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

function viewHistory(e, key){
  e.preventDefault(); // stop browser menu

  localStorage.setItem("historyKey", key);

  window.location = "item-history.html";
}
