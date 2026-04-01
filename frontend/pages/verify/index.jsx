import ProtectedRoute from "../src/components/ProtectedRoute";
import VerifyPage from "../src/pages/verify/index";

export default function VerifyPageRoute() {
  return (
    <ProtectedRoute>
      <VerifyPage />
    </ProtectedRoute>
  );
}
