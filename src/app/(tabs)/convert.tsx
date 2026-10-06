import { useState } from 'react';

import { ConverterCard, type ConverterKind } from '@/features/convert/converter-card';
import { GasMarkTable, SwapsCard } from '@/features/convert/reference-cards';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

export default function ConvertScreen() {
  const [kind, setKind] = useState<ConverterKind>('weight');

  return (
    <Screen title="Convert">
      <ConverterCard kind={kind} onKindChange={setKind} />
      {kind === 'oven' ? <GasMarkTable /> : null}
      {kind === 'volume' ? (
        <Text variant="caption" muted>
          Tablespoon 15 ml, teaspoon 5 ml, UK pint 568 ml. A US cup is 237 ml.
        </Text>
      ) : null}
      <SwapsCard />
    </Screen>
  );
}
