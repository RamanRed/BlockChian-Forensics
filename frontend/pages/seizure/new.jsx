// /seizure/new redirects to /seizure tab=upload
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SeizureNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/seizure");
  }, []);
  return null;
}
