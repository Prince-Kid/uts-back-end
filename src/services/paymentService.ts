import Order from "../database/models/order";
import Product from "../database/models/product";
import User from "../database/models/user";

export const findOrderById = async (orderId: any) => {
  const order = await Order.findByPk(orderId);
  return order;
};
export const findProductById = async (productId: any) => {
  const product = await Product.findByPk(productId);
  return product;
};
export const findUserById = async (userId: any) => {
  const user = await User.findByPk(userId);
  return user;
};
