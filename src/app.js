import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());

//----- CONECTANDO O BANCO -----

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

//----- LISTAR CATEGORIAS -----

app.get("/categories", async (req, res) => {
  try {
    const result = await connection.query("SELECT * FROM categories");
    res.send(result.rows);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

//----- INSERIR CATEGORIAS -----

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  connection.query("INSERT INTO categories (name) VALUES ($1);", [name]);
});

//----- ROTA DE TESTE ----- (APAGAR DEPOIS)

app.get("/", (req, res) => {
  res.send("Testandoooooo");
});

//----- PORTA DO SERVIDOR -----

app.listen(4000, () => {
  console.log("Server running on port 4000!!!!");
});
