/**
 * useCRUD - A reusable hook for common CRUD operations
 * Reduces duplicate fetch/loading/error handling code across pages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * @param {string} baseEndpoint - The API endpoint (e.g., '/questions', '/tests')
 * @param {Object} options - Configuration options
 * @param {boolean} options.loadOnMount - Whether to load data on mount (default: true)
 * @param {Object} options.defaultFilters - Default filter values
 * @param {number} options.defaultLimit - Default items per page (default: 20)
 * @param {Function} options.transformItem - Transform each item after fetch
 * @returns {Object} CRUD state and methods
 */
export default function useCRUD(baseEndpoint, options = {}) {
  const {
    loadOnMount = true,
    defaultFilters = {},
    defaultLimit = 20,
    transformItem = null,
  } = options;

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: defaultLimit,
  });
  const [filters, setFilters] = useState(defaultFilters);

  // Track mounted state for async operations
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Build query string from filters and pagination
  const buildQueryString = useCallback((page = pagination.page) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', pagination.limit);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== '') {
        params.append(key, value);
      }
    });
    
    return params.toString();
  }, [filters, pagination.page, pagination.limit]);

  // Fetch list of items
  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(page);
      const response = await api.get(`${baseEndpoint}?${queryString}`);
      
      if (!mountedRef.current) return;
      
      let fetchedItems = response.data.data || response.data.items || response.data || [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        fetchedItems = response.data;
      }
      
      // Transform items if transformer provided
      if (transformItem && Array.isArray(fetchedItems)) {
        fetchedItems = fetchedItems.map(transformItem);
      }
      
      setItems(fetchedItems);
      
      // Update pagination from response
      if (response.data.page !== undefined) {
        setPagination(prev => ({
          ...prev,
          page: response.data.page,
          pages: response.data.pages || 1,
          total: response.data.total || fetchedItems.length,
        }));
      }
      
      return fetchedItems;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [baseEndpoint, buildQueryString, transformItem]);

  // Fetch single item by ID
  const fetchItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`${baseEndpoint}/${id}`);
      return response.data.data || response.data;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch item');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [baseEndpoint]);

  // Create new item
  const createItem = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(baseEndpoint, data);
      const newItem = response.data.data || response.data;
      
      // Add to list optimistically
      if (mountedRef.current) {
        setItems(prev => [transformItem ? transformItem(newItem) : newItem, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      
      return newItem;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to create item');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [baseEndpoint, transformItem]);

  // Update existing item
  const updateItem = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`${baseEndpoint}/${id}`, data);
      const updatedItem = response.data.data || response.data;
      
      // Update in list
      if (mountedRef.current) {
        setItems(prev => prev.map(item => 
          (item._id === id || item.id === id) 
            ? (transformItem ? transformItem(updatedItem) : updatedItem) 
            : item
        ));
      }
      
      return updatedItem;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to update item');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [baseEndpoint, transformItem]);

  // Delete item
  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`${baseEndpoint}/${id}`);
      
      // Remove from list
      if (mountedRef.current) {
        setItems(prev => prev.filter(item => item._id !== id && item.id !== id));
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
      
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to delete item');
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [baseEndpoint]);

  // Toggle active status (common operation)
  const toggleActive = useCallback(async (id, currentActive) => {
    return updateItem(id, { isActive: !currentActive });
  }, [updateItem]);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Will trigger refetch via effect
  }, []);

  // Go to specific page
  const goToPage = useCallback((page) => {
    fetchItems(page);
  }, [fetchItems]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refetch current page
  const refresh = useCallback(() => {
    return fetchItems(pagination.page);
  }, [fetchItems, pagination.page]);

  // Initial load
  useEffect(() => {
    if (loadOnMount) {
      fetchItems(1);
    }
  }, []); // Only on mount

  // Refetch when filters change
  useEffect(() => {
    if (loadOnMount) {
      fetchItems(1);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    items,
    loading,
    error,
    pagination,
    filters,
    
    // List operations
    fetchItems,
    refresh,
    goToPage,
    
    // Single item operations
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    
    // Filter operations
    updateFilters,
    setFilters,
    
    // Error handling
    clearError,
    
    // Direct state setters (for optimistic updates)
    setItems,
  };
}
