const validarNomeCompleto = (nome) => {
  if (!nome || typeof nome !== 'string') return false;
  const partes = nome.trim().split(/\s+/);
  if (partes.length < 2) return false;
  const regexParteValida = /^[a-zA-ZÀ-ÿ]+$/;
  return partes.every(p => p.length >= 2 && regexParteValida.test(p));
};

const validarForcaSenha = (senha) => {
  if (!senha || typeof senha !== 'string') return false;
  if (senha.length < 8) return false;
  return /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);
};

module.exports = { validarNomeCompleto, validarForcaSenha };