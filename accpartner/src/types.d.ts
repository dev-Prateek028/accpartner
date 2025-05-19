declare module 'firebase/firestore' {
  export function collection(db: any, path: string): any;
  export function doc(db: any, path: string, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function updateDoc(docRef: any, data: any): Promise<void>;
  export function setDoc(docRef: any, data: any): Promise<void>;
  export function query(collectionRef: any, ...queryConstraints: any[]): any;
  export function where(field: string, opStr: string, value: any): any;
  export function getDocs(query: any): Promise<any>;
  export function addDoc(collectionRef: any, data: any): Promise<any>;
  export function serverTimestamp(): any;
}

declare module 'react-hot-toast' {
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    loading: (message: string) => void;
    dismiss: () => void;
  };
} 