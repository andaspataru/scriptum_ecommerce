import { EntitySchema } from 'typeorm';

export const Cart = new EntitySchema({
  name: 'Cart',
  tableName: 'R_CARTS',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    createdAt: { type: 'timestamp', name: 'CREATED_AT', createDate: true },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      eager: true,
      onDelete: 'CASCADE',
      joinColumn: { name: 'USER_ID' },
    },
    items: {
      type: 'one-to-many',
      target: 'CartItem',
      inverseSide: 'cart',
      cascade: true,
    },
  },
});
