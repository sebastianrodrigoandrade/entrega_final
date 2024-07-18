import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const productsFilePath = path.resolve('data/products.json');

function readProductsFromFile() {
  try {
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(productsData);
  } catch (error) {
    console.error('Error al leer el archivo de productos:', error);
    return [];
  }
}

let products = readProductsFromFile();

export default (io) => {
  router.get('/', (req, res) => {
    let { limit = 10, page = 1, sort, query } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);

    let filteredProducts = products;

    if (query) {
      filteredProducts = filteredProducts.filter(product =>
        product.title.includes(query) || product.category.includes(query)
      );
    }

    if (sort) {
      if (sort === 'asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sort === 'desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
      }
    }

    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      status: 'success',
      payload: paginatedProducts,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
      page,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevLink: page > 1 ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null,
      nextLink: page < totalPages ? `/api/products?limit=${limit}&page=${page + 1}&sort=${sort}&query=${query}` : null
    });
  });

  router.get('/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const product = products.find(p => p.id === productId);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Producto no encontrado');
    }
  });

  router.post('/', (req, res) => {
    const { title, description, code, price, stock, category, thumbnails = [] } = req.body;

    if (!title || !description || !code || !price || !stock || !category) {
      return res.status(400).send('Todos los campos son obligatorios, excepto thumbnails');
    }

    const newProduct = {
      id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
      title,
      description,
      code,
      price,
      status: true,
      stock,
      category,
      thumbnails
    };

    products.push(newProduct);
    writeProductsToFile(products);
    io.emit('updateProducts', products);
    res.status(201).json(newProduct);
  });

  router.put('/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const { title, description, code, price, status, stock, category, thumbnails = [] } = req.body;
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).send('Producto no encontrado');
    }

    products[productIndex] = { id: productId, title, description, code, price, status, stock, category, thumbnails };
    writeProductsToFile(products);
    io.emit('updateProducts', products);
    res.json(products[productIndex]);
  });

  router.delete('/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).send('Producto no encontrado');
    }

    products.splice(productIndex, 1);
    writeProductsToFile(products);
    io.emit('updateProducts', products);
    res.status(204).send();
  });
      
  return router;
};
