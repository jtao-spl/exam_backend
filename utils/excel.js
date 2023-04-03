const ejsexcel = require('ejsexcel')
const fs = require("fs");
const util = require("util");
const path=require('path');
const readFileAsync = util.promisify(fs.readFile);


const generalExport = async (data, fileName) => {
    const filepath = path.resolve(path.join(__dirname, `../public/excel/${fileName}`));
    let exist = fs.existsSync(filepath)
    if (exist) {
        const exlBuf = await readFileAsync(filepath);
        const exlBuf2 = await ejsexcel.renderExcel(exlBuf, data, { cachePath: __dirname + "/cache/" });
        return exlBuf2
    } else {
        return Buffer('')
    }
}
const exportStudentScore = async (data) => {
    return await generalExport(data, 'score_template.xlsx');
}

const exportScoreDetail = async (data) => {
    return await generalExport(data, 'detail_template.xlsx');
}

module.exports = {
    exportStudentScore,
    exportScoreDetail
}