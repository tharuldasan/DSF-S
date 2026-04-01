const PASSWORD = "dsosoft";

/* CHECK PASSWORD */
function checkPass(){
  let pass = document.getElementById("adminPass").value;

  if(pass === PASSWORD){
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadRows();
  }else{
    alert("Wrong password");
  }
}

/* LOAD ROWS */
function loadRows(){
  let rows = JSON.parse(localStorage.getItem("rows") || "[]");

  let container = document.getElementById("rowsList");
  container.innerHTML = "";

  rows.forEach((r,index)=>{
    let div = document.createElement("div");

    div.innerHTML = `
      ${index+1}. Head: ${r.head} | Vote: ${r.vote}
      <button onclick="deleteRow(${index})">Delete</button>
    `;

    container.appendChild(div);
  });
}

/* ADD ROW */
function addRow(){

  let head = prompt("Enter Head");
  let vote = prompt("Enter Vote");

  if(!head || !vote) return;

  let rows = JSON.parse(localStorage.getItem("rows") || "[]");

  rows.push({ head, vote });

  localStorage.setItem("rows", JSON.stringify(rows));

  loadRows();
}

/* DELETE */
function deleteRow(index){

  let rows = JSON.parse(localStorage.getItem("rows") || "[]");

  rows.splice(index,1);

  localStorage.setItem("rows", JSON.stringify(rows));

  loadRows();
}
