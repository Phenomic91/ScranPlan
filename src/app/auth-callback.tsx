import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { finishSignInLink } from '@/features/auth/sign-in';
import { MessageScreen } from '@/ui/message-screen';

/** Opened by the emailed sign-in link: scranplan://auth-callback?code=… */
export default function AuthCallbackScreen() {
  const { code, error_description } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    finishSignInLink(code)
      .then(() => router.replace('/settings'))
      .catch((error: unknown) =>
        setFailure(error instanceof Error ? error.message : 'The link has expired.'),
      );
  }, [code]);

  const problem = failure ?? error_description ?? (code ? null : 'The link is missing its code.');
  if (problem) return <MessageScreen title="Couldn't sign you in" body={problem} />;
  return <MessageScreen title="Signing you in…" />;
}
