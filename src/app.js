import express from 'express';
import cors from 'cors';

const app = express();

app.get("/", (req,res) => {
    res.send("Testando");
});

app.listen(4000, () => {
    console.log("Server running on port 4000!");
});