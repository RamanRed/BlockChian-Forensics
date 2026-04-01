// /chargesheet/new redirects to /chargesheet with new tab open
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ChargesheetNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/chargesheet");
  }, []);
  return null;
}
