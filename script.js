document.getElementById("readButton").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("画像を選択してください");
    return;
  }

  document.getElementById("rawText").textContent = "読み取り中…";

  try {
    // Base64変換
    const base64 = await toBase64(file);

    // Vision API 呼び出し
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

    // HTTPエラーを検出
    if (!response.ok) {
      const errText = await response.text();
      document.getElementById("rawText").textContent =
        "APIエラー:\n" + errText;
      return;
    }

    const result = await response.json();

    // Vision API のエラーを検出
    if (result.responses[0].error) {
      document.getElementById("rawText").textContent =
        "Vision API エラー:\n" +
        JSON.stringify(result.responses[0].error, null, 2);
      return;
    }

    // fullTextAnnotation を優先して使用
    let text = result.responses[0].fullTextAnnotation?.text;

    if (!text) {
      document.getElementById("rawText").textContent =
        "テキストが検出できませんでした。";
      return;
    }

    // -----------------------------
    // ★ 改行を整えるフィルター ★
    // -----------------------------

    // ① 連続する空行を1つにまとめる
    text = text.replace(/\n{2,}/g, "\n");

    // ② 行頭・行末の空白を削除
    text = text
      .split("\n")
      .map(line => line.trim())
      .join("\n");

    // ③ レシートでよくあるパターンを整形
    text = text.replace(/(小計|合計|税込|税抜)/g, "\n$1\n");

    // ④ 金額の後に改行を入れる（例：123 → 123\n）
    text = text.replace(/(¥?\d{2,6})\s/g, "$1\n");

    // ⑤ 日付の前後に改行
    text = text.replace(/(\d{4}\/\d{1,2}\/\d{1,2})/g, "\n$1\n");

    // ⑥ 再度連続改行を整理
    text = text.replace(/\n{2,}/g, "\n");

    // -----------------------------
    // ★ 整形後のテキストを表示 ★
    // -----------------------------
    document.getElementById("rawText").textContent = text;

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
