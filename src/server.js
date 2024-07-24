import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';  
import usersRouter from './routes/user.js';  
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Product from './models/Product.js';
import Cart from './models/Cart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
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

app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '..', 'views', 'layouts'),  // Verifica esta ruta
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '..', 'views'));  // Verifica esta ruta

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let products = readProductsFromFile();

app.use('/api/products', productsRouter(io));
app.use('/api/carts', cartsRouter(io));
app.use('/api/users', usersRouter);

app.use("/static", express.static(path.resolve(__dirname, '..', 'public')));

app.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('home', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('realTimeProducts', { products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const user = "CoderUser";
const password = "123";
const dbName = "entrega_final";
mongoose.connect(`mongodb+srv://${user}:${password}@curso-db.fmt17lw.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=curso-db`)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
