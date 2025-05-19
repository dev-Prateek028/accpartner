import React, { useState, useEffect } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs, DocumentData, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Calendar, Clock } from 'lucide-react';

interface PlannedTaskUploadProps {
  pairingId: string;
}

interface PlannedTask {
  pairingId: string;
  userId: string;
  title: string;
  description: string;
  createdAt: any;
  status: string;
}

function PlannedTaskUpload({ pairingId }: PlannedTaskUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  const [existingTask, setExistingTask] = useState<PlannedTask | null>(null);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchPairingDetails = async () => {
      if (!user || !userProfile) return;

      try {
        setLoading(true);
        const pairingDoc = await getDoc(doc(db, 'pairings', pairingId));
        
        if (!pairingDoc.exists()) {
          toast.error('Pairing not found');
          return;
        }

        const pairingData = pairingDoc.data();
        const otherUserId = pairingData.user1 === user.uid ? pairingData.user2 : pairingData.user1;
        
        // Get partner details
        const partnerDoc = await getDoc(doc(db, 'users', otherUserId));
        if (partnerDoc.exists()) {
          setPartnerDetails(partnerDoc.data());
        }

        // Check if user has already planned a task
        const plannedTasksQuery = query(
          collection(db, 'plannedTasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', user.uid)
        );
        const plannedTasksSnapshot = await getDocs(plannedTasksQuery);
        console.log('Planned tasks query result:', plannedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        if (plannedTasksSnapshot.docs.length > 0) {
          const taskData = plannedTasksSnapshot.docs[0].data();
          console.log('Found existing task:', taskData);
          const existingPlannedTask: PlannedTask = {
            pairingId: taskData.pairingId,
            userId: taskData.userId,
            title: taskData.title,
            description: taskData.description,
            createdAt: taskData.createdAt,
            status: taskData.status
          };
          setExistingTask(existingPlannedTask);
          setTitle(existingPlannedTask.title);
          setDescription(existingPlannedTask.description);
        } else {
          console.log('No existing task found for pairing:', pairingId);
        }
      } catch (error) {
        console.error('Error fetching pairing details:', error);
        toast.error('Failed to load pairing details');
      } finally {
        setLoading(false);
      }
    };

    fetchPairingDetails();
  }, [pairingId, user, userProfile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user || !userProfile) {
      toast.error('You must be logged in to plan a task');
      return;
    }

    try {
      setSubmitting(true);

      const taskData = {
        pairingId,
        userId: user.uid,
        title,
        description,
        createdAt: serverTimestamp(),
        status: 'planned'
      };

      // Save planned task
      const docRef = await addDoc(collection(db, 'plannedTasks'), taskData);
      console.log('Task saved with ID:', docRef.id);

      toast.success('Task planned successfully!');
      
      // Set the existing task with the correct data structure
      setExistingTask({
        ...taskData,
        createdAt: new Date() // Use current date for immediate display
      });
    } catch (error) {
      console.error('Error planning task:', error);
      toast.error('Failed to plan task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!userProfile?.deadline) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Please set your deadline in your profile settings to use this feature.</p>
      </div>
    );
  }

  if (!isWithinDeadline) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Your deadline has passed. You can only verify tasks now.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (existingTask) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Planned Task</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Title</h3>
            <p className="mt-1">{existingTask.title}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Description</h3>
            <p className="mt-1 whitespace-pre-wrap">{existingTask.description}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Planned at: {existingTask.createdAt?.toDate ? 
              new Date(existingTask.createdAt.toDate()).toLocaleString() : 
              'Just now'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Plan Your Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Task Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Planning Task...' : 'Plan Task'}
        </button>
      </form>
    </div>
  );
}

export default PlannedTaskUpload; 