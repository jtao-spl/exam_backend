//使用crypto生成了一个密钥，并且暴露出去
const crypto = require("crypto");
module.exports = {
  MD5_SUFFIX: "pingce_system",
  md5: pwd => {
    let md5 = crypto.createHash("md5");
    return md5.update(pwd).digest("hex");
  },
  secretKey: "pingce_system"
  
};