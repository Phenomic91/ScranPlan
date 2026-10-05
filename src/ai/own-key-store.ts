import * as SecureStore from 'expo-secure-store';

const KEY = 'claude-api-key';

// Stays on this device (not in iCloud or Android backups) and is readable only while unlocked.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function getOwnClaudeKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY, OPTIONS);
}

export function saveOwnClaudeKey(apiKey: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, apiKey.trim(), OPTIONS);
}

export function removeOwnClaudeKey(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY, OPTIONS);
}
