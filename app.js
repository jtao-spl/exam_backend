const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const Component = require('./db/models/component');
// const mysql = require('./mysql')
const { models } = require('./db/index');
const app = express()
const component_router = require('./router/component');
const component_size_router = require('./router/component_size');
const exam_router = require('./router/exam');
const clip_router = require('./router/clip');

const ErrCode = require('./errcode');

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

app.use(function (req, res, next) {
  console.log(req.url);
  console.log(req.method);
  console.log(req.headers);
  console.log(req.body);
  next()
})

app.post('/login', async(req, res, next)=>{
  res.header('Access-Control-Expose-Headers', 'access-token');
  console.log(req.body);
  const {name, password} = req.body;
  if (!name ||!password){
    console.log("用户名或密码缺失。");
    return res.json(false);
  }
  const count = models.Auth.count({
      where:{
          Name: name,
          Password: password
      }
  });
  if (count != 0|| (name === 'admin' && password === '123456')){
     
    res.header('access-token', Date.now());
    res.json(true);
    } else {
        res.json(false);
    }
  
});

// app.use(require('./router/auth'));
app.use('/clip', clip_router);
app.use('/component', component_router);
app.use('/size', component_size_router);
app.use('/exam', exam_router);

app.use((req,res, next)=>{
  res.status(404).json({msg: '404 Not Found.'})
})
app.use((err, req, res, next) => {
  console.log('err', err);
  result = {
    code: ErrCode.ERR_INTERNAL_SERVER_ERROR,
    msg: err.message
  }
  return res.status(500).json(result);
})
app.listen(4000, () => {
  console.log('server is running at http://localhost:4000');
})