const {Sequelize} = require('sequelize');
const {MYSQL_CONF} = require('../conf/db.js');
const sequelize = new Sequelize(MYSQL_CONF.database,MYSQL_CONF.user,MYSQL_CONF.password,{
    host: MYSQL_CONF.host,
    dialect:"mysql",
});

const modelDefiners = [
    require('./models/component'),
    require('./models/component_size'),
    require('./models/auth'),
    require('./models/component_file'),
    require('./models/exam'),
    require('./models/exam_criteria'),
    require('./models/score'),
    require('./models/student'),
    require('./models/exam_target'),
    require('./models/grade'),
    require('./models/teacher'),
    require('./models/tool'),
    require('./models/exam_deliver'),
    require('./models/group'),
    require('./models/exam_share'),
    require('./models/exam_deliver_detail'),
    require('./models/exam_deliver_stat'),
    require('./models/exam_deliver_dist'),
    require('./models/exam_deliver_size_stat'),

]

for (const modelDefiner of modelDefiners){
    modelDefiner(sequelize);
}

module.exports = sequelize