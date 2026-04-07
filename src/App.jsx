import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { cargarPresupuesto, guardarPresupuesto } from "./presupuestoDb";

const EMAIL_ADRI = "adri12gg@gmail.com";
const EMAIL_GISELA = "mateogisela05@gmail.com";

function puedeEditarTipo(email, tipo) {
  const e = (email || "").toLowerCase();

  if (tipo === "familiar") return true;
  if (tipo === "adri") return e === EMAIL_ADRI;
  if (tipo === "gisela") return e === EMAIL_GISELA;

  return false;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const AÑO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth();

const CATEGORIAS_FAMILIAR = {
  ingresos: ["Adri","Gisela","Otros ingresos"],
  gastos: ["Vivienda","Agua","Luz","Supermercado","Seguros (hogar, vida)","Teléfono (fibra + móvil)","Alarma","Restaurante","Ropa","Basuras","IBI","Otros"]
};

const CATEGORIAS_ADRI = {
  ingresos: ["Adri","Otros ingresos"],
  gastos: ["Vivienda","Coche seguro","Gasolina coche","Seguro salud Adeslas","PS5","Netflix","Ocio","Spotify","Ahorro mensual","Inversión","Otros"]
};

const CATEGORIAS_GISELA = {
  ingresos: ["Gisela","Otros ingresos"],
  gastos: ["Vivienda","Coche seguro","Préstamo","Gasolina coche","Seguro salud Adeslas","Amazon","Spotify","iPad","Otros"]
};

const BASE_PRESUPUESTOS = {
  familiar: { label: "Familiar", icon: "🏠", cats: CATEGORIAS_FAMILIAR },
  adri: { label: "Adri", icon: "👤", cats: CATEGORIAS_ADRI },
  gisela: { label: "Gisela", icon: "👤", cats: CATEGORIAS_GISELA }
};

const STORAGE_KEY = "presupuesto_familiar_v1";

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#eab308",
  "#06b6d4",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#84cc16",
  "#f43f5e",
  "#64748b"
];

const ICONOS_CATEGORIA = {
  "Adri": "👤",
  "Gisela": "👤",
  "Otros ingresos": "💼",
  "Vivienda": "🏠",
  "Agua": "💧",
  "Luz": "💡",
  "Supermercado": "🛒",
  "Seguros (hogar, vida)": "🛡️",
  "Teléfono (fibra + móvil)": "📱",
  "Alarma": "🚨",
  "Restaurante": "🍽️",
  "Ropa": "👕",
  "Basuras": "🗑️",
  "IBI": "📄",
  "Otros": "📦",
  "Coche seguro": "🚗",
  "Gasolina coche": "⛽",
  "Seguro salud Adeslas": "🏥",
  "PS5": "🎮",
  "Netflix": "📺",
  "Ocio": "🎉",
  "Spotify": "🎵",
  "Ahorro mensual": "💰",
  "Inversión": "📈",
  "Préstamo": "💳",
  "Amazon": "📦",
  "iPad": "📱"
};

const EMOJIS_SUGERIDOS = [
  "🏠","🚗","⛽","🛒","🍽️","🎮","🎵","📺","💡","💧","🧾","💳","💰","📈","🏥","🛡️","✈️","🐶","🏋️","🎁","📚","👕","📱","🧴","🍼","🛠️","📦","🎉","🍕","☕"
];

function getInitialData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return {
    2025: {
      familiar: {},
      adri: {},
      gisela: {}
    },
    _meta: {
      customCats: {
        familiar: { ingresos: [], gastos: [] },
        adri: { ingresos: [], gastos: [] },
        gisela: { ingresos: [], gastos: [] }
      }
    }
  };
}

function normalizarNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return 0;
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

function obtenerMovimientosDeValor(valorCategoria) {
  if (
    valorCategoria &&
    typeof valorCategoria === "object" &&
    !Array.isArray(valorCategoria) &&
    Array.isArray(valorCategoria.movimientos)
  ) {
    return valorCategoria.movimientos;
  }
  return [];
}

function calcularValorCategoria(valorCategoria) {
  if (
    valorCategoria &&
    typeof valorCategoria === "object" &&
    !Array.isArray(valorCategoria) &&
    Array.isArray(valorCategoria.movimientos)
  ) {
    return valorCategoria.movimientos.reduce(
      (acc, mov) => acc + normalizarNumero(mov?.importe),
      0
    );
  }

  return normalizarNumero(valorCategoria);
}

function asegurarMeta(data) {
  if (!data._meta) data._meta = {};
  if (!data._meta.customCats) {
    data._meta.customCats = {
      familiar: { ingresos: [], gastos: [] },
      adri: { ingresos: [], gastos: [] },
      gisela: { ingresos: [], gastos: [] }
    };
  }

  for (const tipo of ["familiar", "adri", "gisela"]) {
    if (!data._meta.customCats[tipo]) {
      data._meta.customCats[tipo] = { ingresos: [], gastos: [] };
    }
    if (!Array.isArray(data._meta.customCats[tipo].ingresos)) {
      data._meta.customCats[tipo].ingresos = [];
    }
    if (!Array.isArray(data._meta.customCats[tipo].gastos)) {
      data._meta.customCats[tipo].gastos = [];
    }
  }

  return data;
}

function getCustomCats(data, tipo, seccion) {
  return data?._meta?.customCats?.[tipo]?.[seccion] || [];
}

function getAllCats(data, tipo, seccion) {
  const base = BASE_PRESUPUESTOS[tipo].cats[seccion] || [];
  const custom = getCustomCats(data, tipo, seccion).map((x) => x.name);
  return [...base, ...custom];
}

function getEmojiCategoria(data, tipo, seccion, cat) {
  const custom = getCustomCats(data, tipo, seccion).find((x) => x.name === cat);
  if (custom?.emoji) return custom.emoji;
  return ICONOS_CATEGORIA[cat] || "•";
}

function calcTotales(data, tipo, año, mes) {
  const ingCats = getAllCats(data, tipo, "ingresos");
  const gasCats = getAllCats(data, tipo, "gastos");
  const mesData = data?.[año]?.[tipo]?.[mes] || {};

  const ing = ingCats.reduce((s, c) => {
    return s + calcularValorCategoria(mesData.ingresos?.[c]);
  }, 0);

  const gas = gasCats.reduce((s, c) => {
    return s + calcularValorCategoria(mesData.gastos?.[c]);
  }, 0);

  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function calcAnual(data, tipo, año) {
  let ing = 0;
  let gas = 0;

  for (let m = 0; m < 12; m++) {
    const t = calcTotales(data, tipo, año, m);
    ing += t.ingresos;
    gas += t.gastos;
  }

  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function calcCategoriaAnual(data, tipo, año, seccion) {
  const categorias = getAllCats(data, tipo, seccion);
  const resultado = categorias.map((cat) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const valor = data?.[año]?.[tipo]?.[m]?.[seccion]?.[cat];
      total += calcularValorCategoria(valor);
    }
    return { categoria: cat, total };
  });

  return resultado.sort((a, b) => b.total - a.total);
}

function resumirTopCategorias(items, topN = 5) {
  const positivas = items.filter((x) => x.total > 0);
  const top = positivas.slice(0, topN);
  const resto = positivas.slice(topN);
  const totalResto = resto.reduce((acc, x) => acc + x.total, 0);

  if (totalResto > 0) {
    top.push({ categoria: "Otros", total: totalResto });
  }

  return top;
}

function fmtDisplay(n) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
}

function fmtPct(n) {
  return `${(Number(n) || 0).toFixed(1).replace(".", ",")}%`;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + (r * Math.cos(angleInRadians)),
    y: cy + (r * Math.sin(angleInRadians))
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

function DonutChart({ items, total, size = 220, strokeWidth = 28 }) {
  if (!items.length || total <= 0) {
    return (
      <div
        style={{
          height: size,
          display: "grid",
          placeItems: "center",
          color: "#94a3b8",
          fontSize: 14
        }}
      >
        Sin datos suficientes
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  let currentAngle = 0;

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />

        {items.map((item, index) => {
          const angle = (item.total / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle += angle;

          if (angle <= 0) return null;

          return (
            <path
              key={item.categoria}
              d={describeArc(center, center, radius, startAngle, endAngle)}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          );
        })}

        <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="#0f172a" />

        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="12"
          fontWeight="600"
        >
          Total gasto
        </text>
        <text
          x="50%"
          y="57%"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="16"
          fontWeight="700"
        >
          {Math.round(total)}€
        </text>
      </svg>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [año, setAño] = useState(AÑO_ACTUAL);
  const [mes, setMes] = useState(MES_ACTUAL);
  const [tab, setTab] = useState("familiar");
  const [vista, setVista] = useState("mes");
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [movFecha, setMovFecha] = useState(hoyISO());
  const [movNota, setMovNota] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("gasto");
  const [errorCarga, setErrorCarga] = useState("");
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );
  const [notaMesInput, setNotaMesInput] = useState("");

  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [seccionNuevaCategoria, setSeccionNuevaCategoria] = useState("gastos");
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [emojiNuevaCategoria, setEmojiNuevaCategoria] = useState("📦");

  const emailActual = (user?.email || "").toLowerCase();
  const puedeEditarTabActual = puedeEditarTipo(emailActual, tab);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setData(null);
        setErrorCarga("");
        return;
      }

      try {
        const remoto = await cargarPresupuesto();
        const inicial = asegurarMeta(remoto || getInitialData());
        setData(inicial);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
        } catch (e) {}
      } catch (e) {
        console.error("Error cargando presupuesto compartido:", e);
        setErrorCarga("No se pudo cargar la nube. Se ha cargado la copia local.");
        setData(asegurarMeta(getInitialData()));
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!data) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  useEffect(() => {
    if (!data || !user) return;

    const timer = setTimeout(() => {
      guardarPresupuesto(data).catch((e) => {
        console.error("Error guardando presupuesto:", e);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [data, user]);

  useEffect(() => {
    if (!data) return;
    const nota = data?.[año]?.[tab]?.[mes]?.notasMes || "";
    setNotaMesInput(nota);
  }, [data, año, mes, tab]);

  function asegurarRuta(next, tipo, seccion, cat) {
    asegurarMeta(next);
    if (!next[año]) next[año] = {};
    if (!next[año][tipo]) next[año][tipo] = {};
    if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {}, notasMes: "" };
    if (!next[año][tipo][mes].ingresos) next[año][tipo][mes].ingresos = {};
    if (!next[año][tipo][mes].gastos) next[año][tipo][mes].gastos = {};
    if (next[año][tipo][mes].notasMes === undefined) next[año][tipo][mes].notasMes = "";
    if (!next[año][tipo][mes][seccion]) next[año][tipo][mes][seccion] = {};
    if (next[año][tipo][mes][seccion][cat] === undefined) {
      next[año][tipo][mes][seccion][cat] = "";
    }
  }

  function asegurarRutaMes(next, tipo) {
    asegurarMeta(next);
    if (!next[año]) next[año] = {};
    if (!next[año][tipo]) next[año][tipo] = {};
    if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {}, notasMes: "" };
    if (!next[año][tipo][mes].ingresos) next[año][tipo][mes].ingresos = {};
    if (!next[año][tipo][mes].gastos) next[año][tipo][mes].gastos = {};
    if (next[año][tipo][mes].notasMes === undefined) next[año][tipo][mes].notasMes = "";
  }

  function getRawValor(tipo, seccion, cat) {
    return data?.[año]?.[tipo]?.[mes]?.[seccion]?.[cat];
  }

  function getValor(tipo, seccion, cat) {
    return calcularValorCategoria(getRawValor(tipo, seccion, cat));
  }

  function getMovimientos(tipo, seccion, cat) {
    return obtenerMovimientosDeValor(getRawValor(tipo, seccion, cat));
  }

  function setValorManual(tipo, seccion, cat, valor) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);
      next[año][tipo][mes][seccion][cat] = valor === "" ? "" : normalizarNumero(valor);
      return next;
    });
  }

  function setNotaMes(tipo, texto) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRutaMes(next, tipo);
      next[año][tipo][mes].notasMes = texto;
      return next;
    });
  }

  function convertirAMovimientosSiHaceFalta(tipo, seccion, cat) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);

      const actual = next[año][tipo][mes][seccion][cat];

      if (
        actual &&
        typeof actual === "object" &&
        !Array.isArray(actual) &&
        Array.isArray(actual.movimientos)
      ) {
        return next;
      }

      const numeroActual = normalizarNumero(actual);

      if (numeroActual === 0) {
        next[año][tipo][mes][seccion][cat] = { movimientos: [] };
      } else {
        next[año][tipo][mes][seccion][cat] = {
          movimientos: [
            {
              importe: numeroActual,
              fecha: hoyISO(),
              nota: "Importe inicial"
            }
          ]
        };
      }

      return next;
    });
  }

  function agregarMovimiento(tipo, seccion, cat, movimiento) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);

      const actual = next[año][tipo][mes][seccion][cat];

      if (
        !actual ||
        typeof actual !== "object" ||
        Array.isArray(actual) ||
        !Array.isArray(actual.movimientos)
      ) {
        const numeroActual = normalizarNumero(actual);
        next[año][tipo][mes][seccion][cat] = {
          movimientos: numeroActual !== 0
            ? [{
                importe: numeroActual,
                fecha: hoyISO(),
                nota: "Importe inicial"
              }]
            : []
        };
      }

      next[año][tipo][mes][seccion][cat].movimientos.push(movimiento);
      return next;
    });
  }

  function borrarMovimiento(tipo, seccion, cat, index) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const movimientos = next?.[año]?.[tipo]?.[mes]?.[seccion]?.[cat]?.movimientos;

      if (Array.isArray(movimientos)) {
        movimientos.splice(index, 1);
      }

      return next;
    });
  }

  function agregarCategoriaPersonalizada() {
    if (!puedeEditarTabActual) return;

    const nombre = nombreNuevaCategoria.trim();
    const emoji = emojiNuevaCategoria || "📦";

    if (!nombre) return;

    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);

      const yaExisteBase = BASE_PRESUPUESTOS[tab].cats[seccionNuevaCategoria].includes(nombre);
      const yaExisteCustom = getCustomCats(next, tab, seccionNuevaCategoria).some((x) => x.name.toLowerCase() === nombre.toLowerCase());

      if (yaExisteBase || yaExisteCustom) return next;

      next._meta.customCats[tab][seccionNuevaCategoria].push({
        name: nombre,
        emoji
      });

      return next;
    });

    setNombreNuevaCategoria("");
    setEmojiNuevaCategoria("📦");
    setSeccionNuevaCategoria("gastos");
    setModalCategoriaAbierto(false);
  }

  function abrirEdicion(tipo, seccion, cat) {
    if (!puedeEditarTipo(emailActual, tipo)) return;

    const val = getValor(tipo, seccion, cat);
    setEditando({ tipo, seccion, cat });
    setInputVal(val === 0 ? "" : String(val));
    setMovFecha(hoyISO());
    setMovNota("");
    setTipoMovimiento("gasto");
    setModalAbierto(true);
  }

  function guardarEdicionManual() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;

    setValorManual(editando.tipo, editando.seccion, editando.cat, inputVal);
    setModalAbierto(false);
    setEditando(null);
    setInputVal("");
    setMovNota("");
    setMovFecha(hoyISO());
    setTipoMovimiento("gasto");
  }

  function guardarNuevoMovimiento() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;

    const importeBase = normalizarNumero(inputVal);
    if (!inputVal || !Number.isFinite(importeBase)) return;

    const importe = tipoMovimiento === "abono"
      ? -Math.abs(importeBase)
      : Math.abs(importeBase);

    agregarMovimiento(editando.tipo, editando.seccion, editando.cat, {
      importe,
      fecha: movFecha || hoyISO(),
      nota: movNota.trim()
    });

    setInputVal("");
    setMovNota("");
    setMovFecha(hoyISO());
    setTipoMovimiento("gasto");
  }

  const cats = useMemo(() => {
    if (!data) {
      return { ingresos: [], gastos: [] };
    }
    return {
      ingresos: getAllCats(data, tab, "ingresos"),
      gastos: getAllCats(data, tab, "gastos")
    };
  }, [data, tab]);

  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#fff",
          display: "grid",
          placeItems: "center"
        }}
      >
        Cargando...
      </div>
    );
  }

  const totales = calcTotales(data, tab, año, mes);
  const totalesAnuales = calcAnual(data, tab, año);
  const disponibleColor = (n) => n >= 0 ? "#22c55e" : "#ef4444";

  const movimientosActuales = editando ? getMovimientos(editando.tipo, editando.seccion, editando.cat) : [];
  const rawEditado = editando ? getRawValor(editando.tipo, editando.seccion, editando.cat) : null;
  const usandoMovimientos = !!(
    rawEditado &&
    typeof rawEditado === "object" &&
    !Array.isArray(rawEditado) &&
    Array.isArray(rawEditado.movimientos)
  );

  const categoriasGastoAnual = calcCategoriaAnual(data, tab, año, "gastos");
  const totalGastoAnual = categoriasGastoAnual.reduce((acc, item) => acc + item.total, 0);
  const categoriasGrafica = resumirTopCategorias(categoriasGastoAnual, 5);
  const principalGasto = categoriasGastoAnual.find((x) => x.total > 0);

  const mesesConGasto = MESES.reduce((acc, _, i) => {
    const t = calcTotales(data, tab, año, i);
    return acc + (t.gastos > 0 ? 1 : 0);
  }, 0);

  const mediaMensualGasto = mesesConGasto > 0 ? totalGastoAnual / mesesConGasto : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#f1f5f9",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        maxWidth: isDesktop ? 1240 : 500,
        margin: "0 auto",
        paddingBottom: 90
      }}
    >
      <div
        style={{
          background: "radial-gradient(circle at top left, #22406b 0%, #0f172a 55%, #0b1220 100%)",
          padding: isDesktop ? "30px 28px 20px" : "22px 18px 16px",
          borderBottom: "1px solid #1e293b",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
              Presupuesto compartido
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#f8fafc", marginBottom: 4 }}>
              {BASE_PRESUPUESTOS[tab].icon} {BASE_PRESUPUESTOS[tab].label} {año}
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1" }}>
              {user?.email || "Sin usuario"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setAño((y) => y - 1)} style={btnSmall}>{año - 1}</button>
            <button onClick={() => setAño((y) => y + 1)} style={btnSmall}>{año + 1}</button>
          </div>
        </div>

        <div style={{ display: "flex", background: "#172033", borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {["mes", "anual"].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.2s",
                background: vista === v ? "#3b82f6" : "transparent",
                color: vista === v ? "#fff" : "#94a3b8"
              }}
            >
              {v === "mes" ? "📅 Mensual" : "📊 Anual"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: vista === "mes" ? 12 : 0 }}>
          {Object.entries(BASE_PRESUPUESTOS).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: "10px 6px",
                borderRadius: 12,
                border: "1px solid #243042",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: tab === key ? "#1d4ed8" : "#172033",
                color: tab === key ? "#fff" : "#94a3b8"
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {vista === "mes" && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {MESES.map((m, i) => (
              <button
                key={i}
                onClick={() => setMes(i)}
                style={{
                  flexShrink: 0,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: mes === i ? 700 : 500,
                  background: mes === i ? "#3b82f6" : "#172033",
                  color: mes === i ? "#fff" : "#94a3b8"
                }}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {errorCarga && (
        <div style={{ padding: "12px 16px 0" }}>
          <div
            style={{
              background: "#451a03",
              color: "#fde68a",
              border: "1px solid #92400e",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 12
            }}
          >
            {errorCarga}
          </div>
        </div>
      )}

      <div style={{ padding: isDesktop ? "18px 22px 0" : "14px 16px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr 1fr 1fr",
            gap: 10
          }}
        >
          {[
            { label: "Ingresos", val: vista === "mes" ? totales.ingresos : totalesAnuales.ingresos, color: "#22c55e", icon: "💰" },
            { label: "Gastos", val: vista === "mes" ? totales.gastos : totalesAnuales.gastos, color: "#f97316", icon: "💸" },
            {
              label: "Disponible",
              val: vista === "mes" ? totales.disponible : totalesAnuales.disponible,
              color: disponibleColor(vista === "mes" ? totales.disponible : totalesAnuales.disponible),
              icon: "📊"
            }
          ].map(({ label, val, color, icon }) => (
            <div
              key={label}
              style={{
                background: "linear-gradient(180deg, #172033 0%, #111827 100%)",
                borderRadius: 16,
                padding: isDesktop ? "20px 16px" : "14px 10px",
                textAlign: "center",
                border: `1px solid ${color}22`,
                boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
              </div>
              <div style={{ fontSize: isDesktop ? 20 : 15, fontWeight: 900, color }}>
                {Math.round(val)}€
              </div>
            </div>
          ))}
        </div>
      </div>

      {!puedeEditarTabActual && (
        <div style={{ padding: isDesktop ? "10px 22px 0" : "10px 16px 0" }}>
          <div
            style={{
              background: "#3f3f46",
              color: "#e4e4e7",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 12
            }}
          >
            Solo lectura. Esta sección pertenece al otro usuario.
          </div>
        </div>
      )}

      {vista === "anual" && (
        <div style={{ padding: isDesktop ? "20px 22px 0" : "16px 16px 0" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "1.1fr 0.9fr" : "1fr",
              gap: 16,
              alignItems: "start"
            }}
          >
            <div style={{ background: "#172033", borderRadius: 18, overflow: "hidden", border: "1px solid #243042" }}>
              <div style={{ padding: "14px 16px", background: "#172554", borderBottom: "1px solid #1e3a8a" }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>
                  Resumen Anual {año} — {BASE_PRESUPUESTOS[tab].label}
                </span>
              </div>

              {MESES.map((m, i) => {
                const t = calcTotales(data, tab, año, i);
                const hasDatos = t.ingresos > 0 || t.gastos > 0;

                return (
                  <div
                    key={i}
                    onClick={() => { setMes(i); setVista("mes"); }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 16px",
                      borderBottom: "1px solid #0f172a",
                      cursor: "pointer",
                      opacity: hasDatos ? 1 : 0.45,
                      background: mes === i ? "#1e3a5f22" : "transparent"
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, width: 80 }}>{m}</span>
                    <span style={{ fontSize: 12, color: "#22c55e" }}>{t.ingresos > 0 ? fmtDisplay(t.ingresos) : "—"}</span>
                    <span style={{ fontSize: 12, color: "#f97316" }}>{t.gastos > 0 ? fmtDisplay(t.gastos) : "—"}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: disponibleColor(t.disponible) }}>
                      {hasDatos ? fmtDisplay(t.disponible) : "—"}
                    </span>
                  </div>
                );
              })}

              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: "#0f172a" }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>TOTAL</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>{fmtDisplay(totalesAnuales.ingresos)}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#f97316" }}>{fmtDisplay(totalesAnuales.gastos)}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: disponibleColor(totalesAnuales.disponible) }}>
                  {fmtDisplay(totalesAnuales.disponible)}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "#172033", borderRadius: 18, padding: "16px", border: "1px solid #243042" }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>
                  Distribución de gastos anuales
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                    justifyItems: "center"
                  }}
                >
                  <DonutChart items={categoriasGrafica} total={totalGastoAnual} />

                  <div style={{ width: "100%", marginTop: 6 }}>
                    {categoriasGrafica.map((item, index) => {
                      const pct = totalGastoAnual > 0 ? (item.total / totalGastoAnual) * 100 : 0;
                      return (
                        <div
                          key={item.categoria}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 0",
                            borderBottom: "1px solid #0f172a"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: CHART_COLORS[index % CHART_COLORS.length],
                                flexShrink: 0
                              }}
                            />
                            <span style={{ fontSize: 13, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.categoria}
                            </span>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>{fmtDisplay(item.total)}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtPct(pct)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                  gap: 12
                }}
              >
                <div style={{ background: "#172033", borderRadius: 18, padding: "16px", border: "1px solid #243042" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Mayor gasto</div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    {principalGasto ? principalGasto.categoria : "—"}
                  </div>
                  <div style={{ fontSize: 14, color: "#f97316", marginTop: 6 }}>
                    {principalGasto ? fmtDisplay(principalGasto.total) : "—"}
                  </div>
                </div>

                <div style={{ background: "#172033", borderRadius: 18, padding: "16px", border: "1px solid #243042" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                    {mesesConGasto <= 1 ? "Meses con gasto" : "Media meses con gasto"}
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 900 }}>
                    {mesesConGasto <= 1 ? mesesConGasto : fmtDisplay(mediaMensualGasto)}
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                    {mesesConGasto <= 1
                      ? "Aún no hay suficiente histórico para una media útil"
                      : `Calculado sobre ${mesesConGasto} meses con gasto`}
                  </div>
                </div>
              </div>

              <div style={{ background: "#172033", borderRadius: 18, padding: "16px", border: "1px solid #243042" }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
                  Ranking de gastos por categoría
                </div>

                {categoriasGastoAnual.filter((x) => x.total > 0).length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>
                    Todavía no hay gastos suficientes para mostrar el ranking.
                  </div>
                ) : (
                  categoriasGastoAnual.filter((x) => x.total > 0).map((item, index) => {
                    const pct = totalGastoAnual > 0 ? (item.total / totalGastoAnual) * 100 : 0;

                    return (
                      <div
                        key={item.categoria}
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px solid #0f172a"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                            {index + 1}. {item.categoria}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>
                            {fmtDisplay(item.total)}
                          </div>
                        </div>

                        <div style={{ marginTop: 7 }}>
                          <div
                            style={{
                              width: "100%",
                              height: 8,
                              background: "#0f172a",
                              borderRadius: 999,
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: CHART_COLORS[index % CHART_COLORS.length],
                                borderRadius: 999
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                          {fmtPct(pct)} del gasto anual
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {vista === "mes" && (
        <div style={{ padding: isDesktop ? "20px 22px 0" : "16px 16px 0" }}>
          {puedeEditarTabActual && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                onClick={() => setModalCategoriaAbierto(true)}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 14px",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.25)"
                }}
              >
                ➕ Añadir apartado
              </button>
            </div>
          )}

          <Seccion
            titulo="💰 Ingresos"
            color="#22c55e"
            cats={cats.ingresos}
            seccion="ingresos"
            tipo={tab}
            getValor={getValor}
            onTap={abrirEdicion}
            total={totales.ingresos}
            editable={puedeEditarTabActual}
            data={data}
          />

          <Seccion
            titulo="💸 Gastos"
            color="#f97316"
            cats={cats.gastos}
            seccion="gastos"
            tipo={tab}
            getValor={getValor}
            onTap={abrirEdicion}
            total={totales.gastos}
            editable={puedeEditarTabActual}
            data={data}
          />

          <div
            style={{
              background: "#172033",
              border: "1px solid #243042",
              borderRadius: 18,
              padding: "16px",
              marginBottom: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>📝</span>
              <div style={{ fontSize: 15, fontWeight: 900 }}>Notas del mes</div>
            </div>

            <textarea
              value={notaMesInput}
              onChange={(e) => {
                setNotaMesInput(e.target.value);
                if (puedeEditarTabActual) setNotaMes(tab, e.target.value);
              }}
              readOnly={!puedeEditarTabActual}
              placeholder={
                puedeEditarTabActual
                  ? "Ej: Adeslas descontado en nómina: 62,40 €. No sumarlo como gasto aparte."
                  : "Sin notas"
              }
              style={{
                width: "100%",
                minHeight: 110,
                resize: "vertical",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #334155",
                background: puedeEditarTabActual ? "#0f172a" : "#111827",
                color: "#f8fafc",
                boxSizing: "border-box",
                outline: "none",
                fontSize: 14,
                lineHeight: 1.45
              }}
            />

            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
              Estas notas son informativas y no alteran ingresos ni gastos.
            </div>
          </div>

          <div
            style={{
              background: totales.disponible >= 0
                ? "linear-gradient(135deg, #052e16 0%, #14532d 100%)"
                : "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)",
              border: `1px solid ${totales.disponible >= 0 ? "#22c55e" : "#ef4444"}44`,
              borderRadius: 18,
              padding: "18px 20px",
              marginBottom: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4
                }}
              >
                {MESES[mes]} — Dinero disponible
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#fff"
                }}
              >
                {fmtDisplay(totales.disponible)}
              </div>
            </div>

            <div style={{ fontSize: 34 }}>
              {totales.disponible >= 0 ? "✅" : "⚠️"}
            </div>
          </div>
        </div>
      )}

      {modalCategoriaAbierto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000cc",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setModalCategoriaAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#1e293b",
              borderRadius: 20,
              padding: "22px 18px",
              border: "1px solid #334155"
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
              Añadir apartado
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
              Se guardará para {BASE_PRESUPUESTOS[tab].label} y estará disponible en todos los meses.
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Sección</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={() => setSeccionNuevaCategoria("gastos")}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: seccionNuevaCategoria === "gastos" ? "#f97316" : "#334155",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  💸 Gasto
                </button>
                <button
                  onClick={() => setSeccionNuevaCategoria("ingresos")}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: seccionNuevaCategoria === "ingresos" ? "#22c55e" : "#334155",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  💰 Ingreso
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Nombre</div>
              <input
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                placeholder="Ej. Gym, Dentista, Mascota..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#fff",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Emoji</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {EMOJIS_SUGERIDOS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEmojiNuevaCategoria(emoji)}
                    style={{
                      flexShrink: 0,
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      border: emojiNuevaCategoria === emoji ? "2px solid #3b82f6" : "1px solid #334155",
                      background: "#111827",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 20
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setModalCategoriaAbierto(false)}
                style={{
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: "#334155",
                  color: "#cbd5e1",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={agregarCategoriaPersonalizada}
                style={{
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Guardar apartado
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && editando && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000cc",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setModalAbierto(false)}
        >
          <div
            style={{
              background: "#1e293b",
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 40px",
              border: "1px solid #334155"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: "#475569", borderRadius: 2, margin: "0 auto 20px" }} />

            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {editando.seccion === "ingresos" ? "Ingreso" : "Gasto"} · {MESES[mes]} {año}
            </div>

            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
              {getEmojiCategoria(data, editando.tipo, editando.seccion, editando.cat)} {editando.cat}
            </div>

            <div style={{ fontSize: 14, color: "#93c5fd", marginBottom: 20 }}>
              Total actual: {fmtDisplay(getValor(editando.tipo, editando.seccion, editando.cat))}
            </div>

            {!usandoMovimientos && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => convertirAMovimientosSiHaceFalta(editando.tipo, editando.seccion, editando.cat)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    background: "#334155",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Pasar a modo movimientos
                </button>

                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                  Así podrás añadir varios importes que se suman o restan automáticamente.
                </div>
              </div>
            )}

            {usandoMovimientos ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
                  Añadir movimiento
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 12
                  }}
                >
                  <button
                    onClick={() => setTipoMovimiento("gasto")}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: tipoMovimiento === "gasto" ? "#3b82f6" : "#334155",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Gasto
                  </button>

                  <button
                    onClick={() => setTipoMovimiento("abono")}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: tipoMovimiento === "abono" ? "#22c55e" : "#334155",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Abono / devolución
                  </button>
                </div>

                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ej. 50"
                    style={{
                      width: "100%",
                      padding: "14px 50px 14px 14px",
                      fontSize: 18,
                      fontWeight: 700,
                      background: "#0f172a",
                      border: "2px solid #3b82f6",
                      borderRadius: 12,
                      color: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#64748b" }}>€</span>
                </div>

                <input
                  type="date"
                  value={movFecha}
                  onChange={(e) => setMovFecha(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    border: "1px solid #475569",
                    background: "#0f172a",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />

                <input
                  type="text"
                  value={movNota}
                  onChange={(e) => setMovNota(e.target.value)}
                  placeholder="Nota opcional: Repsol, BP..."
                  style={{
                    width: "100%",
                    padding: 12,
                    marginBottom: 14,
                    borderRadius: 10,
                    border: "1px solid #475569",
                    background: "#0f172a",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />

                <button
                  onClick={guardarNuevoMovimiento}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    background: tipoMovimiento === "abono" ? "#22c55e" : "#3b82f6",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    marginBottom: 20
                  }}
                >
                  {tipoMovimiento === "abono" ? "Añadir abono" : "Añadir gasto"}
                </button>

                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
                  Historial
                </div>

                {movimientosActuales.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                    Todavía no hay movimientos.
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    {movimientosActuales.map((mov, index) => (
                      <div
                        key={index}
                        style={{
                          background: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: 12,
                          padding: "12px 14px",
                          marginBottom: 10
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: normalizarNumero(mov.importe) >= 0 ? "#22c55e" : "#f87171" }}>
                              {fmtDisplay(normalizarNumero(mov.importe))}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                              {formatearFecha(mov.fecha)}{mov.nota ? ` · ${mov.nota}` : ""}
                            </div>
                          </div>

                          <button
                            onClick={() => borrarMovimiento(editando.tipo, editando.seccion, editando.cat, index)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#450a0a",
                              color: "#fecaca",
                              cursor: "pointer"
                            }}
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ position: "relative", marginBottom: 20 }}>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && guardarEdicionManual()}
                    placeholder="0,00"
                    style={{
                      width: "100%",
                      padding: "16px 50px 16px 16px",
                      fontSize: 20,
                      fontWeight: 700,
                      background: "#0f172a",
                      border: "2px solid #3b82f6",
                      borderRadius: 12,
                      color: "#f8fafc",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "#64748b" }}>€</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => setModalAbierto(false)}
                    style={{
                      padding: "14px",
                      borderRadius: 12,
                      border: "none",
                      background: "#334155",
                      color: "#94a3b8",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarEdicionManual}
                    style={{
                      padding: "14px",
                      borderRadius: 12,
                      border: "none",
                      background: "#3b82f6",
                      color: "#fff",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Guardar total
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Seccion({ titulo, color, cats, seccion, tipo, getValor, onTap, total, editable, data }) {
  const [abierta, setAbierta] = useState(true);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #172033 0%, #111827 100%)",
        borderRadius: 18,
        marginBottom: 16,
        overflow: "hidden",
        border: "1px solid #243042",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
      }}
    >
      <div
        onClick={() => setAbierta((a) => !a)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          cursor: "pointer",
          borderBottom: abierta ? "1px solid #243042" : "none"
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 15 }}>{titulo}</span>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color,
              background: `${color}18`,
              border: `1px solid ${color}30`,
              padding: "6px 10px",
              borderRadius: 999
            }}
          >
            {total.toFixed(2)}€
          </span>
          <span style={{ color: "#64748b", fontSize: 12 }}>{abierta ? "▲" : "▼"}</span>
        </div>
      </div>

      {abierta && (
        <div style={{ padding: "10px" }}>
          {cats.map((cat) => {
            const val = getValor(tipo, seccion, cat);
            const tieneValor = val !== "" && val !== 0;

            return (
              <div
                key={cat}
                onClick={() => editable && onTap(tipo, seccion, cat)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  marginBottom: 8,
                  borderRadius: 14,
                  border: "1px solid #223044",
                  background: tieneValor ? "#0f172a" : "#111827",
                  cursor: editable ? "pointer" : "default",
                  opacity: editable ? 1 : 0.75,
                  transition: "transform 0.15s, background 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      background: `${color}18`,
                      border: `1px solid ${color}26`,
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{getEmojiCategoria(data, tipo, seccion, cat)}</span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: tieneValor ? 800 : 600,
                        color: tieneValor ? "#f8fafc" : "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {cat}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {editable ? "Toca para editar o añadir movimientos" : "Solo lectura"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: tieneValor ? color : "#475569"
                    }}
                  >
                    {tieneValor ? `${parseFloat(val).toFixed(2)}€` : "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    {editable ? "✏️" : "🔒"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btnSmall = {
  padding: "7px 12px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#172033",
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer"
};
