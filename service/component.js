
const { SizedElementSymbol, GelToleranceSymbol, ElementFirstType } = require('../constants/component');
const { models } = require('../db/index');

async function getComponentCriteria(id) {
    const sizes = await models.ComponentSize.findAll({
        where: {
            ComponentId: id,
            Deleted: false
        }
    });
    let m = [];
    SizedElementSymbol.map((symbol, index) => {
        m.push({ type: symbol, required: sizes.filter(item => item.FirstType === ElementFirstType.SizedElement && item.SecondType === index).length > 0 ? true : false });
    });
    GelToleranceSymbol.map((symbol) => {
        m.push({ type: symbol, required: sizes.filter(item => item.FirstType === ElementFirstType.GeometricalTolerance && item.GeoToleranceType === symbol).length > 0 ? true : false });
    });
    m.push({ type: 'Ra', required: sizes.filter(item => item.FirstType === ElementFirstType.SurfaceRoughness).length > 0 ? true : false });
    return m
}

module.exports = { getComponentCriteria }