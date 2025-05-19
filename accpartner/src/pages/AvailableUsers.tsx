import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserRound, Clock } from 'lucide-react';
import { formatTimezone } from '../utils/timezoneUtils';
import { UserProfile } from '../types';
import PairingRequests from '../components/PairingRequests';

function AvailableUsers() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingUserIds, setRequestingUserIds] = useState<string[]>([]);

  const sendPairingRequest = async (recipientId: string) => {
    if (!user || !userProfile) return;

    try {
      setRequestingUserIds(prev => [...prev, recipientId]);
      
      // Create the pairing request
      await addDoc(collection(db, 'pairingRequests'), {
        fromUser: user.uid,
        toUser: recipientId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Make the current user unavailable
      await updateUserProfile({ isAvailable: false });
      
      // Remove the user from the available users list
      setAvailableUsers(prev => prev.filter(u => u.id !== recipientId));
      
      toast.success('Pairing request sent successfully');
    } catch (error) {
      console.error('Error sending pairing request:', error);
      toast.error('Failed to send pairing request');
    } finally {
      setRequestingUserIds(prev => prev.filter(id => id !== recipientId));
    }
  };

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!user || !userProfile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all pairings involving the current user
        const pairingsQuery = query(
          collection(db, 'pairings'),
          where('users', 'array-contains', user.uid)
        );
        
        const pairingsSnapshot = await getDocs(pairingsQuery);
        const pairedUserIds = new Set<string>();
        pairedUserIds.add(user.uid);
        
        pairingsSnapshot.forEach((doc) => {
          const pairingData = doc.data();
          if (pairingData.users && Array.isArray(pairingData.users)) {
            pairingData.users.forEach((userId: string) => {
              pairedUserIds.add(userId);
            });
          }
        });

        // Get all pending requests
        const requestsQuery = query(
          collection(db, 'pairingRequests'),
          where('fromUser', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        requestsSnapshot.forEach((doc) => {
          const requestData = doc.data();
          pairedUserIds.add(requestData.toUser);
        });

        // Get all available users in the same timezone
        const usersQuery = query(
          collection(db, 'users'),
          where('isAvailable', '==', true),
          where('timezone', '==', userProfile.timezone)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const users: UserProfile[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (!pairedUserIds.has(doc.id)) {
            users.push({
              id: doc.id,
              username: userData.username,
              email: userData.email,
              timezone: userData.timezone,
              deadline: userData.deadline,
              isAvailable: userData.isAvailable,
              rating: userData.rating || 0,
              totalPairs: userData.totalPairs || 0
            });
          }
        });

        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching available users:', error);
        toast.error('Failed to fetch available users');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableUsers();
  }, [user, userProfile]);

  if (!user || !userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view available users</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PairingRequests />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Available Users</h3>
        </div>

        {availableUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No users available in your timezone</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {availableUsers.map((availableUser) => (
              <li key={availableUser.id} className="py-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900">{availableUser.username}</h4>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{formatTimezone(availableUser.timezone)}</span>
                    <span className="mx-2">•</span>
                    <span>Rating: {availableUser.rating.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => sendPairingRequest(availableUser.id)}
                  disabled={requestingUserIds.includes(availableUser.id)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingUserIds.includes(availableUser.id) ? 'Sending...' : 'Pair'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AvailableUsers; 