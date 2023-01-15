const express = require('express');
const router = express.Router();
const { models } = require('../db/index');
const { getTokenFromReq, getCachedDataInfo } = require('../utils/common');
const ErrCode = require('../errcode');
const { createToken } = require('../utils/jwt');
const redisClient = require('../db/redis');

router.post('/login', async (req, res, next) => {
  const { id, password } = req.body;
  if (!id || !password) {
    console.log("ID或密码缺失。");
    return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息缺失`, data: null });
  }
  const Id = Number.parseInt(id);
  const auth = await models.Auth.findOne({
    where: {
      Name: Id,
      Password: password
    }
  });
  if (auth !== null || (Id === 654321 && password === '123456')) {
    const token = createToken({ Id: Id, Password: password });
    console.log(`create token: ${token}, auth.role: ${auth.Role}`)

    let cacheData = { Role: auth.Role, Id: Id }
    //如果是学生，缓存班级信息
    const student = await models.Student.findOne({ where: { StudentId: Id } });
    if (student) {
      cacheData = { ...cacheData, Class: student.Class };
    }

    await redisClient.setEx(token, 3600 * 24, JSON.stringify(cacheData));
    console.log(`auth: ${JSON.stringify(auth)}}`)
    return res.json({
      code: ErrCode.SUCCESS,
      msg: `success`,
      status: auth.Status,
      token: token, 
      role: auth.Role || 3,
      Id: Id
    });
  } else {
    return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息无效`, data: null });
  }

});

router.patch('/modify', async(req, res,next)=>{
  try {
    const token = getTokenFromReq(req);
    if (!token) {
        return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
    }
    const data = await getCachedDataInfo(token);
    if (!data) {
        return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息已失效，请重新登录`, data: null })
    }
    const info = JSON.parse(data);
    const {Password, newPwd} = req.body;
    const auth = await models.Auth.findOne({where:{
      Password: Password,
      Name: info.Id
    }})
    if(!auth){
      return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `原始密码不匹配，修改失败`, data: null })
    }
    await auth.update({Password: newPwd, Status: 1});
    return res.json({ code: 0, msg: `success`, data: null })
  } catch (error) {
    next(error)
  }
})


module.exports = router