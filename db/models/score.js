const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Score extends Model { }
    Score.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        StudentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        ExamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        SelfData: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        SelfScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        GroupData: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        GroupScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        FinalData: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        FinalScore: {
            type: DataTypes.INTEGER,
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
        modelName: "Score",
        tableName: "t_score",
    })
}



