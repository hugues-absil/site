import { useCallback, type ChangeEvent, type FocusEvent } from "react";
import { PatchEvent, set, unset, type StringInputProps } from "sanity";
import { Stack, Text, TextInput } from "@sanity/ui";
import { parseReference } from "@/lib/catalogSort";

/**
 * Champ référence : saisie fluide ; l'année n'est mise à jour qu'au **blur** pour éviter
 * de perdre le focus à chaque frappe (patch document + re-render).
 */
export function ReferenceFieldInput(props: StringInputProps) {
  const { onChange, value, readOnly, elementProps } = props;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const v = event.currentTarget.value;
      if (v === "") {
        onChange(PatchEvent.from(unset()));
        return;
      }
      onChange(PatchEvent.from(set(v)));
    },
    [onChange]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      elementProps.onBlur?.(event);
      const v = event.currentTarget.value;
      const parsed = parseReference(v);
      if (parsed != null) {
        onChange(PatchEvent.from(set(parsed.fullYear, ["year"])));
      }
    },
    [onChange, elementProps]
  );

  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {!readOnly && (
        <Text size={1} muted>
          Format : YY + code (T toile, D dessin, A céramique utilitaire, CE carreaux, C carnet, G
          gravure, L litho, M monotype, S sculpture) + n°. Ex. 24T05, 24CE03. Si reconnu,
          l&apos;année se met à jour quand vous **quittez le champ** (tab ou clic ailleurs) si la cote est
          reconnue (00–29 → 2000–2029, 30–99 → 1930–1999) ; vous pouvez corriger l&apos;année à la main.
        </Text>
      )}
    </Stack>
  );
}
