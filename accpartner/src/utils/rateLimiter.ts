import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  Firestore
} from '@firebase/firestore';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour
};

class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async checkRateLimit(userId: string, ip: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const rateLimitKey = `rateLimit:${userId}:${ip}`;
    const blockKey = `block:${userId}:${ip}`;

    // Check if user is blocked
    const blockDoc = await getDoc(doc(db, 'rateLimits', blockKey));
    if (blockDoc.exists()) {
      const blockData = blockDoc.data();
      if (blockData && blockData.expiresAt > now) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockData.expiresAt,
        };
      }
      // Block has expired, remove it
      await deleteDoc(doc(db, 'rateLimits', blockKey));
    }

    // Get or create rate limit document
    const rateLimitDoc = await getDoc(doc(db, 'rateLimits', rateLimitKey));
    let rateLimitData = rateLimitDoc.exists() ? rateLimitDoc.data() : null;

    if (!rateLimitData || rateLimitData.windowStart < windowStart) {
      // Reset window
      rateLimitData = {
        count: 0,
        windowStart: now,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - rateLimitData.count);
    const allowed = remaining > 0;

    if (allowed) {
      // Update rate limit
      await setDoc(doc(db, 'rateLimits', rateLimitKey), {
        count: rateLimitData.count + 1,
        windowStart: rateLimitData.windowStart,
        lastRequest: now,
      });
    } else {
      // Block user
      await setDoc(doc(db, 'rateLimits', blockKey), {
        expiresAt: now + this.config.blockDurationMs,
        reason: 'Rate limit exceeded',
      });
    }

    return {
      allowed,
      remaining,
      resetTime: rateLimitData.windowStart + this.config.windowMs,
    };
  }

  async cleanupOldRecords() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old rate limits
    const rateLimitsQuery = query(
      collection(db, 'rateLimits'),
      where('windowStart', '<', windowStart)
    );
    const rateLimitsSnapshot = await getDocs(rateLimitsQuery);
    rateLimitsSnapshot.forEach(async (doc: QueryDocumentSnapshot<DocumentData>) => {
      await deleteDoc(doc.ref);
    });

    // Clean up expired blocks
    const blocksQuery = query(
      collection(db, 'rateLimits'),
      where('expiresAt', '<', now)
    );
    const blocksSnapshot = await getDocs(blocksQuery);
    blocksSnapshot.forEach(async (doc: QueryDocumentSnapshot<DocumentData>) => {
      await deleteDoc(doc.ref);
    });
  }
}

// Create and export a singleton instance
export const rateLimiter = new RateLimiter();

// IP reputation tracking
interface IPReputation {
  score: number;
  lastUpdated: number;
  blocked: boolean;
  blockExpiresAt?: number;
}

const IP_REPUTATION_THRESHOLD = -10;
const IP_BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function isIPAllowed(ip: string): Promise<boolean> {
  const ipDoc = await getDoc(doc(db, 'ipReputation', ip));
  
  if (!ipDoc.exists()) {
    // New IP, allow by default
    await setDoc(doc(db, 'ipReputation', ip), {
      score: 0,
      lastUpdated: Date.now(),
      blocked: false
    });
    return true;
  }

  const data = ipDoc.data() as IPReputation;
  
  // Check if IP is blocked
  if (data.blocked) {
    if (data.blockExpiresAt && data.blockExpiresAt > Date.now()) {
      return false;
    }
    // Block has expired, reset
    await updateDoc(doc(db, 'ipReputation', ip), {
      blocked: false,
      blockExpiresAt: null,
      score: 0
    });
    return true;
  }

  // Check reputation score
  return data.score >= IP_REPUTATION_THRESHOLD;
}

export async function updateIPReputation(ip: string, scoreChange: number) {
  const ipDoc = await getDoc(doc(db, 'ipReputation', ip));
  
  if (!ipDoc.exists()) {
    await setDoc(doc(db, 'ipReputation', ip), {
      score: scoreChange,
      lastUpdated: Date.now(),
      blocked: false
    });
    return;
  }

  const data = ipDoc.data() as IPReputation;
  const newScore = data.score + scoreChange;
  
  // Check if IP should be blocked
  if (newScore < IP_REPUTATION_THRESHOLD) {
    await updateDoc(doc(db, 'ipReputation', ip), {
      score: newScore,
      lastUpdated: Date.now(),
      blocked: true,
      blockExpiresAt: Date.now() + IP_BLOCK_DURATION
    });
  } else {
    await updateDoc(doc(db, 'ipReputation', ip), {
      score: newScore,
      lastUpdated: Date.now()
    });
  }
} 