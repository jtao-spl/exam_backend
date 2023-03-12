const express = require('express');
const router = express.Router();
const { models } = require('../db/index');

/**
 * 根据id列表查询
 */
router.get('/seach', async (req, res, next) => {
    try {
        const ids = req.query.Ids.map(id => Number.parseInt(id));
        const teachers = await models.Teacher.findAll({
            where: {
                Phone: ids
            },
            limit: 50
        })
        return res.json({
            code:0,
            msg:`success`,
            data: teachers.map(teacher=>teacher.toJSON())
        })   
    } catch (error) {
        next(error)
    }
});

module.exports = router;