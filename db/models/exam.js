const { DataTypes, Model, NOW} = require('sequelize');

module.exports = (sequelize) =>{
    class Exam extends Model {}
    Exam.init({
        Id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement:true
        },
        ExamDate:{
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        StartTime:{
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '00:00',
        },
        FinishTime:{
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue:  '00:00',
        },
        ExamTarget:{
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        ExamComponent:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        SizePrecisionLevel:{
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1,
        },
        ExamTeacher:{
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '',
        },
        CriteriaId:{
            type: DataTypes.INTEGER,
            allowNull:true,
        },
        Data:{
            type: DataTypes.JSON,
            allowNull: true
        },
        Deleted:{
            type: DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue: false
        }
    },{
        sequelize, 
        modelName:"Exam",
        tableName: "t_exam",
    })
}



