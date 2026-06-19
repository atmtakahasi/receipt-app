document.getElementById("readButton").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("画像を選択してください");
    return;
  }

  document.getElementById("rawText").textContent = "読み取り中…";

  // 画像をBase64に変換
  const base64 = await toBase64(file);

  // Vision API に送信
  const response = await fetch(
    "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyD43_tOMm1iiD6tib0jKFyMBN3AGRuTp4g",
    {
      method: "POST",
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

  const result = await response.json();
  const text = result.responses[0].fullTextAnnotation.text;

  document.getElementById("rawText").textContent = text;

  // 金額抽出
  const lines = text.split("\n");
  const records = document.getElementById("records");
  records.innerHTML = "";

  lines.forEach(line => {
    const match = line.match(/([0-9,]+)円/);
    if (match) {
      const li = document.createElement("li");
      li.textContent = match[0];
      records.appendChild(li);
    }
  });
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
