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
  } catch(e){}
  return {
    2025: {
      familiar: {},
      adri: {},
      gisela: {}
    }
  };
}

function calcTotales(data, tipo, año, mes) {
  const cats = PRESUPUESTOS[tipo].cats;
  const mesData = data?.[año]?.[tipo]?.[mes] || {};
  const ing = cats.ingresos.reduce((s, c) => s + (parseFloat(mesData.ingresos?.[c]) || 0), 0);
  const gas = cats.gastos.reduce((s, c) => s + (parseFloat(mesData.gastos?.[c]) || 0), 0);
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
  return n.toFixed(2).replace(".", ",") + " €";
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

  const emailActual = (user?.email || "").toLowerCase();
  const puedeEditarTabActual = puedeEditarTipo(emailActual, tab);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setData(null);
        return;
      }

      const remoto = await cargarPresupuesto();
      setData(remoto || getInitialData());
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!data) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!data) return;

    const timer = setTimeout(() => {
      guardarPresupuesto(data);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  function getValor(tipo, seccion, cat) {
    return data?.[año]?.[tipo]?.[mes]?.[seccion]?.[cat] || "";
  }

  function setValor(tipo, seccion, cat, valor) {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[año]) next[año] = {};
      if (!next[año][tipo]) next[año][tipo] = {};
      if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {} };
      if (!next[año][tipo][mes][seccion]) next[año][tipo][mes][seccion] = {};
      next[año][tipo][mes][seccion][cat] = valor === "" ? "" : parseFloat(valor) || 0;
      return next;
    });
  }

  function abrirEdicion(tipo, seccion, cat) {
    if (!puedeEditarTipo(emailActual, tipo)) return;

    const val = getValor(tipo, seccion, cat);
    setEditando({ tipo, seccion, cat });
    setInputVal(val === "" ? "" : String(val));
    setModalAbierto(true);
  }

  function guardarEdicion() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;

    setValor(editando.tipo, editando.seccion, editando.cat, inputVal);
    setModalAbierto(false);
    setEditando(null);
    setInputVal("");
  }

  if (!data) {
    return <div style={{color:"#fff", textAlign:"center", marginTop:50}}>Cargando...</div>;
  }

  const totales = calcTotales(data, tab, año, mes);
  const cats = PRESUPUESTOS[tab].cats;

  return (
    <div style={{ color:"#fff", padding:20 }}>

      {!puedeEditarTabActual && (
        <div style={{ marginBottom:10, color:"#aaa" }}>
          Solo lectura
        </div>
      )}

      {cats.ingresos.map(cat => (
        <div key={cat} onClick={() => abrirEdicion(tab, "ingresos", cat)}>
          {cat}: {getValor(tab,"ingresos",cat)}
        </div>
      ))}

      {modalAbierto && (
        <div>
          <input value={inputVal} onChange={e=>setInputVal(e.target.value)} />
          <button onClick={guardarEdicion}>Guardar</button>
        </div>
      )}

    </div>
  );
}
