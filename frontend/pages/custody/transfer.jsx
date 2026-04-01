// /custody/transfer redirects to /custody
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CustodyTransferRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/custody");
  }, []);
  return null;
}
