import express from "express";
import {
  getAllOrder,
  modifyOrderStatus,
  getOrder,
  getAllOrders,
  getSellerOrder
} from "../controllers/orderController";
import { VerifyAccessToken } from "../middleware/verfiyToken";
import {
  getOrderStatus,
  updateOrderStatus,
} from "../controllers/orderStatus.controller";

const router = express.Router();

router.put(
  "/order/:orderId/order-status",
  updateOrderStatus
);

router.get("/order/:orderId/status", getOrderStatus);

router.put(
  "/order/:orderId/product/:productId/status",

  modifyOrderStatus
);

router.get("/order/getAllOrder", getAllOrder);
router.get("/order/getOrder/:orderId", getOrder);

router.get("/order/getSellerOrder/:vendorId", getSellerOrder);

router.get("/orders", VerifyAccessToken, getAllOrders);
router.get("/order/getSellerOrder/:vendorId", getSellerOrder);


export default router;
