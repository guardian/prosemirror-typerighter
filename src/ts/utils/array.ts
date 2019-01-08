export const compact = <TValue>(
  value: TValue | null | undefined | false | ""
): value is TValue => !!value;
