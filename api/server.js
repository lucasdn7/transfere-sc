const express = require('express');
const cors = require('cors');
const sheetsRoute = require('./sheets');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'], // URLs do frontend
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', sheetsRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API funcionando corretamente!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor da API rodando na porta ${PORT}`);
  console.log(`📊 Endpoint Google Sheets: http://localhost:${PORT}/api/sheets`);
});

module.exports = app;