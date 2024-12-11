import nodemailer from "nodemailer";
import Product from "../database/models/product";
import Vendor from "../database/models/vendor";
import Order from "../database/models/order";
import User from "../database/models/user";
import { Op } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Send confirmation email to the customer
export const sendOrderConfirmation = async (user: any, order: any) => {
  try {
    const products = await Product.findAll({
      where: {
        productId: {
          [Op.in]: order.products.map((item: any) => item.productId),
        },
      },
      include: [{ model: Vendor, as: "Vendor" }],
    });

    // Generate order summary for the user
    const productDetails = products
      .map(
        (product: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>${product.name}</td>
        <td><img src="${product.image[0]}" width="50" /></td>
        <td>${product.price}</td>
      </tr>
    `
      )
      .join("");

    const emailContent = `
      <h1>Order Confirmation</h1>
      <p>Dear ${user.name},</p>
      <p>Thank you for your purchase! Here are your order details:</p>
      <table border="1" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Image</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${productDetails}
        </tbody>
      </table>
      <p><strong>Total Amount Paid:</strong> ${order.totalAmount} RWF</p>
      <p><strong>Delivery Address:</strong> ${order.deliveryAddress.cell}, ${order.deliveryAddress.district}</p>
      <p>We hope you enjoy your purchase!</p>
      <p>Best regards,</p>
      <p>UTS Technical Team</p>
    `;

    await transporter.sendMail({
      from: `"UTS Technical Team" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Order Confirmation",
      html: emailContent,
    });

    console.log("Order confirmation email sent to customer!");
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
};

// Send notification email to vendors whose products were sold
export const notifyVendorsOfSale = async (order: any) => {
  try {
    const products = await Product.findAll({
      where: {
        productId: {
          [Op.in]: order.products.map((item: any) => item.productId),
        },
      },
      include: [{ model: Vendor, as: "Vendor" }],
    });

    // Group products by vendor
    const vendorProducts: any = {};
    products.forEach((product: any) => {
      if (!vendorProducts[product.vendorId]) {
        vendorProducts[product.vendorId] = [];
      }
      vendorProducts[product.vendorId].push(product);
    });

    // Fetch buyer information
    const buyer = await User.findOne({
      where: { userId: order.userId }, // Assuming order.userId is the reference to the buyer
    });

    // Send an email to each vendor with details about their sold products
    for (const vendorId in vendorProducts) {
      const vendor = await Vendor.findOne({
        where: { vendorId },
        include: [{ model: User, as: "user" }],
      });

      if (!vendor) {
        console.error(`Vendor with ID ${vendorId} not found.`);
        continue; // Use continue to proceed to the next vendor
      }

      const soldProducts = vendorProducts[vendorId];

      const productDetails = soldProducts
        .map(
          (product: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${product.name}</td>
          <td><img src="${product.image[0]}" width="50" /></td>
          <td>${product.price}</td>
          <td>${
            order.products.find((p: any) => p.productId === product.productId)
              .quantity
          }</td>
        </tr>
      `
        )
        .join("");

      const vendorEmailContent = `
        <h1>Products Sold Notification</h1>
        <p>Dear ${vendor.storeName},</p>
        <p>The following products from your store have been sold:</p>
        <table border="1" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Image</th>
              <th>Price</th>
              <th>Quantity Sold</th>
            </tr>
          </thead>
          <tbody>
            ${productDetails}
          </tbody>
        </table>
        <p><strong>Total Amount for these Products:</strong> $${soldProducts.reduce(
          (total: number, product: any) =>
            total +
            product.price *
              order.products.find((p: any) => p.productId === product.productId)
                .quantity,
          0
        )}</p>
        <p><strong>Buyer Information:</strong></p>
        <p><strong>Name:</strong> ${buyer?.name}</p>
        <p><strong>Email:</strong> ${buyer?.email}</p>
        <p><strong>Address:</strong> ${order.deliveryAddress.cell}, ${
        order.deliveryAddress.district
      }</p>
        <p>We hope you continue enjoying sales through Crafters E-commerce!</p>
        <p>Best regards,</p>
        <p>UTS Technical Team</p>
      `;

      await transporter.sendMail({
        from: `"UTS Technical Team" <${process.env.EMAIL}>`,
        to: vendor.user?.email ?? "", // Uses optional chaining to avoid accessing 'email' if 'user' is undefined
        subject: "Products Sold",
        html: vendorEmailContent,
      });

      console.log(`Email notification sent to vendor: ${vendor.storeName}`);
    }
  } catch (error) {
    console.error("Error sending vendor notification emails:", error);
  }
};

export const notifyAdminOfSale = async (order: any) => {
  try {
    const products = await Product.findAll({
      where: {
        productId: {
          [Op.in]: order.products.map((item: any) => item.productId),
        },
      },
      include: [{ model: Vendor, as: "Vendor" }],
    });

    // Group products by vendor
    const vendorProducts: any = {};
    products.forEach((product: any) => {
      if (!vendorProducts[product.vendorId]) {
        vendorProducts[product.vendorId] = [];
      }
      vendorProducts[product.vendorId].push(product);
    });

    // Fetch buyer information
    const buyer = await User.findOne({
      where: { userId: order.userId }, // Assuming order.userId is the reference to the buyer
    });

    // Prepare admin email content for each vendor
    let adminEmailContent = `
      <h1>Products Sold Summary</h1>
      <p>Dear Admin,</p>
      <p>Here are the details of the recent sales:</p>
      <table border="1" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Vendor</th>
            <th>Price</th>
            <th>Quantity Sold</th>
            <th>Total Amount</th>
            <th>Seller's Share (90%)</th>
            <th>Admin's Commission (10%)</th>
          </tr>
        </thead>
        <tbody>
    `;

    let totalAdminCommission = 0;

    for (const vendorId in vendorProducts) {
      const vendor = await Vendor.findOne({
        where: { vendorId },
        include: [{ model: User, as: "user" }],
      });

      if (!vendor) {
        console.error(`Vendor with ID ${vendorId} not found.`);
        continue;
      }

      const soldProducts = vendorProducts[vendorId];

      soldProducts.forEach((product: any, index: number) => {
        const quantitySold = order.products.find(
          (p: any) => p.productId === product.productId
        )?.quantity;
        const totalAmount = product.price * quantitySold;
        const sellerShare = totalAmount * 0.9; // 90% to vendor
        const adminCommission = totalAmount * 0.1; // 10% to admin

        totalAdminCommission += adminCommission;

        adminEmailContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${product.name}</td>
            <td>${vendor.storeName}</td>
            <td>${product.price}</td>
            <td>${quantitySold}</td>
            <td>${totalAmount.toFixed(2)}</td>
            <td>${sellerShare.toFixed(2)}</td>
            <td>${adminCommission.toFixed(2)}</td>
          </tr>
        `;
      });
    }

    adminEmailContent += `
        </tbody>
      </table>
      <p><strong>Total Admin Commission for this Order:</strong> ${totalAdminCommission.toFixed(
        2
      )}</p>
      <p><strong>Buyer Information:</strong></p>
      <p><strong>Name:</strong> ${buyer?.name}</p>
      <p><strong>Email:</strong> ${buyer?.email}</p>
      <p><strong>Address:</strong> ${order.deliveryAddress.cell}, ${
      order.deliveryAddress.district
    }</p>
      <p>Best regards,</p>
      <p>UTS Technical Team</p>
    `;

    // Send the email to the admin
    await transporter.sendMail({
      from: `"UTS Technical Team" <${process.env.EMAIL}>`,
      to: "twizerimanaschadrack@gmail.com", // Admin email from environment variables
      subject: "Admin Notification: Products Sold",
      html: adminEmailContent,
    });

    console.log(`Email notification sent to admin.`);
  } catch (error) {
    console.error("Error sending admin notification emails:", error);
  }
};
