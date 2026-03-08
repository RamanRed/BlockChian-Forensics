import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import authService from "../services/authService";
import { HiOutlineUserAdd } from "react-icons/hi";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "investigator"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      });
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="centered-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <HiOutlineUserAdd />
        </div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Register for the evidence preservation system</p>

        <label>Full Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />

        <label>Email Address</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />

        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" required />

        <label>Confirm Password</label>
        <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" required />

        <label>Role</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="investigator">Investigator</option>
          <option value="auditor">Auditor</option>
          <option value="admin">Admin</option>
        </select>

        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        <p>Already have an account? <Link href="/login">Sign in</Link></p>
      </form>
    </section>
  );
}

export default Register;
