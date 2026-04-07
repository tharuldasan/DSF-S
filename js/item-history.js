const SUPABASE_URL = "https://voenpsxzpirhuysviyul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZW5wc3h6cGlyaHV5c3ZpeXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzEzNzMsImV4cCI6MjA5MDYwNzM3M30.MpA_0Gykvv9-ZQA1jkBCk1zcp-t-9jkwHacaHG2-MYw";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadHistory(){

  let key = localStorage.getItem("historyKey"); // e.g. Kalutara_5
  let file = await getCurrentFile();

  if(!file) return;

  let history = (file.history && file.history[key]) || {
    given: [],
    used: []
  };

  /* 🔥 GET ROW INDEX */
  let index = parseInt(key.split("_")[1]) - 1;

  /* 🔥 LOAD ROWS */
  let rows = await loadRows();

  let head = rows[index]?.head || "";
  let vote = rows[index]?.vote || "";

  /* 🔥 BUILD HEADER */
  let html = `
    <div style="margin-bottom:20px; text-align:left;">
      <b>Head:</b> ${head} <br>
      <b>Vote:</b> ${vote}
    </div>
  `;

  /* 🔥 TABLE BUILDER */
  function buildTable(title, data){

    let t = `<h3>${title}</h3>`;

    t += `
    <table>
      <tr>
        <th>Date</th>
        <th>Status</th>
        <th>Amount</th>
      </tr>
    `;

    data.forEach(h=>{
      t += `
        <tr>
          <td>${h.date}</td>
          <td>${h.mode}</td>
          <td>Rs. ${h.amount}</td>
        </tr>
      `;
    });

    t += "</table><br>";
    return t;
  }

  html += buildTable("Allo / Distribution", history.given);
  html += buildTable("Expenditure", history.used);

  document.getElementById("historyTable").innerHTML = html;
}

/* RUN */
loadHistory();
