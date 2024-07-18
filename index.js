import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { createServer } from 'http';  
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';
import fs from 'fs';

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

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());

let products = readProductsFromFile();

app.use('/api/products', productsRouter(io));
app.use('/api/carts', cartsRouter(io));

app.get('/', (req, res) => {
  res.render('home', { products });
});

app.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts', { products });
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Usuario conectado');

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });

  socket.on('newProduct', (newProduct) => {
    // Validar y agregar el nuevo producto
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

    // Emitir la lista actualizada de productos a todos los clientes
    io.emit('updateProducts', products);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
