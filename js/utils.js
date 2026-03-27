function generateKeys() {
  let keys = [];
  ["A","B","C","D","E"].forEach(l=>{
    for(let i=1;i<=5;i++){
      for(let j=1;j<=5;j++){
        keys.push(`${l}${i}.${j}`);
      }
    }
  });
  return keys;
}

function calculateTotals(data){
  let res = {A:0,B:0,C:0,D:0,E:0};

  for(let k in data){
    let l = k[0];
    res[l] += data[k];
  }

  return res;
}