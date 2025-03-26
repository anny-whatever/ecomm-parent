import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiTag } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  });
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/categories' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCategories();
  }, [navigate]);
  
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Simulate API call
      console.log('Fetching categories');
      
      setTimeout(() => {
        // Simulate categories data
        const mockCategories = [
          {
            _id: 'cat1',
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and accessories',
            productsCount: 15,
            isActive: true,
            createdAt: '2023-02-15T10:22:31Z'
          },
          {
            _id: 'cat2',
            name: 'Clothing',
            slug: 'clothing',
            description: 'Apparel for men, women, and children',
            productsCount: 24,
            isActive: true,
            createdAt: '2023-02-20T14:15:22Z'
          },
          {
            _id: 'cat3',
            name: 'Home & Kitchen',
            slug: 'home-kitchen',
            description: 'Products for home and kitchen use',
            productsCount: 18,
            isActive: true,
            createdAt: '2023-02-25T11:44:10Z'
          },
          {
            _id: 'cat4',
            name: 'Books',
            slug: 'books',
            description: 'Books of all genres',
            productsCount: 32,
            isActive: false,
            createdAt: '2023-03-01T09:32:45Z'
          }
        ];
        
        setCategories(mockCategories);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getCategories();
      // setCategories(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from name
      if (name === 'name') {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };
  
  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true
    });
    setFormOpen(true);
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive
    });
    setFormOpen(true);
  };
  
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      // Simulate API call
      console.log('Deleting category:', categoryId);
      
      // Update state optimistically
      setCategories(categories.filter(category => category._id !== categoryId));
      
      toast.success('Category deleted successfully');
      
      // In a real implementation:
      // await adminService.deleteCategory(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      fetchCategories(); // Revert to original state by refetching
    }
  };
  
  const handleToggleCategoryStatus = async (categoryId, currentStatus) => {
    try {
      // Simulate API call
      console.log('Toggling category status:', categoryId, !currentStatus);
      
      // Update state optimistically
      setCategories(categories.map(category => 
        category._id === categoryId 
          ? { ...category, isActive: !currentStatus } 
          : category
      ));
      
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      
      // In a real implementation:
      // await adminService.updateCategoryStatus(categoryId, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating category status:', error);
      toast.error('Failed to update category status');
      fetchCategories(); // Revert to original state by refetching
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      if (editingCategory) {
        // Update existing category
        console.log('Updating category:', editingCategory, formData);
        
        // Update state optimistically
        setCategories(categories.map(category => 
          category._id === editingCategory 
            ? { 
                ...category, 
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                isActive: formData.isActive
              } 
            : category
        ));
        
        toast.success('Category updated successfully');
        
        // In a real implementation:
        // await adminService.updateCategory(editingCategory, formData);
      } else {
        // Add new category
        console.log('Adding new category:', formData);
        
        // Create a mock ID and add to state
        const newId = 'cat' + (categories.length + 1);
        const newCategory = {
          _id: newId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          productsCount: 0,
          isActive: formData.isActive,
          createdAt: new Date().toISOString()
        };
        
        setCategories([...categories, newCategory]);
        
        toast.success('Category added successfully');
        
        // In a real implementation:
        // const response = await adminService.createCategory(formData);
        // setCategories([...categories, response.data]);
      }
      
      // Close form and reset state
      setFormOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        isActive: true
      });
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };
  
  const handleCancel = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true
    });
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        </div>
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
        >
          <FiPlus className="mr-2" /> Add New Category
        </button>
      </div>
      
      {formOpen && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Used in the URL. Auto-generated from the category name.
                </p>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                ></textarea>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Category is active and visible on the site
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FiTag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new category.
          </p>
          <button
            onClick={handleAddCategory}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            <FiPlus className="mr-2" /> Add New Category
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category.productsCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleCategoryStatus(category._id, category.isActive)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(category.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit category"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete category"
                        disabled={category.productsCount > 0}
                        style={{ opacity: category.productsCount > 0 ? 0.5 : 1 }}
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage; 