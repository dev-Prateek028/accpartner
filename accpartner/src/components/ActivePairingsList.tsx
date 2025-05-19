import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserRound, CheckCircle, XCircle, Upload, Clock, Calendar, Award } from 'lucide-react';
import TaskVerification from './TaskVerification';
import PlannedTaskUpload from './PlannedTaskUpload';
import TaskUpload from '../pages/TaskUpload';

interface Pairing {
  id: string;
  user1: string;
  user2: string;
  createdAt: any;
  deadline: string;
}

interface CompletedTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  fileUrl?: string;
  verified: boolean;
  verificationResult: string | null;
  createdAt: any;
  status: string;
}

interface PairingCardProps {
  pairing: Pairing;
  currentUserId: string;
  userDeadline: string;
}

function PairingCard({ pairing, currentUserId, userDeadline }: PairingCardProps) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [showVerdict, setShowVerdict] = useState(false);
  const [partnerUsername, setPartnerUsername] = useState<string>('');
  const otherUserId = pairing.user1 === currentUserId ? pairing.user2 : pairing.user1;

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      try {
        const partnerDoc = await getDoc(doc(db, 'users', otherUserId));
        if (partnerDoc.exists()) {
          const partnerData = partnerDoc.data();
          setPartnerUsername(partnerData.username);
        }
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      }
    };

    fetchPartnerProfile();
  }, [otherUserId]);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const completedTasksQuery = query(
          collection(db, 'completedTasks'),
          where('pairingId', '==', pairing.id)
        );
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        const tasks = completedTasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CompletedTask[];
        setCompletedTasks(tasks);

        // Check if both tasks are verified or if verification deadline has passed
        const bothVerified = tasks.length === 2 && tasks.every(task => task.verified);
        const now = new Date();
        const [hours, minutes] = userDeadline?.split(':').map(Number) || [0, 0];
        const deadline = new Date();
        deadline.setHours(hours, minutes, 0, 0);
        const verificationEnd = new Date(deadline);
        verificationEnd.setMinutes(verificationEnd.getMinutes() + 30);
        const isPastDeadline = now > deadline;
        const isPastVerificationWindow = now > verificationEnd;

        // Show verdict if both tasks are verified or if verification window has passed
        setShowVerdict(bothVerified || isPastVerificationWindow);
      } catch (error) {
        console.error('Error fetching completed tasks:', error);
      }
    };

    fetchCompletedTasks();
  }, [pairing.id, userDeadline]);

  const getFinalVerdict = (tasks: CompletedTask[]) => {
    const now = new Date();
    const [hours, minutes] = userDeadline?.split(':').map(Number) || [0, 0];
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);
    const verificationEnd = new Date(deadline);
    verificationEnd.setMinutes(verificationEnd.getMinutes() + 30);
    const isPastVerificationWindow = now > verificationEnd;

    // If verification window has passed
    if (isPastVerificationWindow) {
      const currentUserTask = tasks.find(task => task.userId === currentUserId);
      const partnerTask = tasks.find(task => task.userId === otherUserId);

      // If current user didn't submit task
      if (!currentUserTask) {
        return {
          status: 'failure',
          message: 'Be sincere with your responsibilities! You did not submit your task. ⚠️',
          icon: <Award className="h-6 w-6 text-red-500" />
        };
      }

      // If current user submitted but didn't verify
      if (currentUserTask && !currentUserTask.verified) {
        return {
          status: 'failure',
          message: 'Be sincere with your responsibilities! You did not verify your partner\'s task. ⚠️',
          icon: <Award className="h-6 w-6 text-red-500" />
        };
      }

      // If both tasks are verified
      if (currentUserTask.verified && partnerTask?.verified) {
        if (currentUserTask.verificationResult === 'completed') {
          return {
            status: 'success',
            message: 'Congratulations! You completed your task successfully! 🎉',
            icon: <Award className="h-6 w-6 text-green-500" />
          };
        } else {
          return {
            status: 'failure',
            message: 'Warning: Your task was not completed as expected. Please be more careful next time! ⚠️',
            icon: <Award className="h-6 w-6 text-red-500" />
          };
        }
      }
    }

    return null;
  };

  const verdict = getFinalVerdict(completedTasks);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <UserRound className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-600">Partner: {partnerUsername || 'Loading...'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>Deadline: {userDeadline || 'Not set'}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Planned Task Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Planned Task</h3>
          <div className="planned-task-section">
            <PlannedTaskUpload pairingId={pairing.id} />
          </div>
        </div>

        {/* Completed Task Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">Completed Task</h3>
          <div className="completed-task-section">
            {showVerdict && verdict ? (
              <div className={`p-4 rounded-lg ${
                verdict.status === 'success' ? 'bg-green-50' :
                verdict.status === 'partial' ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <div className="flex items-center">
                  {verdict.icon}
                  <p className={`ml-2 ${
                    verdict.status === 'success' ? 'text-green-800' :
                    verdict.status === 'partial' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {verdict.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.some(task => task.userId === otherUserId && !task.verified) && (
                  <Link
                    to={`/task-verification/${pairing.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verify Partner's Task
                  </Link>
                )}
                {!completedTasks.some(task => task.userId === currentUserId) && (
                  <Link
                    to={`/task-upload/${pairing.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Completed Task
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivePairingsList() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchPairings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch pairings where user is user1
        const pairingsQuery = query(
          collection(db, 'pairings'),
          where('user1', '==', user.uid)
        );
        const pairingsSnapshot = await getDocs(pairingsQuery);
        const pairingsData = pairingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pairing[];

        // Fetch pairings where user is user2
        const pairingsQuery2 = query(
          collection(db, 'pairings'),
          where('user2', '==', user.uid)
        );
        const pairingsSnapshot2 = await getDocs(pairingsQuery2);
        const pairingsData2 = pairingsSnapshot2.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pairing[];

        const allPairings = [...pairingsData, ...pairingsData2];
        setPairings(allPairings);
      } catch (error) {
        toast.error('Failed to load pairings');
      } finally {
        setLoading(false);
      }
    };

    fetchPairings();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Please log in to view your pairings</p>
      </div>
    );
  }

  if (!userProfile?.deadline) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Please set your deadline in your profile settings to use this feature.</p>
      </div>
    );
  }

  if (pairings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No active pairings found</p>
        <p className="text-sm text-gray-400">
          To get started, find a partner from the available users list and send them a pairing request.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Active Pairings</h2>
      {pairings.map(pairing => (
        <PairingCard
          key={pairing.id}
          pairing={pairing}
          currentUserId={user.uid}
          userDeadline={userProfile.deadline}
        />
      ))}
    </div>
  );
}

export default ActivePairingsList;