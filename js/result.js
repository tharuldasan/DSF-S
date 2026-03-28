let files = JSON.parse(localStorage.getItem("files")||"[]");
let currentId = localStorage.getItem("currentFile");

let file = files.find(f => f.id === currentId);

let given = file.given;
let used = file.used;

let level = "main";
let current = "";

let currentKey = "";
let currentType = "";

function formatRs(num){
  return "Rs. " + num.toLocaleString(undefined, {minimumFractionDigits:2});
}

function render(){
  let div = document.getElementById("totals");

  let html = `
    <table>
      <tr>
        <th>Category</th>
        <th>Sub</th>
        <th>Item</th>
        <th>Given</th>
        <th>Used</th>
        <th>Balance</th>
      </tr>
  `;

  if(level === "main"){
    ["A","B","C","D","E"].forEach(letter=>{
      let g=0,u=0;

      for(let k in given){
        if(k.startsWith(letter)){
          g += given[k];
          u += used[k];
        }
      }

      html += `
        <tr class="clickable" onclick="goLevel('${letter}')">
          <td>${letter}</td>
          <td></td>
          <td></td>
          <td>${formatRs(g)}</td>
          <td>${formatRs(u)}</td>
          <td>${formatRs(g-u)}</td>
        </tr>
      `;
    });
  }

  else if(level === "A"){
    for(let i=1;i<=5;i++){
      let key = current + i;
      let g=0,u=0;

      for(let k in given){
        if(k.startsWith(key)){
          g += given[k];
          u += used[k];
        }
      }

      html += `
        <tr class="clickable" onclick="goLevel('${key}')">
          <td>${current}</td>
          <td>${key}</td>
          <td></td>
          <td>${formatRs(g)}</td>
          <td>${formatRs(u)}</td>
          <td>${formatRs(g-u)}</td>
        </tr>
      `;
    }
  }

  else if(level === "A1"){
    for(let j=1;j<=5;j++){
      let key = current + "." + j;
      let g = given[key] || 0;
      let u = used[key] || 0;

      html += `
        <tr>
          <td>${current[0]}</td>
          <td>${current}</td>
          <td>${key}</td>

          <td class="clickable" onclick="edit('${key}','given')">
            ${formatRs(g)}
          </td>

          <td class="clickable" onclick="edit('${key}','used')">
            ${formatRs(u)}
          </td>

          <td>${formatRs(g-u)}</td>
        </tr>
      `;
    }
  }

  html += "</table>";
  div.innerHTML = html;
}

function goLevel(val){
  if(val.length === 1){
    level = "A";
  }else{
    level = "A1";
  }
  current = val;
  render();
}

function goBack(){
  if(level === "A1"){
    level = "A";
    current = current[0];
  }else if(level === "A"){
    level = "main";
    current = "";
  }
  render();
}

/* MODAL */
function edit(key,type){
  currentKey = key;
  currentType = type;

  document.getElementById("modalTitle").innerText = "Enter " + type + " for " + key;
  document.getElementById("modalInput").value = "";

  document.getElementById("modal").style.display = "flex";
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
}

function saveModal(){
  let value = Number(document.getElementById("modalInput").value) || 0;

  if(currentType === "given"){
    given[currentKey] = value;
  }else{
    used[currentKey] = value;
  }

  let files = JSON.parse(localStorage.getItem("files")||"[]");
  let index = files.findIndex(f => f.id === currentId);

  files[index].given = given;
  files[index].used = used;

  localStorage.setItem("files", JSON.stringify(files));

  closeModal();
  render();
}

/* EXPORT FIXED FORMAT */
function exportExcel(){
  let data = [];

  ["A","B","C","D","E"].forEach(letter=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){

        let key = `${letter}${i}.${j}`;

        let g = given[key] || 0;
        let u = used[key] || 0;
        let b = g - u;

        data.push({
          Category: letter,
          Sub: letter + i,
          Item: key,
          Given: formatRs(g),
          Used: formatRs(u),
          Balance: formatRs(b)
        });

      }
    }
  });

  let ws = XLSX.utils.json_to_sheet(data);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Accounting");

  XLSX.writeFile(wb, file.name + ".xlsx");
}

function save(){
  alert("Saved!");
}

function goDashboard(){
  window.location = "dashboard.html";
}

render();
