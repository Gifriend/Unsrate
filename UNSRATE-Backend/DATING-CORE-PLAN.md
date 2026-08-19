# UNSRATE Backend - Dating Core Implementation Plan

## Overview

This document outlines the implementation plan for the core dating functionality of the UNSRATE campus dating application. The plan covers the key modules, features, API endpoints, and development phases required to build a robust dating platform.

## Core Modules

### 1. Discovery Module

**Purpose**: Find potential matches for users based on preferences and interests

```
src/discovery/
  ├── discovery.module.ts
  ├── discovery.controller.ts
  ├── discovery.service.ts
  ├── dto/
  │   └── discovery-filter.dto.ts
  │   └── discovery-response.dto.ts
  └── interfaces/
      └── recommendation.interface.ts
```

**Key Features**:
- Algorithm for suggesting potential matches based on:
  - Gender preference
  - Age range preference
  - Faculty/program compatibility (optional)
  - Shared interests
- Filtering system for user-defined criteria
- Exclusion of previously swiped profiles
- Weighted scoring for interest matching
- Pagination for discovery results

### 2. Swipe Module

**Purpose**: Handle user swipes and create matches when mutual interest is detected

```
src/swipe/
  ├── swipe.module.ts
  ├── swipe.controller.ts
  ├── swipe.service.ts
  └── dto/
      ├── create-swipe.dto.ts
      └── swipe-response.dto.ts
```

**Key Features**:
- Create swipe records (LIKE/DISLIKE)
- Prevent duplicate swipe actions
- Match creation logic when mutual likes are detected
- Transaction handling to ensure data integrity
- Event emission for match creation

### 3. Match Module

**Purpose**: Manage user matches and interactions

```
src/match/
  ├── match.module.ts
  ├── match.controller.ts
  ├── match.service.ts
  ├── match.gateway.ts (for WebSocket notifications)
  └── dto/
      ├── match.dto.ts  
      └── match-list.dto.ts
```

**Key Features**:
- Retrieve all matches for a user with pagination
- Get detailed match information
- Sort matches by recency or activity
- Unmatch functionality
- Match statistics (total matches, active conversations)
- Real-time match notifications

### 4. Message Module

**Purpose**: Handle messaging between matched users

```
src/message/
  ├── message.module.ts
  ├── message.controller.ts
  ├── message.service.ts
  ├── message.gateway.ts (for WebSockets)
  └── dto/
      ├── create-message.dto.ts
      ├── message.dto.ts
      └── message-pagination.dto.ts
```

**Key Features**:
- Send and receive messages between matched users
- Message history retrieval with pagination
- Real-time messaging with WebSockets
- Read receipts
- Message status tracking (sent, delivered, read)
- Typing indicators

## Database Integration

The application will leverage the existing Prisma schema with the following models:
- `User` - For user profiles and preferences
- `Swipe` - For recording user swipe actions
- `Match` - For managing user matches
- `Message` - For storing conversation messages

## API Endpoints

### Discovery Endpoints
```
GET    /discovery                   - Get potential matches based on preferences
POST   /discovery/filters           - Update discovery filters
```

### Swipe Endpoints
```
POST   /swipes                     - Create a new swipe
GET    /swipes/stats               - Get swipe statistics
```

### Match Endpoints
```
GET    /matches                    - Get all matches for current user
GET    /matches/:id                - Get specific match details
DELETE /matches/:id                - Unmatch from a user
```

### Message Endpoints
```
GET    /messages/:matchId          - Get messages for a specific match
POST   /messages/:matchId          - Send a new message
PATCH  /messages/:matchId/:msgId   - Mark message as read
```

## WebSocket Events

```
match.created      - When a new match is formed
message.new        - When a new message is received
message.read       - When a message is read
user.typing        - When a user is typing
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Set up module structures and base files
2. Implement DTOs and interfaces
3. Create basic database operations for each module
4. Set up controllers with endpoint definitions

### Phase 2: Core Functionality (Week 3-4)
1. Implement discovery algorithm with basic filtering
2. Create swipe functionality with match detection
3. Build match listing and details endpoints
4. Implement basic messaging (REST API only)

### Phase 3: Real-time Features (Week 5-6)
1. Set up WebSocket gateways for real-time communication
2. Implement real-time messaging
3. Add typing indicators and read receipts
4. Add notifications for new matches and messages

### Phase 4: Optimization & Enhancement (Week 7-8)
1. Refine the matching algorithm with weighted scoring
2. Implement caching for discovery results
3. Add pagination and performance optimizations
4. Perform security audits and testing

## Technical Considerations

### Security
- Ensure proper authentication for all endpoints
- Implement rate limiting for swipe and message endpoints
- Add validation to prevent unauthorized access to matches/messages

### Performance
- Cache frequently accessed data (potential matches, active conversations)
- Use pagination for all list-returning endpoints
- Optimize database queries with proper indexes

### Real-time Communication
- Use NestJS Gateways with Socket.io for WebSockets
- Implement connection pooling to manage active connections
- Consider Redis for scaling WebSockets across multiple instances

### Testing
- Create unit tests for core business logic
- Implement integration tests for key user flows
- Develop end-to-end tests for critical dating features

## Next Steps

1. Implement Discovery module
2. Implement Swipe module with match creation logic
3. Build Match management functionality
4. Develop messaging system with real-time capabilities
5. Integrate all modules and test the complete dating flow