const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Tool extends Model { }
    Tool.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        Name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    }, {
        sequelize,
        modelName: "Tool",
        tableName: "t_tool",
    })
}



