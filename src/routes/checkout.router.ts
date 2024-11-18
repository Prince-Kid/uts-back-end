import express, { Request, Response } from "express";
import { createOrder } from "../controllers/checkout.controller";
import { checkout, webhook } from "../controllers/Payment";
import { VerifyAccessToken } from "../middleware/verfiyToken";
import { createMoMoSubAccount } from "../controllers/Payment";
const router = express.Router();

router.post("/checkout", createOrder);
router.post("/create", createMoMoSubAccount);
router.post("/payment/:id", checkout);

router.post("/webhook", express.raw({ type: "application/json" }), webhook);

router.get("/success", async (req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                display: inline-block;
            }
            h1 {
                color: #4CAF50;
            }
            p {
                font-size: 18px;
                color: #333;
            }
            .btn {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                font-size: 16px;
                color: #fff;
                background-color: #4CAF50;
                border: none;
                border-radius: 5px;
                text-decoration: none;
                cursor: pointer;
            }
            .btn:hover {
                background-color: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase. Your payment has been processed successfully.</p>
            <a href="http://localhost:8080/" class="btn">Return to Home</a>
        </div>
    </body>
    </html>
    `);
});
router.get("/cancel", async (req: Request, res: Response) => {
  res.send("Cancel");
});

export default router;
