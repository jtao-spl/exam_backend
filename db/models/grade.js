const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Grade extends Model { }
    Grade.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        Grade: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        Major: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        ClassCount:{
            type: DataTypes.INTEGER,
            allowNull:false,
            defaultValue: 1,
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        sequelize,
        tableName: "t_grade",
        modelName: "Grade"
    })
}
