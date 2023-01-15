
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
        const count =  sizes.filter(item => item.FirstType === ElementFirstType.SizedElement && item.SecondType === index).length;
        m.push({ type: symbol, count: count, required: count > 0 ? true : false });
    });
    GelToleranceSymbol.map((symbol) => {
        const count = sizes.filter(item => item.FirstType === ElementFirstType.GeometricalTolerance && item.GeoToleranceType === symbol).length;
        m.push({ type: symbol, count: count, required: count > 0 ? true : false });
    });
    const Ras = sizes.filter(item => item.FirstType === ElementFirstType.SurfaceRoughness);
    Ras.map(ra=>{
        m.push({ type: 'Ra', size: ra.SurfaceRoughnessVal,  count: ra.SurfaceRoughnessCount, required: true });
    })
    const other = sizes.filter(item=>item.FirstType === 3);
    if (other){
        m.push({type: 'other', count: other[0].UnDeclaredChamferCount, required: true})
    }
    return m;
}

module.exports = { getComponentCriteria }