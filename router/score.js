const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
// const { getTokenFromReq, getCachedDataInfo } = require('../utils/common');


/**
 * 保存成绩
 */
router.post('/', async (req, res, next) => {
    try {
        const { ExamId, SelfData, SelfScore, GroupData, GroupScore, FinalData, FinalScore, StudentId } = req.body;
        // const token = getTokenFromReq(req);
        // if (!token) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const data = await getCachedDataInfo(token);
        // if (!data) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const info = JSON.parse(data);
        const info = req.info;
        if (SelfData !== undefined && info.Role !== 3) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前登录用户角色非学生，无法保存自测成绩`, data: null })
        }
        if (GroupData !== undefined && info.Role !== 3) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前登录用户角色非学生，无法保存小组成绩`, data: null })
        }
        if (FinalData !== undefined && info.Role !== 2) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前登录用户角色非教师，无法保存教师复测成绩`, data: null })
        }
        if (info.Role === 3 && !info.Id) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `系统异常，查询学生缓存信息失败，请重新登录`, data: null })
        }
        if(info.Role === 2 && !StudentId){
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `系统异常，保存复测数据时请求中未指定学生id`, data: null })
        }
        let studentId = StudentId;
        if(info.Role === 3){
            studentId = info.Id
        }
        const record = await models.Score.findOne({ where: { StudentId: studentId, ExamId: ExamId } });
        //记录不存在。新增场景
        if (!record) {
            if (SelfData && SelfScore) {
                const newRecord = await models.Score.create({ ExamId: ExamId, StudentId: info.Id, SelfData: SelfData, SelfScore: SelfScore });
                return res.json({ code: 0, msg: `success`, data: newRecord.toJSON() });
            }
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `系统异常，初次提交应为个人自测数据，当前请求中自测数据缺失`, data: null })
        }
        //记录存在，更新场景
        if (record.ExamId !== ExamId) {
            return res.json({ code: ErrCode.ERR_INCONSISTENT, msg: `系统异常，更新的考核ID与数据库中数据不一致`, data: null });
        }
        if (record.StudentId !== info.Id && info.Role !== 2) {
            //学号与数据库不一致， 如果不是小组成绩，抛异常
            if (GroupData && GroupScore) {
                //更新小组成绩
                await record.update({ GroupData: GroupData, GroupScore: GroupScore });
                return res.json({ code: 0, msg: `success`, data: record.toJSON() });
            }
            return res.json({ code: ErrCode.ERR_INCONSISTENT, msg: `系统异常，登录账号与数据库学号不一致且小组评测数据缺失，非小组评测场景`, data: null });
        }
        //更新自测成绩
        if (SelfData && SelfScore) {
            await record.update({ SelfData: SelfData, SelfScore: SelfScore });
            return res.json({ code: 0, msg: `success`, data: record.toJSON() });
        }
        if (GroupData && GroupScore) {
            return res.json({ code: ErrCode.ERR_INCONSISTENT, msg: `系统异常，登录账号与数据库学号一致，但尝试更新小组评测数据。`, data: null });
        }
        if (info.Role === 2 && FinalData && FinalScore) {
            await record.update({ FinalData: FinalData, FinalScore: FinalScore });
            return res.json({ code: 0, msg: `success`, data: record.toJSON() });
        }
        return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `系统异常，无效请求：${JSON.stringify(req.body)}。`, data: null });

    } catch (error) {
        next(error)
    }
})

/**
 * 检查学生是否已提交自测数据
 */
router.get('/issubmitted', async (req, res, next) => {
    try {
        const { ExamId } = req.query;
        // const token = getTokenFromReq(req);
        // if (!token) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const data = await getCachedDataInfo(token);
        // if (!data) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const info = JSON.parse(data);
        
        //自定义中间件注入
        const info = req.info;
        if (info.Role === 2) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前角色非学生`, data: null })
        }
        const record = await models.Score.findOne({ where:{ ExamId: ExamId, StudentId: info.Id }});
        let isSubmitted = false
        if (record) {
            isSubmitted = true
        }
        return res.json({ code: 0, msg: `success`, data: { isSubmitted: isSubmitted } })

    } catch (error) {
        next(error)
    }
})

/**
 * 返回考卷列表,需校验用户身份为教师
 */

router.get('/list', async (req, res, next) => {
    const { ExamId, page, limit } = req.query;
    if (isNaN(Number.parseInt(ExamId))) {
        return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的考核ID: ${ExamId}`, data: null });
    }
    if (isNaN(Number.parseInt(page)) || isNaN(Number.parseInt(limit))) {
        return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的分页请求: page: ${page}, limit: ${limit}`, data: null });
    }
    // const token = getTokenFromReq(req);
    // if (!token) {
    //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
    // }
    // const data = await getCachedDataInfo(token);
    // if (!data) {
    //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
    // }
    // const info = JSON.parse(data);
    const info = req.info;
    if (info.Role !== 2) {
        return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前角色非教师，无法获取数据`, data: null })
    }
    const pg = Number.parseInt(page);
    const lmt = Number.parseInt(limit);
    const records = await models.Score.findAll({
        offset: pg > 0 ? (pg - 1) * lmt : 0,
        limit: lmt,
        where: {
            ExamId: ExamId,
            Deleted: false
        }
    })
    const count = await models.Score.count({ where: { ExamId: ExamId, Deleted: false } })
    if (records) {
        return res.json({
            code: 0,
            msg: `success`,
            data: records.map(record => record.toJSON()),
            page: page,
            limit: Math.min(lmt, records.length),
            total: count
        })
    }
    return res.json({
        code: 0,
        msg: `success`,
        data: null,
        page: page,
        limit: 0,
        total: 0
    })
})

/**
 * 查询提交的考核数据
 */
router.get('/', async (req, res, next) => {
    try {
        const { ExamId } = req.query;
        // const token = getTokenFromReq(req);
        // if (!token) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const data = await getCachedDataInfo(token);
        // if (!data) {
        //     return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const info = JSON.parse(data);
        const info = req.info;
        if (info.Role === 2) {
            return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `当前角色非学生`, data: null })
        }
        const record = await models.Score.findOne({ ExamId: ExamId, StudentId: info.Id });
        if (record) {
            return res.json({ code: 0, msg: `success`, data: record.toJSON() })
        }
        return res.json({ code: 0, msg: `success`, data: null })
    } catch (error) {
        next(error)
    }
})

module.exports = router