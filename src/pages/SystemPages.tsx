import { Link } from 'react-router-dom';
import { Compass, Lock } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';

export function AccessDenied() {
  return (
    <Card>
      <EmptyState icon={<Lock className="size-5" />} title="You don't have access to this page" description="Your role doesn't include permission for this section. Contact a Super Admin if you believe this is a mistake." action={<Link to="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>} />
    </Card>
  );
}

export function NotFound() {
  return (
    <Card>
      <EmptyState icon={<Compass className="size-5" />} title="Page not found" description="The page you are looking for doesn't exist or has moved." action={<Link to="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>} />
    </Card>
  );
}
