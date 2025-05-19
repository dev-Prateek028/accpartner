import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import AvailabilityToggle from '../components/AvailabilityToggle';
import AvailableUsersList from '../components/AvailableUsersList';
import PairingRequestsList from '../components/PairingRequestsList';
import ActivePairingsList from '../components/ActivePairingsList';
import DeadlineSettings from '../components/DeadlineSettings';

interface UserData {
  available: boolean;
  [key: string]: any;
}

function Dashboard() {
  const { user, userProfile } = useAuth();
  const [userAvailability, setUserAvailability] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [refreshPairings, setRefreshPairings] = useState<number>(0);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);

  // Check deadline
  useEffect(() => {
    const checkDeadline = () => {
      if (!userProfile?.deadline) {
        setIsWithinDeadline(false);
        return;
      }

      const now = new Date();
      const [hours, minutes] = userProfile.deadline.split(':').map(Number);
      
      // Create deadline time for today
      const deadline = new Date();
      deadline.setHours(hours, minutes, 0, 0);

      // If current time is past deadline, user can only verify
      const isPastDeadline = now > deadline;
      console.log('Current time:', now.toLocaleTimeString());
      console.log('Deadline:', deadline.toLocaleTimeString());
      console.log('Is past deadline:', isPastDeadline);
      
      setIsWithinDeadline(!isPastDeadline);
    };

    checkDeadline();
    // Check deadline every minute
    const interval = setInterval(checkDeadline, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.deadline]);

  // Fetch user's availability from Firestore
  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }

    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!isMounted) return;
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setUserAvailability(userData.available || false);
        } else {
          toast.error('User data not found');
          setUserAvailability(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
        if (isMounted) {
          setUserAvailability(false);
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggleAvailability = (newAvailability: boolean) => {
    setUserAvailability(newAvailability);
  };

  const handlePairingCreated = () => {
    setRefreshPairings(prev => prev + 1);
  };

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!isWithinDeadline && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Your deadline has passed. You can only verify tasks now.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AvailabilityToggle 
            isAvailable={userAvailability} 
            onToggle={handleToggleAvailability}
            disabled={!isWithinDeadline}
          />
          <DeadlineSettings />
          {isWithinDeadline && <AvailableUsersList />}
        </div>
        <div className="space-y-6">
          <PairingRequestsList onPairingCreated={handlePairingCreated} />
          <ActivePairingsList key={refreshPairings} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;