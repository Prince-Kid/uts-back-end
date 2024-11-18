import { Request, Response } from "express";
import Vendor from "../database/models/vendor";
import { deleteVendorById, saveVendor, updateVendor } from "../services/vendorServices";
import User from "../database/models/user";
import Order from "../database/models/order";
import { Op, Sequelize } from "sequelize";

export const registerVendor = async (req: Request, res: Response) => {
  const { userId, storeName, address, TIN, bankAccount, paymentDetails } = req.body
  if (!userId || !storeName || !address || !TIN || !bankAccount || !paymentDetails) {
    return res.status(400).json({ message: "Please fill all fields" })
  }
  const user = await User.findOne({where: {userId: userId}})
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }
  try {
    const insertVendor = await Vendor.create({
      userId: userId,
      storeName: storeName,
      address: address,
      TIN: TIN,
      bankAccount: bankAccount,
      paymentDetails
    })
    return res.status(200).json({ message: "Vendor requested successfully", vendor: insertVendor })
  } catch (error: any) {
    return res.status(500).json({ message: error.message })
  }
}

// Deleting vendor 
export const deletingVendor = async (req: Request, res: Response) => {
  const vendorId = req.params.id;
  try {
    await deleteVendorById(vendorId);
    res.status(200).json({ message: "Vendor deleted successful" });
  } catch (error: any) {
    if (error.message === "Vendor not found") {  
      res.status(404).json({ error: "Vendor not found" });
    } else {
      console.log("The error is: " + error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};



export const editVendor = async (req: Request, res: Response) => {
  const updates = req.body;
  const vendorId = req.params.id;
  
  try {
    const vendor = await Vendor.findOne({ where: { vendorId } });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    Object.keys(updates).forEach(key => {
      vendor[key] = updates[key];
    });

    const updatedVendor = await vendor.save();

    res.status(200).json({ message: 'Vendor update success', vendor: updatedVendor });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const selectVendorInfo = async(req:Request,res:Response)=>{
  try {
    const vendor = await Vendor.findOne({where:{userId:req.params.id}});
    if(!vendor){
      return res.status(404).json({message:'Vendor not found'})
    }
    res.status(200).json({vendor})
    
  } catch (error) {
    res.status(500).json({message: error})
    
  }
}

const getOrdersByVendorId = async (vendorId) => {
  try {
    const orders = await Order.findAll({
      where: {
        products: {
          [Op.contains]: [{
            vendorId: vendorId
          }]
        }
      }
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const vendorOrder = async (req: Request, res: Response) => {
  const { vendorId } = req.params;

  try {
      // Fetch orders that contain products from the specified vendor
      const orders = await Order.findAll({
          where: {
              products: {
                  [Op.contains]: [{
                      vendorId: vendorId
                  }]
              }
          }
      });

      const filteredOrders = orders.map(order => {
          const filteredProducts = order.products.filter(product => product.vendorId === vendorId);
          return {
              ...order.toJSON(),
              products: filteredProducts
          };
      });

      res.status(200).json(filteredOrders);
  } catch (error) {
      console.error("Error fetching vendor orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allRequests = async (req: Request, res: Response) => {
  try {
    const sellers = await Vendor.findAll({where: {status: 'pending'}})
    res.status(200).json(sellers);
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
}

export const allStores = async (req: Request, res: Response) => {
  try {
    const stores = await Vendor.findAll({ where: { status: 'approved' } })
    res.status(200).json(stores)
    
  } catch (error:any) {
    res.status(500).json({error: error.message})
  }
}
