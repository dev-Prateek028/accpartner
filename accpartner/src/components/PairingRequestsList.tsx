import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserRound, Clock, CheckCircle, XCircle } from 'lucide-react';

interface PairingRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromUserRating: number;
  timestamp: any;
}

function PairingRequestsList({ onPairingCreated }: { onPairingCreated: () => void }) {
  const [pairingRequests, setPairingRequests] = useState<PairingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch pairing requests
  useEffect(() => {
    if (!user) return;

    const fetchPairingRequests = async () => {
      try {
        setLoadingRequests(true);
        const requestsRef = collection(db, 'pairingRequests');
        const q = query(
          requestsRef,
          where('toUser', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const requests: PairingRequest[] = [];
        
        for (const docSnapshot of querySnapshot.docs) {
          const requestData = docSnapshot.data();
          
          // Get from user details
          const fromUserRef = doc(db, 'users', requestData.fromUser);
          const fromUserDoc = await getDoc(fromUserRef);
          
          if (fromUserDoc.exists()) {
            const fromUserData = fromUserDoc.data();
            requests.push({
              id: docSnapshot.id,
              fromUserId: requestData.fromUser,
              fromUsername: fromUserData.username,
              fromUserRating: fromUserData.rating,
              timestamp: requestData.timestamp
            });
          }
        }
        
        setPairingRequests(requests);
      } catch (error) {
        console.error('Error fetching pairing requests:', error);
        toast.error('Failed to fetch pairing requests');
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchPairingRequests();
  }, [user]);

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    if (!user) return;
    
    try {
      setProcessingRequestIds((prev) => [...prev, requestId]);
      
      // Create a pairing in Firestore
      await addDoc(collection(db, 'pairings'), {
        user1: user.uid,
        user2: fromUserId,
        createdAt: serverTimestamp()
      });
      
      // Delete the pairing request
      await deleteDoc(doc(db, 'pairingRequests', requestId));
      
      // Update the requests list
      setPairingRequests((prev) => prev.filter(request => request.id !== requestId));
      
      toast.success('Pairing request accepted!');
      
      // Notify parent component
      onPairingCreated();
    } catch (error) {
      console.error('Error accepting pairing request:', error);
      toast.error('Failed to accept pairing request');
    } finally {
      setProcessingRequestIds((prev) => prev.filter(id => id !== requestId));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequestIds((prev) => [...prev, requestId]);
      
      // Delete the pairing request
      await deleteDoc(doc(db, 'pairingRequests', requestId));
      
      // Update the requests list
      setPairingRequests((prev) => prev.filter(request => request.id !== requestId));
      
      toast.success('Pairing request rejected');
    } catch (error) {
      console.error('Error rejecting pairing request:', error);
      toast.error('Failed to reject pairing request');
    } finally {
      setProcessingRequestIds((prev) => prev.filter(id => id !== requestId));
    }
  };

  if (loadingRequests) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Pairing Requests</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Pairing Requests</h3>
      
      {pairingRequests.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No incoming pairing requests</p>
          <p className="text-sm text-gray-400 mt-1">When someone sends you a request, it will appear here</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {pairingRequests.map((request) => (
            <li key={request.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{request.fromUsername}</h4>
                    <div className="flex items-center">
                      <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Rating: {request.fromUserRating}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id, request.fromUserId)}
                    disabled={processingRequestIds.includes(request.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-green-700 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    {processingRequestIds.includes(request.id) ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Accept
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processingRequestIds.includes(request.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-700 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PairingRequestsList;