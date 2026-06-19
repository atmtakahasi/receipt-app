const imageInput = document.getElementById("imageInput");
const readBtn = document.getElementById("readBtn");
const rawText = document.getElementById("rawText");
const result = document.getElementById("result");
const recordsList = document.getElementById("records");

let records = JSON.parse(localStorage.getItem("records") || "[]");
renderRecords();

readBtn.onclick = async () => {
  if (!imageInput.files[0]) {
    alert("画像を選んでください");
    return;
  }

  const file = imageInput.files[0];

  const { data: { text } } = await Tesseract.recognize(file, "jpn");
  rawText.textContent = text;

  const amount = extractAmount(text);
  const date = extractDate(text);

  result.innerHTML = `
    <p>金額：${amount || "不明"}</p>
    <p>日付：${date || "不明"}</p>
  `;

  if (amount && date) {
    const record = { amount, date };
    records.push(record);
    localStorage.setItem("records", JSON.stringify(records));
    renderRecords();
  }
};

function extractAmount(text) {
  const match = text.match(/¥?\s?(\d{2,6})/);
  return match ? match[1] : null;
}

function extractDate(text) {
  const match = text.match(/(\d{4}[\/\-年]\d{1,2}[\/\-月]\d{1,2})/);
  return match ? match[1] : null;
}

function renderRecords() {
  recordsList.innerHTML = "";
  records.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.date} : ¥${r.amount}`;
    recordsList.appendChild(li);
  });

}
