// 家計簿データ（ローカル保存）
let records = JSON.parse(localStorage.getItem("records") || "[]");
renderKakeibo();

// OCRボタン
document.getElementById("readButton").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("画像を選択してください");
    return;
  }

  document.getElementById("rawText").textContent = "読み取り中…";

  try {
    const base64 = await toBase64(file);

    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyB2VbazGuqD8k5U2zuy4GQaVTkmMVV0K-w",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION" }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      document.getElementById("rawText").textContent =
        "APIエラー:\n" + errText;
      return;
    }

    const result = await response.json();

    if (result.responses[0].error) {
      document.getElementById("rawText").textContent =
        "Vision API エラー:\n" +
        JSON.stringify(result.responses[0].error, null, 2);
      return;
    }

    let text = result.responses[0].fullTextAnnotation?.text;
    if (!text) {
      document.getElementById("rawText").textContent =
        "テキストが検出できませんでした。";
      return;
    }

    // 整形
    text = cleanText(text);
    document.getElementById("rawText").textContent = text;

    // 必要な情報だけ抽出
    const info = extractImportantInfo(text);

    // 家計簿に追加
    records.push({
      store: info.store,
      total: info.total,
      date: info.date
    });

    localStorage.setItem("records", JSON.stringify(records));
    renderKakeibo();

  } catch (e) {
    document.getElementById("rawText").textContent =
      "JavaScriptエラー:\n" + e.message;
  }
});

// Base64変換
function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// テキスト整形
function cleanText(text) {
  text = text.replace(/\n{2,}/g, "\n");
  text = text.split("\n").map(l => l.trim()).join("\n");
  text = text.replace(/(合計|総額|計|税込|税抜)/g, "\n$1\n");
  text = text.replace(/(¥?\d{2,8})\s/g, "$1\n");
  return text.replace(/\n{2,}/g, "\n");
}

// 必要な情報だけ抽出（店名・合計金額・日付）
function extractImportantInfo(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  const jp = /[\u3040-\u30FF\u4E00-\u9FFF]/;

  // --- 店名 ---
  let store = null;

  for (const line of lines) {
    if (jp.test(line) && line.length >= 2 && !/合計|小計|税込|領収|レシート/.test(line)) {
      store = line;
      break;
    }
  }

  if (!store) {
    for (const line of lines) {
      if (/(店|スーパー|ストア|ショップ|薬局|センター)/.test(line)) {
        store = line;
        break;
      }
    }
  }

  if (!store) store = lines[0] || "不明な店舗";

  // --- 合計金額 ---
  let total = null;

  for (const line of lines) {
    const m = line.match(/(合計|総額|計|TOTAL)[^\d]*(¥?\d{2,8})/i);
    if (m) {
      total = parseInt(m[2].replace("¥", ""), 10);
      break;
    }
  }

  if (!total) {
    const nums = lines
      .map(l => l.match(/¥?(\d{2,8})/))
      .filter(Boolean)
      .map(m => parseInt(m[1], 10));

    if (nums.length > 0) {
      total = Math.max(...nums);
    }
  }

  // --- 日付 ---
  let date = null;

  for (const line of lines) {
    const d = line.match(/(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/);
    if (d) {
      date = d[1].replace(/[\.]/g, "/");
      break;
    }
  }

  if (!date) {
    date = new Date().toLocaleDateString("ja-JP");
  }

  return { store, total, date };
}

// 家計簿表示
function renderKakeibo() {
  const container = document.getElementById("kakeibo");
  container.innerHTML = records
    .map(
      r => `
      <div class="card">
        <div class="store">${r.store}</div>
        <div class="total">¥${r.total}</div>
        <div class="date">${r.date}</div>
      </div>
    `
    )
    .join("");
}
