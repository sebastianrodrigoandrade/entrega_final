import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const cartsFilePath = path.resolve('data/carts.json');

// Función para leer los carritos desde el archivo JSON
function readCartsFromFile() {
  try {
    const cartsData = fs.readFileSync(cartsFilePath, 'utf8');
    return JSON.parse(cartsData);
  } catch (error) {
    console.error('Error al leer el archivo de carritos:', error);
    return {};
  }
}

let carts = readCartsFromFile();

router.get('/', (req, res) => {
  res.json(Object.values(carts));
});

router.get('/:cid', (req, res) => {
  const cartId = req.params.cid;
  const cart = carts[cartId];
  if (cart) {
    res.json(cart);
  } else {
    res.status(404).send('Carrito no encontrado');
  }
});

router.post('/:cid', (req, res) => {
  const cartId = req.params.cid;
  const newProducts = req.body;

  if (!Array.isArray(newProducts)) {
    return res.status(400).send('Se esperaba un arreglo de productos');
  }

  carts[cartId] = newProducts;

  try {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
    res.status(201).json(newProducts);
  } catch (error) {
    console.error('Error al escribir en el archivo de carritos:', error);
    res.status(500).send('Error interno del servidor al guardar el carrito');
  }
});

router.put('/:cid/products/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const { quantity } = req.body;

  if (!quantity || typeof quantity !== 'number') {
    return res.status(400).send('La cantidad debe ser un número válido');
  }

  if (!carts[cartId]) {
    carts[cartId] = [];
  }

  const cart = carts[cartId];
  const existingProduct = cart.find(item => item.id === productId);

  if (existingProduct) {
    existingProduct.quantity = quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  try {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
    res.json(cart);
  } catch (error) {
    console.error('Error al escribir en el archivo de carritos:', error);
    res.status(500).send('Error interno del servidor al actualizar el carrito');
  }
});

router.delete('/:cid/products/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;

  if (!carts[cartId]) {
    return res.status(404).send('Carrito no encontrado');
  }

  const cart = carts[cartId];
  const index = cart.findIndex(item => item.id === productId);

  if (index !== -1) {
    cart.splice(index, 1);

    try {
      fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
      res.status(204).send();
    } catch (error) {
      console.error('Error al escribir en el archivo de carritos:', error);
      res.status(500).send('Error interno del servidor al eliminar el producto del carrito');
    }
  } else {
    res.status(404).send('Producto no encontrado en el carrito');
  }
});

router.delete('/:cid', (req, res) => {
  const cartId = req.params.cid;

  if (!carts[cartId]) {
    return res.status(404).send('Carrito no encontrado');
  }

  delete carts[cartId];

  try {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
    res.status(204).send();
  } catch (error) {
    console.error('Error al escribir en el archivo de carritos:', error);
    res.status(500).send('Error interno del servidor al eliminar el carrito');
  }
});

export default router;
