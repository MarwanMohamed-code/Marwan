
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove,
  getDocs,
  where,
  setDoc,
  deleteDoc,
  getDoc,
  or
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  updateProfile,
  signInWithPopup,
  signInWithRedirect, // Changed to Redirect
  getRedirectResult,  // To handle the result after page reload
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  setPersistence, 
  browserLocalPersistence
} from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Post, User, ReactionType, GameSession } from '../types';
import { Place, Product } from './villageData';

// --- إعدادات فايربيس الخاصة بمشروعك (al-maalem-ahaaaa) ---
const firebaseConfig = {
  apiKey: "AIzaSyDFJZW5QG3loOTbQfyBoJVmCSH7FtYo6fk",
  authDomain: "al-maalem-ahaaaa.firebaseapp.com",
  projectId: "al-maalem-ahaaaa",
  storageBucket: "al-maalem-ahaaaa.firebasestorage.app",
  messagingSenderId: "230355286592",
  appId: "1:230355286592:web:de07f7eab8897f3ec0bda5",
  measurementId: "G-MW91QYGT5S"
};

// --- KEYS ---
// تم تعطيل الإشعارات مؤقتاً بناءً على طلبك
const SERVER_KEY = ""; 
const VAPID_KEY = ""; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// FORCE PERSISTENCE: This fixes the "login every time" issue
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence Error:", error);
});

const googleProvider = new GoogleAuthProvider();

// Initialize Messaging (Skipped if keys are empty)
let messaging: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && VAPID_KEY) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.log("Messaging not supported or disabled");
}

// --- Helper: Safe JSON Stringify ---
const safeJsonStringify = (obj: any) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return;
      cache.add(value);
    }
    return value;
  });
};

// --- Auth Services ---

export const registerWithEmail = async (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const logInWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

// تم التغيير إلى Redirect لتجربة أفضل على الموبايل
export const logInWithGoogle = async () => {
  try {
    // سيقوم هذا بنقل المستخدم لصفحة جوجل ثم العودة للموقع
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign In Error:", error);
    throw error;
  }
};

// دالة جديدة للتحقق من نتيجة الدخول بعد العودة للموقع
export const checkGoogleLoginResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Google Redirect Error:", error);
    throw error;
  }
};

export const logOut = async () => {
  return signOut(auth);
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- User Profile Management ---

export const ensureUserDocument = async (authUser: FirebaseUser): Promise<User> => {
    if (!authUser) throw new Error("No auth user provided");

    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as User;
    } else {
        const newUser: User = {
            id: authUser.uid,
            username: authUser.displayName ? authUser.displayName.replace(/\s+/g, '_').toLowerCase() : `user_${authUser.uid.slice(0,5)}`,
            fullName: authUser.displayName || 'مستخدم جديد',
            avatarUrl: authUser.photoURL || `https://ui-avatars.com/api/?name=${authUser.displayName || 'User'}&background=random`,
            bio: 'مشترك جديد في الرقة الغربية ✨',
            followers: 0,
            following: 0,
            savedPostIds: [],
            isPrivate: false,
            followingIds: []
        };
        
        await setDoc(userRef, newUser);
        return newUser;
    }
};

export const getUserFromDb = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (e) {
    console.error("Error fetching user", e);
    return null;
  }
};

export const saveUserToDb = async (user: User) => {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user, { merge: true });
  } catch (e) {
    console.error("Error saving user", e);
    throw e;
  }
};

// --- Notifications ---

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging || !VAPID_KEY) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (token) {
            await updateDoc(doc(db, 'users', userId), { fcmToken: token });
            console.log("Notification Token Saved");
          }
    }
  } catch (error) {
    console.error("Unable to get permission to notify.", error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => resolve(payload));
  });

export const sendNotificationToUser = async (targetUserId: string, title: string, body: string, link: string = '/') => {
    if (auth.currentUser?.uid === targetUserId) return;
    if (!SERVER_KEY) return;

    try {
        const userDoc = await getDoc(doc(db, 'users', targetUserId));
        if (!userDoc.exists()) return;
        const targetToken = userDoc.data().fcmToken;
        if (!targetToken) return;

        await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${SERVER_KEY}`
            },
            body: JSON.stringify({
                to: targetToken,
                notification: { title, body, icon: '/icon.png', click_action: link },
                data: { url: link }
            })
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

// --- Data Subscriptions ---

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as User);
    callback(users);
  }, (error) => console.warn("Users sub error:", error.message));
};

export const createPostInDb = async (post: Post) => {
  await addDoc(collection(db, 'posts'), post);
};

export const deletePostFromDb = async (postId: string) => {
  await deleteDoc(doc(db, 'posts', postId));
};

export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Post[];
    callback(posts);
  }, (error) => console.warn("Posts sub error:", error.message));
};

export const updatePostInDb = async (postId: string, data: Partial<Post>) => {
    await updateDoc(doc(db, 'posts', postId), data);
};

export const addCommentToDb = async (postId: string, comment: any, imageIndex?: number) => {
  const postRef = doc(db, 'posts', postId);
  if (imageIndex !== undefined) {
    await setDoc(postRef, { mediaComments: { [imageIndex]: arrayUnion(comment) } }, { merge: true });
  } else {
    await updateDoc(postRef, { comments: arrayUnion(comment) });
  }
};

// --- Village & Games ---

export const updatePlaceInDb = async (placeId: string, data: Partial<Place>) => {
    await setDoc(doc(db, 'places', placeId), data, { merge: true });
};

export const addProductToPlaceDb = async (placeId: string, product: Product) => {
    const placeRef = doc(db, 'places', placeId);
    await setDoc(placeRef, { id: placeId }, { merge: true });
    await updateDoc(placeRef, { products: arrayUnion(product) });
};

export const subscribeToPlaces = (callback: (placesMap: Record<string, Partial<Place>>) => void) => {
    return onSnapshot(query(collection(db, 'places')), (snapshot) => {
        const placesMap: Record<string, Partial<Place>> = {};
        snapshot.docs.forEach(doc => { placesMap[doc.id] = doc.data(); });
        callback(placesMap);
    });
};

export const createOnlineGame = async (playerXId: string, playerOId: string): Promise<string> => {
  const newGame: Omit<GameSession, 'id'> = {
    playerX: playerXId, playerO: playerOId, board: Array(9).fill(null), currentTurn: 'X', winner: null, status: 'waiting', lastMoveTime: Date.now()
  };
  const docRef = await addDoc(collection(db, 'games'), newGame);
  return docRef.id;
};

export const updateGameState = async (gameId: string, data: Partial<GameSession>) => {
  await updateDoc(doc(db, 'games', gameId), { ...data, lastMoveTime: Date.now() });
};

export const subscribeToGame = (gameId: string, callback: (game: GameSession) => void) => {
  return onSnapshot(doc(db, 'games', gameId), (doc) => {
    if (doc.exists()) callback({ ...doc.data(), id: doc.id } as GameSession);
  });
};

export const subscribeToInvites = (userId: string, callback: (games: GameSession[]) => void) => {
  const q = query(collection(db, 'games'), where('playerO', '==', userId), where('status', '==', 'waiting'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GameSession)));
  });
};

export const sendSignal = async (gameId: string, type: 'offer' | 'answer' | 'ice', data: any, senderId: string) => {
    await addDoc(collection(db, 'games', gameId, 'signals'), { type, data: safeJsonStringify(data), senderId, timestamp: Date.now() });
};

export const subscribeToSignals = (gameId: string, currentUserId: string, callback: (type: string, data: any) => void) => {
    return onSnapshot(query(collection(db, 'games', gameId, 'signals'), orderBy('timestamp')), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const d = change.doc.data();
                if (d.senderId !== currentUserId) callback(d.type, JSON.parse(d.data));
            }
        });
    });
};
