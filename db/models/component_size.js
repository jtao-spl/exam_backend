const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
    class ComponentSize extends Model { }
    ComponentSize.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ComponentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        FirstType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        SecondType: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        BaseSize: {
            type: DataTypes.DECIMAL(10, 3)
        },
        UpSize: {
            type: DataTypes.DECIMAL(4, 3)
        },
        BottomSize: {
            type: DataTypes.DECIMAL(4, 3)
        },
        GeoToleranceType: {
            type: DataTypes.STRING(1),
        },
        GeoToleranceVal: {
            type: DataTypes.STRING(10),
        },
        SurfaceRoughnessType: {
            type: DataTypes.STRING(2),
        },
        SurfaceRoughnessVal: {
            type: DataTypes.STRING(10),
        },
        SurfaceRoughnessCount: {
            type: DataTypes.INTEGER,
        },
        UnDeclaredChamferCount: {
            type: DataTypes.INTEGER
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        sequelize,
        modelName: "ComponentSize",
        tableName: "t_component_size"
    })
}
