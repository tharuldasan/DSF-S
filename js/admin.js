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
async function loadRows(){

  const { data: sessionData } = await supabaseClient.auth.getSession();
  let userEmail = sessionData.session.user.email;

  let { data } = await supabaseClient
    .from("rows")
    .select("*")
    .eq("user_email", userEmail);

  let container = document.getElementById("rowsList");
  container.innerHTML = "";

  data.forEach((r,index)=>{
    let div = document.createElement("div");

    div.innerHTML = `
      Head: ${r.head} | Vote: ${r.vote}
      <button onclick="deleteRow('${r.id}')">Delete</button>
    `;

    container.appendChild(div);
  });

  return data;
}

/* ADD ROW */
async function addRow(){

  let head = prompt("Enter Head");
  let vote = prompt("Enter Vote");

  if(!head || !vote) return;

  const { data: sessionData } = await supabaseClient.auth.getSession();
  let userEmail = sessionData.session.user.email;

  await supabaseClient.from("rows").insert({
    user_email: userEmail,
    head: head,
    vote: vote
  });

  loadRows();
}

/* DELETE */
async function deleteRow(id){

  await supabaseClient
    .from("rows")
    .delete()
    .eq("id", id);

  loadRows();
}
