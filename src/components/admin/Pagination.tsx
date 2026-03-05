'use client';

import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end of the middle section
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to show at least 3 pages in the middle if possible
      if (end - start < 2) {
        if (start === 2) {
          end = Math.min(4, totalPages - 1);
        } else if (end === totalPages - 1) {
          start = Math.max(2, totalPages - 3);
        }
      }
      
      // Add ellipsis if needed before middle section
      if (start > 2) {
        pageNumbers.push(-1); // -1 represents ellipsis
      }
      
      // Add middle section
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed after middle section
      if (end < totalPages - 1) {
        pageNumbers.push(-2); // -2 represents another ellipsis
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-md ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-400 hover:bg-blue-900/20'
        }`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </motion.button>

      {getPageNumbers().map((pageNumber, index) => {
        if (pageNumber < 0) {
          // Render ellipsis
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
              ...
            </span>
          );
        }
        
        return (
          <motion.button
            key={pageNumber}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-md ${
              currentPage === pageNumber
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-blue-900/20'
            }`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </motion.button>
        );
      })}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-2 rounded-md ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-400 hover:bg-blue-900/20'
        }`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export default Pagination; 