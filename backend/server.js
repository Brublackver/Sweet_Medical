import app from "./app.js";

const port = process.env.PORT || 3000;
const host = 'localhost'

app.listen(port, host, () => {
  console.log(`🚀 Servidor corriendo en http://${host}:${port}`);
});
