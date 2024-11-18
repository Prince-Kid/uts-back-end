import { Request, Response } from "express";
import {
  saveProduct,
  searchProducts,
  getAllProducts,
} from "../services/productService";
import Product from "../database/models/product";
import CartItem from "../database/models/cartitem";
import {
  checkVendorModifyPermission,
  checkVendorPermission,
} from "../services/PermisionService";
import {
  PRODUCT_ADDED,
  PRODUCT_REMOVED,
  PRODUCT_UPDATED,
  productLifecycleEmitter,
} from "../helpers/events";
import { Op } from "sequelize";
import { ParsedQs } from "qs";
import Vendor from "../database/models/vendor";
import { request } from "http";
import { getProductById } from "../services/productService";
import { fetchSimilarProducts } from "../services/productService";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const tokenData = (req as any).token;
    const vendorId: string = req.params.id;
    const permissionCheck: any = await checkVendorPermission(
      tokenData,
      vendorId
    );
    if (!permissionCheck.allowed) {
      return res
        .status(permissionCheck.status)
        .json({ message: permissionCheck.message });
    }
    const {
      name,
      image,
      description,
      discount,
      price,
      quantity,
      category,
      expiringDate,
    } = req.body;
    console.log(image);
    if (!name || !image || !description || !price || !quantity || !category) {
      return res.status(200).json("All Field are required");
    }

    if (!Array.isArray(image) || image.length !== 4) {
      return res.status(400).json({ message: "Exactly 4 images are required" });
    }

    const data = {
      name,
      image: image,
      description,
      discount: discount ? discount : 0,
      price,
      quantity,
      category,
      vendorId: vendorId,
      expiringDate,
    };
    const save = await saveProduct(data);
    if (!save) {
      return res.status(500).json({ error: "Failed to save data" });
    }

    productLifecycleEmitter.emit(PRODUCT_ADDED, data);

    return res.status(201).json({ message: "Product Created", data: save });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const readProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId, {
      include: {
        model: Vendor,
        as: "Vendor",
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const similarProducts = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const category = product.category;
    const similarProducts = await fetchSimilarProducts(productId, category);

    if (similarProducts.length === 0) {
      return res.status(404).json({ error: "No similar products found" });
    }
    console.log("hhhhhhhhhh", similarProducts);

    return res.status(200).json(similarProducts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// delete product
export const readAllProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const products = await getAllProducts(page, limit);

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchProduct = async (req: Request, res: Response) => {
  try {
    const { name, category } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const criteria: any = {};
    if (name) criteria.name = name;
    if (category) criteria.category = category;

    const products = await searchProducts(criteria, page, limit);

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const tokenData = (req as any).token;
    const { vendorId } = req.body;
    const productId = req.params.id;

    const permissionCheck: any = await checkVendorModifyPermission(
      tokenData,
      vendorId
    );
    if (!permissionCheck.allowed) {
      return res
        .status(permissionCheck.status)
        .json({ message: permissionCheck.message });
    }

    const updateData = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await product.update(updateData);
    productLifecycleEmitter.emit(PRODUCT_UPDATED, product);

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const tokenData = (req as any).token;
    const productId = req.params.id;
    const { vendorId } = req.body;
    console.log(productId);

    const permissionCheck: any = await checkVendorModifyPermission(
      tokenData,
      vendorId
    );
    if (!permissionCheck.allowed) {
      return res
        .status(permissionCheck.status)
        .json({ message: permissionCheck.message });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await product.destroy();
    productLifecycleEmitter.emit(PRODUCT_REMOVED, product);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const viewProducts = async (req: Request, res: Response) => {
  try {
    const tokenData = (req as any).token;
    const vendorId = req.params.id;
    const permissionCheck: any = await checkVendorPermission(
      tokenData,
      vendorId
    );
    if (!permissionCheck.allowed) {
      return res
        .status(permissionCheck.status)
        .json({ message: permissionCheck.message });
    }

    const products = await Product.findAll({
      where: { vendorId: vendorId },
    });

    if (!products.length) {
      res.status(404).json({ message: "No products found" });
      return;
    }
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

//get popular products

export const getPopularProduct = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      include: { model: CartItem, as: "CartItem" },
    });
    if (!products) {
      res.status(404).json({ message: "No products found" });
    }
    for (let i = 0; i <= products.length; i++) {
      for (let b = i + 1; b <= products.length; b++) {
        if (products[i]?.CartItem?.length < products[b]?.CartItem?.length) {
          let temp = products[i];
          products[i] = products[b];
          products[b] = temp;
        }
      }
    }
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
