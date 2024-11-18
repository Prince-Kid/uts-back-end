import jwt from "jsonwebtoken";
import User from "../database/models/user";
import dotenv from "dotenv";
import Vendor from "../database/models/vendor";
import { where } from "sequelize";

dotenv.config();

const generateToken = async (userData: User) => {
  const vendor = await Vendor.findOne({
    where: { userId: userData?.userId },
  });
  const vendorId = vendor ? vendor.vendorId : null;

  return jwt.sign(
    {
      role: userData.role,
      email: userData.email,
      id: userData.userId,
      vendor: vendorId,
      password: userData.password,
    },
    "crafters1234",
    {
      expiresIn: "1d",
    }
  );
};

export { generateToken };
