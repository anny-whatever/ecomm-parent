import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const VerifyEmailPage = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const { token } = useParams();

  useEffect(() => {
    // In a real application, you would call your API to verify the token
    const verifyEmailToken = async () => {
      try {
        // Simulate API call
        console.log('Verifying email token:', token);
        
        // Simulate successful verification (80% chance of success)
        setTimeout(() => {
          if (Math.random() > 0.2) {
            setStatus('success');
            setMessage('Your email has been successfully verified. You can now log in to your account.');
          } else {
            setStatus('error');
            setMessage('The verification link is invalid or has expired. Please request a new verification link.');
          }
        }, 1500);
        
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'An error occurred during email verification');
      }
    };

    if (token) {
      verifyEmailToken();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Verification</h2>
      
      {status === 'loading' && (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="text-center">
          <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-6">{message}</p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Log in to your account
          </Link>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center">
          <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 mb-6">{message}</p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to login
          </Link>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailPage; 