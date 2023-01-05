const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ExamCriteria extends Model { }
    ExamCriteria.init({
        Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        CriteriaId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        FirstType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        SizeType: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        SizeDelta: {
            type: DataTypes.DECIMAL(6, 3)
        },
        SizeDeductScore: {
            type: DataTypes.TINYINT,
        },
        GeoType: {
            type: DataTypes.STRING(5),
        },
        GeoBase: {
            type: DataTypes.STRING(20),
        },
        GeoDelta: {
            type: DataTypes.DECIMAL(6, 3)
        },
        GeoDeductScore: {
            type: DataTypes.TINYINT
        },
        SurfaceRoughnessVal:{
            type: DataTypes.STRING(10),
        },
        SurfaceRoughnessScore: {
            type: DataTypes.DECIMAL(6, 3),
        },
        UnDeclaredChamferCount:{
            type: DataTypes.TINYINT,
        },
        UnDeclaredChamferTotalVal: {
            type: DataTypes.TINYINT,
        },
        Deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: "ExamCriteria",
        tableName: "t_exam_criteria",
    })
}



