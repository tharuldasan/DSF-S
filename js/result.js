let currentKey = "";
let currentType = "";
let lastSearch = null;
let highlightTimer = null;

const DS = [
  "Ds","Kalutara","Panadura","Bandaragama","Agalawatta",
  "Beruwala","Bulathsinhala","Dodangoda","Horana",
  "Madurawala","Millaniya","Palindanuwara",
  "Matugama","Walallawita","Ingiriya"
];

/* FILE */
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

/* FORMAT */
function formatRs(val){
  return "Rs. " + Number(val).toLocaleString(undefined,{minimumFractionDigits:2});
}

/* RENDER */
function render(){
  let file = getCurrentFile();
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
  ${DS.map(()=>`
    <th>Allo/Distribution</th>
    <th>Expenditure</th>
    <th>Balance</th>
  `).join("")}
</tr>
`;
  for(let i=1;i<=100;i++){

    html += `<tr>
      <td>${i}</td>
      <td>${i}</td>
      <td>${i}</td>
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
function exportExcel(){
  let file = getCurrentFile();
  let data = [];

  let header1 = [
    "No","Head","Vote",
    ...DS.flatMap(d => [d,"",""])
  ];

  let header2 = [
    "","","",
    ...DS.flatMap(() => ["Allo/Distribution","Expenditure","Balance"])
  ];

  data.push(header1);
  data.push(header2);

  for(let i=1;i<=100;i++){

    let row = [
      i,
      i,
      i
    ];

    DS.forEach(col=>{
      let key = col + "_" + i;

      let g = file.given[key] || 0;
      let u = file.used[key] || 0;

      row.push(g, u, g-u);
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
