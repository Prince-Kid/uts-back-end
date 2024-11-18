import Order from "../database/models/order";
import Cart from "../database/models/cart";
import CartItem from "../database/models/cartitem";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Product from "../database/models/product";
import {
  findOrderById,
  findProductById,
  findUserById,
} from "../services/paymentService";
import { sendOrderConfirmation } from "../services/emailService";
import {
  notifyVendorsOfSale,
  notifyAdminOfSale,
} from "../services/emailService";

export const createOrder = async (req: Request, res: Response) => {
  const { userId, deliveryAddress, paymentMethod, client } = req.body;
  if (!userId || !deliveryAddress || !paymentMethod) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId },
    });
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      status: "pending",
    }));

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    console.log(orderItems);

    const order = await Order.create({
      orderId: uuidv4(),
      deliveryAddress,
      userId,
      paymentMethod,
      status: "pending",
      products: orderItems,
      totalAmount: totalAmount,
      client,
    });
    for (const item of orderItems) {
      const product = await Product.findOne({
        where: { productId: item.productId },
      });
      if (product) {
        product.quantity -= item.quantity;
        if (product.quantity < 0) {
          return res.status(400).json({
            message: `Not enough stock for product ${product.productId}`,
          });
        }
        await product.save();
      }
    }
    await CartItem.destroy({ where: { cartId: cart.cartId } });
    const user = await findUserById(order.userId);
    if (user) {
      await sendOrderConfirmation(user, order);
      await notifyVendorsOfSale(order);
      await notifyAdminOfSale(order);
    } else {
      console.error("User not found for order:");
    }
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
