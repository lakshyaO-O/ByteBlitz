import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-headline font-bold text-primary">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link href="/" className="text-primary hover:underline inline-block mt-4">
          Go home
        </Link>
      </div>
    </div>
  );
}
