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
 * 切换教师状态
 */
router.patch('/teacher/:Id/status/toggle', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.Id)
        if (isNaN(Id)) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的Id：${Id}`, data: null });
        }
        const record = await models.Teacher.findByPk(Id);
        if (!record) {
            return res.json({ code: ErrCode.ERR_INVALID_PARAMS, msg: `无效的Id：${Id}`, data: null });
        }
        const curStatus = record.Deleted;
        await record.update({ Deleted: !curStatus })
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

module.exports = router