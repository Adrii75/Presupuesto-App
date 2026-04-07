import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const DOC_ID = "presupuesto-compartido";

export async function cargarPresupuesto() {
  try {
    const ref = doc(db, "presupuestos", DOC_ID);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return snap.data().data;
    }

    return null;
  } catch (e) {
    console.error("Error cargando presupuesto:", e);
    return null;
  }
}

export async function guardarPresupuesto(data) {
  try {
    const ref = doc(db, "presupuestos", DOC_ID);

    await setDoc(
      ref,
      {
        data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error("Error guardando presupuesto:", e);
  }
}
