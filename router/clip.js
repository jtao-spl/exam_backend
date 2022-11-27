const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const ErrCode = require('../errcode');
const { models } = require('../db/index');
const path = require('path')
const upload = multer({dest:path.join(__dirname, 'tmp')});

router.post('/:id/upload', upload.single('file'), async (req, res, next)=>{
    
    if (!req.file) {
        return res.send({
            code: ErrCode.ERR_INVALID_PARAMS,
            msg: '上传文件不能为空'
        });
    } else {
        const file = req.file
        // 修改文件名字
        const targetPath = path.join(__dirname, '../public/images/' + file.originalname)
        // fs.writeFileSync()
        fs.renameSync(file.path, targetPath);
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
            ClipPath: imageUrl,
            Status: 3
        })
        result = {
            code: ErrCode.SUCCESS,
            msg: 'success',
            data: component.toJSON()
        }
        return res.status(200).json(result);

    }
})

module.exports = router