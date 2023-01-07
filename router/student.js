const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
/**
 * 上传学生表：
 * 1. 年级班级落表
 * 2. 学生信息落表
 * 3. auth落表，默认密码为学号
 */
router.post(`/`, async (req, res, next) => {
    try {
        const { students } = req.body;
        const gradeClass = students.map(student => { return [student.Grade, student.Class] })
        for (let item of gradeClass) {
            await models.Class.findOrCreate({ where: { Grade: item[0], Class: item[1] } })
        }
        const newStudents = await Promise.all(students.map(async student => {
            const Class = await models.Class.findOne({ where: { Grade: student.Grade, Class: student.Class } });
            const [stuInDB, isCreated] = await models.Student.findOrCreate({
                where: { StudentId: student.StudentId },
                defaults: {Name: student.Name, Class: Class.Id}
            });
            if(!isCreated && (stuInDB.Class !== Class.Id || stuInDB.Name !== student.Name)){
                await stuInDB.update({Class: Class.Id, Name: student.Name});
            }
            return stuInDB;
        }));

        const auths = newStudents.map(async student=>{
            await models.Auth.findOrCreate({
                where: {Name: student.StudentId},
                defaults:{
                    Password: student.StudentId
                }
            })
        })


        // const studentIds = students.map(student => student.StudentId);
        // const existsRecords = await models.Student.findAll({
        //     where: {
        //         studentId: studentIds
        //     }
        // })
        // const existsIds = existsRecords.map(record => record.StudentId)
        // const newItem = students.filter(student => !existsIds.includes(student.StudentId));
        // //已存在的执行更新
        // for (let record of existsRecords) {
        //     const student = students.filter(student => student.StudentId === record.StudentId)
        //     if (student.length === 0) continue
        //     if (record.Name !== student[0].Name || record.Grade !== student[0].Grade || record.Class !== student[0].Class) {
        //         updated.push(student[0]);
        //         await record.update(student[0])
        //     }
        // }
        // //新纪录批量创建
        // await models.Student.bulkCreate(newItem);
        return res.send({
            code: 0,
            msg: 'success',
            data: newStudents,
        })
    } catch (err) {
        next(err)
    }
})


/**
 * 返回年级班级信息用于下发考核时的筛选
 */
router.get('/gradeclass', async (req, res, next) => {
    try {
        const Classes = await models.Class.findAll();
        let mp = new Map();
        for (let cls of Classes){
            if (mp.has(cls.Grade)){
                mp.set(cls.Grade, [...mp.get(cls.Grade), cls.Class]);
            }else{
                mp.set(cls.Grade, [cls.Class]);
            }
        }
        let lst = [];
        for (let entry of mp.entries()){
            lst.push({Grade: entry[0], Class: entry[1]})
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: lst
        })
    } catch (error) {
        next(error)
    }
})
module.exports = router