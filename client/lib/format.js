export function money(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function orderStatusLabel(status) {
  if (status === 'complete') return 'Paid';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'awaiting:payment') return 'Awaiting payment';
  if (status === 'created') return 'Reserved';
  return status || 'Unknown';
}

export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
