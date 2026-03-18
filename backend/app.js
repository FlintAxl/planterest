const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require("dotenv/config");

// CORS Configuration
const corsOptions = {
  origin: [
    "https://charriest-lesia-laggardly.ngrok-free.dev",
    "http://localhost:4000",
    "http://192.168.100.97:4000",
    "http://192.168.70.178:4000"
  ],  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

//middleware
app.use(express.json());
app.use(morgan('tiny'));

app.use(errorHandler);


//Routes
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const reviewsRoutes = require("./routes/reviews");
app.use(authJwt());

const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/reviews`, reviewsRoutes);

//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
// Server - Listen on all network interfaces
app.listen(4000, '0.0.0.0', () => {
  console.log("server is running http://localhost:4000");
  console.log("connected na sya pre");
});
