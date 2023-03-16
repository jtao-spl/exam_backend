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

// const ErrCode = new Enum(
//     "SUCCESS",
//     "ERR_INTERNAL_SERVER_ERROR",
//     "ERR_NOT_FOUND",
//     "ERR_INCONSISTENT",
//     "ERR_INVALID_PARAMS",
//     "ERR_UNAUTHENTICATED",
//     "ERR_BAD_CREDENTIAL",

// )
const ErrCode = {
    SUCCESS: 0,
    ERR_INTERNAL_SERVER_ERROR: 1,
    ERR_NOT_FOUND: 2,
    ERR_INCONSISTENT: 3,
    ERR_INVALID_PARAMS: 4,
    ERR_UNAUTHENTICATED: 5,
    ERR_BAD_CREDENTIAL:6
}
module.exports = ErrCode