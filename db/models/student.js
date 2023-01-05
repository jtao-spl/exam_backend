const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Student extends Model { }
    Student.init({
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
        Name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        Grade: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        Class: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "Student",
        tableName: "t_student",
    })
}



