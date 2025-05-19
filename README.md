# AccPartner

A web application that helps users stay accountable by pairing them with partners to complete daily tasks.

## Features

- User authentication and profile management
- Task planning and completion tracking
- Partner pairing system
- Task verification within a 30-minute window
- Rating system based on task completion and verification
- Daily reset of pairings and tasks at midnight
- Timezone support for deadlines

## Tech Stack

- React with TypeScript
- Firebase Authentication
- Firestore Database
- Tailwind CSS for styling
- React Router for navigation
- React Hot Toast for notifications

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/accpartner.git
cd accpartner
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project and add your configuration:
   - Create a new Firebase project
   - Enable Authentication and Firestore
   - Add your Firebase configuration to `src/firebase/config.ts`

4. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── contexts/       # React contexts
  ├── firebase/       # Firebase configuration
  ├── pages/         # Page components
  ├── types/         # TypeScript type definitions
  └── App.tsx        # Main application component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 