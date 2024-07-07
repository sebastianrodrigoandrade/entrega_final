import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { createServer } from 'http';  // Asegúrate de importar createServer de 'http'
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import productsRouter from './routes/products.js';
import cartsRouter from './routes/carts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app); // Usa createServer de 'http' para crear el servidor
const io = new Server(server);

// Configuración de Handlebars como motor de plantillas
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware para parsear JSON
app.use(express.json());

// Rutas para productos y carritos
app.use('/api/products', productsRouter(io));
app.use('/api/carts', cartsRouter(io));

// Ruta de inicio
app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a la tienda de productos</h1>');
});

// Ruta de about
app.get('/about', (req, res) => {
  res.send('<h1>Sobre la tienda de productos</h1>');
});

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Ejemplo de evento socket
  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
