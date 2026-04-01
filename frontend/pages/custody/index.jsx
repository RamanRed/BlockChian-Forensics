import ProtectedRoute from "../../src/components/ProtectedRoute";
import CustodyPage from "../../src/pages/custody/index";

export default function CustodyPageRoute() {
  return (
    <ProtectedRoute>
      <CustodyPage />
    </ProtectedRoute>
  );
}
