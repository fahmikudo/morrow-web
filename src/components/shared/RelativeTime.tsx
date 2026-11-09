import { formatDate, formatRelative } from '@/lib/date';

type RelativeTimeProps = {
  iso: string;
  className?: string;
};

export function RelativeTime({ iso, className }: RelativeTimeProps) {
  return (
    <time dateTime={iso} title={formatDate(iso)} className={className}>
      {formatRelative(iso)}
    </time>
  );
}
