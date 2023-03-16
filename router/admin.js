const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');

/**
 * 分页查询教师列表
 */
router.get('/teachers', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        const containDeleted = req.query.containDeleted === 'true';

        let condition = {
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
        }
        if (!containDeleted) {
            condition = { ...condition, where: { Deleted: false } }
            console.log(`not contain deleted: condition: ${condition}`)
        }
        const records = await models.Teacher.findAll(condition)
        let total = await models.Teacher.count();
        if (!containDeleted) {
            total = await models.Teacher.count({ where: { Deleted: false } });
            console.log(`not contain deleted: count: ${total}`)
        }
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: records.map(record => record.toJSON()),
            page: page,
            limit: Math.min(limit, records.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (error) {
        next(error)
    }
})
/**
 * 获取年级列表
 */
router.get('/grade', async (req, res, next) => {
    try {
        const { containDeleted } = req.query;
        let condition = { Deleted: false };
        if (containDeleted === '1' || containDeleted === 'true') {
            condition = {}
        }
        const grades = await models.Grade.findAll({
            where: condition
        });
        return res.json({
            code: 0,
            msg: `success`,
            data: grades.map(grade => grade.toJSON())
        })
    } catch (error) {
        next(error)
    }
})
/**
 * 获取审核列表
 */
router.get('/exam/share', async (req, res, next) => {
    try {

        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        const status = Number.parseInt(req.query.status);
        if (isNaN(page) || isNaN(limit)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的参数: page:${req.query.page}, limit: ${req.query.limit}`,
                data: null
            })
        }
        let condition = {}
        if (!isNaN(status) && status !==0) { //传0表示全部
            condition = { ...condition, Status: status }
        }

        const items = await models.ExamShare.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: condition
        });
        const total = await models.ExamShare.count({ where: condition });
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: items.map(item => item.toJSON()),
            page: page,
            limit: Math.min(limit, items.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
/**
 * 查询单个年级详情
 */
router.get('/grade/:Id', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.Id);
        if (isNaN(Id)) {
            return res.json({
                code: 1,
                msg: `无效的Id： ${req.params.Id}`,
                data: null
            })
        }
        const grade = await models.Grade.findByPk(Id);
        if (!grade) {
            return res.json({
                code: 1,
                msg: `不存在的Id： ${req.params.Id}`,
                data: null
            })
        }
        return res.json({
            code: 0,
            msg: `success`,
            data: grade.toJSON()
        })
    } catch (error) {
        next(error)
    }
})
/**
 * 新增教师信息
 */
router.post('/teachers', async (req, res, next) => {
    try {
        const { Phone } = req.body;
        const record = await models.Teacher.findOne({ where: { Phone: Phone } });
        if (record) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `联系电话已录入，无法重复录入`, data: null });
        }
        const result = await models.Teacher.create(req.body);
        if (!result) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `添加数据异常，请联系系统管理员`, data: null });
        }
        await models.Auth.findOrCreate({
            where: { Name: Phone },
            defaults: {
                Password: Phone,
                Role: 2
            }
        })
        return res.json({ code: 0, msg: 'success', data: result.toJSON() })
    } catch (error) {
        next(error)
    }
})
/**
 * 上传学生表：
 * 1. 年级班级落表
 * 2. 学生信息落表
 * 3. auth落表，默认密码为学号
 */
router.post(`/students`, async (req, res, next) => {
    try {
        const { students, GradeId } = req.body;

        const newStudents = await Promise.all(students.map(async student => {
            const [stuInDB, isCreated] = await models.Student.findOrCreate({
                where: { StudentId: student.StudentId },
                defaults: { Name: student.Name, GradeId: GradeId }
            });
            if (!isCreated && stuInDB.Name !== student.Name) {
                await stuInDB.update({ Name: student.Name });
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
 * 切换账号状态
 */
router.patch('/status/toggle/:Role/:Id', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.Id)
        const Role = Number.parseInt(req.params.Role)
        if (isNaN(Id)) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的Id：${Id}`, data: null });
        }
        if (isNaN(Role) || ![2, 3].includes(Role)) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的角色枚举值：${Role}，仅支持2|3。`, data: null });
        }
        let record;
        if (Role === 2) {
            record = await models.Teacher.findOne({ where: { Phone: Id } });
        }
        if (Role === 3) {
            record = await models.Student.findOne({ where: { StudentId: Id } });
        }
        if (!record) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的Id：${Id}`, data: null });
        }
        const curStatus = record.Deleted;
        await record.update({ Deleted: !curStatus })
        const auth = await models.Auth.findOne({ where: { Name: Id } });
        if (curStatus) {
            await auth.update({ Status: 2 })
        } else {
            await auth.update({ Status: 3 })
        }
        return res.json({ code: 0, msg: `success`, data: record.toJSON() });

    } catch (error) {
        next(error)
    }
})

/**
 * 密码重置为与账号相同
 */
router.patch('/password/reset', async (req, res, next) => {
    try {
        const { Role, Name } = req.body;
        const record = await models.Auth.findOne({ where: { Role: Role, Name: Name } });
        if (!record) {
            return res.json({ code: Error.ERR_NOT_FOUND, msg: `未查询到角色为[${Role === '2' ? '教师' : '学生'}], 登录账号为[${Name}]的信息`, data: null });
        }
        await record.update({ Password: Name, Status: 0 });
        return res.json({ code: 0, msg: `success`, data: null });
    } catch (error) {
        next(error)
    }
})

/**
 * 新增年级专业
 */
router.post('/grade', async (req, res, next) => {
    try {
        const { Grade, Major, ClassCount } = req.body;
        if (isNaN(Grade)) {
            return res.json({ code: 2, msg: `年级必须为整型`, data: null });
        }
        const [GradeItem, _] = await models.Grade.findOrCreate({
            where: { Major: Major, Grade: Grade },
            defaults: {
                ClassCount: ClassCount,
                Deleted: 0
            }
        })
        return res.json({
            code: 0,
            msg: `success`,
            data: GradeItem.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 删除年级
 */
router.delete('/grade/:Id', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.Id);
        if (isNaN(Id)) {
            return res.json({
                code: 1,
                msg: `无效的年级Id:${req.params.Id}`,
                data: null
            })
        }
        const grade = await models.Grade.findByPk(Id);
        if (!grade) {
            return res.json({
                code: 1,
                msg: `无效的年级Id:${Id}`,
                data: null
            })
        }
        const bindItem = await models.Student.findOne({ where: { GradeId: grade.Id } });
        if (bindItem) {
            return res.json({
                code: 1,
                msg: `该年级/专业下已关联学生，请先转移后再执行删除操作`,
                data: null
            })
        }
        await grade.update({ Deleted: 1 });
        return res.json({
            code: 0,
            msg: `success`,
            data: null
        })

    } catch (error) {
        next(error)
    }
})

/**
 * 批量更新账号状态
 */
router.patch('/batch/toggle/:Role', async (req, res, next) => {
    try {
        const Role = Number.parseInt(req.params.Role);
        if (isNaN(Role) || ![2, 3].includes(Role)) {
            return res.json({
                code: 1,
                msg: `无效的角色值：${req.params.Role}`,
                data: null
            })
        }
        const { Ids, disable } = req.body;
        let entities;
        if (Role === 2) {
            entities = await models.Teacher.findAll({
                where: { Phone: Ids }
            })
        }
        if (Role === 3) {
            entities = await models.Student.findAll({
                where: { StudentId: Ids }
            })
        }
        for (let ent of entities) {
            await ent.update({ Deleted: disable });
        }
        return res.json({
            code: 0,
            msg: `success`,
            data: entities.map(ent => ent.toJSON())
        })
    } catch (error) {
        next(error)
    }
})

router.patch('/students', async (req, res, next) => {
    try {
        const { Ids, Class } = req.body;
        if (!Class) {
            return res.json({
                code: 1, msg: `未指定Class`, data: null
            })
        }
        const students = await models.Student.findAll({
            where: {
                StudentId: Ids,
                Deleted: 0
            }
        })
        if (students.length === 0) {
            return res.json({
                code: 0, msg: `sucecss`, data: null
            })
        }
        students.map(async stu => await stu.update({ Class: Class }));
        return res.json({
            code: 0, msg: `sucecss`, data: students.map(stu => stu.toJSON())
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 处理考卷共享审核
 */
router.patch('/exam/audit', async (req, res, next) => {
    try {
        const { examId, status } = req.body;
        if (isNaN(examId) || isNaN(status) || ![1, 3].includes(status)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的请求参数：examId: ${examId}, status: ${status}`,
                data: null
            })
        }
        const auditRecord = await models.ExamShare.findOne({
            where: {
                ExamId: examId,
                Status: 2
            }
        });
        if (!auditRecord) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `考核${examId}当前不处于待审核状态`,
                data: null
            })
        }
        const exam = await models.Exam.findByPk(examId);
        if (!exam) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `未找到考核：${examId}`,
                data: null
            })
        }
        await auditRecord.update({ Status: status });
        await exam.update({ Shared: status });
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exam.toJSON()
        })
    } catch (error) {
        next(error)
    }
})
module.exports = router