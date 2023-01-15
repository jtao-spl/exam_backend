const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Teacher extends Model { }
    Teacher.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        Phone: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "Teacher",
        tableName: "t_teacher",
    })
}



