let given = JSON.parse(localStorage.getItem("givenData")) || {};
let used  = JSON.parse(localStorage.getItem("usedData")) || {};

let givenTotals = calculateTotals(given);
let usedTotals  = calculateTotals(used);

let div = document.getElementById("totals");

let html = "";

["A","B","C","D","E"].forEach(k=>{
  let g = givenTotals[k] || 0;
  let u = usedTotals[k] || 0;
  let b = g - u;

  html += `<p>${k}: Given ${g} | Used ${u} | Balance ${b}</p>`;
});

div.innerHTML = html;

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