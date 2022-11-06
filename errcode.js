class Enum {
    constructor(...keys){
        keys.forEach((key, i)=>{
            this[key] = i;
        })
        Object.freeze(this);
    }
    *[Symbol.iterator](){
        for (let key of Object.keys(this)) yield key;
    }
}

const ErrCode = new Enum(
    "SUCCESS",
    "ERR_INTERNAL_SERVER_ERROR",
    "ERR_NOT_FOUND",
    "ERR_INCONSISTENT",
    "ERR_INVALID_PARAMS",
)

module.exports = ErrCode