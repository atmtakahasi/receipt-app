// 画像を縮小してからOCRにかける（スマホ写真対策）
function resizeImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 1000 / img.width;
      canvas.width = 1000;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

document.getElementById("readButton").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("画像を選択してください");
    return;
  }

  document.getElementById("rawText").textContent = "読み取り中…";

  // 画像縮小
  const resized = await resizeImage(file);

  // OCR実行（日本語）
  const { data: { text } } = await Tesseract.recognize(resized, "jpn", {
    langPath: "https://tessdata.projectnaptha.com/4.0.0"
  });

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
