const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const TAMANHO_CHAVE = 64;

const gerarHashSenha = async (senha) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const chave = await scrypt(senha, salt, TAMANHO_CHAVE);
  return `${salt}:${chave.toString('hex')}`;
};

const verificarSenha = async (senha, hashGuardado) => {
  if (!senha || typeof hashGuardado !== 'string' || !hashGuardado.includes(':')) return false;

  const [salt, chaveGuardada] = hashGuardado.split(':');
  const chaveGuardadaBuffer = Buffer.from(chaveGuardada, 'hex');

  if (chaveGuardadaBuffer.length !== TAMANHO_CHAVE) return false;

  const chave = await scrypt(senha, salt, TAMANHO_CHAVE);
  return crypto.timingSafeEqual(chaveGuardadaBuffer, chave);
};

module.exports = { gerarHashSenha, verificarSenha };