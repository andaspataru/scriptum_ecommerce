import { EntitySchema } from 'typeorm';

export const CartItem = new EntitySchema({
  name: 'CartItem',               
  tableName: 'R_CART_ITEMS',
  columns: {
    id:        { type: Number, primary: true, generated: true, name: 'ID' },
    quantity:  { type: 'number', default: 1, name: 'QUANTITY' },
  },
  relations: {
    cart: {
      type: 'many-to-one',
      target: 'Cart',             
      onDelete: 'CASCADE',
      joinColumn: { name: 'CART_ID' },
      inverseSide: 'items',        
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      eager: true,
      onDelete: 'CASCADE',
      joinColumn: { name: 'PRODUCT_ID' },
    },
  },
});
