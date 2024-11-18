import { Request, Response } from "express";
import ChatMessage from "../database/models/chatmessage";
import { json } from "body-parser";
import pusher from "../pusher";
import Vendor from "../database/models/vendor";
import User from "../database/models/user";
import Message from "../database/models/messages";
import { Op } from "sequelize";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { content, imageUrl, sender, receiver } = req.body;
    if(!content && !imageUrl){
        return res.status(400).json({ message: "Please provide content or image" });
    }
    if(!sender || !receiver){
        return res.status(400).json({ message: "Please provide sender or receiver" });
    }
    const senderData = await User.findByPk(sender, {
        include: {
          model: Vendor,
          as: "Vendor"
        }
      });
    const newMessage = await ChatMessage.create({
        content,
        imageUrl,
        sender,
        receiver
    })
    if(!newMessage){
        return res.status(400).json({ message: "Message not sent" });
    }
    pusher.trigger("user", "send-user",{
        sender: senderData,
        message: newMessage
    })
    pusher.trigger("message", "new-message", {
        message: newMessage,
        user: senderData,
      });
    return res.status(200).json({message: 'message sent'})
    
  } catch (error) {
    res.status(500).json({ message: error });
  }
};


export const getAllMessage = async(req:Request,res:Response)=>{
    try {   
        const messages:any = await ChatMessage.findAll()
        if(messages.length >0){
            return res.status(200).json({messages})
        } 
        return res.status(200).json({message: "No messages" })
        
    } catch (error) {
        res.status(500).json({message: error})
        
    }
}

export const getVendors = async(req:Request,res:Response)=>{
    try {
        const userId = req.params.id 
        const vendors = await User.findAll({include:[
            {
                model: Vendor,
                as: "Vendor"
            }
        ] })
        const responseVendor:any = []
        for (const vendor of vendors) {
            const messages = await ChatMessage.findOne({ where: {
                [Op.or]: [
                  { receiver: vendor.userId, sender: userId },
                  { sender: vendor.userId, receiver: userId }
                ]
              }});
            if (messages) {
              responseVendor.push(vendor);
            }
          }

        if(responseVendor.length < 1){
            return res.status(400).json({message: "No vendors found" })
        }
        return res.status(200).json({vendors: responseVendor})
        
    } catch (error:any) {
        res.status(500).json({message: error.message})
        
    }
}
export const getAllVendors = async(req:Request,res:Response)=>{
    try {
       
        const vendors = await User.findAll({where: {role: "vendor"},include:[
            {
                model: Vendor,
                as: "Vendor"
            }
        ] })
      
        return res.status(200).json({vendors})
        
    } catch (error) {
        res.status(500).json({message: "Inter server error"})
        
    }
}
export const getLatestMessages = async (req: Request, res: Response) => {
  try {
      const userId = req.params.id;
      const vendors = await Vendor.findAll();

      const vendorMessages = await Promise.all(
          vendors.map(async (vendor) => {
              const latestMessage = await ChatMessage.findOne({
                  // where: {
                  //     [Op.or]: [
                  //         { sender: vendor.userId, receiver: userId },
                  //         { sender: userId, receiver: vendor.userId },
                  //     ],
                  // },
                  order: [['createdAt', 'DESC']],
              });

              return {
                  vendor,
                  latestMessage,
              };
          })
      );

      res.status(200).json(vendorMessages);
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
};
