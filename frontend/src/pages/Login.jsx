import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import authService from "../services/authService";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authService.login(form);
      login(result);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="centered-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        <p>New account? <Link href="/register">Register</Link></p>
      </form>
    </section>
  );
}

export default Login;
