const { Router } =
  require('express');

const notificacaoController =
  require(
    '../controllers/notificacaoController'
  );

const router = Router();

router.get(
  '/',
  notificacaoController.listar
);

router.get(
  '/nao-lidas',
  notificacaoController.listarNaoLidas
);

router.get(
  '/contador',
  notificacaoController.contarNaoLidas
);

router.patch(
  '/todas/lidas',
  notificacaoController.marcarTodasComoLidas
);

router.patch(
  '/:id/lida',
  notificacaoController.marcarComoLida
);

router.delete(
  '/:id',
  notificacaoController.remover
);

module.exports = router;
