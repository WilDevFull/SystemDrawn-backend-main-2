const { Router } = require('express');
const controller = require('../controllers/joiaPiercing.controller');

const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', authenticate, controller.criar);

router.get('/', authenticate, controller.listar);

router.get(
  '/tipo-piercing/:tipoPiercingId',
  authenticate,
  controller.listarPorTipoPiercing
);

router.get('/:id', authenticate, controller.buscarPorId);

router.put('/:id', authenticate, controller.atualizar);

router.delete('/:id', authenticate, controller.remover);

module.exports = router;