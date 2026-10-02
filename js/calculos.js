const Calc = {
  num(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  },

  eur(n) {
    return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  },

  conIva(base, ivaPct) {
    return base * (1 + ivaPct / 100);
  },

  // Cuota mensual con sistema francés
  cuota(capital, interesAnual, anios) {
    const n = Math.round(anios * 12);
    if (capital <= 0 || n <= 0) return 0;
    const i = interesAnual / 100 / 12;
    if (i === 0) return capital / n;
    return capital * i / (1 - Math.pow(1 + i, -n));
  },

  amortizacion(capital, interesAnual, anios, inicio) {
    const n = Math.round(anios * 12);
    const cuota = this.cuota(capital, interesAnual, anios);
    const i = interesAnual / 100 / 12;
    const filas = [];
    let pendiente = capital;

    for (let k = 1; k <= n && capital > 0; k++) {
      const intereses = pendiente * i;
      let capitalMes = cuota - intereses;
      if (k === n) capitalMes = pendiente;
      pendiente = Math.max(0, pendiente - capitalMes);

      let fecha = "";
      if (inicio) {
        const d = new Date(inicio + "T00:00:00");
        d.setMonth(d.getMonth() + k - 1);
        fecha = d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
      }
      filas.push({ k, fecha, cuota: intereses + capitalMes, intereses, capital: capitalMes, pendiente });
    }
    return { cuota, filas };
  }
};
