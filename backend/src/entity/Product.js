import { EntitySchema } from 'typeorm';

export const Product = new EntitySchema({
  name: 'Product',
  tableName: 'R_PRODUCTS',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    title: { type: String, length: 180, name: 'TITLE' },
    price: { type: 'number', precision: 10, scale: 2, name: 'PRICE' },
    stock: { type: 'number', default: 0, name: 'STOCK' },
    imageUrl: { type: String, length: 500, nullable: true, name: 'IMAGEURL' },
    description: { type: String, length: 2000, nullable: true, name: 'DESCRIPTION' },
  },
  relations: {
    category: {
      type: 'many-to-one',
      target: 'Category',
      eager: true,
      onDelete: 'SET NULL',
      joinColumn: { name: 'CATEGORY_ID' },
    },
    images: {
      type: 'one-to-many',
      target: 'ProductImage',
      inverseSide: 'product',
      cascade: ['insert', 'update'],
      eager: false,
    },
  },
});
