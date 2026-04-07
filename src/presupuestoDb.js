import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function cargarPresupuesto(uid) {
  const ref = doc(db, "presupuestos", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data().data;
  }

  return null;
}

export async function guardarPresupuesto(uid, data) {
  const ref = doc(db, "presupuestos", uid);

  await setDoc(
    ref,
    {
      data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
