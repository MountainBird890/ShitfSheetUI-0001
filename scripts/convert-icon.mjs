import sharp from "sharp";

// まずSVG→PNGに変換
await sharp("public/icon.svg")
  .resize(256, 256)
  .png()
  .toFile("public/icon.png");

console.log("PNG変換完了！次にicoに変換します");