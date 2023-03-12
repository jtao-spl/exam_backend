const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express()
const auth_router = require('./router/auth');
const component_router = require('./router/component');
const component_size_router = require('./router/component_size');
const exam_router = require('./router/exam');
const clip_router = require('./router/clip');
const student_router = require('./router/student');
const score_router = require('./router/score');
const admin_router = require('./router/admin');
const tool_router = require('./router/tool');
const teacher_router = require('./router/teacher');
const { jwtAuth } = require('./utils/jwt');
const ErrCode = require('./errcode');
const { TeacherRoleRequired, AdminRoleRequired, FillInfoFromReq } = require('./utils/common');

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

app.use('/auth', auth_router)

//通过expressJwt来验证token，如果token不合格，会返回 err.name = UnauthorizedError
app.use(jwtAuth);
//注入redis中缓存的用户角色信息
app.use(FillInfoFromReq);

app.use('/admin', AdminRoleRequired, admin_router)
// app.use(require('./router/auth'));
app.use('/clip', TeacherRoleRequired, clip_router);
app.use('/component', TeacherRoleRequired, component_router);
app.use('/size', TeacherRoleRequired, component_size_router);
app.use('/exam', TeacherRoleRequired, exam_router);
app.use('/student', TeacherRoleRequired, student_router);
app.use('/score', score_router);
app.use('/tool', TeacherRoleRequired, tool_router);
app.use('/teacher', TeacherRoleRequired, teacher_router);

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