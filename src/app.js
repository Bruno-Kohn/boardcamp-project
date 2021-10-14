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

/*const query = connection.query("SELECT * FROM boardcamp");
query.then((result) => {
  console.log(result.rows);
});*/

//----- ROTA DE TESTE -----

app.get("/", (req, res) => {
  res.send("Testandoooooo");
});

//----- PORTA DO SERVIDOR -----

app.listen(4000, () => {
  console.log("Server running on port 4000!!!!");
});
