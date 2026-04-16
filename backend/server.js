import app from "./app.js";

const puerto = process.env.PORT || 3000;

app.listen(puerto, () => {
  console.log("Sweet Medical API corriendo en puerto " + puerto);
});
