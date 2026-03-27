let given = JSON.parse(localStorage.getItem("givenData")) || {};
let used  = JSON.parse(localStorage.getItem("usedData")) || {};

let historyStack = [];

function getTotals(prefix=""){
  let result = {};

  for(let key in given){
    if(key.startsWith(prefix)){
      let level;

      if(prefix === ""){
        level = key[0];
      } else if(prefix.length === 1){
        level = key.substring(1,2);
      } else {
        level = key;
      }

      if(!result[level]){
        result[level] = {given:0, used:0};
      }

      result[level].given += given[key] || 0;
      result[level].used  += used[key] || 0;
    }
  }

  return result;
}

function render(prefix=""){
  let totals = getTotals(prefix);
  let div = document.getElementById("totals");

  let html = `
    <table>
      <tr>
        <th>Category</th>
        <th>Given (LKR)</th>
        <th>Used (LKR)</th>
        <th>Balance</th>
      </tr>
  `;

  for(let k in totals){
    let g = totals[k].given;
    let u = totals[k].used;
    let b = g - u;

    let next;

    if(prefix === ""){
      next = k;
    } else if(prefix.length === 1){
      next = prefix + k;
    } else {
      next = k;
    }

    html += `
      <tr class="clickable" onclick="drill('${next}')">
        <td>${next}</td>
        <td>${g}</td>
        <td>${u}</td>
        <td>${b}</td>
      </tr>
    `;
  }

  html += "</table>";
  div.innerHTML = html;
}

function drill(next){
  historyStack.push(next);
  render(next);
}

function goBack(){
  historyStack.pop();
  let prev = historyStack[historyStack.length - 1] || "";
  render(prev);
}

render();

function enterUsed(){
  localStorage.setItem("mode","used");
  window.location = "create.html";
}

function save(){
  let files = JSON.parse(localStorage.getItem("files")||"[]");

  files.push({
    name:"File "+Date.now(),
    given: given,
    used: Object.keys(used).length ? used : null
  });

  localStorage.setItem("files", JSON.stringify(files));
  alert("Saved!");
}

function goDashboard(){
  window.location = "dashboard.html";
}

/* ✅ EXPORT TO EXCEL */
function exportExcel(){
  let data = [];

  for(let key in given){
    let g = given[key] || 0;
    let u = used[key] || 0;
    let b = g - u;

    data.push({
      Category: key,
      Given_LKR: g,
      Used_LKR: u,
      Balance: b
    });
  }

  let ws = XLSX.utils.json_to_sheet(data);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Accounting");

  XLSX.writeFile(wb, "Accounting_Report.xlsx");
}
