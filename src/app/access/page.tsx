import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
  return (
    <div className="flex h-screen justify-center items-center pt-4 pb-4">
      <Card className="w-[24rem] m-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Contact for access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p>
            Please contact{' '}
            <a href="mailto:themichaellai@gmail.com">themichaellai@gmail.com</a>{' '}
            for access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
