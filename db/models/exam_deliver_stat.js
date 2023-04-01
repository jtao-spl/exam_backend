const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamDeliverStat extends Model { }
    ExamDeliverStat.init({
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
        PartCnt: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        AvgScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        PassRate: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        ExclRate: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        LowRate: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        StandardDiff: {
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
        modelName: "ExamDeliverStat",
        tableName: "t_exam_deliver_stat",
    })
}



