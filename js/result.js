// ONLY CHANGE THIS PART INSIDE saveModal()

function saveModal(){
  let val = Number(document.getElementById("modalInput").value)||0;
  let plus = document.getElementById("plusToggle").checked;

  let files=getFiles();
  let index=files.findIndex(f=>f.id===currentId);
  let file=files[index];

  let old = file[currentType][currentKey] || 0;
  let newVal = plus ? old + val : val;

  file[currentType][currentKey] = newVal;

  /* 🔥 FIX: SEPARATE HISTORY */
  if(!file.history) file.history = {};
  if(!file.history[currentKey]) {
    file.history[currentKey] = {
      given: [],
      used: []
    };
  }

  file.history[currentKey][currentType].push({
    date: getDate(),
    status: plus ? "Added" : "Changed",
    amount: val
  });

  files[index]=file;
  saveFiles(files);

  closeModal();
  render();
}
