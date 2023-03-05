const express = require('express');
const router = express.Router();
const { models } = require('../db/index');

/**
 * 获取工具列表
 */
router.get('/', async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);

        const tools = await models.Tool.findAll({
            order: [["Id", "DESC"]],
            offset: page > 0 ? (page - 1) * limit : 0,
            limit: limit,
            where: { Deleted: false }
        });
        const total = await models.Tool.count({ where: { Deleted: false } });
        // res.send(`获取零件列表, ${JSON.stringify(components)}` );
        const result = {
            code: 0,
            msg: 'success',
            data: tools.map(tool => tool.toJSON()),
            page: page,
            limit: Math.min(limit, tools.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (error) {
        next(error)
    }
})

/**
 * 删除工具
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.id);
        if (isNaN(Id)) {
            return res.json({
                code: 1,
                msg: `无效的id: ${req.params.id}`,
                data: null
            })
        }
        const tool = await models.Tool.findByPk(Id);
        if (!tool) {
            return res.json({
                code: 1,
                msg: `不存在的id: ${req.params.id}`,
                data: null
            })
        }
        await tool.update({ Deleted: 1 });
        return res.json({
            code: 0,
            msg: `success`,
            data: tool.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 更新工具名称
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const Id = Number.parseInt(req.params.id);
        const { Name } = req.body;
        if (isNaN(Id)) {
            return res.json({
                code: 1,
                msg: `无效的id: ${req.params.id}`,
                data: null
            })
        }
        const tool = await models.Tool.findByPk(Id);
        if (!tool) {
            return res.json({
                code: 1,
                msg: `不存在的id: ${req.params.id}`,
                data: null
            })
        }
        await tool.update({ Name: Name });
        return res.json({
            code: 0,
            msg: `success`,
            data: tool.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * 新增工具
 */
router.post('/', async (req, res, next) => {
    try {
        const { Name } = req.body;
        const tool = await models.Tool.create({ Name: Name });
        return res.json({
            code: 0,
            msg: `success`,
            data: tool.toJSON()
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router