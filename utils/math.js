
const getStandardDiff = (count, total, values) => {
    const avg = total / count;
    const a = values.map(item => item === null ? 0 : (item - avg) * (item - avg)).reduce((a, b) => a + b * 1.0, 0);
    const b = a / count;
    const c = Math.sqrt(b);
    return c;
}

module.exports = {
    getStandardDiff
}