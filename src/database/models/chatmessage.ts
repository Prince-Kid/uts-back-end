"use strict";
import { Model, DataTypes, Sequelize } from "sequelize";
import connectSequelize from "../config/db.config";

class ChatMessage extends Model {
  public messageId?: string;
  public content?: any;
  public imageUrl?: any;
  public sender!: string;
  public receiver!: string;
  static associate(models: any) {

  }
  static initModel(sequelize: Sequelize) {
    ChatMessage.init(
      {
        messageId: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        content: { type: DataTypes.TEXT, allowNull: true },
        imageUrl: { type: DataTypes.JSONB, allowNull: true },
        sender: { type: DataTypes.STRING, allowNull: false },
        receiver: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize: connectSequelize,
        modelName: "ChatMessage",
        tableName: "ChatMessages",
        timestamps: true,
      }
    );
    return ChatMessage;
  }
}

ChatMessage.initModel(connectSequelize);

export default ChatMessage;
