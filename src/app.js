import express from "express";
import cors from "cors";
import pg from "pg";
import Joi from "joi";
import JoiDate from "@joi/date";
import dayjs from "dayjs";

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
  console.log(name);

  try {
    if (name !== undefined) {
      const result = await connection.query(
        `
        SELECT games.*, categories.name AS "categoryName" 
        FROM games JOIN categories
        ON games."categoryId" = categories.id
        WHERE games.name ILIKE $1`,
        [name + "%"]
      );
      res.send(result.rows);
    } else {
      const result = await connection.query(`
        SELECT games.*, categories.name AS "categoryName" 
        FROM games JOIN categories
        ON games."categoryId" = categories.id`);
      res.send(result.rows);
    }
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

  try {
    if (cpf) {
      const result = await connection.query(
        `SELECT * FROM customers WHERE customers.cpf ILIKE $1`,
        [cpf + "%"]
      );
      res.send(result.rows);
    } else {
      const result = await connection.query(`SELECT * FROM customers`);
      res.send(result.rows);
    }
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
    res.send(result.rows[0]);
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

//------------------------- EDITAR CLIENTES -------------------------

app.put("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const extendedJoi = Joi.extend(JoiDate);

  const schema = Joi.object({
    cpf: Joi.string().alphanum().min(11).max(11).required(),
    phone: Joi.string().alphanum().min(10).max(11).required(),
    name: Joi.string().min(1).required(),
    birthday: extendedJoi.date().format("YYYY-MM-DD").required(),
  });

  try {
    const value = await schema.validateAsync(req.body);
    const { name, phone, cpf, birthday } = value;

    const resultId = await connection.query(
      "SELECT * from customers WHERE id = $1",
      [id]
    );
    if (resultId.rows.length === 0) {
      return res.sendStatus(404);
    }

    await connection.query(
      `UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`,
      [name, phone, cpf, birthday, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- LISTAR ALUGUEL -------------------------

app.get("/rentals", async (req, res) => {
  const { customerId, gameId } = req.query;
  const rentalsQuery = `
      SELECT rentals.*, customers.id AS "idCustomer", customers.name,
      games.id AS "idGame", games.name AS "gameName", games."categoryId", categories.name AS "categoryName"
      FROM rentals 
      JOIN customers
      ON rentals."customerId" = customers.id
      JOIN games
      ON rentals."gameId" = games.id
      JOIN categories
      ON games."categoryId" = categories.id
  `;

  try {
    if (customerId) {
      const customer = await connection.query(
        `
          ${rentalsQuery} WHERE rentals."customerId" = $1
        `,
        [customerId]
      );
      res.send(customer.rows[0]);
      return;
    }

    if (gameId) {
      const game = await connection.query(
        `
          ${rentalsQuery} WHERE rentals."gameId" = $1
        `,
        [gameId]
      );
      res.send(game.rows[0]);
      return;
    }

    const result = await connection.query(rentalsQuery);
    res.send(
      result.rows.map((r) => {
        return {
          id: r.id,
          customerId: r.customerId,
          gameId: r.gameId,
          rentDate: r.rentDate,
          daysRented: r.daysRented,
          returnDate: r.returnDate,
          originalPrice: r.originalPrice,
          delayFee: r.delayFee,
          customer: {
            id: r.idCustomer,
            name: r.name,
          },
          game: {
            id: r.idGame,
            name: r.gameName,
            categoryId: r.categoryId,
            categoryName: r.categoryName,
          },
        };
      })
    );
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- INSERIR ALUGUEL -------------------------

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  const rentDate = dayjs().format("YYYY-MM-DD");
  const returnDate = null;
  const delayFee = null;

  try {
    const price = await connection.query(`SELECT * FROM games WHERE id = $1`, [
      gameId,
    ]);
    const originalPrice = price.rows[0].pricePerDay * daysRented;

    const customer = await connection.query(
      `SELECT * FROM customers WHERE id =$1`,
      [customerId]
    );
    if (customer.rows.length === 0) {
      return res.sendStatus(400);
    }

    const game = await connection.query(`SELECT * FROM games WHERE id = $1`, [
      gameId,
    ]);
    if (game.rows.length === 0) {
      return res.sendStatus(400);
    }

    /*
      verificar se existem jogos disponiveis (pedido de alugueis acima da quantidade de jogos em estoque)
      se nao tiver disponivel -> return status 400
    */

    const result = await connection.query(
      `INSERT INTO rentals 
        ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customerId,
        gameId,
        rentDate,
        daysRented,
        returnDate,
        originalPrice,
        delayFee,
      ]
    );

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

//------------------------- FINALIZAR ALUGUEL -------------------------

app.post("/rentals/:id/return", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await connection.query(
      `SELECT * FROM rentals WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }

    if (result.rows[0].returnDate !== null) {
      return res.sendStatus(400);
    }

    let { daysRented, rentDate, returnDate, delayFee } = result.rows[0];

    const day = 24; // 24 hours per day
    const hour = 60; // 60 minutes per hour
    const minute = 60; // 60 seconds per minute
    const millisecond = 1000; // 1000 milliseconds per second
    const millisecondsPerDay = day * hour * minute * millisecond; // 86.400.000
    const millisecondsRentPeriod = daysRented * millisecondsPerDay;

    returnDate = dayjs().format("YYYY-MM-DD");

    const millisecondsReturnPeriod =
      new Date(returnDate).valueOf() - new Date(rentDate).valueOf();

    const millisecondsCalc = millisecondsRentPeriod - millisecondsReturnPeriod;

    if (millisecondsCalc >= 0) {
      delayFee = 0;
    } else {
      const pricePerDay = originalPrice / daysRented;
      delayFee = pricePerDay * (-millisecondsCalc / miliSecondsOneDay);
    }

    await connection.query(
      `
            UPDATE rentals
            SET "returnDate" = $1, "delayFee" = $2
            WHERE id = $3`,
      [returnDate, delayFee, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.log(err.message);
    res.sendStatus(500);
  }
});

//------------------------- APAGAR ALUGUEL -------------------------

app.delete("/rentals/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await connection.query(
      `SELECT * FROM rentals WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }

    if (result.rows[0].returnDate !== null) {
      return res.sendStatus(400);
    }

    await connection.query(`DELETE FROM rentals WHERE id = $1`, [id]);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

//------------------------- PORTA DO SERVIDOR -------------------------

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
