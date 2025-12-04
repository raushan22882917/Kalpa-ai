import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { sessionStorageService } from './sessionStorageService';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  extensions: string[];
  settings: Record<string, any>;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyListeners(user);
      
      // Sync auth state to Electron if running in Electron
      if (this.isElectron()) {
        this.syncAuthToElectron(user).catch((error) => {
          console.error('Failed to sync auth to Electron:', error);
        });
      }
    });

    // Set persistence to local by default
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set persistence:', error);
    });
  }

  private isElectron(): boolean {
    return !!(window as any).electronAPI;
  }

  private async syncAuthToElectron(user: User | null) {
    if (this.isElectron() && (window as any).electronAPI?.syncAuth) {
      try {
        const authData = user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          token: await user.getIdToken()
        } : null;
        
        (window as any).electronAPI.syncAuth(authData);
      } catch (error) {
        console.error('Failed to sync auth to Electron:', error);
      }
    }
  }

  private notifyListeners(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Sign up with email and password
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await this.createUserProfile(user, displayName);

      // Create session
      sessionStorageService.createSession({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        provider: 'email',
      });

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create session
      sessionStorageService.createSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'email',
      });

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists, create if not
      const profileExists = await this.getUserProfile(user.uid);
      if (!profileExists) {
        await this.createUserProfile(user);
      }

      // Create session
      sessionStorageService.createSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
      });

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Clear session
      sessionStorageService.clearSession();
      
      await signOut(auth);
      
      // Clear Electron auth if running in Electron
      if (this.isElectron()) {
        await this.syncAuthToElectron(null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Create user profile in Firestore
  private async createUserProfile(user: User, displayName?: string): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      extensions: [],
      settings: {}
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, updates, { merge: true });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  // Save user extensions
  async saveUserExtensions(uid: string, extensions: string[]): Promise<void> {
    await this.updateUserProfile(uid, { extensions });
  }

  // Get user extensions
  async getUserExtensions(uid: string): Promise<string[]> {
    const profile = await this.getUserProfile(uid);
    return profile?.extensions || [];
  }
}

export const authService = new AuthService();
