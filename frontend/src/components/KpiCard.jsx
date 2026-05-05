import { ArrowUp, ArrowDown } from "react-icons/fi";

const KpiCard = ({ title, value, change, icon }) => {
  const isPositive = change >= 0;
  const IconComponent = icon;

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <p style={styles.title}>{title}</p>
          <h2 style={styles.value}>{value}</h2>
        </div>
        <div style={styles.iconWrapper}>
          {IconComponent ? <IconComponent size={24} /> : null}
        </div>
      </div>

      <div style={{
        ...styles.change,
        color: isPositive ? "#16a34a" : "#dc2626"
      }}>
        {isPositive ? <ArrowUp /> : <ArrowDown />}
        {Math.abs(change)}% from last month
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    transition: "0.3s",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "6px",
  },
  value: {
    fontSize: "28px",
    fontWeight: "600",
  },
  iconWrapper: {
    background: "#eff6ff",
    padding: "10px",
    borderRadius: "10px",
  },
  change: {
    marginTop: "12px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};

export default KpiCard;