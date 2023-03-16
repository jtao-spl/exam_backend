const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Exam extends Model { }
    Exam.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ExamTarget: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        ExamComponent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        SizePrecisionLevel: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1,
        },
        Creator: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        CriteriaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: -1,
        },
        Status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Shared: {
            type:DataTypes.TINYINT,
            allowNull:false,
            defaultValue: 0,
        },
        Data: {
            type: DataTypes.JSON,
            allowNull: true
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "Exam",
        tableName: "t_exam",
    })
}



