let keys = generateKeys();
let index = 0;

let mode = localStorage.getItem("mode") || "given";

let data = JSON.parse(localStorage.getItem(mode+"Data")) || {};

const label = document.getElementById("label");
const input = document.getElementById("money");

label.innerText = keys[index];

function next(){
  data[keys[index]] = Number(input.value || 0);

  index++;
  input.value = "";

  if(index >= keys.length){
    localStorage.setItem(mode+"Data", JSON.stringify(data));
    window.location = "result.html";
    return;
  }

  label.innerText = keys[index];
}

function back(){
  if(index > 0){
    index--;
    label.innerText = keys[index];
  }
}