const { Router } = require('express');
const agendamentoController = require('../controllers/agendamentoController'); 

const router = Router();

router.post("/", agendamentoController.criarAgendamento);
router.get("/", agendamentoController.listarAgendamentos);
router.get("/:id", agendamentoController.obterAgendamento);
router.put("/:id", agendamentoController.atualizarAgendamento);
router.delete("/:id", agendamentoController.removerAgendamento);

module.exports = router;