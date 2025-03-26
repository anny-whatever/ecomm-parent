import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl md:text-9xl font-bold text-primary">404</h1>
      <p className="text-2xl md:text-3xl font-medium text-gray-600 mt-4">Page Not Found</p>
      <p className="text-base md:text-lg text-gray-500 mt-2 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="flex items-center text-primary hover:text-primary-dark font-medium"
      >
        <FiArrowLeft className="mr-2" />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage; 