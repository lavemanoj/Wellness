// src/utils/firebaseErrors.js
// Human-readable Firebase Auth error messages

export function firebaseErrorMessage(code) {
  const map = {
    'auth/user-not-found':            'No account found with this email.',
    'auth/wrong-password':            'Incorrect password. Please try again.',
    'auth/email-already-in-use':      'This email is already registered.',
    'auth/invalid-email':             'Please enter a valid email address.',
    'auth/weak-password':             'Password must be at least 6 characters.',
    'auth/too-many-requests':         'Too many attempts. Please try again later.',
    'auth/network-request-failed':    'Network error. Check your connection.',
    'auth/invalid-credential':        'Incorrect email or password.',
    'auth/user-disabled':             'This account has been disabled.',
    'auth/operation-not-allowed':     'Sign-in is not enabled. Contact support.',
    'auth/popup-closed-by-user':      'Sign-in popup was closed. Try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
    'auth/requires-recent-login':     'Please log in again to continue.',
    'auth/expired-action-code':       'This link has expired. Please request a new one.',
    'auth/invalid-action-code':       'This link is invalid. Please request a new one.',
    'auth/missing-email':             'Please provide an email address.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
