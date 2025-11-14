import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { User } from '../entity/User.js';
import { Category } from '../entity/Category.js';
import { Product } from '../entity/Product.js';
import { Cart } from '../entity/Cart.js';
import { CartItem } from '../entity/CartItem.js';
import { Order } from '../entity/Order.js';
import { OrderItem } from '../entity/OrderItem.js';
import { ProductImage } from '../entity/ProductImage.js';

config();

export const AppDataSource = new DataSource({
  type: 'oracle',
  username: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
  schema: process.env.ORACLE_USER?.toUpperCase(),
  entities: [User, Category, Product, Cart, CartItem, Order, OrderItem, ProductImage],
  logging: ['error', 'query', 'schema'],
  synchronize: false,
});
