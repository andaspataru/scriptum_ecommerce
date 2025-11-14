import { EntitySchema } from 'typeorm';

export const Order = new EntitySchema({
  name: 'Order',
  tableName: 'R_ORDERS',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    orderUid: { type: String, length: 64, nullable: true, name: 'ORDER_UID' },
    createdAt: { type: 'timestamp with time zone', name: 'CREATED_AT', default: () => 'SYSTIMESTAMP' },
    customerName: { type: String, length: 200, name: 'CUSTOMER_NAME' },
    customerEmail: { type: String, length: 254, name: 'CUSTOMER_EMAIL' },
    customerPhone: { type: String, length: 32, nullable: true, name: 'CUSTOMER_PHONE' },
    judet: { type: String, length: 100, name: 'JUDET' },
    localitate: { type: String, length: 100, name: 'LOCALITATE' },
    strada: { type: String, length: 200, name: 'STRADA' },
    numar: { type: String, length: 20, name: 'NUMAR' },
    bloc: { type: String, length: 20, nullable: true, name: 'BLOC' },
    scara: { type: String, length: 20, nullable: true, name: 'SCARA' },
    etaj: { type: String, length: 20, nullable: true, name: 'ETAJ' },
    apartament: { type: String, length: 20, nullable: true, name: 'APARTAMENT' },
    codPostal: { type: String, length: 12, name: 'COD_POSTAL' },
    paymentMethod: { type: String, length: 16, name: 'PAYMENT_METHOD' },
    cardLast4: { type: String, length: 4, nullable: true, name: 'CARD_LAST4' },
    cardHolder: { type: String, length: 200, nullable: true, name: 'CARD_HOLDER' },
    totalAmount: { type: 'number', precision: 12, scale: 2, name: 'TOTAL_AMOUNT' },
  },
  relations: {
    items: { type: 'one-to-many', target: 'OrderItem', inverseSide: 'order', cascade: ['insert'] },
  },
});
