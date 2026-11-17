import { Link, useParams } from 'react-router-dom';
import { getPetById } from '../lib/pets';

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pet = id ? getPetById(id) : undefined;
  if (!pet) {
    return (
      <section>
        <h1>Pet not found</h1>
        <Link to="/browse">Back to Browse pets</Link>
      </section>
    );
  }
  return (
    <section>
      <h1>{pet.name}</h1>
      <p>{pet.shortDescription}</p>
      <p>{pet.description}</p>
      <p>Type: {pet.type}</p>
      <Link to="/browse">Back to Browse pets</Link>
    </section>
  );
}
