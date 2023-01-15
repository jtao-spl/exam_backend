const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
const { getComponentCriteria } = require('../service/component');
const { getTokenFromReq, getCachedDataInfo } = require('../utils/common');

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
        const token = getTokenFromReq(req);
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        const ExamComponent = Number.parseInt(req.query.ExamComponent);
        const Status = req.query.Status;
        let condition = { Deleted: false }
        if (ExamComponent !== 0) {
            condition = { ExamComponent: ExamComponent, ...condition }
        }
        if (Status) {
            condition = { Status: Status, ...condition }
        }
        //如果是学生，根据班级过滤考核
        if (token !== '') {
            const cache = await getCachedDataInfo(token);
            if (cache) {
                const info = JSON.parse(cache);
                const { Role, Class } = info;
                if (Role === 3 && Class !== undefined) {
                    condition = { ...condition, Class: Class }
                }
            }
        }
        const exams = await models.Exam.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: condition
        });
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
        // next(err)
    }
});
/***
 * 新增考核
 */
router.post('/', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const { ExamDate, StartTime, FinishTime, ExamTarget, ExamComponent, SizePrecisionLevel,
            ExamTeacher } = req.body;
        console.log(`typeof ExamDate: ${typeof ExamDate}`);
        const component = await models.Component.findByPk(ExamComponent);
        if (!component) {
            result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `组件id不存在，保存失败`
            }
            return res.status(200).json(result);
        }
        const eDate = new Date(ExamDate.substring(0, 10));
        console.log(`eDate: ${eDate}`)
        const sTime = new Date(StartTime);

        const sTimeStr = `${sTime.getHours()}:${sTime.getMinutes()}`;

        const fTime = new Date(FinishTime);
        const fTimeStr = `${fTime.getHours()}:${fTime.getMinutes()}`;
        console.log(`sTimeStr: ${sTimeStr}`)

        console.log(`fTimeStr: ${fTimeStr}`)


        const exam = await models.Exam.create({
            ExamDate: ExamDate,
            StartTime: sTimeStr,
            FinishTime: fTimeStr,
            ExamTarget: ExamTarget,
            ExamComponent: ExamComponent,
            SizePrecisionLevel: SizePrecisionLevel,
            ExamTeacher: ExamTeacher
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

        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: exam?.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});

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
        const { Status, Grade, Class } = req.body;
        if (![0, 1, 2].includes(Number.parseInt(Status))) {
            return res.status(200).json({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效的状态枚举值: ${Status}`,
                data: null
            });
        }
        if (Grade && Class) {
            const cls = await models.Class.findOne({
                where: { Grade: Grade, Class: Class }
            });
            if (!cls) {
                return res.json({
                    code: ERR_INVALID_PARAMS,
                    msg: `未录入班级: ${Grade}级${Class}班的学生信息。`,
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

        const ret = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: null
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
        await exam.update({ Data: { "scores": scores } });
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

module.exports = router