const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamTarget extends Model { }
    ExamTarget.init({
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
        }
    }, {
        sequelize,
        modelName: "ExamTarget",
        tableName: "t_exam_target",
    })
}



