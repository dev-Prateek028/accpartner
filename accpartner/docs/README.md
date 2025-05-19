# AccountaBuddy - Accountability Partner Web App

## Overview

AccountaBuddy is a web application that helps users achieve their daily goals through peer accountability. Users are paired with accountability partners in their timezone, share daily tasks, and verify each other's completion.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Registration & Login](#user-registration--login)
3. [Dashboard](#dashboard)
4. [Task Management](#task-management)
5. [Rating System](#rating-system)
6. [Daily Reset](#daily-reset)

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Email address for registration

### Accessing the App
1. Visit the application URL
2. Create an account or log in if you already have one

## User Registration & Login

### Registration
1. Click "Sign up" on the landing page
2. Provide:
   - Email address
   - Password (minimum 6 characters)
   - Username
   - Timezone (auto-detected, can be changed)
3. Initial account settings:
   - Rating: 0
   - Available: false
   - Total Pairs: 0

### Login
1. Click "Sign in" on the landing page
2. Enter your registered email and password
3. Upon successful login, you'll be redirected to the dashboard

## Dashboard

### Availability Management
1. Toggle your availability status using the switch at the top
2. When available:
   - You'll see other available users in your timezone
   - You can send and receive pairing requests
   - You can pair with multiple users per day

### Available Users Section
- Lists users available for pairing in your timezone
- Shows each user's:
  - Username
  - Rating
  - Timezone
- "Pair Up" button to send pairing requests

### Incoming Requests Section
- Shows pending pairing requests from other users
- For each request:
  - Sender's username and rating
  - Accept/Reject buttons
- Accepting creates a pairing for the day

### Active Pairings Section
- Lists your current accountability partners
- For each pairing:
  - Partner's username and rating
  - Task upload status
  - Task verification status (during verification window)
  - Time remaining until deadlines

## Task Management

### Task Upload (Before 11:00 PM)
1. Click "Upload Task" for a specific pairing
2. Provide:
   - Task title (required)
   - Description (optional)
   - File attachment (optional)
3. Submit before the 11:00 PM deadline

### Task Verification (11:00 PM - 11:30 PM)
1. During the verification window, click "Verify Task"
2. Review your partner's task
3. Mark as either:
   - Completed (✅)
   - Not Completed (❌)
4. Submit verification before 11:30 PM

## Rating System

### Rating Changes
| Action | Rating Change |
|--------|--------------|
| Task marked as Completed | +1 |
| Task marked as Not Completed | -0.5 |
| No task uploaded by deadline | -2 |
| No verification submitted | -2 |

### Rating Display
- Visible on your profile
- Shown to other users
- Reflects accountability reliability

## Daily Reset

### Automatic Reset (11:59 PM)
- All pairings are cleared
- All tasks are archived
- All verifications are processed
- Ratings are updated based on the day's activities
- Users return to unpaired status

### Next Day
1. Toggle availability when ready
2. Create new pairings
3. Start fresh task cycle

## Best Practices

1. **Task Upload**
   - Upload tasks early
   - Provide clear, verifiable descriptions
   - Include proof if possible (attachments)

2. **Verification**
   - Be honest in verifications
   - Submit verifications promptly
   - Check task evidence thoroughly

3. **Timezone Management**
   - Keep your timezone updated
   - Consider daylight savings changes

4. **Rating Maintenance**
   - Upload tasks consistently
   - Complete verifications on time
   - Maintain honest reporting

## Troubleshooting

### Common Issues

1. **Can't Find Partners**
   - Check your timezone setting
   - Verify your availability is toggled on
   - Try different times of day

2. **Missing Deadlines**
   - Set personal reminders before 11:00 PM
   - Upload tasks early when possible
   - Use browser notifications if available

3. **Verification Issues**
   - Ensure you're verifying during the window (11:00 PM - 11:30 PM)
   - Check your internet connection
   - Refresh the page if buttons are unresponsive

### Support
For additional support or bug reports, contact support@accountabuddy.com

## Privacy & Security

- All data is encrypted
- User information is protected
- Task data is automatically cleared daily
- Ratings and account data persist
- File attachments are stored securely

## Updates & Maintenance

The application undergoes regular updates to:
- Improve user experience
- Fix bugs
- Add new features
- Maintain security

Stay tuned to in-app notifications for important updates and changes.