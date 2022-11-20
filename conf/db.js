const env = process.env.NODE_ENV  // 环境参数
// 配置
let MYSQL_CONF
let REDIS_CONF

if (env === 'dev') {
    // mysql
    MYSQL_CONF = {
        host: 'localhost',
        user: 'root',
        password: 'KTIpdx91@1',
        port: '3306',
        database: 'db_pingce'
    }
    // redis
    REDIS_CONF = {
        port: 6379,
        host: 'localhost'
    }
}

if (env === 'production') {
    // mysql
    MYSQL_CONF = {
        host: 'localhost',
        user: 'root',
        password: '******',
        port: '****',
        database: 'nodeServer'
    }

    // redis
    REDIS_CONF = {
        port: 6379,
        host: 'localhost'
    }
}

module.exports = {
    MYSQL_CONF,
    REDIS_CONF
}