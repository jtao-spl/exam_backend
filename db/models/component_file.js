const {Sequelize, DataTypes, Model} = require('sequelize');
module.exports = (sequelize) =>{
    class ComponentFile extends Model {}
    ComponentFile.init({
        Id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement:true
        },
        ComponentId:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        FileName: {
            type:DataTypes.STRING(200),
            allowNull: false,
            defaultValue: ''
        },
        FileContent:{
            type: DataTypes.BLOB,

        },
    },{
        sequelize, 
        modelName: "ComponentFile",
        tableName:"t_component_file"
    })
}
