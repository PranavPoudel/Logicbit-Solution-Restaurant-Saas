import * as bcrypt from 'bcrypt';

/** Same cost as the hashes already in the database, so the dummy compare below takes the same time as a real one. */
export const BCRYPT_ROUNDS = 10;

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);

/**
 * Always runs one bcrypt compare, even when the account has no password (or does not exist),
 * so a wrong email answers as slowly as a wrong password and cannot be told apart by timing.
 */
export async function checkPassword(hash: string | null | undefined, plain: string): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash || DUMMY_HASH);
  return Boolean(hash) && matches;
}
