// カテゴリとキーワード
const CATEGORY_KEYWORDS = {
  "食料品": ["米", "パン", "牛乳", "卵", "肉", "野菜", "果物", "おにぎり"],
  "日用品": ["ティッシュ", "洗剤", "スポンジ", "歯磨き", "シャンプー"],
  "外食": ["マクド", "すき家", "ガスト", "松屋", "吉野家", "カフェ"],
  "交通": ["JR", "バス", "切符", "乗車", "高速"],
  "医療": ["薬", "病院", "クリニック", "処方"],
  "娯楽": ["ゲーム", "映画", "カラオケ", "本", "漫画"],
  "仕事": ["コピー", "文具", "交通費", "会議"],
  "その他": []
};

// 家計簿データ
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
      "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyByFydyPFWMw3ArWS58rQ0y3rXIIUaTrEk",
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

    // 整形フィルター
    text = cleanText(text);
    document.getElementById("rawText").textContent = text;

    // 家計簿に追加
    processKakeibo(text);

  } catch (e) {
    document.getElementById("rawText").textContent =
      "JavaScriptエラー:\n" + e.message;
  }
});

// テキスト整形
function cleanText(text) {
  text = text.replace(/\n{2,}/g, "\n");
  text = text.split("\n").map(l => l.trim()).join("\n");
  text = text.replace(/(小計|合計|税込|税抜)/g, "\n$1\n");
  text = text.replace(/(¥?\d{2,6})\s/g, "$1\n");
  text = text.replace(/(\d{4}\/\d{1,2}\/\d{1,2})/g, "\n$1\n");
  return text.replace(/\n{2,}/g, "\n");
}

// 家計簿処理
function processKakeibo(text) {
  const lines = text.split("\n");

  lines.forEach(line => {
    const match = line.match(/(.+?)\s*(¥?\d{2,6})/);
    if (!match) return;

    const item = match[1].trim();
    const amount = parseInt(match[2].replace("¥", ""), 10);
    const category = detectCategory(item);

    records.push({ item, amount, category });
  });

  localStorage.setItem("records", JSON.stringify(records));
  renderKakeibo();
}

// カテゴリ判定
function detectCategory(item) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => item.includes(k))) {
      return cat;
    }
  }
  return "その他";
}

// 家計簿表示
function renderKakeibo() {
  const container = document.getElementById("kakeibo");
  container.innerHTML = records
    .map(
      r => `
      <div class="card">
        <div class="cat">${r.category}</div>
        <div class="item">${r.item}</div>
        <div class="yen">¥${r.amount}</div>
      </div>
    `
    )
    .join("");
}

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
