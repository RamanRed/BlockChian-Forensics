import ProtectedRoute from "../../src/components/ProtectedRoute";
import CaseDiaries from "../../src/pages/investigator/CaseDiaries";

export default function InvestigatorDiaryPage() {
  return (
    <ProtectedRoute roles={["io", "sp", "dsp"]}>
      <CaseDiaries />
    </ProtectedRoute>
  );
}
