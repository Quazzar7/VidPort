const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error ?? res.statusText);
    }
    throw new Error(res.statusText);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

export const api = {
  auth: {
    register: (email: string, password: string, role: number) =>
      request<{ userId: string }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, role },
      }),

    login: (email: string, password: string) =>
      request<{ accessToken: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    refresh: () =>
      request<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' }),

    logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  },

  profiles: {
    getMe: () => request<ProfileDto>('/api/profiles/me'),

    update: (data: UpdateProfileRequest) =>
      request<void>('/api/profiles/me', { method: 'PUT', body: data }),

    setFeaturedVideo: (videoId: string | null) =>
      request<void>('/api/profiles/me/featured-video', { method: 'PATCH', body: { videoId } }),

    getBySlug: (slug: string) => request<ProfileDto>(`/api/profiles/${slug}`),

    getMyBookmarks: () => request<BookmarkDto[]>('/api/profiles/me/bookmarks'),

    upsertWorkExperience: (data: UpsertWorkExperienceRequest) =>
      request<{ id: string }>('/api/profiles/me/work-experience', { method: 'POST', body: data }),

    deleteWorkExperience: (id: string) =>
      request<void>(`/api/profiles/me/work-experience/${id}`, { method: 'DELETE' }),

    upsertEducation: (data: UpsertEducationRequest) =>
      request<{ id: string }>('/api/profiles/me/education', { method: 'POST', body: data }),

    deleteEducation: (id: string) =>
      request<void>(`/api/profiles/me/education/${id}`, { method: 'DELETE' }),

    upsertProject: (data: UpsertProjectRequest) =>
      request<{ id: string }>('/api/profiles/me/projects', { method: 'POST', body: data }),

    deleteProject: (id: string) =>
      request<void>(`/api/profiles/me/projects/${id}`, { method: 'DELETE' }),
  },

  uploads: {
    getMyVideos: () => request<VideoDto[]>('/api/uploads/my-videos'),

    getUploadUrl: (type: number, contentType: string) =>
      request<UploadUrlResponse>('/api/uploads/video-url', {
        method: 'POST',
        body: { type, contentType },
      }),

    complete: (videoId: string) =>
      request<void>(`/api/uploads/complete/${videoId}`, { method: 'POST' }),

    updateDuration: (videoId: string, durationSeconds: number) =>
      request<void>(`/api/uploads/${videoId}/duration`, { method: 'PATCH', body: { durationSeconds } }),

    deleteVideo: (videoId: string) =>
      request<void>(`/api/uploads/${videoId}`, { method: 'DELETE' }),
  },

  feed: {
    getGeneral: (page = 1) => request<FeedVideoDto[]>(`/api/feed?page=${page}&pageSize=20`),
    getShorts: (page = 1) => request<FeedVideoDto[]>(`/api/feed/shorts?page=${page}&pageSize=10`),
  },

  search: {
    creators: (q: string, filters?: SearchFilters) => {
      const params = new URLSearchParams({ q });
      if (filters?.availability != null) params.set('availability', String(filters.availability));
      if (filters?.location) params.set('location', filters.location);
      if (filters?.skill) params.set('skill', filters.skill);
      return request<CreatorSearchResultDto[]>(`/api/search/creators?${params}`);
    },
  },

  social: {
    toggleLike: (videoId: string) =>
      request<{ liked: boolean }>(`/api/social/videos/${videoId}/like`, { method: 'POST' }),

    toggleSubscribe: (creatorProfileId: string) =>
      request<{ subscribed: boolean }>(`/api/social/profiles/${creatorProfileId}/subscribe`, { method: 'POST' }),

    toggleVideoBookmark: (videoId: string) =>
      request<{ bookmarked: boolean }>(`/api/social/videos/${videoId}/bookmark`, { method: 'POST' }),

    toggleProfileBookmark: (profileId: string) =>
      request<{ bookmarked: boolean }>(`/api/social/profiles/${profileId}/bookmark`, { method: 'POST' }),

    getLikedVideos: () => request<FeedVideoDto[]>('/api/social/liked-videos'),

    getSubscriptions: () => request<SubscribedCreatorDto[]>('/api/social/subscriptions'),
  },

  jobs: {
    getInsights: () => request<JobInsightDto[]>('/api/jobs/insights'),
    getTrends: () => request<JobTrendDto[]>('/api/jobs/trends'),
    getRecommendations: () => request<JobRecommendationDto[]>('/api/jobs/recommendations'),
    match: (profile: UserExpertiseProfile) => request<JobMatchDto[]>('/api/jobs/match', { method: 'POST', body: profile }),
  },

  ai: {
    analyzeJob: (job: AiJobDetails) =>
      request<AiJobAnalysis>('/api/ai/analyze-job', { method: 'POST', body: { job } }),
    coverLetter: (job: AiJobDetails, profile: AiUserProfile) =>
      request<AiCoverLetter>('/api/ai/cover-letter', { method: 'POST', body: { job, profile } }),
    interviewPrep: (job: AiJobDetails, profile: AiUserProfile) =>
      request<AiInterviewPrep>('/api/ai/interview-prep', { method: 'POST', body: { job, profile } }),
  },

  communications: {
    getThreads: () => request<CommunicationThreadDto[]>('/api/communications/threads'),
    
    getMessages: (threadId: string) => 
      request<CommunicationMessageDto[]>(`/api/communications/threads/${threadId}/messages`),

    getSchedule: () => request<CommunicationMessageDto[]>('/api/communications/schedule'),

    getBlockedSlots: () => request<BlockedSlotDto[]>('/api/communications/blocked-slots'),

    createBlockedSlot: (startTime: string, endTime: string, reason?: string) =>
      request<BlockedSlotDto>('/api/communications/blocked-slots', {
        method: 'POST',
        body: { startTime, endTime, reason }
      }),

    deleteBlockedSlot: (id: string) =>
      request<void>(`/api/communications/blocked-slots/${id}`, { method: 'DELETE' }),
    
    initiate: (recipientProfileId: string, type: number, content: string, scheduledAt?: string, durationMinutes?: number, meetingLink?: string) =>
      request<CommunicationThreadDto>('/api/communications/initiate', {
        method: 'POST',
        body: { recipientProfileId, type, content, scheduledAt, durationMinutes, meetingLink }
      }),
    
    sendMessage: (threadId: string, type: number, content: string, scheduledAt?: string, durationMinutes?: number, meetingLink?: string) =>
      request<CommunicationMessageDto>(`/api/communications/threads/${threadId}/messages`, {
        method: 'POST',
        body: { type, content, scheduledAt, durationMinutes, meetingLink }
      }),

    updateMessage: (messageId: string, content: string, scheduledAt?: string, durationMinutes?: number, meetingLink?: string) =>
      request<CommunicationMessageDto>(`/api/communications/messages/${messageId}`, {
        method: 'PUT',
        body: { content, scheduledAt, durationMinutes, meetingLink }
      }),
  },
};

// ── DTOs & Request Types ──────────────────────────────────────────────────────

export enum CommunicationType {
  Chat = 0,
  Email = 1,
  SMS = 2,
  WhatsApp = 3,
  Call = 4,
  Meeting = 5,
  Interview = 6
}

export interface CommunicationMessageDto {
  id: string;
  threadId: string;
  senderProfileId: string;
  senderHeadline: string;
  type: CommunicationType;
  content: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  meetingLink: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface BlockedSlotDto {
  id: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export interface CommunicationThreadDto {
  id: string;
  otherProfileId: string;
  otherHeadline: string;
  otherSlug: string;
  updatedAt: string;
  lastMessage: CommunicationMessageDto | null;
}

export interface SkillDto {
  name: string;
  stars: number | null;
}

export interface WorkExperienceDto {
  id: string;
  company: string;
  role: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  sortOrder: number;
}

export interface EducationDto {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  graduationYear: number | null;
  grade: string | null;
  description: string | null;
  sortOrder: number;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  techStack: string[];
  completionPercentage: number;
  statusDescription: string | null;
  videoId: string | null;
  videoUrl: string | null;
  sortOrder: number;
}

export interface ProfileDto {
  id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  phoneNumber: string | null;
  availabilityStatus: number;
  skills: SkillDto[];
  featuredVideoId: string | null;
  featuredVideoUrl: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
  role: number;
  workExperiences: WorkExperienceDto[];
  educations: EducationDto[];
  projects: ProjectDto[];
}

export interface UpdateProfileRequest {
  headline: string | null;
  bio: string | null;
  location: string | null;
  phoneNumber: string | null;
  availabilityStatus: number;
  skills: { name: string; stars: number | null }[];
}

export interface UpsertWorkExperienceRequest {
  id?: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string;
}

export interface UpsertEducationRequest {
  id?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number | null;
  graduationYear?: number | null;
  grade?: string;
  description?: string;
}

export interface UpsertProjectRequest {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  techStack: string[];
  completionPercentage: number;
  statusDescription?: string;
  videoId?: string | null;
}

export interface VideoDto {
  id: string;
  type: number;
  status: number;
  s3Key: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  createdAt: string;
}

export interface UploadUrlResponse {
  videoId: string;
  uploadUrl: string;
  key: string;
}

export interface FeedVideoDto {
  id: string;
  type: number;
  videoUrl: string;
  durationSeconds: number | null;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  isBookmarkedByMe: boolean;
  creatorProfileId: string;
  creatorSlug: string;
  creatorHeadline: string | null;
  isSubscribedToCreator: boolean;
}

export interface CreatorSearchResultDto {
  profileId: string;
  slug: string;
  email: string;
  headline: string | null;
  location: string | null;
  availabilityStatus: number;
  topSkills: SkillDto[];
  currentRole: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
}

export interface SearchFilters {
  availability?: number;
  location?: string;
  skill?: string;
}

export interface BookmarkDto {
  id: string;
  kind: string;
  videoId: string | null;
  videoUrl: string | null;
  videoType: string | null;
  bookmarkedProfileId: string | null;
  bookmarkedProfileSlug: string | null;
  bookmarkedProfileHeadline: string | null;
  createdAt: string;
}

export interface SubscribedCreatorDto {
  profileId: string;
  slug: string;
  headline: string | null;
  location: string | null;
  subscriberCount: number;
  subscribedAt: string;
}

// ── Job Intelligence ─────────────────────────────────────────────────────────

export interface JobInsightDto {
  id: string;
  type: string;
  title: string;
  body: string;
  generatedAt: string;
}

export interface JobTrendDto {
  skill: string;
  jobCount: number;
  weekOverWeekChange: number;
}

export interface UserExpertiseProfile {
  role: string;
  experienceLevel: string;
  skills: string[];
  minSalary?: number;
}

export interface JobMatchDto {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salaryRange?: string;
  score: number;
  url?: string;
}

export interface JobRecommendationDto {
  id: string;
  title: string;
  company: string;
  location?: string;
  skills?: string[];
  source: string;
  postedAt: string;
}

// ── AI types ──────────────────────────────────────────────────────────────────
export interface AiJobDetails {
  title: string;
  company: string;
  location?: string;
  skills?: string[];
  description?: string;
  source?: string;
}

export interface AiUserProfile {
  role: string;
  experienceLevel: string;
  skills: string[];
}

export interface AiJobAnalysis {
  verdict: string;
  verdictReason: string;
  keyRequirements: string[];
  redFlags: string[];
  applicationTips: string[];
  estimatedSalary: string;
  difficultyLevel: string;
  whyApply: string;
}

export interface AiCoverLetter {
  subject: string;
  body: string;
}

export interface AiInterviewQuestion {
  type: string;
  question: string;
  modelAnswer: string;
  tip: string;
}

export interface AiInterviewPrep {
  questions: AiInterviewQuestion[];
}

export const AVAILABILITY_LABELS: Record<number, string> = {
  0: 'Open to Work',
  1: 'Open to Opportunities',
  2: 'Not Available',
};
