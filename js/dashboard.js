function createNew(){
  localStorage.removeItem("givenData");
  localStorage.removeItem("usedData");
  localStorage.setItem("mode","given");

  window.location = "create.html";
}

function goHistory(){
  window.location = "history.html";
}