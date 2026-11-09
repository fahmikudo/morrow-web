import { useNavigate } from 'react-router';
import { FileQuestion } from 'lucide-react';
import { Button } from '@heroui/react';
import { EmptyState } from '@/components/shared/EmptyState';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="That route does not exist. Head back to Today to keep working."
      action={<Button onPress={() => navigate('/today')}>Back to Today</Button>}
    />
  );
}
