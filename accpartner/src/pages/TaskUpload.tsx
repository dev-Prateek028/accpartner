import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UploadCloud, ArrowLeft, Upload } from 'lucide-react';
import { validateFile } from '../utils/validation';

interface CompletedTask {
  pairingId: string;
  userId: string;
  title: string;
  description: string;
  fileUrl?: string | null;
  createdAt: any;
  status: string;
}

function TaskUpload() {
  const { pairingId } = useParams<{ pairingId: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  const [existingTask, setExistingTask] = useState<CompletedTask | null>(null);
  const [plannedTask, setPlannedTask] = useState<any>(null);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPairingDetails = async () => {
      if (!user || !userProfile || !pairingId) return;

      try {
        setLoading(true);
        const pairingDoc = await getDoc(doc(db, 'pairings', pairingId));
        
        if (!pairingDoc.exists()) {
          toast.error('Pairing not found');
          navigate('/dashboard');
          return;
        }

        const pairingData = pairingDoc.data();
        const otherUserId = pairingData.user1 === user.uid ? pairingData.user2 : pairingData.user1;
        
        // Get partner details
        const partnerDoc = await getDoc(doc(db, 'users', otherUserId));
        if (partnerDoc.exists()) {
          setPartnerDetails(partnerDoc.data());
        }

        // Check if user has already uploaded a completed task
        const completedTasksQuery = query(
          collection(db, 'completedTasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', user.uid)
        );
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        console.log('Completed tasks query result:', completedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const existingCompletedTask = completedTasksSnapshot.docs[0]?.data() as CompletedTask;

        if (existingCompletedTask) {
          setExistingTask(existingCompletedTask);
          setTitle(existingCompletedTask.title);
          setDescription(existingCompletedTask.description);
        }

        // Check for planned task
        const plannedTasksQuery = query(
          collection(db, 'plannedTasks'),
          where('pairingId', '==', pairingId),
          where('userId', '==', user.uid)
        );
        const plannedTasksSnapshot = await getDocs(plannedTasksQuery);
        console.log('Planned tasks query result:', plannedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const existingPlannedTask = plannedTasksSnapshot.docs[0]?.data();

        if (existingPlannedTask) {
          setPlannedTask(existingPlannedTask);
          if (!existingCompletedTask) {
            setTitle(existingPlannedTask.title);
            setDescription(existingPlannedTask.description);
          }
        }
      } catch (error) {
        console.error('Error fetching pairing details:', error);
        toast.error('Failed to load pairing details');
      } finally {
        setLoading(false);
      }
    };

    fetchPairingDetails();
  }, [pairingId, user, userProfile, navigate]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const { isValid, error } = validateFile(selectedFile);
      if (!isValid) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user || !userProfile || !pairingId) {
      toast.error('You must be logged in to upload a task');
      return;
    }

    if (!plannedTask) {
      toast.error('You must plan your task first');
      return;
    }

    try {
      setSubmitting(true);

      // Save completed task
      await addDoc(collection(db, 'completedTasks'), {
        pairingId,
        userId: user.uid,
        title,
        description,
        fileUrl: file ? URL.createObjectURL(file) : null,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

      toast.success('Task uploaded successfully!');
      setExistingTask({ 
        pairingId,
        userId: user.uid,
        title,
        description,
        fileUrl: file ? URL.createObjectURL(file) : null,
        createdAt: serverTimestamp(),
        status: 'completed'
      });
    } catch (error) {
      console.error('Error uploading task:', error);
      toast.error('Failed to upload task');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!isWithinDeadline) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Your deadline has passed. You can only verify tasks now.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
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

  if (!plannedTask) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          You need to plan your task first before uploading the completed work.
        </p>
      </div>
    );
  }

  if (existingTask) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Completed Task</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Title</h3>
            <p className="mt-1">{existingTask.title}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Description</h3>
            <p className="mt-1 whitespace-pre-wrap">{existingTask.description}</p>
          </div>
          {existingTask.fileUrl && (
            <div>
              <h3 className="font-medium text-gray-700">Uploaded File</h3>
              <a 
                href={existingTask.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View File
              </a>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Upload className="h-4 w-4 mr-1" />
            <span>Uploaded at: {existingTask.createdAt?.toDate ? 
              new Date(existingTask.createdAt.toDate()).toLocaleString() : 
              'Just now'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Upload Completed Task</h2>
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

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Upload File (Optional)
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Uploading Task...' : 'Upload Task'}
        </button>
      </form>
    </div>
  );
}

export default TaskUpload;