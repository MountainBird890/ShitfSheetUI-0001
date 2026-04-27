import sharp from "sharp";

sharp("public/icon.svg")
  .resize(256, 256)
  .toFile("public/icon.ico", (err, info) => {
    if (err) console.error(err);
    else console.log("変換成功!", info);
  });