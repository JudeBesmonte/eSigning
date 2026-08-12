# Video Meeting System

A comprehensive video meeting system built with Next.js, tRPC, and Video SDK. This system provides full-featured video conferencing capabilities with real-time communication, screen sharing, recording, and participant management.

## Features

### 🎥 Video Conferencing
- **Real-time Video & Audio**: High-quality video and audio streaming
- **Screen Sharing**: Share your screen with participants
- **Recording**: Record meetings for later review
- **Multiple Layouts**: Grid view, spotlight, and sidebar layouts
- **Fullscreen Mode**: Immersive fullscreen experience

### 👥 Participant Management
- **Participant List**: View all participants in real-time
- **Role Management**: Host and participant roles with different permissions
- **Hand Raising**: Participants can raise hands to get attention
- **Audio Level Indicators**: Visual feedback for audio levels
- **Status Tracking**: Track who's joined, left, or disconnected

### 💬 Communication
- **Real-time Chat**: Text messaging during meetings
- **Meeting Notes**: Add notes and descriptions to meetings
- **RSVP System**: Accept/decline meeting invitations
- **Notifications**: Real-time notifications for meeting events

### 📅 Meeting Management
- **Meeting Scheduling**: Create meetings with participants
- **Calendar Integration**: View meetings in calendar format
- **Meeting Types**: Video, phone, and in-person meetings
- **Status Tracking**: Pending, confirmed, ongoing, completed, cancelled
- **Analytics**: Meeting statistics and participation rates

### 🔧 Technical Features
- **Video SDK Integration**: Powered by Video SDK for reliable video streaming
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode Support**: Full dark mode compatibility
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error handling and recovery

## Components

### Core Components

#### `VideoMeetingRoom`
The main video meeting interface with full Video SDK integration.

**Features:**
- Real-time video and audio streaming
- Screen sharing capabilities
- Chat functionality
- Participant management
- Recording controls
- Layout switching
- Fullscreen mode

**Props:**
```typescript
interface VideoMeetingRoomProps {
  roomId: string
  meetingId: string
  token: string
  participantName: string
  role: "host" | "participant"
  meetingTitle?: string
  onLeave: () => void
}
```

#### `CreateMeetingForm`
A comprehensive form for creating new meetings.

**Features:**
- Meeting details (title, description, date, time)
- Participant selection
- Meeting type selection (video, phone, in-person)
- Duration settings
- Location for in-person meetings
- Document attachments

#### `MeetingList`
Displays and manages meetings with filtering and sorting.

**Features:**
- Search and filter meetings
- Sort by date, title, status, or type
- RSVP management
- Meeting actions (join, start, end, delete)
- Status indicators
- Participant information

#### `MeetingDashboard`
Analytics and insights for meeting management.

**Features:**
- Meeting statistics
- Participation rates
- Meeting type distribution
- Upcoming meetings
- Recent meetings
- Quick actions

### API Endpoints

#### Meeting Management
- `getUserMeetings` - Get all user's meetings
- `getMeetingById` - Get specific meeting details
- `createMeeting` - Create a new meeting
- `updateMeetingStatus` - Update meeting status
- `deleteMeeting` - Delete a meeting
- `rsvpToMeeting` - Accept/decline meeting

#### Video Meeting
- `getRoomToken` - Get video room access token
- `startMeeting` - Start a meeting
- `endMeeting` - End a meeting
- `joinMeeting` - Join a meeting
- `leaveMeeting` - Leave a meeting

#### Video Meeting Analytics
- `getMeetingAnalytics` - Get meeting participation analytics
- `getVideoMeetingStats` - Get user's video meeting statistics
- `getRecentVideoMeetings` - Get recent video meetings
- `canJoinMeeting` - Check if user can join meeting

## Usage

### Creating a Meeting

```typescript
import { CreateMeetingForm } from '@/features/meetings/components'

function SchedulingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <CreateMeetingForm
      isOpen={showCreateForm}
      onClose={() => setShowCreateForm(false)}
      onSuccess={() => {
        // Handle successful meeting creation
      }}
    />
  )
}
```

### Joining a Video Meeting

```typescript
import { VideoMeetingRoom } from '@/features/meetings/components'

function MeetingPage() {
  const { data: meeting } = trpc.meetings.getMeetingById.useQuery({ meetingId })
  const { mutate: getRoomToken } = trpc.meetings.getRoomToken.useMutation()

  const handleJoinMeeting = () => {
    getRoomToken({ meetingId }, {
      onSuccess: (data) => {
        // Navigate to video meeting room
        router.push(`/dashboard/meeting/${meetingId}`)
      }
    })
  }

  return (
    <VideoMeetingRoom
      roomId={meeting.roomId}
      meetingId={meeting.id}
      token={roomToken}
      participantName={participantName}
      role={role}
      meetingTitle={meeting.title}
      onLeave={() => router.push('/dashboard/scheduling')}
    />
  )
}
```

### Displaying Meeting List

```typescript
import { MeetingList } from '@/features/meetings/components'

function SchedulingPage() {
  const { data: meetings } = trpc.meetings.getUserMeetings.useQuery()

  return (
    <MeetingList
      meetings={meetings}
      onRefresh={() => refetch()}
      onCreateMeeting={() => setShowCreateForm(true)}
    />
  )
}
```

## Configuration

### Environment Variables

```env
# Video SDK Configuration
VIDEO_SDK_API_KEY=your_video_sdk_api_key
VIDEO_SDK_SECRET=your_video_sdk_secret
```

### Database Schema

The system uses the following Prisma models:

```prisma
model Meeting {
  id          String        @id @default(cuid())
  title       String
  description String?
  date        DateTime
  duration    Int
  type        MeetingType
  status      MeetingStatus @default(PENDING)
  roomId      String?       // Video SDK room ID
  roomName    String?       // Video SDK room name
  createdBy   User          @relation(fields: [createdById], references: [id])
  participants MeetingParticipant[]
  // ... other fields
}

model MeetingParticipant {
  id        String @id @default(cuid())
  meetingId String
  userId    String
  role      String @default("PARTICIPANT")
  status    String @default("PENDING")
  joinedAt  DateTime?
  leftAt    DateTime?
  meeting   Meeting @relation(fields: [meetingId], references: [id])
  user      User    @relation(fields: [userId], references: [id])
}
```

## Video SDK Integration

The system integrates with Video SDK for reliable video conferencing:

### Room Creation
```typescript
import { createRoom } from '@/services/video-sdk'

const room = await createRoom("Meeting Room Name")
```

### Token Generation
```typescript
import { generateRoomToken } from '@/services/video-sdk'

const token = await generateRoomToken(roomId, participantName, role)
```

### Room Details
```typescript
import { getRoomDetails } from '@/services/video-sdk'

const roomDetails = await getRoomDetails(roomId)
```

## Styling

The components use Tailwind CSS with a consistent design system:

- **Colors**: Blue for primary actions, green for success, red for errors
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Typography**: Inter font family for readability
- **Dark Mode**: Full dark mode support with proper contrast

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Graceful handling of connection issues
- **Permission Errors**: Clear messages for camera/microphone access
- **Meeting Errors**: Validation and access control
- **Video SDK Errors**: Fallback mechanisms for video issues

## Performance

- **Lazy Loading**: Components load only when needed
- **Optimized Queries**: Efficient database queries with proper indexing
- **Real-time Updates**: WebSocket-like updates for live data
- **Caching**: Intelligent caching of meeting data

## Security

- **Authentication**: Protected routes and API endpoints
- **Authorization**: Role-based access control
- **Token Management**: Secure token generation and validation
- **Input Validation**: Comprehensive input validation with Zod

## Testing

The system includes comprehensive testing:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing
- **Video SDK Testing**: Mock video SDK for testing

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Video SDK account

### Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations: `npx prisma db push`
4. Start development server: `npm run dev`

### Production
1. Build the application: `npm run build`
2. Set up production environment variables
3. Deploy to your hosting platform
4. Configure Video SDK for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
