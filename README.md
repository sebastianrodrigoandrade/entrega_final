# entrega_final
Proyecto de Carrito de Compras
Este proyecto es una aplicación web de carrito de compras utilizando Express.js, Handlebars, Socket.io y MongoDB. Permite a los usuarios ver productos, agregarlos al carrito y realizar un seguimiento de su carrito en tiempo real.

Tecnologías Utilizadas
Node.js: Entorno de ejecución para JavaScript del lado del servidor.
Express.js: Framework para construir aplicaciones web en Node.js.
Handlebars: Motor de plantillas para generar vistas dinámicas.
Socket.io: Biblioteca para comunicación en tiempo real basada en WebSocket.
MongoDB: Base de datos NoSQL para almacenamiento de datos.
Mongoose: Biblioteca de modelado de objetos para MongoDB y Node.js.
Instalación
Clonar el Repositorio

bash
git clone https://github.com/sebastianrodrigoandrade/entrega_final
Instalar Dependencias

Navega al directorio del proyecto e instala las dependencias necesarias:


cd <DIRECTORIO_DEL_PROYECTO>
npm install

Crea un archivo .env en el directorio raíz del proyecto con las siguientes variables:

env
MONGO_URI=<TU_URI_DE_MONGODB>
SESSION_SECRET=<TU_SECRETO_DE_SESION>
PORT=8080
Ejecución
Para iniciar el servidor de la aplicación, ejecuta el siguiente comando:

bash
npm start
Esto iniciará el servidor en el puerto especificado (por defecto, 8080). Puedes acceder a la aplicación en http://localhost:8080.

Endpoints
GET /: Muestra la página principal con la lista de productos.
GET /realtimeproducts: Muestra la lista de productos en tiempo real.
POST /api/carts/
: Agrega un producto al carrito.
GET /cart: Muestra el carrito con los productos agregados.
DELETE /api/carts/
: Elimina un producto del carrito.
Uso de Socket.io
La aplicación utiliza Socket.io para actualizar la lista de productos en tiempo real. Cuando se agrega o elimina un producto, la lista de productos se actualiza automáticamente en todos los clientes conectados.