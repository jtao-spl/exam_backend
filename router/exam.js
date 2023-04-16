const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
const { getComponentCriteria } = require('../service/component');
const { getTokenFromReq, getCachedDataInfo } = require('../utils/common');
const { Op } = require("sequelize");
const xlsx = require("node-xlsx").default
 
const ElementFirstType = {
    SizedElement: 0,
    GeometricalTolerance: 1,
    SurfaceRoughness: 2,
    Other: 3 //未注倒角
}
const SizedElementSubType = {
    Line: 0,
    Diameter: 1,
    Radial: 2,
    Angle: 3
}
const SizedElementSymbol = ['L', 'D', 'R', '∠'];
const GelToleranceSymbol = ['u', 'c', 'e', 'g', 'k', 'd', 'f', 'b', 'a', 'r', 'i', 'j', 'h', 't'];
const ExamStatus = new Map([
    [1, '初始化'],
    [2, '已下发'],
    [3, '已收卷']
])
/**
 * 获取考核列表
 */
router.get('/', async (req, res, next) => {
    try {
        // const token = getTokenFromReq(req);
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        const ExamComponent = Number.parseInt(req.query.ExamComponent);
        const IncludeShared = ['true', '1'].includes(req.query.IncludeShared) ? 1 : 0;
        const Status = req.query.Status;
        let condition = { Deleted: false }
        if (ExamComponent !== 0) {
            condition = { ExamComponent: ExamComponent, ...condition }
        }
        if (Status) {
            condition = { Status: Status, ...condition }
        }
        //如果是学生，根据班级过滤考核
        // if (token !== '') {
        //     const cache = await getCachedDataInfo(token);
        //     if (cache) {
        //         const info = JSON.parse(cache);
        //         const { Role } = info;
        //         if (Role === 2) {
        //             const { Id } = info;
        //             condition = { ...condition, Creator: Id }
        //         }
        //         if (Role === 3) {
        //             const { Id, GradId, Class } = info;
        //             condition = { ...condition, Class: Class }
        //         }
        //     }
        // }
        if (req.info.Role === 2) {
            const { Id } = req.info;
            condition = { ...condition, Creator: Id }
        }
        if (req.info.Role === 3) {
            return res.json({
                code: 1,
                msg: `学生无权查询考核列表`,
                data: null
            })
        }
        if (IncludeShared) {
            condition = { [Op.or]: [condition, { Shared: 1 }] }
        }
        const exams = await models.Exam.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: condition
        });
        // const examsDict = await Promise.all(await exams.map(async exam => {
        //     let ret = { ...exam.toJSON(), Class: '' };//下发班级初始化为空
        //     if (exam.Class === 0) return ret;

        //     const cls = await models.Class.findByPk(exam.Class);
        //     if (cls) {
        //         ret.Class = `${cls.Grade}级${cls.Class}班`;
        //     }
        //     return ret;
        // }))
        const total = await models.Exam.count({ where: condition });
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: exams.map(exam => exam.toJSON()),
            page: page,
            limit: Math.min(limit, exams.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
/***
 * 新增考核
 */
router.post('/', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const { ExamTarget, ExamComponent, SizePrecisionLevel } = req.body;
        const component = await models.Component.findByPk(ExamComponent);
        if (!component) {
            result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `组件id不存在，保存失败`
            }
            return res.status(200).json(result);
        }
        let creator = null;
        const token = getTokenFromReq(req);
        if (token !== '') {
            const cache = await getCachedDataInfo(token);
            if (cache) {
                const info = JSON.parse(cache);
                const { Role, Id } = info;
                if (Role === 3) {
                    return res.json({
                        code: 1,
                        msg: `当前登录用户角色为学生，不能创建考核`,
                        data: null
                    })
                }
                creator = Id;
            }
        }
        if (!creator) {
            return res.json({
                code: 1,
                msg: `当前登录已过期，请重新登录`,
                data: null
            })
        }

        const exam = await models.Exam.create({
            ExamTarget: ExamTarget,
            ExamComponent: ExamComponent,
            SizePrecisionLevel: SizePrecisionLevel,
            Creator: creator
        });
        result = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exam.toJSON()
        }

        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});

router.get('/criteria', async (req, res, next) => {
    const CriteriaId = Number.parseInt(req.query.CriteriaId);
    if (isNaN(CriteriaId)) {
        result = {
            code: ErrCode.ERR_INVALID_PARAMS,
            msg: `参数 CriteriaId 无效`,
            data: null
        }
        return res.json(result);
    }
    const criterias = await models.ExamCriteria.findAll({
        where: { CriteriaId: CriteriaId }
    });
    result = {
        code: 0,
        msg: `success`,
        data: criterias.map(criteria => criteria.toJSON())
    }
    return res.json(result);
})
/**
 * 指定id查询
 */
router.get('/batch', async (req, res, next) => {
    try {
        const { ids } = req.query;
        const exams = await models.Exam.findAll({
            where: { id: ids, Deleted: 0 }
        });
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exams ? exams.map(exam => exam.toJSON()) : [],
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 获取考核项目
 */
router.get('/target', async (req, res, next) => {
    try {
        const targets = await models.ExamTarget.findAll();
        result = {
            code: 0,
            msg: `success`,
            data: targets.map(target => target.toJSON())
        }
        return res.json(result);
    } catch (error) {
        next(error)
    }
})

/**
 * 获取当前教师未创建完成的考核继续
 */
router.get('/pending', async (req, res, next) => {
    const ExamComponent = Number.parseInt(req.query.ExamComponent);
    if (isNaN(ExamComponent)) {
        return res.json({
            code: 1,
            msg: `无效的组件id: ${req.query.ExamComponent}`,
            data: null
        })
    }
    const exam = await models.Exam.findOne({
        where: {
            Status: {
                [Op.ne]: 3,
            },
            Creator: req.info.Id,
            ExamComponent: ExamComponent,
        }
    });
    return res.json({
        code: 0,
        msg: `success`,
        data: exam ? exam.toJSON() : null
    })
})
/**
 * 获取考核列表
 */
router.get('/deliver', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        // const ExamComponent = Number.parseInt(req.query.ExamComponent);
        // const IncludeShared = ['true', '1'].includes(req.query.IncludeShared) ? 1 : 0;
        const archived = ['true', '1'].includes(req.query.archived);
        let condition = { Deleted: false }
        // if (ExamComponent !== 0) {
        //     condition = { ExamComponent: ExamComponent, ...condition }
        // }
        if (archived) {
            condition = { Status: 3, ...condition }
        } else {
            condition = {
                ...condition, Status: { [Op.ne]: 3 }
            }
        }

        if (req.info.Role === 2) {
            const { Id } = req.info;
            condition = { ...condition, TeacherPhone: Id }
        }
        if (req.info.Role === 3) {
            return res.json({
                code: 1,
                msg: `学生无权查询考核列表`,
                data: null
            })
        }
        // if (IncludeShared) {
        //     condition = { [Op.or]: [condition, { Shared: 1 }] }
        // }
        const delivers = await models.ExamDeliver.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: condition
        });
        const total = await models.ExamDeliver.count({ where: condition });
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: delivers.map(deliver => deliver.toJSON()),
            page: page,
            limit: Math.min(limit, delivers.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
/**
 * 查询考核提交进度
 */
router.get(`/deliver/progress`, async (req, res, next) => {
    try {
        const ids = req.query.ids.map(id => Number.parseInt(id));
        if (ids.some(id => isNaN(id))) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `请求中存在无效的id: ${req.query.ids}`,
                data: null,
            })
        }
        const delivers = await models.ExamDeliver.findAll({
            where: { Id: ids }
        })
        const result = await Promise.all(ids.map(async id => {
            const { count, rows } = await models.ExamDeliverDetail.findAndCountAll({
                where: { Deleted: 0, DeliverId: id }
            });
            if (count === 0 || !rows || rows.length === 0) return { id, progress: 0 }
            const finishedDetails = rows.filter(detail => {
                const deliver = delivers.filter(d => d.Id === detail.DeliverId);
                if (deliver.length === 0) return detail.Status !== 0;
                if (deliver.ExamType === 0) return detail.Status >= 2;
                return detail.Status !== 0
            })
            return { id, progress: Math.floor(finishedDetails.length * 100 / count) }
        }));
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result,
        })
    } catch (error) {
        next(error)
    }
})

//获取考核统计概览
router.get(`/deliver/:id/stat`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核id: ${req.params.id}`,
                data: null
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未查询到考核id: ${req.params.id}`,
                data: null
            })
        }
        if (deliver.Status !== 3) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `考核id: ${req.params.id}尚未完成复测，无法获取统计信息`,
                data: null
            })
        }
        const stat = await models.ExamDeliverStat.findOne({
            where: {
                DeliverId: id,
                Deleted: 0
            }
        });
        if (!stat) {
            return res.json({
                code: ErrCode.ERR_NOT_FOUND,
                msg: `考核id: ${req.params.id}统计信息自动生成失败，请联系管理员处理。`,
                data: null
            })
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `SUCCESS`,
            data: stat.toJSON()
        })
    } catch (error) {
        next(error)
    }
})
//获取考核的成绩分布
router.get(`/deliver/:id/dist`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核id: ${req.params.id}`,
                data: null
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未查询到考核id: ${req.params.id}`,
                data: null
            })
        }
        if (deliver.Status !== 3) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `考核id: ${req.params.id}尚未完成复测，无法获取成绩分布`,
                data: null
            })
        }
        const stat = await models.ExamDeliverDist.findOne({
            where: {
                DeliverId: id,
                Deleted: 0
            }
        });
        if (!stat) {
            return res.json({
                code: ErrCode.ERR_NOT_FOUND,
                msg: `考核id: ${req.params.id}统计信息自动生成失败，请联系管理员处理。`,
                data: null
            })
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `SUCCESS`,
            data: stat.toJSON()
        })
    } catch (error) {
        next(error)
    }
})
//获取考核的具体项评分
router.get(`/deliver/:id/scores`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核id: ${req.params.id}`,
                data: null
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未查询到考核id: ${req.params.id}`,
                data: null
            })
        }
        if (deliver.Status !== 3) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `考核id: ${req.params.id}尚未完成复测，无法获取成绩分布`,
                data: null
            })
        }
        const details = await models.ExamDeliverSizeStat.findAll({
            where: {
                DeliverId: id,
                Deleted: 0
            }
        })
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `SUCCESS`,
            data: details.map(detail => detail.toJSON()),
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 教师下载得分详情
 */
router.get(`/deliver/:id/download`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.status(404).end(`无效id:${id}`);
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.status(404).end('未找到deliver');
        }
        const details = await models.ExamDeliverDetail.findAll({ where: { DeliverId: id } })
        const teacher = await models.Teacher.findOne({ where: { Phone: req.info.Id, Deleted: 0 } })
        const size_stats = await models.ExamDeliverSizeStat.findAll({ where: { DeliverId: id } });
        const Class = deliver.Class
        const ExamDate = deliver.ExamDate;
        const PublishTeacher = teacher?.Name;
        // let ItemCount = 0
        // const valids = details.filter(detail => detail.FinalScore !== null)
        // if (valids.length > 0) {
        //     ItemCount = valids[0].FinalData.length;
        // }
        const content = details.map((detail, idx) => {
            if (detail.FinalScore === 0 || !detail.FinalData) return [`考生${idx}`]
            const sortedItems = detail.FinalData.sort((a, b) => {return a.sizeId - b.sizeId});
            return [`考生${idx}`, ...sortedItems.map(item => item.score), detail.FinalScore]
        })
        const sortedStats = size_stats.sort((a, b) => {return a.SizeId - b.SizeId})
        const avgs = sortedStats.map(stat => stat.ScoreAvg /100)
        const types = sortedStats.map((stat, idx) =>  stat.IsSecurity ? `安全文明${idx+1}` : `评分项${idx+1}`)
        const data1 = [
            ["实训考核班级成绩统计"],
            ["考核班级", `${Class}`, "考核日期", `${ExamDate}`,"考核发布人", `${PublishTeacher}`,"", "考核图样设计"],
            ["", ...types,"总分"],
            ...content,
            [],
            ["平均分统计", ...avgs]
        ]
        const merge = {s: {c: 0, r: 0}, e: {c: 8, r: 0}}; // A1:H1
        const sheetOptions = {'!merges': [
            {s: {c: 0, r: 0}, e: {c: 8, r: 0}}, // A1:H1
            // {s: {c: 2, r: 1}, e: {c: 3, r: 1}}, //C2： D2
            // {s: {c: 6, r: 1}, e: {c: 8, r: 1}}, // G2: H2
            // {s: {c: 12, r: 1}, e: {c: 14, r: 1}}, // G2: H2
        ]};
        const buffer = xlsx.build([{name: 'mySheetName', data: data1}], {sheetOptions}); // Returns a buffer
        // const buf = await exportScoreDetail(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
        res.setHeader("Content-Disposition", "attachment; filename=" + 'test' + ".xlsx");
        res.end(buffer, 'binary');
    } catch (error) {
        next(error)
    }
})

/**
 * 指定id查询deliver详情
 */
router.get(`/deliver/:id`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的id:${req.params.id}`,
                data: null
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未找到考核信息:${req.params.id}`,
                data: null
            })
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: deliver.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

router.get(`/detail/:id`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的detail id: ${req.params.id}`,
                data: null,
            })
        }
        const detail = await models.ExamDeliverDetail.findByPk(id);
        if (!detail) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未找到detail id: ${req.params.id}`,
                data: null
            })
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: detail.toJSON(),
        })

    } catch (error) {
        next(error)
    }
})

/**
 * 按id查询exam，其他精确的get方法的请求请放在这个之前
 */
router.get('/:Id', async (req, res, next) => {
    try {

        const Id = Number.parseInt(req.params.Id);
        if (isNaN(Id)) {
            const result = {
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: '无效的考核Id',
                data: null,
            }
            return res.status(200).json(result);
        }

        const exam = await models.Exam.findByPk(Id);
        // let ret = { ...exam.toJSON() }; //下发班级初始化为空
        // if (exam && exam.Class !== 0) {
        //     const cls = await models.Class.findByPk(exam.Class);
        //     if (cls) {
        //         ret.Class = `${cls.Grade}级${cls.Class}班`;
        //     }
        // }
        const result = {
            code: 0,
            msg: 'success',
            data: exam.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});

/**
 * 更新考卷的状态，班级信息已重构后不支持
 */
router.patch('/:Id', async (req, res, next) => {
    try {
        const ExamId = Number.parseInt(req.params.Id);
        if (isNaN(ExamId)) {
            return res.status(200).json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核Id:${req.params.Id}`,
                data: null
            });
        }
        const exam = await models.Exam.findByPk(ExamId);
        if (!exam) {
            return res.status(200).json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未找到考核:${req.params.Id}，请确认。`,
                data: null
            });
        }
        const { Status, Grade, Major, Class } = req.body;
        if (![0, 1, 2].includes(Number.parseInt(Status))) {
            return res.status(200).json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的状态枚举值: ${Status}`,
                data: null
            });
        }
        if (Grade && Maojr && Class) {
            const cls = await models.Class.findOne({
                where: { Grade: Grade, Major: Major, Class: Class }
            });
            if (!cls) {
                return res.json({
                    code: ERR_INVALID_PARAMS,
                    msg: `未录入班级: ${Grade}级${Major}${Class}班的学生信息。`,
                    data: null
                })
            }
            await exam.update({ Status: Status, Class: cls.Id });
        }
        else {
            await exam.update({ Status: Status });
        }
        return res.status(200).json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exam.toJSON()
        });

    } catch (err) {
        next(err)
    }
})

/**
 * 更新考核的状态
 */
router.patch('/deliver/:id', async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id);
        const status = req.body.status;
        if (isNaN(status)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的状态值 ${status}`,
                data: null
            })
        }
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核id ${req.params.id}`,
                data: null
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `不存在的考核id ${id}`,
                data: null
            })
        }
        await deliver.update({ Status: status })
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: deliver.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

router.get('/:id/result', (req, res) => {
    res.send('考核结果');
});
/**
 * 保存考核标准
 */
router.post('/criteria', async (req, res, next) => {
    try {
        const examId = Number.parseInt(req.query.ExamId);
        const exam = await models.Exam.findByPk(examId);
        if (!exam) {
            const result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${examId}的考核`,
                data: null
            }
            return res.status(404).json(result);
        }
        let CriteriaId;
        const count = await models.ExamCriteria.count();
        if (count === 0) {
            CriteriaId = 1;
        }
        else {
            const criteria = await models.ExamCriteria.findAll({
                order: [["Id", "DESC"]],
                limit: 1
            });
            CriteriaId = criteria[0].CriteriaId + 1;
        }
        console.log(`examID:${examId}, CriteriaId: ${CriteriaId}`)
        await exam.update({ CriteriaId: CriteriaId });
        const result = await getComponentCriteria(exam.ExamComponent);
        const { SizedElement,
            GeoElement,
            surfaceRoughnessElement,
            UnDeclaredChamferCount,
            UnDeclaredChamferTotalVal } = req.body;
        console.log(`保存考核标准请求：${JSON.stringify(req.body)}`);
        SizedElement.map(async item => {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.SizedElement,
                SizeType: item.key,
                SizeDelta: item.SizeDelta,
                SizeDeductScore: item.SizeDeductScore
            })
        })
        GeoElement.map(async item => {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.GeometricalTolerance,
                GeoType: item.val,
                GeoBase: item.GeoBase,
                GeoDelta: item.GeoDelta,
                GeoDeductScore: item.GeoDeductScore
            })
        })
        surfaceRoughnessElement.map(async item => {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.SurfaceRoughness,
                SurfaceRoughnessVal: item.size,
                SurfaceRoughnessCount: item.count,
                SurfaceRoughnessScore: item.surfaceRoughnessTotalScore
            })
        })

        if (UnDeclaredChamferCount === 0) {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.Other,
                UnDeclaredChamferCount: 0,
                UnDeclaredChamferTotalVal: 0
            })
        } else {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.Other,
                UnDeclaredChamferCount: UnDeclaredChamferCount,
                UnDeclaredChamferTotalVal: UnDeclaredChamferTotalVal
            })
        }
        //考核标准保存成功后，更新考核创建状态；
        await exam.update({ Status: 2, Data: { ...exam.Data, "criterias": req.body } });
        const ret = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exam.toJSON()
        }
        return res.status(200).json(ret);
    }
    catch (err) {
        next(err)
    }
})
/**
 * 保存每个尺寸的配分
 */
router.post('/scores', async (req, res, next) => {
    try {
        const examId = Number.parseInt(req.query.ExamId);
        const exam = await models.Exam.findByPk(examId);
        if (!exam) {
            const result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${examId}的考核`,
                data: null
            }
            return res.status(404).json(result);
        }
        const { scores } = req.body;
        await exam.update({ Status: 3, Data: { ...exam.Data, "scores": scores } });
        const ret = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: exam.toJSON()
        }
        return res.status(200).json(ret);
    }
    catch (err) {
        next(err)
    }
})

/**
 * 保存考核项目
 */
router.post('/target', async (req, res, next) => {
    try {
        const { Name } = req.body;
        const target = await models.ExamTarget.create({ Name: Name });
        if (!target) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `保存失败`, data: null })
        }
        const ret = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: target.toJSON()
        }
        return res.status(200).json(ret);
    }
    catch (err) {
        next(err)
    }
})

/**
 * 成绩归档
 */
router.post(`/deliver/:id/finish`, async (req, res, next) => {
    try {
        const id = req.params.id;
        if (isNaN(id)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考核id: ${req.params.id}`,
                data: null,
            })
        }
        const deliver = await models.ExamDeliver.findByPk(id);
        if (!deliver) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未查询到考核id: ${req.params.id}`,
                data: null
            })
        }
        if (deliver.Status !== 2) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `考核id: ${req.params.id}不处于收卷复测中，无法归档。`,
                data: null
            })
        }

        //归档，第一步： 先统计概览信息 count为参考总人数，totalCount为实际应参考总人数。
        const { rows, count } = await models.ExamDeliverDetail.findAndCountAll({
            where: {
                DeliverId: id,
                Status: 3,
                Deleted: 0
            }
        });
        const totalCount = await models.ExamDeliverDetail.count({ where: { DeliverId: id, Deleted: 0 } });
        const totalScore = rows.map(item => item.FinalScore).reduce((sum, value) => sum + value * 1.0, 0);
        const AvgScore = Math.round(totalScore * 100 / totalCount);
        const PassRate = Math.round(rows.filter(item => item.FinalScore >= 60).length * 100 / totalCount);
        const ExclRate = Math.round(rows.filter(item => item.FinalScore >= 90).length * 100 / totalCount);
        const LowRate = Math.round((rows.filter(item => item.FinalScore <= 30).length + totalCount - count) * 100 / totalCount);
        const StandardDiff = 0; //TODO:
        const general = await models.ExamDeliverStat.create({
            DeliverId: id,
            PartCnt: count,
            AvgScore, PassRate, ExclRate, LowRate, StandardDiff
        });
        if (!general) {
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，保存考核统计失败。`,
                data: null
            })
        }

        //第二步：成绩分段统计
        const ScoreLe30 = rows.filter(item => item.FinalScore < 30).length + totalCount - count;
        const Score3040 = rows.filter(item => item.FinalScore >= 30 && item.FinalScore < 40).length;
        const Score4050 = rows.filter(item => item.FinalScore >= 40 && item.FinalScore < 50).length;
        const Score5060 = rows.filter(item => item.FinalScore >= 50 && item.FinalScore < 60).length;
        const Score6070 = rows.filter(item => item.FinalScore >= 60 && item.FinalScore < 70).length;
        const Score7080 = rows.filter(item => item.FinalScore >= 70 && item.FinalScore < 80).length;
        const Score8090 = rows.filter(item => item.FinalScore >= 80 && item.FinalScore < 90).length;
        const Score90100 = rows.filter(item => item.FinalScore >= 90 && item.FinalScore < 100).length;

        const item_stat = await models.ExamDeliverDist.create({
            DeliverId: id,
            ScoreLe30, Score3040, Score4050, Score5060, Score6070, Score7080, Score8090, Score90100
        })
        if (!item_stat) {
            await general.update({ Deleted: 1 })
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，保存分段统计失败。`,
                data: null
            })
        }
        //第三步，成绩数据打平保存
        const exam = await models.Exam.findByPk(deliver.ExamId);
        if (!exam) {
            await general.update({ Deleted: 1 })
            await item_stat.update({ Deleted: 1 })
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，关联的考卷丢失。`,
                data: null
            })
        }
        const sizes = await models.ComponentSize.findAll({
            where: { ComponentId: exam.ExamComponent }
        })
        if (sizes.length === 0) {
            await general.update({ Deleted: 1 })
            await item_stat.update({ Deleted: 1 })
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，关联的考卷尺寸数据丢失。`,
                data: null
            })
        }
        const TotalScores = exam.Data.scores;
        const details = await models.ExamDeliverDetail.findAll({
            where: {
                DeliverId: id,
                Deleted: 0,
                Status: 3
            }
        });
        if (details.length === 0) {
            await general.update({ Deleted: 1 })
            await item_stat.update({ Deleted: 1 })
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，查询考核项详情失败。`,
                data: null
            })
        }
        const FinalDatas = details.map(detail => detail.FinalData);
        const data = TotalScores.map(sizeScorePaire => {
            const SizeId = sizeScorePaire.SizeId;
            const size = sizes.filter(sz => sz.Id === SizeId);
            const IsSecurity = size.length > 0 && size[0].FirstType === 4;
            const Total = sizeScorePaire.Score;
            const currents = FinalDatas.map(arr => arr.filter(item => item.sizeId === SizeId)).flat();
            const ScoreAvg = currents.length > 0 ? Math.round(currents.reduce((prev, current) => prev + current.score, 0) * 100 / currents.length) : 0;
            const ScoreRate = currents.length > 0 ? Math.round(currents.filter(item => item.score !== 0).length * 100 / currents.length) : 0;
            return {
                SizeId, Total, ScoreAvg, ScoreRate, DeliverId: id, IsSecurity
            }
        })
        const size_stats = await models.ExamDeliverSizeStat.bulkCreate(data);
        if (!size_stats) {
            await general.update({ Deleted: 1 })
            await item_stat.update({ Deleted: 1 })
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败，存储考核项详情失败。`,
                data: null
            })
        }
        const result = await deliver.update({ Status: 3 });
        if (!result || result.Status !== 3) {
            await general.update({ Deleted: 1 })
            await item_stat.update({ Deleted: 1 })
            await Promise.all(size_stats.map(async stat => stat.update({ Deleted: 1 })))
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `考核id: ${req.params.id}归档失败。`,
                data: null
            })
        }
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result.toJSON()
        })
    } catch (error) {
        next(error)
    }
})
/**
 * 发起考卷共享请求
 */
router.post('/:id/audit', async (req, res, next) => {
    try {
        const examId = req.params.id;
        if (isNaN(examId)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考卷id:${req.params.id}`,
                data: null
            })
        }
        const exam = await models.Exam.findByPk(examId);
        if (!exam) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `未查找到考卷:${req.params.id}`,
                data: null
            })
        }
        if (Number.parseInt(exam.Creator) !== req.info.Id) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `当前登录用户非考卷创建人，无法发起申请`,
                data: null
            })
        }
        if (exam.Shared !== 0) {
            return res.json({
                code: ErrCode.ERR_INCONSISTENT,
                msg: `当前考核状态非自见，无法重复发起申请`,
                data: null
            })
        }
        const result = await models.ExamShare.create({
            ExamId: examId,
            TeacherPhone: req.info.Id,
            Status: 2
        });
        await exam.update({ Shared: 2 })
        return res.json({
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: result.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 下发考卷
 */
router.post('/:id/deliver', async (req, res, next) => {
    try {
        const ExamId = Number.parseInt(req.params.id);
        if (isNaN(ExamId)) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考卷id: ${req.params.id}`,
                data: null
            })
        }
        const exam = await models.Exam.findByPk(ExamId);
        if (!exam) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的考卷: ${req.params.id}`,
                data: null
            })
        }

        const { ExamName, ExamType, ExamDate, StartTime, FinishTime, Grade, Major, Class, Group } = req.body;
        const grade = await models.Grade.findOne({
            where: {
                Grade: Grade,
                Major: Major,
                Deleted: 0,
            }
        })
        if (!grade) {
            return res.json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的年级专业: ${Grade}-${Major}`,
                data: null
            })
        }
        console.log(`typeof ExamDate: ${typeof ExamDate}`);
        const eDate = new Date(ExamDate.substring(0, 10));
        console.log(`eDate: ${eDate}`)
        const sTime = new Date(StartTime);

        const sTimeStr = `${sTime.getHours()}:${sTime.getMinutes()}`;

        const fTime = new Date(FinishTime);
        const fTimeStr = `${fTime.getHours()}:${fTime.getMinutes()}`;
        console.log(`sTimeStr: ${sTimeStr}`)

        console.log(`fTimeStr: ${fTimeStr}`)
        const record = await models.ExamDeliver.create({
            ExamId: ExamId,
            ExamName: ExamName,
            ExamType: ExamType,
            TeacherPhone: req.info.Id,
            ExamDate: ExamDate,
            StartTime: sTimeStr,
            FinishTime: fTimeStr,
            GradeId: grade.Id,
            Class: Class,
            GroupName: Group === 'A' ? 'A' : Group === 'B' ? 'B' : '',
        });
        if (!record) {
            return res.json({
                code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
                msg: `创建考核失败：DB写入异常`,
                data: null
            })
        }
        //TODO: 此处默认为仅支持单选
        let studentIds;
        if (['A', 'B'].includes(Group)) { //指定了具体分组时
            groupItem = await models.Group.findOne({
                where: {
                    GradeId: grade.Id,
                    Class: Class,
                    TeacherPhone: req.info.Id,
                    GroupName: Group,
                    Deleted: 0,
                }
            });
            if (!groupItem) {
                return res.json({
                    code: ErrCode.ERR_NOT_FOUND,
                    msg: `未找到教师${req.info.Name}对${Grade}${Major}${Class}班的分组信息`,
                    data: null
                })
            }
            studentIds = groupItem.StudentIds
        } else { //未指定分组
            let condition = { //至少指定了年级专业
                GradeId: grade.Id,
                Deleted: 0
            }
            if (Class !== undefined) condition = { ...condition, Class: Class } //还指定班级时
            const students = await models.Student.findAll({
                where: condition
            })
            studentIds = students.map(student => student.StudentId)
        }
        const details = studentIds.map(stuId => ({ DeliverId: record.Id, ExamId: record.ExamId, StudentId: stuId }));
        const result = await models.ExamDeliverDetail.bulkCreate(details);
        return res.json({
            code: 0, msg: `success`, data: result ? result.map(rst => rst.toJSON()) : null
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 保存自定义的尺寸偏差数据
 */
router.patch('/:examId/size/precision', async (req, res, next) => {
    try {
        const examId = Number.parseInt(req.params.examId);
        if (isNaN(examId)) {
            return res.json({ code: -1, msg: `考核Id非数值: ${req.params.examId}`, data: null })
        }
        const exam = await models.Exam.findByPk(examId);
        if (!exam) {
            return res.json({ code: -1, msg: `无效的考核Id: ${req.params.examId}`, data: null })
        }
        const { data } = req.body;
        if (data.length === 0) {
            await exam.update({ Status: 1 });
            return res.json({ code: 0, msg: `success`, data: [] })
        }

        //检查id是否都有效
        const ids = data.map(item => item.Id);
        const sizes = await models.ComponentSize.findAll({
            where: { Id: ids }
        })
        const existsIds = sizes.map(item => item.Id);
        if (sizes.length !== data.length) {
            const invalidIds = ids.filter(id => !existsIds.includes(id));
            return res.json({ code: 1, msg: `请求中存在无效的Id:${invalidIds}`, data: null })
        }
        const invalidSizes = sizes.filter(item => item.ComponentId !== exam.ExamComponent)
        if (invalidSizes.length > 0) {
            return res.json({ code: 1, msg: `请求中存在与考核不相关的组件尺寸id:${invalidSizes.map(item => item.Id)}`, data: null })
        }
        await exam.update({ Status: 1, Data: { ...exam.Data, precision: data } })
        return res.json({ code: 0, msg: `success`, data: exam.toJSON() });
    } catch (error) {
        next(error)
    }
})


module.exports = router