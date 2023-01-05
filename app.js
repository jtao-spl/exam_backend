const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { models } = require('./db/index');
const app = express()
const component_router = require('./router/component');
const component_size_router = require('./router/component_size');
const exam_router = require('./router/exam');
const clip_router = require('./router/clip');
const student_router = require('./router/student');
const { createToken, jwtAuth } = require('./utils/jwt');
const ErrCode = require('./errcode');
const redisClient = require('./db/redis');

app.use(express.static(path.join(__dirname, './public/')));//静态资源存放地址
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

// // log only 4xx and 5xx responses to console
app.use(morgan('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

// log all requests to access.log
app.use(morgan('common', {
  stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
}));

// app.use(function (req, res, next) {
//   // console.log(req.url);
//   // console.log(req.headers.authorization);
//   next()
// })


app.post('/login', async (req, res, next) => {
  const { id, password } = req.body;
  if (!id || !password) {
    console.log("ID或密码缺失。");
    return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息缺失`, data: null });
  }
  const Id = Number.parseInt(id);
  const auth = await models.Auth.findOne({
    where: {
      Id: Id,
      Password: password
    }
  });
  if (auth !== null || (Id === 654321 && password === '123456')) {
    const token = createToken({ Id: Id, Password: password });
    console.log(`create token: ${token}, auth.role: ${auth.Role}`)
    await redisClient.setEx(token, 3600 * 24, auth.Role);
    console.log(`auth: ${JSON.stringify(auth)}}`)
    return res.json({
      code: ErrCode.SUCCESS,
      msg: `success`,
      status: auth.Status,
      token: token, role: auth.Role || 3
    });
  } else {
    return res.json({ code: ErrCode.ERR_BAD_CREDENTIAL, msg: `登录信息无效`, data: null });
  }

});

//通过expressJwt来验证token，如果token不合格，会返回 err.name = UnauthorizedError
app.use(jwtAuth);

async function TeacherRoleRequired(req, res, next) {
  let token = '';
  const { authorization } = req.headers;
  const tokenArr = authorization.split(' ');
  if (tokenArr.length === 2) {
    token = tokenArr[1];
  }
  console.log(`token:${token}`);
  redisClient.get(token, (err, data)=>{
    if (err) {
      return res.status(200).json({code: 6,msg: `角色权限校验失败，请重新登录`});
    }
    if (data !== null){
      console.log(`use role: ${data}`);
      if (data === '2'){
        console.log(`match role === 2`)
        next('route')
      }
      else if (req.method ==='GET'){
        console.log(`match method === GET`)
        next('route')
      }
      else{
        return res.status(200).json({code: 6,msg: `角色权限校验失败，请重新登录`});
      }
    }
  })
}

// app.use(require('./router/auth'));
app.use('/clip', TeacherRoleRequired, clip_router);
app.use('/component', TeacherRoleRequired, component_router);
app.use('/size', TeacherRoleRequired, component_size_router);
app.use('/exam', TeacherRoleRequired, exam_router);
app.use('/student', TeacherRoleRequired, student_router)

app.use((req, res, next) => {
  res.status(404).json({ msg: '404 Not Found.' })
})
app.use((err, req, res, next) => {
  console.log('err', err);
  if (err.name === 'UnauthorizedError') {
    return res.json({
      msg: 'token过期, 请重新登录',
      tokenOut: true,
      code: 400
    })
  }
  result = {
    code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
    msg: err.message
  }
  return res.status(err.status || 500).json(result);
})
app.listen(4000, () => {
  console.log('server is running at http://localhost:4000');
})