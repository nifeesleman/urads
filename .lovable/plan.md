
# Real-Time Messaging System Implementation Plan

## Overview
Build a complete real-time messaging system that enables advertisers and influencers to communicate about campaign discussions. The system will feature conversation threads, real-time message delivery, read receipts, and campaign context.

## Architecture

```text
+------------------+     +------------------+     +------------------+
|   Messages UI    |<--->|  useMessages     |<--->|    Supabase      |
|  (React Pages)   |     |    Hook          |     |  Real-time DB    |
+------------------+     +------------------+     +------------------+
        |                        |
        v                        v
+------------------+     +------------------+
| ConversationList |     | ChatWindow       |
| Component        |     | Component        |
+------------------+     +------------------+
```

## Database Status
The `messages` table already exists with real-time enabled:
- `id`, `sender_id`, `receiver_id`, `campaign_id`, `content`, `read`, `created_at`
- RLS policies are already configured for sender/receiver access
- Real-time publication is enabled via `supabase_realtime`

No database migrations needed - the schema is ready.

---

## Implementation Steps

### Step 1: Create Messages Hook (`src/hooks/useMessages.ts`)

A comprehensive hook to manage all messaging functionality:

**Features:**
- Fetch all conversations (grouped by participant)
- Fetch messages for a specific conversation
- Send new messages with validation
- Mark messages as read
- Real-time subscription for new messages
- Unread message count tracking

**Key Functions:**
- `useConversations()` - Get list of all conversations with last message preview
- `useConversationMessages(partnerId, campaignId?)` - Get messages in a thread
- `useSendMessage()` - Mutation to send a new message
- `useMarkAsRead()` - Mark messages as read when viewing
- Real-time channel subscription with proper cleanup

---

### Step 2: Create Conversation List Component (`src/components/messaging/ConversationList.tsx`)

**Features:**
- Display all conversations sorted by most recent
- Show partner's avatar, name, and last message preview
- Unread indicator badge for conversations with new messages
- Campaign context tag when conversation is linked to a campaign
- Click to select/open conversation
- Empty state for users with no messages

**UI Elements:**
- ScrollArea for the conversation list
- Avatar with fallback initials
- Truncated last message preview
- Relative timestamp (e.g., "2h ago")
- Active/selected state highlighting

---

### Step 3: Create Chat Window Component (`src/components/messaging/ChatWindow.tsx`)

**Features:**
- Message list with auto-scroll to newest
- Message bubbles with sender/receiver styling
- Timestamp display on messages
- Campaign context header when applicable
- Loading state for message history
- Empty state for new conversations

**UI Elements:**
- ScrollArea with message history
- Different bubble colors for sent vs received
- Avatar for received messages
- Grouped timestamps (show date headers)

---

### Step 4: Create Message Input Component (`src/components/messaging/MessageInput.tsx`)

**Features:**
- Text input with character limit validation (1000 chars max)
- Send button with loading state
- Enter key to send (Shift+Enter for newline)
- Input sanitization
- Disabled state when no conversation selected

**Validation:**
- Trim whitespace
- Prevent empty messages
- Character limit enforcement

---

### Step 5: Create New Conversation Dialog (`src/components/messaging/NewConversationDialog.tsx`)

**Features:**
- For advertisers: Select from influencers who applied to their campaigns
- For influencers: Select from advertisers whose campaigns they applied to
- Optional campaign context selection
- Search/filter participants

---

### Step 6: Update Advertiser Messages Page (`src/pages/advertiser/AdvertiserMessages.tsx`)

**Layout:**
- Two-column layout (conversation list | chat window)
- Responsive design (single column on mobile with navigation)
- Header with "New Message" button
- Integration with all messaging components

**Features:**
- Load conversations on mount
- Handle conversation selection
- Real-time updates for new messages
- Mark messages as read when conversation opened

---

### Step 7: Update Influencer Messages Page (`src/pages/influencer/InfluencerMessages.tsx`)

Same structure as advertiser page, with role-appropriate context and participants.

---

## Technical Details

### Real-Time Subscription Pattern
```text
supabase
  .channel('messages-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, handleNewMessage)
  .subscribe()
```

### Conversation Grouping Logic
Messages will be grouped by the "other participant" (sender or receiver that isn't the current user). If a campaign_id exists, conversations will also be groupable by campaign context.

### Message Types Definition
```text
interface Message {
  id: string
  sender_id: string
  receiver_id: string
  campaign_id: string | null
  content: string
  read: boolean
  created_at: string
  sender?: { name, avatar_url }
  receiver?: { name, avatar_url }
}

interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  campaignId: string | null
  campaignTitle: string | null
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useMessages.ts` | Main messaging hook with real-time |
| `src/components/messaging/ConversationList.tsx` | List of conversations |
| `src/components/messaging/ChatWindow.tsx` | Message display area |
| `src/components/messaging/MessageInput.tsx` | Text input component |
| `src/components/messaging/MessageBubble.tsx` | Individual message styling |
| `src/components/messaging/NewConversationDialog.tsx` | Start new chat |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/advertiser/AdvertiserMessages.tsx` | Full messaging UI |
| `src/pages/influencer/InfluencerMessages.tsx` | Full messaging UI |

---

## Security Considerations

- Input validation using Zod schema for message content
- Trim and sanitize message content before sending
- RLS policies already enforce that users can only see their own messages
- sender_id must match auth.uid() for inserts (enforced by RLS)
- No direct database access - all through typed Supabase client

---

## User Experience

1. **Entering Messages page**: See list of conversations on the left, empty chat area on right
2. **Selecting conversation**: Load message history, mark unread as read, show input
3. **Sending message**: Optimistic update, scroll to new message
4. **Receiving message**: Real-time notification, update conversation list order
5. **Starting new conversation**: Dialog to select participant and optional campaign context
