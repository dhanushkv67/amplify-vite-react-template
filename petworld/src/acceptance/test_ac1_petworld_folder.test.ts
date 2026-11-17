import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import baseline from '../../AC1_BASELINE_SNAPSHOT.json';

describe('AC1 petworld folder without changing files outside petworld', () => {
  it('has top-level petworld/ and agreed pre-feature root files are unchanged', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    expect(fs.statSync(path.join(repoRoot, 'petworld')).isDirectory()).toBe(true);
    for (const entry of baseline.unchangedOutsidePetworld) {
      const full = path.join(repoRoot, entry.path);
      const hash = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
      expect(hash).toBe(entry.sha256);
    }
  });
});
