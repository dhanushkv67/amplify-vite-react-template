import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAllPets } from '../lib/pets';
const featured = getAllPets().slice(0, 2);
export function HomePage() {
  return (
    <section>
      <motion.div data-testid="home-hero-animation" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1>Find your next best friend</h1>
        <p>Adopt locally with PetWorld.</p>
      </motion.div>
      <h2>Featured pets</h2>
      <ul>
        {featured.map((pet) => (
          <li key={pet.id} data-testid={`featured-pet-${pet.id}`}>
            <Link to={`/pets/${pet.id}`}>{pet.name}</Link> \u2014 {pet.shortDescription}
          </li>
        ))}
      </ul>
    </section>
  );
}
