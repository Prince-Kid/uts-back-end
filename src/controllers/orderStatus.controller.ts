import { Request, Response } from "express";
import Order from "../database/models/order";
import User from "../database/models/user";
import pusher from "../pusher";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { ioServer } from "..";

dotenv.config();

const allowedStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "on hold",
  "cancelled",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

export const getOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ where: { orderId } });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).json({
      orderId,
      status: order.status,
      expectedDeliveryDate: order.expectedDeliveryDate,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const status = req.body.status;
    const vendorId = (req as any).vendorId;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findOne({ where: { orderId } });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    order.status = status;

    if (status === "processing") {
      const currentDate = new Date();
      const expectedDeliveryDate = new Date(
        currentDate.getTime() + 14 * 24 * 60 * 60 * 1000
      );

      order.expectedDeliveryDate = expectedDeliveryDate;
    }

    console.log("Updating order to: ", status);
    await order.save();
    console.log("Order updated successfully: ", order.toJSON());

    const formattedDate = order.expectedDeliveryDate
      ? order.expectedDeliveryDate.toLocaleDateString()
      : null;

    // Notify the buyer via email
    const buyer = await User.findByPk(order.userId);
    if (buyer) {
      const emailContent = `
        <h1>Order Status Update</h1>
        <p>Dear ${buyer.name},</p>
        <p>Your order with ID ${orderId} has been updated to "${status}".</p>
        <p><strong>Expected Delivery Date:</strong> ${
          formattedDate || "Not set yet"
        }</p>
        <p>Thank you for shopping with us!</p>
        <p>Best regards,</p>
        <p>Crafters E-commerce Team</p>
      `;

      try {
        await transporter.sendMail({
          from: `"Crafters E-commerce" <${process.env.EMAIL}>`,
          to: buyer.email,
          subject: "Order Status Update",
          html: emailContent,
        });
        console.log("Status update email sent to the buyer.");
      } catch (error) {
        console.error("Error sending status update email:", error);
      }
    }

    // Trigger Pusher event and Socket.io event
    try {
      await pusher.trigger("order-channel", "order-updated", {
        orderId,
        status: order.status,
        expectedDeliveryDate: formattedDate,
      });
    } catch (error) {
      console.error("Failed to trigger Pusher event:", error);
    }

    ioServer.emit("orderStatusUpdated", {
      orderId,
      status: order.status,
      expectedDeliveryDate: formattedDate,
    });

    res.status(200).json({
      orderId,
      status: order.status,
      expectedDeliveryDate: formattedDate,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
