const express = require('express');
const pool =require('../../db');
const auth = require('../middleware/auth');
const router = express.Router();


router.post('/:stopId',auth,async(req,res) => {
    const{name,description,type,cost,duration_minutes,images_url} =req.body;
    try{
        const result = await pool.query(
            `INSERT INTO activities (stop_id,name,description,type,cost,duration_minutes,images_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [req.params.stopId,name,description,type,cost,duration_minutes,images_url]
        );
        res.json(result.rows[0]);
    }catch(err){
        res.status(400).json({error:err.message});
    }
});

//search activities by name or type
 router.get('/search', auth, async (req, res) => {
    const{query}=req.query; //?query=beach
    try{
        const result = await pool.query(
            `SELECT * FROM activities 
             WHERE LOWER(name) LIKE LOWER($1) OR LOWER(type) LIKE LOWER($1)`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;