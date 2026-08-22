import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="text-center">
        <h1 className="font-serif text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-medium mb-8">Page non trouvée</p>
        <Link to="/">
          <Button variant="primary">Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
}
