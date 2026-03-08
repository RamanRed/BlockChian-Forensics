import { HiCheckCircle, HiExclamationCircle, HiClock } from "react-icons/hi";

const iconMap = {
  AUTHENTIC: <HiCheckCircle />,
  SUSPICIOUS: <HiExclamationCircle />,
  PENDING: <HiClock />,
  VERIFIED: <HiCheckCircle />,
  COMPROMISED: <HiExclamationCircle />,
};

function StatusBadge({ status }) {
  const key = String(status || "PENDING").toUpperCase();
  return (
    <span className={`badge badge-${key.toLowerCase()}`}>
      {iconMap[key] || <HiClock />}
      {key}
    </span>
  );
}

export default StatusBadge;
