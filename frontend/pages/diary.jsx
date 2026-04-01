import ProtectedRoute from "../src/components/ProtectedRoute";
import CaseDiary from "../src/pages/diary";

export default function DiaryPage() {
  return (
    <ProtectedRoute>
      <CaseDiary />
    </ProtectedRoute>
  );
}
