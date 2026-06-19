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
      "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY",
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

    const text = result.responses[0].fullTextAnnotation?.text;

    if (!text) {
      document.getElementById("rawText").textContent =
        "テキストが検出できませんでした。";
      return;
    }

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
