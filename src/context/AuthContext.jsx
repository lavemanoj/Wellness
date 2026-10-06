import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Auth Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setUserProfile(snap.exists() ? snap.data() : null);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Sign Up ──────────────────────────────────────────────────────────────
  async function signup(formData) {
    const { email, password, firstName, lastName, phone, department, employeeId, role } = formData;

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    const profile = {
      uid: user.uid,
      email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone: phone || '',
      department: department || '',
      employeeId: employeeId || '',
      role,
      photoURL: '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      wellnessScore: 0,
      status: 'active',
    };

    try {
      // Run Firestore write and profile display name update in parallel to save network roundtrip time
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), profile),
        updateProfile(user, { displayName: `${firstName} ${lastName}` }).catch(() => {})
      ]);

      setUserProfile(profile);
      return { user, profile };
    } catch (err) {
      // Delete orphaned auth account so user can retry signup
      try { await user.delete(); } catch (_) {}
      throw new Error('Profile could not be saved. Please check Firestore rules and try again.');
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async function login(email, password, expectedRole) {
    // Step 1: Firebase Auth sign-in
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Step 2: Fetch Firestore profile
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      throw new Error('No profile found. Please sign up first.');
    }

    const profile = snap.data();

    // Step 3: Validate selected role matches profile role
    if (expectedRole && profile.role !== expectedRole) {
      await signOut(auth);
      throw new Error(
        `This account is registered as ${profile.role === 'hr' ? 'HR Manager' : 'Employee'}. Please select the correct role.`
      );
    }

    // Step 4: Update last login timestamp in background (non-blocking for instant login transition)
    updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});

    setUserProfile(profile);
    return { user, profile };
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  // ── Reset Password ───────────────────────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  // ── Upload Profile Photo ─────────────────────────────────────────────────
  async function uploadPhoto(file) {
    if (!currentUser) throw new Error('Not authenticated');
    const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url });
    await updateProfile(currentUser, { photoURL: url });
    setUserProfile((p) => ({ ...p, photoURL: url }));
    return url;
  }

  // ── Change Password ──────────────────────────────────────────────────────
  async function changePassword(newPassword) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updatePassword(auth.currentUser, newPassword);
  }

  // ── Delete Account ───────────────────────────────────────────────────────
  async function deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
    setUserProfile(null);
    setCurrentUser(null);
  }

  const value = {
    currentUser,
    userProfile,
    authLoading,
    signup,
    login,
    logout,
    resetPassword,
    uploadPhoto,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
