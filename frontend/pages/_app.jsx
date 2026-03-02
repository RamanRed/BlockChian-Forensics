import "../src/styles/global.css";
import "../src/styles/layout.css";
import Navbar from "../src/components/Navbar";
import Sidebar from "../src/components/Sidebar";
import { AuthProvider } from "../src/context/AuthContext";
import { useAuth } from "../src/hooks/useAuth";
import { useRouter } from "next/router";

function Shell({ Component, pageProps }) {
  const { token } = useAuth();
  const router = useRouter();
  const isAuthPage = router.pathname === "/login" || router.pathname === "/register";

  if (isAuthPage) {
    return (
      <>
        <Navbar />
        <main className="page-container">
          <Component {...pageProps} />
        </main>
      </>
    );
  }

  return (
    <div className="app-shell">
      {token ? <Sidebar /> : null}
      <div className="app-main">
        <Navbar />
        <main className="page-container">
          <Component {...pageProps} />
        </main>
      </div>
    </div>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Shell Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
