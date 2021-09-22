export enum TCardScoreSpecialValue {
  unknown = 'unknown',
  break = 'break',
}

export type TCardScore = number | TCardScoreSpecialValue;

export enum TCardType {
  custom = 'custom',
  fib = 'fib',
  powersOfTwo = 'powersOfTwo',
}
