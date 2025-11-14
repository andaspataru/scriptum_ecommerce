import { Router } from 'express';
import { AppDataSource } from '../config/data-source.js';

const router = Router();

/**
 * Creează o comandă nouă
 */
router.post('/', async (req, res) => {
  const b = req.body;
  console.log('[order] received', b);

  if (!b.customer?.name || !b.customer?.email) {
    return res.status(400).json({ error: 'Date client lipsă.' });
  }
  if (!b.shippingAddress?.judet || !b.shippingAddress?.localitate) {
    return res.status(400).json({ error: 'Adresă incompletă.' });
  }
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return res.status(400).json({ error: 'Nicio linie de comandă.' });
  }

  try {
    await AppDataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository('Order');
      const itemRepo  = manager.getRepository('OrderItem');

      const order = orderRepo.create({
        customerName: b.customer.name,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phone ?? null,
        judet: b.shippingAddress.judet,
        localitate: b.shippingAddress.localitate,
        strada: b.shippingAddress.strada,
        numar: b.shippingAddress.numar,
        bloc: b.shippingAddress.bloc ?? null,
        scara: b.shippingAddress.scara ?? null,
        etaj: b.shippingAddress.etaj ?? null,
        apartament: b.shippingAddress.apartament ?? null,
        codPostal: b.shippingAddress.codPostal,
        paymentMethod: b.payment.method,
        cardLast4: b.payment.cardLast4 ?? null,
        cardHolder: b.payment.holder ?? null,
        totalAmount: b.total,
        createdAt: new Date(),
      });

      const savedOrder = await orderRepo.save(order);

      const items = b.items.map((it) =>
        itemRepo.create({
          order: savedOrder,
          productId: it.productId != null ? String(it.productId) : null,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
        })
      );

      await itemRepo.save(items);

      res.status(201).json({ ok: true, orderId: savedOrder.id });
    });
  } catch (err) {
    console.error('Eroare la salvare comandă:', err);
    res.status(500).json({ error: 'Eroare la salvarea comenzii în baza de date.' });
  }
});

/**
 * Listează toate comenzile (pentru admin)
 */
router.get('/', async (req, res) => {
  try {
    const orderRepo = AppDataSource.getRepository('Order');

    // luăm comenzile + liniile lor; numele relației probabil e "items"
    const orders = await orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .orderBy('o.createdAt', 'DESC')
      .getMany();

    res.json(orders);
  } catch (err) {
    console.error('Eroare la citirea comenzilor:', err);
    res.status(500).json({ error: 'Eroare la citirea comenzilor din baza de date.' });
  }
});

export default router;
