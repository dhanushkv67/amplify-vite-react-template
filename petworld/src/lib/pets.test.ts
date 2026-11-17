import { describe, it, expect } from 'vitest';
import { filterPets } from './pets';
import type { Pet } from '../types/pet';
const sample: Pet[] = [
  { id: '1', name: 'Fluffy', type: 'dog', shortDescription: 'soft', description: '', imageUrls: [] },
  { id: '2', name: 'Calm', type: 'cat', shortDescription: 'quiet', description: '', imageUrls: [] },
];
describe('filterPets contract', () => {
  it('matches query on name or shortDescription', () => expect(filterPets(sample, 'flu', 'all')).toHaveLength(1));
  it('filters by type', () => expect(filterPets(sample, '', 'cat')).toHaveLength(1));
});
