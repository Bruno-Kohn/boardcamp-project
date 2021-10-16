import express from "express";
import cors from "cors";
import pg from "pg";
import Joi from "joi";
import JoiDate from "@joi/date";

const app = express();
app.use(cors());
app.use(express.json());

//------------------------- CONECTANDO O BANCO -------------------------

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

//------------------------- LISTAR CATEGORIAS -------------------------

app.get("/categories", async (req, res) => {
  try {
    const result = await connection.query("SELECT * FROM categories");
    res.send(result.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- INSERIR CATEGORIAS -------------------------

app.post("/categories", async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(1).required(),
  });

  try {
    const value = await schema.validateAsync(req.body);
    const { name } = value;
    const result = await connection.query(
      "SELECT * FROM categories WHERE name = $1",
      [name]
    );

    if (result.rows[0]) {
      return res.sendStatus(409);
    }

    await connection.query("INSERT INTO categories (name) VALUES ($1);", [
      name,
    ]);
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- LISTAR JOGOS -------------------------

app.get("/games", async (req, res) => {
  const { name } = req.query;
  const searchedGames = name ? ` WHERE games.name ILIKE '${name}%'` : "";

  try {
    const result = await connection.query(`
      SELECT games.*, categories.name AS "categoryName" 
      FROM games JOIN categories
      ON games."categoryId" = categories.id
      ${searchedGames}
    `);
    res.send(result.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- INSERIR JOGOS -------------------------

app.post("/games", async (req, res) => {
  const result = await connection.query("SELECT id FROM categories");
  const categIds = result.rows.map((i) => i.id);

  const schema = Joi.object({
    name: Joi.string().min(1).required(),
    image: Joi.string()
      .uri()
      .pattern(/^http([^\s]+(?=\.(jpg|gif|png))\.\2)/)
      .required(),
    stockTotal: Joi.number().greater(0).required(),
    categoryId: Joi.number().integer().min(1).required(),
    pricePerDay: Joi.number().integer().min(1).required(),
  });

  try {
    const value = await schema.validateAsync(req.body);
    const { name, image, stockTotal, categoryId, pricePerDay } = value;
    const result = await connection.query(
      "SELECT * FROM games WHERE name = $1",
      [name]
    );

    if (result.rows[0]) {
      return res.sendStatus(409);
    }

    if (!categIds.includes(categoryId)) {
      console.log("This category doesn't exist");
      return res.sendStatus(400);
    }

    await connection.query(
      'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- LISTAR CLIENTES -------------------------

app.get("/customers", async (req, res) => {
  const { cpf } = req.query;
  const searchedCustomer = cpf ? ` WHERE customers.cpf ILIKE '${cpf}%';` : ";";

  try {
    const result = await connection.query(
      `SELECT * FROM customers${searchedCustomer}`
    );
    res.send(result.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- LISTAR CLIENTES POR ID -------------------------

app.get("/customers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await connection.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }
    res.send(result.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- INSERIR CLIENTES -------------------------

app.post("/customers", async (req, res) => {
  const extendedJoi = Joi.extend(JoiDate);
  const schema = Joi.object({
    cpf: Joi.string().alphanum().min(11).max(11).required(),
    phone: Joi.string().alphanum().min(10).max(11).required(),
    name: Joi.string().min(1).required(),
    birthday: extendedJoi.date().format("YYYY-MM-DD").required(),
  });

  try {
    const value = await schema.validateAsync(req.body);
    const { cpf, phone, name, birthday } = value;
    const result = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );

    if (result.rows[0]) {
      return res.sendStatus(409);
    }

    await connection.query(
      "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);",
      [name, phone, cpf, birthday]
    );
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- ROTA DE TESTE ------------------------- (APAGAR DEPOIS)

app.get("/", (req, res) => {
  res.send("Testandoooooo");
});

//------------------------- PORTA DO SERVIDOR -------------------------

app.listen(4000, () => {
  console.log("Server running on port 4000!!!!");
});
