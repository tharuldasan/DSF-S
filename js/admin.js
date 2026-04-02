const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  let id = "row_" + Date.now(); // 🔥 FIX: generate id

  let { error } = await supabaseClient.from("rows").insert({
    id: id,
    head: head,
    vote: vote
  });

  if(error){
    console.log(error);
    alert("Insert failed");
  }else{
    loadRows();
  }
}

/* DELETE */
async function deleteRow(id){

  await supabaseClient
    .from("rows")
    .delete()
    .eq("id", id);

  loadRows();
}
