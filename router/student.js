const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
const { Op } = require("sequelize");
const { exportStudentScore } = require('../utils/excel');
const { getName, getBaseSize, getUpSize, getBottomSize, getTotalScore, getCriteriaDesc, getToolName } = require('../utils/size');

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
 * 返回年级班级信息用于下发考核时的筛选，@deprecated
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
/**
 * 查询学生列表
 */
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
 * 学生侧查询可见的考核列表,一旦下发，不论何种状态均能查看到
 */
router.get('/deliver/list', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        // const status = Number.parseInt(req.query.status);
        let condition = { Deleted: 0 }

        if (isNaN(page) || isNaN(limit)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的请求参数：page: ${req.query.page}, limit: ${req.query.limit}`,
                data: null
            })
        }
        // if (status) {
        //     condition = { ...condition, Status: status }
        // }
        //TODO： 全年级发放的  应能展示。
        //班级维度发放的，应能展示，
        //按组发放的，应能展示。
        //重新调整班级后，原来的考核，应能展示。
        //其余场景，过滤掉
        // 解决方案：考核下发时打平所命中的发放班级每个人都有一个详细记录 t_exam_deliver_detail。
        const details = await models.ExamDeliverDetail.findAll({
            where: { StudentId: req.info.Id, Deleted: 0 },
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
        })
        const total = await models.ExamDeliverDetail.count({
            where: {
                StudentId: req.info.Id,
                Deleted: false
            }
        });
        if (!details) {
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `查询考核发放详情失败`,
                data: null
            })
        }
        const deliverIds = details.map(detail => detail.DeliverId);
        if (deliverIds.length === 0) {
            return res.json({
                code: ErrCode.SUCCESS,
                msg: `success`,
                data: [],
                page: page,
                limit: 0,
                total: 0,
            })
        }
        condition = { ...condition, Id: deliverIds }
        const delivers = await models.ExamDeliver.findAll({
            where: condition
        })
        const result = delivers.map(deliver => {
            const detail = details.filter(d => d.DeliverId === deliver.Id)
            return {
                ...deliver.toJSON(),
                DeliverDetailId: detail.length > 0 ? detail[0].Id : undefined,
                DeliverDetailStatus: detail.length > 0 ? detail[0].Status : undefined,
            }
        })
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result,
            page: page,
            limit: Math.min(limit, delivers.length),
            total: total,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 学生下载成绩单
 */
router.get(`/deliver/:id/download`, async (req, res, next) => {
    try {
        console.log(`此处构造excelbuff`);
        const id = req.params.id;
        if (isNaN(id)) {
            return res.status(404).end(`无效id:${id}`);
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.status(404).end('未找到deliver');
        }
        const teacherModel = await models.Teacher.findOne({ where: { Phone: deliver.TeacherPhone } });
        const Grade = await models.Grade.findByPk(deliver.GradeId);
        const detail = await models.ExamDeliverDetail.findOne({ where: { DeliverId: id, StudentId: req.info.Id, Deleted: 0 } })
        const target = deliver.ExamName;
        const exam_date = deliver.ExamDate;
        const teacher = teacherModel ? teacherModel.Name : '';
        const major = Grade ? Grade.Major : '';
        const self_score = detail ? detail.SelfScore : 0;
        const group_score = detail ? detail.GroupScore : 0;
        const final_score = detail ? detail.FinalScore : 0;
        const exam = await models.Exam.findByPk(deliver.ExamId);
        if (!exam) {
            return res.status(404).end('未找到exam');
        }
        const component = await models.Component.findByPk(exam.ExamComponent);
        if (!component) return res.status(404).end('未找到component');
        const sizes = await models.ComponentSize.findAll({ where: { ComponentId: component.Id, Deleted: 0 } });
        if (sizes.length === 0) return res.status(404).end('未找到尺寸数据');
        const criterias = await models.ExamCriteria.findAll({ where: { CriteriaId: exam.CriteriaId, Deleted: 0 } })
        if (criterias.length === 0) return res.status(404).end('未找到考核标准');
        const tools = await models.Tool.findAll()
        const content = sizes.map(size => {
            const SelfData = detail.SelfData.filter(item => item.sizeId === size.Id);
            const GroupData = detail.GroupData?.filter(item => item.sizeId === size.Id);
            const FinalData = detail.FinalData.filter(item => item.sizeId === size.Id);
            return {
                name: getName(size),
                baseSize: getBaseSize(size),
                upSize: getUpSize(size),
                bottomSize: getBottomSize(size),
                totalScore: getTotalScore(size, exam),
                CriteriaDesc: getCriteriaDesc(size, criterias),
                toolName: getToolName(SelfData, tools),
                selfSize: SelfData.length > 0 ? SelfData[0].value : '-',
                selfScore: SelfData.length > 0 ? SelfData[0].score : '-',
                groupSize: GroupData && GroupData.length > 0 ? GroupData[0].value : '-',
                groupScore: GroupData && GroupData.length > 0 ? GroupData[0].score : '-',
                finalSize: FinalData.length > 0 ? FinalData[0].value : '-',
                finalScore: FinalData.length > 0 ? FinalData[0].score : '-',

            }
        })
        const data = [
            [{ target, exam_date, teacher, major, self_score, group_score, final_score }],
            content,
        ]
        const buf = await exportStudentScore(data)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
        res.setHeader("Content-Disposition", "attachment; filename=" + 'test' + ".xlsx");
        res.end(buf, 'binary');
    } catch (error) {
        next(error)
    }
})

/**
 * 查询下发给当前学生班级的考核列表
 * 1.  已下发 未删除 同班 考核类型为日常考核 第一级列表筛选
 * 2. 选择考试以后，再筛所有待复测的考核列表
 */
router.get('/class/deliver/list', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);

        if (isNaN(page) || isNaN(limit)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的请求参数：page: ${req.query.page}, limit: ${req.query.limit}`,
                data: null
            })
        }
        //已下发 未删除 同班 考核类型为日常考核
        let condition = { Deleted: 0, Status: 1, ExamType: 0, GradeId: req.info.GradeId, Class: req.info.Class }

        const delivers = await models.ExamDeliver.findAll({
            where: condition,
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
        })
        const total = await models.ExamDeliver.count({
            where: condition,
        });
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: delivers.map(deliver => deliver.toJSON()),
            page: page,
            limit: Math.min(limit, delivers.length),
            total: total,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 小组互评/教师复测时获取指定考核的待复测列表
 */
router.get('/details', async (req, res, next) => {
    try {
        const id = Number.parseInt(req.query.id);
        let Status = undefined;
        if (req.query.Status && !isNaN(Number.parseInt(req.query.Status))) {
            Status = Number.parseInt(req.query.Status)
        }
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的id: ${req.query.id}`,
                data: null,
            })
        }
        let condition = { Deleted: 0, DeliverId: id, StudentId: { [Op.ne]: req.info.Id } }
        if (Status && req.info.Role === 3) {
            condition = { ...condition, Status: Status }
        }
        const details = await models.ExamDeliverDetail.findAll({
            where: condition
        })
        let result = details.map(detail => detail.toJSON());
        if (req.info.Role === 3) { //学生访问列表时移除个人数据，访问自己的数据用其他接口
            result = details.map(detail => ({
                ...detail.toJSON(), SelfData: null, SelfScore: null,
            }))
        }
        result = await Promise.all(result.map(async item => {
            const student = await models.Student.findOne({
                where: { StudentId: item.StudentId }
            });
            return { ...item, StudentName: student?.Name }
        }))
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result
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
        let condition = { Deleted: 0 }
        if (ids) {
            condition = { ...condition, Id: ids }
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
        next(err)
    }
})

/**
 * 返回账号所有的分组信息
 */
router.get('/group/all', async (req, res, next) => {
    try {
        const groups = await models.Group.findAll({
            where: {
                TeacherPhone: req.info.Id,
                Deleted: 0
            }
        });
        return res.json({
            code: 0,
            msg: `success`,
            data: groups ? groups.map(group => group.toJSON()) : []
        })

    } catch (error) {
        next(error)
    }
})

/**
 * 返回单个班级的分组信息
 */
router.get('/group', async (req, res, next) => {
    try {
        const GradeId = Number.parseInt(req.query.GradeId);
        const Class = Number.parseInt(req.query.Class);
        const { GroupName } = req.query;
        if (isNaN(GradeId) || isNaN(Class) || !['A', 'B'].includes(GroupName)) {
            return res.json({
                code: 1,
                msg: `无效的查询参数： ${req.query.GradeId}非数值, ${req.query.Class}非数值或${GroupName}不在支持可选项 A B中。`,
                data: null
            })
        }
        const group = await models.Group.findOne({
            where: {
                GradeId: GradeId,
                Class: Class,
                TeacherPhone: req.info.Id,
                GroupName: GroupName
            }
        });
        return res.json({
            code: 0,
            msg: `success`,
            data: group ? group.toJSON() : null
        })

    } catch (error) {
        next(error)
    }
})
/**
 * 教师创建分组
 */
router.post('/group', async (req, res, next) => {
    try {
        const { Grade, Major, Class, ids } = req.body;
        const grade = await models.Grade.findOne({
            where: {
                Grade: Grade,
                Major: Major,
                Deleted: 0
            }
        });
        if (!grade) {
            return res.json({
                code: 1,
                msg: `未找到有效的年级专业：${Grade}-${Major}`,
                data: null,
            })
        }
        const students = await models.Student.findAll({
            where: {
                GradeId: grade.Id,
                Class: Class,
            }
        });
        if (!students) {
            return res.json({
                code: 1,
                msg: `查找学生信息失败：${Grade}-${Major}-${Class}`,
                data: null,
            })
        }
        const studentIds = students.map(student => student.StudentId);
        const abnormalIds = ids.filter(id => !studentIds.includes(id));
        if (abnormalIds.length > 0) {
            return res.json({
                code: 1,
                msg: `存在无效的id: ${abnormalIds} 不在${Grade}-${Major}-${Class}中`,
                data: null,
            })
        }
        const groupBIds = studentIds.filter(id => !ids.includes(id));
        const [groupA, _] = await models.Group.findOrCreate({
            where: {
                GradeId: grade.Id,
                Class: Class,
                TeacherPhone: req.info.Id,
                GroupName: 'A'
            },
            defaults: {
                StudentIds: ids
            }
        });
        const [groupB, __] = await models.Group.findOrCreate({
            where: {
                GradeId: grade.Id,
                Class: Class,
                TeacherPhone: req.info.Id,
                GroupName: 'B'
            },
            defaults: {
                StudentIds: groupBIds
            }
        });
        return res.json({
            code: 0,
            msg: `success`,
            data: groupA.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 更新学生姓名
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的学号`, data: null })
        }
        const student = await models.Student.findOne({ where: { StudentId: id } })
        if (!student) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `系统中未查到学号: ${id}`, data: null })
        }
        const result = await student.update({ Name: req.body.Name });
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router