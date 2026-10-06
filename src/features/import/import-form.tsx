import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { spacing, useColors } from '@/ui/theme';

export type ImportKind = 'link' | 'text';

type ImportFormProps = {
  /** Which import is running, if any. */
  busy: ImportKind | null;
  onRead: (kind: ImportKind, input: string) => void;
};

/** The two ways in: paste a link, or paste the recipe's text. */
export function ImportForm({ busy, onRead }: ImportFormProps) {
  const colors = useColors();
  const [link, setLink] = useState('');
  const [text, setText] = useState('');

  return (
    <>
      <Card>
        <Text variant="heading">Paste a link</Text>
        <Text muted>Copy the recipe&apos;s web address in Safari, then paste it here.</Text>
        {Clipboard.isPasteButtonAvailable ? (
          // Apple's own paste button reads the clipboard without asking for permission.
          <Clipboard.ClipboardPasteButton
            acceptedContentTypes={['url', 'plain-text']}
            backgroundColor={colors.accent}
            foregroundColor={colors.onAccent}
            cornerStyle="large"
            style={styles.pasteButton}
            onPress={(data) => {
              if (data.type !== 'text' || busy) return;
              setLink(data.text);
              onRead('link', data.text);
            }}
          />
        ) : null}
        <TextField
          label="Or type the link"
          value={link}
          onChangeText={setLink}
          placeholder="https://www.bbcgoodfood.com/recipes/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={() => link.trim() && onRead('link', link)}
        />
        <Button
          label="Read link"
          variant="secondary"
          busy={busy === 'link'}
          disabled={!link.trim() || busy !== null}
          onPress={() => onRead('link', link)}
        />
      </Card>

      <Card>
        <Text variant="heading">Paste text</Text>
        <Text muted>
          For Apple Notes, video descriptions or anything without a link. AI tidies it into a
          recipe.
        </Text>
        <TextField
          label="Recipe text"
          value={text}
          onChangeText={setText}
          placeholder="Paste the ingredients and method here"
          multiline
        />
        <Button
          label="Read recipe"
          variant="secondary"
          busy={busy === 'text'}
          disabled={!text.trim() || busy !== null}
          onPress={() => onRead('text', text)}
        />
      </Card>

      {busy ? (
        <View style={styles.status}>
          <Text muted>Reading the recipe. This can take up to a minute.</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  pasteButton: { height: 48, width: 140 },
  status: { paddingHorizontal: spacing.xs },
});
