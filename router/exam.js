const express = require('express');
const { DATE } = require('sequelize');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
const { getComponentCriteria } = require('../service/component')

const ElementFirstType={
    SizedElement: 0,
    GeometricalTolerance: 1,
    SurfaceRoughness: 2,
    Other: 3
}
 const SizedElementSubType={
    Line: 0,
    Diameter: 1,
    Radial: 2,
    Angle: 3
}
 const SizedElementSymbol = ['L','D','R', '∠'];
 const GelToleranceSymbol = ['u','c','e','g','k','d','f','b','a','r','i','j','h','t'];

/**
 * 获取考核列表
 */
router.get('/', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        const ExamComponent = Number.parseInt(req.query.ExamComponent);
        let condition = { Deleted: false }
        if (ExamComponent !== 0) {
            condition = { ExamComponent: ExamComponent, ...ExamComponent }
        }
        const exams = await models.Exam.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: condition
        });
        const total = await models.Exam.count();
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
router.get('/:id', (req, res) => {
    res.send('考卷评分详情');
});
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
        const { SizedElement, GeoElement,SurfaceRoughnessDesc, OtherDesc } = req.body;
        SizedElement.map(async item => {
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.SizedElement,
                SizeType: item.key,
                SizeDelta: item.SizeDelta,
                SizeDeductScore: item.SizeDeductScore
            })
        })
        GeoElement.map(async item=>{
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.GeometricalTolerance,
                GeoType: item.val,
                GeoBase: item.GeoBase,
                GeoDelta: item.GeoDelta,
                GeoDeductScore: item.GeoDeductScore
            })
        })
        if (SurfaceRoughnessDesc){
            await models.ExamCriteria.create({
                CriteriaId: CriteriaId,
                FirstType: ElementFirstType.SurfaceRoughness,
                SurfaceRoughnessDesc:SurfaceRoughnessDesc
            })
        }
        await models.ExamCriteria.create({
            CriteriaId: CriteriaId,
            FirstType: ElementFirstType.Other,
            OtherDesc:OtherDesc
        })

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

module.exports = router