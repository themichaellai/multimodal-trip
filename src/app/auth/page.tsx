'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Page() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<'signUp' | 'signIn'>('signIn');

  return (
    <div className="flex h-screen justify-center items-center pt-4 pb-4">
      <Card className="w-[24rem] m-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {step === 'signUp' ? 'Create an account' : 'Log in'}
          </CardTitle>
        </CardHeader>
        <form
          onSubmit={(event) => {
            console.log('onSubmit');
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            void signIn('password', formData);
          }}
        >
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="explorer@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input name="password" id="password" type="password" />
            </div>
            <input name="flow" type="hidden" value={step} />
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full">
              {step === 'signUp' ? 'Create account' : 'Log in'}
            </Button>
            <div>
              <Button
                variant="link"
                className="text-xs"
                onClick={() => {
                  setStep((s) => (s === 'signUp' ? 'signIn' : 'signUp'));
                }}
                type="button"
              >
                {step === 'signUp' ? 'Log in?' : 'Create account?'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
