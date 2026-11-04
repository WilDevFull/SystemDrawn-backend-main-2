const { Router } = require('express');
const agendamentoPiercingController =
  require('../controllers/agendamentoPiercing.controller');

const {
  authenticate,
} = require('../middlewares/auth.middleware');

const router = Router();

router.post(
  '/',
  authenticate,
  agendamentoPiercingController.criar
);

router.get(
  '/',
  authenticate,
  agendamentoPiercingController.listar
);

router.get(
  '/proximos',
  authenticate,
  agendamentoPiercingController.listarProximos
);

router.get(
  '/historico',
  authenticate,
  agendamentoPiercingController.listarHistorico
);

router.get(
  '/:id',
  authenticate,
  agendamentoPiercingController.buscarPorId
);

router.put(
  '/:id',
  authenticate,
  agendamentoPiercingController.atualizar
);

router.delete(
  '/:id',
  authenticate,
  agendamentoPiercingController.remover
);

module.exports = router;