const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamDeliverSizeStat extends Model { }
    ExamDeliverSizeStat.init({
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
        SizeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Total: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        ScoreAvg: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        ScoreRate: {
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
        modelName: "ExamDeliverSizeStat",
        tableName: "t_exam_deliver_size_stat",
    })
}



