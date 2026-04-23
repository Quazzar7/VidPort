const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    creators: (q: string) => request<CreatorSearchResultDto[]>(`/api/search/creators?q=${encodeURIComponent(q)}`),
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
  },
};

export interface ProfileDto {
  id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  phoneNumber: string | null;
  availabilityStatus: number;
  skills: string[];
  featuredVideoId: string | null;
  subscriberCount: number;
  isSubscribed: boolean;
}

export interface UpdateProfileRequest {
  headline: string | null;
  bio: string | null;
  location: string | null;
  phoneNumber: string | null;
  availabilityStatus: number;
  skills: string[];
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
  phoneNumber: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  subscriberCount: number;
  isSubscribed: boolean;
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
