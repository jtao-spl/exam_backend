const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamShare extends Model { }
    ExamShare.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ExamId: {
            type:DataTypes.INTEGER,
            allowNull:false,
            defaultValue:0,
        },
        TeacherPhone: {
            type:DataTypes.STRING(20),
            allowNull:false,
            defaultValue: ''
        },
        Status:{
            type: DataTypes.TINYINT,
            allowNull:false,
            defaultValue: 0
        },
    }, {
        sequelize,
        modelName: "ExamShare",
        tableName: "t_exam_share",
    })
}
