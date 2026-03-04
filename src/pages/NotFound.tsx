import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-gray-700 mb-1">Página não encontrada</p>
        <p className="text-sm text-gray-500 mb-4">
          A rota <span className="font-mono break-all">{location.pathname}</span> não existe.
        </p>
        <a href="/" className="text-blue-600 hover:text-blue-800 underline text-sm font-medium">
          Voltar para o início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
