import express from 'express';
import Product from '../models/Product.js';

const createProductsRouter = (io) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const { limit = 10, page = 1, sort, query } = req.query;

    let filter = {};
    if (query) {
      filter = { $or: [{ category: query }, { availability: query }] };
    }

    let sortOption = {};
    if (sort) {
      sortOption = { price: sort === 'asc' ? 1 : -1 };
    }

    try {
      const products = await Product.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);

      res.json({
        status: 'success',
        payload: products,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? parseInt(page) + 1 : null,
        page,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
        prevLink: page > 1 ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null,
        nextLink: page < totalPages ? `/api/products?limit=${limit}&page=${parseInt(page) + 1}&sort=${sort}&query=${query}` : null,
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.post('/', async (req, res) => {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Debe enviar un array de productos' });
    }

    // Validar cada producto
    for (const product of products) {
      const { title, description, code, price, stock, category, status, thumbnails = [] } = product;

      if (!title || !description || !code || !price || !stock || !category || status === undefined) {
        return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios, excepto thumbnails' });
      }
    }

    try {
      // Crear y guardar todos los productos
      const newProducts = await Product.insertMany(products);
      res.status(201).json({ status: 'success', payload: newProducts });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, code, price, stock, category, thumbnails = [] } = req.body;

    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { title, description, code, price, stock, category, thumbnails },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ status: 'error', message: 'Product not found' });
      }

      res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const deletedProduct = await Product.findByIdAndDelete(id);

      if (!deletedProduct) {
        return res.status(404).json({ status: 'error', message: 'Product not found' });
      }

      res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  return router;
};

export default createProductsRouter;
