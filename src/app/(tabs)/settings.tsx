import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { getOwnClaudeKey, removeOwnClaudeKey, saveOwnClaudeKey } from '@/ai/own-key-store';
import { useSession } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/sign-in';
import { supabase } from '@/lib/supabase';
import { useSync, type SyncStatus } from '@/sync/sync-provider';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';

export default function SettingsScreen() {
  return (
    <Screen title="Settings">
      <AccountCard />
      <ClaudeKeyCard />
    </Screen>
  );
}

function AccountCard() {
  const session = useSession();
  const { status, syncNow } = useSync();

  if (!supabase) {
    return (
      <Card>
        <Text variant="heading">Account</Text>
        <Text muted>This build has no sync server, so everything stays on this phone.</Text>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <Text variant="heading">Account</Text>
        <Text muted>Sign in to sync your recipes between devices.</Text>
        <Button label="Sign in" onPress={() => router.push('/sign-in')} />
      </Card>
    );
  }

  return (
    <Card>
      <Text variant="heading">Account</Text>
      <Text>Signed in as {session.user.email ?? 'Apple ID'}</Text>
      <Text muted>{describeSync(status)}</Text>
      <Button
        label="Sync now"
        variant="secondary"
        busy={status.state === 'syncing'}
        onPress={syncNow}
      />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Card>
  );
}

function describeSync(status: SyncStatus): string {
  switch (status.state) {
    case 'off':
      return 'Sync is off.';
    case 'syncing':
      return 'Syncing…';
    case 'failed':
      return `Sync failed: ${status.message}`;
    case 'idle':
      return status.lastSyncedAt
        ? `Last synced at ${status.lastSyncedAt.toLocaleTimeString()}.`
        : 'Up to date.';
  }
}

function ClaudeKeyCard() {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    getOwnClaudeKey().then((key) => setSaved(key !== null));
  }, []);

  const save = async () => {
    await saveOwnClaudeKey(draft);
    setDraft('');
    setSaved(true);
  };

  const remove = () =>
    Alert.alert('Remove your Claude key?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeOwnClaudeKey();
          setSaved(false);
        },
      },
    ]);

  return (
    <Card>
      <Text variant="heading">Your own Claude key</Text>
      <Text muted>
        Optional. AI features use it instead of your ScranPlan allowance. It is stored only on this
        phone and sent only to Anthropic.
      </Text>
      {saved ? (
        <Button label="Remove key" variant="secondary" onPress={remove} />
      ) : (
        <>
          <TextField
            label="Claude API key"
            value={draft}
            onChangeText={setDraft}
            placeholder="sk-ant-…"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Button label="Save key" disabled={!draft.trim()} onPress={save} />
        </>
      )}
    </Card>
  );
}
