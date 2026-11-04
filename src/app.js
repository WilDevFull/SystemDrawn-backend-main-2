require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const agendamentoRoutes = require('./routes/agendamentoTatuagem.routes');
const agendamentoPiercingRoutes = require('./routes/agendamentoPiercing.routes');
const tiposPiercingRoutes = require('./routes/tiposPiercing.routes');
const joiaPiercingRoutes = require('./routes/joiaPiercing.routes');
const notificacoesRoutes = require('./routes/notificacoes');
const estilosTatuagemRoutes = require('./routes/estilosTatuagem.routes');
const simulacaoRoutes = require('./routes/simulacao.routes');
const adminRoutes = require('./routes/admin.routes');

const { authenticate } = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const db = require('./config/database');

const app = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SystemDrawn API está online.',
    env: process.env.NODE_ENV || 'development',
  });
});


app.get('/status', async (req, res) => {
  const uptimeSegundos = Math.floor(process.uptime());
  let banco = 'ok';
  let statusHttp = 200;

  try {
    await db.query('SELECT 1');
  } catch (erro) {
    banco = 'indisponível';
    statusHttp = 503;
  }

  res.status(statusHttp).json({
    success: statusHttp === 200,
    status: statusHttp === 200 ? 'ok' : 'degradado',
    uptime: uptimeSegundos,
    banco,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/auth', authRoutes);
app.use('/agendamentos-tatuagem', agendamentoRoutes);
app.use('/agendamentos-piercing', agendamentoPiercingRoutes);
app.use('/tipos-piercing', tiposPiercingRoutes);
app.use('/joias-piercing', joiaPiercingRoutes);
app.use('/notificacoes', authenticate, notificacoesRoutes);
app.use('/estilos-tatuagem', estilosTatuagemRoutes);
app.use('/simulacao', authenticate, simulacaoRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`[SystemDrawn] Servidor rodando na porta ${PORT}`);
  });

  
  
  server.headersTimeout = 20 * 1000;
  server.requestTimeout = 30 * 1000;
  server.keepAliveTimeout = 10 * 1000;
  server.timeout = 160 * 1000;

  

}

module.exports = app;