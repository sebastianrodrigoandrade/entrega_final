// routes/products.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const productsFilePath = path.resolve('data/products.json');

// Función para leer los productos desde el archivo JSON
function readProductsFromFile() {
  try {
    const productsData = fs.readFileSync(productsFilePath, 'utf8');
    return JSON.parse(productsData);
  } catch (error) {
    console.error('Error al leer el archivo de productos:', error);
    return [];
  }
}

// Función para escribir los productos en el archivo JSON
function writeProductsToFile(products) {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error al escribir en el archivo de productos:', error);
  }
}

let products = readProductsFromFile();

export default (io) => {
  router.get('/', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : products.length;
    res.json(products.slice(0, limit));
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
