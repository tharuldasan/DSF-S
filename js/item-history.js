function getUserKey(){
  return "files_" + localStorage.getItem("currentUser");
}

let key = localStorage.getItem("historyKey");
let files = JSON.parse(localStorage.getItem(getUserKey())||"[]");
let id = localStorage.getItem("currentFile");

let file = files.find(f=>f.id===id);

let history = (file.history && file.history[key]) || [];

let html = `
<table>
<tr>
<th>Date</th>
<th>Status</th>
<th>Type</th>
<th>Amount</th>
</tr>
`;

history.forEach(h=>{
  html+=`
  <tr>
    <td>${h.date}</td>
    <td>${h.status}</td>
    <td>${h.type}</td>
    <td>Rs. ${h.amount}</td>
  </tr>`;
});

html+="</table>";

document.getElementById("historyTable").innerHTML = html;
