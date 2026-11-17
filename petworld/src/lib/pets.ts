import type { Pet, PetType } from '../types/pet';
const PETS: Pet[] = [
  { id: '1', name: 'Buddy', type: 'dog', shortDescription: 'Playful golden pup', description: 'Loves fetch.', imageUrls: ['https://placehold.co/400x300?text=Buddy'] },
  { id: '2', name: 'Luna', type: 'cat', shortDescription: 'Curious tabby', description: 'Sunbeam specialist.', imageUrls: ['https://placehold.co/400x300?text=Luna'] },
  { id: '3', name: 'Cocoa', type: 'rabbit', shortDescription: 'Gentle hopper', description: 'Enjoys greens.', imageUrls: ['https://placehold.co/400x300?text=Cocoa'] },
  { id: '4', name: 'Kiwi', type: 'bird', shortDescription: 'Chatty parakeet', description: 'Whistles tunes.', imageUrls: ['https://placehold.co/400x300?text=Kiwi'] },
  { id: '5', name: 'Max', type: 'dog', shortDescription: 'Loyal companion', description: 'Great with families.', imageUrls: ['https://placehold.co/400x300?text=Max'] },
  { id: '6', name: 'Misty', type: 'cat', shortDescription: 'Soft gray rescue', description: 'Purrs on sight.', imageUrls: ['https://placehold.co/400x300?text=Misty'] },
  { id: '7', name: 'Pip', type: 'rabbit', shortDescription: 'Tiny explorer', description: 'Likes tunnels.', imageUrls: ['https://placehold.co/400x300?text=Pip'] },
  { id: '8', name: 'Sunny', type: 'bird', shortDescription: 'Bright canary', description: 'Morning singer.', imageUrls: ['https://placehold.co/400x300?text=Sunny'] },
];
export function getAllPets(): Pet[] { return PETS; }
export function getPetById(id: string): Pet | undefined { return PETS.find((p) => p.id === id); }
export function filterPets(pets: Pet[], query: string, typeFilter: PetType | 'all'): Pet[] {
  const q = query.trim().toLowerCase();
  return pets.filter((p) => {
    const typeOk = typeFilter === 'all' || p.type === typeFilter;
    if (!typeOk) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q);
  });
}
