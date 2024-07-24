import express from 'express';
import session from 'express-session';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';  // Asegúrate de importar el modelo Product

const createCartsRouter = (io) => {
  const router = express.Router();

  // Configuración de la sesión
  router.use(session({
    secret: 'tu_secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
  }));

  // Ruta para agregar un producto al carrito
  router.post('/:cid/products', async (req, res) => {
    const { cid } = req.params;
    const { productId } = req.body;

    try {
      const cart = await Cart.findById(cid);
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (productIndex === -1) {
        cart.products.push({ product: productId, quantity: 1 });
      } else {
        cart.products[productIndex].quantity += 1;
      }

      await cart.save();
      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

// Ruta para mostrar el contenido del carrito
router.get('/', (req, res) => {
  res.render('cart', { cart: req.session.cart || [] });
});
  router.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    try {
      const cart = await Cart.findById(cid);
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      cart.products = cart.products.filter(p => p.product.toString() !== pid);
      await cart.save();

      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.put('/:cid', async (req, res) => {
    const { cid } = req.params;
    const { products } = req.body;
    try {
      const cart = await Cart.findByIdAndUpdate(cid, { products }, { new: true });
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.put('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;
    try {
      const cart = await Cart.findById(cid);
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      const productIndex = cart.products.findIndex(p => p.product.toString() === pid);
      if (productIndex === -1) {
        cart.products.push({ product: pid, quantity });
      } else {
        cart.products[productIndex].quantity = quantity;
      }

      await cart.save();
      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.delete('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
      const cart = await Cart.findByIdAndUpdate(cid, { products: [] }, { new: true });
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.get('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
      const cart = await Cart.findById(cid).populate('products.product');
      if (!cart) return res.status(404).json({ status: 'error', message: 'Cart not found' });

      res.json({ status: 'success', payload: cart });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  return router;
};

export default createCartsRouter;
