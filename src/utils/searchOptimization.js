/**
 * Performance utilities for search and filtering operations
 */

/**
 * Creates an optimized search index for conversations
 * @param {Array} conversations - Array of conversation objects
 * @param {Function} getProfileName - Function to get profile name for a phone number
 * @returns {Map} - Search index mapping searchable text to conversations
 */
export const createSearchIndex = (conversations, getProfileName) => {
  const index = new Map();

  conversations.forEach((conversation) => {
    const searchableTerms = [
      conversation.phoneNumber,
      getProfileName(conversation.phoneNumber),
      conversation.lastMessage,
      conversation.contactName,
      conversation.leadStatus,
      // Add any other searchable fields
    ]
      .filter(Boolean)
      .map((term) => term.toString().toLowerCase());

    // Create n-gram index for partial matches
    searchableTerms.forEach((term) => {
      // Index full terms
      if (!index.has(term)) {
        index.set(term, new Set());
      }
      index.get(term).add(conversation);

      // Index partial terms (3-char minimum for performance)
      for (let i = 0; i <= term.length - 3; i++) {
        for (let j = i + 3; j <= term.length; j++) {
          const substr = term.substring(i, j);
          if (!index.has(substr)) {
            index.set(substr, new Set());
          }
          index.get(substr).add(conversation);
        }
      }
    });
  });

  return index;
};

/**
 * Search conversations using the pre-built index
 * @param {string} searchTerm - The search term
 * @param {Map} searchIndex - The search index
 * @param {Array} fallbackConversations - Fallback conversations if index search fails
 * @param {Function} getProfileName - Function to get profile name (for fallback)
 * @returns {Array} - Filtered conversations
 */
export const searchWithIndex = (
  searchTerm,
  searchIndex,
  fallbackConversations,
  getProfileName
) => {
  if (!searchTerm || !searchTerm.trim()) {
    return fallbackConversations;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  // Use index if available
  if (searchIndex && searchIndex.has(lowerSearchTerm)) {
    return Array.from(searchIndex.get(lowerSearchTerm));
  }

  // Fallback to partial matches using index
  if (searchIndex) {
    const matchingConversations = new Set();

    for (const [term, conversations] of searchIndex.entries()) {
      if (term.includes(lowerSearchTerm)) {
        conversations.forEach((conv) => matchingConversations.add(conv));
      }
    }

    if (matchingConversations.size > 0) {
      return Array.from(matchingConversations);
    }
  }

  // Final fallback to original search logic
  return fallbackConversations.filter((conv) => {
    try {
      const profileName = (
        getProfileName(conv.phoneNumber) || ""
      ).toLowerCase();
      const phoneNumber = (conv.phoneNumber || "").toLowerCase();
      const lastMessage = (conv.lastMessage || "").toLowerCase();

      return (
        profileName.includes(lowerSearchTerm) ||
        phoneNumber.includes(lowerSearchTerm) ||
        lastMessage.includes(lowerSearchTerm)
      );
    } catch (error) {
      console.warn("Error filtering conversation:", conv.phoneNumber, error);
      return false;
    }
  });
};

/**
 * Throttle function execution to improve performance
 * @param {Function} func - Function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Create a virtualized list renderer for large datasets
 * @param {Array} items - Items to render
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @param {number} scrollTop - Current scroll position
 * @returns {Object} - Virtualized rendering info
 */
export const getVirtualizedItems = (
  items,
  itemHeight,
  containerHeight,
  scrollTop
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
  };
};
