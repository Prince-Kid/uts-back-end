"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(`
      SELECT "userId","name"
      FROM "Users"
      LIMIT 3;
    `);

    const [products] = await queryInterface.sequelize.query(`
      SELECT "productId","name","image","price"  FROM "Products"

      LIMIT 3;
    `);

    const orders = users.flatMap((user) =>
      products.map((product) => ({
        orderId: uuidv4(),
        deliveryAddress: JSON.stringify({
          street: "KG 111 ST",
          city: "Kigali",
        }),
        // @ts-ignore
        userId: user.userId,
        // @ts-ignore
        client: user.name,
        paymentMethod: "Bank Transfer",
        status: "pending",
        products: JSON.stringify([
          {
            // @ts-ignore
            productId: product.productId,
            // @ts-ignore
            productName: product.name,
            // @ts-ignore
            productImage: product.image,
            // @ts-ignore
            price: product.price,
            status: "pending",
            quantity: 3,
          },
        ]),

        // @ts-ignore

        totalAmount: 36000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    await queryInterface.bulkInsert("Orders", orders, {});
  },

  async down(queryInterface, Sequelize) {
    // @ts-ignore
    await queryInterface.bulkDelete("Orders", null, {});
  },
};
