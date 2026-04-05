import ProtectedRoute from "../../src/components/ProtectedRoute";
import SubmitLabReportPage from "../../src/pages/forensic/SubmitLabReportPage";

export default function SubmitReportRoute() {
  return (
    <ProtectedRoute roles={["cfsl", "admin"]}>
      <SubmitLabReportPage />
    </ProtectedRoute>
  );
}
