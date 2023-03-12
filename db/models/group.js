const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Group extends Model { }
    Group.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        GradeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Class: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        TeacherPhone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        GroupName:{
            type: DataTypes.STRING(2),
            allowNull:false,
            defaultValue:'A'
        },
        StudentIds:{
            type: DataTypes.JSON,
        },
        Deleted:{
            type: DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue:0,
        }
    }, {
        sequelize,
        tableName: "t_class_group",
        modelName: "Group"
    })
}
