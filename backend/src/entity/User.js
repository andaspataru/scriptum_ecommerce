import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'R_USERS',
  columns: {
    id: { type: Number, primary: true, generated: true, name: 'ID' },
    email: { type: String, length: 150, unique: true, name: 'EMAIL' },
    name: { type: String, length: 100, name: 'NAME' },
    passwordHash: { type: String, length: 255, name: 'PASSWORD_HASH' },
    role: { type: String, length: 30, default: 'customer', name: 'ROLE' },
    birthDate: { type: 'date', name: 'BIRTH_DATE' },
    phoneNumber: { type: String, length: 20, name: 'PHONE_NUMBER' },
    judet: { type: String, length: 100, name: 'JUDET' },
    localitate: { type: String, length: 150, name: 'LOCALITATE' },
    strada: { type: String, length: 200, name: 'STRADA' },
    numar: { type: String, length: 20, name: 'NUMAR' },
    bloc: { type: String, length: 20, nullable: true, name: 'BLOC' },
    scara: { type: String, length: 10, nullable: true, name: 'SCARA' },
    etaj: { type: String, length: 10, nullable: true, name: 'ETAJ' },
    apartament: { type: String, length: 10, nullable: true, name: 'APARTAMENT' },
    codPostal: { type: String, length: 20, name: 'COD_POSTAL' },
  },
  relations: {
    carts: { type: 'one-to-many', target: 'Cart', inverseSide: 'user' },
  },
});
