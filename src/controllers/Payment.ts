// import express, { Request, Response } from "express";
// import Stripe from "stripe";
// import dotenv from "dotenv";
// import {
//   findOrderById,
//   findProductById,
//   findUserById,
// } from "../services/paymentService";
// import { sendOrderConfirmation } from "../services/emailService";

// dotenv.config();

// const stripe = new Stripe(${process.env.STRIPE_SECRET_KEY});

// export const checkout = async (req: Request, res: Response) => {
//   try {
//     const orderId = req.params.id;

//     // Validate orderId
//     if (!orderId) {
//       return res.status(400).json({ message: "Order ID is required" });
//     }

//     const order = await findOrderById(orderId);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Validate order.products
//     if (!order.products || !Array.isArray(order.products)) {
//       return res.status(400).json({ message: "Order products are not valid" });
//     }

//     const line_items: any[] = await Promise.all(
//       order.products.map(async (item: any) => {
//         const productDetails: any = await findProductById(item.productId);

//         if (!productDetails) {
//           console.error(Product with ID ${item.productId} not found);
//           throw new Error("Product not found");
//         }

//         const unit_amount = Math.round(productDetails.price * 100);

//         return {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: productDetails.name,
//               images: [productDetails.image[0]],
//             },
//             unit_amount: unit_amount,
//           },
//           quantity: item.quantity,
//         };
//       })
//     );

//     const session = await stripe.checkout.sessions.create({
//       line_items,
//       mode: "payment",
//       success_url: process.env.SUCCESS_PAYMENT_URL,
//       cancel_url: process.env.CANCEL_PAYMENT_URL,
//       metadata: {
//         orderId: orderId,
//       },
//     });

//     res.status(200).json({ url: session.url });
//   } catch (error: any) {
//     console.error("Error during checkout process:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const webhook = async (req: Request, res: Response) => {
//   const sig: any = req.headers["stripe-signature"];
//   const webhookSecret: any = process.env.WEBHOOK_SECRET_KEY;
//   let event: any;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
//   } catch (err: any) {
//     console.error(⚠️  Webhook signature verification failed: ${err.message});
//     return res.status(400).send(Webhook Error: ${err.message});
//   }

//   switch (event.type) {
//     case "checkout.session.completed":
//       const session: any = event.data.object as Stripe.Checkout.Session;

//       // Log session details
//       console.log("Checkout Session Completed Event:");
//       console.log("Session ID:", session.id);
//       console.log("Session Metadata:", session.metadata);
//       console.log("Session Object:", session);

//       try {
//         // Fetch line items to get more order details
//         const lineItems = await stripe.checkout.sessions.listLineItems(
//           session.id
//         );
//         console.log("Line Items:", lineItems);

//         const orderId = session.metadata.orderId;

//         if (!orderId) {
//           console.error("Order ID not found in session metadata");
//           return res.status(400).json({ message: "Order ID not found" });
//         }

//         const order = await findOrderById(orderId);
//         console.log("Order:", order);

//         if (order) {
//           order.status = "paid";
//           await order.save();

//           // Fetch user details and log them
//           const user = await findUserById(order.userId);
//           console.log("User:", user);

//           if (user) {
//             await sendOrderConfirmation(user, order);
//           } else {
//             console.error("User not found for order:", orderId);
//           }
//         } else {
//           console.error("Order not found:", orderId);
//         }
//       } catch (err) {
//         console.error("Error processing session completed event:", err);
//       }
//       break;

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object as Stripe.PaymentIntent;
//       console.log("Payment Intent succeeded: ", paymentIntent);
//       break;

//     case "payment_method.attached":
//       const paymentMethod = event.data.object as Stripe.PaymentMethod;
//       console.log("Payment Method attached: ", paymentMethod);
//       break;

//     default:
//       console.log(Unhandled event type ${event.type});
//   }

//   res.json({ received: true });
// };
import Flutterwave from "flutterwave-node-v3";
import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import {
  findOrderById,
  findProductById,
  findUserById,
} from "../services/paymentService";
import { updateOrderStatus } from "./orderStatus.controller";
dotenv.config(); // Load environment variables

// Flutterwave Setup
const flw = new Flutterwave(
  "FLWPUBK-25087f43deeb739d0f08ff8d08143498-X",
  "FLWSECK-b425b08a7e6fbb67006500f422b78491-1922ee732c1vt-X"
);

// Process Payment
export const checkout = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;

    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!order.products || !Array.isArray(order.products)) {
      return res.status(400).json({ message: "Order products are not valid" });
    }

    const line_items: any[] = await Promise.all(
      order.products.map(async (item: any) => {
        const productDetails: any = await findProductById(item.productId);
        if (!productDetails) {
          console.error(`Product with ID ${item.productId} not found`);
          throw new Error("Product not found");
        }
        const unit_amount = Math.round(productDetails.price); // Convert to cents
        return {
          price_data: {
            currency: "RWF",
            product_data: {
              name: productDetails.name,
              images: [productDetails.image[0]],
            },
            unit_amount: unit_amount,
          },
          quantity: item.quantity,
        };
      })
    );

    const totalAmount = line_items.reduce((total, item) => {
      return total + item.price_data.unit_amount * item.quantity;
    }, 0);

    const buyer = await findUserById(order.userId);
    if (!buyer) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!buyer.email) {
      return res.status(400).json({ message: "Buyer email is required" });
    }

    const paymentData = {
      tx_ref: `MC-${Date.now()}`,
      amount: totalAmount,
      currency: "RWF",
      redirect_url: process.env.SUCCESS_PAYMENT_URL,

      payment_options: "mobilemoneyrwanda",

      customer: {
        email: buyer.email || "mucyoprinc12@gmail.com", // Use buyer's email
        phone_number: "+250783154587", // Replace with actual buyer data if needed
        name: buyer.name || "Prince",
      },
      customizations: {
        title: "Crafters Ecommerce",
        description: "Payment for items in cart",
        logo: process.env.LOGO_URL,
      },
    };

    const config = {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      paymentData,
      config
    );

    if (response.data.status === "success") {
      res.status(200).json({
        status: "success",
        message: "Payment initiated successfully",
        transaction_link: response.data.data.link,
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "Payment initiation failed",
        error: response.data.message,
      });
    }
  } catch (error: any) {
    console.error(
      "Error initiating payment:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      status: "error",
      message: "Payment initiation failed",
      error: error.message,
    });
  }
};

// Webhook for verifying payment
export const webhook = async (req, res) => {
  const { transaction_id } = req.query;

  try {
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.status === "success") {
      // Payment successful, update your database with the order details
      await updateOrderStatus(transaction_id, response.data); // Function to update order status
      res.status(200).json({
        status: "success",
        message: "Payment verified successfully",
        data: response.data,
      });
    } else {
      // Payment failed
      res.status(400).json({
        status: "error",
        message: "Payment verification failed",
      });
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      status: "error",
      message: "Payment verification error",
      error: error.message,
    });
  }
};

export const createMoMoSubAccount = async () => {
  const data = {
    account_bank: "MOBILEMONEYRW", // Flutterwave bank code for Rwanda mobile money
    account_number: "250783154587", // Vendor's mobile money number (without "+" sign)
    business_name: "BERWA SHOP",
    business_email: "princemucyo12@gmail.com",
    split_type: "percentage", // Split by percentage or flat amount
    split_value: 0.9, // 90% to vendor, 10% to admin
  };

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/subaccounts",
      data,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // Make sure your environment variable is set
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error creating MoMo subaccount:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
