const {
  hojeEmSaoPaulo,
  agoraEmSaoPaulo,
  dataHoraEmSaoPaulo,
  paraDataIso,
  paraHorarioCurto,
  formatarDataBrasileira,
} = require("../src/utils/data.util");

describe("data.util", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("deve usar o dia de São Paulo mesmo quando em Londres já é o dia seguinte", () => {
    jest.useFakeTimers({ now: new Date("2026-10-27T02:30:00Z") });

    expect(hojeEmSaoPaulo()).toBe("2026-10-26");
    expect(agoraEmSaoPaulo()).toBe("2026-10-26 23:30");
  });

  it("deve converter um instante para data e hora de São Paulo", () => {
    expect(dataHoraEmSaoPaulo(new Date("2026-11-05T18:00:00Z"))).toBe("2026-11-05 15:00");
  });

  it("deve transformar a data do banco em AAAA-MM-DD", () => {
    expect(paraDataIso(new Date(2026, 9, 27))).toBe("2026-10-27");
    expect(paraDataIso("2026-10-27")).toBe("2026-10-27");
  });

  it("deve mostrar o horário só com hora e minuto", () => {
    expect(paraHorarioCurto("15:00:00")).toBe("15:00");
    expect(paraHorarioCurto("09:30")).toBe("09:30");
  });

  it("deve formatar a data no padrão brasileiro", () => {
    expect(formatarDataBrasileira("2026-11-05")).toBe("05/11/2026");
  });
});