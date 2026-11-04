require('dotenv').config();
const cors = require('cors');
const express = require('express');

const { sequelize, models } = require('./models');
const routes = require('./routes');

const app = express();

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  req.context = {
    models,
  };
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use("/users", routes.user);

app.get("/", (req, res) => {
  res.send("SystemDrawn API - Servidor rodando!");
});

const port = process.env.PORT || 3000;
const eraseDatabaseOnSync = process.env.ERASE_DATABASE_ON_SYNC === "true";

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
  if (eraseDatabaseOnSync) {
    seedDatabase();
  }

  app.listen(port, () =>
    console.log("SystemDrawn API listening on port " + port)
  );
});

const seedDatabase = async () => {
  await models.User.create({
    cpf: "12345678901",
    nomeCompleto: "Usuario Teste",
  });
};

module.exports = app;