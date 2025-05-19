import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function DeadlineInput() {
  const { userProfile, updateDeadline } = useAuth();
  const [deadline, setDeadline] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize deadline from userProfile
  useEffect(() => {
    if (userProfile?.deadline) {
      setDeadline(userProfile.deadline);
      setIsDirty(false);
      setError(null);
    }
  }, [userProfile?.deadline]);

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDeadline(newValue);
    // Only set dirty if the value is different from the current profile
    setIsDirty(newValue !== userProfile?.deadline);
    setError(null);
  };

  const handleSave = async () => {
    if (!isDirty || !deadline) return;

    try {
      setIsUpdating(true);
      setError(null);
      await updateDeadline(deadline);
      toast.success('Deadline updated successfully');
      setIsDirty(false);
      
      // Force a hard reload to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating deadline:', error);
      if (error.message === 'Deadline can only be changed once per day') {
        setError('You can only update your deadline once per day. Please try again tomorrow.');
      } else {
        setError('Failed to update deadline. Please try again.');
      }
      // Reset to the original value on error
      setDeadline(userProfile?.deadline || '');
      setIsDirty(false);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <input
          type="time"
          id="deadline"
          value={deadline}
          onChange={handleDeadlineChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          disabled={isUpdating}
          max="23:30"
        />
        <button
          onClick={handleSave}
          disabled={!isDirty || isUpdating || !deadline}
          className={`px-3 py-2 text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDirty && !isUpdating && deadline
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save'
          )}
        </button>
        {isDirty && (
          <span className="text-sm text-gray-500">
            Changes pending
          </span>
        )}
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}

export default DeadlineInput; 