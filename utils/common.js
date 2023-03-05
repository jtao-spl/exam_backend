const redisClient = require("../db/redis");

/**
 * 解析请求头中的token字符串
 * @param {*} req 
 * @returns 
 */
const getTokenFromReq = (req) => {
    let token = '';
    const { authorization } = req.headers;
    const tokenArr = authorization.split(' ');
    if (tokenArr.length === 2) {
        token = tokenArr[1];
    }
    return token;
}
//ref https://cloud.tencent.com/developer/ask/sof/1066771/answer/1498258
/**
 * 获取redis缓存信息，将函数promise化，方便用async await语法糖
 * @param {*} key 请求header中的token
 * @returns string of result
 */
const getCachedDataInfo = (key) => {
    return new Promise((res, rej) => {
        redisClient.get(key, (err, data) => {
            if (err) rej(err)
            res(data)
        })
    })
}

/**
 * 中间件，功能：校验请求的用户角色为教师，或者为get请求
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const TeacherRoleRequired = async (req, res, next) => {
    try {;
        console.log(`into TeacherRoleRequired, info: ${JSON.stringify(req.info)}`)
        if (req.info.Role === 2) {
            console.log(`当前用户角色为：教师`);
            next('route')
        }
        else if(req.info.Role === 1){
            console.log(`当前角色为管理员，拥有全部权限`);
            next('route')
        }
        else if (req.method === 'GET') {
            // req.info = info;
            console.log(`match method === GET`)
            next('route')
        }
        else {
            return res.status(200).json({ code: 6, msg: `角色权限校验失败，请重新登录` });
        }
    } catch (error) {
        return res.status(200).json({ code: 6, msg: `角色权限校验失败，请重新登录` });
    }
}


/**
 * 中间件，功能：校验请求的用户角色为管理员
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const AdminRoleRequired = async (req, res, next) => {
    try {
        // const token = getTokenFromReq(req);
        // if (!token) {
        //     return res.json({ code: 6, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // const data = await getCachedDataInfo(token);
        // if (!data) {
        //     return res.json({ code: 6, msg: `登录信息已失效，请重新登录`, data: null })
        // }
        // console.log(`当前用户缓存信息: ${JSON.stringify(data)}`);
        // const info = JSON.parse(data);
        console.log(`into AdminRoleRequired, info: ${JSON.stringify(req.info)}`)
        if (req.info.Role === 1) {
            console.log(`当前用户角色为：管理员`);
            // req.info = info;
            next('route')
        }
        // else if (req.method === 'GET') {
        //     console.log(`match method === GET`)
        //     next('route')
        // }
        else {
            return res.status(200).json({ code: 6, msg: `角色权限校验失败，请重新登录` });
        }
    } catch (error) {
        return res.status(200).json({ code: 6, msg: `角色权限校验失败，请重新登录` });
    }
}

/**
 * 从请求中附带的token查询缓存的用户角色信息
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const FillInfoFromReq = async(req, res, next)=>{
    try {
        const token = getTokenFromReq(req);
        if (!token) {
            return res.json({ code: 6, msg: `登录信息已失效，请重新登录`, data: null })
        }
        const data = await getCachedDataInfo(token);
        if (!data) {
            return res.json({ code: 6, msg: `登录信息已失效，请重新登录`, data: null })
        }
        console.log(`当前用户缓存信息: ${JSON.stringify(data)}`);
        const info = JSON.parse(data);
        req.info = info;
        next('route')
    } catch (error) {
       next(error)
    }
}

module.exports = {
    getTokenFromReq,
    getCachedDataInfo,
    TeacherRoleRequired,
    AdminRoleRequired,
    FillInfoFromReq
}