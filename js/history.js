let files = JSON.parse(localStorage.getItem("files")||"[]");

let div = document.getElementById("files");

function renderHistory(){
  div.innerHTML = "";

  files.forEach(f=>{
    let el = document.createElement("div");
    el.style.margin = "10px";
    el.style.padding = "10px";
    el.style.background = "#eee";
    el.style.cursor = "pointer";

    el.innerText = f.name;

    el.onclick = ()=>{
      localStorage.setItem("currentFile", f.id);
      window.location = "result.html";
    };

    div.appendChild(el);
  });
}

renderHistory();
