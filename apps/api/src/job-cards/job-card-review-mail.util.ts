const STATUS_LABELS: Record<string, string> = {
  CREATED: 'New',
  SUBMITTED: 'Received',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

function section(label: string, value?: string | null) {
  if (!value?.trim()) return '';
  return `${label}:\n${value.trim()}\n\n`;
}

export function buildJobCardReviewEmail(input: {
  jobCardNo: string;
  status: string;
  observation?: string | null;
  rectification?: string | null;
  reviewerName: string;
}) {
  const subject = `CEV Dealer Portal — Job Card ${input.jobCardNo} review update`;

  const text = [
    'Your Job Card has a new review update from CEV.',
    '',
    `Job Card No: ${input.jobCardNo}`,
    `Status: ${statusLabel(input.status)}`,
    `Reviewed by: ${input.reviewerName}`,
    '',
    section('Review observation', input.observation),
    section('Action / rectification', input.rectification),
    'Please sign in to the dealer portal for full details.',
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  const htmlSections = [
    input.observation?.trim()
      ? `<p><strong>Review observation</strong><br/>${escapeHtml(input.observation).replace(/\n/g, '<br/>')}</p>`
      : '',
    input.rectification?.trim()
      ? `<p><strong>Action / rectification</strong><br/>${escapeHtml(input.rectification).replace(/\n/g, '<br/>')}</p>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const html = `
    <p>Your Job Card has a new review update from CEV.</p>
    <p><strong>Job Card No:</strong> ${escapeHtml(input.jobCardNo)}<br/>
    <strong>Status:</strong> ${escapeHtml(statusLabel(input.status))}<br/>
    <strong>Reviewed by:</strong> ${escapeHtml(input.reviewerName)}</p>
    ${htmlSections}
    <p>Please sign in to the dealer portal for full details.</p>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
