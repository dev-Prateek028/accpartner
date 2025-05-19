import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Clock } from 'lucide-react';
import PairingRequests from './PairingRequests';

interface User {
  id: string;
  uid: string;
  username: string;
  timezone: string;
  rating: number;
  available: boolean;
}

function AvailableUsers() {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingUserIds, setRequestingUserIds] = useState<string[]>([]);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!user || !userProfile) return;

      try {
        setLoading(true);

        // Get all users except current user
        const usersQuery = query(
          collection(db, 'users'),
          where('available', '==', true)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(userData => userData.uid !== user.uid); // Filter out current user

        console.log('All available users:', users); // Debug log

        // Get all pairings
        const pairingsQuery = query(
          collection(db, 'pairings'),
          where('user1', 'in', [user.uid, ...users.map(u => u.uid)])
        );
        const pairingsSnapshot = await getDocs(pairingsQuery);
        const pairings = pairingsSnapshot.docs.map(doc => doc.data());

        console.log('All pairings:', pairings); // Debug log

        // Get all pending requests
        const requestsQuery = query(
          collection(db, 'pairingRequests'),
          where('status', '==', 'pending')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => doc.data());

        console.log('All pending requests:', requests); // Debug log

        // Filter users based on time zone and pairing status
        const filteredUsers = users.filter(userData => {
          // Check if user is in the same time zone
          const isSameTimeZone = userData.timezone === userProfile.timezone;
          console.log(`User ${userData.username} timezone:`, userData.timezone); // Debug log
          console.log('Current user timezone:', userProfile.timezone); // Debug log

          // Check if user is already paired
          const isPaired = pairings.some(p => 
            (p.user1 === user.uid && p.user2 === userData.uid) ||
            (p.user1 === userData.uid && p.user2 === user.uid)
          );

          // Check if there's a pending request
          const hasPendingRequest = requests.some(r =>
            (r.fromUser === user.uid && r.toUser === userData.uid) ||
            (r.fromUser === userData.uid && r.toUser === user.uid)
          );

          const isAvailable = isSameTimeZone && !isPaired && !hasPendingRequest;
          console.log(`User ${userData.username} available:`, isAvailable); // Debug log
          return isAvailable;
        });

        console.log('Filtered available users:', filteredUsers); // Debug log
        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching available users:', error);
        toast.error('Failed to load available users');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableUsers();
  }, [user, userProfile]);

  const sendPairingRequest = async (toUserId: string) => {
    if (!user || !userProfile) return;

    try {
      setRequestingUserIds(prev => [...prev, toUserId]);

      // Create pairing request
      await addDoc(collection(db, 'pairingRequests'), {
        fromUser: user.uid,
        toUser: toUserId,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      // Update user's availability
      await updateDoc(doc(db, 'users', user.uid), {
        available: false
      });

      // Remove user from available users list
      setAvailableUsers(prev => prev.filter(u => u.uid !== toUserId));

      toast.success('Pairing request sent successfully!');
    } catch (error) {
      console.error('Error sending pairing request:', error);
      toast.error('Failed to send pairing request');
    } finally {
      setRequestingUserIds(prev => prev.filter(id => id !== toUserId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Users</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>Time Zone: {userProfile?.timezone}</span>
        </div>
      </div>

      <PairingRequests />

      {availableUsers.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No users available in your time zone at the moment.
        </div>
      ) : (
        <div className="grid gap-4">
          {availableUsers.map(userData => (
            <div
              key={userData.uid}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{userData.username}</h3>
                <p className="text-sm text-gray-500">Rating: {userData.rating || 0}</p>
              </div>
              <button
                onClick={() => sendPairingRequest(userData.uid)}
                disabled={requestingUserIds.includes(userData.uid)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                {requestingUserIds.includes(userData.uid) ? 'Sending...' : 'Pair'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableUsers; 