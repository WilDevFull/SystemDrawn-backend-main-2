const { Router } = require('express');
const estilosController =
require('../controllers/estilosTatuagem.controller');

const {
  authenticate,
} = require('../middlewares/auth.middleware');

const routes = Router();

routes.use(authenticate);

routes.post('/', estilosController.criar);
routes.get('/', estilosController.listar);
routes.get('/:id', estilosController.buscarPorId);
routes.put('/:id', estilosController.atualizar);
routes.delete('/:id', estilosController.remover);

module.exports = routes;