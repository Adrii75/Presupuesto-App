import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function entrar() {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message);
    }
  }

  async function registrar() {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Acceso</h2>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button onClick={entrar}>Entrar</button>
          <button onClick={registrar} style={{ marginLeft: 8 }}>
            Crear cuenta
          </button>
        </div>
        {error && <p>{error}</p>}
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 12, textAlign: "right" }}>
        <button onClick={() => signOut(auth)}>Salir</button>
      </div>
      {children}
    </>
  );
}
