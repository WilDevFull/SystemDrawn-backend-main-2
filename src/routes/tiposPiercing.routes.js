const { Router } = require('express');
const tiposPiercingController = require('../controllers/tiposPiercing.controller');

const {
  authenticate,
} = require('../middlewares/auth.middleware');

const routes = Router();

routes.use(authenticate);

routes.get('/', tiposPiercingController.getAll);
routes.get('/:id', tiposPiercingController.getById);
routes.post('/', tiposPiercingController.create);
routes.put('/:id', tiposPiercingController.update);
routes.delete('/:id', tiposPiercingController.delete);
module.exports = routes;