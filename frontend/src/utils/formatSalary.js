export function formatSalary(salary) {
  if (salary === undefined || salary === null || salary === "") {
    return "";
  }

  const formatValue = (value) => {
    if (value === undefined || value === null || value === "") return "";
    const numeric = Number(String(value).replace(/,/g, ""));
    if (!Number.isNaN(numeric)) {
      return numeric.toLocaleString();
    }
    return String(value).trim();
  };

  if (typeof salary === "object") {
    const min = salary.min ?? salary.from ?? null;
    const max = salary.max ?? salary.to ?? null;

    if (min !== null && max !== null && max !== 0) {
      return `Rs. ${formatValue(min)} - Rs. ${formatValue(max)} NPR`;
    }

    if (min !== null && min !== undefined) {
      return `Rs. ${formatValue(min)} NPR`;
    }

    if (max !== null && max !== undefined) {
      return `Rs. ${formatValue(max)} NPR`;
    }

    return "";
  }

  const trimmed = String(salary).trim();
  if (!trimmed) {
    return "";
  }

  if (/\b(npr)\b/i.test(trimmed)) {
    return trimmed;
  }

  if (/\b(rs\.?|rupees?)\b/i.test(trimmed)) {
    return `${trimmed} NPR`;
  }

  const numeric = Number(trimmed.replace(/,/g, ""));
  if (!Number.isNaN(numeric)) {
    return `Rs. ${numeric.toLocaleString()} NPR`;
  }

  return `${trimmed} NPR`;
}
