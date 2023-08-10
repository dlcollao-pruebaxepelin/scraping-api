const express = require('express');
const getLinksFromBase = require('./scrapers/blogScraper');

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  console.log(req.body);
  category = req.body.category;
  webhookUrl = req.body.webhook;
  try {
    const links = await getLinksFromBase(category, webhookUrl);
    res.status(200).json(links);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error al obtener los enlaces' });
  }
});

app.get('/', async (req, res) => {
  res.status(200).json({ "status": "bienvenido" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
