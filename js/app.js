const $ = (id) => document.getElementById(id);
const simples = ["planta", "bloque", "liquido", "ivaPiso", "familia", "sandra", "felipe",
  "sandraAhorro", "sandraSueldo", "felipeAhorro", "felipeSueldo",
  "hipImporte", "hipInteres", "hipAnios", "hipInicio"];
const pagoKeys = ["arras", "entrada", "resto"];

let hipAuto = true; // el importe de la hipoteca se calcula solo hasta que se edita a mano

function leer() {
  const data = { hipAuto, pagos: {} };
  simples.forEach((id) => (data[id] = $(id).value));
  pagoKeys.forEach((key) => {
    data.pagos[key] = {};
    document.querySelectorAll(`tr[data-pago="${key}"] input`).forEach((inp) => {
      data.pagos[key][inp.dataset.f] = inp.value;
    });
  });
  return data;
}

function restaurar() {
  const data = Storage3C.load();
  simples.forEach((id) => { if (data[id] !== undefined) $(id).value = data[id]; });
  Object.entries(data.pagos || {}).forEach(([key, campos]) => {
    Object.entries(campos).forEach(([f, v]) => {
      const inp = document.querySelector(`tr[data-pago="${key}"] [data-f="${f}"]`);
      if (inp) inp.value = v;
    });
  });
  if (data.hipAuto === false) hipAuto = false;
}

function setSigno(el, valor) {
  el.classList.toggle("pos", valor >= 0);
  el.classList.toggle("neg", valor < 0);
}

function actualizarResto(totalResto) {
  const N = 24;
  const cuota = totalResto / N;
  const sueldoS = Calc.num($("sandraSueldo").value);
  const sueldoF = Calc.num($("felipeSueldo").value);
  const inicio = document.querySelector('tr[data-pago="resto"] [data-f="fecha"]').value;
  // El pago se reparte a partes iguales entre los dos
  let acarreoS = Calc.num($("sandraAhorro").value);
  let acarreoF = Calc.num($("felipeAhorro").value);
  let pendiente = totalResto;
  let html = "";
  const clase = (v) => (v >= 0 ? "pos" : "neg");

  for (let k = 1; k <= N; k++) {
    acarreoS += sueldoS - cuota / 2;
    acarreoF += sueldoF - cuota / 2;
    pendiente = Math.max(0, pendiente - cuota);
    let fecha = "";
    if (inicio) {
      const d = new Date(inicio + "T00:00:00");
      d.setMonth(d.getMonth() + k - 1);
      fecha = d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
    }
    html += `<tr><td>${k}</td><td>${fecha}</td><td>${Calc.eur(cuota)}</td><td>${Calc.eur(sueldoS)}</td><td>${Calc.eur(sueldoF)}</td>
      <td class="${clase(acarreoS)}">${Calc.eur(acarreoS)}</td>
      <td class="${clase(acarreoF)}">${Calc.eur(acarreoF)}</td>
      <td class="${clase(acarreoS + acarreoF)}">${Calc.eur(acarreoS + acarreoF)}</td>
      <td>${Calc.eur(pendiente)}</td></tr>`;
  }
  $("restoCuota").textContent = Calc.eur(cuota);
  $("restoBody").innerHTML = html;
}

function actualizar() {
  const liquido = Calc.num($("liquido").value);
  const ivaPct = Calc.num($("ivaPiso").value);
  const ivaImp = liquido * ivaPct / 100;
  const totalPiso = liquido + ivaImp;
  $("ivaPisoImporte").textContent = Calc.eur(ivaImp);
  $("totalPiso").textContent = Calc.eur(totalPiso);

  // Pagos iniciales
  let totalPagos = 0;
  let pagadoBase = 0; // base (sin IVA) ya abonada en pagos anteriores
  let totalResto = 0;
  pagoKeys.forEach((key) => {
    const tr = document.querySelector(`tr[data-pago="${key}"]`);
    const campo = (f) => tr.querySelector(`[data-f="${f}"]`);
    let importe;
    if (key === "arras") {
      importe = Calc.num(campo("importe").value);
    } else {
      const base = key === "resto" ? Math.max(0, liquido - pagadoBase) : liquido;
      importe = base * Calc.num(campo("pct").value) / 100;
      tr.querySelector('[data-out="importe"]').textContent = Calc.eur(importe);
    }
    pagadoBase += importe;
    const total = Calc.conIva(importe, Calc.num(campo("iva").value));
    tr.querySelector('[data-out="total"]').textContent = Calc.eur(total);
    totalPagos += total;
    if (key === "resto") totalResto = total;
  });
  actualizarResto(totalResto);
  $("totalPagos").textContent = Calc.eur(totalPagos);

  // Origen del dinero
  const aportado = Calc.num($("familia").value) + Calc.num($("sandra").value) + Calc.num($("felipe").value);
  const dif = aportado - totalPagos;
  $("totalOrigen").textContent = Calc.eur(aportado);
  $("origenNecesario").textContent = Calc.eur(totalPagos);
  $("origenDifLabel").textContent = dif >= 0 ? "Sobrante" : "Falta";
  $("origenDif").textContent = Calc.eur(Math.abs(dif));
  setSigno($("origenDif"), dif);

  // Hipoteca
  if (hipAuto) $("hipImporte").value = Math.max(0, totalPiso - totalPagos).toFixed(2);
  const capital = Calc.num($("hipImporte").value);
  const { cuota, filas } = Calc.amortizacion(
    capital, Calc.num($("hipInteres").value), Calc.num($("hipAnios").value), $("hipInicio").value);
  const totalDevolver = cuota * filas.length;
  $("cuota").textContent = Calc.eur(cuota);
  $("totalDevolver").textContent = Calc.eur(totalDevolver);
  $("totalIntereses").textContent = Calc.eur(Math.max(0, totalDevolver - capital));

  $("amortBody").innerHTML = filas.map((f) =>
    `<tr${f.k % 12 === 0 ? ' class="year-end"' : ""}>
      <td>${f.k}</td><td>${f.fecha}</td><td>${Calc.eur(f.cuota)}</td>
      <td>${Calc.eur(f.intereses)}</td><td>${Calc.eur(f.capital)}</td><td>${Calc.eur(f.pendiente)}</td>
    </tr>`).join("");

  Storage3C.save(leer());
}

document.addEventListener("input", (e) => {
  if (e.target.id === "hipImporte") hipAuto = false;
  actualizar();
});

$("btnAuto").addEventListener("click", () => { hipAuto = true; actualizar(); });

$("btnReset").addEventListener("click", () => {
  if (confirm("¿Borrar todos los datos guardados?")) {
    Storage3C.clear();
    location.reload();
  }
});

restaurar();
actualizar();
