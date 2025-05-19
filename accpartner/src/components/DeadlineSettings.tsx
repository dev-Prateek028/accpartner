import React from 'react';
import { Clock } from 'lucide-react';
import DeadlineInput from './DeadlineInput';

function DeadlineSettings() {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Daily Deadline</h3>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <DeadlineInput />
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Set your daily deadline for task completion. Your partner will have 30 minutes after your deadline to verify your tasks.
      </p>
    </div>
  );
}

export default DeadlineSettings; 