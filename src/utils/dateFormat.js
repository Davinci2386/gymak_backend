function pluralize(value, unit) {
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

function formatFriendlyDate(dateInput) {
  if (!dateInput) return null;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return pluralize(diffMinutes, 'minute');

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return pluralize(diffHours, 'hour');

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return pluralize(diffDays, 'day');

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

module.exports = {
  formatFriendlyDate,
};
