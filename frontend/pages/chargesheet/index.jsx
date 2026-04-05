import ProtectedRoute from "../../src/components/ProtectedRoute";
import ChargesheetPage from "../../src/pages/chargesheet/index";

export default function ChargesheetPageRoute() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp", "admin"]}>
      <ChargesheetPage />
    </ProtectedRoute>
  );
}
