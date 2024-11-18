import { Response, Request } from "express";
import Order from "../database/models/order";

import Review from "../database/models/review";
import { Op, where } from "sequelize";
import models from "../database/models";
import Rating from "../database/models/rating";
import Product from "../database/models/product";


export const addReview = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { productId, rating, feedback } = req.body;
    if (rating && rating > 5) {
      return res.status(402).json({ message: "Rating is between 0 and 5" });
    }

    const viewOrder = await Order.findOne({
      where: {
        userId,
        products: {
          productId,
        },
      },
    });
    if (!viewOrder) {
      return res
        .status(400)
        .json({ message: " User has not bougth this product" });
    }

    const addReview = await Review.create({
      userId,
      productId,
      rating,
      feedback,
    });
    res
      .status(200)
      .json({ message: "Review created successfully", review: addReview });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const selectReview = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id;
    const review = await Review.findAll({
      include: [
        {
          model: models.Product,
          where: { vendorId: vendorId },
        },
      ],
    });
    if (!review || review.length === 0) {
      return res
        .status(400)
        .json({ message: "There in no review in your products" });
    }
    return res.status(200).json({ review: review });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const selectFeedback = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const ratings = await Rating.findAll({
      where: {
        productId
      },
      order: [['createdAt', 'DESC']] 
    });

    if (!ratings || ratings.length === 0) {
      return res.status(400).json({ message: "There are no ratings for your product" });
    }

    return res.status(200).json({ ratings });
  } catch (error: any) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ message: error.message });
  }
};
export const view_vendor_feedback = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id;
    const ratings = await Rating.findAll({include: {
      model: Product,
      as: "Product"
    }})
    if (!ratings || ratings.length === 0) {
      return res
    }
    let resFeedback = []
    res.status(200).json({message: "success fetched", feedback: ratings})


  } catch (error) {
    res.status(500).json({message: error})
  }
};

export const addFeedback = async (req: Request, res: Response) => {
  try {
    const { name, ratingScore, feedback } = req.body;
    const productId = req.params.id;
    if (!name) {
      return res.status(402).json({ message: "You must add your name" });
    }
    if (ratingScore && ratingScore > 5) {
      return res.status(402).json({ message: "enter rating between 0 and 5" });
    }
    const saveData = await Rating.create({
      name,
      ratingScore,
      feedback,
      productId,
    });
    if (!saveData) {
      return res.status(400).json({ message: "error in saving data" });
    }
    res.status(201).json({ message: "feedback created", data: saveData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findByPk(reviewId);
    if (!review) {
      res.status(404).json({ message: "No review Found" });
      return;
    }
    await review.destroy();
    res.status(200).json({ message: "Review Deleted Successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sales_products = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id;
    const products = await Product.findAll({ where: { vendorId: vendorId } });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    const orders = await Order.findAll();

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    let product_purchase: any = [];
    for (const product of products) {
      for (const order of orders) {
        if (order.products.some((orderProduct: any) => orderProduct.productId === product.id)) {
          product_purchase.push({ product: product, order: order });
        }
      }
    }
    return res.status(200).json({ product: product_purchase });
  } catch (error:any) {
    return res.status(500).json({ message: error.message });
  }
};