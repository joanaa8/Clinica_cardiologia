require('dotenv').config();
const express = require('express');
const path = require("path");
const cors = require('cors');
const pool = require('./config/db.js');
const app = express();
const bcrypt = require('bcrypt'); // Para hashear e comparar senhas (RN 1)
const jwt = require('jsonwebtoken'); // Para gerar o token de acesso (RN 3)
const port = 3000;

// Serve ficheiros estáticos (HTML, CSS, JS)
//app.use(express.static(path.join(__dirname, 'public')));

//app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));

//Importar router de customers
//const customersRouter = require('./routes/customersRoutes.js');
//const errorHandling = require('./middlewares/errorHandler.js');

//Middlewares
// Middleware para processar JSON
app.use(express.json());
app.use(cors());

//Routes
// Todas as rotas que começam por /api são tratadas em routes/customersRoutes.js
//app.use("/api", customersRouter);

//Error handling
//app.use(errorHandling);


//Testing postgres connection
app.get("/", async(req,res)=>
{
  const result = await pool.query("SELECT current_database()");
  res.send("The database name is: " + result.rows[0].current_database);
});

/*app.get("/", (req, res) => {
  res.send("Hello World!");
});*/

app.listen(port, () => {
  console.log(`Servidor a correr em http://localhost:${port}`);
});
