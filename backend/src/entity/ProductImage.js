import { EntitySchema } from 'typeorm';

export const ProductImage = new EntitySchema({
  name: 'ProductImage',
  tableName: 'R_PRODUCT_IMAGES',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    productId: { type: 'number', name: 'PRODUCT_ID' },
    url: { type: String, length: 400, name: 'URL' },
    alt: { type: String, length: 200, nullable: true, name: 'ALT' },
  },
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      onDelete: 'CASCADE',
      joinColumn: { name: 'PRODUCT_ID' },
    },
  },
});
