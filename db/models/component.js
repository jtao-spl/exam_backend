const { DataTypes, Model} = require('sequelize');

module.exports = (sequelize) =>{
    class Component extends Model {}
    Component.init({
        Id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement:true
        },
        ComponentName:{
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '',
        },
        ClipPath:{
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
        },
        Status:{
            type: DataTypes.NUMBER,
            allowNull: false,
            defaultValue: 1,
        },
        Deleted:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },{
        sequelize, 
        modelName:"Component",
        tableName: "t_component",
    })
}



// module.exports = Component