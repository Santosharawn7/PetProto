// Generate a simple session ID for cart tracking
export const getSessionId = () => {
  let sessionId = localStorage.getItem('mini_amazon_session');

  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('mini_amazon_session', sessionId);
  }

  return sessionId;
};
