const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamDeliverDetail extends Model { }
    ExamDeliverDetail.init({
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
        ExamId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        StudentId:{
            type: DataTypes.INTEGER,
            allowNull:false,
            defaultValue: 0
        },
        Status:{
            type: DataTypes.TINYINT,
            allowNull:false,
            defaultValue: 0
        },
        SelfData:{
            type: DataTypes.JSON,
        },
        SelfScore:{
            type: DataTypes.DECIMAL(6, 3),
        },
        GroupData:{
            type: DataTypes.JSON,
        },
        GroupScore:{
            type: DataTypes.DECIMAL(6, 3),
        },
        GroupId:{
            type: DataTypes.INTEGER,
        },
        FinalData:{
            type: DataTypes.JSON,
        },
        FinalScore:{
            type: DataTypes.DECIMAL(6, 3),
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "ExamDeliverDetail",
        tableName: "t_exam_deliver_detail",
    })
}



