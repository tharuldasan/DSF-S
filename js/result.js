let currentKey = "";
let currentType = "";

const DS = [
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];

function getCurrentFile(){
  let user = localStorage.getItem("currentUser");
  let files = JSON.parse(localStorage.getItem("files_" + user)||"[]");
  let id = localStorage.getItem("currentFile");
  return files.find(f => f.id === id);
}

function saveFile(file){
  let user = localStorage.getItem("currentUser");
  let files = JSON.parse(localStorage.getItem("files_" + user)||"[]");

  let index = files.findIndex(f => f.id === file.id);
  files[index] = file;

  localStorage.setItem("files_" + user, JSON.stringify(files));
}

function formatRs(val){
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* 🔥 RENDER */
function render(){
  let file = getCurrentFile();
  if(!file) return;

  let given = file.given || {};
  let used = file.used || {};

  let html = `
  <table>
    <tr>
      <th>No</th>
      <th>Head</th>
      <th>Vote</th>
      ${DS.map(d=>`<th colspan="3">${d}</th>`).join("")}
    </tr>
    <tr>
      <th></th><th></th><th></th>
      ${DS.map(()=>`
        <th>Allo</th>
        <th>Used</th>
        <th>Balance</th>
      `).join("")}
    </tr>
  `;

  for(let i=1;i<=100;i++){

    html += `<tr>
      <td>${i}</td>
      <td>Head ${i}</td>
      <td>Vote ${i}</td>
    `;

    DS.forEach(col=>{
      let key = col + "_" + i;

      let g = given[key] || 0;
      let u = used[key] || 0;

      html += `
      <td class="clickable" onclick="edit('${key}','given')">${formatRs(g)}</td>
      <td class="clickable" onclick="edit('${key}','used')">${formatRs(u)}</td>
      <td class="balance-cell">${formatRs(g-u)}</td>
      `;
    });

    html += "</tr>";
  }

  html += "</table>";

  document.getElementById("totals").innerHTML = html;
}

/* EDIT */
function edit(key,type){
  currentKey = key;
  currentType = type;

  document.getElementById("modalTitle").innerText = key;
  document.getElementById("modalInput").value = "";
  document.getElementById("modal").style.display = "flex";
}

function saveModal(){
  let val = Number(document.getElementById("modalInput").value);
  if(isNaN(val)) return closeModal();

  let file = getCurrentFile();
  let addMode = document.getElementById("plusToggle").checked;

  if(!file.given) file.given = {};
  if(!file.used) file.used = {};

  if(addMode){
    file[currentType][currentKey] =
      (file[currentType][currentKey] || 0) + val;
  }else{
    file[currentType][currentKey] = val;
  }

  saveFile(file);
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
  let head = document.getElementById("searchHead").value;
  let vote = document.getElementById("searchVote").value;
  let ds = document.getElementById("searchDS").value;

  let found = false;

  document.querySelectorAll("#totals td").forEach(td=>{
    td.style.background = ""; // reset
  });

  let rows = document.querySelectorAll("#totals table tr");

  rows.forEach(row=>{
    let cells = row.children;

    if(cells.length > 3){
      if(
        cells[1].innerText === head &&
        cells[2].innerText === vote
      ){
        row.style.background = "#fde68a";
        found = true;
      }
    }
  });

  closeSearch();

  if(!found){
    showPopup("Couldn't find");
  }
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

/* EXCEL (simple) */
function exportExcel(){
  alert("Excel export can be re-added later");
}
