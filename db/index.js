const {Sequelize} = require('sequelize');

const sequelize = new Sequelize("db_pingce","root","KTIpdx91@1",{
    host: "localhost",
    dialect:"mysql",
});

const modelDefiners = [
    require('./models/component'),
    require('./models/component_size'),
    require('./models/auth'),
    require('./models/component_file'),
    require('./models/exam'),
    require('./models/exam_criteria'),
]

for (const modelDefiner of modelDefiners){
    modelDefiner(sequelize);
}

module.exports = sequelize