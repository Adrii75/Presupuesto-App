import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const usuariosPermitidos = [
    "adri12gg@gmail.com",
    "mateogisela05@gmail.com",
  ];

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
      setError("No se pudo iniciar sesión");
    }
  }

  async function salir() {
    await signOut(auth);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#f8fafc",
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#1e293b",
            padding: 24,
            borderRadius: 16,
            border: "1px solid #334155",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Acceso</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              border: "1px solid #475569",
              background: "#0f172a",
              color: "#fff",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
              border: "1px solid #475569",
              background: "#0f172a",
              color: "#fff",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={entrar}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Entrar
            </button>
          </div>

          {error && <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (!usuariosPermitidos.includes(user.email)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
          padding: 20,
          textAlign: "center",
        }}
      >
        <div>
          <h2>Acceso no autorizado</h2>
          <p>Esta cuenta no tiene permiso para usar la aplicación.</p>
          <button
            onClick={salir}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#334155",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "fixed", top: 10, right: 10, zIndex: 200 }}>
        <button
          onClick={salir}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#334155",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Salir
        </button>
      </div>
      {children}
    </>
  );
}
