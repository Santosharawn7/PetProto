// src/utils/auth.js

// Helper: Clear all auth/user session data (logout everywhere)
export function logoutAndClear() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  // Add any other cleanup here if needed (cart, settings, etc)
}

// Get userData object from localStorage (if any)
// Always flatten if wrapped as { user: { ... } }
export function getUserData() {
  try {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      console.log("No userData in localStorage");
      return null;
    }
    let parsed = JSON.parse(userData);
    // FLATTEN if wrapped as { user: {...}, ... }
    if (parsed && typeof parsed === "object" && parsed.user && typeof parsed.user === "object") {
      parsed = { ...parsed.user, ...parsed };
      delete parsed.user;
    }
    console.log("getUserData() returning:", parsed);
    return parsed;
  } catch (error) {
    console.error("Error parsing userData from localStorage:", error);
    return null;
  }
}

// Get userToken (JWT) from localStorage
export function getAuthToken() {
  const token = localStorage.getItem("userToken");
  console.log("getAuthToken() returning:", token ? "Token exists" : "No token");
  return token;
}

/** Pet Shop Owner check - supports all possible backend and frontend formats */
export function isPetShopOwner() {
  const userData = getUserData();
  if (!userData || !userData.userType) return false;
  const rawUserType = userData.userType;
  const validOwnerTypes = [
    'pet_shop_owner',
    'Pet Shop Owner',
    'pet shop owner',
    'petshopowner',
    'pet-shop-owner',
    'shopowner',
    'owner'
  ];
  // Direct match check
  if (validOwnerTypes.includes(rawUserType)) return true;
  // Normalized match
  const normalizedUserType = rawUserType.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedValidTypes = validOwnerTypes.map(type => type.toLowerCase().replace(/[^a-z]/g, ''));
  return normalizedValidTypes.includes(normalizedUserType);
}

/** Pet Parent check - supports all possible formats */
export function isPetParent() {
  const userData = getUserData();
  if (!userData || !userData.userType) return false;
  const validParentTypes = [
    'pet_parent',
    'Pet Parent',
    'pet parent',
    'petparent',
    'pet-parent',
    'parent'
  ];
  // Direct match
  if (validParentTypes.includes(userData.userType)) return true;
  // Normalized match
  const normalizedType = userData.userType.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedValidTypes = validParentTypes.map(type => type.toLowerCase().replace(/[^a-z]/g, ''));
  return normalizedValidTypes.includes(normalizedType);
}

/** Get user type in display-friendly format */
export function getDisplayUserType() {
  const userData = getUserData();
  if (!userData || !userData.userType) return 'Unknown';
  switch (userData.userType) {
    case 'pet_shop_owner':
      return 'Pet Shop Owner';
    case 'pet_parent':
      return 'Pet Parent';
    default:
      return userData.userType;
  }
}

/** Get user type in backend format */
export function getBackendUserType() {
  const userData = getUserData();
  if (!userData || !userData.userType) return null;
  switch (userData.userType) {
    case 'Pet Shop Owner':
      return 'pet_shop_owner';
    case 'Pet Parent':
      return 'pet_parent';
    default:
      return userData.userType;
  }
}

/** Generic role check */
export function hasRole(role) {
  const userData = getUserData();
  if (!userData || !userData.userType) return false;
  const normalizedUserType = userData.userType.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedRole = role.toLowerCase().replace(/[^a-z]/g, '');
  return normalizedUserType === normalizedRole;
}

export function isValidToken(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const isValid = payload.exp > currentTime;
    return isValid;
  } catch (error) {
    return false;
  }
}
