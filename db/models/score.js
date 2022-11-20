const { DataTypes, Model, NOW} = require('sequelize');

module.exports = (sequelize) =>{
    class Score extends Model {}
    Score.init({
        Id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement:true
        },
        StudentId:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        ExamId:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        TotalScore:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        
        DetailScore:{
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
        modelName:"Score",
        tableName: "t_score",
    })
}



