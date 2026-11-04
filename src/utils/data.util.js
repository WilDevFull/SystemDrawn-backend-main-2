const FUSO_HORARIO = 'America/Sao_Paulo';

const dataEmSaoPaulo = (instante) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_HORARIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);

const horaEmSaoPaulo = (instante) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO_HORARIO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instante);

const dataHoraEmSaoPaulo = (instante) => `${dataEmSaoPaulo(instante)} ${horaEmSaoPaulo(instante)}`;

const hojeEmSaoPaulo = () => dataEmSaoPaulo(new Date());

const agoraEmSaoPaulo = () => dataHoraEmSaoPaulo(new Date());

const doisDigitos = (numero) => String(numero).padStart(2, '0');

const paraDataIso = (valor) => {
  if (valor instanceof Date) {
    return `${valor.getFullYear()}-${doisDigitos(valor.getMonth() + 1)}-${doisDigitos(valor.getDate())}`;
  }

  return String(valor).slice(0, 10);
};

const paraHorarioCurto = (valor) => String(valor).slice(0, 5);

const formatarDataBrasileira = (data) => data.split('-').reverse().join('/');

module.exports = {
  hojeEmSaoPaulo,
  agoraEmSaoPaulo,
  dataHoraEmSaoPaulo,
  paraDataIso,
  paraHorarioCurto,
  formatarDataBrasileira,
};