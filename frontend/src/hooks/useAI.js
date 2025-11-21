import { useContext } from 'react';
import AIContext from '../contexts/AIContext';

/**
 * Custom hook to access AI context
 * Provides easy access to all AI features and state
 * 
 * @example
 * const { categorizeTransaction, loading, aiEnabled } = useAI();
 * 
 * @returns {Object} AI context value with all AI features
 */
export const useAI = () => {
  const context = useContext(AIContext);
  
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  
  return context;
};

export default useAI;
