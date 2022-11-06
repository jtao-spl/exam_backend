const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const ErrCode = require('../errcode');
const fs = require('fs');
const multer = require('multer');
const upload = multer({dest:'../images/'});
const {getComponentCriteria} = require('../service/component');


//获取零件列表
router.get('/', async (req, res, next) => {

    try {
        const page = Number.parseInt(req.query.page);
        const limit = Number.parseInt(req.query.limit);
        // console.log(`查询组件列表: page=${page}, limit=${limit}`);
        const components = await models.Component.findAll({
            order:[["Id","DESC"]],
            offset: page>0? (page-1) * limit: 0,
            limit:limit,
            where:{Deleted:false}
        });
        const total = await models.Component.count();
        // res.send(`获取零件列表, ${JSON.stringify(components)}` );
        const result = {
            code: ErrCode.SUCCESS,
            msg:'success',
            data:components.map(component => component.toJSON()),
            page: page,
            limit: Math.min(limit, components.length),
            total: total,
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
//仅供debug
router.post('/', async (req, res, next) => {
    try {
        const component = await models.Component.create({ t_component_name: "test111" })
        return res.status(200).json(components.toJson());
    } catch (err) {
        next(err)
    }
});
router.get('/count', async (req, res, next)=>{
    const count = await models.Component.count({
        where: {
            Deleted: false
        }
    });
    res.status(200).json({
        code: 0,
        msg: "success",
        data: {count: count}
    })
})

router.get('/creterials', async(req, res,next)=>{
    try {
        const id = Number.parseInt(req.query.ComponentId);
        if(id === 0){
            result = {
                code:0,
                msg: 'success',
                data: null
            }
            return res.status(200).json(result);
        }

        const m = await getComponentCriteria(id)
        result = {
            code:0,
            msg: 'success',
            data: m
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const id = Number.parseInt(req.params.id);
        const component = await models.Component.findByPk(id);
        if (!component) {
            const result = {
                code:ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${id}的组件`,
                data:null
            }
            return res.status(404).json(result);
        }
        const result = {
            code:ErrCode.SUCCESS,
            msg: `success`,
            data:component.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
router.post('/:id', async (req, res, next) => {
    try {
        //路径中的参数通过req.params.xxx来获取,注意类型转换
        const id = Number.parseInt(req.params.id);
        const component = await models.Component.findByPk(id);
        if (!component) {
            const result = {
                code:ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${id}的组件`,
                data:null
            }
            return res.status(404).json(result);
        }
        await component.update(req.body);
        const result = {
            code:ErrCode.SUCCESS,
            msg: `success`,
            data:component.toJSON()
        }
        return res.status(200).json(result);
    } catch (err) {
        next(err)
    }
});
router.post('/:id/download', async (req, res, next) => {
    // res.send('下载零件原文件');
    try {
        const id = Number.parseInt(req.params.id);
        const component = await models.Component.findByPk(id);
        if (!component) {
            const result = {
                code:ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${id}的组件`,
                data:null
            }
            return res.status(404).json(result);
        }
        const result = {
            code:ErrCode.SUCCESS,
            msg: `success`,
            data:component.name
        }
        return res.status(200).json(result);
    }catch(err){
        next(err)
    }
});
router.post('/:id/clip/upload', upload.single('file'), async (req, res, next)=>{
    try {
        if (!req.file) {
            return res.send({
                code: ErrCode.ERR_INVALID_PARAMS,
                msg: '上传文件不能为空'
            });
        }
        const file = req.file
        // 修改文件名字
        fs.renameSync('./public/images/' + file.filename, './public/images/' + file.originalname)
        // 设置响应类型以及编码
        res.set({
            'content-type': 'application/json; charset=utf-8'
        })
        const id = Number.parseInt(req.params.id);
        const component = await models.Component.findByPk(id);
        if (!component) {
            const result = {
                code:ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${id}的组件`,
                data:null
            }
            return res.status(404).json(result);
        }
        const imageUrl = '/images/' + file.originalname
        await component.update({
            ClipPath: imageUrl
        })
        result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: component.toJSON()
        }
    }
    catch(err){
        next(err)
    }
    
})


router.delete('/:id', async(req, res,next)=>{
    try {
        const id = Number.parseInt(req.params.id);
        const component = await models.Component.findByPk(id);
        if (!component) {
            const result = {
                code:ErrCode.ERR_NOT_FOUND,
                msg: `未找到id为${id}的组件`,
                data:null
            }
            return res.status(404).json(result);
        }
        await component.update({Deleted: true});
        const componentSizes = await models.ComponentSize.findAll({
            where:{
                ComponentId: id,
                Deleted: false
            }
        });
        componentSizes.map( async size=>{await size.update({Deleted: true})})
        const result = {
            code:ErrCode.SUCCESS,
            msg: `success`,
            data: null
        }
        return res.status(200).json(result);
    }catch(err){
        next(err)
    }
})

module.exports = router