import { EntitySchema } from 'typeorm';

export const OrderItem = new EntitySchema({
  name: 'OrderItem',
  tableName: 'R_ORDER_ITEMS',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    productId: { type: String, length: 64, nullable: true, name: 'PRODUCT_ID' },
    title: { type: String, length: 400, name: 'TITLE' },
    price: { type: 'number', precision: 12, scale: 2, name: 'PRICE' },
    quantity: { type: 'number', name: 'QUANTITY' },
  },
  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      onDelete: 'CASCADE',
      joinColumn: { name: 'ORDER_ID' },
    },
  },
});
