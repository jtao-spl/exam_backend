const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamDeliver extends Model { }
    ExamDeliver.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ExamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: -1,
        },
        TeacherPhone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        ExamDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        StartTime: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '00:00',
        },
        FinishTime: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '00:00',
        },
        GradeId:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Class:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Group:{
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "ExamDeliver",
        tableName: "t_exam_deliver",
    })
}



