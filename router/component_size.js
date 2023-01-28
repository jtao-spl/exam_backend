const express = require('express');
const { ElementFirstType } = require('../constants/component');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');

/**
 * 获取所有尺寸数据  或按照零件过滤的尺寸列表
 */
router.get('/', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换

        const { page, limit, ComponentId } = req.query;
        const id = Number.parseInt(ComponentId);
        const pg = Number.parseInt(page);
        const lim = Number.parseInt(limit);
        console.log(ComponentId, page, limit);
        let component_sizes;
        let count;
        if (id === 0) {
            component_sizes = await models.ComponentSize.findAll({
                order: [["Id", "DESC"], ["FirstType", "ASC"]],
                offset: pg > 0 ? (pg - 1) * lim : 0,
                limit: lim,
                where: {
                    Deleted: false
                }
            });
            count = await models.ComponentSize.count({
                where: { Deleted: false }
            });
        }
        else {
            component_sizes = await models.ComponentSize.findAll({
                order: [["Id", "DESC"]],
                where: {
                    ComponentId: id,
                    Deleted: false
                },
                offset: pg > 0 ? (pg - 1) * lim : 0,
                limit: lim,

            });
            count = await models.ComponentSize.count({
                where: {
                    ComponentId: id,
                    Deleted: false
                }
            });
        }
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: component_sizes.map(size => size.toJSON()),
            page: page,
            limit: limit,
            total: count,
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});

router.post('/', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const { ComponentId, FirstType, SecondType, BaseSize, GeoToleranceType,
            GeoToleranceVal, SurfaceRoughnessType, SurfaceRoughnessVal, UnDeclaredChamferCount } = req.body;
        const component = await models.Component.findByPk(ComponentId);
        if (!component) {
            result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `组件id不存在，保存失败`
            }
            return res.status(200).json(result);
        }
        if (![ElementFirstType.SizedElement,
        ElementFirstType.GeometricalTolerance,
        ElementFirstType.SurfaceRoughness,
        ElementFirstType.Other].includes(FirstType)) {
            result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `无效的项目类型枚举值: ${FirstType}`
            }
            return res.status(200).json(result);
        }
        if (FirstType === ElementFirstType.SizedElement && (!SecondType || !BaseSize)) {
            result = {
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效数据：尺寸类型或基准值缺失`
            }
            return res.status(200).json(result);
        }

        if (FirstType === ElementFirstType.GeometricalTolerance && (!GeoToleranceType || !GeoToleranceVal)) {
            result = {
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效数据：形位公差类型或公差精度缺失`
            }
            return res.status(200).json(result);
        }
        if (FirstType === ElementFirstType.SurfaceRoughness && (!SurfaceRoughnessType || !SurfaceRoughnessVal)) {
            result = {
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效数据：粗糙度类型或粗糙度值缺失`
            }
            return res.status(200).json(result);
        }
        if (FirstType === ElementFirstType.Other && !UnDeclaredChamferCount) {
            result = {
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: `无效数据：其他要求缺失`
            }
            return res.status(200).json(result);
        }
        const sizeEntity = await models.ComponentSize.create(req.body);
        result = {
            code: ErrCode.SUCCESS,
            msg: `success`,
            data: sizeEntity.toJSON()
        }

        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
})
/**
 * 获取当前表中尺寸记录总数 用于前端分页
 */
router.get('/count', async (req, res, next) => {
    // 获取组件相关的size数量
    const ComponentId = Number.parseInt(req.query.ComponentId);
    const count = await models.ComponentSize.count({
        where: {
            ComponentId: ComponentId,
            Deleted: false
        }
    });
    return res.status(200).json({
        code: 0,
        msg: "success",
        data: { count: count }
    })
})

/**
 * 查询尺寸数据（暂未用到获取单个尺寸数据的接口）
 */
router.get('/:size_id', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const { ComponentId } = req.body;
        const id = Number.parseInt(ComponentId);
        const size_id = Number.parseInt(req.params.size_id);
        const component_size = await models.ComponentSize.findByPk(size_id);
        if (!component_size) {
            const result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `未找到id=${size_id}的尺寸数据`
            }
            return res.status(404).json(result);
        }
        if (component_size.ComponentId != id) {
            const result = {
                code: ErrCode.ERR_INCONSISTENT,
                msg: `id=${size_id}的尺寸数据所属零件id不为${id}`
            }
            return res.status(404).json(result);
        }
        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: component_size.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }

});
/**
 * 更新尺寸数据
 */
router.put('/:size_id', async (req, res, next) => {
    try {
        const { ComponentId } = req.body;
        const id = Number.parseInt(ComponentId);
        const size_id = Number.parseInt(req.params.size_id);
        const component_size = await models.ComponentSize.findByPk(size_id);
        if (!component_size) {
            const result = {
                code: ErrCode.ERR_NOT_FOUND,
                msg: `未找到id=${size_id}的尺寸数据`
            }
            return res.status(404).json(result);
        }
        if (component_size.ComponentId != id) {
            const result = {
                code: ErrCode.ERR_INCONSISTENT,
                msg: `id=${size_id}的尺寸数据所属零件id不为${id}`
            }
            return res.status(404).json(result);
        }
        await component_size.update(req.body);

        const result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: component_size.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
/**
 * 删除尺寸数据
 */
router.delete('/:size_id', async (req, res, next) => {
    const size_id = Number.parseInt(req.params.size_id);
    const component_size = await models.ComponentSize.findByPk(size_id);
    if (!component_size) {
        const result = {
            code: ErrCode.ERR_NOT_FOUND,
            msg: `未找到id=${size_id}的尺寸数据`
        }
        return res.status(404).json(result);
    }
    await component_size.update({
        Deleted: true
    });
    const result = {
        code: ErrCode.SUCCESS,
        msg: 'success',
        data: null
    }
    return res.status(200).json(result);
})
module.exports = router