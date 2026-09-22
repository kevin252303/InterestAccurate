// Currency and Date formatting utilities

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  // If it's a date-only string like YYYY-MM-DD, parse year, month, day directly to avoid timezone shifts
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
    const [year, month, day] = dateString.trim().split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  let normalized = dateString;
  // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" in UTC.
  // Normalize to ISO-8601 UTC ("YYYY-MM-DDTHH:MM:SSZ") so Date correctly interprets as UTC.
  if (typeof dateString === 'string') {
    if (!dateString.includes('T') && dateString.includes(' ')) {
      normalized = dateString.replace(' ', 'T') + 'Z';
    } else if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      normalized = dateString + 'Z';
    }
  }
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
