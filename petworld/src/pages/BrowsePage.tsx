import { getAllPets } from '../lib/pets';
import { Link } from 'react-router-dom';
export function BrowsePage() {
  return (
    <section>
      <h1>Browse pets</h1>
      <ul>
        {getAllPets().map((pet) => (
          <li key={pet.id} data-testid={`pet-card-${pet.id}`}>
            <Link to={`/pets/${pet.id}`}>{pet.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
