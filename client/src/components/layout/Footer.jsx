import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiSend } from 'react-icons/fi';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Logic to submit newsletter subscription
    console.log('Subscribing with email:', email);
    // Reset form
    setEmail('');
    // Show success message or toast notification
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Your Store</h3>
            <p className="mb-4">
              Your one-stop destination for quality products at affordable prices.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" className="text-gray-400 hover:text-white" aria-label="Instagram">
                <FiInstagram size={20} />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white" aria-label="Twitter">
                <FiTwitter size={20} />
              </a>
              <a href="https://facebook.com" className="text-gray-400 hover:text-white" aria-label="Facebook">
                <FiFacebook size={20} />
              </a>
              <a href="https://youtube.com" className="text-gray-400 hover:text-white" aria-label="YouTube">
                <FiYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white">All Products</Link>
              </li>
              <li>
                <Link to="/products?new=true" className="text-gray-400 hover:text-white">New Arrivals</Link>
              </li>
              <li>
                <Link to="/products?featured=true" className="text-gray-400 hover:text-white">Featured</Link>
              </li>
              <li>
                <Link to="/products?discount=true" className="text-gray-400 hover:text-white">Discounts</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-white">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-white">Returns & Exchanges</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white">FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Newsletter</h3>
            <p className="mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 py-2 px-3 text-gray-900 bg-gray-100 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-r-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Subscribe"
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-950 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Your Store. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center space-x-4 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-white mb-2 md:mb-0">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-white mb-2 md:mb-0">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-gray-500 hover:text-white mb-2 md:mb-0">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 