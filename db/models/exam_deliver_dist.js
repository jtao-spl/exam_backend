const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamDeliverDist extends Model { }
    ExamDeliverDist.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        DeliverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        ScoreLe30: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Score3040: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score4050: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score5060: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score6070: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score7080: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score8090: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Score90100: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "ExamDeliverDist",
        tableName: "t_exam_deliver_dist",
    })
}



