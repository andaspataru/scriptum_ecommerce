import { EntitySchema } from 'typeorm';

export const Category = new EntitySchema({
  name: 'Category',
  tableName: 'R_CATEGORIES',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    name: { type: String, length: 120, unique: true, name: 'NAME' },
    description: { type: String, length: 500, nullable: true, name: 'DESCRIPTION' },
  },
  relations: {
    products: { type: 'one-to-many', target: 'Product', inverseSide: 'category' },
  },
});
