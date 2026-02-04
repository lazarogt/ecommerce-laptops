const express = require ("express");
const {sendWhatsAppMessage} = require("../services/whatsappService");

const router = express.Router();

router.post('/send', async (req,res)=>{
    try {
        const {to, message} = req.body;
        if(!to || !message){
            return res.status(400).json({success:false,error:'Faltan "to" o "message"'});
        }

        await sendWhatsAppMessage(to,message);
        res.json({succes:true, msg:'Mensaje enviado correctamente'});
    } catch (error) {
        console.error(error);
        res.status(500).json({succes:false, error:error.message});
        
    }
});

module.exports = router;