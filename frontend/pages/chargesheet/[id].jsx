import ProtectedRoute from "../../src/components/ProtectedRoute";
import ChargesheetDetail from "../../src/pages/chargesheet/[id]";

export default function ChargesheetDetailPage() {
  return (
    <ProtectedRoute>
      <ChargesheetDetail />
    </ProtectedRoute>
  );
}
