import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import connectSequelize from "../config/db.config";
import User from "./user"; // Make sure this path is correct

interface VendorAttributes {
  vendorId?: string;
  userId: string;
  storeName: string;
  address: any;
  TIN: number;
  bankAccount: number;
  paymentDetails?: any;
  status?: string;
}

interface VendorCreationAttributes
  extends Optional<VendorAttributes, "vendorId"> {}

class Vendor extends Model<VendorAttributes, VendorCreationAttributes> {
  public vendorId?: string;
  public userId!: string;
  public storeName!: string;
  public address!: any;
  public TIN!: number;
  public bankAccount!: number;
  public paymentDetails?: any;
  public status!: string;

  // Declare associations
  public user?: User; // Add this line to declare the association

  static associate(models: any) {
    Vendor.hasMany(models.Product, {
      foreignKey: "vendorId",
      as: "Products", // It's better to use "Products" for consistency
    });
    Vendor.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user", // Ensure alias is consistent with the use in queries
    });
  }

  static initModel(sequelize: Sequelize) {
    Vendor.init(
      {
        vendorId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        userId: { type: DataTypes.STRING, allowNull: false },
        storeName: { type: DataTypes.STRING, allowNull: false },
        address: { type: DataTypes.JSONB, allowNull: false },
        TIN: { type: DataTypes.INTEGER, allowNull: false },
        bankAccount: { type: DataTypes.INTEGER, allowNull: false },
        paymentDetails: { type: DataTypes.JSONB, allowNull: true },
        status: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: "pending",
        },
      },
      {
        sequelize: connectSequelize,
        modelName: "Vendor",
        tableName: "Vendors",
        timestamps: true,
      }
    );
    return Vendor;
  }
}

Vendor.initModel(connectSequelize);

export default Vendor;
