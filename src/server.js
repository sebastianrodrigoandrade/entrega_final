import { fileURLToPath } from 'url';
import express from 'express';
import { engine } from 'express-handlebars'; // Usa 'engine' en lugar de 'exphbs'
import path from 'path';
import mongoose from 'mongoose';
import session from 'express-session';
import createCartsRouter from './routes/carts.js';
import Product from './models/Product.js';
import Cart from './models/Cart.js'; // Asegúrate de importar el modelo Cart
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

dotenv.config();

// Función para obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de Socket.io
const server = createServer(app);
const io = new Server(server);

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

function writeProductsToFile(products) {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error al escribir en el archivo de productos:', error);
  }
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '..', 'views', 'layouts'),  // Verifica esta ruta
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');

// Configuración del directorio de vistas
app.set('views', path.join(__dirname, '..', 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Middleware para crear un carrito si no existe en la sesión
app.use(async (req, res, next) => {
  if (!req.session.cartId) {
    const cart = new Cart({ products: [] });
    await cart.save();
    req.session.cartId = cart._id;
  }
  next();
});

// Rutas
app.use('/api/carts', createCartsRouter(io));

// Ruta principal para mostrar productos
app.get('/', async (req, res) => {
  try {
    const products = await Product.find(); // Obteniendo productos de la base de datos
    res.render('home', { products, cartId: req.session.cartId });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Ruta para productos en tiempo real
app.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('realTimeProducts', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });

  socket.on('newProduct', (newProduct) => {
    const { title, description, code, price, stock, category, thumbnails = [] } = newProduct;

    if (!title || !description || !code || !price || !stock || !category) {
      console.log('Todos los campos son obligatorios, excepto thumbnails');
      return;
    }

    const newProductWithId = {
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

    products.push(newProductWithId);
    writeProductsToFile(products);

    io.emit('updateProducts', products);
  });
});

// Ruta para agregar producto al carrito
app.post('/api/carts/:productId', async (req, res) => {
  const { productId } = req.params;
  const cartId = req.session.cartId;

  try {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Verifica si el producto ya está en el carrito
    const existingProduct = cart.products.find(p => p.product.toString() === productId);
    if (existingProduct) {
      // Si ya existe, solo aumenta la cantidad
      existingProduct.quantity += 1;
    } else {
      // Si no existe, agrega el producto al carrito con cantidad 1
      cart.products.push({ product: productId, quantity: 1 });
    }

    await cart.save();

    // Redirigir al carrito
    res.redirect('/cart');
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Ruta para mostrar el carrito
app.get('/cart', async (req, res) => {
  try {
    const cart = await Cart.findById(req.session.cartId).populate('products.product');
    if (!cart) {
      return res.status(404).send('Carrito no encontrado');
    }

    // Calcular el total
    const total = cart.products.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    res.render('cart', { products: cart.products, total });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para eliminar producto del carrito
app.delete('/api/carts/:productId', async (req, res) => {
  const { productId } = req.params;
  const cartId = req.session.cartId;

  try {
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    // Eliminar el producto del carrito
    cart.products = cart.products.filter(product => product._id.toString() !== productId);
    await cart.save();

    res.status(200).send();
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
