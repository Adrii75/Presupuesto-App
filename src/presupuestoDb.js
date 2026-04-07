import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const DOC_ID = "presupuesto-compartido";

export async function cargarPresupuesto() {
  const ref = doc(db, "presupuestos", DOC_ID);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().data;
  }

  return null;
}

export async function guardarPresupuesto(data) {
  const ref = doc(db, "presupuestos", DOC_ID);

  await setDoc(
    ref,
    {
      data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
