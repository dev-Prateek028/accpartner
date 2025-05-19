import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserProfile } from '../types';

interface PairingRequest {
  id: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  fromUserProfile?: UserProfile;
}

function PairingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PairingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all pending requests for the current user
        const requestsQuery = query(
          collection(db, 'pairingRequests'),
          where('toUser', '==', user.uid),
          where('status', '==', 'pending')
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData: PairingRequest[] = [];
        
        for (const requestDoc of requestsSnapshot.docs) {
          const requestData = requestDoc.data() as PairingRequest;
          requestData.id = requestDoc.id;
          
          // Get the sender's profile
          const userDocRef = doc(db, 'users', requestData.fromUser);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            requestData.fromUserProfile = {
              id: userDocSnap.id,
              username: userData.username,
              email: userData.email,
              timezone: userData.timezone,
              deadline: userData.deadline,
              isAvailable: userData.isAvailable,
              rating: userData.rating || 0,
              totalPairs: userData.totalPairs || 0
            };
          }
          
          requestsData.push(requestData);
        }
        
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching pairing requests:', error);
        toast.error('Failed to fetch pairing requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleRequest = async (requestId: string, accept: boolean) => {
    if (!user) return;

    try {
      setProcessingRequestId(requestId);
      
      if (accept) {
        // Create a new pairing
        await addDoc(collection(db, 'pairings'), {
          users: [user.uid, requests.find(r => r.id === requestId)?.fromUser],
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
      
      // Update the request status
      await updateDoc(doc(db, 'pairingRequests', requestId), {
        status: accept ? 'accepted' : 'rejected'
      });
      
      // Remove the request from the list
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast.success(accept ? 'Pairing request accepted' : 'Pairing request rejected');
    } catch (error) {
      console.error('Error handling pairing request:', error);
      toast.error('Failed to handle pairing request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Pairing Requests</h3>
      <ul className="space-y-4">
        {requests.map((request) => (
          <li key={request.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-medium text-gray-900">
                  {request.fromUserProfile?.username || 'Unknown User'}
                </h4>
                <p className="text-sm text-gray-500">
                  Timezone: {request.fromUserProfile?.timezone}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRequest(request.id, true)}
                  disabled={processingRequestId === request.id}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequest(request.id, false)}
                  disabled={processingRequestId === request.id}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PairingRequests; 