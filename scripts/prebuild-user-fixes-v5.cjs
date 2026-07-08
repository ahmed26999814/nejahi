require("./prebuild-user-fixes-v4.cjs");

const fs = require("fs");
const p = "app/page.jsx";
let s = fs.readFileSync(p, "utf8");

// اجعل ظهور النتيجة أسرع على الهاتف بعد البحث.
s = s.replace("    }, 520);", "    }, 120);");
s = s.replace("}, 520);", "}, 120);");

fs.writeFileSync(p, s, "utf8");
console.log("Applied MauriResults mobile speed polish v5");
