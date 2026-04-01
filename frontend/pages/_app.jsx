import "../src/styles/global.css";
import "../src/styles/layout.css";
import "../src/styles/forms.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Navbar from "../src/components/Navbar";
import Sidebar from "../src/components/Sidebar";
import { AuthProvider } from "../src/context/AuthContext";
import { useAuth } from "../src/hooks/useAuth";
import { useRouter } from "next/router";
import Head from "next/head";

function Shell({ Component, pageProps }) {
  const { token } = useAuth();
  const router = useRouter();
  const isAuthPage = router.pathname === "/login" || router.pathname === "/register";

  if (isAuthPage) {
    return (
      <>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div className="app-shell">
        {token ? <Sidebar /> : null}
        <div className="app-main">
          <Navbar />
          <main className="page-container">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
    </>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Shell Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
