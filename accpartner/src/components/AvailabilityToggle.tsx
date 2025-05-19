import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onToggle: (newAvailability: boolean) => void;
  disabled?: boolean;
}

function AvailabilityToggle({ isAvailable, onToggle, disabled = false }: AvailabilityToggleProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleToggle = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      const newAvailability = !isAvailable;
      
      // Update in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        available: newAvailability
      });
      
      // Update local state via callback
      onToggle(newAvailability);
      
      toast.success(newAvailability ? 'You are now available for pairing' : 'You are now unavailable for pairing');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Availability Status</h3>
        <p className="text-sm text-gray-500">
          {isAvailable
            ? 'You are available to be paired with other users'
            : 'You are currently not available for pairing'}
        </p>
      </div>
      
      <div className="flex items-center">
        <button
          onClick={handleToggle}
          disabled={isUpdating || disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isAvailable ? 'bg-green-500' : 'bg-gray-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="switch"
          aria-checked={isAvailable}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${isAvailable ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <span className="ml-3 text-sm font-medium text-gray-900">
          {isUpdating ? 'Updating...' : isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
    </div>
  );
}

export default AvailabilityToggle;