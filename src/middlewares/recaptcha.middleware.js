const { AppError } = require('../errors/AppError');

const SITEVERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const TIMEOUT_MS = 10 * 1000;

const verifyWithGoogle = async (secret, token) => {
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    return await response.json();
  } catch (error) {
    throw new AppError('Não foi possível verificar o reCAPTCHA agora. Tente novamente.', 503);
  }
};

const requireRecaptcha = async (req, res, next) => {
  try {
    const token = req.body.recaptchaToken;

    if (!token || typeof token !== 'string') {
      throw new AppError('Confirme que você não é um robô.', 400);
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();

    if (!secret) {
      throw new AppError('A verificação do reCAPTCHA não está configurada.', 500);
    }

    const result = await verifyWithGoogle(secret, token);

    if (result?.success !== true) {
      throw new AppError('Não foi possível confirmar que você não é um robô. Marque a caixinha de novo.', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireRecaptcha };
