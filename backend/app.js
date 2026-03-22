const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require("dotenv/config");

// CORS Configuration
const defaultAllowedOrigins = [
  "https://charriest-lesia-laggardly.ngrok-free.dev",
  "http://localhost:4000",
  "http://192.168.100.97:4000",
  "http://192.168.70.178:4000",
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

const allowedOrigins = envAllowedOrigins.length > 0 ? envAllowedOrigins : defaultAllowedOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from mobile apps, Postman, and server-to-server calls without an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
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

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
const port = process.env.PORT || 4000;

app.listen(port, '0.0.0.0', () => {
  console.log(`server is running on port ${port}`);
  console.log("connected na sya pre");
});
