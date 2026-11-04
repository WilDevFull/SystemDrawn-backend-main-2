const express = require('express');
const router = express.Router();

const simulacaoController = require('../controllers/simulacao.controller');

router.post('/', simulacaoController.simularTatuagem);
router.post('/texto', simulacaoController.simularTatuagemPorTexto);

module.exports = router;
