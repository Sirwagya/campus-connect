# Campus Connect - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Database Schema](#database-schema)
6. [API Layer](#api-layer)
7. [Real-time Features](#real-time-features)
8. [Integration System](#integration-system)
9. [File Upload System](#file-upload-system)
10. [Deployment Architecture](#deployment-architecture)

---

## Architecture Overview

Campus Connect is a full-stack TypeScript application built with:

- **Frontend**: Next.js 16 (App Router) with React Server Components
- **Backend**: Next.js API Routes + Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth (Google)
- **Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Styling**: Tailwind CSS + Radix UI + Framer Motion

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ React Pages  │  │  UI Components│  │ Client State │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 16 Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ API Routes   │  │Server Actions│  │  Middleware  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │   Auth API   │  │   Storage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Realtime   │  │   Functions  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Integrations                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   GitHub API │  │   Gmail API  │  │ Coding Sites │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### 1. Database Layer (Supabase PostgreSQL)

**Core Tables:**

#### Users & Authentication

```sql
-- users table (managed by Supabase Auth)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Extended profile data
profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  tagline TEXT,
  cover_url TEXT,
  avatar_url TEXT,
  visibility TEXT DEFAULT 'public', -- 'public' | 'private'
  social_links JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Events System

```sql
events (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  start_ts TIMESTAMP,
  end_ts TIMESTAMP,
  location TEXT,
  image_path TEXT,
  capacity INTEGER,
  participants_count INTEGER DEFAULT 0,
  registration_type TEXT, -- 'solo' | 'team' | 'both'
  min_team_size INTEGER,
  max_team_size INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
)

event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  form_response_id UUID,
  registered_at TIMESTAMP,
  UNIQUE(event_id, user_id)
)

teams (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  name TEXT,
  code TEXT UNIQUE,
  leader_id UUID REFERENCES users(id),
  created_at TIMESTAMP
)

team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT DEFAULT 'pending',
  UNIQUE(team_id, user_id)
)
```

#### Social Feed

```sql
posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT,
  attachments JSONB,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP
)

likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  UNIQUE(post_id, user_id)
)
```

#### Spaces (Groups/Clubs)

```sql
spaces (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  type TEXT DEFAULT 'club', -- 'club' | 'global'
  visibility TEXT DEFAULT 'public', -- 'public' | 'private'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
)

space_members (
  id UUID PRIMARY KEY,
  space_id UUID REFERENCES spaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member', -- 'admin' | 'member'
  joined_at TIMESTAMP,
  UNIQUE(space_id, user_id)
)

messages (
  id UUID PRIMARY KEY,
  space_id UUID REFERENCES spaces(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  attachments JSONB,
  created_at TIMESTAMP
)
```

#### Coding Stats & Integrations

```sql
coding_stats_unified (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_xp INTEGER DEFAULT 0,
  github_contributions INTEGER,
  leetcode_solved INTEGER,
  leetcode_ranking INTEGER,
  codeforces_rating INTEGER,
  codeforces_rank TEXT,
  hackerrank_badges INTEGER,
  codechef_rating INTEGER,
  total_commits INTEGER,
  current_streak INTEGER,
  last_updated TIMESTAMP
)

profile_integrations (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  platform TEXT, -- 'github' | 'leetcode' | etc.
  username TEXT,
  is_public BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

#### Portfolio Data

```sql
profile_projects (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  title TEXT,
  description TEXT,
  image_url TEXT,
  github_url TEXT,
  demo_url TEXT,
  tech_stack TEXT[],
  created_at TIMESTAMP
)

profile_experience (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  role TEXT,
  company TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TIMESTAMP
)

profile_education (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  degree TEXT,
  institution TEXT,
  start_year TEXT,
  end_year TEXT,
  created_at TIMESTAMP
)

profile_skills (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  skill_name TEXT,
  category TEXT,
  proficiency TEXT,
  created_at TIMESTAMP
)
```

### 2. Row Level Security (RLS)

Supabase uses PostgreSQL RLS for granular access control:

```sql
-- Example: Posts are publicly readable, but only the owner can modify
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Private profiles are only visible to the owner
CREATE POLICY "Private profiles are only visible to owner"
  ON profiles FOR SELECT
  USING (
    visibility = 'public' OR
    auth.uid() = id
  );
```

### 3. Database Functions

**Custom PostgreSQL functions for atomic operations:**

```sql
-- Increment participant count atomically
CREATE OR REPLACE FUNCTION increment_participant_count(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET participants_count = participants_count + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Check if user is admin
CREATE OR REPLACE FUNCTION am_i_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Frontend Architecture

### 1. Next.js App Router Structure

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx              # Login page
├── admin/
│   └── events/
│       └── page.tsx              # Admin event management
├── alerts/
│   └── page.tsx                  # Email alerts inbox
├── api/                          # API Routes
│   ├── admin/
│   ├── alerts/
│   ├── auth/
│   ├── events/
│   ├── feed/
│   ├── notifications/
│   ├── profiles/
│   └── spaces/
├── events/
│   ├── [id]/
│   │   └── page.tsx              # Event details
│   └── page.tsx                  # Events hub
├── feed/
│   └── page.tsx                  # Social feed
├── profile/
│   ├── [id]/
│   │   └── page.tsx              # Public profile
│   └── edit/
│       └── page.tsx              # Profile editor
├── spaces/
│   ├── [slug]/
│   │   └── page.tsx              # Space chat
│   └── page.tsx                  # Spaces discovery
├── layout.tsx                    # Root layout
└── page.tsx                      # Home dashboard
```

### 2. Component Architecture

**Component Hierarchy:**

```
Layout (Server Component)
├── Sidebar (Client Component)
├── BottomNav (Client Component)
└── Page (Server Component)
    ├── Server-fetched data
    └── Client Interactive Components
        ├── Forms
        ├── Modals
        └── Real-time subscriptions
```

**Key Components:**

#### Server Components (RSC)

```tsx
// app/page.tsx - Server Component
export default async function HomePage() {
  // Fetch data on the server
  const { events, posts } = await getDashboardData();

  return (
    <div>
      <FeaturedEvents events={events} />
      <TrendingFeed posts={posts} />
    </div>
  );
}
```

#### Client Components

```tsx
// components/feed/PostCard.tsx - Client Component
"use client";

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked_by_user);

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);

    // API call
    await fetch(`/api/feed/${post.id}/like`, {
      method: liked ? "DELETE" : "POST",
    });
  };

  return (
    <Card>
      <button onClick={handleLike}>
        {liked ? <HeartFilled /> : <Heart />}
      </button>
    </Card>
  );
}
```

### 3. State Management

**Server State:**

- React Server Components for initial data
- Server Actions for mutations
- `router.refresh()` for revalidation

**Client State:**

- React hooks (`useState`, `useEffect`)
- Context API for auth (`AuthProvider`)
- Optimistic updates for UX

**Real-time State:**

- Supabase Realtime subscriptions for live updates

```tsx
useEffect(() => {
  const channel = supabase
    .channel("messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `space_id=eq.${spaceId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [spaceId]);
```

---

## Authentication Flow

### 1. OAuth Flow (Google)

```
User clicks "Sign in with Google"
        ↓
Redirect to Supabase Auth URL
        ↓
Google OAuth consent screen
        ↓
Redirect to /api/auth/callback
        ↓
Exchange code for session
        ↓
Set HTTP-only cookie
        ↓
Redirect to /feed (or original destination)
```

### 2. Session Management

**Server-side:**

```tsx
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

**Client-side:**

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 3. Middleware Protection

```tsx
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...);
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/feed')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data } = await supabase.rpc('am_i_admin');
    if (!data) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}
```

---

## API Layer

### 1. API Routes Structure

**Pattern: `/api/[resource]/[id]/[action]/route.ts`**

Example:

```tsx
// app/api/events/[id]/register/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();
  const { id: eventId } = await params;
  const body = await request.json();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Business logic
  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: user.id,
    ...body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 2. Server Actions

**Alternative to API routes for mutations:**

```tsx
// app/actions/events.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function registerForEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, user_id: user.id });

  revalidatePath(`/events/${eventId}`);
}
```

**Usage in components:**

```tsx
import { registerForEvent } from "@/app/actions/events";

function RegisterButton({ eventId }: { eventId: string }) {
  return (
    <form action={() => registerForEvent(eventId)}>
      <button type="submit">Register</button>
    </form>
  );
}
```

---

## Real-time Features

### 1. Space Chat (WebSocket)

```tsx
// components/spaces/SpaceChatClient.tsx
"use client";

export function SpaceChatClient({ spaceId, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`space:${spaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  return <MessageList messages={messages} />;
}
```

### 2. Live Notifications

```tsx
// components/NotificationBell.tsx
"use client";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return <Bell count={unreadCount} />;
}
```

---

## Integration System

### 1. GitHub Integration

**Contribution Graph:**

```tsx
// components/profile/GitHubHeatmap.tsx
export function GitHubHeatmap({ githubUrl }) {
  const username = extractUsername(githubUrl);

  // Using third-party service (ghchart.rshah.org)
  return (
    <img
      src={`https://ghchart.rshah.org/${username}`}
      alt="GitHub Contributions"
    />
  );
}
```

**Stats Fetching (Backend):**

```tsx
// lib/profile/integrations.ts
export async function fetchGitHubStats(username: string) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          user(login: "${username}") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `,
    }),
  });

  const data = await response.json();
  return data.data.user.contributionsCollection;
}
```

### 2. LeetCode Integration

**Web Scraping approach:**

```tsx
export async function fetchLeetCodeStats(username: string) {
  const response = await fetch(`https://leetcode.com/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
          query {
            matchedUser(username: "${username}") {
              submitStats {
                acSubmissionNum {
                  count
                }
              }
            }
          }
        `,
    }),
  });

  return response.json();
}
```

### 3. XP Calculation System

```tsx
// lib/profile/leveling.ts
export function calculateTotalXP(stats: CodingStats) {
  const githubXP = (stats.github_contributions || 0) * 0.5;
  const leetcodeXP = (stats.leetcode_solved || 0) * 1;
  const codeforcesXP = (stats.codeforces_rating || 0) / 10;
  const hackerrankXP = (stats.hackerrank_badges || 0) * 15;

  return Math.floor(githubXP + leetcodeXP + codeforcesXP + hackerrankXP);
}

export function calculateLevel(totalXP: number) {
  const LEVELS = [
    { name: "Beginner", minXP: 0 },
    { name: "Bronze", minXP: 100 },
    { name: "Silver", minXP: 500 },
    { name: "Gold", minXP: 1500 },
    { name: "Platinum", minXP: 3000 },
    { name: "Diamond", minXP: 6000 },
    { name: "Elite", minXP: 10000 },
    { name: "Legend", minXP: 20000 },
  ];

  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].minXP) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
    }
  }

  const progress = nextLevel
    ? ((totalXP - currentLevel.minXP) /
        (nextLevel.minXP - currentLevel.minXP)) *
      100
    : 100;

  return { currentLevel, nextLevel, progress };
}
```

---

## File Upload System

### 1. Supabase Storage

**Storage Structure:**

```
campus-connect/
├── avatars/
│   └── {user_id}/{filename}
├── event-banners/
│   └── {event_id}/{filename}
└── post-attachments/
    └── {post_id}/{filename}
```

**Upload API:**

```tsx
// app/api/feed/upload/route.ts
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Generate unique filename
  const filename = `${Date.now()}-${file.name}`;
  const path = `${user.id}/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("post-attachments")
    .upload(path, file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("post-attachments").getPublicUrl(path);

  return NextResponse.json({
    url: publicUrl,
    path: data.path,
  });
}
```

### 2. Image Optimization

**Using Next.js Image component:**

```tsx
import Image from "next/image";

<Image
  src={post.attachments[0].url}
  alt="Post image"
  width={600}
  height={400}
  className="rounded-lg"
  priority={false}
  loading="lazy"
/>;
```

---

## Deployment Architecture

### 1. Vercel Deployment

**Configuration:**

```json
// vercel.json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Environment Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://campus-connect.vercel.app
```

### 2. Supabase Configuration

**Database:**

- Hosted PostgreSQL instance
- Connection pooling enabled
- RLS policies enforced
- Automatic backups

**Storage:**

- S3-compatible object storage
- CDN distribution
- Access control via RLS

**Auth:**

- JWT-based sessions
- HTTP-only cookies
- PKCE flow for OAuth

### 3. Performance Optimizations

**Next.js:**

- Static Generation (SSG) for marketing pages
- Server Components for data fetching
- Streaming for gradual page loading
- Route prefetching
- Image optimization

**Caching:**

```tsx
// Force dynamic rendering
export const dynamic = "force-dynamic";

// Revalidate every hour
export const revalidate = 3600;

// Cache API responses
const response = await fetch(url, {
  next: { revalidate: 60 },
});
```

**Database:**

- Indexes on foreign keys
- Materialized views for complex queries
- Connection pooling
- Query optimization

---

## Security Measures

### 1. Authentication

- HTTP-only cookies (XSS protection)
- CSRF protection via Supabase
- Domain validation (`@vedamsot.org`)
- Session expiration

### 2. Authorization

- Row Level Security (RLS)
- Role-based access control
- Private profile visibility
- Admin-only routes

### 3. Input Validation

- Server-side validation
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)
- File upload restrictions

### 4. Data Protection

- HTTPS only
- Encrypted database connections
- Secure storage URLs
- Environment variable protection

---

## Monitoring & Analytics

### 1. Error Tracking

```tsx
// Global error boundary
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application error:", error);
  }, [error]);

  return <ErrorDisplay error={error} onReset={reset} />;
}
```

### 2. Performance Monitoring

- Next.js Analytics (Vercel)
- Web Vitals tracking
- API response times
- Database query performance

---

**Built with ❤️ by Team V5**