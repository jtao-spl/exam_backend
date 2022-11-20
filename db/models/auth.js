const { DataTypes, Model} = require('sequelize');

module.exports = (sequelize) =>{
    class Auth extends Model {}
    Auth.init({
        Id:{
            type: DataTypes.INTEGER, 
            allowNull: false,
            primaryKey: true,
            autoIncrement:true
        },
        Name:{
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '',
        },
        Password:{
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '',
        },
        Role:{
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 3
        },
        Status:{
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        Deleted:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },{
        sequelize, 
        tableName: "t_auth",
    })
}



// module.exports = Component