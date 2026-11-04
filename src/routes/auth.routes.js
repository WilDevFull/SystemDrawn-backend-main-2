const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRecaptcha } = require('../middlewares/recaptcha.middleware');

const router = Router();

router.post('/check-cpf', authController.checkCpf);
router.post('/register', requireRecaptcha, authController.register);
router.post('/login', requireRecaptcha, authController.login);
router.post('/admin/login', requireRecaptcha, authController.loginAdmin);
router.get('/me', authenticate, authController.getMe);

module.exports = router;