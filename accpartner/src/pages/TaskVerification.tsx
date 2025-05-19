import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, ArrowLeft, FileText, ExternalLink, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  userId: string;
  fileUrl?: string;
  verified: boolean;
  verificationResult: string | null;
  createdAt: any;
  status: string;
}

function TaskVerification() {
  const { pairingId } = useParams<{ pairingId: string }>();
  const [plannedTask, setPlannedTask] = useState<Task | null>(null);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [isInVerificationWindow, setIsInVerificationWindow] = useState(false);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerificationWindow = () => {
      if (!userProfile?.deadline || !userProfile?.timezone) {
        setIsInVerificationWindow(false);
        return;
      }

      const now = new Date();
      const [hours, minutes] = userProfile.deadline.split(':').map(Number);
      
      // Create deadline time for today in user's timezone
      const deadline = new Date();
      deadline.setHours(hours, minutes, 0, 0);

      // Create verification window end time (30 minutes after deadline)
      const verificationEnd = new Date(deadline);
      verificationEnd.setMinutes(verificationEnd.getMinutes() + 30);

      // Check if current time is within verification window
      const isWithinWindow = now >= deadline && now <= verificationEnd;
      setIsInVerificationWindow(isWithinWindow);
    };

    checkVerificationWindow();
    // Check verification window every minute
    const interval = setInterval(checkVerificationWindow, 60000);
    return () => clearInterval(interval);
  }, [userProfile?.deadline, userProfile?.timezone]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!pairingId || !user) return;

      try {
        setLoading(true);
        
        // Get planned task
        const plannedTasksQuery = query(
          collection(db, 'plannedTasks'),
          where('pairingId', '==', pairingId)
        );
        const plannedTasksSnapshot = await getDocs(plannedTasksQuery);
        
        // Get completed task
        const completedTasksQuery = query(
          collection(db, 'completedTasks'),
          where('pairingId', '==', pairingId)
        );
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        
        let foundPlannedTask = null;
        let foundCompletedTask = null;
        
        plannedTasksSnapshot.forEach((doc) => {
          const taskData = doc.data();
          if (taskData.userId !== user.uid) {
            foundPlannedTask = {
              id: doc.id,
              ...taskData
            } as Task;
          }
        });

        completedTasksSnapshot.forEach((doc) => {
          const taskData = doc.data();
          if (taskData.userId !== user.uid) {
            foundCompletedTask = {
              id: doc.id,
              ...taskData
            } as Task;
          }
        });

        setPlannedTask(foundPlannedTask);
        setCompletedTask(foundCompletedTask);

        if (!foundPlannedTask && !foundCompletedTask) {
          toast.error('No tasks found for verification');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [pairingId, user, navigate]);

  const handleVerify = async (completed: boolean) => {
    if (!completedTask || !user || !userProfile) return;

    try {
      setVerifying(true);
      
      // Update completed task verification status
      const taskRef = doc(db, 'completedTasks', completedTask.id);
      await updateDoc(taskRef, {
        verified: true,
        verificationResult: completed ? 'completed' : 'not_completed',
        verifiedAt: serverTimestamp()
      });

      // Check if both users have verified
      const completedTasksQuery = query(
        collection(db, 'completedTasks'),
        where('pairingId', '==', pairingId)
      );
      const completedTasksSnapshot = await getDocs(completedTasksQuery);
      
      const allTasks = completedTasksSnapshot.docs.map(doc => doc.data());
      const allVerified = allTasks.every(task => task.verified);

      if (allVerified) {
        // Get verification results for both users
        const user1Task = allTasks.find(task => task.userId === pairingId?.split('_')[0]);
        const user2Task = allTasks.find(task => task.userId === pairingId?.split('_')[1]);

        if (user1Task && user2Task) {
          const user1Result = user1Task.verificationResult;
          const user2Result = user2Task.verificationResult;

          // Update ratings based on verification results
          const user1Ref = doc(db, 'users', pairingId?.split('_')[0] || '');
          const user2Ref = doc(db, 'users', pairingId?.split('_')[1] || '');

          // Get current ratings
          const user1Doc = await getDoc(user1Ref);
          const user2Doc = await getDoc(user2Ref);
          
          const user1Data = user1Doc.data();
          const user2Data = user2Doc.data();
          
          const user1Rating = user1Data?.rating || 0;
          const user2Rating = user2Data?.rating || 0;

          // Calculate new ratings
          let newUser1Rating = user1Rating;
          let newUser2Rating = user2Rating;
          let user1Message = '';
          let user2Message = '';

          // Check if user1 submitted and verified
          if (user1Task) {
            if (user1Result === 'completed') {
              newUser1Rating += 1;
              user1Message = 'Congratulations! You completed your task successfully! 🎉';
            } else {
              newUser1Rating -= 1;
              user1Message = 'Warning: Your task was not completed as expected. Please be more careful next time! ⚠️';
            }
          } else {
            newUser1Rating -= 2;
            user1Message = 'Be sincere with your responsibilities! You did not submit your task. ⚠️';
          }

          // Check if user2 submitted and verified
          if (user2Task) {
            if (user2Result === 'completed') {
              newUser2Rating += 1;
              user2Message = 'Congratulations! You completed your task successfully! 🎉';
            } else {
              newUser2Rating -= 1;
              user2Message = 'Warning: Your task was not completed as expected. Please be more careful next time! ⚠️';
            }
          } else {
            newUser2Rating -= 2;
            user2Message = 'Be sincere with your responsibilities! You did not submit your task. ⚠️';
          }

          // Update ratings
          await updateDoc(user1Ref, {
            rating: newUser1Rating
          });

          await updateDoc(user2Ref, {
            rating: newUser2Rating
          });

          // Show appropriate message based on current user
          if (user.uid === pairingId?.split('_')[0]) {
            toast(user1Message);
          } else {
            toast(user2Message);
          }
        }
      } else {
        toast.success('Verification submitted! Waiting for your partner\'s verification.');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error verifying task:', error);
      toast.error('Failed to verify task');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userProfile?.deadline) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Please set your deadline in your profile settings to use this feature.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!isInVerificationWindow) {
    const [hours, minutes] = userProfile.deadline.split(':').map(Number);
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);
    const verificationEnd = new Date(deadline);
    verificationEnd.setMinutes(verificationEnd.getMinutes() + 30);

    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">
          {new Date() < deadline 
            ? 'Verification will be available after the deadline.'
            : 'The verification window has closed.'}
        </p>
        <p className="text-gray-600 mb-4">
          Verification window: {deadline.toLocaleTimeString()} - {verificationEnd.toLocaleTimeString()}
        </p>
        <p className="text-gray-600 mb-4">
          Your timezone: {userProfile.timezone}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!plannedTask && !completedTask) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tasks found for verification</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-gray-700 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Planned Task Section */}
        {plannedTask && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Planned Task</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
                <p className="mt-1 text-gray-600">{plannedTask.title}</p>
                {plannedTask.description && (
                  <p className="mt-2 text-gray-500">{plannedTask.description}</p>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>Planned at: {plannedTask.createdAt?.toDate ? 
                  new Date(plannedTask.createdAt.toDate()).toLocaleString() : 
                  'Just now'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Completed Task Section */}
        {completedTask && !completedTask.verified && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Task</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
                <p className="mt-1 text-gray-600">{completedTask.title}</p>
                {completedTask.description && (
                  <p className="mt-2 text-gray-500">{completedTask.description}</p>
                )}
              </div>
              
              {completedTask.fileUrl && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Attachment</h3>
                  <a
                    href={completedTask.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-5 w-5 mr-1" />
                    <span>View File</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verification</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleVerify(true)}
                    disabled={verifying}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleVerify(false)}
                    disabled={verifying}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Mark as Not Completed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verified Task Section */}
        {completedTask && completedTask.verified && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verified Task</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
                <p className="mt-1 text-gray-600">{completedTask.title}</p>
                {completedTask.description && (
                  <p className="mt-2 text-gray-500">{completedTask.description}</p>
                )}
              </div>
              
              {completedTask.fileUrl && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Attachment</h3>
                  <a
                    href={completedTask.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-5 w-5 mr-1" />
                    <span>View File</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="text-lg font-medium text-gray-900">Verification Status</h3>
                <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  completedTask.verificationResult === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {completedTask.verificationResult === 'completed' ? 'Completed' : 'Not Completed'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskVerification;