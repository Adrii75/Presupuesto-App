import { useState, useEffect } from "react";
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

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
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

const PRESUPUESTOS = {
  familiar: { label: "Familiar", icon: "🏠", cats: CATEGORIAS_FAMILIAR },
  adri: { label: "Adri", icon: "👤", cats: CATEGORIAS_ADRI },
  gisela: { label: "Gisela", icon: "👤", cats: CATEGORIAS_GISELA }
};

const STORAGE_KEY = "presupuesto_familiar_v1";

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

function calcTotales(data, tipo, año, mes) {
  const cats = PRESUPUESTOS[tipo].cats;
  const mesData = data?.[año]?.[tipo]?.[mes] || {};

  const ing = cats.ingresos.reduce((s, c) => {
    return s + calcularValorCategoria(mesData.ingresos?.[c]);
  }, 0);

  const gas = cats.gastos.reduce((s, c) => {
    return s + calcularValorCategoria(mesData.gastos?.[c]);
  }, 0);

  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function calcAnual(data, tipo, año) {
  let ing = 0, gas = 0;
  for (let m = 0; m < 12; m++) {
    const t = calcTotales(data, tipo, año, m);
    ing += t.ingresos;
    gas += t.gastos;
  }
  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function fmtDisplay(n) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
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
  const [errorCarga, setErrorCarga] = useState("");

  const emailActual = (user?.email || "").toLowerCase();
  const puedeEditarTabActual = puedeEditarTipo(emailActual, tab);

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
        const inicial = remoto || getInitialData();
        setData(inicial);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
        } catch (e) {}
      } catch (e) {
        console.error("Error cargando presupuesto compartido:", e);
        setErrorCarga("No se pudo cargar la nube. Se ha cargado la copia local.");
        setData(getInitialData());
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

  function asegurarRuta(next, tipo, seccion, cat) {
    if (!next[año]) next[año] = {};
    if (!next[año][tipo]) next[año][tipo] = {};
    if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {} };
    if (!next[año][tipo][mes][seccion]) next[año][tipo][mes][seccion] = {};
    if (next[año][tipo][mes][seccion][cat] === undefined) {
      next[año][tipo][mes][seccion][cat] = "";
    }
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

  function abrirEdicion(tipo, seccion, cat) {
    if (!puedeEditarTipo(emailActual, tipo)) return;

    const val = getValor(tipo, seccion, cat);
    setEditando({ tipo, seccion, cat });
    setInputVal(val === 0 ? "" : String(val));
    setMovFecha(hoyISO());
    setMovNota("");
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
  }

  function guardarNuevoMovimiento() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;

    const importe = normalizarNumero(inputVal);
    if (!inputVal || !Number.isFinite(importe)) return;

    agregarMovimiento(editando.tipo, editando.seccion, editando.cat, {
      importe,
      fecha: movFecha || hoyISO(),
      nota: movNota.trim()
    });

    setInputVal("");
    setMovNota("");
    setMovFecha(hoyISO());
  }

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
  const cats = PRESUPUESTOS[tab].cats;
  const disponibleColor = (n) => n >= 0 ? "#22c55e" : "#ef4444";
  const movimientosActuales = editando ? getMovimientos(editando.tipo, editando.seccion, editando.cat) : [];
  const usandoMovimientos = editando
    ? (
        getRawValor(editando.tipo, editando.seccion, editando.cat) &&
        typeof getRawValor(editando.tipo, editando.seccion, editando.cat) === "object" &&
        !Array.isArray(getRawValor(editando.tipo, editando.seccion, editando.cat)) &&
        Array.isArray(getRawValor(editando.tipo, editando.seccion, editando.cat).movimientos)
      )
    : false;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f1f5f9",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        maxWidth: 480,
        margin: "0 auto",
        paddingBottom: 90
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          padding: "20px 20px 16px",
          borderBottom: "1px solid #1e293b"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
              Presupuesto
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>
              Familiar {año}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setAño((y) => y - 1)} style={btnSmall}>{año - 1}</button>
            <button onClick={() => setAño((y) => y + 1)} style={btnSmall}>{año + 1}</button>
          </div>
        </div>

        <div style={{ display: "flex", background: "#1e293b", borderRadius: 10, padding: 3, marginBottom: 14 }}>
          {["mes", "anual"].map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
                background: vista === v ? "#3b82f6" : "transparent",
                color: vista === v ? "#fff" : "#64748b"
              }}
            >
              {v === "mes" ? "📅 Mensual" : "📊 Anual"}
            </button>
          ))}
        </div>

        {vista === "mes" && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {MESES.map((m, i) => (
              <button
                key={i}
                onClick={() => setMes(i)}
                style={{
                  flexShrink: 0,
                  padding: "5px 11px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: mes === i ? 700 : 400,
                  transition: "all 0.2s",
                  background: mes === i ? "#3b82f6" : "#1e293b",
                  color: mes === i ? "#fff" : "#64748b"
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
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12
            }}
          >
            {errorCarga}
          </div>
        </div>
      )}

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Ingresos", val: vista === "mes" ? totales.ingresos : totalesAnuales.ingresos, color: "#22c55e" },
            { label: "Gastos", val: vista === "mes" ? totales.gastos : totalesAnuales.gastos, color: "#f97316" },
            {
              label: "Disponible",
              val: vista === "mes" ? totales.disponible : totalesAnuales.disponible,
              color: disponibleColor(vista === "mes" ? totales.disponible : totalesAnuales.disponible)
            }
          ].map(({ label, val, color }) => (
            <div
              key={label}
              style={{
                background: "#1e293b",
                borderRadius: 12,
                padding: "12px 10px",
                textAlign: "center",
                border: `1px solid ${color}22`
              }}
            >
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color }}>
                {Math.round(val)}€
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 16px 0" }}>
        {Object.entries(PRESUPUESTOS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "9px 4px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              transition: "all 0.2s",
              background: tab === key ? "#1d4ed8" : "#1e293b",
              color: tab === key ? "#fff" : "#64748b"
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {!puedeEditarTabActual && (
        <div style={{ padding: "10px 16px 0" }}>
          <div
            style={{
              background: "#3f3f46",
              color: "#e4e4e7",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12
            }}
          >
            Solo lectura. Esta sección pertenece al otro usuario.
          </div>
        </div>
      )}

      {vista === "anual" && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: "#1e293b", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#172554", borderBottom: "1px solid #1e3a8a" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Resumen Anual {año} — {PRESUPUESTOS[tab].label}
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
                    opacity: hasDatos ? 1 : 0.4,
                    background: mes === i ? "#1e3a5f22" : "transparent"
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, width: 80 }}>{m}</span>
                  <span style={{ fontSize: 12, color: "#22c55e" }}>{t.ingresos > 0 ? fmtDisplay(t.ingresos) : "—"}</span>
                  <span style={{ fontSize: 12, color: "#f97316" }}>{t.gastos > 0 ? fmtDisplay(t.gastos) : "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: disponibleColor(t.disponible) }}>
                    {hasDatos ? fmtDisplay(t.disponible) : "—"}
                  </span>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#0f172a" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{fmtDisplay(totalesAnuales.ingresos)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{fmtDisplay(totalesAnuales.gastos)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: disponibleColor(totalesAnuales.disponible) }}>
                {fmtDisplay(totalesAnuales.disponible)}
              </span>
            </div>
          </div>
        </div>
      )}

      {vista === "mes" && (
        <div style={{ padding: "16px 16px 0" }}>
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
          />

          <div
            style={{
              background: totales.disponible >= 0 ? "#052e16" : "#450a0a",
              border: `1px solid ${totales.disponible >= 0 ? "#22c55e" : "#ef4444"}44`,
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                {MESES[mes]} — Dinero disponible
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: disponibleColor(totales.disponible) }}>
                {fmtDisplay(totales.disponible)}
              </div>
            </div>
            <div style={{ fontSize: 32 }}>{totales.disponible >= 0 ? "✅" : "⚠️"}</div>
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

            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
              {editando.cat}
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
                    fontWeight: 600,
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
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                  Añadir movimiento
                </div>

                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ej. 50 o -10"
                    style={{
                      width: "100%",
                      padding: "14px 50px 14px 14px",
                      fontSize: 18,
                      fontWeight: 600,
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
                    background: "#3b82f6",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 20
                  }}
                >
                  Añadir movimiento
                </button>

                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
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
                            <div style={{ fontSize: 14, fontWeight: 700, color: normalizarNumero(mov.importe) >= 0 ? "#22c55e" : "#f87171" }}>
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
                      fontWeight: 600,
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
                      fontWeight: 600,
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
                      fontWeight: 600,
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

function Seccion({ titulo, color, cats, seccion, tipo, getValor, onTap, total, editable }) {
  const [abierta, setAbierta] = useState(true);

  return (
    <div style={{ background: "#1e293b", borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
      <div
        onClick={() => setAbierta((a) => !a)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          cursor: "pointer",
          borderBottom: abierta ? "1px solid #0f172a" : "none"
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{titulo}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>{total.toFixed(2)}€</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>{abierta ? "▲" : "▼"}</span>
        </div>
      </div>

      {abierta && cats.map((cat) => {
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
              padding: "11px 16px",
              borderBottom: "1px solid #0f172a11",
              cursor: editable ? "pointer" : "default",
              background: tieneValor ? `${color}08` : "transparent",
              transition: "background 0.15s",
              opacity: editable ? 1 : 0.7
            }}
          >
            <span style={{ fontSize: 14, color: tieneValor ? "#f1f5f9" : "#64748b" }}>{cat}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: tieneValor ? 600 : 400,
                  color: tieneValor ? color : "#334155"
                }}
              >
                {tieneValor ? `${parseFloat(val).toFixed(2)}€` : "—"}
              </span>
              <span style={{ fontSize: 11, color: "#475569" }}>{editable ? "✏️" : "🔒"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const btnSmall = {
  padding: "5px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#94a3b8",
  fontSize: 12,
  cursor: "pointer"
};
