const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');

router.post(`/`, async (req, res, next) => {
    try {
        const { students } = req.body;
        let updated = [];
        const studentIds = students.map(student => student.StudentId);
        const existsRecords = await models.Student.findAll({
            where: {
                studentId: studentIds
            }
        })
        const existsIds = existsRecords.map(record=>record.StudentId)
        const newItem = students.filter(student=> !existsIds.includes(student.StudentId));
        //已存在的执行更新
        for (let record of existsRecords) {
            const student = students.filter(student => student.StudentId === record.StudentId)
            if(student.length ===0) continue
            if (record.Name !== student[0].Name || record.Grade !== student[0].Grade || record.Class !== student[0].Class) {
                updated.push(student[0]);
                await record.update(student[0])
            }
        }
        //新纪录批量创建
        await models.Student.bulkCreate(newItem);
        return res.send({
            code: 0,
            msg: 'success',
            data: students,
            updated: updated //标识之前已存在且被更新过的记录。
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router