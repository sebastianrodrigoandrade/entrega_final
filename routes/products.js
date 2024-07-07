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

let products = readProductsFromFile();

export default function(io) {
  router.get('/', (req, res) => {
    res.json(products);
  });

  router.post('/', (req, res) => {
    const newProduct = req.body;
    products.push(newProduct);

    try {
      fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
      io.emit('productList', products);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error al escribir en el archivo de productos:', error);
      res.status(500).send('Error interno del servidor al guardar el producto');
    }
  });

  router.delete('/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products.splice(index, 1);

      try {
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
        io.emit('productList', products);
        res.status(204).send();
      } catch (error) {
        console.error('Error al escribir en el archivo de productos:', error);
        res.status(500).send('Error interno del servidor al eliminar el producto');
      }
    } else {
      res.status(404).send('Producto no encontrado');
    }
  });

  return router;
}
