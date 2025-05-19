import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

interface TaskVerificationProps {
  pairingId: string;
  partnerId: string;
}

function TaskVerification({ pairingId, partnerId }: TaskVerificationProps) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [task, setTask] = useState<any | null>(null);
  const [plannedTask, setPlannedTask] = useState<any | null>(null);
  const [verificationWindow, setVerificationWindow] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!user || !pairingId || !partnerId) return;

      try {
        setLoading(true);

        // Get completed task
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', partnerId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        if (!tasksSnapshot.empty) {
          const taskData = tasksSnapshot.docs[0].data();
          setTask(taskData);

          // Get planned task
          const plannedTasksQuery = query(
            collection(db, 'plannedTasks'),
            where('pairingId', '==', pairingId),
            where('userId', '==', partnerId)
          );
          const plannedTasksSnapshot = await getDocs(plannedTasksQuery);
          if (!plannedTasksSnapshot.empty) {
            setPlannedTask(plannedTasksSnapshot.docs[0].data());
          }

          // Check if verification window is open
          const deadline = new Date(taskData.deadline);
          const verificationEnd = new Date(deadline.getTime() + 30 * 60000); // 30 minutes after deadline
          const now = new Date();
          setVerificationWindow(now >= deadline && now <= verificationEnd);

          // Check if user has already verified
          const verificationsQuery = query(
            collection(db, 'verifications'),
            where('pairingId', '==', pairingId),
            where('verifierId', '==', user.uid)
          );
          const verificationsSnapshot = await getDocs(verificationsQuery);
          setHasVerified(!verificationsSnapshot.empty);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        toast.error('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [user, pairingId, partnerId]);

  const handleVerification = async (isCompleted: boolean) => {
    if (!user || !task || !plannedTask) return;

    try {
      setVerifying(true);

      // Create verification record
      await addDoc(collection(db, 'verifications'), {
        pairingId,
        taskId: task.id,
        plannedTaskId: plannedTask.id,
        verifierId: user.uid,
        verifiedUserId: partnerId,
        isCompleted,
        timestamp: serverTimestamp()
      });

      // Get both users' verifications
      const verificationsQuery = query(
        collection(db, 'verifications'),
        where('pairingId', '==', pairingId)
      );
      const verificationsSnapshot = await getDocs(verificationsQuery);
      const verifications = verificationsSnapshot.docs.map(doc => doc.data());

      // If both users have verified or verification window is closed
      const deadline = new Date(task.deadline);
      const verificationEnd = new Date(deadline.getTime() + 30 * 60000);
      const now = new Date();
      const isVerificationWindowClosed = now > verificationEnd;

      if (verifications.length === 2 || isVerificationWindowClosed) {
        // Calculate ratings based on the new rules
        const user1Id = task.userId;
        const user2Id = partnerId;
        let user1Rating = 0;
        let user2Rating = 0;

        // Get both users' tasks
        const user1TaskQuery = query(
          collection(db, 'tasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', user1Id)
        );
        const user2TaskQuery = query(
          collection(db, 'tasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', user2Id)
        );
        const [user1TaskSnapshot, user2TaskSnapshot] = await Promise.all([
          getDocs(user1TaskQuery),
          getDocs(user2TaskQuery)
        ]);

        const user1Submitted = !user1TaskSnapshot.empty;
        const user2Submitted = !user2TaskSnapshot.empty;

        // Get both users' verifications
        const user1Verification = verifications.find(v => v.verifierId === user2Id);
        const user2Verification = verifications.find(v => v.verifierId === user1Id);

        // Calculate ratings
        if (!user1Submitted) {
          user1Rating = -2; // Didn't submit work
        } else if (!user2Verification) {
          user1Rating = 1; // Submitted but not verified
        } else {
          user1Rating = user2Verification.isCompleted ? 1 : -1; // Verified as completed or not
        }

        if (!user2Submitted) {
          user2Rating = -2; // Didn't submit work
        } else if (!user1Verification) {
          user2Rating = 1; // Submitted but not verified
        } else {
          user2Rating = user1Verification.isCompleted ? 1 : -1; // Verified as completed or not
        }

        // Update user ratings
        const user1Doc = await getDoc(doc(db, 'users', user1Id));
        const user2Doc = await getDoc(doc(db, 'users', user2Id));

        if (user1Doc.exists()) {
          const user1Data = user1Doc.data();
          await updateDoc(doc(db, 'users', user1Id), {
            rating: (user1Data.rating || 0) + user1Rating
          });
        }

        if (user2Doc.exists()) {
          const user2Data = user2Doc.data();
          await updateDoc(doc(db, 'users', user2Id), {
            rating: (user2Data.rating || 0) + user2Rating
          });
        }

        // Notify users about rating changes
        if (user1Rating !== 0) {
          await addDoc(collection(db, 'notifications'), {
            userId: user1Id,
            message: `Your rating has been ${user1Rating > 0 ? 'increased' : 'decreased'} by ${Math.abs(user1Rating)} points.`,
            timestamp: serverTimestamp(),
            read: false
          });
        }

        if (user2Rating !== 0) {
          await addDoc(collection(db, 'notifications'), {
            userId: user2Id,
            message: `Your rating has been ${user2Rating > 0 ? 'increased' : 'decreased'} by ${Math.abs(user2Rating)} points.`,
            timestamp: serverTimestamp(),
            read: false
          });
        }
      }

      setHasVerified(true);
      toast.success('Task verification submitted successfully!');
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

  if (!task || !plannedTask) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No task available for verification.</p>
      </div>
    );
  }

  if (hasVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">You have already verified this task.</p>
      </div>
    );
  }

  if (!verificationWindow) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Verification window is not open yet. Please wait until the deadline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Planned Task</h2>
        <p className="font-medium">{plannedTask.task}</p>
        <p className="text-gray-600 mt-2">{plannedTask.description}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Completed Task</h2>
        <p className="font-medium">{task.task}</p>
        <p className="text-gray-600 mt-2">{task.description}</p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => handleVerification(true)}
          disabled={verifying}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Mark as Completed
        </button>
        <button
          onClick={() => handleVerification(false)}
          disabled={verifying}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="h-5 w-5 mr-2" />
          Mark as Not Completed
        </button>
      </div>
    </div>
  );
}

export default TaskVerification; 