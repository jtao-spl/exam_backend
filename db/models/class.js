const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Class extends Model { }
    Class.init({
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
        Class: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        sequelize,
        tableName: "t_class",
        modelName: "Class"
    })
}
