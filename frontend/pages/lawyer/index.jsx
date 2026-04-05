import ProtectedRoute from "../../src/components/ProtectedRoute";
import LawyerCaseSearchPage from "../../src/pages/lawyer/LawyerCaseSearchPage";

export default function LawyerPage() {
  return (
    <ProtectedRoute roles={["lawyer", "admin"]}>
      <LawyerCaseSearchPage />
    </ProtectedRoute>
  );
}
