import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { validateDeadline } from '../utils/validation';

function DeadlineSettings() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [deadline, setDeadline] = useState(userProfile?.deadline || '23:30');
  const [loading, setLoading] = useState(false);

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile?.deadline) {
      setDeadline(userProfile.deadline);
    }
  }, [userProfile]);

  const handleDeadlineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDeadline = e.target.value;
    setDeadline(newDeadline);

    if (!user || !userProfile) {
      toast.error('You must be logged in to update your deadline');
      return;
    }

    // Validate the deadline format
    const { isValid, error } = validateDeadline(newDeadline);
    if (!isValid) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile({ deadline: newDeadline });
      toast.success('Deadline updated successfully');
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast.error('Failed to update deadline');
      // Revert to previous deadline on error
      setDeadline(userProfile.deadline);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Deadline Settings</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
            Daily Task Deadline
          </label>
          <input
            type="time"
            id="deadline"
            value={deadline}
            onChange={handleDeadlineChange}
            disabled={loading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-500">
            Set the time by which you need to complete your daily tasks
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeadlineSettings; 