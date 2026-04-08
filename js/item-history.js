const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadHistory(){

  let key = localStorage.getItem("historyKey");
  let fileId = localStorage.getItem("currentFile");

  const { data: sessionData } = await supabaseClient.auth.getSession();
  let userEmail = sessionData.session.user.email;

  let { data } = await supabaseClient
    .from("files")
    .select("*")
    .eq("user_email", userEmail)
    .eq("id", fileId)
    .single();

  let file = data.data;

  let history = file.history?.[key] || {
    given: [],
    used: []
  };

  let index = parseInt(key.split("_")[1]) - 1;

  let { data: rows } = await supabaseClient.from("rows").select("*");

  let head = rows[index]?.head || "";
  let vote = rows[index]?.vote || "";

  let html = `
    <div style="margin-bottom:15px;">
      <button id="historyPdfBtn" onclick="downloadHistoryPDF()">Download PDF</button>
    </div>

    <div style="margin-bottom:15px;">
      <b>Head:</b> ${head} <br>
      <b>Vote:</b> ${vote}
    </div>
  `;

  html += buildTable("Allo / Distribution", history.given);
  html += buildTable("Expenditure", history.used);

  document.getElementById("historyTable").innerHTML = html;
}

function buildTable(title, data){

  let html = `<h3>${title}</h3>`;

  html += `
  <table>
  <tr>
    <th>Date</th>
    <th>Status</th>
    <th>Amount</th>
  </tr>
  `;

  data.forEach(h=>{
    html += `
    <tr>
      <td>${h.date}</td>
      <td>${h.mode}</td>
      <td>Rs. ${Number(h.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
    </tr>`;
  });

  html += "</table><br>";

  return html;
}

/* PDF */
function downloadHistoryPDF(){

  let btn = document.getElementById("historyPdfBtn");

  // 🔥 hide button before export
  btn.style.display = "none";

  let element = document.getElementById("historyTable");

  html2pdf().from(element).save("Item_History.pdf").then(()=>{

    // 🔥 show button again
    btn.style.display = "block";

  });
}

window.onload = loadHistory;
