import { Algorithm, hash, verify } from '@node-rs/argon2';

export const hashPassword = (password: string) => hash(password, {
  algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1,
});

export const verifyPassword = (storedHash: string, password: string) => verify(storedHash, password);
