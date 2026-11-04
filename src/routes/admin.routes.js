const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/agenda', adminController.agendaDoDia);
router.get('/aprovacoes', adminController.aprovacoesPendentes);
router.patch('/agendamentos/:tipo/:id/aprovar', adminController.aprovarAgendamento);
router.patch('/agendamentos/:tipo/:id/recusar', adminController.recusarAgendamento);

module.exports = router;