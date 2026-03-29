function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

let key = localStorage.getItem("historyKey");
let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");
let id = localStorage.getItem("currentFile");

let file = files.find(f=>f.id===id);

let history = (file.history && file.history[key]) || {
  given: [],
  used: []
};

function buildTable(title, data){
  let html = `<h3>${title}</h3>`;

  html += `
  <table>
  <tr>
    <th>Date</th>
    <th>Status</th>
    <th>Amount</th>
  </tr>
  `;

  data.forEach(h=>{
    html+=`
    <tr>
      <td>${h.date}</td>
      <td>${h.status}</td>
      <td>Rs. ${h.amount}</td>
    </tr>`;
  });

  html += "</table><br>";
  return html;
}

let output = "";

output += buildTable("Allo / Distribution", history.given);
output += buildTable("Expenditure", history.used);

document.getElementById("historyTable").innerHTML = output;
