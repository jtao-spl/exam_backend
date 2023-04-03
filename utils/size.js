const getName = size => {
    if (size.FirstType === 0) {
        if (size.SecondType === 0) return '线性（L）';
        if (size.SecondType === 1) {
            if (size.DiameterType === 1) return '内径（d）'
            return '外径（D）'
        }
        if(size.SecondType === 2) return '半径（R）';
        return '角度（∠）'
    }
    if(size.FirstType === 1) {
        // 形位公差
    }
    if(size.FirstType === 2){
        return `表面粗糙度(Ra${size.SurfaceRoughnessVal})`
    }
    if(size.FirstType === 3) return '未注倒角';
    return '安全文明'
}
const getBaseSize = size=>{
    if(size.FirstType === 0)return size.BaseSize;
    if(size.FirstType === 1) return size.GeoToleranceVal;
    if(size.FirstType === 2) return `${size.SurfaceRoughnessCount}处`
    if(size.FirstType === 3) return `${size.UnDeclaredChamferCount}处`
    return size.SafetyRequirement;
}

const getUpSize = size=>{
    if(size.FirstType === 0)return size.UpSize;
    return '-'
}
const getBottomSize = size=>{
    if(size.FirstType === 0)return size.BottomSize;
    return '-'
}

const getTotalScore = (size, exam)=>{
    const scores = exam.Data.scores;
    if(!scores) return 0;
    const current = scores.filter(item=>item.SizeId === size.Id);
    if(current.length >0) return current[0].Score;
    return 0;
}

const filterCriteriaForSize = (criterias, size) => {
    if (size.FirstType === 0) {
        const criteria = criterias.filter((c) => c.FirstType === 0 && c.SizeType === size.SecondType);
        if (criteria.length === 0) return;
        return criteria[0];
    }
    if (size.FirstType === 1) {
        const criteria = criterias.filter((c) => c.FirstType === 1 && c.GeoType === size.GeoToleranceType);
        if (criteria.length === 0) return;
        return criteria[0];
    }
    if (size.FirstType === 2) {
        console.log(`SIZE: ${JSON.stringify(size)}`);
        console.log(`criterias: ${JSON.stringify(criterias)}`);
        const criteria = criterias.filter((c) => c.FirstType === 2 && c.SurfaceRoughnessVal === size.SurfaceRoughnessVal);
        if (criteria.length === 0) return;
        return criteria[0];
    }
    if (size.FirstType === 3) {
        const criteria = criterias.filter((c) => c.FirstType === 3);
        if (criteria.length === 0) return;
        return criteria[0];
    }
    return;
}

const getCriteriaDesc = (size,criterias)=>{
    const criteria = filterCriteriaForSize(criterias, size);
    if (!criteria) return '-';
    if (criteria.FirstType === 0 && criteria.SizeDelta && criteria.SizeDeductScore) {
        return `偏差范围以得分，偏差范围外每超差${criteria.SizeDelta}扣${criteria.SizeDeductScore}分，配分扣完为止`
    }
    if (criteria.FirstType === 1 && criteria.GeoBase && criteria.GeoDelta && criteria.GeoDeductScore) {
        return `低于${criteria.GeoBase}得分，高于${criteria.GeoBase}每超差${criteria.GeoDelta}扣${criteria.GeoDeductScore}分，配分扣完为止`
    }
    if (criteria.FirstType === 2) {
        return `样块对比目测，符合要求得分`
    }
    if (criteria.FirstType === 3 && criteria.UnDeclaredChamferCount && criteria.UnDeclaredChamferCount > 0) {
        return `共计${criteria.UnDeclaredChamferCount}处，总共${criteria.UnDeclaredChamferTotalVal}分`
    }
    return ``
}

const getToolName = (data, tools)=>{
    if(data.length ===0) return '-';
    const toolId = data[0].toolId;
    const tool = tools.filter(tool=>tool.Id === toolId);
    if(tool.length > 0) return tool[0].Name;
    return '-'
}

module.exports = {
    getName,
    getBaseSize,
    getUpSize,
    getBottomSize,
    getTotalScore,
    getCriteriaDesc,
    getToolName,
}