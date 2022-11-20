const redis = require('redis')
const { REDIS_CONF } = require('../conf/db.js')

// 创建客户端
const redisClient = redis.createClient({
   legacyMode:true
})
redisClient.on('error', err => {
    console.error(err)
})
redisClient.connect()
module.exports = redisClient