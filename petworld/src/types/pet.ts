export type PetType = 'dog' | 'cat' | 'rabbit' | 'bird';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  shortDescription: string;
  description: string;
  imageUrls: string[];
}
