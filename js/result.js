let given = JSON.parse(localStorage.getItem("givenData")) || {};
let used  = JSON.parse(localStorage.getItem("usedData")) || {};

let level = "main";
let current = "";

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

function edit(key,type){
  let value = prompt("Enter amount for " + key);
  if(value === null) return;

  value = Number(value) || 0;

  if(type === "given"){
    given[key] = value;
    localStorage.setItem("givenData", JSON.stringify(given));
  }else{
    used[key] = value;
    localStorage.setItem("usedData", JSON.stringify(used));
  }

  render();
}

render();

function save(){
  let files = JSON.parse(localStorage.getItem("files")||"[]");

  files.push({
    name: localStorage.getItem("fileName") || "File",
    given: given,
    used: used
  });

  localStorage.setItem("files", JSON.stringify(files));
  alert("Saved!");
}

function goDashboard(){
  window.location = "dashboard.html";
}
