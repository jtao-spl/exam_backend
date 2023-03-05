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
                defaults: { Name: student.Name, Class: Class.Id }
            });
            if (!isCreated && (stuInDB.Class !== Class.Id || stuInDB.Name !== student.Name)) {
                await stuInDB.update({ Class: Class.Id, Name: student.Name });
            }
            return stuInDB;
        }));

        const auths = newStudents.map(async student => {
            await models.Auth.findOrCreate({
                where: { Name: student.StudentId },
                defaults: {
                    Password: student.StudentId
                }
            })
        })


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
        const grades = await models.Grade.findAll({ where: { Deleted: 0 } });
        let lst = [];
        for (let grade of grades) {
            for (let i = 0; i < grade.ClassCount; i++) {
                lst.push({ Grade: grade.Grade, Major: grade.Major, Class: i + 1 })
            }
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

router.get('/', async (req, res, next) => {
    try {
        const { StudentIds, Grade, Major, Class, GradeId } = req.query;
        let condition = null;
        if (StudentIds) {
            condition = { StudentId: StudentIds }
        }
        if (Grade && Major) {
            const grade = await models.Grade.findOne({
                where: {
                    Grade: Grade,
                    Major: Major,
                }
            })
            if (grade) {
                condition = { GradeId: grade.Id }
            }
        }
        if (Class) {
            condition = { ...condition, Class: Class }
        }
        if (GradeId) {
            condition = { ...condition, GradeId: GradeId }
        }
        let students;
        if (condition === null) {
            condition = {
                order: [["Id", "DESC"]],
                offset: 0,
                limit: 50,
            }
            students = await models.Student.findAll({ ...condition });
        }
        else {
            students = await models.Student.findAll({ where: condition });
        }
        return res.json({
            code: 0,
            msg: `success`,
            data: students.map(student => student.toJSON())
        })

    } catch (error) {
        next(error)
    }
})

/**
 * 查询年级表 返回原始item数据
 */
router.get('/grade', async (req, res, next) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.json({
                code: 0,
                msg: `success`,
                data: null
            })
        }
        const grades = await models.Grade.findAll({
            where: {
                Id: ids,
                Deleted: 0,
            }
        });
        return res.json({
            code: 0,
            msg: `success`,
            data: grades.map(grade => grade.toJSON())
        })
    } catch (error) {
        next(err)
    }
})
module.exports = router