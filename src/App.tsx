/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  User, 
  Search, 
  Filter, 
  Play, 
  ChevronRight, 
  Bell, 
  Menu,
  ArrowLeft,
  Download,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  X,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Info,
  Eye,
  Mail,
  Lock,
  ChevronDown,
  ExternalLink,
  Headphones,
  Pause,
  PictureInPicture2,
  Volume2,
  Waves,
  WifiOff,
  RefreshCw,
  Smartphone
  ,Upload,
  Phone,
  FlaskConical,
  Maximize,
  VolumeX,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    };
  }
}

// --- Types ---
type Screen = 'home' | 'courses' | 'notes' | 'quiz' | 'profile' | 'settings' | 'profile-edit' | 'help-center' | 'support-chat' | 'my-courses' | 'offline-notes' | 'about-us' | 'about-developer' | 'privacy-policy' | 'admin' | 'video-player' | 'note-viewer' | 'course-details' | 'binaural-beats' | 'live-classes' | 'live-class-viewer';

const APP_SHARE_URL = 'https://play.google.com/store/apps/details?id=com.monto.app';
const APP_SHARE_TEXT = 'Download Monto for premium chemistry learning, notes, quizzes, and live classes.';

type YoutubePlayerApi = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setPlaybackRate: (speed: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

type YoutubeWindow = Window & {
  YT?: {
    Player: new (
      element: HTMLElement,
      config: {
        videoId: string;
        playerVars: Record<string, string | number>;
        events?: Record<string, (event: { data?: number; target?: YoutubePlayerApi }) => void>;
      }
    ) => YoutubePlayerApi;
    PlayerState?: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
      BUFFERING: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
  Android?: {
    lockLandscape?: () => void;
    lockPortrait?: () => void;
    unlockOrientation?: () => void;
    enterVideoFullscreen?: () => void;
    exitVideoFullscreen?: () => void;
    enterPipMode?: () => void;
  };
};

type AppOrientationLock = 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: AppOrientationLock) => Promise<void>;
};

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  duration: string;
  note_content: string;
  note_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  download_url?: string;
  download_label?: string;
  download_enabled?: boolean;
  sort_order?: number;
}

interface Course {
  id: string;
  title: string;
  lessons: number;
  image: string;
  description?: string;
  price?: number;
  oldPrice?: number;
  type: 'free' | 'premium';
  category: string;
  lessonList?: Lesson[];
}

interface Note {
  id: string;
  title: string;
  lessons: number;
  category: string;
  type?: 'free' | 'premium';
  url?: string;
  content?: string;
}

type QuizOption = string | {
  type?: string;
  value?: string;
  text?: string;
  label?: string;
  option?: string;
  image_url?: string;
  imageUrl?: string;
  image?: string;
};

interface Question {
  id: string;
  quiz_id?: string;
  text: string;
  question?: string;
  subject?: string;
  chapter?: string;
  question_type?: string;
  difficulty?: string;
  options: QuizOption[];
  option_images?: string[];
  correctAnswer: number;
  correct_answer?: number;
  explanation?: string;
  image_url?: string;
}

interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
}

interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  meeting_url: string;
  scheduled_at: string;
  access_type: 'free' | 'premium';
  audience_type: 'all' | 'course' | 'selected';
  course_id?: string;
  selected_user_ids: string[];
  is_active: boolean;
  created_at?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  classLevel?: 'class-11' | 'class-12';
  status?: string;
  userCategory?: 'free' | 'premium';
  grantedCourseIds?: string[];
  blockedCourseIds?: string[];
  deviceId?: string;
  deviceLabel?: string;
  deviceBoundAt?: string;
  deviceLocked?: boolean;
}

interface StoredUser extends AuthUser {
  password: string;
}

interface AdminUser extends AuthUser {
  grantedCourseIds: string[];
  blockedCourseIds: string[];
  password?: string;
  [key: string]: unknown;
}

interface AdminAccount {
  id: string;
  role?: AdminRole;
  username: string;
  password: string;
  createdAt: number;
}

type AdminRole = 'admin' | 'superadmin';

interface AdminSession {
  role: AdminRole;
  username: string;
  token: string;
  rememberMe?: boolean;
}

interface AppControlSettings {
  appName: string;
  welcomeEnabled: boolean;
  welcomeMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdate: boolean;
  latestVersion: string;
  updateUrl: string;
  screenProtection: boolean;
  screenProtectionScope?: 'global' | 'premium';
  videoProtectionEnabled: boolean;
  videoNotesEnabled: boolean;
  videoDownloadEnabled: boolean;
  offlinePage: boolean;
  splashEnabled: boolean;
  pushEnabled: boolean;
  notificationTitle: string;
  notificationBody: string;
  notificationId?: string;
  notificationSentAt?: string;
}

type StudentClassLevel = 'class-11' | 'class-12';

const STUDENT_CLASS_OPTIONS: Array<{ value: StudentClassLevel; label: string }> = [
  { value: 'class-11', label: 'Class 11' },
  { value: 'class-12', label: 'Class 12' },
];

const normalizeStudentClassLevel = (value: unknown): StudentClassLevel => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  return normalized === 'class-11' || normalized === '11' ? 'class-11' : 'class-12';
};

const getStudentClassLabel = (value: unknown) =>
  STUDENT_CLASS_OPTIONS.find((item) => item.value === normalizeStudentClassLevel(value))?.label || 'Class 12';

const getClassLevelFromText = (value: string): StudentClassLevel | '' => {
  const normalized = value.toLowerCase();
  if (/\bclass\s*11\b|\bgrade\s*11\b|\b11th\b/.test(normalized)) return 'class-11';
  if (/\bclass\s*12\b|\bgrade\s*12\b|\b12th\b/.test(normalized)) return 'class-12';
  return '';
};

const matchesStudentClass = (text: string, classLevel?: string) => {
  const itemClass = getClassLevelFromText(text);
  return !itemClass || itemClass === normalizeStudentClassLevel(classLevel);
};

const courseMatchesStudentClass = (course: Course, classLevel?: string) =>
  matchesStudentClass(`${course.title} ${course.category}`, classLevel);

const noteMatchesStudentClass = (note: Note, classLevel?: string) =>
  matchesStudentClass(`${note.title} ${note.category} ${note.content || ''}`, classLevel);

const quizMatchesStudentClass = (quiz: Quiz, classLevel?: string) =>
  matchesStudentClass(quiz.topic, classLevel);

interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  screen: string;
  targetUserIds: string[];
  totalDevices: number;
  sent: number;
  failed: number;
  credentialMissing: boolean;
  sentAt: string;
}

interface StudentNotificationItem {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  screen?: Screen | 'home';
  type?: string;
  data?: Record<string, unknown>;
}

type AdminPanelTab = 'dashboard' | 'app-control' | 'slider' | 'course' | 'free-course' | 'lesson' | 'note' | 'quiz' | 'question' | 'live' | 'user' | 'access' | 'push-notification';

const AUTH_STORAGE_KEY = 'monto-users';
const THEME_STORAGE_KEY = 'monto-theme';
const USER_SESSION_KEY = 'monto-user-session';
const ADMIN_SESSION_KEY = 'monto-admin-session';
const ADMIN_ACCOUNTS_STORAGE_KEY = 'monto-admin-accounts';
const NOTE_CATEGORIES_STORAGE_KEY = 'monto-note-categories';
const APP_DATA_CACHE_KEY = 'monto-app-cache';
const ADMIN_USERS_CACHE_KEY = 'monto-admin-users-cache';
const APP_CONTROL_CACHE_KEY = 'monto-app-control-cache';
const APP_WELCOME_SEEN_KEY = 'monto-welcome-seen';
const NOTIFICATION_PREF_STORAGE_KEY = 'monto-notifications-enabled';
const PUSH_TOKEN_STORAGE_KEY = 'monto-push-token';
const PUSH_LAST_MESSAGE_STORAGE_KEY = 'monto-push-last-message';
const STUDENT_NOTIFICATIONS_STORAGE_KEY = 'monto-student-notifications';
const DEVICE_ID_STORAGE_KEY = 'monto-device-id';
const NOTIFICATION_SOUND_FILE = 'rbs_wow_tone.wav';
const NOTIFICATION_CHANNEL_UPDATES = 'monto-updates';
const NOTIFICATION_CHANNEL_COURSE_ACCESS = 'monto-course-access';
const NOTIFICATION_CHANNEL_LIVE_CLASSES = 'monto-live-classes';
const LIVE_CLASS_REMINDER_LEAD_MS = 15 * 60 * 1000;
const DATA_REQUEST_TIMEOUT_MS = 8000;
let interactionAudioContext: AudioContext | null = null;
let lastInteractionSound: { type: 'tap' | 'back'; playedAt: number } | null = null;

const getInteractionAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!interactionAudioContext || interactionAudioContext.state === 'closed') {
    interactionAudioContext = new AudioContextClass();
  }

  if (interactionAudioContext.state === 'suspended') {
    interactionAudioContext.resume().catch(() => {});
  }

  return interactionAudioContext;
};

const playInteractionSound = (type: 'tap' | 'back') => {
  const playedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (lastInteractionSound?.type === type && playedAt - lastInteractionSound.playedAt < 140) {
    return;
  }
  lastInteractionSound = { type, playedAt };

  const context = getInteractionAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const oscillator = context.createOscillator();
  const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(type === 'back' ? 1200 : 2600, now);
  oscillator.type = type === 'back' ? 'triangle' : 'sine';
  gain.gain.setValueAtTime(0.0001, now);

  if (type === 'tap') {
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.085, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    panner?.pan.setValueAtTime(0.12, now);
  } else {
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(230, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    panner?.pan.setValueAtTime(-0.16, now);
  }

  oscillator.connect(filter);
  filter.connect(gain);
  if (panner) {
    gain.connect(panner).connect(context.destination);
  } else {
    gain.connect(context.destination);
  }

  oscillator.start(now);
  oscillator.stop(now + (type === 'back' ? 0.18 : 0.09));
};

const isInteractiveTapTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false;
  }

  const element = target.closest('button, a, [role="button"], .nav-item, .admin-feature-card, .course-card, .note-card');
  if (!element || element.getAttribute('data-sound') === 'off') {
    return false;
  }

  if (element instanceof HTMLButtonElement && element.disabled) {
    return false;
  }

  return true;
};

const isBackTapTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false;
  }

  const button = target.closest('button, [role="button"]');
  if (!button) {
    return false;
  }

  const ariaLabel = button.getAttribute('aria-label') || '';
  return /back/i.test(ariaLabel)
    || /back/i.test(button.textContent || '')
    || Boolean(button.querySelector('.lucide-arrow-left'));
};
const DEFAULT_APP_CONTROL_SETTINGS: AppControlSettings = {
  appName: 'Monto',
  welcomeEnabled: true,
  welcomeMessage: 'Welcome to Monto. Study smart, stay focused, and keep learning.',
  maintenanceMode: false,
  maintenanceMessage: 'Monto is under maintenance. Please check back soon.',
  forceUpdate: false,
  latestVersion: '1.0.0',
  updateUrl: '',
  screenProtection: true,
  screenProtectionScope: 'premium',
  videoProtectionEnabled: true,
  videoNotesEnabled: true,
  videoDownloadEnabled: false,
  offlinePage: true,
  splashEnabled: true,
  pushEnabled: true,
  notificationTitle: 'Monto',
  notificationBody: 'New course update available.',
  notificationId: '',
  notificationSentAt: '',
};
const DEFAULT_NATIVE_API_BASE_URL = 'https://monto-psi.vercel.app';
const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
  (Capacitor.isNativePlatform() ? DEFAULT_NATIVE_API_BASE_URL : '')
).trim().replace(/\/+$/, '');
const DEMO_ADMIN_ACCOUNTS: Record<AdminRole, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  superadmin: { username: 'adminsachin', password: 'admin123' },
};

const apiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const apiGet = async (resource: 'courses' | 'notes' | 'quizzes' | 'users' | 'sliders' | 'live-classes', params?: Record<string, string>) => {
  const query = new URLSearchParams(params || {});
  const suffix = query.toString();
  return fetch(apiUrl(`/api/${resource}${suffix ? `?${suffix}` : ''}`));
};

const normalizeAdminUser = (value: unknown): AdminUser | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const findValue = (...keys: string[]) => {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null && String(record[key]).trim()) {
        return String(record[key]).trim();
      }
    }
    return '';
  };

  const id = findValue('id', 'ID', 'Id', 'user_id', 'userId', 'User ID', 'Student ID', 'student_id');
  const email = findValue('email', 'Email', 'email_address', 'emailAddress', 'Email Address');
  const phone = findValue('phone', 'Phone', 'mobile', 'Mobile', 'phone_number', 'phoneNumber', 'mobile_number', 'mobileNumber');
  const name = findValue('name', 'Name', 'full_name', 'fullName', 'student_name', 'Student Name');
  const password = findValue('password', 'Password', 'pass', 'Pass');

  if (!id && !email && !name) {
    return null;
  }

  return {
    ...record,
    id: id || email || name || `student-${Date.now()}`,
    name: name || email || 'Student',
    email,
    phone,
    password: password || undefined,
    userCategory: String(record.userCategory || record.user_category || 'free').toLowerCase() === 'premium' ? 'premium' : 'free',
    grantedCourseIds: Array.isArray(record.grantedCourseIds)
      ? record.grantedCourseIds.map((item) => String(item))
      : [],
    blockedCourseIds: Array.isArray(record.blockedCourseIds)
      ? record.blockedCourseIds.map((item) => String(item))
      : [],
  };
};

const mergeAdminUsers = (...groups: unknown[][]): AdminUser[] => {
  const merged = new Map<string, AdminUser>();

  groups.flat().forEach((item) => {
    const normalized = normalizeAdminUser(item);
    if (!normalized) {
      return;
    }

    const key = normalized.id || normalized.email || normalized.name;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, ...normalized } : normalized);
  });

  return Array.from(merged.values()).sort((left, right) =>
    `${left.name} ${left.email}`.localeCompare(`${right.name} ${right.email}`)
  );
};

const getCachedAppData = (): {
  sliders: SliderItem[];
  courses: Course[];
  notes: Note[];
  quizzes: Quiz[];
  liveClasses: LiveClass[];
} | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawCache = window.localStorage.getItem(APP_DATA_CACHE_KEY);
  if (!rawCache) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawCache) as Partial<{
      sliders: SliderItem[];
      courses: Course[];
      notes: Note[];
      quizzes: Quiz[];
      liveClasses: LiveClass[];
    }>;

    return {
      sliders: normalizeSliders(parsed.sliders),
      liveClasses: Array.isArray(parsed.liveClasses) ? parsed.liveClasses : [],
      ...filterChemistryAppData({
        courses: Array.isArray(parsed.courses) ? parsed.courses : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : fallbackQuizzes,
      }),
    };
  } catch {
    return null;
  }
};

const saveCachedAppData = (payload: {
  sliders: SliderItem[];
  courses: Course[];
  notes: Note[];
  quizzes: Quiz[];
  liveClasses: LiveClass[];
}) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(APP_DATA_CACHE_KEY, JSON.stringify({
      sliders: payload.sliders,
      liveClasses: payload.liveClasses,
      ...filterChemistryAppData(payload),
    }));
  }
};

const getCachedAdminUsers = (): AdminUser[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawCache = window.localStorage.getItem(ADMIN_USERS_CACHE_KEY);
  if (!rawCache) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawCache) as unknown[];
    return mergeAdminUsers(Array.isArray(parsed) ? parsed : []).filter((user) => !isLegacySeedUser(user));
  } catch {
    return [];
  }
};

const saveCachedAdminUsers = (users: AdminUser[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_USERS_CACHE_KEY, JSON.stringify(users));
  }
};

const normalizeAppControlSettings = (value: unknown): AppControlSettings => {
  const record = value && typeof value === 'object' ? value as Partial<AppControlSettings> : {};
  return {
    ...DEFAULT_APP_CONTROL_SETTINGS,
    ...record,
    appName: String(record.appName || DEFAULT_APP_CONTROL_SETTINGS.appName),
    welcomeEnabled: Boolean(record.welcomeEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.welcomeEnabled),
    welcomeMessage: String(record.welcomeMessage || DEFAULT_APP_CONTROL_SETTINGS.welcomeMessage),
    maintenanceMode: Boolean(record.maintenanceMode ?? DEFAULT_APP_CONTROL_SETTINGS.maintenanceMode),
    maintenanceMessage: String(record.maintenanceMessage || DEFAULT_APP_CONTROL_SETTINGS.maintenanceMessage),
    forceUpdate: Boolean(record.forceUpdate ?? DEFAULT_APP_CONTROL_SETTINGS.forceUpdate),
    latestVersion: String(record.latestVersion || DEFAULT_APP_CONTROL_SETTINGS.latestVersion),
    updateUrl: String(record.updateUrl || ''),
    screenProtection: Boolean(record.screenProtection ?? DEFAULT_APP_CONTROL_SETTINGS.screenProtection),
    screenProtectionScope: String(record.screenProtectionScope || DEFAULT_APP_CONTROL_SETTINGS.screenProtectionScope) === 'premium' ? 'premium' : 'global',
    videoProtectionEnabled: Boolean(record.videoProtectionEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoProtectionEnabled),
    videoNotesEnabled: Boolean(record.videoNotesEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoNotesEnabled),
    videoDownloadEnabled: Boolean(record.videoDownloadEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoDownloadEnabled),
    offlinePage: Boolean(record.offlinePage ?? DEFAULT_APP_CONTROL_SETTINGS.offlinePage),
    splashEnabled: Boolean(record.splashEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.splashEnabled),
    pushEnabled: Boolean(record.pushEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.pushEnabled),
    notificationTitle: String(record.notificationTitle || DEFAULT_APP_CONTROL_SETTINGS.notificationTitle),
    notificationBody: String(record.notificationBody || DEFAULT_APP_CONTROL_SETTINGS.notificationBody),
    notificationId: String(record.notificationId || ''),
    notificationSentAt: String(record.notificationSentAt || ''),
  };
};

const getCachedAppControlSettings = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_CONTROL_SETTINGS;
  }

  try {
    return normalizeAppControlSettings(JSON.parse(window.localStorage.getItem(APP_CONTROL_CACHE_KEY) || 'null'));
  } catch {
    return DEFAULT_APP_CONTROL_SETTINGS;
  }
};

const saveCachedAppControlSettings = (settings: AppControlSettings) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(APP_CONTROL_CACHE_KEY, JSON.stringify(settings));
  }
};

const loadJsonResource = async <T,>(resource: 'sliders' | 'courses' | 'notes' | 'quizzes' | 'users' | 'live-classes', fallbackValue: T): Promise<T> => {
  try {
    const response = await apiGet(resource);
    return await readJsonResponse(response);
  } catch {
    return fallbackValue;
  }
};

const fetchAppControlSettings = async (fallbackValue = DEFAULT_APP_CONTROL_SETTINGS): Promise<AppControlSettings> => {
  try {
    const response = await fetchWithTimeout(apiUrl(`/api/app-control?ts=${Date.now()}`), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    const payload = await readLenientJsonResponse(response);
    return normalizeAppControlSettings(payload?.settings || payload);
  } catch {
    return fallbackValue;
  }
};

const fetchStudentLiveClasses = async (userId: string, fallbackValue: LiveClass[] = []): Promise<LiveClass[]> => {
  try {
    const response = await apiGet('live-classes', userId ? { userId } : undefined);
    return await readJsonResponse(response);
  } catch {
    return fallbackValue;
  }
};

const withTimeout = async <T,>(task: Promise<T>, fallbackValue: T, timeoutMs = DATA_REQUEST_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = DATA_REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const getStoredAdminToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY) || window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    return typeof parsed.token === 'string' ? parsed.token : '';
  } catch {
    return '';
  }
};

const getAdminAuthHeaders = () => {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractUserArray = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.users)) {
      return record.users;
    }
    if (Array.isArray(record.data)) {
      return record.data;
    }
  }

  return [];
};

const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await fetchWithTimeout(apiUrl('/api/admin-users'), {
      headers: getAdminAuthHeaders(),
    });
    const payload = await readLenientJsonResponse(response);
    const localUsers = mergeAdminUsers(extractUserArray(payload)).filter((user) => !isLegacySeedUser(user));
    if (localUsers.length) {
      return localUsers;
    }
  } catch {}

  try {
    const response = await fetchWithTimeout(apiUrl('/api/users'));
    const payload = await readLenientJsonResponse(response);
    const users = mergeAdminUsers(extractUserArray(payload)).filter((user) => !isLegacySeedUser(user));
    if (users.length) {
      return users;
    }
  } catch {}

  try {
    const response = await apiGet('users');
    const payload = await readLenientJsonResponse(response);
    return mergeAdminUsers(extractUserArray(payload)).filter((user) => !isLegacySeedUser(user));
  } catch {
    return [];
  }
};

const fetchAdminLiveClasses = async (): Promise<LiveClass[]> => {
  try {
    const response = await fetchWithTimeout(apiUrl('/api/admin-live-classes'), {
      headers: getAdminAuthHeaders(),
    });
    const payload = await readLenientJsonResponse(response);
    return Array.isArray(payload) ? payload as LiveClass[] : [];
  } catch {
    return [];
  }
};

const isChemistryCourse = (course: Course) => String(course.category || '').toLowerCase().includes('chem');
const isChemistryNote = (note: Note) => String(note.category || '').toLowerCase().includes('chem');
const isChemistryQuiz = (quiz: Quiz) => String(quiz.topic || '').toLowerCase().includes('chem');
const isCourseFree = (course?: Course | null) => String(course?.type || '').toLowerCase() === 'free';
const isCourseAccessible = (course: Course | null | undefined, unlockedCourseIds: string[]) => (
  !!course && (isCourseFree(course) || unlockedCourseIds.includes(course.id))
);

const formatLiveClassDate = (value: string) => {
  if (!value) {
    return 'Schedule anytime';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule anytime';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getLiveClassStatus = (value: string) => {
  if (!value) {
    return { label: 'Open', tone: 'emerald', detail: 'Join when admin starts the class' };
  }

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return { label: 'Open', tone: 'emerald', detail: 'Join when admin starts the class' };
  }

  const now = Date.now();
  const startsInMs = time - now;
  const endsAfterMs = now - time;

  if (startsInMs > 15 * 60 * 1000) {
    return { label: 'Upcoming', tone: 'blue', detail: `Starts ${formatLiveClassDate(value)}` };
  }

  if (startsInMs > 0) {
    return { label: 'Starting Soon', tone: 'amber', detail: 'Class is about to start' };
  }

  if (endsAfterMs <= 3 * 60 * 60 * 1000) {
    return { label: 'Live Now', tone: 'emerald', detail: 'Join the session now' };
  }

  return { label: 'Completed', tone: 'slate', detail: 'This session time has passed' };
};

const getLiveClassStatusClass = (tone: string) => ({
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
}[tone] || 'bg-slate-100 text-slate-600');

const formatNotificationTime = (value: number) => {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeStudentNotification = (notification: Partial<StudentNotificationItem>): StudentNotificationItem | null => {
  const title = String(notification.title || '').trim();
  const body = String(notification.body || '').trim();
  if (!title && !body) {
    return null;
  }

  const data = notification.data && typeof notification.data === 'object' ? notification.data : {};
  const screenValue = String(notification.screen || data.screen || 'home');
  const screen = [
    'home',
    'courses',
    'notes',
    'quiz',
    'profile',
    'settings',
    'profile-edit',
    'help-center',
    'support-chat',
    'my-courses',
    'offline-notes',
    'about-us',
    'about-developer',
    'privacy-policy',
    'admin',
    'video-player',
    'note-viewer',
    'course-details',
    'binaural-beats',
    'live-classes',
    'live-class-viewer',
  ].includes(screenValue) ? screenValue as Screen : 'home';

  return {
    id: String(notification.id || data.notificationId || `notification-${Date.now()}`),
    title: title || 'Monto',
    body: body || 'New academy update received.',
    receivedAt: Number(notification.receivedAt || Date.now()),
    screen,
    type: String(notification.type || data.type || 'academy-update'),
    data,
  };
};

const getStoredStudentNotifications = () => {
  if (typeof window === 'undefined') {
    return [] as StudentNotificationItem[];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_NOTIFICATIONS_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizeStudentNotification(item))
      .filter((item): item is StudentNotificationItem => Boolean(item))
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, 50);
  } catch {
    return [];
  }
};

const saveStoredStudentNotifications = (notifications: StudentNotificationItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STUDENT_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
};

const mergeStudentNotification = (
  notifications: StudentNotificationItem[],
  notification: Partial<StudentNotificationItem>
) => {
  const normalized = normalizeStudentNotification(notification);
  if (!normalized) {
    return notifications;
  }

  const next = [
    normalized,
    ...notifications.filter((item) => item.id !== normalized.id),
  ].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, 50);
  saveStoredStudentNotifications(next);
  return next;
};

const makeCoursePremium = (course: Course): Course => {
  const price = Number(course.price || 0);
  const oldPrice = Number(course.oldPrice || 0);

  return {
    ...course,
    type: 'premium',
    price: price > 0 ? price : 999,
    oldPrice: oldPrice > price ? oldPrice : Math.max((price > 0 ? price : 999) * 2, 2999),
  };
};

const fullChemistryCoursePlaylistLessons: Lesson[] = [
  {
    id: 'playlist-ygfWkUUe_mw',
    course_id: '7',
    title: 'Prepare smarter for NEB Chemistry with Monto!',
    duration: '57:30',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/ygfWkUUe_mw',
  },
  {
    id: 'playlist-ctvAG2m0eck',
    course_id: '7',
    title: 'Prepare smarter for NEB Chemistry with Monto!',
    duration: '34:41',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/ctvAG2m0eck',
  },
  {
    id: 'playlist-dJN_zde16e0',
    course_id: '7',
    title: 'Prepare smarter for NEB Chemistry with Monto!',
    duration: '56:25',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/dJN_zde16e0',
  },
  {
    id: 'playlist-Go11beHIcDc',
    course_id: '7',
    title: 'Monto Chemistry important questions solving for NEB students',
    duration: '56:10',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/Go11beHIcDc',
  },
  {
    id: 'playlist-M-BNETidn8o',
    course_id: '7',
    title: 'Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto',
    duration: '1:02:22',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/M-BNETidn8o',
  },
  {
    id: 'playlist-l8f4e1_tWhE',
    course_id: '7',
    title: 'First Part Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto |',
    duration: '22:00',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/l8f4e1_tWhE',
  },
  {
    id: 'playlist-HOomRqoQi6g',
    course_id: '7',
    title: 'Chemistry NEB Grade 12 Revision 2026 |Important Questions & Numerical | Monto |Saral Shikshya Academy',
    duration: '1:16:08',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/HOomRqoQi6g',
  },
  {
    id: 'playlist-fgJAyaWlUT8',
    course_id: '7',
    title: 'Chemistry Class | Ravi Bhushan Sharma',
    duration: '1:06:19',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/fgJAyaWlUT8',
  },
  {
    id: 'playlist-zE0JXXvbhP4',
    course_id: '7',
    title: 'Chemistry Class | Ravi Bhushan Sharma',
    duration: '1:12:21',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/zE0JXXvbhP4',
  },
  {
    id: 'playlist-hl2Q3Rhlq_0',
    course_id: '7',
    title: 'Aldehydes, Ketones and Carboxylic Acid | Grade 12 | NEB | Saral Shikshya',
    duration: '5:40',
    note_content: 'NEB Chemistry playlist lesson from Saral Shikshya Academy.',
    note_url: '',
    video_url: 'https://www.youtube.com/embed/hl2Q3Rhlq_0',
  },
];

const dummyFullChemistryLessonIds = new Set(['l6', 'l7', 'l8']);
const removedDummyPremiumCourseIds = new Set([
  '5',
  '7',
  '11',
  '21',
  '22',
  '23',
  'c1778073513478e4c7ae52',
  'c177807312799652cdba22',
]);
const removedDummyPremiumCourseTitles = new Set([
  'chemistry crash course 30 days',
  'physical chemistry problem solving',
  'inorganic chemistry revision batch',
  'tollens test',
  'class 11 full chemistry',
  'class 11 hemistry',
  'neb chemistry: organic chemistry',
  'full chemistry course',
]);

const fallbackCourses: Course[] = [
  {
    id: '7',
    title: 'Full Chemistry Course',
    lessons: fullChemistryCoursePlaylistLessons.length,
    image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiqmdaP81MD5lfSQVNyUCJHE9FIrXTOfUWnKCTUFxE45Jx9QoEf3diojYpuDZggIrin3HGuPMTBSzn2lZmU4bz_u5tAaIxqVtZaqmrcLzOVUG4ZNDPl916cIR1XekUjbegMk2HeRWejq6SMpfJr5ontaQhhmlN1NJ7yZBClkbchUrH9-ZH9xhOGkixzVQ/s1600/oneshot%20video.png',
    price: 999,
    oldPrice: 2999,
    type: 'premium',
    category: 'Chemistry',
    lessonList: fullChemistryCoursePlaylistLessons,
  },
  {
    id: 'fallback-organic',
    title: 'Organic Chemistry Revision',
    lessons: 1,
    image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgwdYcwalrDhUUicjNzgFlihRBqyGSDR-6R-pzRt58tSxvGoFeBsvmcUV8VMx83zmnMeNne0R_LU0fjw5NLK1ryg-yVbzsWc0ye0h187vq09UR7Gph1PiHYeaggvkICuJ4fAzqk7KQqhd485SqYSKvhtxPfE7HLQBKCmUae9g3c0FIHYHW6e4_ur18X7Q/s1536/organic.png',
    price: 0,
    oldPrice: 0,
    type: 'free',
    category: 'Chemistry',
    lessonList: [
      {
        id: 'fallback-organic-1',
        course_id: 'fallback-organic',
        title: 'Organic Chemistry Quick Revision',
        duration: '22:00',
        note_content: 'Use this starter lesson while the live course server syncs.',
        note_url: '',
        video_url: 'https://www.youtube.com/embed/l8f4e1_tWhE',
        sort_order: 1,
      },
    ],
  },
  {
    id: 'fallback-inorganic',
    title: 'Inorganic Chemistry Revision',
    lessons: 1,
    image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgbaKHm45THr1QiQ4mfh6oBypp8tS3_F1lV_f2fwVwgnZp54S2Vm7ZT-ch5ZBshKsc7AtiwJwwhjoMc3CZYFR8SvULf4BBgSwkjvn_JVTtOrJcJTRmF4uCUy284SVMSazNsVTLPf4lWUVSwRWIwT9Y6q9RAN01AY_MwcMYV0nCAcDrXaSVUcQf66UcTQ/s1536/inorganic.png',
    price: 0,
    oldPrice: 0,
    type: 'free',
    category: 'Chemistry',
    lessonList: [
      {
        id: 'fallback-inorganic-1',
        course_id: 'fallback-inorganic',
        title: 'Inorganic Chemistry Quick Revision',
        duration: '56:10',
        note_content: 'Use this starter lesson while the live course server syncs.',
        note_url: '',
        video_url: 'https://www.youtube.com/embed/Go11beHIcDc',
        sort_order: 1,
      },
    ],
  },
];

const withFullChemistryPlaylistLessons = (courses: Course[]) => courses.map((course) => {
  const isFullChemistryCourse =
    String(course.id) === '7' ||
    String(course.title || '').toLowerCase().includes('full chemistry course');

  if (!isFullChemistryCourse) {
    return course;
  }

  const currentLessons = Array.isArray(course.lessonList)
    ? course.lessonList.filter((lesson) => !dummyFullChemistryLessonIds.has(String(lesson.id)))
    : [];
  const lessonMap = new Map<string, Lesson>();
  [...currentLessons, ...fullChemistryCoursePlaylistLessons].forEach((lesson) => {
    lessonMap.set(String(lesson.id), { ...lesson, course_id: String(course.id || '7') });
  });
  const lessonList = Array.from(lessonMap.values());

  return {
    ...course,
    lessons: lessonList.length,
    lessonList,
  };
});

const removeDeletedDummyPremiumCourses = (courses: Course[]) => (courses || []).filter((course) => {
  const id = String(course.id || '').trim();
  const title = String(course.title || '').trim().toLowerCase();
  return !removedDummyPremiumCourseIds.has(id) && !removedDummyPremiumCourseTitles.has(title);
});

const filterChemistryAppData = (payload: {
  courses: Course[];
  notes: Note[];
  quizzes: Quiz[];
}) => ({
  courses: withFullChemistryPlaylistLessons(removeDeletedDummyPremiumCourses(payload.courses || [])),
  notes: payload.notes || [],
  quizzes: payload.quizzes || [],
});

const legacyPlaceholderSliderUrls = [
  'https://picsum.photos/seed/slide1/1200/600',
  'https://picsum.photos/seed/slide2/1200/600',
  'https://picsum.photos/seed/slide3/1200/600',
];

const fallbackSliders: SliderItem[] = [
  {
    id: 'sl1',
    title: 'Chemistry One Shot Video',
    subtitle: 'Start fast with a focused chemistry one-shot session designed for quick revision.',
    image_url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiqmdaP81MD5lfSQVNyUCJHE9FIrXTOfUWnKCTUFxE45Jx9QoEf3diojYpuDZggIrin3HGuPMTBSzn2lZmU4bz_u5tAaIxqVtZaqmrcLzOVUG4ZNDPl916cIR1XekUjbegMk2HeRWejq6SMpfJr5ontaQhhmlN1NJ7yZBClkbchUrH9-ZH9xhOGkixzVQ/s1600/oneshot%20video.png',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'sl2',
    title: 'Organic Chemistry',
    subtitle: 'Study reaction pathways, mechanisms, and named reactions with confidence.',
    image_url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgwdYcwalrDhUUicjNzgFlihRBqyGSDR-6R-pzRt58tSxvGoFeBsvmcUV8VMx83zmnMeNne0R_LU0fjw5NLK1ryg-yVbzsWc0ye0h187vq09UR7Gph1PiHYeaggvkICuJ4fAzqk7KQqhd485SqYSKvhtxPfE7HLQBKCmUae9g3c0FIHYHW6e4_ur18X7Q/s1536/organic.png',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'sl3',
    title: 'Inorganic Chemistry',
    subtitle: 'Cover periodic trends, coordination compounds, and core inorganic concepts.',
    image_url: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgbaKHm45THr1QiQ4mfh6oBypp8tS3_F1lV_f2fwVwgnZp54S2Vm7ZT-ch5ZBshKsc7AtiwJwwhjoMc3CZYFR8SvULf4BBgSwkjvn_JVTtOrJcJTRmF4uCUy284SVMSazNsVTLPf4lWUVSwRWIwT9Y6q9RAN01AY_MwcMYV0nCAcDrXaSVUcQf66UcTQ/s1536/inorganic.png',
    sort_order: 3,
    is_active: true
  }
];

const normalizeSliders = (items: SliderItem[] | null | undefined): SliderItem[] => {
  if (!Array.isArray(items) || !items.length) {
    return fallbackSliders;
  }

  const usesLegacyPlaceholders = items.every((slider, index) =>
    slider?.id === `sl${index + 1}` && slider?.image_url === legacyPlaceholderSliderUrls[index]
  );

  return usesLegacyPlaceholders ? fallbackSliders : items;
};

const apiAuthPost = async (
  action: 'login' | 'signup' | 'request-signup-otp' | 'verify-signup-otp' | 'request-password-reset-otp' | 'verify-password-reset-otp',
  payload: Record<string, unknown>
) => {
  const endpoint = ({
    login: '/api/login',
    signup: '/api/signup',
    'request-signup-otp': '/api/request-signup-otp',
    'verify-signup-otp': '/api/verify-signup-otp',
    'request-password-reset-otp': '/api/request-password-reset-otp',
    'verify-password-reset-otp': '/api/verify-password-reset-otp',
  } as const)[action];
  return fetch(apiUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

const createClientDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getClientDeviceId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const existingId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = createClientDeviceId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
};

const getClientDeviceLabel = () => {
  if (typeof navigator === 'undefined') {
    return 'Student device';
  }

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || navigator.platform || 'Android';
  const userAgent = navigator.userAgent ? ` - ${navigator.userAgent.slice(0, 80)}` : '';
  return `${platform}${userAgent}`;
};

const getDevicePayload = () => ({
  deviceId: getClientDeviceId(),
  deviceLabel: getClientDeviceLabel(),
});

const apiPost = async (action: string, payload: Record<string, unknown>) => {
  return fetch(apiUrl('/api/' + action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
    body: JSON.stringify(payload)
  });
};

const registerPushToken = async (token: string, userId = '') => {
  if (!token) {
    return;
  }

  try {
    await fetch(apiUrl('/api/register-push-token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userId,
        platform: Capacitor.getPlatform(),
        ...getDevicePayload(),
      }),
    });
  } catch (error) {
    console.warn('Unable to register push token:', error);
  }
};

const apiSliderPost = async (action: 'createSlider' | 'updateSlider' | 'deleteSlider', payload: Record<string, unknown>) => {
  return apiPost(action, payload);
};

const apiNotePost = async (action: 'createNote' | 'updateNote', payload: Record<string, unknown>) => {
  return apiPost(action, payload);
};

const apiMediaPost = async (action: 'createCourse' | 'updateCourse' | 'createLesson' | 'updateLesson', payload: Record<string, unknown>) => {
  return apiPost(action, payload);
};

type CloudinaryUploadKind = 'slider' | 'course' | 'lesson' | 'question' | 'note' | 'profile';

const getUploadMimeType = (file: File) => {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  return ({
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    html: 'text/html',
    htm: 'text/html',
    txt: 'text/plain',
    md: 'text/markdown',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } as Record<string, string>)[extension] || 'application/octet-stream';
};

const uploadFileToCloudinary = async (file: File, kind: CloudinaryUploadKind) => {
  const signatureResponse = await apiPost('media-upload-signature', {
    kind,
    mimeType: getUploadMimeType(file),
    fileName: file.name,
    size: file.size,
  });
  const signature = await readLenientJsonResponse(signatureResponse);
  if (!signatureResponse.ok || !signature.success) {
    throw new Error(String(signature.message || 'Unable to prepare Cloudinary upload'));
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', String(signature.apiKey));
  form.append('timestamp', String(signature.timestamp));
  form.append('public_id', String(signature.publicId));
  form.append('signature', String(signature.signature));
  const uploadResponse = await fetch(String(signature.uploadUrl), { method: 'POST', body: form });
  const uploadResult = await uploadResponse.json() as { secure_url?: string; error?: { message?: string } };
  if (!uploadResponse.ok || !uploadResult.secure_url) {
    throw new Error(uploadResult.error?.message || 'Cloudinary upload failed');
  }

  return signature.resourceType === 'image'
    ? uploadResult.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
    : uploadResult.secure_url;
};

const isValidStudentName = (value: string) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(value.trim());
const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");

const normalizeMeetingUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isValidMeetingUrl = (value: string) => {
  try {
    const parsedUrl = new URL(normalizeMeetingUrl(value));
    return ['http:', 'https:'].includes(parsedUrl.protocol) && parsedUrl.hostname.includes('.');
  } catch {
    return false;
  }
};

const openMeetingUrl = async (value: string) => {
  const url = normalizeMeetingUrl(value);
  if (!url || !isValidMeetingUrl(url)) {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return true;
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    window.location.href = url;
  }
  return true;
};

const openExternalUrl = async (value: string) => {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return true;
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    window.location.href = url;
  }
  return true;
};

const readJsonResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();
  const trimmedBody = bodyText.trim();

  if (!trimmedBody) {
    if (response.ok) {
      return { success: true };
    }
    throw new Error(`Server returned an empty response (${response.status}).`);
  }

  if (trimmedBody.startsWith('<')) {
    throw new Error(
      response.url.includes('/api/')
        ? 'API route returned the app HTML instead of JSON. Refresh after deploy and check the API route/server.'
        : 'Server returned HTML instead of JSON. Refresh the app and make sure the API/server is running.'
    );
  }

  try {
    return JSON.parse(trimmedBody);
  } catch {
    const shortBody = trimmedBody.slice(0, 220);
    throw new Error(
      contentType.toLowerCase().includes('application/json')
        ? `Invalid JSON from server: ${shortBody}`
        : shortBody || 'Server returned an unexpected response.'
    );
  }
};

const readLenientJsonResponse = async (response: Response) => {
  try {
    return await readJsonResponse(response.clone());
  } catch (error) {
    const bodyText = await response.text();
    const trimmedBody = bodyText.trim();

    if (!trimmedBody) {
      if (response.ok) {
        return { success: true };
      }
      throw new Error(error instanceof Error ? error.message : `Server returned an empty response (${response.status}).`);
    }

    try {
      return JSON.parse(trimmedBody);
    } catch {
      if (trimmedBody.startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON. Please refresh and login again.');
      }
      throw new Error(trimmedBody.slice(0, 220));
    }
  }
};

const normalizeAuthUser = (
  user: any,
  fallback: { name?: string; email?: string; phone?: string; avatarUrl?: string; classLevel?: StudentClassLevel | string } = {}
): AuthUser => ({
  id: String(user?.id || `u${Date.now()}`),
  name: String(user?.name || fallback.name || 'Student'),
  email: String(user?.email || fallback.email || ''),
  phone: String(user?.phone || fallback.phone || ''),
  avatarUrl: String(user?.avatarUrl || user?.avatar_url || fallback.avatarUrl || ''),
  classLevel: normalizeStudentClassLevel(user?.classLevel || user?.class_level || fallback.classLevel),
  status: String(user?.status || 'active'),
  userCategory: String(user?.userCategory || user?.user_category || 'free').toLowerCase() === 'premium' ? 'premium' : 'free',
  grantedCourseIds: Array.isArray(user?.grantedCourseIds)
    ? user.grantedCourseIds.map((item: unknown) => String(item))
    : [],
  blockedCourseIds: Array.isArray(user?.blockedCourseIds)
    ? user.blockedCourseIds.map((item: unknown) => String(item))
    : [],
  deviceId: String(user?.deviceId || user?.device_id || ''),
  deviceLabel: String(user?.deviceLabel || user?.device_label || ''),
  deviceBoundAt: String(user?.deviceBoundAt || user?.device_bound_at || ''),
  deviceLocked: Boolean(user?.deviceLocked || user?.device_id || user?.deviceId),
});

const isLegacySeedUser = (value: { id?: string; name?: string; email?: string } | null | undefined) =>
  String(value?.id || '').trim() === 'u1' &&
  String(value?.name || '').trim().toLowerCase() === 'rahul sharma' &&
  String(value?.email || '').trim().toLowerCase() === 'rahul@example.com';

const getStoredUsers = (): StoredUser[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawUsers = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUsers) {
    return [];
  }

  try {
    const parsedUsers = JSON.parse(rawUsers) as StoredUser[];
    const normalizedUsers = parsedUsers.map((user) => ({
      ...user,
      phone: String((user as Partial<StoredUser>).phone || ''),
      classLevel: normalizeStudentClassLevel((user as Partial<StoredUser>).classLevel),
    }));
    const filteredUsers = normalizedUsers.filter((user) => !isLegacySeedUser(user));
    if (filteredUsers.length !== parsedUsers.length) {
      saveStoredUsers(filteredUsers);
    }
    return filteredUsers;
  } catch {
    return [];
  }
};

const saveStoredUsers = (users: StoredUser[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  }
};

const runLocalStudentAuth = (
  action: 'signup' | 'login',
  payload: { name?: string; email: string; phone?: string; password: string; classLevel?: StudentClassLevel | string }
) => {
  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const storedUsers = getStoredUsers();

  if (!normalizedEmail || !password) {
    return { success: false, message: 'Email and password are required' };
  }

  if (action === 'signup') {
    const existingUser = storedUsers.find((item) => String(item.email || '').trim().toLowerCase() === normalizedEmail);
    if (existingUser) {
      return { success: false, message: 'This email is already registered on this device. Please login.' };
    }

    const nextUser: StoredUser = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(payload.name || normalizedEmail).trim() || 'Student',
      email: normalizedEmail,
      phone: String(payload.phone || ''),
      classLevel: normalizeStudentClassLevel(payload.classLevel),
      password,
      status: 'active',
      userCategory: 'free',
      grantedCourseIds: [],
      blockedCourseIds: [],
    };
    saveStoredUsers([...storedUsers, nextUser]);
    return { success: true, user: nextUser };
  }

  const user = storedUsers.find((item) => String(item.email || '').trim().toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) {
    return { success: false, message: 'Invalid local login. If this account was created online, connect internet and try again.' };
  }

  return { success: true, user };
};

const updateStoredUser = (updatedUser: AuthUser) => {
  const storedUsers = getStoredUsers();
  const nextUsers = storedUsers.map((storedUser) =>
    storedUser.id === updatedUser.id
      ? { ...storedUser, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, avatarUrl: updatedUser.avatarUrl || '', classLevel: normalizeStudentClassLevel(updatedUser.classLevel) }
      : storedUser
  );

  saveStoredUsers(nextUsers);
};

const updateStoredUserCredentials = (payload: { id: string; name: string; avatarUrl?: string; classLevel?: StudentClassLevel | string; password?: string }) => {
  const storedUsers = getStoredUsers();
  const nextUsers = storedUsers.map((storedUser) =>
    storedUser.id === payload.id
      ? {
          ...storedUser,
          name: payload.name,
          avatarUrl: payload.avatarUrl || '',
          classLevel: normalizeStudentClassLevel(payload.classLevel || storedUser.classLevel),
          ...(payload.password ? { password: payload.password } : {})
        }
      : storedUser
  );

  saveStoredUsers(nextUsers);
};

const getStoredSessionUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_SESSION_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return normalizeAuthUser(JSON.parse(rawUser) as AuthUser);
  } catch {
    return null;
  }
};

const saveSessionUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(USER_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(normalizeAuthUser(user)));
};

const getUserAvatarUrl = (user?: Partial<AuthUser> | null) => {
  const avatarUrl = String(user?.avatarUrl || '').trim();
  if (avatarUrl) {
    return avatarUrl;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Student')}`;
};

const fetchSessionUser = async (userId: string): Promise<AuthUser> => {
  const query = new URLSearchParams({ userId, ...getDevicePayload() });
  const response = await fetch(apiUrl(`/api/session-user?${query.toString()}`));
  const data = await readLenientJsonResponse(response);
  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Unable to verify account status') as Error & { blocked?: boolean; deviceLocked?: boolean };
    error.blocked = response.status === 403 || Boolean(data.blocked);
    error.deviceLocked = Boolean(data.deviceLocked);
    throw error;
  }

  return normalizeAuthUser(data.user);
};

const getStoredAdminAccounts = (): AdminAccount[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as AdminAccount[] : [];
    const normalized = parsed
      .filter((item) => item && item.username && item.password)
      .map((item, index) => ({
        id: String(item.id || `admin-${index}`),
        username: String(item.username).trim(),
        password: String(item.password),
        createdAt: Number(item.createdAt || Date.now()),
      }))
      .filter((item) => item.username && item.password);

    const deduped = new Map<string, AdminAccount>();
    normalized.forEach((account) => {
      deduped.set(account.username.toLowerCase(), account);
    });
    return Array.from(deduped.values());
  } catch {
    return [];
  }
};

const saveStoredAdminAccounts = (accounts: AdminAccount[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

const getStoredNoteCategories = () => {
  const defaults = ['Chemistry', 'Physics', 'Biology', 'Maths'];

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(NOTE_CATEGORIES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as string[] : [];
    const merged = Array.from(new Set([...defaults, ...parsed.map((item) => String(item || '').trim()).filter(Boolean)]));
    return merged;
  } catch {
    return defaults;
  }
};

const saveStoredNoteCategories = (categories: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(NOTE_CATEGORIES_STORAGE_KEY, JSON.stringify(Array.from(new Set(categories.map((item) => item.trim()).filter(Boolean)))));
};

const getAdminSession = (): AdminSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY) || window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.role || !parsed?.username) {
      return null;
    }
    if (!parsed.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveAdminSession = (session: AdminSession | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);

  if (session) {
    const storage = session.rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }
};

const fallbackQuizzes: Quiz[] = [
  {
    id: 'q1',
    topic: 'Chemistry',
    questions: [
      {
        id: 'qn1',
        text: 'Which of the following is a decomposition reaction?',
        options: ['H2 + O2 -> H2O', 'CaCO3 -> CaO + CO2', 'Zn + HCl -> ZnCl2 + H2', 'NaOH + HCl -> NaCl + H2O'],
        correctAnswer: 1,
        explanation: 'CaCO3 breaking into CaO and CO2 is a decomposition reaction.'
      },
      {
        id: 'qn2',
        text: 'What is the pH of a neutral solution?',
        options: ['0', '14', '7', '1'],
        correctAnswer: 2,
        explanation: 'A neutral solution has pH 7.'
      },
      {
        id: 'qn3',
        text: 'Which gas is evolved when zinc reacts with dilute sulphuric acid?',
        options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
        correctAnswer: 1,
        explanation: 'Zinc reacts with dilute sulphuric acid to release hydrogen gas.'
      }
    ]
  },
  {
    id: 'q2',
    topic: 'Physics',
    questions: [
      {
        id: 'qn4',
        text: 'The focal length of a plane mirror is:',
        options: ['Zero', 'Infinite', '25 cm', '-25 cm'],
        correctAnswer: 1,
        explanation: 'A plane mirror has infinite focal length.'
      },
      {
        id: 'qn5',
        text: 'The unit of power of a lens is:',
        options: ['Meter', 'Dioptre', 'Watt', 'Joule'],
        correctAnswer: 1,
        explanation: 'Lens power is measured in dioptre.'
      },
      {
        id: 'qn6',
        text: 'Which mirror is used as a rear-view mirror in vehicles?',
        options: ['Concave', 'Convex', 'Plane', 'None'],
        correctAnswer: 1,
        explanation: 'Convex mirrors provide a wider field of view.'
      }
    ]
  },
  {
    id: 'q3',
    topic: 'Biology',
    questions: [
      {
        id: 'qn7',
        text: 'Which part of the cell is known as the control center?',
        options: ['Nucleus', 'Cytoplasm', 'Cell membrane', 'Ribosome'],
        correctAnswer: 0,
        explanation: 'The nucleus controls major cell activities.'
      },
      {
        id: 'qn8',
        text: 'Photosynthesis mainly takes place in which part of the plant cell?',
        options: ['Mitochondria', 'Chloroplast', 'Vacuole', 'Nucleus'],
        correctAnswer: 1,
        explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.'
      },
      {
        id: 'qn9',
        text: 'Which blood vessel carries blood away from the heart?',
        options: ['Vein', 'Capillary', 'Artery', 'Nerve'],
        correctAnswer: 2,
        explanation: 'Arteries carry blood away from the heart.'
      }
    ]
  },
  {
    id: 'q4',
    topic: 'Mathematics',
    questions: [
      {
        id: 'qn10',
        text: 'What is the value of sin 90 degrees?',
        options: ['0', '1', '1/2', 'sqrt(3)/2'],
        correctAnswer: 1,
        explanation: 'sin 90 degrees equals 1.'
      },
      {
        id: 'qn11',
        text: 'If x + 7 = 15, what is the value of x?',
        options: ['6', '7', '8', '9'],
        correctAnswer: 2,
        explanation: 'Subtract 7 from both sides to get x = 8.'
      },
      {
        id: 'qn12',
        text: 'What is the area of a rectangle with length 8 cm and breadth 5 cm?',
        options: ['13 cm2', '26 cm2', '40 cm2', '80 cm2'],
        correctAnswer: 2,
        explanation: 'Area = length x breadth = 40 cm2.'
      }
    ]
  },
  {
    id: 'q5',
    topic: 'English',
    questions: [
      {
        id: 'qn13',
        text: 'Which of the following is a noun?',
        options: ['Quickly', 'Beautiful', 'Honesty', 'Run'],
        correctAnswer: 2,
        explanation: 'Honesty is an abstract noun.'
      },
      {
        id: 'qn14',
        text: 'Choose the correct synonym of "rapid".',
        options: ['Slow', 'Fast', 'Weak', 'Silent'],
        correctAnswer: 1,
        explanation: 'Rapid means fast.'
      },
      {
        id: 'qn15',
        text: 'Which sentence is in the past tense?',
        options: ['She sings well.', 'They are playing.', 'He went to school.', 'I will call you.'],
        correctAnswer: 2,
        explanation: 'The verb "went" is in the past tense.'
      }
    ]
  },
  {
    id: 'q6',
    topic: 'History',
    questions: [
      {
        id: 'qn16',
        text: 'Who was the first Prime Minister of independent India?',
        options: ['Mahatma Gandhi', 'Sardar Patel', 'Jawaharlal Nehru', 'Subhas Chandra Bose'],
        correctAnswer: 2,
        explanation: 'Jawaharlal Nehru became the first Prime Minister in 1947.'
      },
      {
        id: 'qn17',
        text: 'In which year did India gain independence?',
        options: ['1945', '1947', '1950', '1952'],
        correctAnswer: 1,
        explanation: 'India became independent in 1947.'
      },
      {
        id: 'qn18',
        text: 'The Harappan civilization is also known as the:',
        options: ['Vedic civilization', 'Indus Valley civilization', 'Mauryan civilization', 'Gupta civilization'],
        correctAnswer: 1,
        explanation: 'Harappan civilization is another name for the Indus Valley civilization.'
      }
    ]
  },
  {
    id: 'q7',
    topic: 'Computer Science',
    questions: [
      {
        id: 'qn19',
        text: 'What does CPU stand for?',
        options: ['Central Processing Unit', 'Computer Primary Unit', 'Central Program Utility', 'Control Processing Utility'],
        correctAnswer: 0,
        explanation: 'CPU stands for Central Processing Unit.'
      },
      {
        id: 'qn20',
        text: 'Which of the following is an output device?',
        options: ['Keyboard', 'Mouse', 'Monitor', 'Scanner'],
        correctAnswer: 2,
        explanation: 'A monitor is an output device.'
      },
      {
        id: 'qn21',
        text: 'Binary language uses which two digits?',
        options: ['0 and 1', '1 and 2', '2 and 3', '0 and 9'],
        correctAnswer: 0,
        explanation: 'Binary uses only 0 and 1.'
      }
    ]
  }
];

const mergeQuizzes = (apiQuizzes: Quiz[]): Quiz[] => {
  const quizMap = new Map(
    fallbackQuizzes.map((quiz) => [quiz.topic.toLowerCase(), quiz])
  );

  apiQuizzes.forEach((quiz) => {
    const key = quiz.topic.toLowerCase();
    const fallbackQuiz = quizMap.get(key);
    quizMap.set(key, {
      ...(fallbackQuiz || quiz),
      ...quiz,
      questions: quiz.questions?.length ? quiz.questions : fallbackQuiz?.questions || []
    });
  });

  return Array.from(quizMap.values());
};

const isEmbeddableVideoUrl = (url?: string) => {
  if (!url) return false;

  return /(youtube(-nocookie)?\.com\/embed|youtube\.com\/watch\?v=|youtu\.be\/|player\.vimeo\.com\/video\/|vimeo\.com\/)/i.test(url);
};

const appendQueryParams = (baseUrl: string, params: Record<string, string>) => {
  try {
    const parsedUrl = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      parsedUrl.searchParams.set(key, value);
    });
    return parsedUrl.toString();
  } catch {
    return baseUrl;
  }
};

const normalizeVideoUrl = (url?: string) => {
  if (!url) {
    return '';
  }

  const trimmedUrl = url.trim();
  const youtubeWatchMatch = trimmedUrl.match(/[?&]v=([^&]+)/i);
  if (trimmedUrl.includes('youtube.com/watch') && youtubeWatchMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${youtubeWatchMatch[1]}`;
  }

  const shortYoutubeMatch = trimmedUrl.match(/youtu\.be\/([^?&]+)/i);
  if (shortYoutubeMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortYoutubeMatch[1]}`;
  }

  if (trimmedUrl.includes('youtube.com/embed/')) {
    return trimmedUrl.replace('https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/');
  }

  if (trimmedUrl.includes('youtube-nocookie.com/embed/')) {
    return trimmedUrl;
  }

  const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch?.[1] && !trimmedUrl.includes('player.vimeo.com')) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmedUrl;
};

const getYoutubeVideoId = (url?: string) => {
  const value = String(url || '').trim();
  if (!value) return '';
  const watchMatch = value.match(/[?&]v=([^&]+)/i);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) return shortMatch[1];
  const embedMatch = value.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/i);
  if (embedMatch?.[1]) return embedMatch[1];
  return '';
};

const formatVideoClock = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const lockWebOrientation = async (orientation: AppOrientationLock) => {
  const orientationApi = screen.orientation as LockableScreenOrientation | undefined;
  await orientationApi?.lock?.(orientation).catch(() => undefined);
};

const getProtectedEmbedUrl = (url?: string, autoplay = false) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) {
    return '';
  }

  if (/youtube(-nocookie)?\.com\/embed\//i.test(normalizedUrl)) {
    const params: Record<string, string> = {
      autoplay: autoplay ? '1' : '0',
      enablejsapi: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      controls: '0',
      fs: '0',
      showinfo: '0',
      iv_load_policy: '3',
      disablekb: '1'
    };

    if (typeof window !== 'undefined') {
      params.origin = window.location.origin;
    }

    return appendQueryParams(normalizedUrl, params);
  }

  if (/player\.vimeo\.com\/video\//i.test(normalizedUrl)) {
    return appendQueryParams(normalizedUrl, {
      autoplay: autoplay ? '1' : '0',
      autopause: '1',
      title: '0',
      byline: '0',
      portrait: '0',
      controls: '0'
    });
  }

  return normalizedUrl;
};

type NativeBridgeWindow = Window & {
  Android?: {
    setSecureMode?: (enabled: boolean) => void;
    setFlagSecure?: (enabled: boolean) => void;
    enableSecureMode?: () => void;
    disableSecureMode?: () => void;
    enablePushNotifications?: () => void;
    openNotifications?: () => void;
  };
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
  webkit?: {
    messageHandlers?: {
      secureMode?: { postMessage: (message: unknown) => void };
      notifications?: { postMessage: (message: unknown) => void };
    };
  };
};

const callNativeBridge = (action: string, payload: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const bridgeWindow = window as NativeBridgeWindow;

  try {
    if (action === 'secure-mode') {
      const enabled = Boolean(payload.enabled);
      if (bridgeWindow.Android?.setSecureMode) {
        bridgeWindow.Android.setSecureMode(enabled);
        return true;
      }
      if (bridgeWindow.Android?.setFlagSecure) {
        bridgeWindow.Android.setFlagSecure(enabled);
        return true;
      }
      if (enabled && bridgeWindow.Android?.enableSecureMode) {
        bridgeWindow.Android.enableSecureMode();
        return true;
      }
      if (!enabled && bridgeWindow.Android?.disableSecureMode) {
        bridgeWindow.Android.disableSecureMode();
        return true;
      }
      if (bridgeWindow.webkit?.messageHandlers?.secureMode) {
        bridgeWindow.webkit.messageHandlers.secureMode.postMessage({ enabled });
        return true;
      }
    }

    if (action === 'notifications') {
      if (bridgeWindow.Android?.openNotifications) {
        bridgeWindow.Android.openNotifications();
        return true;
      }
      if (bridgeWindow.Android?.enablePushNotifications) {
        bridgeWindow.Android.enablePushNotifications();
        return true;
      }
      if (bridgeWindow.webkit?.messageHandlers?.notifications) {
        bridgeWindow.webkit.messageHandlers.notifications.postMessage(payload);
        return true;
      }
    }

    if (bridgeWindow.ReactNativeWebView?.postMessage) {
      bridgeWindow.ReactNativeWebView.postMessage(JSON.stringify({ action, ...payload }));
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

const setNativeSecureMode = (enabled: boolean) => {
  callNativeBridge('secure-mode', { enabled });
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('app-secure-mode', enabled);
  }
};

const isNotificationSupported = () => (
  typeof window !== 'undefined' && 'Notification' in window
);

const getNotificationPermissionState = () => (
  isNotificationSupported() ? Notification.permission : 'unsupported'
);

const isNativePushAvailable = () => (
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')
);

const isNativeLocalNotificationAvailable = () => (
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')
);

const ensureNativeNotificationChannels = async () => {
  if (isNativePushAvailable()) {
    await PushNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_UPDATES,
      name: 'Monto Updates',
      description: 'Course updates, live class reminders, and academy notices.',
      importance: 4,
      visibility: 1,
      sound: NOTIFICATION_SOUND_FILE,
      lights: true,
      lightColor: '#0047AB',
      vibration: true,
    });
  }

  if (isNativeLocalNotificationAvailable()) {
    await Promise.all([
      LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_UPDATES,
        name: 'Monto Updates',
        description: 'Course updates, live class reminders, and academy notices.',
        importance: 4,
        visibility: 1,
        sound: NOTIFICATION_SOUND_FILE,
        lights: true,
        lightColor: '#0047AB',
        vibration: true,
      }),
      LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_COURSE_ACCESS,
        name: 'Course Access',
        description: 'Premium course unlock and access alerts.',
        importance: 5,
        visibility: 1,
        sound: NOTIFICATION_SOUND_FILE,
        lights: true,
        lightColor: '#0047AB',
        vibration: true,
      }),
      LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_LIVE_CLASSES,
        name: 'Live Class Alerts',
        description: 'Upcoming and starting live class reminders.',
        importance: 5,
        visibility: 1,
        sound: NOTIFICATION_SOUND_FILE,
        lights: true,
        lightColor: '#0EA5E9',
        vibration: true,
      }),
    ]);
  }
};

const showLocalNotification = async (title: string, options: NotificationOptions = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    badge: '/icons/icon-192.png',
    icon: '/icons/icon-192.png',
    ...options,
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, notificationOptions);
    return true;
  }

  new Notification(title, notificationOptions);
  return true;
};

const showAppNotification = async (
  title: string,
  body: string,
  extra: Record<string, unknown> = {},
  channelId = NOTIFICATION_CHANNEL_UPDATES
) => {
  if (isNativeLocalNotificationAvailable()) {
    try {
      await ensureNativeNotificationChannels();
      let permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        permission = await LocalNotifications.requestPermissions();
      }

      if (permission.display !== 'granted') {
        return false;
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Date.now() % 2147483647),
          title,
          body,
          largeBody: body,
          channelId,
          sound: NOTIFICATION_SOUND_FILE,
          iconColor: '#0047AB',
          autoCancel: true,
          extra,
        }],
      });
      return true;
    } catch (error) {
      console.error('Unable to show native notification:', error);
    }
  }

  return showLocalNotification(title, {
    body,
    tag: String(extra.type || channelId),
    data: extra,
  });
};

const createStableNotificationId = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash % 2147480000) || 1;
};

const getLiveClassNotificationPayload = (liveClass: LiveClass, phase: 'reminder' | 'start') => ({
  type: 'live-class-alert',
  screen: 'live-classes',
  liveClassId: liveClass.id,
  phase,
  notificationId: `live-class-${phase}-${liveClass.id}`,
});

const scheduleNativeLiveClassAlerts = async (liveClasses: LiveClass[]) => {
  if (!isNativeLocalNotificationAvailable()) {
    return false;
  }

  try {
    await ensureNativeNotificationChannels();
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== 'granted') {
      return false;
    }

    const now = Date.now();
    const notifications = liveClasses.flatMap((liveClass) => {
      if (!liveClass.is_active || !liveClass.scheduled_at || !isValidMeetingUrl(liveClass.meeting_url)) {
        return [];
      }

      const startsAt = new Date(liveClass.scheduled_at).getTime();
      if (!Number.isFinite(startsAt) || startsAt <= now + 30 * 1000) {
        return [];
      }

      const reminderAt = startsAt - LIVE_CLASS_REMINDER_LEAD_MS;
      const items = [];
      if (reminderAt > now + 30 * 1000) {
        items.push({
          id: createStableNotificationId(`${liveClass.id}:reminder`),
          title: `Live class soon: ${liveClass.title}`,
          body: `Starts in 15 minutes. ${formatLiveClassDate(liveClass.scheduled_at)}`,
          largeBody: `Your Monto live class "${liveClass.title}" starts in 15 minutes.`,
          schedule: { at: new Date(reminderAt) },
          channelId: NOTIFICATION_CHANNEL_LIVE_CLASSES,
          sound: NOTIFICATION_SOUND_FILE,
          iconColor: '#0EA5E9',
          autoCancel: true,
          extra: getLiveClassNotificationPayload(liveClass, 'reminder'),
        });
      }

      items.push({
        id: createStableNotificationId(`${liveClass.id}:start`),
        title: `Live class starting: ${liveClass.title}`,
        body: 'Tap to open Live Classes and join now.',
        largeBody: `Your Monto live class "${liveClass.title}" is starting now.`,
        schedule: { at: new Date(startsAt) },
        channelId: NOTIFICATION_CHANNEL_LIVE_CLASSES,
        sound: NOTIFICATION_SOUND_FILE,
        iconColor: '#0EA5E9',
        autoCancel: true,
        extra: getLiveClassNotificationPayload(liveClass, 'start'),
      });

      return items;
    });

    if (!notifications.length) {
      return true;
    }

    await LocalNotifications.schedule({ notifications });
    return true;
  } catch (error) {
    console.error('Unable to schedule live class alerts:', error);
    return false;
  }
};

const requestAppNotifications = async () => {
  callNativeBridge('notifications', { source: 'student-app' });

  if (isNativePushAvailable() || isNativeLocalNotificationAvailable()) {
    try {
      await ensureNativeNotificationChannels();

      let pushStatus = 'unavailable';
      if (isNativePushAvailable()) {
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
          permission = await PushNotifications.requestPermissions();
        }
        pushStatus = permission.receive;
      }

      let localStatus = 'unavailable';
      if (isNativeLocalNotificationAvailable()) {
        let permission = await LocalNotifications.checkPermissions();
        if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
          permission = await LocalNotifications.requestPermissions();
        }
        localStatus = permission.display;
      }

      const success = pushStatus === 'granted' || localStatus === 'granted';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(NOTIFICATION_PREF_STORAGE_KEY, success ? 'true' : 'false');
      }

      if (!success) {
        return {
          success: false,
          status: localStatus !== 'unavailable' ? localStatus : pushStatus,
          message: 'Notification permission was not allowed.',
        };
      }

      if (pushStatus === 'granted' && isNativePushAvailable()) {
        await PushNotifications.register();
      }

      await showAppNotification('Monto notifications enabled', 'Course unlock, live class, and admin alerts are now active.', {
        type: 'notifications-enabled',
        screen: 'home',
      });

      return {
        success: true,
        status: pushStatus === 'granted' ? 'registering' : 'local-ready',
        message: pushStatus === 'granted'
          ? 'Push registration started. Token will appear after Firebase responds.'
          : 'Local notifications enabled.',
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to register push notifications.',
      };
    }
  }

  if (!isNotificationSupported()) {
    return { success: false, status: 'unsupported', message: 'Notifications are not supported in this browser.' };
  }

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;

  const success = permission === 'granted';
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(NOTIFICATION_PREF_STORAGE_KEY, success ? 'true' : 'false');
  }

  if (success) {
    await showLocalNotification('Monto notifications enabled', {
      body: 'You will receive course updates, live class reminders, and admin alerts here.',
      tag: 'monto-notifications-enabled',
    });
  }

  return {
    success,
    status: permission,
    message: success ? 'Notifications enabled' : 'Notification permission was not allowed.',
  };
};

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [authStep, setAuthStep] = useState<'credentials' | 'signup-otp' | 'forgot-email' | 'forgot-otp'>('credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [classLevel, setClassLevel] = useState<StudentClassLevel>('class-12');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingSignupPassword, setPendingSignupPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (isSignup && !isValidStudentName(trimmedName)) {
      setError('Name must contain letters only');
      setLoading(false);
      return;
    }

    if (isSignup && normalizedPhone.length < 10) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    const normalizedClassLevel = normalizeStudentClassLevel(classLevel);

    try {
      const devicePayload = getDevicePayload();
      const payload = isSignup
        ? { name: trimmedName, email, phone: normalizedPhone, classLevel: normalizedClassLevel, password, ...devicePayload }
        : { email, password, ...devicePayload };

      const res = await apiAuthPost(isSignup ? 'request-signup-otp' : 'login', payload);
      const data = await readLenientJsonResponse(res);
      if (data.success) {
        if (isSignup) {
          setPendingSignupPassword(password);
          setAuthStep('signup-otp');
          setOtp('');
          setError('');
          setInfo('OTP sent to your email.');
          setLoading(false);
          return;
        }
        const normalizedUser = normalizeAuthUser(data.user, { name: trimmedName, email, phone: normalizedPhone, classLevel: normalizedClassLevel });
        onLogin(normalizedUser);
      } else {
        setError(data.message || (isSignup ? 'Signup failed' : 'Login failed'));
      }
    } catch (err) {
      if (isSignup) {
        setError(err instanceof Error ? err.message : 'Email verification is required. Please try again online.');
        return;
      }
      const localResult = runLocalStudentAuth(isSignup ? 'signup' : 'login', {
        name: trimmedName,
        email,
        phone: normalizedPhone,
        classLevel: normalizedClassLevel,
        password,
      });
      if (localResult.success) {
        onLogin(normalizeAuthUser(localResult.user, { name: trimmedName, email, phone: normalizedPhone, classLevel: normalizedClassLevel }));
      } else {
        setError(localResult.message || (err instanceof Error ? err.message : 'Internet is required to verify this mobile. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await apiAuthPost('verify-signup-otp', { email, otp });
      const data = await readLenientJsonResponse(res);
      if (!data.success) {
        setError(data.message || 'Invalid OTP');
        return;
      }
      const normalizedUser = normalizeAuthUser(data.user, { name: name.trim(), email, phone: normalizePhoneNumber(phone), classLevel });
      const storedUsers = getStoredUsers();
      const storedUser: StoredUser = { ...normalizedUser, password: pendingSignupPassword || password };
      const withoutDuplicate = storedUsers.filter((item) => String(item.email || '').toLowerCase() !== String(normalizedUser.email || '').toLowerCase());
      saveStoredUsers([...withoutDuplicate, storedUser]);
      onLogin(normalizedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await apiAuthPost('request-password-reset-otp', { email });
      const data = await readLenientJsonResponse(res);
      if (!data.success) {
        setError(data.message || 'Unable to send OTP');
        return;
      }
      setAuthStep('forgot-otp');
      setOtp('');
      setInfo('OTP sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPasswordResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await apiAuthPost('verify-password-reset-otp', { email, otp });
      const data = await readLenientJsonResponse(res);
      if (!data.success) {
        setError(data.message || 'Invalid OTP');
        return;
      }
      setAuthStep('credentials');
      setIsSignup(false);
      setPassword('');
      setOtp('');
      setInfo('Temporary password sent to your email. Please login with it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetAuthFormMode = (signup: boolean) => {
    setIsSignup(signup);
    setAuthStep('credentials');
    setError('');
    setInfo('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="auth-scenic-shell auth-login-page flex-1 flex items-center justify-center p-5 sm:p-6"
    >
      <div className="auth-scenic-card auth-login-card px-6 py-6 sm:px-8 sm:py-8">
      <div className="auth-login-brand">
        <img className="auth-login-logo" src="/logo.png" alt="Monto logo" />
        <div className="auth-login-badge">Monto</div>
        <div className="auth-login-copy">
          <h1 className="auth-login-title">{isSignup ? 'Create account' : 'Welcome back'}</h1>
          <p className="auth-login-subtitle">
            {isSignup
              ? 'Create your student account to save progress and access your learning dashboard.'
              : 'Sign in to continue with your courses, notes, quizzes, and saved access.'}
          </p>
        </div>
      </div>
      <div className="auth-login-switch" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          onClick={() => {
            resetAuthFormMode(false);
          }}
          className={`auth-login-switch-button ${!isSignup ? 'auth-login-switch-button--active' : ''}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            resetAuthFormMode(true);
          }}
          className={`auth-login-switch-button ${isSignup ? 'auth-login-switch-button--active' : ''}`}
        >
          Sign Up
        </button>
      </div>

      {authStep === 'signup-otp' ? (
        <form onSubmit={handleVerifySignupOtp} className="w-full space-y-4">
          <label className="auth-login-field">
            <span className="auth-login-label">Email OTP</span>
            <input
              type="text"
              inputMode="numeric"
              required
              className="auth-scenic-input auth-login-input text-sm text-center tracking-[0.35em]"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <div className="auth-login-meta">
            <div className="auth-login-note">OTP sent to {email}. It expires in 10 minutes.</div>
            <button type="button" onClick={() => setAuthStep('credentials')} className="auth-scenic-link text-sm">Edit details</button>
          </div>
          {info && <p className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{info}</p>}
          {error && <p className="auth-login-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-scenic-button auth-login-submit py-4 mt-2 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify Email'}
          </button>
        </form>
      ) : authStep === 'forgot-email' ? (
        <form onSubmit={handleRequestPasswordReset} className="w-full space-y-4">
          <label className="auth-login-field">
            <span className="auth-login-label">Registered Email</span>
            <input
              type="email"
              required
              className="auth-scenic-input auth-login-input text-sm"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <div className="auth-login-meta">
            <div className="auth-login-note">We will send an OTP to verify this email.</div>
            <button type="button" onClick={() => resetAuthFormMode(false)} className="auth-scenic-link text-sm">Back to login</button>
          </div>
          {info && <p className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{info}</p>}
          {error && <p className="auth-login-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-scenic-button auth-login-submit py-4 mt-2 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Send OTP'}
          </button>
        </form>
      ) : authStep === 'forgot-otp' ? (
        <form onSubmit={handleVerifyPasswordResetOtp} className="w-full space-y-4">
          <label className="auth-login-field">
            <span className="auth-login-label">Password Reset OTP</span>
            <input
              type="text"
              inputMode="numeric"
              required
              className="auth-scenic-input auth-login-input text-sm text-center tracking-[0.35em]"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </label>
          <div className="auth-login-meta">
            <div className="auth-login-note">After OTP verification, a temporary password will be emailed.</div>
            <button type="button" onClick={() => setAuthStep('forgot-email')} className="auth-scenic-link text-sm">Change email</button>
          </div>
          {info && <p className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{info}</p>}
          {error && <p className="auth-login-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-scenic-button auth-login-submit py-4 mt-2 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify OTP'}
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {isSignup && (
          <label className="auth-login-field">
            <span className="auth-login-label">Full Name</span>
            <input
              type="text"
              required
              className="auth-scenic-input auth-login-input text-sm"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        {isSignup && (
          <label className="auth-login-field">
            <span className="auth-login-label">Mobile Number</span>
            <input
              type="tel"
              required
              className="auth-scenic-input auth-login-input text-sm"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        )}
        {isSignup && (
          <label className="auth-login-field">
            <span className="auth-login-label">Class</span>
            <select
              required
              className="auth-scenic-input auth-login-input text-sm"
              value={classLevel}
              onChange={(e) => setClassLevel(normalizeStudentClassLevel(e.target.value))}
            >
              {STUDENT_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        )}
        <label className="auth-login-field">
          <span className="auth-login-label">Email</span>
          <input
            type="email"
            required
            className="auth-scenic-input auth-login-input text-sm"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="auth-login-field">
          <span className="auth-login-label">Password</span>
          <input 
            type="password" 
            required
            className="auth-scenic-input auth-login-input text-sm"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {isSignup && (
          <label className="auth-login-field">
            <span className="auth-login-label">Confirm Password</span>
            <input
              type="password"
              required
              className="auth-scenic-input auth-login-input text-sm"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
        )}
        
        <div className="auth-login-meta">
          <div className="auth-login-note">{isSignup ? 'Use a password you will remember.' : 'Use the same email and password you signed up with.'}</div>
          {!isSignup && <button type="button" onClick={() => { setAuthStep('forgot-email'); setError(''); }} className="auth-scenic-link text-sm">Forgot password?</button>}
        </div>

        {info && <p className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{info}</p>}
        {error && <p className="auth-login-error">{error}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="auth-scenic-button auth-login-submit py-4 mt-2 flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isSignup ? 'Create Account' : 'Log In')}
        </button>

      </form>
      )}

      <p className="auth-login-footer">
        {isSignup ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => {
            resetAuthFormMode(!isSignup);
          }}
          className="auth-login-footer-link"
        >
          {isSignup ? 'Sign In' : 'Create one'}
        </button>
      </p>
      </div>
    </motion.div>
  );
};

const Loading = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500 text-sm animate-pulse">Loading Academy...</p>
  </div>
);

const NoInternetScreen = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="no-internet-screen flex-1"
  >
    <div className="no-internet-card">
      <div className="no-internet-icon">
        <WifiOff size={34} />
      </div>
      <p className="no-internet-kicker">Connection Lost</p>
      <h1>No internet connection</h1>
      <p>
        Please check mobile data or Wi-Fi. Monto will reconnect automatically when the network is back.
      </p>
      <button type="button" onClick={onRetry}>
        <RefreshCw size={18} />
        Try Again
      </button>
      <span>Cached pages and installed app shell stay ready offline.</span>
    </div>
  </motion.div>
);

const AppControlStopScreen = ({
  title,
  message,
  actionLabel,
  actionUrl,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="no-internet-screen flex-1"
  >
    <div className="no-internet-card">
      <div className="no-internet-icon">
        <Smartphone size={34} />
      </div>
      <p className="no-internet-kicker">App Control</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {actionUrl && (
        <button type="button" onClick={() => openExternalResource(actionUrl)}>
          <ExternalLink size={18} />
          {actionLabel || 'Open'}
        </button>
      )}
    </div>
  </motion.div>
);

const BlockedAccountScreen = ({
  user,
  message,
  onLogout,
}: {
  user: AuthUser | null;
  message: string;
  onLogout: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="auth-scenic-shell auth-login-page flex-1 flex items-center justify-center p-5 sm:p-6"
  >
    <div className="auth-scenic-card auth-login-card blocked-account-card px-6 py-7 sm:px-8 sm:py-8">
      <div className="blocked-account-icon">
        <Lock size={28} />
      </div>
      <div className="auth-login-brand blocked-account-copy">
        <div className="auth-login-badge">Account Blocked</div>
        <div className="auth-login-copy">
          <h1 className="auth-login-title">Access stopped</h1>
          <p className="auth-login-subtitle">
            {message || 'Your account is blocked. Contact academy admin.'}
          </p>
        </div>
      </div>
      {user?.email && (
        <div className="blocked-account-user">
          <span>{user.name || 'Student'}</span>
          <b>{user.email}</b>
        </div>
      )}
      <button type="button" onClick={onLogout} className="auth-scenic-button auth-login-submit py-4 mt-5">
        Back to Login
      </button>
    </div>
  </motion.div>
);

const AccessCodeModal = ({ 
  isOpen, 
  onClose, 
  onUnlock, 
  courseTitle 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUnlock: (code: string) => Promise<{ success: boolean; message?: string }>,
  courseTitle: string
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!code.trim()) {
      setError('Please enter access code');
      return;
    }

    setLoading(true);
    const result = await onUnlock(code);
    if (!result.success) {
      setError(result.message || 'Invalid access code');
    }
    setLoading(false);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello, I want to buy "${courseTitle}". Please share the details and access code.`);
    window.open(`https://wa.me/9779819239480?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-primary p-6 text-white text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20} /></button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold">Unlock Course</h3>
                <p className="text-white/70 text-xs mt-1">{courseTitle}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Enter Access Code</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                  />
                  {error && <p className="text-red-500 text-[10px] mt-1 text-center font-medium">{error}</p>}
                </div>

                <button 
                  onClick={handleUnlock}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  {loading ? 'Checking...' : 'Unlock Now'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-300"><span className="bg-white px-2">OR</span></div>
                </div>

                <button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <MessageSquare size={20} />
                  Buy on WhatsApp
                </button>

                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Contact admin on WhatsApp to get your unique access code after payment.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BottomNav = ({
  activeScreen,
  setScreen,
  onCoursesClick,
  onQuizClick,
}: {
  activeScreen: Screen,
  setScreen: (s: Screen) => void,
  onCoursesClick?: () => void,
  onQuizClick?: () => void
}) => {
  const coursesActive = activeScreen === 'courses' || activeScreen === 'my-courses';

  return (
    <nav className="nav-bottom">
      <button onClick={() => setScreen('home')} className={`nav-item ${activeScreen === 'home' ? 'active' : ''}`}>
        <Home size={24} />
        <span className="text-[10px] font-medium">Home</span>
      </button>
      <button onClick={() => onCoursesClick ? onCoursesClick() : setScreen('courses')} className={`nav-item ${coursesActive ? 'active' : ''}`}>
        <BookOpen size={24} />
        <span className="text-[10px] font-medium">Courses</span>
      </button>
      <button onClick={() => setScreen('notes')} className={`nav-item ${activeScreen === 'notes' ? 'active' : ''}`}>
        <FileText size={24} />
        <span className="text-[10px] font-medium">Notes</span>
      </button>
      <button onClick={() => onQuizClick ? onQuizClick() : setScreen('quiz')} className={`nav-item ${activeScreen === 'quiz' ? 'active' : ''}`}>
        <HelpCircle size={24} />
        <span className="text-[10px] font-medium">Quiz</span>
      </button>
      <button onClick={() => setScreen('profile')} className={`nav-item ${activeScreen === 'profile' ? 'active' : ''}`}>
        <User size={24} />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </nav>
  );
};

const Header = ({ title, user, showBack, onBack, onMenuClick, onNotificationClick, notificationCount = 0 }: { title: string, user?: AuthUser | null, showBack?: boolean, onBack?: () => void, onMenuClick?: () => void, onNotificationClick?: () => void, notificationCount?: number }) => (
  <header className="hero-gradient text-white px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg shadow-blue-900/10">
    <div className="flex items-center gap-3">
      {showBack ? (
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"><ArrowLeft size={20} /></button>
      ) : (
        <button onClick={onMenuClick} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"><Menu size={20} /></button>
      )}
      <div>
        {title !== 'Monto' && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">Monto</div>
            <div className="max-w-[180px] truncate text-[11px] font-semibold text-white/75">
              {user?.name ? `Hi, ${user.name}` : 'Student'}
            </div>
          </div>
        )}
        <h1 className="text-lg font-bold">{title}</h1>
        {title === 'Monto' && (
          <p className="max-w-[190px] truncate text-xs font-semibold text-white/75">
            {user?.name ? `Hi, ${user.name}` : 'Welcome, Student'}
          </p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onNotificationClick} className="relative w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center" aria-label="Open notifications">
        <Bell size={20} />
        {notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-[10px] font-black leading-5 text-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.open('https://wa.me/9779823415625', '_blank', 'noopener,noreferrer');
          }
        }}
        className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <MessageSquare size={20} />
      </button>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
        <img src={getUserAvatarUrl(user || { name: 'Monto' })} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </div>
    </div>
  </header>
);

const StudentNotificationsPanel = ({
  isOpen,
  notifications,
  notificationsEnabled,
  notificationStatus,
  onClose,
  onEnableNotifications,
  onOpenNotification,
  onClearNotifications,
}: {
  isOpen: boolean;
  notifications: StudentNotificationItem[];
  notificationsEnabled: boolean;
  notificationStatus: string;
  onClose: () => void;
  onEnableNotifications: () => void;
  onOpenNotification: (notification: StudentNotificationItem) => void;
  onClearNotifications: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-950/55 px-4 py-5 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="mt-14 flex max-h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Recent</p>
              <h2 className="text-lg font-black text-gray-900">Notifications</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gray-100 text-gray-600"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800">
                {notificationsEnabled ? 'Notifications enabled' : 'Notifications not enabled'}
              </p>
              <p className="truncate text-[11px] font-semibold text-gray-500">Status: {notificationStatus || 'unknown'}</p>
            </div>
            {!notificationsEnabled && (
              <button
                type="button"
                onClick={onEnableNotifications}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white"
              >
                Enable
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {notifications.length ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onOpenNotification(notification)}
                    className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-primary">
                        <Bell size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-gray-900">{notification.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-gray-600">{notification.body}</span>
                        <span className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-gray-400">
                          <span>{formatNotificationTime(notification.receivedAt)}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-500">{notification.screen || 'home'}</span>
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-sm">
                  <Bell size={20} />
                </div>
                <h3 className="mt-4 text-sm font-black text-gray-900">No recent notifications</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">Admin alerts, course unlocks, and live updates will appear here.</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={onClearNotifications}
                className="w-full rounded-2xl bg-gray-100 py-3 text-xs font-black text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
    {onSeeAll && (
      <button onClick={onSeeAll} className="app-chip px-3 py-1.5 text-primary text-sm font-medium">See All</button>
    )}
  </div>
);

const binauralBeatSessions = [
  {
    id: 'focus-14hz',
    title: 'Focus Study',
    beatHz: 14,
    baseHz: 220,
    length: '25 min',
    tone: 'Deep focus',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'memory-10hz',
    title: 'Memory Boost',
    beatHz: 10,
    baseHz: 210,
    length: '20 min',
    tone: 'Calm revision',
    color: 'from-emerald-600 to-teal-500',
  },
  {
    id: 'relax-6hz',
    title: 'Relax Reset',
    beatHz: 6,
    baseHz: 200,
    length: '15 min',
    tone: 'Slow breathing',
    color: 'from-orange-500 to-rose-500',
  },
  {
    id: 'sleep-3hz',
    title: 'Sleep Prep',
    beatHz: 3,
    baseHz: 190,
    length: '30 min',
    tone: 'Night calm',
    color: 'from-slate-700 to-indigo-600',
  },
];

type BinauralAudioNodes = {
  context: AudioContext;
  leftOscillator: OscillatorNode;
  rightOscillator: OscillatorNode;
  leftGain: GainNode;
  rightGain: GainNode;
  outputGain: GainNode;
};

const BinauralBeatsScreen = () => {
  const [activeBeatId, setActiveBeatId] = useState(binauralBeatSessions[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const audioNodesRef = useRef<BinauralAudioNodes | null>(null);
  const activeBeat = binauralBeatSessions.find((beat) => beat.id === activeBeatId) || binauralBeatSessions[0];

  const stopBeat = () => {
    const nodes = audioNodesRef.current;
    if (!nodes) {
      setIsPlaying(false);
      return;
    }

    const now = nodes.context.currentTime;
    nodes.outputGain.gain.cancelScheduledValues(now);
    nodes.outputGain.gain.setTargetAtTime(0.0001, now, 0.04);
    window.setTimeout(() => {
      try {
        nodes.leftOscillator.stop();
        nodes.rightOscillator.stop();
        nodes.context.close();
      } catch {}
      if (audioNodesRef.current === nodes) {
        audioNodesRef.current = null;
      }
    }, 140);
    setIsPlaying(false);
  };

  const playBeat = async (beat = activeBeat) => {
    stopBeat();

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const leftOscillator = context.createOscillator();
    const rightOscillator = context.createOscillator();
    const leftGain = context.createGain();
    const rightGain = context.createGain();
    const merger = context.createChannelMerger(2);
    const outputGain = context.createGain();

    leftOscillator.type = 'sine';
    rightOscillator.type = 'sine';
    leftOscillator.frequency.value = beat.baseHz;
    rightOscillator.frequency.value = beat.baseHz + beat.beatHz;
    leftGain.gain.value = 0.5;
    rightGain.gain.value = 0.5;
    outputGain.gain.value = 0.0001;

    leftOscillator.connect(leftGain).connect(merger, 0, 0);
    rightOscillator.connect(rightGain).connect(merger, 0, 1);
    merger.connect(outputGain).connect(context.destination);

    leftOscillator.start();
    rightOscillator.start();
    await context.resume();
    outputGain.gain.setTargetAtTime(volume, context.currentTime, 0.08);
    audioNodesRef.current = { context, leftOscillator, rightOscillator, leftGain, rightGain, outputGain };
    setIsPlaying(true);
  };

  useEffect(() => {
    const nodes = audioNodesRef.current;
    if (nodes) {
      nodes.outputGain.gain.setTargetAtTime(volume, nodes.context.currentTime, 0.04);
    }
  }, [volume]);

  useEffect(() => () => stopBeat(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex-1 overflow-y-auto px-4 pt-4 pb-24"
    >
      <section className="binaural-hero rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">One Shot Mode</p>
            <h2 className="mt-2 text-2xl font-black">Binaural Beats</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">Use headphones and tap any beat below to start a focused study sound.</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14">
            <Headphones size={24} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-black/18 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/60">Now selected</p>
              <h3 className="text-lg font-black">{activeBeat.title}</h3>
              <p className="text-xs text-white/65">{activeBeat.beatHz}Hz beat • {activeBeat.tone}</p>
            </div>
            <button
              onClick={() => (isPlaying ? stopBeat() : playBeat())}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition-transform active:scale-95"
              aria-label={isPlaying ? 'Stop binaural beat' : 'Play binaural beat'}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
          </div>
          <div className={`binaural-wave ${isPlaying ? 'binaural-wave--playing' : ''}`} aria-hidden="true">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.06}s` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <SectionHeader title="Choose Beat" />
        <div className="grid grid-cols-2 gap-3">
          {binauralBeatSessions.map((beat) => {
            const isActive = activeBeatId === beat.id;
            return (
              <button
                key={beat.id}
                onClick={() => {
                  setActiveBeatId(beat.id);
                  playBeat(beat);
                }}
                className={`rounded-2xl border p-4 text-left shadow-sm transition-transform active:scale-[0.98] ${isActive ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${beat.color} text-white`}>
                  <Waves size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-900">{beat.title}</h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">{beat.beatHz}Hz • {beat.length}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{beat.tone}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-gray-800">
          <Volume2 size={18} />
          <h3 className="text-sm font-black">Volume</h3>
        </div>
        <input
          type="range"
          min="0"
          max="0.8"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-full accent-primary"
          aria-label="Binaural beat volume"
        />
        <p className="mt-3 text-xs leading-relaxed text-gray-500">Binaural beats work best with headphones at low volume. Do not use while driving.</p>
      </section>
    </motion.div>
  );
};

const SmartImage = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  return (
    <img
      src={src || ''}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};

const ImageSlider = ({ sliders }: { sliders: SliderItem[] }) => {
  const activeSlides = [...sliders]
    .filter((slider) => slider.is_active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const slides = activeSlides.length ? activeSlides : fallbackSliders;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || fallbackSliders[0];

  return (
    <div className="relative w-full h-52 overflow-hidden mb-6 shadow-xl shadow-slate-200/60">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentSlide.id}
          src={currentSlide.image_url}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? 'bg-white w-4' : 'bg-white/50'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-6 left-6 text-white">
        <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-bold mb-3">Featured</div>
        <h2 className="text-xl font-bold">{currentSlide.title}</h2>
        <p className="text-xs text-white/80 max-w-[220px]">{currentSlide.subtitle}</p>
      </div>
    </div>
  );
};

const SideDrawer = ({ isOpen, onClose, user, setScreen }: { isOpen: boolean, onClose: () => void, user: any, setScreen: (s: Screen) => void }) => {
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const menuItems = [
    { icon: <ShieldCheck size={20} />, label: 'Privacy Policy' },
    { icon: <MessageSquare size={20} />, label: 'Support Chat' },
    { icon: <Share2 size={20} />, label: 'Share App' },
    { icon: <Info size={20} />, label: 'About Us' },
    { icon: <User size={20} />, label: 'About Developer' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="bg-primary p-6 text-white relative overflow-hidden">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-white/30 p-1 mb-4">
                  <img 
                    src={getUserAvatarUrl(user)}
                    alt="Profile" 
                    className="w-full h-full rounded-full bg-white" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <h3 className="text-lg font-bold">{user?.name || 'Student'}</h3>
                <p className="text-white/70 text-xs">{user?.email || 'student@academy.com'}</p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</p>
              </div>
              {menuItems.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={async () => {
                    if (item.label === 'Settings') {
                      setScreen('settings');
                    }
                    if (item.label === 'About Us') {
                      setScreen('about-us');
                    }
                    if (item.label === 'About Developer') {
                      setScreen('about-developer');
                    }
                    if (item.label === 'Privacy Policy') {
                      setScreen('privacy-policy');
                    }
                    if (item.label === 'Support Chat') {
                      setScreen('support-chat');
                    }
                    if (item.label === 'Share App') {
                      setShareSheetOpen(true);
                      return;
                    }
                    onClose();
                  }}
                >
                  <div className="text-primary">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
          {shareSheetOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/55 px-4 pb-4 backdrop-blur-sm"
              onClick={() => setShareSheetOpen(false)}
            >
              <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.98 }}
                className="share-sheet w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Share App</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Where do you want to share?</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Share Monto with students using WhatsApp, Facebook, or any app.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareSheetOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500"
                    aria-label="Close share options"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await shareAcademyAppTo('whatsapp');
                      setShareSheetOpen(false);
                      onClose();
                    }}
                    className="share-option share-option--whatsapp"
                  >
                    <MessageSquare size={22} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await shareAcademyAppTo('facebook');
                      setShareSheetOpen(false);
                      onClose();
                    }}
                    className="share-option share-option--facebook"
                  >
                    <Share2 size={22} />
                    <span>Facebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await shareAcademyAppTo('system');
                      setShareSheetOpen(false);
                      onClose();
                    }}
                    className="share-option share-option--system"
                  >
                    <Share2 size={22} />
                    <span>More Apps</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await shareAcademyAppTo('copy');
                      setShareSheetOpen(false);
                      onClose();
                    }}
                    className="share-option share-option--copy"
                  >
                    <ExternalLink size={22} />
                    <span>Copy Link</span>
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                  {APP_SHARE_URL}
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

// --- Screens ---

const HomeScreen = ({ 
  setScreen, 
  courses, 
  notes,
  quizzes,
  sliders, 
  unlockedCourseIds, 
  onOpenCoursesTab,
  onOpenLiveClasses,
  onBuyClick,
  onCourseSelect
}: { 
  setScreen: (s: Screen) => void, 
  courses: Course[],
  notes: Note[],
  quizzes: Quiz[],
  sliders: SliderItem[],
  unlockedCourseIds: string[],
  onOpenCoursesTab: (tab: 'free' | 'premium') => void,
  onOpenLiveClasses: () => void,
  onBuyClick: (course: Course) => void,
  onCourseSelect: (course: Course) => void
}) => {
  const recentUpdates = [
    sliders[0] ? `Slider updated: ${sliders[0].title}` : '',
    courses[0] ? `Course live: ${courses[0].title}` : '',
    notes[0] ? `New note: ${notes[0].title}` : '',
    quizzes[0] ? `Quiz ready: ${quizzes[0].topic}` : '',
  ].filter(Boolean).slice(0, 4);
  const premiumCourses = courses.filter(course => !isCourseFree(course));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 overflow-y-auto pb-24 px-4 pt-4"
    >
      <ImageSlider sliders={sliders} />

      <button
        type="button"
        onClick={onOpenLiveClasses}
        className="mb-6 flex w-full items-center justify-between rounded-2xl bg-[linear-gradient(135deg,#17304f_0%,#24527d_100%)] px-5 py-4 text-left text-white shadow-lg shadow-blue-900/15"
      >
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">Live Classes Access</div>
          <div className="mt-1 text-base font-black">Start Free Learning</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
          <ArrowRight size={20} />
        </div>
      </button>

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => onOpenCoursesTab('free')} className="card-gradient-green p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-green-100">
          <BookOpen size={24} className="mb-2" />
          <div>
            <p className="font-bold">Free Courses</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Direct Access</span>
          </div>
        </button>
        <button onClick={() => onOpenCoursesTab('premium')} className="premium-action-card p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-amber-100">
          <div className="flex items-start justify-between">
            <ShieldCheck size={24} className="mb-2" />
            <span className="rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black uppercase">Pro</span>
          </div>
          <div>
            <p className="font-bold">Premium Courses</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{premiumCourses.length || 0} Courses</span>
          </div>
        </button>
        <button onClick={() => setScreen('notes')} className="card-gradient-blue p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-blue-100">
          <FileText size={24} className="mb-2" />
          <div>
            <p className="font-bold">Free Notes</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Download</span>
          </div>
        </button>
        <button onClick={() => setScreen('quiz')} className="card-gradient-red p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-red-100">
          <HelpCircle size={24} className="mb-2" />
          <div>
            <p className="font-bold">Practice Quiz</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Test Skills</span>
          </div>
        </button>
        <button onClick={() => setScreen('binaural-beats')} className="binaural-action-card col-span-2 p-4 rounded-xl text-white text-left flex items-center justify-between shadow-lg shadow-cyan-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/16">
              <Headphones size={24} />
            </div>
            <div>
              <p className="font-bold">Binaural Beats</p>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">One Shot Focus Audio</span>
            </div>
          </div>
          <ChevronRight size={22} />
        </button>
      </div>

      {!!premiumCourses.length && (
        <div>
          <SectionHeader title="Premium Courses" onSeeAll={() => onOpenCoursesTab('premium')} />
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {[...premiumCourses]
              .sort((a, b) => Number(unlockedCourseIds.includes(b.id)) - Number(unlockedCourseIds.includes(a.id)))
              .slice(0, 4)
              .map(course => {
              const isUnlocked = unlockedCourseIds.includes(course.id);
              return (
                <button
                  key={course.id}
                  onClick={() => {
                    onCourseSelect(course);
                    setScreen('course-details');
                  }}
                  className="premium-mini-card min-w-[190px] overflow-hidden rounded-xl border text-left shadow-sm"
                >
                  <div className="relative h-24">
                    <img src={course.image} alt={course.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className={`absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-black ${isUnlocked ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isUnlocked ? 'Admin Access' : `Rs ${course.price || 0}`}
                    </div>
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                      {isUnlocked ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-black text-gray-900">{course.title}</h3>
                    <p className="mt-1 text-[10px] font-semibold text-gray-500">{course.lessons}+ lessons • Premium access</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      <div className="mt-6">
        <SectionHeader title="Recent Updates" />
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
          {recentUpdates.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
          {!recentUpdates.length && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <p className="text-sm text-gray-700">Course content updates will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LiveClassesScreen = ({
  liveClasses,
  courses,
  onJoinClass,
}: {
  liveClasses: LiveClass[];
  courses: Course[];
  onJoinClass: (liveClass: LiveClass) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const visibleClasses = liveClasses
    .filter((item) => item.access_type === activeTab)
    .sort((left, right) => {
      const leftTime = left.scheduled_at ? new Date(left.scheduled_at).getTime() : 0;
      const rightTime = right.scheduled_at ? new Date(right.scheduled_at).getTime() : 0;
      return (leftTime || Number.MAX_SAFE_INTEGER) - (rightTime || Number.MAX_SAFE_INTEGER);
    });
  const liveCount = liveClasses.filter((item) => getLiveClassStatus(item.scheduled_at).label === 'Live Now').length;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#051B3B_0%,#0B5ED7_52%,#00A6C8_100%)] p-5 text-white shadow-xl shadow-blue-200/60">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Live Classes</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">Your classroom is ready</h2>
        <p className="mt-2 text-sm leading-6 text-white/78">Join scheduled sessions, course batches, and selected-student classes from one clean live lobby.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/12 px-3 py-3">
            <div className="text-xl font-black">{liveClasses.length}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">Sessions</div>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-3">
            <div className="text-xl font-black">{liveCount}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">Live Now</div>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-3">
            <div className="text-xl font-black">{liveClasses.filter((item) => item.access_type === 'premium').length}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">Premium</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {(['free', 'premium'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                activeTab === tab ? 'bg-white text-slate-900' : 'bg-white/10 text-white'
              }`}
            >
              <div className="uppercase tracking-[0.18em] text-[10px] opacity-70">{tab === 'free' ? 'Open' : 'Premium'}</div>
              <div className="mt-1">{tab === 'free' ? 'Free Live Classes' : 'Premium Live Classes'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {visibleClasses.map((liveClass) => {
          const linkedCourse = courses.find((course) => String(course.id) === String(liveClass.course_id || ''));
          const status = getLiveClassStatus(liveClass.scheduled_at);
          const isCompleted = status.label === 'Completed';
          const audienceLabel = liveClass.audience_type === 'all'
            ? 'All Students'
            : liveClass.audience_type === 'course'
              ? (linkedCourse ? 'Course Batch' : 'Course Missing')
              : 'Selected Students';
          return (
            <div key={liveClass.id} className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-lg shadow-slate-100/80">
              <div className="h-1.5 bg-[linear-gradient(90deg,#0ea5e9,#2563eb,#14b8a6)]" />
              <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${liveClass.access_type === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {liveClass.access_type}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getLiveClassStatusClass(status.tone)}`}>
                      {status.label}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${liveClass.audience_type === 'course' && !linkedCourse ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {audienceLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-900">{liveClass.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{liveClass.description || 'Live session is ready for students. Join on time from the in-app class room.'}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Play size={18} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Schedule</div>
                  <div className="mt-1 font-bold">{formatLiveClassDate(liveClass.scheduled_at)}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{status.detail}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Course</div>
                  <div className="mt-1 font-bold">{linkedCourse?.title || (liveClass.audience_type === 'all' ? 'All courses' : 'Student specific session')}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onJoinClass(liveClass)}
                disabled={isCompleted}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isCompleted ? 'Class Completed' : 'Join Live Class'}
                <Play size={16} />
              </button>
              </div>
            </div>
          );
        })}

        {!visibleClasses.length && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="text-lg font-black text-slate-900">No {activeTab} live classes yet</div>
            <p className="mt-2 text-sm text-slate-500">When admin schedules a session for your access level, it will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LiveClassViewerScreen = ({
  liveClass,
  onBack,
}: {
  liveClass: LiveClass | null;
  onBack: () => void;
}) => {
  const [openError, setOpenError] = useState('');

  if (!liveClass) {
    return null;
  }

  const meetingUrlIsValid = isValidMeetingUrl(liveClass.meeting_url);
  const status = getLiveClassStatus(liveClass.scheduled_at);
  const isCompleted = status.label === 'Completed';
  const handleOpenClass = async () => {
    setOpenError('');
    try {
      await openMeetingUrl(liveClass.meeting_url);
    } catch {
      setOpenError('Unable to open the meeting. Please check your connection and try again.');
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 py-3">
        <button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black">{liveClass.title}</h3>
          <p className="truncate text-[11px] font-semibold text-white/55">{formatLiveClassDate(liveClass.scheduled_at)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
          status.tone === 'emerald' ? 'bg-emerald-400/15 text-emerald-200' :
          status.tone === 'amber' ? 'bg-amber-400/15 text-amber-100' :
          status.tone === 'blue' ? 'bg-sky-400/15 text-sky-100' :
          'bg-white/10 text-white/65'
        }`}>
          {status.label}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#071d3d_42%,#020617_100%)] px-5 py-6">
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[linear-gradient(135deg,#67e8f9,#22c55e)] text-slate-950 shadow-lg shadow-emerald-950/30">
              <Play size={28} fill="currentColor" />
            </div>
            <div className="mt-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Live class lobby</p>
              <h1 className="mt-2 text-2xl font-black leading-tight">{liveClass.title}</h1>
              <p className="mt-3 text-sm leading-6 text-white/68">
                {liveClass.description || 'Your live session is ready. Tap join to open the meeting with camera and microphone support.'}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Schedule</div>
                <div className="mt-1 text-sm font-bold text-white">{formatLiveClassDate(liveClass.scheduled_at)}</div>
                <div className="mt-1 text-xs font-semibold text-white/55">{status.detail}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Access</div>
                <div className="mt-1 text-sm font-bold capitalize text-white">{liveClass.access_type} class</div>
              </div>
            </div>

            {!meetingUrlIsValid && (
              <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/15 px-4 py-3 text-sm font-semibold leading-6 text-red-100">
                This live class has an invalid meeting link. Ask the admin to edit the class and paste a valid Google Meet, Zoom, or YouTube Live URL.
              </div>
            )}
            {isCompleted && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/70">
                This class time has passed. You can still open the meeting if admin keeps the room active.
              </div>
            )}
            {openError && (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/15 px-4 py-3 text-sm font-semibold leading-6 text-amber-100">
                {openError}
              </div>
            )}

            <button
              type="button"
              disabled={!meetingUrlIsValid}
              onClick={handleOpenClass}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-black/20 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/45"
            >
              Join Live Class
              <ExternalLink size={17} />
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-white/45">
              The class opens in a new secure tab or meeting app so camera, microphone, and screen sharing work correctly.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CoursesScreen = ({
  setScreen,
  courses,
  unlockedCourseIds, 
  initialTab,
  onBuyClick,
  onCourseSelect
}: { 
  setScreen: (s: Screen) => void, 
  courses: Course[],
  unlockedCourseIds: string[],
  initialTab: 'free' | 'premium',
  onBuyClick: (course: Course) => void,
  onCourseSelect: (course: Course) => void
}) => {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const freeCount = courses.filter(isCourseFree).length;
  const premiumCount = courses.filter(c => !isCourseFree(c)).length;
  const unlockedPremiumCount = courses.filter((course) => !isCourseFree(course) && unlockedCourseIds.includes(course.id)).length;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredCourses = courses
    .filter(c =>
      (activeTab === 'free' ? isCourseFree(c) : !isCourseFree(c)) &&
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => Number(unlockedCourseIds.includes(b.id)) - Number(unlockedCourseIds.includes(a.id)));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <div className={`mb-4 rounded-2xl p-4 text-white shadow-lg ${activeTab === 'premium' ? 'premium-course-hero shadow-amber-100' : 'bg-[linear-gradient(135deg,#0f8a45_0%,#075a35_100%)] shadow-green-100'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{activeTab === 'premium' ? 'Premium Courses' : 'Free Courses'}</p>
              <h2 className="mt-1 text-xl font-black">{activeTab === 'premium' ? 'Unlock focused batches' : 'Start learning today'}</h2>
              <p className="mt-1 text-xs text-white/75">
                {activeTab === 'premium'
                  ? `${unlockedPremiumCount} unlocked, ${premiumCount} total premium courses`
                  : `${freeCount} free courses available now`}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/16">
              {activeTab === 'premium' ? <CreditCard size={22} /> : <BookOpen size={22} />}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="w-full bg-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-1 rounded">
            <Filter size={14} />
          </button>
        </div>

        <div className={`rounded-lg px-4 py-3 text-sm font-black ${activeTab === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {activeTab === 'premium' ? `Premium Courses (${premiumCount})` : `Free Courses (${freeCount})`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {filteredCourses.map(course => {
          const isUnlocked = unlockedCourseIds.includes(course.id);
          const isFree = isCourseFree(course);
          const isAccessible = isCourseAccessible(course, unlockedCourseIds);
          
          return (
            <div key={course.id} className={`course-list-card bg-white rounded-xl overflow-hidden border shadow-sm flex flex-col ${isFree ? 'border-gray-100' : 'border-amber-100'}`}>
              <div className="relative h-40">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {!isFree && (
                    <div className={`absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase shadow-sm ${isUnlocked ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isUnlocked ? 'Admin Access' : 'Premium'}
                  </div>
                )}
                <div className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${isAccessible ? 'bg-emerald-500 text-white' : 'bg-black/55 text-white backdrop-blur-sm'}`}>
                  {isAccessible ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                  {isFree ? 'Free Access' : isUnlocked ? 'Unlocked' : 'Locked'}
                </div>
                <button 
                  onClick={() => {
                    onCourseSelect(course);
                    setScreen('course-details');
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group hover:bg-black/40 transition-all"
                >
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                    {isAccessible ? <Play size={24} fill="currentColor" /> : <ShieldCheck size={24} />}
                  </div>
                </button>
              </div>
              <div className="p-4 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800">{course.title}</h3>
                  <p className="text-xs text-gray-500">{course.lessons}+ Video Lessons & Notes</p>
                  {!isFree && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isUnlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isUnlocked ? 'Admin Access Active' : `Rs ${course.price} Only`}
                      </span>
                      {!!course.oldPrice && <span className="text-gray-400 text-[10px] line-through">Rs {course.oldPrice}</span>}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (isAccessible) {
                      onCourseSelect(course);
                      setScreen('course-details');
                      return;
                    }
                    onBuyClick(course);
                  }}
                  className={`${isAccessible ? 'bg-primary shadow-blue-100' : 'premium-buy-button shadow-amber-100'} shrink-0 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95`}
                >
                  {isFree ? 'Open Course' : isUnlocked ? 'Open Course' : 'Buy Now'}
                </button>
              </div>
            </div>
          );
        })}
        {!filteredCourses.length && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <BookOpen size={22} />
            </div>
            <h3 className="font-bold text-gray-800">No {activeTab} courses found</h3>
            <p className="mt-1 text-sm text-gray-500">Try another search or check back after new courses are added.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const VideoPlayerScreen = ({ 
  onBack, 
  course, 
  onLessonSelect, 
  onViewNotes,
  protectedMode = false,
  videoNotesEnabled = true,
  videoDownloadEnabled = false,
  watermark = 'Monto'
}: { 
  onBack: () => void, 
  course: Course | null,
  onLessonSelect: (lesson: Lesson) => void,
  onViewNotes: (lesson: Lesson) => void,
  protectedMode?: boolean,
  videoNotesEnabled?: boolean,
  videoDownloadEnabled?: boolean,
  watermark?: string
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(course?.lessonList?.[0] || null);
  const [customEmbedStarted, setCustomEmbedStarted] = useState(false);
  const [customEmbedPlaying, setCustomEmbedPlaying] = useState(false);
  const [customEmbedMuted, setCustomEmbedMuted] = useState(false);
  const [customEmbedTime, setCustomEmbedTime] = useState(0);
  const [customEmbedDuration, setCustomEmbedDuration] = useState(0);
  const [customEmbedSpeed, setCustomEmbedSpeed] = useState(1);
  const [youtubeControlsHidden, setYoutubeControlsHidden] = useState(false);
  const [youtubeSpeedMenuOpen, setYoutubeSpeedMenuOpen] = useState(false);
  const [customEmbedFullscreen, setCustomEmbedFullscreen] = useState(false);
  const youtubeHostRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YoutubePlayerApi | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const youtubeHideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentLesson(course?.lessonList?.[0] || null);
    setCustomEmbedStarted(false);
    setCustomEmbedPlaying(false);
    setCustomEmbedMuted(false);
    setCustomEmbedTime(0);
    setCustomEmbedDuration(0);
    setCustomEmbedSpeed(1);
    setYoutubeControlsHidden(false);
    setYoutubeSpeedMenuOpen(false);
    setCustomEmbedFullscreen(false);
  }, [course]);

  useEffect(() => {
    setCustomEmbedStarted(false);
    setCustomEmbedPlaying(false);
    setCustomEmbedMuted(false);
    setCustomEmbedTime(0);
    setCustomEmbedDuration(0);
    setCustomEmbedSpeed(1);
    setYoutubeControlsHidden(false);
    setYoutubeSpeedMenuOpen(false);
    setCustomEmbedFullscreen(false);
  }, [currentLesson?.id]);

  useEffect(() => {
    const videoId = getYoutubeVideoId(currentLesson?.video_url);
    const host = youtubeHostRef.current;
    if (!videoId || !host) {
      return;
    }

    let cancelled = false;
    let progressIntervalId: number | undefined;
    const nativeWindow = window as YoutubeWindow;
    const mountPlayer = () => {
      if (cancelled || !youtubeHostRef.current || !nativeWindow.YT?.Player) {
        return;
      }

      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = new nativeWindow.YT.Player(youtubeHostRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: (event) => {
            progressIntervalId = window.setInterval(() => {
              const player = youtubePlayerRef.current;
              if (!player) return;
              setCustomEmbedTime(Number(player.getCurrentTime?.() || 0));
              setCustomEmbedDuration(Number(player.getDuration?.() || 0));
            }, 500);
            if (customEmbedStarted && customEmbedTime > 0) {
              event.target?.seekTo(customEmbedTime, true);
            }
            if (customEmbedPlaying) {
              event.target?.playVideo();
            }
          },
          onStateChange: (event) => {
            const playingState = nativeWindow.YT?.PlayerState?.PLAYING ?? 1;
            const isPlaying = event.data === playingState;
            setCustomEmbedPlaying(isPlaying);
            setCustomEmbedStarted((started) => started || isPlaying);
            if (!isPlaying) {
              setYoutubeControlsHidden(false);
            }
          },
        },
      });
    };

    if (nativeWindow.YT?.Player) {
      mountPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      const previousReady = nativeWindow.onYouTubeIframeAPIReady;
      nativeWindow.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        mountPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (progressIntervalId) {
        window.clearInterval(progressIntervalId);
      }
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = null;
    };
  }, [currentLesson?.video_url, customEmbedFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === playerShellRef.current) {
        const nativeWindow = window as YoutubeWindow;
        nativeWindow.Android?.enterVideoFullscreen?.();
        setCustomEmbedFullscreen(true);
        return;
      }

      const nativeWindow = window as YoutubeWindow;
      nativeWindow.Android?.exitVideoFullscreen?.();
      void lockWebOrientation('portrait');
      setCustomEmbedFullscreen(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      const nativeWindow = window as YoutubeWindow;
      nativeWindow.Android?.exitVideoFullscreen?.();
      void lockWebOrientation('portrait');
      setCustomEmbedFullscreen(false);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!course) return null;

  const isProtectedSurface = protectedMode;
  const normalizedVideoUrl = normalizeVideoUrl(currentLesson?.video_url);
  const isProtectedYoutubeEmbed = /youtube(-nocookie)?\.com\/embed\//i.test(normalizedVideoUrl);
  const activeVideoUrl = getProtectedEmbedUrl(currentLesson?.video_url);
  const usesEmbedPlayer = isEmbeddableVideoUrl(activeVideoUrl);
  const lessonDownloadUrl = currentLesson?.download_enabled === false ? '' : (currentLesson?.download_url || '').trim();
  const lessonDownloadLabel = (currentLesson?.download_label || '').trim() || 'Open secure lesson download';
  const startYoutubeAutoHide = () => {
    if (youtubeHideTimeoutRef.current) {
      window.clearTimeout(youtubeHideTimeoutRef.current);
    }
    setYoutubeControlsHidden(false);
    youtubeHideTimeoutRef.current = window.setTimeout(() => {
      if (youtubePlayerRef.current?.getPlayerState?.() === 1) {
        setYoutubeControlsHidden(true);
        setYoutubeSpeedMenuOpen(false);
      }
    }, 2500);
  };
  const startCustomEmbed = () => {
    if (!youtubePlayerRef.current) {
      return;
    }
    setCustomEmbedStarted(true);
    setCustomEmbedPlaying(true);
    youtubePlayerRef.current.playVideo();
    startYoutubeAutoHide();
  };
  const toggleCustomEmbedPlayback = () => {
    if (!customEmbedStarted) {
      startCustomEmbed();
      return;
    }

    if (youtubePlayerRef.current) {
      customEmbedPlaying ? youtubePlayerRef.current.pauseVideo() : youtubePlayerRef.current.playVideo();
      startYoutubeAutoHide();
    }
    setCustomEmbedPlaying((isPlaying) => !isPlaying);
  };
  const toggleCustomEmbedMute = () => {
    if (youtubePlayerRef.current) {
      customEmbedMuted ? youtubePlayerRef.current.unMute() : youtubePlayerRef.current.mute();
      startYoutubeAutoHide();
    }
    setCustomEmbedMuted((isMuted) => !isMuted);
  };
  const setYoutubePlaybackSpeed = (speed: number) => {
    setCustomEmbedSpeed(speed);
    setYoutubeSpeedMenuOpen(false);
    youtubePlayerRef.current?.setPlaybackRate(speed);
    startYoutubeAutoHide();
  };
  const openCustomEmbedFullscreen = async () => {
    const nativeWindow = window as YoutubeWindow;
    setCustomEmbedFullscreen(true);
    nativeWindow.Android?.enterVideoFullscreen?.();
    await lockWebOrientation('landscape');
  };
  const closeCustomEmbedFullscreen = async () => {
    setCustomEmbedFullscreen(false);
    const nativeWindow = window as YoutubeWindow;
    nativeWindow.Android?.exitVideoFullscreen?.();
    await lockWebOrientation('portrait');
    if (document.fullscreenElement === playerShellRef.current) {
      await document.exitFullscreen?.().catch(() => undefined);
    }
  };
  const enterCustomEmbedPip = async () => {
    if (!customEmbedStarted) {
      startCustomEmbed();
    }

    setCustomEmbedFullscreen(false);
    const nativeWindow = window as YoutubeWindow;
    nativeWindow.Android?.enterPipMode?.();
    await lockWebOrientation('portrait');
  };
  const renderYoutubeControls = () => (
    <div className={`course-video-controls course-video-controls--pod ${youtubeControlsHidden ? 'hide' : ''}`} aria-label="Custom YouTube video controls">
      <button type="button" className="course-video-control-btn" onClick={toggleCustomEmbedPlayback} aria-label={customEmbedPlaying ? 'Pause video' : 'Play video'}>
        {customEmbedPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
      </button>
      <button type="button" className="course-video-control-btn" onClick={toggleCustomEmbedMute} aria-label={customEmbedMuted ? 'Unmute video' : 'Mute video'}>
        {customEmbedMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <button
        type="button"
        className="course-video-progress"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const nextTime = (customEmbedDuration || 0) * percent;
          setCustomEmbedTime(nextTime);
          youtubePlayerRef.current?.seekTo(nextTime, true);
          startYoutubeAutoHide();
        }}
        aria-label="Seek video"
      >
        <span style={{ width: `${customEmbedDuration > 0 ? (customEmbedTime / customEmbedDuration) * 100 : 0}%` }} />
      </button>
      <div className="course-video-time">
        {formatVideoClock(customEmbedTime)} / {formatVideoClock(customEmbedDuration)}
      </div>
      <div className="course-video-speed-wrap">
        <button type="button" className="course-video-control-btn course-video-speed" onClick={() => setYoutubeSpeedMenuOpen((isOpen) => !isOpen)} aria-label="Change playback speed">
          {customEmbedSpeed === 1 ? '1x' : `${customEmbedSpeed}x`}
        </button>
        {youtubeSpeedMenuOpen && (
          <div className="course-video-speed-menu">
            {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
              <button key={speed} type="button" onClick={() => setYoutubePlaybackSpeed(speed)}>
                {speed === 1 ? 'Normal' : `${speed}x`}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="course-video-control-btn" onClick={openCustomEmbedFullscreen} aria-label="Fullscreen video">
        <Maximize size={17} />
      </button>
      <button type="button" className="course-video-control-btn" onClick={enterCustomEmbedPip} aria-label="Picture in picture">
        <PictureInPicture2 size={17} />
      </button>
    </div>
  );

  const videoPlayerElement = activeVideoUrl && usesEmbedPlayer ? (
    <div
      className="course-video-player"
      data-fullscreen={customEmbedFullscreen ? 'true' : 'false'}
      ref={playerShellRef}
      onMouseMove={isProtectedYoutubeEmbed ? startYoutubeAutoHide : undefined}
      onTouchStart={isProtectedYoutubeEmbed ? startYoutubeAutoHide : undefined}
      onClick={isProtectedYoutubeEmbed ? startYoutubeAutoHide : undefined}
    >
      {isProtectedYoutubeEmbed ? (
        <div className="course-youtube-host" ref={youtubeHostRef} />
      ) : (
        <iframe
          src={activeVideoUrl}
          className="course-video-frame"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen={false}
          referrerPolicy="strict-origin-when-cross-origin"
          title={currentLesson?.title || course.title}
        ></iframe>
      )}
      {isProtectedYoutubeEmbed ? (
        <>
          <div className="course-video-hide course-video-hide--top" />
          <div className="course-video-hide course-video-hide--bottom" />
          <div className="course-video-brand course-video-brand--live">Monto</div>
          {customEmbedPlaying && (
            <button
              type="button"
              className="course-video-touch-layer"
              onClick={startYoutubeAutoHide}
              onTouchStart={startYoutubeAutoHide}
              aria-label="Show video controls"
            />
          )}
          {customEmbedFullscreen && (
            <button type="button" className="course-video-exit-fullscreen" onClick={closeCustomEmbedFullscreen} aria-label="Exit fullscreen">
              <X size={18} />
            </button>
          )}
          {!customEmbedPlaying && (
            <button type="button" className="course-video-poster" onClick={startCustomEmbed} aria-label="Play YouTube lesson">
              <span className="course-video-play"><Play size={30} fill="currentColor" /></span>
            </button>
          )}
          {renderYoutubeControls()}
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <motion.div 
      initial={{ y: '100%' }} 
      animate={{ y: 0 }} 
      exit={{ y: '100%' }}
      className={`flex-1 bg-white flex flex-col z-50 ${isProtectedSurface ? 'protected-learning-surface' : ''}`}
      onContextMenu={isProtectedSurface ? (event) => event.preventDefault() : undefined}
    >
      {isProtectedSurface && <div className="secure-watermark" aria-hidden="true">{watermark}</div>}
      <div className="bg-black aspect-video relative">
        {activeVideoUrl && usesEmbedPlayer ? (
          customEmbedFullscreen && videoPlayerElement
            ? createPortal(videoPlayerElement, document.body)
            : videoPlayerElement
        ) : activeVideoUrl ? (
          <video
            key={activeVideoUrl}
            src={activeVideoUrl}
            className="w-full h-full object-cover"
            controls
            controlsList={videoDownloadEnabled ? undefined : 'nodownload noremoteplayback'}
            disablePictureInPicture={!videoDownloadEnabled}
            playsInline
            preload="metadata"
          >
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-center text-white">
            <div className="px-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Lesson Video</p>
              <h3 className="mt-3 text-2xl font-black">Video unavailable</h3>
              <p className="mt-2 text-sm text-white/70">This lesson does not have a playable video yet.</p>
            </div>
          </div>
        )}
        <button 
          onClick={onBack} 
          className="absolute top-4 left-4 w-8 h-8 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{currentLesson?.title || course.title}</h2>
        <p className="text-xs text-gray-400 mb-2">
          {currentLesson?.video_url ? (usesEmbedPlayer ? 'Embedded lesson' : 'Direct video lesson') : 'No lesson video'}
        </p>
        <p className="text-sm text-gray-500 mb-6">{course.title} • {currentLesson?.duration || '10:00'} mins</p>

        {lessonDownloadUrl && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <Download size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-blue-950">Secure video download</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">
                  Use this only for files added by the academy. YouTube videos remain embedded and protected.
                </p>
                <button
                  type="button"
                  onClick={() => openExternalResource(lessonDownloadUrl)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                >
                  <Download size={15} />
                  {lessonDownloadLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          {videoNotesEnabled && (
            <button 
              onClick={() => currentLesson && onViewNotes(currentLesson)}
              className="flex-1 bg-gray-100 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Eye size={18} />
              View Notes
            </button>
          )}
          <button className="flex-1 bg-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white shadow-lg shadow-blue-100 transition-transform active:scale-95">
            <HelpCircle size={18} />
            Take Quiz
          </button>
        </div>

        <SectionHeader title="Course Lessons" />
        <div className="space-y-3">
          {course.lessonList?.map((lesson, idx) => (
            <button 
              key={lesson.id} 
                  onClick={() => {
                    setCurrentLesson(lesson);
                    setCustomEmbedStarted(false);
                    onLessonSelect(lesson);
                  }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-colors text-left group ${currentLesson?.id === lesson.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${currentLesson?.id === lesson.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                <Play size={20} />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold transition-colors ${currentLesson?.id === lesson.id ? 'text-primary' : 'text-gray-800'}`}>{lesson.title}</h4>
                <p className="text-[10px] text-gray-500">Lesson {idx + 1} • {lesson.duration} mins</p>
              </div>
              <ChevronRight size={18} className={currentLesson?.id === lesson.id ? 'text-primary' : 'text-gray-300'} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const CourseDetailsScreen = ({ 
  course, 
  onBack, 
  onStartLearning, 
  onViewNotes, 
  onTakeQuiz,
  isUnlocked,
  videoNotesEnabled = true
}: { 
  course: Course | null, 
  onBack: () => void,
  onStartLearning: () => void,
  onViewNotes: (lesson: Lesson) => void,
  onTakeQuiz: () => void,
  isUnlocked: boolean,
  videoNotesEnabled?: boolean
}) => {
  if (!course) return null;
  const isPremiumCourse = !isCourseFree(course);
  const courseDescription = String(course.description || '').trim()
    || `This comprehensive course on ${course.title} covers everything from fundamental concepts to advanced applications. Designed for students of ${course.category}, it includes high-quality video lectures, detailed notes, and practice quizzes to ensure complete mastery of the subject.`;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      <div className="relative h-56">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{course.category}</span>
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{course.type}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{course.title}</h2>
          <p className="text-white/70 text-sm">{course.lessons}+ Video Lessons • {isUnlocked ? 'Unlocked' : 'Locked'}</p>
        </div>
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={onStartLearning}
            className="flex-1 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            {isUnlocked ? 'Continue Learning' : 'Unlock Course'}
          </button>
        </div>

        {isUnlocked && isPremiumCourse && (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            You are now premium member
          </div>
        )}

        <div className="space-y-8">
          <section>
            <SectionHeader title="Course Lessons" />
            <div className="space-y-3">
              {course.lessonList?.map((lesson, idx) => (
                <div 
                  key={lesson.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{lesson.title}</h4>
                    <p className="text-[10px] text-gray-500">{lesson.duration} mins</p>
                  </div>
                  {isUnlocked && videoNotesEnabled && (
                    <button 
                      onClick={() => onViewNotes(lesson)}
                      className="text-primary p-2 hover:bg-primary/5 rounded-full transition-colors"
                    >
                      <FileText size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Study Material & Quizzes" />
            <div className={`grid gap-4 ${videoNotesEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {videoNotesEnabled && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center mb-3">
                    <FileText size={20} />
                  </div>
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Course Notes</h4>
                  <p className="text-[10px] text-blue-700 mb-3">HTML notes & web resources</p>
                  <button 
                    onClick={() => course.lessonList?.[0] && onViewNotes(course.lessonList[0])}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1"
                  >
                    View All <ChevronRight size={12} />
                  </button>
                </div>
              )}
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center mb-3">
                  <HelpCircle size={20} />
                </div>
                <h4 className="font-bold text-red-900 text-sm mb-1">Topic Quiz</h4>
                <p className="text-[10px] text-red-700 mb-3">Test your knowledge</p>
                <button 
                  onClick={onTakeQuiz}
                  className="text-xs font-bold text-red-600 flex items-center gap-1"
                >
                  Start Quiz <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">About this course</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {courseDescription}
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

const LegacyNotesScreen = ({ 
  notes, 
  onViewNote 
}: { 
  notes: Note[], 
  onViewNote: (note: Note) => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(notes.map((note) => note.category).filter(Boolean)))];
  const filteredNotes = notes.filter((note) => {
    const matchesCategory = activeCategory === 'All' || note.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || note.title.toLowerCase().includes(query)
      || note.category.toLowerCase().includes(query)
      || String(note.content || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 overflow-y-auto bg-[#f5f8fd] p-4 pb-24"
    >
      <div className="mb-5 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, category, or content..."
            className="w-full rounded-2xl border border-slate-200 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-blue-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
            {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-bold text-slate-700">
          {filteredNotes.length} note{filteredNotes.length === 1 ? '' : 's'} found
        </div>
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
          {activeCategory}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotes.map(note => (
          <div key={note.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-800">{note.title}</h3>
              <p className="text-[10px] text-gray-500">{note.lessons} Detailed Chapters • {note.category}</p>
            </div>
            <button 
              onClick={() => onViewNote(note)}
              className="px-4 py-2 text-primary bg-primary/5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              View
            </button>
          </div>
        ))}
        {!filteredNotes.length && (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
            No notes matched your search.
          </div>
        )}
      </div>
    </motion.div>
  );
};

const NotesScreen = ({
  notes,
  onViewNote
}: {
  notes: Note[],
  onViewNote: (note: Note) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const formatNoteTitle = (title: string) => {
    const normalized = String(title || 'Untitled Note').replace(/\s+/g, ' ').trim();
    const extensionMatch = normalized.match(/(\.[a-z0-9]+)$/i);
    const extension = extensionMatch ? extensionMatch[1].toUpperCase().replace('.', '') : 'HTML';
    const base = extensionMatch ? normalized.slice(0, -extensionMatch[1].length) : normalized;
    return {
      title: base.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase()),
      extension,
    };
  };

  const getNoteMeta = (note: Note) => {
    const haystack = `${note.title} ${note.category} ${note.content || ''}`.toLowerCase();
    const branch = haystack.includes('organic')
      ? 'Organic'
      : haystack.includes('inorganic')
        ? 'Inorganic'
        : haystack.includes('physical')
          ? 'Physical'
          : haystack.includes('applied')
            ? 'Applied'
            : 'Chemistry';
    const level = haystack.includes('class 12') ? 'Class 12' : haystack.includes('class 11') ? 'Class 11' : 'Study Note';
    return { branch, level };
  };

  const noteCategories = Array.from(new Set(notes.map((note) => String(note.category || '').trim()).filter(Boolean)));
  const quickFilters = ['All', 'Organic', 'Inorganic', 'Physical', ...noteCategories.slice(0, 5)]
    .filter((item, index, array) => item && array.indexOf(item) === index);

  const matchesFilter = (note: Note, filter: string) => {
    if (filter === 'All') return true;
    const haystack = `${note.title} ${note.category} ${note.content || ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  };

  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.trim().toLowerCase();
    const searchable = `${note.title} ${note.category} ${note.content || ''}`.toLowerCase();
    return matchesFilter(note, activeCategory) && (!query || searchable.includes(query));
  });

  const featuredNote = filteredNotes[0] || notes[0] || null;
  const freeNotesCount = notes.filter((note) => String(note.type || 'free').toLowerCase() === 'free').length;
  const cardStyles = [
    { surface: 'from-sky-50 to-white', icon: 'bg-sky-100 text-sky-700', badge: 'bg-sky-100 text-sky-700', action: 'bg-sky-600 shadow-sky-100' },
    { surface: 'from-emerald-50 to-white', icon: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', action: 'bg-emerald-600 shadow-emerald-100' },
    { surface: 'from-amber-50 to-white', icon: 'bg-amber-100 text-amber-700', badge: 'bg-amber-100 text-amber-700', action: 'bg-amber-600 shadow-amber-100' },
    { surface: 'from-rose-50 to-white', icon: 'bg-rose-100 text-rose-700', badge: 'bg-rose-100 text-rose-700', action: 'bg-rose-600 shadow-rose-100' },
  ];

  const filterIcon = (chip: string) => {
    if (chip === 'All') return <FileText size={16} />;
    if (chip.toLowerCase().includes('organic')) return <FlaskConical size={16} />;
    if (chip.toLowerCase().includes('physical')) return <Settings size={16} />;
    return <BookOpen size={16} />;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f7fbff_0%,#f4f8f2_48%,#fff8ee_100%)] px-4 pb-24 pt-4 text-slate-900">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#14325c_0%,#11615d_58%,#6d4b16_100%)] p-5 text-white shadow-xl shadow-slate-300/50">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12))]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Study Library</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Notes</h2>
            <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-white/72">Organized chemistry HTML notes and web resources for fast revision.</p>
          </div>
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white">
            <FileText size={26} />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <p className="text-xl font-black">{notes.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Total</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <p className="text-xl font-black">{freeNotesCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Free</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
            <p className="text-xl font-black">{noteCategories.length || 1}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Groups</p>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 -mx-1 mt-4 rounded-2xl border border-white/75 bg-white/82 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search notes..."
            className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <div className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
            <Filter size={16} />
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickFilters.map((chip) => {
            const isActive = activeCategory === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveCategory(chip)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition active:scale-95 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md shadow-slate-300'
                    : 'bg-white text-slate-600 ring-1 ring-slate-100'
                }`}
              >
                {filterIcon(chip)}
                <span className="max-w-[140px] truncate">{chip}</span>
              </button>
            );
          })}
        </div>
      </section>

      {featuredNote && (
        <button
          type="button"
          onClick={() => onViewNote(featuredNote)}
          className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-lg shadow-amber-100/45 transition active:scale-[0.99]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Download size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">Featured</p>
            <h3 className="truncate text-base font-black text-slate-950">{formatNoteTitle(featuredNote.title).title}</h3>
            <p className="truncate text-xs font-semibold text-slate-500">{featuredNote.category || 'Chemistry Notes'}</p>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </button>
      )}

      <div className="mb-3 mt-6 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">{filteredNotes.length} Notes Found</h3>
          <p className="text-xs font-semibold text-slate-500">{activeCategory === 'All' ? 'All categories' : activeCategory}</p>
        </div>
        {(searchQuery || activeCategory !== 'All') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
            }}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-100"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredNotes.map((note, index) => {
          const style = cardStyles[index % cardStyles.length];
          const title = formatNoteTitle(note.title);
          const meta = getNoteMeta(note);

          return (
            <div
              key={note.id}
              className={`rounded-2xl border border-white bg-gradient-to-br ${style.surface} p-4 shadow-md shadow-slate-200/70`}
            >
              <div className="flex gap-4">
                <div className={`relative flex h-16 w-14 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
                  <FileText size={28} />
                  <span className="absolute -bottom-1 rounded-md bg-slate-950 px-1.5 py-0.5 text-[9px] font-black text-white">
                    {title.extension.slice(0, 4)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-base font-black leading-snug text-slate-950">{title.title}</h4>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{note.category || `${meta.level} ${meta.branch}`}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${style.badge}`}>
                      {meta.branch}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <BookOpen size={14} />
                      <span>{note.lessons || 1} unit</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{meta.level}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewNote(note)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black text-white shadow-lg transition active:scale-95 ${style.action}`}
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!filteredNotes.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/72 px-6 py-12 text-center shadow-inner">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-950">No notes found</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">Try another keyword or open all categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuizScreen = ({ quizzes, initialQuiz }: { quizzes: Quiz[], initialQuiz?: Quiz | null }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(initialQuiz || null);
  const [isQuizStarted, setIsQuizStarted] = useState(!!initialQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const quizContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    typesetMath(quizContentRef.current);
  }, [selectedQuiz, currentQuestionIndex, isAnswered]);

  const playSound = (type: 'correct' | 'incorrect') => {
    const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    const incorrectSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    
    if (type === 'correct') {
      correctSound.play().catch(() => {});
    } else {
      incorrectSound.play().catch(() => {});
    }
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleStartQuiz = () => {
    setIsQuizStarted(true);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = index === getQuestionCorrectAnswer(selectedQuiz?.questions[currentQuestionIndex] || {});
    if (isCorrect) {
      setScore(prev => prev + 1);
      playSound('correct');
    } else {
      playSound('incorrect');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < (selectedQuiz?.questions.length || 0)) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setSelectedQuiz(null);
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (!selectedQuiz) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex-1 p-4 overflow-y-auto pb-24"
      >
        <SectionHeader title="Choose Subject" />
        <p className="text-xs text-gray-500 mb-6 -mt-4">Select a subject to test your knowledge</p>
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <button 
              key={quiz.id} 
              onClick={() => handleSelectQuiz(quiz)}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <HelpCircle size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">{quiz.topic} Quiz</h3>
                  <p className="text-xs text-gray-500">{quiz.questions.length} Questions Available</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!isQuizStarted) {
    return (
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="flex-1 p-6 flex flex-col items-center justify-center text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <HelpCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedQuiz.topic} Quiz</h2>
        <p className="text-gray-500 mb-8 max-w-[280px]">
          Test your knowledge in {selectedQuiz.topic}. This quiz contains {selectedQuiz.questions.length} questions.
        </p>
        
        <div className="w-full space-y-4 max-w-xs">
          <button 
            onClick={handleStartQuiz}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-100 transition-transform active:scale-95"
          >
            Play Quiz
          </button>
          <button 
            onClick={() => setSelectedQuiz(null)}
            className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold"
          >
            Back to Subjects
          </button>
        </div>
      </motion.div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / selectedQuiz.questions.length) * 100);
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
        <p className="text-gray-500 mb-8">You scored {score} out of {selectedQuiz.questions.length}</p>
        
        <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="text-4xl font-black text-primary mb-1">{percentage}%</div>
          <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Accuracy Score</div>
        </div>

        <button 
          onClick={handleRestart}
          className="w-full max-w-xs bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
        >
          Try Another Quiz
        </button>
      </motion.div>
    );
  }

  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;
  const currentCorrectAnswer = getQuestionCorrectAnswer(currentQuestion);

  return (
    <motion.div 
      ref={quizContentRef}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col p-4 overflow-y-auto pb-24"
    >
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
          <span className="text-xs text-gray-400">Score: {score}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            className="h-full bg-primary"
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          {(currentQuestion.subject || selectedQuiz.topic) && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
              {currentQuestion.subject || selectedQuiz.topic}
            </span>
          )}
          {currentQuestion.chapter && (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sky-700">
              {currentQuestion.chapter}
            </span>
          )}
          {currentQuestion.difficulty && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
              {currentQuestion.difficulty}
            </span>
          )}
          {currentQuestion.question_type && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-700">
              {currentQuestion.question_type}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-8">{renderMathText(getQuestionText(currentQuestion))}</h2>
        {currentQuestion.image_url && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <img
              src={currentQuestion.image_url}
              alt={`Question ${currentQuestionIndex + 1}`}
              className="w-full max-h-72 object-contain bg-slate-50"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const optionImage = currentQuestion.option_images?.[idx];
            const optionType = getQuizOptionType(option, optionImage);
            const optionText = getQuizOptionText(option);
            const optionImageUrl = getQuizOptionImage(option, optionImage);
            let variant = 'default';
            if (isAnswered) {
              if (idx === currentCorrectAnswer) variant = 'correct';
              else if (idx === selectedOption) variant = 'incorrect';
            }

            return (
              <button 
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                  variant === 'correct' ? 'bg-green-50 border-green-500 text-green-700' :
                  variant === 'incorrect' ? 'bg-red-50 border-red-500 text-red-700' :
                  selectedOption === idx ? 'bg-primary/5 border-primary text-primary' :
                  'bg-white border-gray-100 text-gray-700 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm ${
                    variant === 'correct' ? 'border-green-500 bg-green-500 text-white' :
                    variant === 'incorrect' ? 'border-red-500 bg-red-500 text-white' :
                    selectedOption === idx ? 'border-primary bg-primary text-white' :
                    'border-gray-200 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="min-w-0">
                    {optionType !== 'image' && optionText && (
                      <span className="font-medium block">{renderMathText(optionText)}</span>
                    )}
                    {optionImageUrl && (
                      <img
                        src={optionImageUrl}
                        alt={optionText || `Option ${idx + 1}`}
                        className="mt-3 w-full max-w-[180px] rounded-2xl border border-gray-100 object-contain bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
                {variant === 'correct' && <CheckCircle2 size={18} className="text-green-500" />}
                {variant === 'incorrect' && <XCircle size={18} className="text-red-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl border ${
                selectedOption === currentCorrectAnswer 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-red-50 border-red-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 font-bold text-sm ${
                  selectedOption === currentCorrectAnswer ? 'text-green-700' : 'text-red-700'
                }`}>
                  {selectedOption === currentCorrectAnswer ? (
                    <><CheckCircle2 size={18} /> Correct Answer!</>
                  ) : (
                    <><XCircle size={18} /> Wrong Answer!</>
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Feedback</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <HelpCircle size={14} />
                  Explanation
                </div>
                <p className={`text-sm leading-relaxed ${
                  selectedOption === currentCorrectAnswer ? 'text-green-800/80' : 'text-red-800/80'
                }`}>
                  {renderMathText(currentQuestion.explanation || "No explanation available for this question.")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          disabled={currentQuestionIndex === 0}
          onClick={handlePreviousQuestion}
          className={`w-full rounded-xl py-4 font-bold transition-all ${
            currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border border-blue-100'
          }`}
        >
          Previous
        </button>
        <button 
          disabled={!isAnswered}
          onClick={handleNextQuestion}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            !isAnswered 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-primary text-white shadow-lg shadow-blue-100'
          }`}
        >
          {currentQuestionIndex + 1 === selectedQuiz.questions.length ? 'Finish Quiz' : 'Next'}
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
};

const ProfileScreen = ({
  user,
  onLogout,
  onOpenSettings,
  onOpenProfileInfo,
  onOpenMyCourses,
  onOpenOfflineNotes
}: {
  user: any,
  onLogout: () => void,
  onOpenSettings: () => void,
  onOpenProfileInfo: () => void,
  onOpenMyCourses: () => void,
  onOpenOfflineNotes: () => void
}) => {
  const menuItems = [
    { icon: <BookOpen size={20} />, label: 'My Courses' },
    { icon: <HelpCircle size={20} />, label: 'Quiz Results' },
    { icon: <Download size={20} />, label: 'Download Note Offline' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col overflow-hidden"
    >
      <button
        type="button"
        onClick={onOpenProfileInfo}
        className="bg-primary pt-8 pb-12 px-6 text-center relative w-full"
      >
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 p-1 mb-4">
            <img src={getUserAvatarUrl(user)} alt="Profile" className="w-full h-full rounded-full bg-white object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name || 'Student'}</h2>
          <p className="text-white/70 text-sm">{user?.email || 'rahul.sharma@gmail.com'}</p>
          <p className="mt-1 text-white/80 text-xs font-bold">{getStudentClassLabel(user?.classLevel)}</p>
          <div className="mt-3 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">
            Open Profile Management
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-[32px]"></div>
      </button>

      <div className="flex-1 bg-gray-50 px-6 pb-24 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.label === 'My Courses') onOpenMyCourses();
                if (item.label === 'Download Note Offline') onOpenOfflineNotes();
                if (item.label === 'Settings') onOpenSettings();
              }}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${idx !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary">{item.icon}</div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="w-full mt-6 py-4 rounded-xl border border-gray-200 text-gray-500 font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

const SettingsScreen = ({
  user,
  darkModeEnabled,
  notificationsEnabled,
  notificationStatus,
  pushToken,
  onToggleDarkMode,
  onEnableNotifications,
  onOpenProfileInfo,
  onOpenHelpCenter
}: {
  user: any,
  darkModeEnabled: boolean,
  notificationsEnabled: boolean,
  notificationStatus: string,
  pushToken: string,
  onToggleDarkMode: () => void,
  onEnableNotifications: () => void,
  onOpenProfileInfo: () => void,
  onOpenHelpCenter: () => void
}) => {
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);

  const toggleRow = (
    label: string,
    description: string,
    enabled: boolean,
    onToggle: () => void
  ) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-14 h-8 rounded-full p-1 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  const infoRow = (label: string, value: string, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4 text-left"
    >
      <div>
        <h3 className="text-sm font-bold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{value}</p>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
    >
      <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[28px] p-5 text-white shadow-xl shadow-blue-100 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Preferences</p>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-sm text-white/75">Manage account preferences, support pages, and your study experience.</p>

        <div className="mt-5 bg-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/30 bg-white/10">
            <img src={getUserAvatarUrl(user)} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="font-bold">{user?.name || 'Student'}</div>
            <div className="text-xs text-white/70">{user?.email || 'student@academy.com'}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{getStudentClassLabel(user?.classLevel)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <section>
          <SectionHeader title="App Preferences" />
          <div className="space-y-3">
            {toggleRow('Dark Mode', 'Switch the entire academy app to a darker reading theme.', darkModeEnabled, onToggleDarkMode)}
            {toggleRow('Download on Wi-Fi Only', 'Use Wi-Fi when downloading study material.', downloadOnWifi, () => setDownloadOnWifi(!downloadOnWifi))}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Push Notifications</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {notificationsEnabled ? 'Course alerts and live class reminders are enabled.' : `Permission: ${notificationStatus}`}
                </p>
                {pushToken && (
                  <p className="mt-1 break-all text-[10px] font-bold text-slate-400">
                    FCM: ...{pushToken.slice(-18)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onEnableNotifications}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black ${notificationsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-primary text-white'}`}
              >
                {notificationsEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Account" />
          <div className="space-y-3">
            {infoRow('Profile Information', 'Change student name and password. Email stays fixed.', onOpenProfileInfo)}
            {infoRow('Security', 'Password and account protection settings')}
            {infoRow('Language', 'English')}
          </div>
        </section>

        <section>
          <SectionHeader title="Support" />
          <div className="space-y-3">
            {infoRow('Help Center', 'Get help with courses, notes, quizzes, and access', onOpenHelpCenter)}
            {infoRow('Privacy Policy', 'How your data is used in the academy app')}
            {infoRow('App Version', 'Monto v1.0.0')}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const ProfileEditScreen = ({
  user,
  onSave
}: {
  user: AuthUser,
  onSave: (payload: { name: string; avatarUrl?: string; classLevel?: StudentClassLevel; password?: string }) => Promise<{ success: boolean; message?: string }>
}) => {
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [classLevel, setClassLevel] = useState<StudentClassLevel>(normalizeStudentClassLevel(user?.classLevel));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarFilePreviewUrl, setAvatarFilePreviewUrl] = useState('');
  const avatarPreviewUrl = avatarFilePreviewUrl || avatarUrl.trim() || getUserAvatarUrl({ ...user, name });
  const avatarPresets = [
    { label: 'Classic', seed: user?.name || 'Student' },
    { label: 'Focus', seed: `${user?.id || user?.name}-focus` },
    { label: 'Scholar', seed: `${user?.id || user?.name}-scholar` },
    { label: 'Bright', seed: `${user?.id || user?.name}-bright` },
  ];

  useEffect(() => {
    if (!avatarFile) {
      setAvatarFilePreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file');
      setMessage('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be 5 MB or smaller');
      setMessage('');
      return;
    }
    setAvatarFile(file);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      setMessage('');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      setMessage('');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match');
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const uploadedAvatarUrl = avatarFile
        ? await uploadFileToCloudinary(avatarFile, 'profile')
        : avatarUrl.trim();
      const result = await onSave({
        name: trimmedName,
        avatarUrl: uploadedAvatarUrl,
        classLevel,
        password: password || undefined
      });

      if (result.success) {
        setAvatarFile(null);
        setAvatarUrl(uploadedAvatarUrl);
        setMessage(result.message || 'Profile updated successfully');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || 'Unable to update profile');
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Profile image upload failed');
    }

    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
    >
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-slate-200/60 p-5">
        <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[24px] p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Account</p>
          <h2 className="text-2xl font-bold">Profile Information</h2>
          <p className="text-sm text-white/75 mt-2">Update the student name, avatar, and password. The account email stays locked and cannot be changed.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
                <img src={avatarPreviewUrl} alt="Avatar preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-gray-900">Student Avatar</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">Upload a profile image or choose a preset. Uploaded images are saved on Cloudinary.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {avatarPresets.map((preset) => {
                const presetUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(preset.seed)}`;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarUrl(presetUrl);
                    }}
                    className="rounded-2xl border border-gray-200 bg-white p-2 text-center transition active:scale-95"
                    aria-label={`Use ${preset.label} avatar`}
                  >
                    <img src={presetUrl} alt="" className="mx-auto h-10 w-10 rounded-full bg-gray-50" referrerPolicy="no-referrer" />
                    <span className="mt-1 block truncate text-[10px] font-bold text-gray-500">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Avatar Image URL</label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 text-xs font-black text-gray-700">
                <Upload size={16} />
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleAvatarFileChange(e.target.files?.[0] || null)}
                />
              </label>
              {(avatarUrl || avatarFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarUrl('');
                  }}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black text-gray-500"
                >
                  Use name-based default avatar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Student Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
              placeholder="Enter student name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
            <input
              value={user.email}
              readOnly
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Class</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(normalizeStudentClassLevel(e.target.value))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            >
              {STUDENT_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
              placeholder="Re-enter new password"
            />
          </div>

          {message && (
            <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-primary text-white font-bold py-3 shadow-lg shadow-blue-100 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

const HelpCenterScreen = () => {
  const helpCards = [
    {
      title: 'Course Access',
      description: 'Premium courses unlock after the correct access code is verified or granted by admin.'
    },
    {
      title: 'HTML Notes',
      description: 'Notes open full screen from the hosted HTML URL or pasted HTML added in the admin panel.'
    },
    {
      title: 'Quizzes',
      description: 'Quizzes load from the academy database. If a quiz is missing, ask admin to publish it from the panel.'
    },
    {
      title: 'Account Support',
      description: 'Use Profile Information to update your student name. Email stays linked to your signup account.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
    >
      <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[28px] p-5 text-white shadow-xl shadow-blue-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Support</p>
        <h2 className="text-2xl font-bold">Help Center</h2>
        <p className="text-sm text-white/75 mt-2">Everything students need for courses, notes, access, and account help.</p>
      </div>

      <div className="mt-5 space-y-4">
        {helpCards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-800">{card.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{card.description}</p>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-800">Need Direct Help?</h3>
          <p className="text-sm text-gray-500 mt-2">Contact the academy admin if your premium access, notes, or quiz data is not showing correctly.</p>
        </div>
      </div>
    </motion.div>
  );
};

const AboutUsScreen = () => {
  const chemistryPoints = ['Concept Clarity', 'Smart Notes', 'Exam Practice'];

  const affiliations = [
    {
      name: 'Kathmandu Model College',
      role: 'Academic Association',
      logo: 'https://merocollege.com/wp-content/uploads/2020/01/Kathmandu-Model-College-KMC-Logo.png',
    },
    {
      name: 'Saral Shikshya',
      role: 'Learning Platform Partner',
      logo: 'https://saralgate.saralshikshya.org/backend/media/Saral%20Shikshya%20Academy/Saral_Shikshya_8z2DQTn.png',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,#d9f2ff_0%,#f8fcff_38%,#eef8f2_100%)] p-4 pb-24"
    >
      <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
        <div className="relative h-[320px] sm:h-[360px]">
          <img
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvgoKhcfed24WTxNsPHaWpVqqAX3Utkpbx32ag9aeE_8B_Bqv0j9fwP_vJNGgamPjvw7vYmzkxX4-Od6AuyAY9bNud5O2nwybZJ3axd4Krfx18vj2raht8vdB8_abprhfauSRH6CDMMw0RkOcU2ZNV4eIQcobQ8d_jxeDDd0vaTj1eB1IZ9q27PzMeog/s1600/ma.png"
            alt="Ravi Bhushna Sharma"
            className="h-full w-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,28,52,0.68)_0%,rgba(9,74,117,0.56)_48%,rgba(13,148,136,0.40)_100%)]" />
          <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 text-white sm:p-6">
            <div className="rounded-[28px] border-4 border-white/20 bg-white/10 p-1 shadow-2xl backdrop-blur-sm">
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvgoKhcfed24WTxNsPHaWpVqqAX3Utkpbx32ag9aeE_8B_Bqv0j9fwP_vJNGgamPjvw7vYmzkxX4-Od6AuyAY9bNud5O2nwybZJ3axd4Krfx18vj2raht8vdB8_abprhfauSRH6CDMMw0RkOcU2ZNV4eIQcobQ8d_jxeDDd0vaTj1eB1IZ9q27PzMeog/s1600/ma.png"
                alt="Ravi Bhushna Sharma portrait"
                className="h-20 w-20 rounded-[22px] object-cover object-top sm:h-24 sm:w-24"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
                <FlaskConical size={13} />
                Chemistry Faculty
              </div>
              <h2 className="mt-3 text-3xl font-black leading-none sm:text-[2.75rem]">Ravi Bhushna Sharma</h2>
              <p className="mt-2 text-sm font-semibold text-white/80 sm:text-base">Kathmandu Chemistry Lecturer</p>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(140deg,#082847_0%,#0f4a76_48%,#15958c_100%)] px-5 py-5 text-white sm:px-6">
          <div className="flex flex-wrap gap-3">
            {chemistryPoints.map((point) => (
              <div key={point} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/92 backdrop-blur-sm">
                {point}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Subject</div>
              <div className="mt-2 text-lg font-black">Chemistry</div>
            </div>
            <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Role</div>
              <div className="mt-2 text-lg font-black">Lecturer</div>
            </div>
            <div className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">City</div>
              <div className="mt-2 text-lg font-black">Kathmandu</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-[32px] border border-slate-100 bg-white/92 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Affiliations</div>
              <h3 className="mt-2 text-2xl font-black text-slate-950">Trusted Learning Links</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d8f3ff_0%,#e7fff7_100%)] text-cyan-700">
              <BookOpen size={22} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {affiliations.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.18 + index * 0.08 }}
                className="rounded-[28px] border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex h-24 items-center justify-center rounded-[22px] bg-white p-4 shadow-sm">
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="max-h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{item.role}</div>
                <div className="mt-2 text-lg font-black text-slate-950">{item.name}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="rounded-[32px] border border-slate-100 bg-white/92 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        >
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Contact</div>
          <div className="mt-3 rounded-[28px] bg-[linear-gradient(145deg,#081a32_0%,#143f68_100%)] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Phone size={24} />
            </div>
            <div className="mt-5 text-sm text-white/70">Call for chemistry guidance</div>
            <div className="mt-2 text-3xl font-black tracking-tight">9819239480</div>
            <button
              type="button"
              onClick={() => openExternalResource('tel:9819239480')}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900"
            >
              <Phone size={16} />
              Contact Now
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const AboutDeveloperScreen = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
  >
    <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl shadow-slate-200/60">
      <div className="relative h-56">
        <img
          src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj5gE5usoG8x-m_ntz8ez29lTJcKnhunWSy1UXIJNi-gJ0nb7kOs4ODDfQtp_vfjSgRRJeAWALNO24VYpwQ9fz7B9Qw8_pTA2p5HE9N8VqPLP4tZyHvOFIVVReUGlmH053cgTU0HIMeWyk0L5LXGmujE046sAqdRNlUN60C5qU6o8DtcYk-hqL5ASuapw/s1600/ChatGPT%20Image%20Apr%2020,%202026,%2012_19_51%20AM.png"
          alt="Developer workspace"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.82)_0%,rgba(11,86,196,0.72)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-6 text-white">
          <img
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjx9lK0YYowt9iTo4ZvzTVh_DHsZYijgp3X3h4KYFKAo0ObGBJudHnG_wBP7QXJo03uFP0I1EF2THef0WoiwzG-e6rshprmrgFMhGzzaHgM1gf9RPFFGsNV1arKTjfBLEwKL7qmNQCt2S0JRD5KprHfTE5NrVc5gTJp-R6WGqoffZCqkSC6cNyK9Rt46A/s595/Screenshot%202025-12-18%20193226.png"
            alt="Developer portrait"
            className="h-20 w-20 rounded-3xl border-4 border-white/25 object-cover shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Developer</p>
            <h2 className="text-2xl font-black">Sachin Kushwaha</h2>
            <p className="text-sm text-white/75">Founder of Pranam Software</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-[24px] bg-blue-50 p-5">
          <h3 className="text-base font-black text-slate-900">About The Developer</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sachin Kushwaha is the founder of Pranam Software. This platform is built in Pranam Software with a focus on education products, admin systems, and smooth student experiences across web platforms.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-gray-100 bg-white p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Experience</div>
            <div className="mt-2 text-lg font-black text-slate-900">6+ Years</div>
            <div className="mt-1 text-sm text-slate-500">Web apps, admin panels, learning systems</div>
          </div>
          <div className="rounded-[24px] border border-gray-100 bg-white p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Focus</div>
            <div className="mt-2 text-lg font-black text-slate-900">EdTech UI</div>
            <div className="mt-1 text-sm text-slate-500">Student-first products and premium dashboards</div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-slate-950 p-5 text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Contact</div>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            <div>Email: contact.pranamsoftware@gmail.com</div>
            <div>Phone: +977-9819239480</div>
            <div>Location: Maitidevi, Kathmandu</div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const PrivacyPolicyScreen = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
  >
    <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[28px] p-5 text-white shadow-xl shadow-blue-100">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Policy</p>
      <h2 className="text-2xl font-bold">Privacy Policy</h2>
      <p className="text-sm text-white/75 mt-2">A simple overview of what student information is stored and how it is used inside the academy app.</p>
    </div>

    <div className="mt-5 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-800">Information We Store</h3>
        <p className="text-sm text-gray-500 mt-2">The academy may store student details such as name, email, password, course access, notes progress, and quiz-related data needed to run the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-800">Why We Use It</h3>
        <p className="text-sm text-gray-500 mt-2">This information is used to authenticate students, provide access to free and premium content, and keep the learning experience personalized and functional.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-800">Admin Access</h3>
        <p className="text-sm text-gray-500 mt-2">Only academy admins should manage student data, access codes, course content, and internal educational records.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-800">Support</h3>
        <p className="text-sm text-gray-500 mt-2">If a student has concerns about account data or access, they should contact the academy admin directly.</p>
      </div>
    </div>
  </motion.div>
);

const MyCoursesScreen = ({
  courses,
  unlockedCourseIds,
  onCourseSelect
}: {
  courses: Course[],
  unlockedCourseIds: string[],
  onCourseSelect: (course: Course) => void
}) => {
  const unlockedPremiumCourses = courses.filter((course) => !isCourseFree(course) && unlockedCourseIds.includes(course.id));
  const freeCourses = courses.filter(isCourseFree);
  const visibleCourses = [...unlockedPremiumCourses, ...freeCourses];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50">
      <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[28px] p-5 text-white shadow-xl shadow-blue-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Chemistry Learning</p>
        <h2 className="text-2xl font-bold">My Courses</h2>
        <p className="text-sm text-white/75 mt-2">
          {unlockedPremiumCourses.length
            ? `${unlockedPremiumCourses.length} premium course${unlockedPremiumCourses.length === 1 ? '' : 's'} unlocked by admin.`
            : 'Free courses appear here. Premium access will show automatically after admin unlocks it.'}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {visibleCourses.length ? visibleCourses.map((course) => (
          <button
            key={course.id}
            onClick={() => onCourseSelect(course)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 text-left"
          >
            <img src={course.image} alt={course.title} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <div className="text-base font-bold text-gray-800">{course.title}</div>
              <div className="text-sm text-gray-500 mt-1">{course.category}</div>
              <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${isCourseFree(course) ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {isCourseFree(course) ? 'Available Now' : 'Admin Access Unlocked'}
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        )) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <div className="text-base font-bold text-gray-800">No courses available yet</div>
            <div className="text-sm text-gray-500 mt-2">Available courses will appear here automatically.</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const OfflineNotesScreen = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50">
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(145deg,#082847_0%,#0f4a76_48%,#15958c_100%)] p-5 text-center text-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0], opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
        className="absolute right-0 top-10 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-sm"
        >
          <Download size={32} />
        </motion.div>
      </motion.div>
      <div className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-sm">
        Offline Notes
      </div>
      <h2 className="mt-4 text-3xl font-black tracking-tight">Beautiful Offline Downloads Are On The Way</h2>
      <div className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
        Premium Update Incoming
      </div>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/78">
        Offline note downloads will be added in a future release. Right now, study materials continue opening online smoothly.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {['Fast Access', 'Cleaner Notes', 'Smart Sync'].map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 text-sm font-bold text-white/90 backdrop-blur-sm"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

const SupportChatScreen = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50">
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(145deg,#091a34_0%,#153b63_48%,#0d9488_100%)] p-5 text-center text-white shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
      <motion.div
        animate={{ x: [0, 18, 0], opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-6 top-10 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute right-0 top-6 h-28 w-28 rounded-full bg-emerald-300/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-sm"
      >
        <MessageSquare size={32} />
      </motion.div>
      <div className="mt-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-sm">
        Support Chat
      </div>
      <h2 className="mt-4 text-3xl font-black tracking-tight">Coming Soon</h2>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/78">
        Live student support chat is being prepared with a cleaner and faster experience for the next update.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {['Live Replies', 'Student Help', 'Quick Support'].map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
            className="rounded-[22px] border border-white/12 bg-white/10 px-4 py-4 text-sm font-bold text-white/90 backdrop-blur-sm"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

const fileToText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsText(file);
  });

const getQuizOptionText = (option: QuizOption) => {
  if (option && typeof option === 'object') {
    return String(option.text || option.label || option.option || option.value || '').trim();
  }

  return String(option || '').trim();
};

const getQuizOptionImage = (option: QuizOption, fallback = '') => {
  if (option && typeof option === 'object') {
    const type = String(option.type || '').toLowerCase();
    const value = String(option.value || '').trim();
    return String(option.image_url || option.imageUrl || option.image || (type === 'image' ? value : '') || fallback || '').trim();
  }

  return String(fallback || '').trim();
};

const getQuizOptionType = (option: QuizOption, fallbackImage = '') => {
  if (option && typeof option === 'object' && option.type) {
    return String(option.type).toLowerCase();
  }

  return getQuizOptionImage(option, fallbackImage) ? 'image' : 'text';
};

const getQuestionText = (question: Partial<Question>) =>
  String(question.question || question.text || '').trim();

const getQuestionCorrectAnswer = (question: Partial<Question>) =>
  Number(question.correct_answer ?? question.correctAnswer ?? 0);

const renderMathText = (value?: string) => (
  <span>{String(value || '')}</span>
);

const typesetMath = (element?: HTMLElement | null) => {
  window.MathJax?.typesetPromise?.(element ? [element] : undefined).catch(() => {});
};

const getUserExportRows = (users: AdminUser[]) => users.map((user, index) => ({
  sn: index + 1,
  id: user.id || '',
  name: user.name || '',
  email: user.email || '',
  phone: user.phone || '',
  classLevel: getStudentClassLabel(user.classLevel),
  status: user.status || 'active',
  userCategory: user.userCategory || 'free',
  grantedCourseIds: (user.grantedCourseIds || []).join(', '),
  blockedCourseIds: (user.blockedCourseIds || []).join(', '),
  deviceLocked: user.deviceLocked ? 'Yes' : 'No',
  deviceId: user.deviceId || '',
  deviceLabel: user.deviceLabel || '',
  deviceBoundAt: user.deviceBoundAt || '',
}));

const userExportColumns = [
  ['sn', 'S.N.'],
  ['id', 'Student ID'],
  ['name', 'Name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['classLevel', 'Class'],
  ['status', 'Status'],
  ['userCategory', 'User Category'],
  ['grantedCourseIds', 'Unlocked Course IDs'],
  ['blockedCourseIds', 'Blocked Course IDs'],
  ['deviceLocked', 'Device Locked'],
  ['deviceId', 'Device ID'],
  ['deviceLabel', 'Device Label'],
  ['deviceBoundAt', 'Device Bound At'],
] as const;

const downloadBlob = (fileName: string, mimeType: string, content: string) => {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const escapeHtmlValue = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const downloadUsersCsv = (users: AdminUser[]) => {
  const rows = getUserExportRows(users);
  const header = userExportColumns.map(([, label]) => escapeCsvValue(label)).join(',');
  const body = rows.map((row) =>
    userExportColumns.map(([key]) => escapeCsvValue(row[key])).join(',')
  ).join('\n');
  downloadBlob(`monto-users-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8', `${header}\n${body}`);
};

const downloadUsersExcel = (users: AdminUser[]) => {
  const rows = getUserExportRows(users);
  const head = userExportColumns.map(([, label]) => `<th>${escapeHtmlValue(label)}</th>`).join('');
  const body = rows.map((row) => `<tr>${userExportColumns.map(([key]) => `<td>${escapeHtmlValue(row[key])}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(`monto-users-${new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel;charset=utf-8', html);
};

const getImportedQuestionSource = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = (payload && typeof payload === 'object' ? payload : {}) as {
    questions?: unknown[];
    quiz?: { questions?: unknown[] };
    data?: { questions?: unknown[] };
    question?: unknown;
    text?: unknown;
    title?: unknown;
  };

  if (Array.isArray(record.questions)) {
    return record.questions;
  }

  if (Array.isArray(record.quiz?.questions)) {
    return record.quiz.questions;
  }

  if (Array.isArray(record.data?.questions)) {
    return record.data.questions;
  }

  if (record.question || record.text || record.title) {
    return [record];
  }

  return [];
};

const getImportedQuestionOptions = (record: Record<string, unknown>) => {
  if (Array.isArray(record.options)) {
    const options = record.options.map((option) => {
      if (option && typeof option === 'object') {
        const item = option as Record<string, unknown>;
        const type = String(item.type || '').trim();
        const value = String(item.value || '').trim();
        const imageUrl = String(item.image_url || item.image || item.imageUrl || (type.toLowerCase() === 'image' ? value : '')).trim();
        const text = String(item.text || item.label || item.option || (type.toLowerCase() !== 'image' ? value : '')).trim();
        return {
          option: type || imageUrl ? { type: imageUrl && !text ? 'image' : (type || 'text'), value: imageUrl && !text ? imageUrl : text, image_url: imageUrl } : text,
          text: text || imageUrl,
          image_url: imageUrl,
        };
      }

      return {
        option: String(option).trim(),
        text: String(option).trim(),
        image_url: '',
      };
    }).filter((option) => option.text);

    return {
      options: options.map((option) => option.option),
      option_images: options.map((option) => option.image_url),
    };
  }

  const keyedOptions = [
    ['option1', 'option1_image'],
    ['option2', 'option2_image'],
    ['option3', 'option3_image'],
    ['option4', 'option4_image'],
    ['option5', 'option5_image'],
    ['a', 'a_image'],
    ['b', 'b_image'],
    ['c', 'c_image'],
    ['d', 'd_image'],
    ['e', 'e_image'],
  ].map(([key, imageKey]) => ({
    text: String(record[key] || '').trim(),
    image_url: String(record[imageKey] || record[`${key}Image`] || '').trim(),
  })).filter((option) => option.text);

  if (keyedOptions.length >= 2) {
    return {
      options: keyedOptions.map((option) => option.image_url ? { type: 'text', value: option.text, image_url: option.image_url } : option.text),
      option_images: keyedOptions.map((option) => option.image_url),
    };
  }

  return {
    options: [],
    option_images: [],
  };
};

const normalizeImportedQuestions = (payload: unknown) => {
  const source = getImportedQuestionSource(payload);

  if (!source.length) {
    throw new Error('JSON file must contain a questions array');
  }

  return source.map((item, index) => {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const text = String(record.text || record.question || record.title || '').trim();
    const { options, option_images } = getImportedQuestionOptions(record);

    if (!text || options.length < 2) {
      throw new Error(`Question ${index + 1} is missing text or enough options`);
    }

    let correctAnswer = 0;
    const answerValue = record.correctAnswer ?? record.answer ?? record.correct_option ?? record.correctOption ?? record.correct ?? 0;
    if (typeof answerValue === 'number' && Number.isFinite(answerValue)) {
      correctAnswer = answerValue;
    } else {
      const normalizedAnswer = String(answerValue).trim();
      const normalizedLetter = normalizedAnswer.toUpperCase();
      if (/^[A-E]$/.test(normalizedLetter)) {
        correctAnswer = normalizedLetter.charCodeAt(0) - 65;
      } else {
        const optionIndex = options.findIndex((option) => getQuizOptionText(option as QuizOption).toLowerCase() === normalizedAnswer.toLowerCase());
        if (optionIndex >= 0) {
          correctAnswer = optionIndex;
        } else {
          const parsedAnswer = Number(normalizedAnswer);
          correctAnswer = Number.isFinite(parsedAnswer) ? parsedAnswer : 0;
        }
      }
    }

    if (correctAnswer >= options.length && correctAnswer - 1 < options.length) {
      correctAnswer -= 1;
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`Question ${index + 1} has an invalid correct answer`);
    }

    return {
      text,
      options,
      option_images,
      correctAnswer,
      correct_answer: correctAnswer,
      subject: String(record.subject || '').trim(),
      chapter: String(record.chapter || '').trim(),
      question_type: String(record.question_type || record.type || '').trim(),
      difficulty: String(record.difficulty || '').trim(),
      explanation: String(record.explanation || '').trim(),
      image_url: String(record.image_url || record.imageUrl || record.image || record.questionImage || '').trim(),
    };
  });
};

const openExternalResource = (url?: string) => {
  const value = String(url || '').trim();
  if (!value || typeof window === 'undefined') {
    return false;
  }

  const openedWindow = window.open(value, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    window.location.href = value;
  }

  return true;
};

const shareAcademyApp = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const shareData = {
    title: 'Monto',
    text: APP_SHARE_TEXT,
    url: APP_SHARE_URL,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      return;
    }
  }

  try {
    await navigator.clipboard?.writeText(APP_SHARE_URL);
  } catch {}

  openExternalResource(APP_SHARE_URL);
};

const shareAcademyAppTo = async (target: 'whatsapp' | 'facebook' | 'system' | 'copy') => {
  const encodedUrl = encodeURIComponent(APP_SHARE_URL);
  const encodedText = encodeURIComponent(`${APP_SHARE_TEXT}\n${APP_SHARE_URL}`);

  if (target === 'whatsapp') {
    openExternalResource(`https://wa.me/?text=${encodedText}`);
    return;
  }

  if (target === 'facebook') {
    openExternalResource(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    return;
  }

  if (target === 'copy') {
    try {
      await navigator.clipboard?.writeText(APP_SHARE_URL);
    } catch {}
    return;
  }

  await shareAcademyApp();
};

const getNoteFileExtension = (url?: string, title?: string) => {
  const value = `${title || ''} ${url || ''}`.toLowerCase().split('?')[0];
  const match = value.match(/\.([a-z0-9]+)(?:\s|$)/i);
  return match?.[1] || '';
};

const getLegacyDrivePreviewUrl = (url?: string) => {
  const value = String(url || '');
  const fileId = value.match(/[?&]id=([^&]+)/)?.[1]
    || value.match(/\/d\/([^/?]+)/)?.[1]
    || '';
  return fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : '';
};

const isLegacyDriveUrl = (url?: string) => /(?:drive|docs)\.google\.com/i.test(String(url || ''));

const getNoteHtmlPreviewUrl = (url?: string, title?: string) => {
  const value = String(url || '').trim();
  if (!value) {
    return '';
  }

  if (isLegacyDriveUrl(value)) {
    return getLegacyDrivePreviewUrl(value) || value;
  }

  return value;
};

const isImageNoteUrl = (url?: string, title?: string) =>
  ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(getNoteFileExtension(url, title));

const isHtmlNoteContent = (content?: string) => {
  const value = String(content || '').trim();
  return /<!doctype html|<html[\s>]|<body[\s>]|<iframe[\s>]|<div[\s>]|<section[\s>]|<article[\s>]|<style[\s>]|<script[\s>]/i.test(value);
};

const AdminLoginScreen = ({
  mode,
  onLogin
}: {
  mode: AdminRole,
  onLogin: (session: AdminSession) => void
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);

  const signInAdmin = async (credentials: { username: string; password: string }) => {
    setError('');
    setIsSigningIn(true);
    setLoginProgress(0);
    const progressTimer = window.setInterval(() => {
      setLoginProgress((current) => {
        if (current >= 94) {
          return current;
        }
        return Math.min(94, current + Math.max(2, Math.round((94 - current) * 0.12)));
      });
    }, 120);

    try {
      const response = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      });
      const data = await readJsonResponse(response);

      if (!data.success || !data.session?.token) {
        setError(data.message || 'Invalid admin credentials');
        setLoginProgress(0);
        setIsSigningIn(false);
        return;
      }

      setLoginProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      onLogin({
        role: data.session.role,
        username: data.session.username,
        token: data.session.token,
        rememberMe,
      });
      return;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Check server admin configuration.');
      setLoginProgress(0);
      setIsSigningIn(false);
    } finally {
      window.clearInterval(progressTimer);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInAdmin({ username, password });
  };

  const handleDemoAdminLogin = async () => {
    const demoAccount = DEMO_ADMIN_ACCOUNTS[mode];
    setUsername(demoAccount.username);
    setPassword(demoAccount.password);
    await signInAdmin(demoAccount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="auth-scenic-shell admin-login admin-login-page min-h-screen w-full flex items-center justify-center px-4 py-8 lg:px-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="auth-scenic-card admin-login-card-neo w-full max-w-[440px] px-6 py-6 sm:px-7 sm:py-7"
      >
        <div className="relative z-10">
          <div className="auth-login-brand auth-login-brand--compact">
            <div className="auth-login-badge">Monto</div>
            <div className="auth-login-copy">
              <h1 className="auth-login-title">{mode === 'superadmin' ? 'Super admin access' : 'Admin login'}</h1>
              <p className="auth-login-subtitle">
                {mode === 'superadmin'
                  ? 'Manage academy admins and platform data from one secure place.'
                  : 'Sign in to manage courses, notes, quizzes, access codes, and student records.'}
              </p>
            </div>
          </div>

          <div className="admin-login-chip-row">
            <div className="admin-login-chip">{mode === 'superadmin' ? 'Super Admin' : 'Admin'}</div>
            <div className="admin-login-chip">Secure Access</div>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4 max-w-sm mx-auto">
            <label className="admin-login-field">
              <span className="admin-login-label">Username</span>
              <div className="admin-login-input-wrap">
                <input
                  className="auth-scenic-input admin-login-underline-input text-sm"
                  placeholder="Enter admin username"
                  value={username}
                  disabled={isSigningIn}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                />
                <Mail size={18} className="admin-login-input-icon" />
              </div>
            </label>

            <label className="admin-login-field">
              <span className="admin-login-label">Password</span>
              <div className="admin-login-input-wrap">
                <input
                  type="password"
                  className="auth-scenic-input admin-login-underline-input text-sm"
                  placeholder="Enter password"
                  value={password}
                  disabled={isSigningIn}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <Lock size={18} className="admin-login-input-icon" />
              </div>
            </label>

            <div className="admin-login-row">
              <label className="flex items-center gap-2 text-sm text-white/90">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10"
                  checked={rememberMe}
                  disabled={isSigningIn}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
            </div>

            {error && <p className="auth-login-error">{error}</p>}

            <button type="submit" disabled={isSigningIn} className="auth-scenic-button auth-login-submit py-4 text-lg">
              {isSigningIn ? 'Opening...' : 'Continue'}
            </button>
            {isSigningIn && (
              <div className="admin-login-progress" aria-label={`Login loading ${loginProgress}%`}>
                <div className="admin-login-progress-track">
                  <span style={{ width: `${loginProgress}%` }} />
                </div>
                <b>{loginProgress}%</b>
              </div>
            )}
            {mode === 'admin' && (
              <button
                type="button"
                onClick={handleDemoAdminLogin}
                disabled={isSigningIn}
                className="admin-login-demo-button w-full rounded-2xl px-4 py-3 text-sm font-bold transition"
              >
                Demo Admin
              </button>
            )}
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminPanelScreen = ({
  courses,
  notes,
  quizzes,
  sliders,
  liveClasses,
  users,
  authSession,
  initialTab = 'dashboard',
  appControlSettings,
  appControlLastSynced,
  onSaveAppControlSettings,
  onRefresh,
  onLogout
}: {
  courses: Course[],
  notes: Note[],
  quizzes: Quiz[],
  sliders: SliderItem[],
  liveClasses: LiveClass[],
  users: AdminUser[],
  authSession: AdminSession,
  initialTab?: AdminPanelTab,
  appControlSettings: AppControlSettings,
  appControlLastSynced: number,
  onSaveAppControlSettings: (settings: AppControlSettings) => Promise<{ success: boolean; message?: string }>,
  onRefresh: () => Promise<void>,
  onLogout: () => void
}) => {
  const [activeTab, setActiveTab] = useState<AdminPanelTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [uploadingSlider, setUploadingSlider] = useState(false);
  const [editingSliderId, setEditingSliderId] = useState('');
  const [sliderForm, setSliderForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    sort_order: '0',
    is_active: true,
  });
  const [sliderImageFile, setSliderImageFile] = useState<File | null>(null);
  const [sliderPreviewUrl, setSliderPreviewUrl] = useState('');

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    lessons: '0',
    image: '',
    price: '0',
    oldPrice: '0',
    type: 'free' as 'free' | 'premium',
    category: 'General',
  });
  const [lessonForm, setLessonForm] = useState({
    course_id: '',
    title: '',
    duration: '',
  note_content: '',
  note_url: '',
  video_url: '',
  thumbnail_url: '',
  download_url: '',
  download_label: '',
  download_enabled: true,
  sort_order: '0',
});
  const [playlistImportForm, setPlaylistImportForm] = useState({
    course_id: '',
    playlist_url: '',
    start_order: '',
  });
  const [courseThumbnailFile, setCourseThumbnailFile] = useState<File | null>(null);
  const [lessonThumbnailFile, setLessonThumbnailFile] = useState<File | null>(null);
  const [courseThumbnailPreviewUrl, setCourseThumbnailPreviewUrl] = useState('');
  const [noteForm, setNoteForm] = useState({
    title: '',
    lessons: '1',
    category: 'General',
    type: 'free',
    url: '',
    content: '',
  });
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [liveClassForm, setLiveClassForm] = useState({
    title: '',
    description: '',
    meeting_url: '',
    scheduled_at: '',
    access_type: 'free' as 'free' | 'premium',
    audience_type: 'all' as 'all' | 'course' | 'selected',
    course_id: '',
    selected_user_ids: [] as string[],
    is_active: true,
  });
  const [quizForm, setQuizForm] = useState({
    topic: '',
    type: 'free',
  });
  const [questionForm, setQuestionForm] = useState({
    id: '',
    quiz_id: '',
    text: '',
    optionsText: '',
    correctAnswer: '0',
    explanation: '',
    image_url: '',
  });
  const [selectedManagedCourseId, setSelectedManagedCourseId] = useState('');
  const [courseQuizForm, setCourseQuizForm] = useState({
    quiz_id: '',
    text: '',
    optionsText: '',
    correctAnswer: '0',
    explanation: '',
  });
  const [questionImportQuizId, setQuestionImportQuizId] = useState('');
  const [questionImportFile, setQuestionImportFile] = useState<File | null>(null);
  const [questionImportJson, setQuestionImportJson] = useState('');
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreviewUrl, setQuestionImagePreviewUrl] = useState('');
  const [editingCourseId, setEditingCourseId] = useState('');
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingNoteId, setEditingNoteId] = useState('');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [editingLiveClassId, setEditingLiveClassId] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => getStoredAdminAccounts());
  const [adminAccountForm, setAdminAccountForm] = useState({ username: '', password: '' });
  const [noteCategories, setNoteCategories] = useState<string[]>(() => getStoredNoteCategories());
  const [newNoteCategory, setNewNoteCategory] = useState('');
  const [customerAccessForm, setCustomerAccessForm] = useState({ userId: '', courseId: '', durationDays: '30' });
  const [selectedStudent, setSelectedStudent] = useState<AdminUser | null>(null);
  const [studentAccessForm, setStudentAccessForm] = useState({ courseId: '', durationDays: '30' });
  const [generatedCustomerCode, setGeneratedCustomerCode] = useState('');
  const [studentAccessCode, setStudentAccessCode] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [accessStudentSearchQuery, setAccessStudentSearchQuery] = useState('');
  const [accessCourseSearchQuery, setAccessCourseSearchQuery] = useState('');
  const [liveClassStudentSearchQuery, setLiveClassStudentSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [pushForm, setPushForm] = useState({
    title: appControlSettings.notificationTitle,
    body: appControlSettings.notificationBody,
    audience: 'all' as 'all' | 'premium' | 'free' | 'selected',
    userId: '',
    screen: 'home',
  });
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [notificationHistoryLoading, setNotificationHistoryLoading] = useState(false);
  const [appControlForm, setAppControlForm] = useState<AppControlSettings>(appControlSettings);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'app-control', label: 'App Control', icon: <Smartphone size={18} /> },
    { id: 'slider', label: 'Sliders', icon: <Eye size={18} /> },
    { id: 'course', label: 'Course Builder', icon: <BookOpen size={18} /> },
    { id: 'note', label: 'Notes', icon: <FileText size={18} /> },
    { id: 'quiz', label: 'Quiz Builder', icon: <HelpCircle size={18} /> },
    { id: 'live', label: 'Live Classes', icon: <Bell size={18} /> },
    { id: 'user', label: 'Users', icon: <User size={18} /> },
    { id: 'access', label: 'Premium Access', icon: <Lock size={18} /> },
    { id: 'push-notification', label: 'Push Notification', icon: <Bell size={18} /> },
  ] as const;

  const cardClass = 'admin-card admin-surface-card p-5 sm:p-6';
  const lessons = courses.flatMap((course) => course.lessonList || []);
  const questions = quizzes.flatMap((quiz) => quiz.questions.map((question) => ({ ...question, topic: quiz.topic })));
  const normalizedStudentSearch = studentSearchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((userItem) => {
    if (!normalizedStudentSearch) {
      return true;
    }
    return [
      userItem.name,
      userItem.email,
      userItem.id,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedStudentSearch));
  });
  const normalizedAccessStudentSearch = accessStudentSearchQuery.trim().toLowerCase();
  const accessUsers = users.filter((userItem) => {
    if (!normalizedAccessStudentSearch) {
      return true;
    }
    return [
      userItem.name,
      userItem.email,
      userItem.id,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedAccessStudentSearch));
  });
  const normalizedAccessCourseSearch = accessCourseSearchQuery.trim().toLowerCase();
  const normalizedLiveClassStudentSearch = liveClassStudentSearchQuery.trim().toLowerCase();
  const freeCourses = courses.filter(isCourseFree);
  const premiumCourses = courses.filter((course) => !isCourseFree(course));
  const liveClassStudentOptions = users.filter((userItem) => {
    if (!normalizedLiveClassStudentSearch) {
      return true;
    }
    return [userItem.name, userItem.email, userItem.id].some((value) => String(value || '').toLowerCase().includes(normalizedLiveClassStudentSearch));
  });
  const filteredPremiumCourses = premiumCourses.filter((course) => {
    if (!normalizedAccessCourseSearch) {
      return true;
    }
    return [
      course.title,
      course.category,
      course.id,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedAccessCourseSearch));
  });
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard';
  const adminDisplayName = authSession.username || users[0]?.name || 'Monto Admin';
  const adminInitials = adminDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AD';
  const getStudentInitials = (value: string) => value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'ST';
  const activeSliderCount = sliders.filter((slider) => slider.is_active).length;
  const freeCourseCount = freeCourses.length;
  const premiumCourseCount = premiumCourses.length;
  const freeNoteCount = notes.filter((note) => (note.type || 'free') === 'free').length;
  const totalCourseLessons = courses.reduce((sum, course) => sum + Number(course.lessons || 0), 0);
  const coursesWithVideos = courses.filter((course) => (course.lessonList || []).length > 0).length;
  const emptyCourseCount = Math.max(0, courses.length - coursesWithVideos);
  const quizQuestionAverage = quizzes.length ? Math.round(questions.length / quizzes.length) : 0;
  const studentAccessCount = users.reduce((sum, userItem) => sum + (userItem.grantedCourseIds?.length || 0), 0);
  const contentHealthScore = Math.min(
    100,
    Math.round(
      (courses.length ? (coursesWithVideos / courses.length) * 44 : 0)
      + (activeSliderCount ? 18 : 0)
      + (notes.length ? 18 : 0)
      + (quizzes.length ? 20 : 0)
    )
  );
  const alertCount = Math.max(0, premiumCourseCount - activeSliderCount);
  const dashboardStats = [
    { label: 'Courses', value: courses.length.toLocaleString(), note: `${freeCourseCount} free, ${premiumCourseCount} premium`, tone: 'slate', icon: <BookOpen size={20} /> },
    { label: 'Video Lessons', value: lessons.length.toLocaleString(), note: `${totalCourseLessons} lesson slots planned`, tone: 'teal', icon: <Play size={20} /> },
    { label: 'Students', value: users.length.toLocaleString(), note: `${studentAccessCount} course grants issued`, tone: 'green', icon: <User size={20} /> },
    { label: 'Health', value: `${contentHealthScore}%`, note: alertCount ? `${alertCount} homepage attention items` : 'Publishing system balanced', tone: alertCount ? 'danger' : 'blue', icon: <ShieldCheck size={20} /> },
  ] as const;
  const adminInsights = [
    {
      title: 'Course Coverage',
      value: `${coursesWithVideos}/${courses.length || 0}`,
      detail: emptyCourseCount ? `${emptyCourseCount} courses still need videos` : 'Every course has attached lessons',
      tone: emptyCourseCount ? 'amber' : 'emerald',
      action: 'Open Builder',
      tab: 'course' as typeof activeTab,
    },
    {
      title: 'Free Learning',
      value: freeCourseCount.toLocaleString(),
      detail: 'Courses students can open without access codes',
      tone: 'green',
      action: 'Manage Courses',
      tab: 'course' as typeof activeTab,
    },
    {
      title: 'Quiz Depth',
      value: quizQuestionAverage ? `${quizQuestionAverage}/quiz` : '0/quiz',
      detail: `${questions.length} questions across ${quizzes.length} quizzes`,
      tone: 'blue',
      action: 'Review MCQs',
      tab: 'quiz' as typeof activeTab,
    },
    {
      title: 'Homepage Readiness',
      value: `${activeSliderCount}`,
      detail: activeSliderCount ? 'Active banners are visible to students' : 'Add one active slider for the home screen',
      tone: activeSliderCount ? 'violet' : 'rose',
      action: 'Edit Slider',
      tab: 'slider' as typeof activeTab,
    },
  ];
  const overviewMetrics = [
    { label: 'Notes', value: notes.length, max: Math.max(notes.length, courses.length, lessons.length, quizzes.length, 1), tone: 'blue' },
    { label: 'Courses', value: courses.length, max: Math.max(notes.length, courses.length, lessons.length, quizzes.length, 1), tone: 'emerald' },
    { label: 'Lessons', value: lessons.length, max: Math.max(notes.length, courses.length, lessons.length, quizzes.length, 1), tone: 'amber' },
    { label: 'Quizzes', value: quizzes.length, max: Math.max(notes.length, courses.length, lessons.length, quizzes.length, 1), tone: 'rose' },
  ];
  const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const overviewSeries = [
    {
      label: 'Sales',
      color: '#3b82f6',
      values: [
        Math.max(2, courses.length - 3),
        Math.max(3, courses.length - 1),
        Math.max(3, courses.length),
        Math.max(4, courses.length + 1),
        Math.max(5, courses.length + 2),
        Math.max(5, courses.length + 1),
        Math.max(6, courses.length + 3),
      ],
    },
    {
      label: 'Revenue',
      color: '#43a047',
      values: [
        Math.max(1, premiumCourseCount),
        Math.max(2, premiumCourseCount + 1),
        Math.max(2, premiumCourseCount + 1),
        Math.max(3, premiumCourseCount + 2),
        Math.max(4, premiumCourseCount + 3),
        Math.max(5, premiumCourseCount + 5),
        Math.max(4, premiumCourseCount + 4),
      ],
    },
  ] as const;
  const chartHeight = 220;
  const chartWidth = 560;
  const chartMax = Math.max(...overviewSeries.flatMap((series) => series.values), 8);
  const buildChartPath = (values: readonly number[]) =>
    values.map((value, index) => {
      const x = (index / (values.length - 1)) * chartWidth;
      const y = chartHeight - (value / chartMax) * (chartHeight - 20);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  const recentItems = [
    { id: courses[0]?.id || '10234', title: courses[0]?.title || 'Science Masterclass', status: 'Published', metric: `${courses[0]?.lessons || 0} lessons`, tone: 'green' },
    { id: quizzes[0]?.id || '10233', title: quizzes[0]?.topic || 'Weekly Quiz Pack', status: 'Processing', metric: `${quizzes[0]?.questions.length || 0} questions`, tone: 'blue' },
    { id: notes[0]?.id || '10232', title: notes[0]?.title || 'Revision Notes', status: 'Delivered', metric: `${notes[0]?.lessons || 0} units`, tone: 'green' },
    { id: sliders[0]?.id || '10231', title: sliders[0]?.title || 'Homepage Banner', status: activeSliderCount ? 'Live' : 'Pending', metric: `${activeSliderCount} active`, tone: activeSliderCount ? 'amber' : 'orange' },
  ];
  const spotlightItems = [
    { label: 'Courses', value: Math.max(24, courses.length * 18) },
    { label: 'Premium', value: Math.max(18, premiumCourseCount * 24) },
    { label: 'Notes', value: Math.max(16, freeNoteCount * 14) },
  ];
  const adminMessages = [
    `${adminDisplayName}: Review new course uploads before publishing.`,
    `${users[1]?.name || 'Priya'}: Student access requests need approval.`,
  ];
  const dashboardPriorityItems = [
    {
      label: 'Homepage',
      value: activeSliderCount ? 'Live' : 'Needs slider',
      tone: activeSliderCount ? 'green' : 'amber',
      tab: 'slider' as typeof activeTab,
    },
    {
      label: 'Free Access',
      value: `${freeCourseCount} open courses`,
      tone: 'blue',
      tab: 'course' as typeof activeTab,
    },
    {
      label: 'Premium',
      value: `${premiumCourseCount} locked courses`,
      tone: 'violet',
      tab: 'access' as typeof activeTab,
    },
  ];
  const isSuperAdmin = authSession.role === 'superadmin';
  const adminControlCards: Array<{
    id: typeof activeTab;
    title: string;
    description: string;
    count: string;
    tone: string;
    icon: React.ReactNode;
  }> = [
    { id: 'app-control', title: 'App Control', description: 'Control app status, welcome messages, update notices, protection, splash, offline page, and push defaults.', count: appControlForm.maintenanceMode ? 'Maintenance ON' : 'Live App', tone: 'cyan', icon: <Smartphone size={22} /> },
    { id: 'course', title: 'Course Builder', description: 'Create free or premium courses, upload thumbnails, and manage videos in one place.', count: `${courses.length} courses, ${lessons.length} lessons`, tone: 'blue', icon: <BookOpen size={22} /> },
    { id: 'access', title: 'Premium Access', description: 'Generate student-specific access codes for locked courses.', count: `${premiumCourses.length} premium`, tone: 'amber', icon: <Lock size={22} /> },
    { id: 'slider', title: 'Homepage Slider', description: 'Upload banners and control what appears first for students.', count: `${activeSliderCount} active`, tone: 'violet', icon: <Eye size={22} /> },
    { id: 'note', title: 'Notes', description: 'Publish downloadable notes and organize study material categories.', count: `${notes.length} notes`, tone: 'slate', icon: <FileText size={22} /> },
    { id: 'quiz', title: 'Quiz Builder', description: 'Create quiz sets, add MCQs, import JSON, and review answers in one place.', count: `${quizzes.length} quizzes, ${questions.length} MCQs`, tone: 'rose', icon: <HelpCircle size={22} /> },
    { id: 'live', title: 'Live Classes', description: 'Schedule free or premium sessions and choose all, course, or student-specific visibility.', count: `${liveClasses.length} sessions`, tone: 'indigo', icon: <Bell size={22} /> },
    { id: 'user', title: 'Students', description: 'Search student records and check unlocked course access.', count: `${users.length} students`, tone: 'emerald', icon: <User size={22} /> },
    { id: 'push-notification', title: 'Push Notifications', description: 'Open the notification console inside the admin panel.', count: 'E-Droid', tone: 'indigo', icon: <Bell size={22} /> },
  ];
  const normalizedAdminSearch = adminSearchQuery.trim().toLowerCase();
  const filteredAdminControlCards = adminControlCards.filter((item) => {
    if (!normalizedAdminSearch) {
      return true;
    }
    return [item.title, item.description, item.count].some((value) => value.toLowerCase().includes(normalizedAdminSearch));
  });
  const isFreeCourseSection = false;
  const displayedCourses = courses;
  const managedCourse = courses.find((course) => String(course.id) === String(selectedManagedCourseId)) || courses[0] || null;
  const managedCourseLessons = managedCourse
    ? [...(managedCourse.lessonList || [])].sort((left, right) => (Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)) || String(left.title).localeCompare(String(right.title)))
    : [];
  const managedCourseQuiz = quizzes.find((quiz) => String(quiz.id) === String(courseQuizForm.quiz_id))
    || quizzes.find((quiz) => managedCourse && String(quiz.topic || '').toLowerCase().includes(String(managedCourse.title || '').toLowerCase()))
    || null;
  const managedCourseQuestions = managedCourseQuiz?.questions || [];
  const activeQuizBuilderId = questionForm.quiz_id || questionImportQuizId || quizzes[0]?.id || '';
  const activeQuizBuilder = quizzes.find((quiz) => String(quiz.id) === String(activeQuizBuilderId)) || quizzes[0] || null;
  const activeQuizBuilderQuestions = activeQuizBuilder?.questions || [];
  const showNotice = (nextMessage: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setMessage(nextMessage);
    setToast({ message: nextMessage, tone });
  };

  const getNoticeTone = (value: string): 'success' | 'error' | 'info' => {
    const normalized = value.toLowerCase();
    if (normalized.includes('success') || normalized.includes('saved') || normalized.includes('created') || normalized.includes('updated') || normalized.includes('deleted') || normalized.includes('generated') || normalized.includes('removed') || normalized.includes('imported')) {
      return 'success';
    }
    if (normalized.includes('fail') || normalized.includes('unable') || normalized.includes('required') || normalized.includes('invalid') || normalized.includes('error') || normalized.includes('smaller') || normalized.includes('choose') || normalized.includes('select')) {
      return 'error';
    }
    return 'info';
  };

  const confirmDelete = (title: string, description: string, onConfirm: () => Promise<void> | void, confirmLabel = 'Delete') => {
    setConfirmDialog({
      title,
      description,
      confirmLabel,
      tone: 'danger',
      onConfirm,
    });
  };

  const openAdminTab = (tabId: typeof activeTab) => {
    if (tabId === 'free-course' || tabId === 'lesson') {
      setEditingCourseId('');
      setCourseForm({
        title: '',
        description: '',
        lessons: '0',
        image: '',
        type: 'free',
        price: '0',
        oldPrice: '0',
        category: 'General',
      });
    }
    const normalizedTab = tabId === 'question'
      ? 'quiz'
      : tabId === 'free-course' || tabId === 'lesson'
        ? 'course'
        : tabId;
    setActiveTab(normalizedTab);
  };

  useEffect(() => {
    setAppControlForm(appControlSettings);
    setPushForm((current) => ({
      ...current,
      title: current.title || appControlSettings.notificationTitle,
      body: current.body || appControlSettings.notificationBody,
    }));
  }, [appControlSettings]);

  const updateAppControlForm = <K extends keyof AppControlSettings>(key: K, value: AppControlSettings[K]) => {
    setAppControlForm((current) => ({ ...current, [key]: value }));
  };

  const saveAppControlForm = async () => {
    setLoading(true);
    setMessage('');
    const result = await onSaveAppControlSettings(normalizeAppControlSettings(appControlForm));
    setLoading(false);
    showNotice(result.message || (result.success ? 'App control settings saved' : 'Unable to save app control settings'), result.success ? 'success' : 'error');
  };

  useEffect(() => {
    if (sliderImageFile) {
      const objectUrl = URL.createObjectURL(sliderImageFile);
      setSliderPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setSliderPreviewUrl(sliderForm.image_url || '');
  }, [sliderImageFile, sliderForm.image_url]);

  useEffect(() => {
    if (courseThumbnailFile) {
      const objectUrl = URL.createObjectURL(courseThumbnailFile);
      setCourseThumbnailPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setCourseThumbnailPreviewUrl(courseForm.image || '');
  }, [courseThumbnailFile, courseForm.image]);

  useEffect(() => {
    if (questionImageFile) {
      const objectUrl = URL.createObjectURL(questionImageFile);
      setQuestionImagePreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setQuestionImagePreviewUrl(questionForm.image_url || '');
  }, [questionImageFile, questionForm.image_url]);

  const loadAdminAccounts = async () => {
    try {
      const response = await fetchWithTimeout(apiUrl('/api/admin/accounts'), {
        headers: getAdminAuthHeaders(),
      });
      const data = await readJsonResponse(response);
      if (data.success && Array.isArray(data.accounts)) {
        setAdminAccounts(data.accounts.map((account: any) => ({
          id: String(account.id),
          role: account.role === 'superadmin' ? 'superadmin' : 'admin',
          username: String(account.username || ''),
          password: '',
          createdAt: Date.parse(String(account.createdAt || '')) || Date.now(),
        })));
        return;
      }
    } catch {}

    setAdminAccounts(getStoredAdminAccounts());
  };

  useEffect(() => {
    loadAdminAccounts();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (message) {
      setToast({ message, tone: getNoticeTone(message) });
    }
  }, [message]);

  useEffect(() => {
    if (!selectedManagedCourseId && courses[0]) {
      setSelectedManagedCourseId(courses[0].id);
    }
  }, [courses, selectedManagedCourseId]);

  useEffect(() => {
    const mergedCategories = Array.from(new Set([
      ...getStoredNoteCategories(),
      ...notes.map((note) => note.category).filter(Boolean),
    ]));
    setNoteCategories(mergedCategories);
    saveStoredNoteCategories(mergedCategories);
  }, [notes]);

  const submitAction = async (action: string, payload: Record<string, unknown>, reset: () => void) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost(action, payload);
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Request failed');
        setLoading(false);
        return;
      }
      reset();
      try {
        await onRefresh();
      } catch (error) {
        console.error(`${action} succeeded but dashboard refresh failed:`, error);
      }
      setMessage(data.message || 'Saved successfully');
    } catch (error) {
      setMessage('Unable to save data');
    } finally {
      setLoading(false);
    }
  };

  const submitSlider = async () => {
    if (!sliderForm.title.trim() || !sliderForm.subtitle.trim()) {
      setMessage('Slider title and subtitle are required');
      return;
    }

    if (!sliderImageFile && !sliderForm.image_url.trim()) {
      setMessage('Upload a slider image or provide an image URL');
      return;
    }

    setLoading(true);
    setUploadingSlider(true);
    setMessage('');

    try {
      const payload: Record<string, unknown> = {
        ...(editingSliderId ? { id: editingSliderId } : {}),
        title: sliderForm.title,
        subtitle: sliderForm.subtitle,
        image_url: sliderForm.image_url,
        sort_order: Number(sliderForm.sort_order || 0),
        is_active: sliderForm.is_active ? 'true' : 'false',
      };

      if (sliderImageFile) {
        payload.image_url = await uploadFileToCloudinary(sliderImageFile, 'slider');
      }

      const action = editingSliderId ? 'updateSlider' : 'createSlider';
      const response = await apiSliderPost(action, payload);
      const data = await readLenientJsonResponse(response);

      if (!data.success) {
        setMessage(data.message || 'Unable to save slider');
        return;
      }

      setSliderForm({ title: '', subtitle: '', image_url: '', sort_order: '0', is_active: true });
      setSliderImageFile(null);
      setSliderPreviewUrl('');
      setEditingSliderId('');
      await onRefresh();
      setMessage('Slider saved successfully');
    } catch (error) {
      setMessage(
        sliderImageFile
          ? error instanceof Error
            ? `Cloudinary upload failed: ${error.message}`
            : 'Cloudinary upload failed. Check server media configuration.'
          : 'Unable to upload slider image'
      );
    } finally {
      setLoading(false);
      setUploadingSlider(false);
    }
  };

  const submitNote = async () => {
    if (!noteForm.title.trim() || !noteForm.category.trim()) {
      setMessage('Note title and category are required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload: Record<string, unknown> = {
        ...(editingNoteId ? { id: editingNoteId } : {}),
        ...noteForm,
        lessons: Number(noteForm.lessons || 0),
      };

      if (noteFile) {
        payload.url = await uploadFileToCloudinary(noteFile, 'note');
      }

      const action = editingNoteId ? 'updateNote' : 'createNote';
      const response = await apiNotePost(action, payload);
      const data = await readLenientJsonResponse(response);

      if (!data.success) {
        setMessage(data.message || 'Unable to save note');
        return;
      }

      setNoteForm({ title: '', lessons: '1', category: 'Chemistry', type: 'free', url: '', content: '' });
      setNoteFile(null);
      setEditingNoteId('');
      await onRefresh();
      setMessage(noteFile ? 'Note uploaded and saved successfully' : 'Note saved successfully');
    } catch (error) {
      setMessage(
        noteFile
          ? error instanceof Error
            ? `Note upload failed: ${error.message}`
            : 'Note upload failed. Check Cloudinary configuration.'
          : 'Unable to save note'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitQuestionImport = async () => {
    const quizId = questionImportQuizId || activeQuizBuilderId;
    if (!quizId) {
      setMessage('Select a quiz before importing questions');
      return;
    }

    if (!questionImportFile && !questionImportJson.trim()) {
      setMessage('Choose a JSON file or paste JSON to import');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const rawText = questionImportFile ? await fileToText(questionImportFile) : questionImportJson;
      const parsedJson = JSON.parse(rawText);
      const importedQuestions = normalizeImportedQuestions(parsedJson);
      const response = await apiPost('importQuestions', {
        quiz_id: quizId,
        questions: importedQuestions,
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        throw new Error(data.message || 'Unable to import questions');
      }

      setQuestionImportFile(null);
      setQuestionImportJson('');
      setQuestionImportQuizId('');
      await onRefresh();
      setMessage(`${importedQuestions.length} questions imported successfully`);
    } catch (error) {
      try {
        const rawText = questionImportFile ? await fileToText(questionImportFile) : questionImportJson;
        const parsedJson = JSON.parse(rawText);
        const importedQuestions = normalizeImportedQuestions(parsedJson);

        for (const question of importedQuestions) {
          const response = await apiPost('createQuestion', {
            quiz_id: quizId,
            text: question.text,
            options: question.options,
            option_images: question.option_images || [],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            image_url: question.image_url,
          });
          const data = await readJsonResponse(response);
          if (!data.success) {
            throw new Error(data.message || 'Unable to import questions');
          }
        }

        setQuestionImportFile(null);
        setQuestionImportJson('');
        setQuestionImportQuizId('');
        await onRefresh();
        setMessage('Questions imported successfully');
      } catch (fallbackError) {
        setMessage(fallbackError instanceof Error ? fallbackError.message : 'Unable to import questions');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    const options = questionForm.optionsText.split('\n').map((item) => item.trim()).filter(Boolean);
    const correctAnswer = Number(questionForm.correctAnswer || 0);
    const quizId = questionForm.quiz_id || activeQuizBuilderId;

    if (!quizId || !questionForm.text.trim() || options.length < 2) {
      setMessage('Quiz, question text, and at least 2 options are required');
      return;
    }

    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      setMessage('Correct answer index must match one of the provided options');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        ...(editingQuestionId ? { id: editingQuestionId } : {}),
        quiz_id: quizId,
        text: questionForm.text.trim(),
        options,
        option_images: [],
        correctAnswer,
        explanation: questionForm.explanation.trim(),
        image_url: questionForm.image_url.trim(),
      };

      if (questionImageFile) {
        payload.image_url = await uploadFileToCloudinary(questionImageFile, 'question');
      }

      const response = await apiPost(editingQuestionId ? 'updateQuestion' : 'createQuestion', payload);
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to save question');
        return;
      }

      setQuestionForm({ id: '', quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '', image_url: '' });
      setQuestionImageFile(null);
      setQuestionImagePreviewUrl('');
      setEditingQuestionId('');
      await onRefresh();
      setMessage(editingQuestionId ? 'Question updated successfully' : 'Question created successfully');
    } catch (error) {
      setMessage('Unable to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminAccount = async () => {
    const username = adminAccountForm.username.trim();
    const password = adminAccountForm.password;
    if (!username || !password) {
      setMessage('Admin username and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await apiPost('createAdminAccount', {
        role: 'admin',
        username,
        password,
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to save admin account');
        return;
      }

      setAdminAccountForm({ username: '', password: '' });
      await loadAdminAccounts();
      setMessage(data.message || 'Admin account saved');
    } catch {
      setMessage('Unable to save admin account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminAccount = async (accountId: string) => {
    try {
      setLoading(true);
      const response = await apiPost('deleteAdminAccount', { id: accountId });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to delete admin account');
        return;
      }

      await loadAdminAccounts();
      setMessage(data.message || 'Admin account deleted');
    } catch {
      const nextAccounts = getStoredAdminAccounts().filter((account) => account.id !== accountId);
      saveStoredAdminAccounts(nextAccounts);
      setAdminAccounts(nextAccounts);
      setMessage('Local legacy admin account removed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNoteCategory = () => {
    const category = newNoteCategory.trim();
    if (!category) {
      setMessage('Category name is required');
      return;
    }

    if (noteCategories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      setMessage('Category already exists');
      return;
    }

    const nextCategories = [...noteCategories, category];
    setNoteCategories(nextCategories);
    saveStoredNoteCategories(nextCategories);
    setNoteForm((current) => ({ ...current, category }));
    setNewNoteCategory('');
    setMessage('Note category added successfully');
  };

  const resetLiveClassForm = () => {
    setEditingLiveClassId('');
    setLiveClassForm({
      title: '',
      description: '',
      meeting_url: '',
      scheduled_at: '',
      access_type: 'free',
      audience_type: 'all',
      course_id: '',
      selected_user_ids: [],
      is_active: true,
    });
    setLiveClassStudentSearchQuery('');
  };

  const toggleLiveClassStudent = (userId: string) => {
    setLiveClassForm((current) => ({
      ...current,
      selected_user_ids: current.selected_user_ids.includes(userId)
        ? current.selected_user_ids.filter((item) => item !== userId)
        : [...current.selected_user_ids, userId],
    }));
  };

  const submitLiveClassForm = async () => {
    if (!liveClassForm.title.trim() || !liveClassForm.meeting_url.trim()) {
      setMessage('Live class title and meeting link are required');
      return;
    }

    if (!isValidMeetingUrl(liveClassForm.meeting_url)) {
      setMessage('Enter a valid meeting link, for example https://meet.google.com/abc-defg-hij');
      return;
    }

    const selectedCourseExists = liveClassForm.audience_type !== 'course'
      || courses.some((course) => String(course.id) === String(liveClassForm.course_id));

    if (liveClassForm.audience_type === 'course' && !liveClassForm.course_id) {
      setMessage('Choose a course for course-based live class visibility');
      return;
    }

    if (!selectedCourseExists) {
      setMessage('Selected course no longer exists. Refresh and choose another course.');
      return;
    }

    if (liveClassForm.audience_type === 'selected' && !liveClassForm.selected_user_ids.length) {
      setMessage('Choose at least one student for selected live class visibility');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost(editingLiveClassId ? 'updateLiveClass' : 'createLiveClass', {
        ...(editingLiveClassId ? { id: editingLiveClassId } : {}),
        ...liveClassForm,
        meeting_url: normalizeMeetingUrl(liveClassForm.meeting_url),
        course_id: liveClassForm.audience_type === 'course' ? liveClassForm.course_id : '',
        selected_user_ids: liveClassForm.audience_type === 'selected' ? liveClassForm.selected_user_ids : [],
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to save live class');
        return;
      }

      resetLiveClassForm();
      await onRefresh();
      setMessage(data.message || 'Live class saved successfully');
    } catch {
      setMessage('Unable to save live class');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomerAccessCode = async () => {
    if (!customerAccessForm.userId || !customerAccessForm.courseId) {
      setMessage('Select a student and premium course first');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost('grantCourseAccess', {
        userId: customerAccessForm.userId,
        courseId: customerAccessForm.courseId,
        durationDays: Number(customerAccessForm.durationDays || 0),
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to generate customer access code');
        return;
      }

      setGeneratedCustomerCode(String(data.accessCode || ''));
      try {
        await onRefresh();
      } catch (error) {
        console.error('Access code generated but dashboard refresh failed:', error);
      }
      setMessage('Customer access code generated successfully');
    } catch {
      setMessage('Unable to generate customer access code');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCustomerAccess = async () => {
    if (!customerAccessForm.userId || !customerAccessForm.courseId) {
      setMessage('Select a student and premium course first');
      return;
    }
    await submitAction('revokeCourseAccess', {
      userId: customerAccessForm.userId,
      courseId: customerAccessForm.courseId,
    }, () => setGeneratedCustomerCode(''));
  };

  const handleBlockCustomerAccess = async () => {
    if (!customerAccessForm.userId || !customerAccessForm.courseId) {
      setMessage('Select a student and premium course first');
      return;
    }
    await submitAction('blockCourseAccess', {
      userId: customerAccessForm.userId,
      courseId: customerAccessForm.courseId,
    }, () => setGeneratedCustomerCode(''));
  };

  const runStudentAccessAction = async (action: 'grantCourseAccess' | 'revokeCourseAccess' | 'blockCourseAccess') => {
    if (!selectedStudent || !studentAccessForm.courseId) {
      setMessage('Select a student and premium course first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await apiPost(action, {
        userId: selectedStudent.id,
        courseId: studentAccessForm.courseId,
        durationDays: Number(studentAccessForm.durationDays || 0),
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to update student access');
        return;
      }

      setStudentAccessCode(String(data.accessCode || ''));
      setSelectedStudent((current) => {
        if (!current) return current;
        if (data.user && Array.isArray(data.user.grantedCourseIds)) {
          return {
            ...current,
            ...data.user,
            grantedCourseIds: data.user.grantedCourseIds || [],
            blockedCourseIds: data.user.blockedCourseIds || [],
            userCategory: data.user.userCategory || ((data.user.grantedCourseIds || []).length ? 'premium' : 'free'),
          };
        }
        const currentIds = current.grantedCourseIds || [];
        const currentBlockedIds = current.blockedCourseIds || [];
        if (action === 'grantCourseAccess') {
          const nextIds = currentIds.includes(studentAccessForm.courseId)
            ? currentIds
            : [...currentIds, studentAccessForm.courseId];
          const nextBlockedIds = currentBlockedIds.filter((courseId) => String(courseId) !== String(studentAccessForm.courseId));
          return { ...current, grantedCourseIds: nextIds, blockedCourseIds: nextBlockedIds, userCategory: nextIds.length ? 'premium' : 'free' };
        }
        const nextIds = currentIds.filter((courseId) => String(courseId) !== String(studentAccessForm.courseId));
        const nextBlockedIds = action === 'blockCourseAccess'
          ? currentBlockedIds.includes(studentAccessForm.courseId)
            ? currentBlockedIds
            : [...currentBlockedIds, studentAccessForm.courseId]
          : currentBlockedIds.filter((courseId) => String(courseId) !== String(studentAccessForm.courseId));
        return { ...current, grantedCourseIds: nextIds, blockedCourseIds: nextBlockedIds, userCategory: nextIds.length ? 'premium' : 'free' };
      });
      await onRefresh();
      setMessage(data.message || 'Student access updated');
    } catch {
      setMessage('Unable to update student access');
    } finally {
      setLoading(false);
    }
  };

  const runStudentPlatformAction = async (action: 'blockUser' | 'unblockUser' | 'resetStudentDevice') => {
    if (!selectedStudent) {
      setMessage('Select a student first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await apiPost(action, { userId: selectedStudent.id });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to update student status');
        return;
      }

      setSelectedStudent((current) => {
        if (!current) {
          return current;
        }

        if (data.user) {
          return { ...current, ...normalizeAuthUser(data.user) };
        }

        if (action === 'resetStudentDevice') {
          return { ...current, deviceId: '', deviceLabel: '', deviceBoundAt: '', deviceLocked: false };
        }

        return { ...current, status: action === 'blockUser' ? 'blocked' : 'active' };
      });
      await onRefresh();
      setMessage(data.message || 'Student status updated');
    } catch {
      setMessage('Unable to update student status');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationHistory = async () => {
    setNotificationHistoryLoading(true);
    try {
      const response = await fetch(apiUrl('/api/notification-history'), {
        headers: { Accept: 'application/json', ...getAdminAuthHeaders() },
      });
      const data = await readLenientJsonResponse(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load notifications');
      }
      setNotificationHistory(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Unable to load notifications',
        tone: 'error',
      });
    } finally {
      setNotificationHistoryLoading(false);
    }
  };

  const sendPushNotificationFromPanel = async () => {
    const title = pushForm.title.trim();
    const body = pushForm.body.trim();

    if (!title || !body) {
      setMessage('Notification title and body are required');
      setToast({ message: 'Notification title and body are required', tone: 'error' });
      return;
    }

    if (pushForm.audience === 'selected' && !pushForm.userId) {
      setMessage('Select a student for selected notification');
      setToast({ message: 'Select a student first', tone: 'error' });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await apiPost('sendPushNotification', {
        title,
        body,
        audience: pushForm.audience,
        userIds: pushForm.audience === 'selected' ? [pushForm.userId] : [],
        screen: pushForm.screen,
      });
      const data = await readLenientJsonResponse(response);
      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Unable to send push notification';
        setMessage(errorMessage);
        setToast({ message: errorMessage, tone: 'error' });
        return;
      }

      setAppControlForm((current) => ({
        ...current,
        notificationTitle: title,
        notificationBody: body,
        notificationId: String(data.notificationId || Date.now()),
        notificationSentAt: String(data.sentAt || new Date().toISOString()),
      }));
      if (data.notification) {
        setNotificationHistory((current) => [data.notification as NotificationHistoryItem, ...current].slice(0, 50));
      } else {
        fetchNotificationHistory();
      }
      const deliveredText = Number(data.sent || 0) > 0
        ? `Sent to ${Number(data.sent || 0)} device${Number(data.sent || 0) === 1 ? '' : 's'}`
        : 'Saved as app broadcast';
      const finalMessage = data.message || deliveredText;
      setMessage(finalMessage);
      setToast({ message: finalMessage, tone: Number(data.failed || 0) ? 'info' : 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to send push notification';
      setMessage(errorMessage);
      setToast({ message: errorMessage, tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'push-notification') {
      fetchNotificationHistory();
    }
  }, [activeTab]);

  const resetCourseForm = () => {
    setCourseForm({ title: '', description: '', lessons: '0', image: '', price: '0', oldPrice: '0', type: 'free', category: 'General' });
    setCourseThumbnailFile(null);
    setEditingCourseId('');
  };

  const submitCourseForm = async () => {
    const title = courseForm.title.trim();
    const image = courseForm.image.trim();
    const category = courseForm.category.trim() || 'General';
    const courseType = courseForm.type === 'premium' ? 'premium' : 'free';
    const lessonsCount = Number(courseForm.lessons || 0);
    const price = courseType === 'premium' ? Number(courseForm.price || 0) : 0;
    const oldPrice = courseType === 'premium' ? Number(courseForm.oldPrice || 0) : 0;

    if (!title) {
      setMessage('Course title is required');
      return;
    }

    if (!courseThumbnailFile && (!image || !/^https?:\/\//i.test(image))) {
      setMessage('Add a valid thumbnail image URL or upload a course thumbnail');
      return;
    }

    if (!Number.isFinite(lessonsCount) || lessonsCount < 0) {
      setMessage('Lesson count must be 0 or more');
      return;
    }

    if (courseType === 'premium' && (!Number.isFinite(price) || price <= 0)) {
      setMessage('Premium course price must be greater than 0');
      return;
    }

    if (courseType === 'premium' && (!Number.isFinite(oldPrice) || oldPrice < price)) {
      setMessage('Old price should be equal to or higher than the current price');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload: Record<string, unknown> = {
        ...(editingCourseId ? { id: editingCourseId } : {}),
        title,
        description: courseForm.description.trim(),
        image,
        category,
        type: courseType,
        lessons: lessonsCount,
        price,
        oldPrice,
      };

      if (courseThumbnailFile) {
        payload.image = await uploadFileToCloudinary(courseThumbnailFile, 'course');
      }

      const response = await apiMediaPost(editingCourseId ? 'updateCourse' : 'createCourse', payload);
      const data = await readLenientJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to save course');
        return;
      }

      resetCourseForm();
      await onRefresh();
      setMessage(courseThumbnailFile ? 'Course thumbnail uploaded and saved' : data.message || 'Course saved successfully');
    } catch (error) {
      setMessage(
        courseThumbnailFile
          ? error instanceof Error
            ? `Course thumbnail upload failed: ${error.message}`
            : 'Course thumbnail upload failed. Check Cloudinary configuration.'
          : 'Unable to save course'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitLessonForm = async () => {
    const videoUrl = lessonForm.video_url.trim();

    if (!lessonForm.course_id || !lessonForm.title.trim()) {
      setMessage('Course and lesson title are required');
      return;
    }

    if (!videoUrl || !/(youtube\.com\/watch\?v=|youtu\.be\/|youtube(-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/|vimeo\.com\/|\.mp4(\?|$)|\.webm(\?|$)|\.mov(\?|$))/i.test(videoUrl)) {
      setMessage('Add a valid YouTube, Vimeo, or direct video file link for this lesson');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload: Record<string, unknown> = {
        ...(editingLessonId ? { id: editingLessonId } : {}),
        ...lessonForm,
        title: lessonForm.title.trim(),
        duration: lessonForm.duration.trim(),
        sort_order: Number(lessonForm.sort_order || 0),
        note_url: lessonForm.note_url.trim(),
        note_content: lessonForm.note_content.trim(),
        thumbnail_url: lessonForm.thumbnail_url.trim(),
        download_url: lessonForm.download_url.trim(),
        download_label: lessonForm.download_label.trim(),
        download_enabled: Boolean(lessonForm.download_enabled),
        video_url: normalizeVideoUrl(videoUrl),
      };

      if (lessonThumbnailFile) {
        payload.thumbnail_url = await uploadFileToCloudinary(lessonThumbnailFile, 'lesson');
      }

      const response = await apiMediaPost(editingLessonId ? 'updateLesson' : 'createLesson', payload);
      const data = await readLenientJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to save lesson');
        return;
      }

      setLessonForm({ course_id: selectedManagedCourseId || '', title: '', duration: '', note_content: '', note_url: '', video_url: '', thumbnail_url: '', download_url: '', download_label: '', download_enabled: true, sort_order: String(managedCourseLessons.length + 1) });
      setLessonThumbnailFile(null);
      setEditingLessonId('');
      await onRefresh();
      setMessage(lessonThumbnailFile ? 'Video thumbnail uploaded and lesson saved' : data.message || 'Lesson saved successfully');
    } catch (error) {
      setMessage(
        lessonThumbnailFile
          ? error instanceof Error
            ? `Video thumbnail upload failed: ${error.message}`
            : 'Video thumbnail upload failed. Check Cloudinary configuration.'
          : 'Unable to save lesson'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitPlaylistImport = async () => {
    const courseId = playlistImportForm.course_id || selectedManagedCourseId || managedCourse?.id || '';
    if (!courseId) {
      setMessage('Choose a course before importing a YouTube playlist');
      return;
    }

    if (!playlistImportForm.playlist_url.trim()) {
      setMessage('Paste a valid YouTube playlist URL');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost('importYoutubePlaylist', {
        course_id: courseId,
        playlist_url: playlistImportForm.playlist_url.trim(),
        start_order: playlistImportForm.start_order ? Number(playlistImportForm.start_order) : undefined,
      });
      const data = await readJsonResponse(response);
      if (!data.success) {
        setMessage(data.message || 'Unable to import YouTube playlist');
        return;
      }

      setPlaylistImportForm({ course_id: courseId, playlist_url: '', start_order: '' });
      await onRefresh();
      setMessage(data.message || 'YouTube playlist imported successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to import YouTube playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManagedCourseQuiz = () => {
    if (!managedCourse) {
      showNotice('Select a course first', 'error');
      return;
    }

    submitAction('createQuiz', {
      topic: `${managedCourse.title} MCQ`,
      type: managedCourse.type === 'premium' ? 'premium' : 'free',
    }, () => {
      setCourseQuizForm({ quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '' });
    });
  };

  const submitManagedCourseQuestion = () => {
    const options = courseQuizForm.optionsText.split('\n').map((item) => item.trim()).filter(Boolean);
    const correctAnswer = Number(courseQuizForm.correctAnswer || 0);
    const quizId = courseQuizForm.quiz_id || managedCourseQuiz?.id || '';

    if (!managedCourse) {
      showNotice('Select a course first', 'error');
      return;
    }

    if (!quizId) {
      showNotice('Create or choose an MCQ quiz for this course first', 'error');
      return;
    }

    if (!courseQuizForm.text.trim() || options.length < 2) {
      showNotice('Question text and at least 2 options are required', 'error');
      return;
    }

    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      showNotice('Correct answer index must match one option', 'error');
      return;
    }

    submitAction('createQuestion', {
      quiz_id: quizId,
      text: courseQuizForm.text.trim(),
      options,
      correctAnswer,
      explanation: courseQuizForm.explanation.trim(),
      image_url: '',
    }, () => {
      setCourseQuizForm((current) => ({ ...current, text: '', optionsText: '', correctAnswer: '0', explanation: '', quiz_id: quizId }));
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-panel min-h-screen w-full">
      <div className="admin-dashboard-wrap">
        <div className="admin-panel-layout">
          <aside className="admin-sidebar-shell">
            <div className="admin-sidebar-brand">
              <div className="admin-sidebar-brand-mark">
                <img
                  src="/logo.png"
                  alt="Monto logo"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="admin-sidebar-brand-title">Monto</div>
                <div className="admin-sidebar-brand-subtitle">Admin Dashboard</div>
              </div>
            </div>

            <nav className="admin-sidebar-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    openAdminTab(tab.id);
                    setMessage('');
                  }}
                  className={`admin-sidebar-link ${activeTab === tab.id ? 'admin-sidebar-link--active' : ''}`}
                >
                  <span className="admin-sidebar-link-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              <div className="admin-sidebar-status">
                <span>{isSuperAdmin ? 'Superadmin Mode' : 'Admin Mode'}</span>
                <strong>{contentHealthScore}% system health</strong>
              </div>
              <button onClick={onRefresh} className="admin-sidebar-link">
                <span className="admin-sidebar-link-icon"><ShieldCheck size={18} /></span>
                <span>{activeTabLabel}</span>
              </button>
              <button onClick={onLogout} className="admin-sidebar-link">
                <span className="admin-sidebar-link-icon"><LogOut size={18} /></span>
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <section className="admin-content-shell">
            <header className="admin-reference-topbar">
              <div className="admin-reference-search">
                <Search size={22} />
                <input
                  type="text"
                  placeholder="Search admin tools..."
                  aria-label="Search admin tools"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredAdminControlCards[0]) {
                      setActiveTab(filteredAdminControlCards[0].id);
                      setAdminSearchQuery('');
                    }
                  }}
                />
              </div>
              <div className="admin-reference-actions">
                <button type="button" className="admin-bell-button" onClick={onRefresh} aria-label="Refresh dashboard">
                  <Bell size={24} />
                  <span className="admin-bell-badge">{Math.max(1, alertCount || 2)}</span>
                </button>
                <div className="admin-reference-user">
                  <div className="admin-avatar admin-avatar--small">{adminInitials}</div>
                  <span>
                    <strong>{adminDisplayName}</strong>
                    <em>{isSuperAdmin ? 'Super Admin' : 'Admin'}</em>
                  </span>
                  <ChevronDown size={18} />
                </div>
              </div>
            </header>

            <main className="admin-main space-y-5">

            {message && (
              <div className={`${cardClass} ${message.includes('success') || message.includes('Saved') ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

      {activeTab === 'app-control' && (
        <div className="appcontrol-shell space-y-5">
          <div className="admin-command-hero appcontrol-hero">
            <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <p className="admin-control-eyebrow">AppCreator Style Control</p>
                <h1>App Control Center</h1>
                <span>Control the live Android app from one panel. Saved changes are pulled by installed apps every 5 seconds, so most switches apply without reinstall.</span>
                <div className="appcontrol-live-row">
                  <span className="appcontrol-live-dot" />
                  <b>Live sync active</b>
                  <em>Last sync {new Date(appControlLastSynced).toLocaleTimeString()}</em>
                </div>
                <div className="admin-command-actions mt-5">
                  <button type="button" className="admin-primary-button px-4 py-3 text-sm font-black" disabled={loading} onClick={saveAppControlForm}>
                    {loading ? 'Saving...' : 'Save App Control'}
                  </button>
                  <button type="button" className="admin-secondary-button px-4 py-3 text-sm font-black" onClick={() => setAppControlForm(appControlSettings)}>
                    Reset Unsaved
                  </button>
                  <button type="button" className="admin-secondary-button px-4 py-3 text-sm font-black" onClick={() => setActiveTab('push-notification')}>
                    Open Push Console
                  </button>
                </div>
              </div>
              <div className={`admin-hero-score-card appcontrol-status-card grid place-items-center p-5 text-white ${appControlForm.maintenanceMode || appControlForm.forceUpdate ? 'is-warning' : 'is-live'}`}>
                <div className="text-center">
                  <strong>{appControlForm.maintenanceMode ? 'STOP' : appControlForm.forceUpdate ? 'UPDATE' : 'LIVE'}</strong>
                  <span className="block text-white/75">
                    {appControlForm.maintenanceMode ? 'Maintenance mode' : appControlForm.forceUpdate ? 'Force update active' : 'Student app running'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {[
              { label: 'Push', value: appControlForm.pushEnabled ? 'Enabled' : 'Disabled', icon: <Bell size={20} /> },
              { label: 'Protection', value: appControlForm.screenProtection ? (appControlForm.screenProtectionScope === 'premium' ? 'Premium' : 'Global') : 'Off', icon: <ShieldCheck size={20} /> },
              { label: 'Video', value: appControlForm.videoProtectionEnabled ? 'Secured' : 'Standard', icon: <Play size={20} /> },
              { label: 'Splash', value: appControlForm.splashEnabled ? 'Active' : 'Hidden', icon: <Smartphone size={20} /> },
              { label: 'Offline Page', value: appControlForm.offlinePage ? 'Custom' : 'Basic', icon: <WifiOff size={20} /> },
            ].map((item) => (
              <div key={item.label} className="admin-reference-kpi admin-reference-kpi--blue appcontrol-kpi">
                <div className="admin-reference-kpi-top">
                  <span>{item.icon}</span>
                  <em>{item.label}</em>
                </div>
                <div className="admin-reference-kpi-value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="admin-control-center">
            <div className="admin-control-center-head">
              <div>
                <p className="admin-control-eyebrow">Video System Control</p>
                <h2>One control for lesson video behavior</h2>
                <span>These switches sync to the student app and control video security, notes access, and direct video downloads.</span>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['videoProtectionEnabled', 'Secure Video Player', 'Apply watermark, context blocking, and Android secure mode on video screens.'],
                ['videoNotesEnabled', 'Show Video Notes', 'Allow students to open lesson notes from video and course detail screens.'],
                ['videoDownloadEnabled', 'Allow Direct Downloads', 'Show download/remote playback controls for direct MP4 video links.'],
              ].map(([key, label, description]) => (
                <label key={key} className="admin-control-card flex items-center justify-between gap-3">
                  <span className="admin-control-icon"><Play size={18} /></span>
                  <span className="admin-control-copy min-w-0">
                    <strong>{label}</strong>
                    <em>{description}</em>
                  </span>
                  <button
                    type="button"
                    className={`appcontrol-switch ${Boolean(appControlForm[key as keyof AppControlSettings]) ? 'is-on' : ''}`}
                    onClick={() => updateAppControlForm(key as keyof AppControlSettings, !Boolean(appControlForm[key as keyof AppControlSettings]) as never)}
                    aria-pressed={Boolean(appControlForm[key as keyof AppControlSettings])}
                  >
                    <i />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="admin-control-center">
              <div className="admin-control-center-head">
                <div>
                  <h2>Global App Settings</h2>
                  <span>These settings are saved to the backend and loaded by the student app.</span>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="admin-login-field">
                  <span className="admin-login-label">App Name</span>
                  <input value={appControlForm.appName} onChange={(e) => updateAppControlForm('appName', e.target.value)} />
                </label>
                <label className="admin-login-field">
                  <span className="admin-login-label">Latest Version</span>
                  <input value={appControlForm.latestVersion} onChange={(e) => updateAppControlForm('latestVersion', e.target.value)} />
                </label>
                <label className="admin-login-field lg:col-span-2">
                  <span className="admin-login-label">Update URL</span>
                  <input placeholder="APK / Play Store / website update link" value={appControlForm.updateUrl} onChange={(e) => updateAppControlForm('updateUrl', e.target.value)} />
                </label>
                <label className="admin-login-field lg:col-span-2">
                  <span className="admin-login-label">Welcome Message</span>
                  <textarea value={appControlForm.welcomeMessage} onChange={(e) => updateAppControlForm('welcomeMessage', e.target.value)} />
                </label>
                <label className="admin-login-field lg:col-span-2">
                  <span className="admin-login-label">Maintenance Message</span>
                  <textarea value={appControlForm.maintenanceMessage} onChange={(e) => updateAppControlForm('maintenanceMessage', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="admin-control-center">
              <div className="admin-control-center-head">
                <div>
                  <h2>Feature Switches</h2>
                  <span>Turn app behaviors on/off.</span>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  ['maintenanceMode', 'Maintenance Mode', 'Temporarily stop student access.'],
                  ['forceUpdate', 'Force Update Prompt', 'Show required update screen.'],
                  ['welcomeEnabled', 'Welcome Message', 'Show first-open welcome notice.'],
                  ['pushEnabled', 'Push Notifications', 'Allow notification registration.'],
                  ['screenProtection', 'Screenshot / Recording Block', appControlForm.screenProtectionScope === 'premium' ? 'Protect premium course screens only.' : 'Protect the entire student app.'],
                  ['offlinePage', 'No Internet Page', 'Use custom offline screen.'],
                  ['splashEnabled', 'Splash Image', 'Use branded app splash.'],
                ].map(([key, label, description]) => (
                  <label key={key} className="admin-control-card flex items-center justify-between gap-3">
                    <span className="admin-control-icon">{key === 'screenProtection' ? <ShieldCheck size={18} /> : <Settings size={18} />}</span>
                    <span className="admin-control-copy min-w-0">
                      <strong>{label}</strong>
                      <em>{description}</em>
                    </span>
                    <button
                      type="button"
                      className={`appcontrol-switch ${Boolean(appControlForm[key as keyof AppControlSettings]) ? 'is-on' : ''}`}
                      onClick={() => updateAppControlForm(key as keyof AppControlSettings, !Boolean(appControlForm[key as keyof AppControlSettings]) as never)}
                      aria-pressed={Boolean(appControlForm[key as keyof AppControlSettings])}
                    >
                      <i />
                    </button>
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <span className="admin-login-label">Protection Scope</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    ['global', 'Entire App'],
                    ['premium', 'Premium Only'],
                  ].map(([scope, label]) => (
                    <button
                      key={scope}
                      type="button"
                      className={`admin-chip justify-center ${appControlForm.screenProtectionScope === scope ? 'is-active' : ''}`}
                      onClick={() => {
                        setAppControlForm((current) => ({
                          ...current,
                          screenProtection: true,
                          screenProtectionScope: scope as AppControlSettings['screenProtectionScope'],
                        }));
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {appControlForm.screenProtectionScope === 'premium'
                    ? 'Screenshots/recording block sirf premium course video, notes, details par lagega.'
                    : 'Screenshots/recording block poore student app par lagega.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="admin-control-center">
              <div className="admin-control-center-head">
                <div>
                  <h2>Push Notification Draft</h2>
                  <span>Save default title/body, or send immediately from this control panel.</span>
                </div>
                <button type="button" className="admin-control-refresh" onClick={() => setActiveTab('push-notification')}>
                  Send Push
                </button>
              </div>
              <div className="grid gap-4">
                <label className="admin-login-field">
                  <span className="admin-login-label">Notification Title</span>
                  <input value={appControlForm.notificationTitle} onChange={(e) => updateAppControlForm('notificationTitle', e.target.value)} />
                </label>
                <label className="admin-login-field">
                  <span className="admin-login-label">Notification Body</span>
                  <textarea value={appControlForm.notificationBody} onChange={(e) => updateAppControlForm('notificationBody', e.target.value)} />
                </label>
                <div className="admin-student-code">
                  <span>Last Broadcast</span>
                  <b>{appControlForm.notificationSentAt ? new Date(appControlForm.notificationSentAt).toLocaleString() : 'No notification sent yet'}</b>
                </div>
              </div>
            </div>

            <div className="admin-control-center">
              <div className="admin-control-center-head">
                <div>
                  <h2>Quick Controls</h2>
                  <span>Same surface as /superadmin, opened directly from /appcontrol.</span>
                </div>
              </div>
              <div className="admin-chip-row">
                {[
                  ['slider', 'Homepage Slider'],
                  ['course', 'Courses'],
                  ['access', 'Premium Access'],
                  ['live', 'Live Classes'],
                  ['user', 'Users'],
                  ['push-notification', 'Push Console'],
                ].map(([tab, label]) => (
                  <button key={tab} type="button" className="admin-chip" onClick={() => setActiveTab(tab as AdminPanelTab)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="admin-priority-strip">
            <div>
              <p className="admin-control-eyebrow">Today</p>
              <h2>Priority overview</h2>
            </div>
            <div className="admin-priority-items">
              {dashboardPriorityItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openAdminTab(item.tab)}
                  className={`admin-priority-item admin-priority-item--${item.tone}`}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-reference-kpis">
            {dashboardStats.map((item) => (
              <div key={item.label} className={`admin-reference-kpi admin-reference-kpi--${item.tone}`}>
                <div className="admin-reference-kpi-top">
                  <div className="admin-reference-kpi-label">{item.label}</div>
                  <span>{item.icon}</span>
                </div>
                <div className="admin-reference-kpi-value">{item.value}</div>
                <div className="admin-reference-kpi-note">{item.note}</div>
              </div>
            ))}
          </div>

          <div className="admin-overview-grid">
            <div className="admin-insight-panel">
              <div className="admin-reference-panel-head">
                <div>
                  <p className="admin-control-eyebrow">Overview Insights</p>
                  <h3>What needs attention</h3>
                </div>
                <button type="button" onClick={onRefresh}>Refresh</button>
              </div>
              <div className="admin-insight-grid">
                {adminInsights.map((insight) => (
                  <button
                    key={insight.title}
                    type="button"
                    onClick={() => openAdminTab(insight.tab)}
                    className={`admin-insight-card admin-insight-card--${insight.tone}`}
                  >
                    <span>
                      <strong>{insight.title}</strong>
                      <em>{insight.detail}</em>
                    </span>
                    <b>{insight.value}</b>
                    <small>{insight.action}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-activity-panel">
              <div className="admin-reference-panel-head">
                <div>
                  <p className="admin-control-eyebrow">Content Mix</p>
                  <h3>Publishing balance</h3>
                </div>
                <span
                  className="admin-health-ring"
                  style={{ '--score': contentHealthScore } as React.CSSProperties}
                >
                  {contentHealthScore}%
                </span>
              </div>
              <div className="admin-metric-bars">
                {overviewMetrics.map((metric) => (
                  <div key={metric.label} className="admin-metric-bar-row">
                    <div>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                    <i>
                      <b
                        className={`admin-metric-fill admin-metric-fill--${metric.tone}`}
                        style={{ width: `${Math.max(8, Math.round((metric.value / metric.max) * 100))}%` }}
                      />
                    </i>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-control-center">
            <div className="admin-control-center-head">
              <div>
                <p className="admin-control-eyebrow">Single Admin Control</p>
                <h2>Manage everything from one page</h2>
                <span>Courses, videos, notes, quizzes, students, sliders, and premium access stay one click away.</span>
              </div>
              <button type="button" onClick={onRefresh} className="admin-control-refresh">
                <ShieldCheck size={18} />
                Refresh Data
              </button>
            </div>

            <div className="admin-control-grid">
              {filteredAdminControlCards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openAdminTab(item.id)}
                  className={`admin-control-card admin-control-card--${item.tone}`}
                >
                  <span className="admin-control-icon">{item.icon}</span>
                  <span className="admin-control-copy">
                    <strong>{item.title}</strong>
                    <em>{item.description}</em>
                  </span>
                  <span className="admin-control-count">{item.count}</span>
                  <ChevronRight size={18} className="admin-control-arrow" />
                </button>
              ))}
              {!filteredAdminControlCards.length && (
                <div className="admin-empty-control">
                  No admin tool matched "{adminSearchQuery}". Try course, access, quiz, notes, push, or students.
                </div>
              )}
            </div>
          </div>

          <div className="admin-live-grid">
            <div className="admin-reference-panel">
              <div className="admin-reference-panel-head">
                <h3>Premium Course Status</h3>
                <button type="button" onClick={() => setActiveTab('course')}>Manage</button>
              </div>
              <div className="admin-clean-list">
                {courses.slice(0, 5).map((course) => (
                  <button key={course.id} type="button" onClick={() => setActiveTab('course')} className="admin-clean-row">
                    <img src={course.image} alt={course.title} referrerPolicy="no-referrer" />
                    <span>
                      <strong>{course.title}</strong>
                      <em>{course.lessons} lessons • Rs {course.price || 0}</em>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
                {!courses.length && <div className="admin-soft-panel px-4 py-5 text-sm text-slate-500">No courses yet. Add your first premium course.</div>}
              </div>
            </div>

            <div className="admin-reference-panel">
              <div className="admin-reference-panel-head">
                <h3>Access & Students</h3>
                <button type="button" onClick={() => setActiveTab('access')}>Grant Access</button>
              </div>
              <div className="admin-access-snapshot">
                <div>
                  <span>Registered Students</span>
                  <strong>{users.length}</strong>
                </div>
                <div>
                  <span>Premium Courses</span>
                  <strong>{premiumCourseCount}</strong>
                </div>
                <div>
                  <span>Active Sliders</span>
                  <strong>{activeSliderCount}</strong>
                </div>
              </div>
              <div className="admin-reference-messages">
                {adminMessages.map((messageItem) => (
                  <div key={messageItem} className="admin-reference-message">
                    <div className="admin-reference-message-icon">
                      <MessageSquare size={18} />
                    </div>
                    <p>{messageItem}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="superadmin-console">
              <div className="superadmin-head">
                <div>
                  <p className="admin-control-eyebrow">Super Admin</p>
                  <h2>Admin access control</h2>
                  <span>Create, review, and remove dashboard login accounts from one clean workspace.</span>
                </div>
                <div className="superadmin-badge">
                  <ShieldCheck size={16} />
                  Protected Area
                </div>
              </div>

              <div className="superadmin-summary">
                <div>
                  <span>Total Accounts</span>
                  <strong>{adminAccounts.length}</strong>
                </div>
                <div>
                  <span>Super Admins</span>
                  <strong>{adminAccounts.filter((account) => account.role === 'superadmin').length}</strong>
                </div>
                <div>
                  <span>Standard Admins</span>
                  <strong>{adminAccounts.filter((account) => account.role !== 'superadmin').length}</strong>
                </div>
              </div>

              <div className="grid xl:grid-cols-[0.92fr_1.08fr] gap-5">
                <div className="superadmin-create-card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Create Admin</h3>
                      <p>New credentials are saved to the academy database.</p>
                    </div>
                    <span className="superadmin-role-pill">Admin</span>
                  </div>
                  <div className="superadmin-form">
                    <label>
                      <span>Username</span>
                      <div className="superadmin-input-wrap">
                        <User size={18} />
                        <input
                          placeholder="Admin username"
                          value={adminAccountForm.username}
                          onChange={(e) => setAdminAccountForm((current) => ({ ...current, username: e.target.value }))}
                        />
                      </div>
                    </label>
                    <label>
                      <span>Password</span>
                      <div className="superadmin-input-wrap">
                        <Lock size={18} />
                        <input
                          type="password"
                          placeholder="Admin password"
                          value={adminAccountForm.password}
                          onChange={(e) => setAdminAccountForm((current) => ({ ...current, password: e.target.value }))}
                        />
                      </div>
                    </label>
                    <button type="button" onClick={handleCreateAdminAccount} disabled={loading} className="admin-primary-button superadmin-save-button">
                      <CheckCircle2 size={18} />
                      {loading ? 'Saving...' : 'Save Admin'}
                    </button>
                  </div>
                </div>

                <div className="superadmin-list-card">
                  <div className="admin-section-head">
                    <div>
                      <h3>Manage Admin Accounts</h3>
                      <p>Accounts listed here can access the admin dashboard.</p>
                    </div>
                    <span className="superadmin-count-pill">{adminAccounts.length} admins</span>
                  </div>
                  <div className="superadmin-account-list">
                    {adminAccounts.map((account) => {
                      const isProtectedAccount = account.role === 'superadmin';
                      return (
                        <div key={account.id} className={`superadmin-account-row ${isProtectedAccount ? 'is-protected' : ''}`}>
                          <div className="superadmin-account-avatar">
                            {(account.username || 'A').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="superadmin-account-copy">
                            <strong>{account.username}</strong>
                            <span>{isProtectedAccount ? 'Full dashboard and account control' : 'Dashboard management access'}</span>
                          </div>
                          <div className={`superadmin-role-chip ${isProtectedAccount ? 'is-super' : ''}`}>
                            {isProtectedAccount ? 'Super Admin' : 'Admin'}
                          </div>
                          <button
                            type="button"
                            onClick={() => confirmDelete(
                              'Delete admin account?',
                              `This will remove ${account.username} from admin access.`,
                              () => handleDeleteAdminAccount(account.id)
                            )}
                            className="superadmin-delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                    {!adminAccounts.length && (
                      <div className="admin-empty-control">No admin accounts found. Create the first admin login here.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="hidden">
            <div className="admin-card p-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <h3 className="text-2xl font-black text-slate-900">Manage Courses</h3>
                <button onClick={() => setActiveTab('course')} className="admin-primary-button px-4 py-2 text-sm font-bold">
                  + Add Course
                </button>
              </div>
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => (
                  <div key={course.id} className="admin-list-card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={course.image} alt={course.title} className="w-28 h-16 object-cover" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-slate-900 truncate">{course.title}</div>
                        <div className="text-sm text-slate-500 mt-1">{course.category} • {course.type} • {course.lessons} lessons</div>
                      </div>
                    </div>
                    <button onClick={() => {
                      setActiveTab('course');
                      setEditingCourseId(course.id);
                      setCourseForm({
                        title: course.title,
                        description: course.description || '',
                        lessons: String(course.lessons || 0),
                        image: course.image,
                        price: String(course.price || 0),
                        oldPrice: String(course.oldPrice || 0),
                        type: course.type,
                        category: course.category,
                      });
                      setCourseThumbnailFile(null);
                    }} className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-bold">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="admin-card p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                  <h3 className="text-2xl font-black text-slate-900">Quiz Activity</h3>
                  <button onClick={() => setActiveTab('quiz')} className="admin-primary-button px-4 py-2 text-sm font-bold">
                    + Create Quiz
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="admin-soft-panel p-4">
                    <div className="text-sm text-slate-500 mb-1">Quizzes</div>
                    <div className="text-3xl font-black text-slate-900">{quizzes.length}</div>
                  </div>
                  <div className="admin-soft-panel p-4">
                    <div className="text-sm text-slate-500 mb-1">Questions</div>
                    <div className="text-3xl font-black text-slate-900">{questions.length}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="admin-list-card p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900">{quiz.topic}</div>
                        <div className="text-sm text-slate-500 mt-1">{quiz.questions.length} questions</div>
                      </div>
                      <button onClick={() => {
                        setQuestionForm((current) => ({ ...current, quiz_id: quiz.id }));
                        setQuestionImportQuizId(quiz.id);
                        setActiveTab('quiz');
                      }} className="text-sm font-bold text-primary">
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card p-5">
                <h3 className="text-2xl font-black text-slate-900 mb-5">Publishing Snapshot</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Active sliders</span>
                    <span className="font-black text-slate-900">{sliders.filter((slider) => slider.is_active).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Free notes published</span>
                    <span className="font-black text-slate-900">{notes.filter((note) => (note.type || 'free') === 'free').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Premium courses</span>
                    <span className="font-black text-slate-900">{courses.filter((course) => !isCourseFree(course)).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Video lessons</span>
                    <span className="font-black text-slate-900">{lessons.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'push-notification' && (
        <div className="admin-push-workspace">
          <div className="admin-push-head">
            <div>
              <p className="admin-control-eyebrow">Push Notification</p>
              <h2>Send app notifications from the control panel</h2>
              <span>Broadcast to all students, premium students, free users, or one selected student.</span>
            </div>
            <div className="admin-push-badge">
              <Bell size={18} />
              Control Panel
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className={cardClass}>
              <div className="grid gap-4">
                <label className="admin-login-field">
                  <span className="admin-login-label">Title</span>
                  <input
                    value={pushForm.title}
                    onChange={(event) => setPushForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Monto"
                  />
                </label>
                <label className="admin-login-field">
                  <span className="admin-login-label">Message</span>
                  <textarea
                    value={pushForm.body}
                    onChange={(event) => setPushForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Write notification message"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="admin-login-field">
                    <span className="admin-login-label">Audience</span>
                    <select
                      value={pushForm.audience}
                      onChange={(event) => setPushForm((current) => ({ ...current, audience: event.target.value as typeof current.audience }))}
                    >
                      <option value="all">All students</option>
                      <option value="premium">Premium students</option>
                      <option value="free">Free students</option>
                      <option value="selected">Selected student</option>
                    </select>
                  </label>
                  <label className="admin-login-field">
                    <span className="admin-login-label">Open Screen</span>
                    <select
                      value={pushForm.screen}
                      onChange={(event) => setPushForm((current) => ({ ...current, screen: event.target.value }))}
                    >
                      <option value="home">Home</option>
                      <option value="courses">Courses</option>
                      <option value="my-courses">My Courses</option>
                      <option value="live-classes">Live Classes</option>
                      <option value="notes">Notes</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </label>
                </div>
                {pushForm.audience === 'selected' && (
                  <label className="admin-login-field">
                    <span className="admin-login-label">Student</span>
                    <select
                      value={pushForm.userId}
                      onChange={(event) => setPushForm((current) => ({ ...current, userId: event.target.value }))}
                    >
                      <option value="">Select student</option>
                      {users.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name || student.email} - {student.email || student.id}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  disabled={loading || !pushForm.title.trim() || !pushForm.body.trim()}
                  className="admin-primary-button py-3"
                  onClick={sendPushNotificationFromPanel}
                >
                  {loading ? 'Sending...' : 'Send Push Notification'}
                </button>
              </div>
            </div>

            <div className={cardClass}>
              <div className="admin-control-center-head">
                <div>
                  <h2>Delivery Status</h2>
                  <span>Students must allow notifications once from Settings.</span>
                </div>
              </div>
              <div className="admin-student-code">
                <span>Registered Students</span>
                <b>{users.length.toLocaleString()}</b>
              </div>
              <div className="admin-student-code mt-3">
                <span>Last Push</span>
                <b>{appControlForm.notificationSentAt ? new Date(appControlForm.notificationSentAt).toLocaleString() : 'Not sent yet'}</b>
              </div>
              <div className="admin-student-code mt-3">
                <span>Current Payload</span>
                <b>{JSON.stringify({ title: pushForm.title, body: pushForm.body, data: { screen: pushForm.screen } })}</b>
              </div>
              <button type="button" className="admin-secondary-button mt-4 w-full py-3" onClick={() => openExternalResource('https://console.firebase.google.com/')}>
                Open Firebase Console
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-800">Notification Panel</h3>
                <p className="text-xs text-gray-500 mt-1">All sent push and app-broadcast notifications are listed here.</p>
              </div>
              <button
                type="button"
                className="admin-secondary-button px-4 py-2 text-xs font-black"
                onClick={fetchNotificationHistory}
                disabled={notificationHistoryLoading}
              >
                {notificationHistoryLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="space-y-3">
              {notificationHistory.length ? notificationHistory.map((item) => (
                <div key={item.id} className="admin-list-card p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase text-primary">
                          {item.audience || 'all'}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-black text-gray-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-5 text-gray-600">{item.body}</p>
                    </div>
                    <div className="grid min-w-[180px] grid-cols-3 gap-2 text-center text-xs">
                      <span className="rounded-xl bg-slate-50 px-2 py-2 font-bold text-slate-600">
                        Total<br /><b className="text-slate-900">{item.totalDevices}</b>
                      </span>
                      <span className="rounded-xl bg-green-50 px-2 py-2 font-bold text-green-700">
                        Sent<br /><b>{item.sent}</b>
                      </span>
                      <span className="rounded-xl bg-rose-50 px-2 py-2 font-bold text-rose-700">
                        Failed<br /><b>{item.failed}</b>
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1">Screen: {item.screen || 'home'}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      {item.credentialMissing ? 'App broadcast fallback' : 'Firebase push'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm font-bold text-gray-500">
                  No notifications sent yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slider' && (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{editingSliderId ? 'Edit Slider' : 'Create Slider'}</h3>
                <p className="text-xs text-gray-500 mt-1">Upload image here. It will be optimized and served from Cloudinary CDN on the home slider.</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-primary">
                Cloudinary CDN
              </div>
            </div>
            <div className="space-y-3">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Slider title" value={sliderForm.title} onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })} />
              <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Slider subtitle" value={sliderForm.subtitle} onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Existing image URL (optional)" value={sliderForm.image_url} onChange={(e) => setSliderForm({ ...sliderForm, image_url: e.target.value })} />
              {sliderPreviewUrl && (
                <div className="border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Preview</div>
                  <img src={sliderPreviewUrl} alt="Slider preview" className="w-full h-44 object-cover bg-white" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Sort order" value={sliderForm.sort_order} onChange={(e) => setSliderForm({ ...sliderForm, sort_order: e.target.value })} />
                <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                  Active on homepage
                  <input type="checkbox" checked={sliderForm.is_active} onChange={(e) => setSliderForm({ ...sliderForm, is_active: e.target.checked })} />
                </label>
              </div>
              <label className="admin-slider-upload-box">
                <span className="admin-slider-upload-title">Slider image</span>
                <span className="admin-slider-upload-button">
                  <Upload size={18} />
                  Upload slider image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setSliderImageFile(null);
                      return;
                    }

                    if (!file.type.startsWith('image/')) {
                      setMessage('Please choose a valid image file');
                      e.target.value = '';
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setMessage('Slider image must be 5 MB or smaller');
                      e.target.value = '';
                      return;
                    }

                    setMessage('');
                    setSliderImageFile(file);
                  }}
                  className="sr-only"
                />
                <span className="block mt-2 text-xs">{sliderImageFile ? `${sliderImageFile.name} • ${(sliderImageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Choose JPG, PNG, WEBP, or GIF up to 5 MB'}</span>
              </label>
              <button
                disabled={loading || uploadingSlider}
                onClick={submitSlider}
                className="admin-slider-save-button w-full py-3 font-bold"
              >
                {loading || uploadingSlider ? 'Uploading...' : editingSliderId ? 'Update Slider' : 'Upload & Save Slider'}
              </button>
              {editingSliderId && (
                <button
                  onClick={() => {
                    setEditingSliderId('');
                    setSliderImageFile(null);
                    setSliderPreviewUrl('');
                    setSliderForm({ title: '', subtitle: '', image_url: '', sort_order: '0', is_active: true });
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">Manage Homepage Sliders</h3>
            <div className="space-y-3">
              {sliders.length ? [...sliders].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((slider) => (
                <div key={slider.id} className="admin-list-card p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <SmartImage
                      src={slider.image_url}
                      alt={slider.title}
                      className="w-28 h-20 rounded-2xl object-cover bg-gray-100"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-base text-gray-800 truncate">{slider.title}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">{slider.subtitle}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                        <span>Order {slider.sort_order}</span>
                        <span className={`rounded-full px-2 py-1 font-bold ${slider.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {slider.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <span className={`rounded-full px-2 py-1 font-bold ${slider.image_url.includes('res.cloudinary.com') ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {slider.image_url.includes('res.cloudinary.com') ? 'Cloudinary' : 'External URL'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSliderId(slider.id);
                        setSliderImageFile(null);
                        setSliderForm({
                          title: slider.title,
                          subtitle: slider.subtitle,
                          image_url: slider.image_url,
                          sort_order: String(slider.sort_order || 0),
                          is_active: slider.is_active,
                        });
                        setMessage('');
                      }}
                      className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(
                        'Delete slider?',
                        `This will remove "${slider.title}" from the homepage slider.`,
                        () => submitAction('deleteSlider', { id: slider.id }, () => {})
                      )}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                  No sliders found yet. Add the first homepage banner from this tab.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'course' || activeTab === 'free-course' || activeTab === 'lesson') && (
        <div className="space-y-4">
          <div className="admin-course-builder">
            <div className="admin-course-form-panel">
              <div className="admin-section-head">
                <div>
                  <p className="admin-control-eyebrow">Course Builder</p>
                  <h3 className="font-black text-slate-900">{editingCourseId ? 'Edit Course' : 'Create Free or Premium Course'}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Free courses open instantly. Premium courses stay locked until access is granted.
                  </p>
                </div>
                <div className="admin-course-status-pill">
                  {courseForm.type === 'premium' ? <ShieldCheck size={15} /> : <BookOpen size={15} />}
                  {courseForm.type === 'premium' ? 'Premium Locked' : 'Free Open'}
                </div>
              </div>

              <div className="admin-course-field-grid">
                <label className="admin-course-field">
                  <span>Course type</span>
                  <select
                    value={courseForm.type}
                    onChange={(e) => {
                      const nextType = e.target.value === 'premium' ? 'premium' : 'free';
                      setCourseForm({
                        ...courseForm,
                        type: nextType,
                        price: nextType === 'free' ? '0' : courseForm.price === '0' ? '999' : courseForm.price,
                        oldPrice: nextType === 'free' ? '0' : courseForm.oldPrice === '0' ? '2999' : courseForm.oldPrice,
                      });
                    }}
                  >
                    <option value="free">Free Course</option>
                    <option value="premium">Premium Course</option>
                  </select>
                </label>
                <label className="admin-course-field">
                  <span>Category</span>
                  <input placeholder="General" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
                </label>
                <label className="admin-course-field admin-course-field--wide">
                  <span>Course title</span>
                  <input placeholder="Example: Complete Course Batch" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                </label>
                <label className="admin-course-field admin-course-field--wide">
                  <span>About this course</span>
                  <textarea
                    placeholder="Write what students will learn in this course..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="min-h-24 resize-y"
                  />
                </label>
                <label className="admin-course-field admin-course-field--wide">
                  <span>Thumbnail image URL</span>
                  <input placeholder="https://example.com/course-thumbnail.jpg" value={courseForm.image} onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })} />
                </label>
                <label className="admin-course-field admin-course-field--wide admin-slider-upload-box">
                  <span className="admin-slider-upload-title">Upload course thumbnail</span>
                  <span className="admin-slider-upload-button">
                    <Upload size={18} />
                    Upload thumbnail image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (!file) {
                        setCourseThumbnailFile(null);
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        setMessage('Please choose a valid course thumbnail image');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setMessage('Course thumbnail must be 5 MB or smaller');
                        e.target.value = '';
                        return;
                      }
                      setMessage('');
                      setCourseThumbnailFile(file);
                    }}
                    className="sr-only"
                  />
                  <span className="admin-slider-upload-hint">
                    {courseThumbnailFile ? `${courseThumbnailFile.name} • ${(courseThumbnailFile.size / 1024 / 1024).toFixed(2)} MB` : 'Paste URL above or upload JPG, PNG, WEBP, GIF'}
                  </span>
                </label>
                <label className="admin-course-field">
                  <span>Lesson count</span>
                  <input inputMode="numeric" placeholder="0" value={courseForm.lessons} onChange={(e) => setCourseForm({ ...courseForm, lessons: e.target.value.replace(/[^\d]/g, '') })} />
                </label>
                <label className="admin-course-field">
                  <span>Current price</span>
                  <input inputMode="numeric" placeholder="0" value={courseForm.price} disabled={courseForm.type === 'free'} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value.replace(/[^\d]/g, '') })} />
                </label>
                <label className="admin-course-field">
                  <span>Old price</span>
                  <input inputMode="numeric" placeholder="0" value={courseForm.oldPrice} disabled={courseForm.type === 'free'} onChange={(e) => setCourseForm({ ...courseForm, oldPrice: e.target.value.replace(/[^\d]/g, '') })} />
                </label>
              </div>

              <div className="admin-course-note">
                {courseForm.type === 'premium' ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                {courseForm.type === 'premium'
                  ? 'Premium access codes are generated per student from the Premium Access section.'
                  : 'Free courses appear for students without any access code.'}
              </div>

              <div className="admin-course-actions">
                <button disabled={loading} onClick={submitCourseForm} className="admin-primary-button px-5 py-3 text-sm font-bold">
                  {loading ? 'Saving...' : editingCourseId ? 'Update Course' : 'Create Course'}
                </button>
                <button onClick={resetCourseForm} className="admin-secondary-button px-5 py-3 text-sm font-bold">
                  {editingCourseId ? 'Cancel Edit' : 'Clear'}
                </button>
              </div>
            </div>

            <div className="admin-course-preview-panel">
              <div className="admin-course-preview-media">
                {courseThumbnailPreviewUrl.trim() ? (
                  <img src={courseThumbnailPreviewUrl.trim()} alt={courseForm.title || 'Course preview'} referrerPolicy="no-referrer" />
                ) : (
                  <div className="admin-course-preview-placeholder">
                    <BookOpen size={30} />
                    <span>Image preview</span>
                  </div>
                )}
                <div className="admin-course-preview-badge">{courseForm.type === 'premium' ? 'Premium' : 'Free'}</div>
              </div>
              <div className="admin-course-preview-body">
                <h3>{courseForm.title.trim() || 'Course title preview'}</h3>
                <p>{courseForm.category.trim() || 'General'} - {Number(courseForm.lessons || 0)} lessons</p>
                <div className="admin-course-preview-price">
                  {courseForm.type === 'premium' ? (
                    <>
                      <strong>Rs {Number(courseForm.price || 0).toLocaleString()}</strong>
                      <span>Rs {Number(courseForm.oldPrice || 0).toLocaleString()}</span>
                    </>
                  ) : (
                    <strong>Free</strong>
                  )}
                </div>
                <div className="admin-course-preview-checks">
                  <span className={courseForm.title.trim() ? 'is-ready' : ''}>Title</span>
                  <span className={courseThumbnailFile || /^https?:\/\//i.test(courseForm.image.trim()) ? 'is-ready' : ''}>Image</span>
                  <span className={courseForm.type === 'free' || Number(courseForm.price || 0) > 0 ? 'is-ready' : ''}>{courseForm.type === 'premium' ? 'Price' : 'Free Access'}</span>
                  <span className={courseForm.category.trim() ? 'is-ready' : ''}>Category</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-course-workspace">
              <div className="admin-course-workspace-head">
                <div>
                  <p className="admin-control-eyebrow">Selected Course Workspace</p>
                  <h3>Videos and MCQs in one place</h3>
                  <span>Choose any course, add ordered videos, edit lessons, and attach MCQ questions without leaving the builder.</span>
                </div>
                <select
                  value={managedCourse?.id || ''}
                  onChange={(event) => {
                    const courseId = event.target.value;
                    setSelectedManagedCourseId(courseId);
                    setLessonForm((current) => ({ ...current, course_id: courseId, sort_order: '1' }));
                    setPlaylistImportForm((current) => ({ ...current, course_id: courseId }));
                    setCourseQuizForm({ quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '' });
                  }}
                >
                  <option value="">Choose course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              {managedCourse ? (
                <div className="admin-course-workspace-grid">
                  <div className="admin-course-workspace-panel">
                    <div className="admin-course-workspace-title">
                      <Play size={20} />
                      <div>
                        <strong>Add videos to {managedCourse.title}</strong>
                        <span>{managedCourseLessons.length} videos added</span>
                      </div>
                    </div>
                    <div className="admin-video-custom-control mb-4">
                      <div className="admin-course-workspace-title">
                        <Play size={18} />
                        <div>
                          <strong>Import YouTube playlist</strong>
                          <span>Paste a public playlist link. All videos will become ordered lessons in this course.</span>
                        </div>
                      </div>
                      <input
                        value={playlistImportForm.course_id === managedCourse.id ? playlistImportForm.playlist_url : ''}
                        onChange={(event) => setPlaylistImportForm({ ...playlistImportForm, course_id: managedCourse.id, playlist_url: event.target.value })}
                        placeholder="https://www.youtube.com/playlist?list=..."
                      />
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <input
                          inputMode="numeric"
                          value={playlistImportForm.course_id === managedCourse.id ? playlistImportForm.start_order : ''}
                          onChange={(event) => setPlaylistImportForm({ ...playlistImportForm, course_id: managedCourse.id, start_order: event.target.value.replace(/[^\d]/g, '') })}
                          placeholder={`Start order optional, next is ${managedCourseLessons.length + 1}`}
                        />
                        <button
                          type="button"
                          disabled={loading}
                          onClick={submitPlaylistImport}
                          className="admin-secondary-button px-5 py-3 text-sm font-bold"
                        >
                          {loading ? 'Importing...' : 'Import Playlist'}
                        </button>
                      </div>
                    </div>
                    <div className="admin-course-mini-form">
                      <input
                        value={lessonForm.course_id === managedCourse.id ? lessonForm.title : ''}
                        onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, title: event.target.value })}
                        placeholder="Video title"
                      />
                      <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                        <input
                          value={lessonForm.course_id === managedCourse.id ? lessonForm.duration : ''}
                          onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, duration: event.target.value })}
                          placeholder="Duration e.g. 18:20"
                        />
                        <input
                          inputMode="numeric"
                          value={lessonForm.course_id === managedCourse.id ? lessonForm.sort_order : String(managedCourseLessons.length + 1)}
                          onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, sort_order: event.target.value.replace(/[^\d]/g, '') })}
                          placeholder="Order"
                        />
                      </div>
                      <input
                        value={lessonForm.course_id === managedCourse.id ? lessonForm.video_url : ''}
                        onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, video_url: event.target.value })}
                        placeholder="YouTube URL"
                      />
                      <input
                        value={lessonForm.course_id === managedCourse.id ? lessonForm.thumbnail_url : ''}
                        onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, thumbnail_url: event.target.value })}
                        placeholder="Video thumbnail URL optional"
                      />
                      <div className="admin-video-custom-control">
                        <div className="admin-course-workspace-title">
                          <Download size={18} />
                          <div>
                            <strong>Secure download section</strong>
                            <span>Add your own downloadable file/resource URL for this lesson. YouTube links stay embedded and protected.</span>
                          </div>
                        </div>
                        <input
                          value={lessonForm.course_id === managedCourse.id ? lessonForm.download_label : ''}
                          onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, download_label: event.target.value })}
                          placeholder="Download button label e.g. Download lesson video"
                        />
                        <input
                          value={lessonForm.course_id === managedCourse.id ? lessonForm.download_url : ''}
                          onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, download_url: event.target.value })}
                          placeholder="Secure download/resource URL optional"
                        />
                        <button
                          type="button"
                          className={`admin-video-toggle ${lessonForm.download_enabled ? 'is-on' : ''}`}
                          onClick={() => setLessonForm({ ...lessonForm, course_id: managedCourse.id, download_enabled: !lessonForm.download_enabled })}
                        >
                          <span>{lessonForm.download_enabled ? 'Download section on' : 'Download section off'}</span>
                          <i />
                        </button>
                      </div>
                      <label className="admin-slider-upload-box">
                        <span className="admin-slider-upload-title">Video thumbnail</span>
                        <span className="admin-slider-upload-button">
                          <Upload size={18} />
                          Upload video thumbnail
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            if (!file) {
                              setLessonThumbnailFile(null);
                              return;
                            }
                            if (!file.type.startsWith('image/')) {
                              setMessage('Please choose a valid video thumbnail image');
                              event.target.value = '';
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setMessage('Video thumbnail must be 5 MB or smaller');
                              event.target.value = '';
                              return;
                            }
                            setMessage('');
                            setLessonThumbnailFile(file);
                          }}
                          className="sr-only"
                        />
                        <span className="admin-slider-upload-hint">
                          {lessonThumbnailFile ? `${lessonThumbnailFile.name} • ${(lessonThumbnailFile.size / 1024 / 1024).toFixed(2)} MB` : 'Paste URL above or upload JPG, PNG, WEBP, GIF'}
                        </span>
                      </label>
                      <input
                        value={lessonForm.course_id === managedCourse.id ? lessonForm.note_url : ''}
                        onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, note_url: event.target.value })}
                        placeholder="Full-screen HTML/website URL optional"
                      />
                      <textarea
                        value={lessonForm.course_id === managedCourse.id ? lessonForm.note_content : ''}
                        onChange={(event) => setLessonForm({ ...lessonForm, course_id: managedCourse.id, note_content: event.target.value })}
                        placeholder="Paste full HTML code optional"
                      />
                      <button type="button" onClick={submitLessonForm} className="admin-primary-button px-5 py-3 text-sm font-bold">
                        {editingLessonId ? 'Update Video' : 'Add Video'}
                      </button>
                    </div>

                    <div className="admin-course-video-list">
                      {managedCourseLessons.map((lesson, index) => (
                        <div key={lesson.id} className="admin-course-video-row">
                          {lesson.thumbnail_url ? (
                            <img src={lesson.thumbnail_url} alt={lesson.title} className="h-12 w-16 rounded-xl object-cover bg-slate-100" referrerPolicy="no-referrer" />
                          ) : (
                            <b>{Number(lesson.sort_order || index + 1)}</b>
                          )}
                          <span>
                            <strong>{lesson.title}</strong>
                            <em>{lesson.duration || 'No duration'} • {lesson.video_url ? 'Video ready' : 'Missing URL'}</em>
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => submitAction('updateLesson', { ...lesson, sort_order: Math.max(1, Number(lesson.sort_order || index + 1) - 1) }, () => {})}
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => submitAction('updateLesson', { ...lesson, sort_order: Number(lesson.sort_order || index + 1) + 1 }, () => {})}
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLessonId(lesson.id);
                                setLessonForm({
                                  course_id: lesson.course_id,
                                  title: lesson.title,
                                  duration: lesson.duration,
                                  note_content: lesson.note_content,
                                  note_url: lesson.note_url || '',
                                  video_url: lesson.video_url || '',
                                  thumbnail_url: lesson.thumbnail_url || '',
                                  download_url: lesson.download_url || '',
                                  download_label: lesson.download_label || '',
                                  download_enabled: lesson.download_enabled !== false,
                                  sort_order: String(lesson.sort_order || index + 1),
                                });
                                setLessonThumbnailFile(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => confirmDelete('Delete video?', `This will delete "${lesson.title}".`, () => submitAction('deleteLesson', { id: lesson.id }, () => {}))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {!managedCourseLessons.length && (
                        <div className="admin-empty-control">No videos yet. Add the first ordered video for this paid course.</div>
                      )}
                    </div>
                  </div>

                  <div className="admin-course-workspace-panel">
                    <div className="admin-course-workspace-title">
                      <HelpCircle size={20} />
                      <div>
                        <strong>Course MCQs</strong>
                        <span>{managedCourseQuestions.length} questions linked</span>
                      </div>
                    </div>
                    <div className="admin-course-mini-form">
                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <select
                          value={courseQuizForm.quiz_id || managedCourseQuiz?.id || ''}
                          onChange={(event) => setCourseQuizForm({ ...courseQuizForm, quiz_id: event.target.value })}
                        >
                          <option value="">Choose MCQ quiz</option>
                          {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>{quiz.topic}</option>
                          ))}
                        </select>
                        <button type="button" onClick={handleCreateManagedCourseQuiz} className="admin-secondary-button px-4 py-3 text-sm font-bold">
                          Create Quiz
                        </button>
                      </div>
                      <textarea
                        value={courseQuizForm.text}
                        onChange={(event) => setCourseQuizForm({ ...courseQuizForm, text: event.target.value })}
                        placeholder="MCQ question text"
                      />
                      <textarea
                        value={courseQuizForm.optionsText}
                        onChange={(event) => setCourseQuizForm({ ...courseQuizForm, optionsText: event.target.value })}
                        placeholder={'Options, one per line\nOption A\nOption B\nOption C\nOption D'}
                      />
                      <input
                        inputMode="numeric"
                        value={courseQuizForm.correctAnswer}
                        onChange={(event) => setCourseQuizForm({ ...courseQuizForm, correctAnswer: event.target.value.replace(/[^\d]/g, '') })}
                        placeholder="Correct answer index, e.g. 0"
                      />
                      <textarea
                        value={courseQuizForm.explanation}
                        onChange={(event) => setCourseQuizForm({ ...courseQuizForm, explanation: event.target.value })}
                        placeholder="Explanation"
                      />
                      <button type="button" onClick={submitManagedCourseQuestion} className="admin-primary-button px-5 py-3 text-sm font-bold">
                        Add MCQ
                      </button>
                    </div>
                    <div className="admin-course-mcq-list">
                      {managedCourseQuestions.slice(0, 8).map((question, index) => (
                        <div key={question.id} className="admin-course-mcq-row">
                          <b>{index + 1}</b>
                          <span>{question.text}</span>
                        </div>
                      ))}
                      {!managedCourseQuestions.length && (
                        <div className="admin-empty-control">No MCQs yet. Create or choose a quiz, then add questions here.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-empty-control">No courses available yet. Create a course first, then add videos and MCQs here.</div>
              )}
            </div>

          <div className={cardClass}>
            <div className="admin-section-head">
              <div>
                <h3 className="font-bold text-gray-800">Manage Courses</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Edit free and premium courses, thumbnails, lesson counts, pricing, and jump straight into the builder workspace.
                </p>
              </div>
              <div className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                {displayedCourses.length} courses
              </div>
            </div>
            <div className="admin-course-list">
              {displayedCourses.map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-gray-800">{course.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{course.category} • {course.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingCourseId(course.id);
                        setCourseForm({
                          title: course.title,
                          description: course.description || '',
                          lessons: String(course.lessons || 0),
                          image: course.image,
                          price: String(course.price || 0),
                          oldPrice: String(course.oldPrice || 0),
                          type: course.type,
                          category: course.category,
                        });
                        setCourseThumbnailFile(null);
                        if (!isCourseFree(course)) {
                          setSelectedManagedCourseId(course.id);
                          setLessonForm((current) => ({ ...current, course_id: course.id, sort_order: String((course.lessonList?.length || 0) + 1) }));
                        }
                        setActiveTab('course');
                      }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                      <button onClick={() => confirmDelete(
                        'Delete course?',
                        `This will delete "${course.title}" and its related lessons/access records.`,
                        () => submitAction('deleteCourse', { id: course.id }, () => {})
                      )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {!displayedCourses.length && (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                  No courses found yet. Add your first course above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lesson' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <div className="admin-section-head">
            <div>
              <p className="admin-control-eyebrow">YouTube Lessons</p>
              <h3 className="font-bold text-gray-800">{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <p className="text-xs text-gray-500 mt-1">Paste YouTube watch, short, or embed links. The app saves them in embedded format automatically.</p>
            </div>
            <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700">
              YouTube Video
            </div>
          </div>
          <div className="space-y-3">
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={lessonForm.course_id} onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Duration e.g. 20:15" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" inputMode="numeric" placeholder="Video order e.g. 1" value={lessonForm.sort_order} onChange={(e) => setLessonForm({ ...lessonForm, sort_order: e.target.value.replace(/[^\d]/g, '') })} />
            </div>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="YouTube URL e.g. https://youtu.be/video-id" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Video thumbnail URL (optional)" value={lessonForm.thumbnail_url} onChange={(e) => setLessonForm({ ...lessonForm, thumbnail_url: e.target.value })} />
            <div className="admin-video-custom-control">
              <div className="admin-course-workspace-title">
                <Download size={18} />
                <div>
                  <strong>Secure download section</strong>
                  <span>Add your own downloadable file/resource URL. YouTube links stay embedded and protected.</span>
                </div>
              </div>
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Download button label" value={lessonForm.download_label} onChange={(e) => setLessonForm({ ...lessonForm, download_label: e.target.value })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Secure download/resource URL optional" value={lessonForm.download_url} onChange={(e) => setLessonForm({ ...lessonForm, download_url: e.target.value })} />
              <button type="button" className={`admin-video-toggle ${lessonForm.download_enabled ? 'is-on' : ''}`} onClick={() => setLessonForm({ ...lessonForm, download_enabled: !lessonForm.download_enabled })}>
                <span>{lessonForm.download_enabled ? 'Download section on' : 'Download section off'}</span>
                <i />
              </button>
            </div>
            <label className="admin-slider-upload-box">
              <span className="admin-slider-upload-title">Video thumbnail</span>
              <span className="admin-slider-upload-button">
                <Upload size={18} />
                Upload video thumbnail
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setLessonThumbnailFile(null);
                    return;
                  }
                  if (!file.type.startsWith('image/')) {
                    setMessage('Please choose a valid video thumbnail image');
                    e.target.value = '';
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setMessage('Video thumbnail must be 5 MB or smaller');
                    e.target.value = '';
                    return;
                  }
                  setMessage('');
                  setLessonThumbnailFile(file);
                }}
                className="sr-only"
              />
              <span className="admin-slider-upload-hint">
                {lessonThumbnailFile ? `${lessonThumbnailFile.name} • ${(lessonThumbnailFile.size / 1024 / 1024).toFixed(2)} MB` : 'Paste URL above or upload JPG, PNG, WEBP, GIF'}
              </span>
            </label>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Full-screen HTML/website URL optional" value={lessonForm.note_url} onChange={(e) => setLessonForm({ ...lessonForm, note_url: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder="Paste full HTML code optional" value={lessonForm.note_content} onChange={(e) => setLessonForm({ ...lessonForm, note_content: e.target.value })} />
            <button
              disabled={loading}
              onClick={submitLessonForm}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Save Lesson'}
            </button>
            {editingLessonId && (
              <button onClick={() => {
                setEditingLessonId('');
                setLessonThumbnailFile(null);
                setLessonForm({ course_id: '', title: '', duration: '', note_content: '', note_url: '', video_url: '', thumbnail_url: '', download_url: '', download_label: '', download_enabled: true, sort_order: '0' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Lessons</h3>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{courses.find((course) => course.id === lesson.course_id)?.title || lesson.course_id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingLessonId(lesson.id);
                      setSelectedManagedCourseId(lesson.course_id);
                      setLessonForm({
                        course_id: lesson.course_id,
                        title: lesson.title,
                        duration: lesson.duration,
                        note_content: lesson.note_content,
                        note_url: lesson.note_url || '',
                        video_url: lesson.video_url || '',
                        thumbnail_url: lesson.thumbnail_url || '',
                        download_url: lesson.download_url || '',
                        download_label: lesson.download_label || '',
                        download_enabled: lesson.download_enabled !== false,
                        sort_order: String(lesson.sort_order || 0),
                      });
                      setLessonThumbnailFile(null);
                      setActiveTab('course');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => confirmDelete(
                      'Delete lesson?',
                      `This will delete "${lesson.title}".`,
                      () => submitAction('deleteLesson', { id: lesson.id }, () => {})
                    )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'note' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingNoteId ? 'Edit Note' : 'Add Note'}</h3>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">Note Categories</div>
                  <div className="text-xs text-slate-500">Create category once, then select it while adding notes.</div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                  {noteCategories.length} total
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm"
                  placeholder="Add new category"
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddNoteCategory}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                >
                  Add Category
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {noteCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setNoteForm((current) => ({ ...current, category }))}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      noteForm.category === category ? 'bg-primary text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Note title" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson count" value={noteForm.lessons} onChange={(e) => setNoteForm({ ...noteForm, lessons: e.target.value })} />
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={noteForm.type} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}>
              {noteCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="PDF, Google Drive, HTML, image, or website URL" value={noteForm.url} onChange={(e) => setNoteForm({ ...noteForm, url: e.target.value })} />
            <label className="admin-slider-upload-box">
              <span className="admin-slider-upload-title">Note file</span>
              <span className="admin-slider-upload-button">
                <Upload size={18} />
                Upload note
              </span>
              <input
                type="file"
                accept=".pdf,.html,.htm,.txt,.md,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*,application/pdf,text/html,text/plain,text/markdown"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setNoteFile(null);
                    return;
                  }

                  if (file.size > 15 * 1024 * 1024) {
                    setMessage('Note file must be 15 MB or smaller');
                    e.target.value = '';
                    return;
                  }

                  setMessage('');
                  setNoteFile(file);
                }}
                className="sr-only"
              />
              <span className="admin-slider-upload-hint">
                {noteFile ? `${noteFile.name} - ${(noteFile.size / 1024 / 1024).toFixed(2)} MB` : 'Choose PDF, Drive, HTML, image, TXT, DOC, PPT, or XLS up to 15 MB'}
              </span>
            </label>
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder="Paste full HTML code here (optional)" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
            <button
              disabled={loading}
              onClick={submitNote}
              className="admin-slider-save-button w-full py-3 font-bold"
            >
              {loading ? 'Saving...' : editingNoteId ? 'Update Note' : 'Upload & Save Note'}
            </button>
            {editingNoteId && (
              <button onClick={() => {
                setEditingNoteId('');
                setNoteFile(null);
                setNoteForm({ title: '', lessons: '1', category: 'Chemistry', type: 'free', url: '', content: '' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Notes</h3>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{note.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{note.category} • {note.type || 'free'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingNoteId(note.id);
                      setNoteFile(null);
                      setNoteForm({
                        title: note.title,
                        lessons: String(note.lessons || 1),
                        category: note.category,
                        type: note.type || 'free',
                        url: note.url || '',
                        content: note.content || '',
                      });
                      setActiveTab('note');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => confirmDelete(
                      'Delete note?',
                      `This will delete "${note.title}".`,
                      () => submitAction('deleteNote', { id: note.id }, () => {})
                    )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="space-y-4">
        <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#172554_0%,#0f766e_55%,#7c2d12_100%)] p-5 text-white shadow-xl shadow-slate-300/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Quiz Builder</p>
              <h3 className="mt-2 text-2xl font-black">Create quiz, add MCQ, import JSON</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">Everything for quiz publishing is now in one place. Select a quiz once, then add questions or import a full question bank below.</p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14">
              <HelpCircle size={28} />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/12 p-4">
              <div className="text-2xl font-black">{quizzes.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Quizzes</div>
            </div>
            <div className="rounded-2xl bg-white/12 p-4">
              <div className="text-2xl font-black">{questions.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Questions</div>
            </div>
            <div className="rounded-2xl bg-white/12 p-4">
              <div className="text-2xl font-black">{activeQuizBuilderQuestions.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Selected Quiz MCQs</div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="admin-section-head">
            <div>
              <h3 className="font-bold text-gray-800">{editingQuizId ? 'Edit Quiz' : 'Add Quiz'}</h3>
              <p className="text-xs text-gray-500 mt-1">Create the quiz set first, then keep adding questions in the same builder.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Quiz topic" value={quizForm.topic} onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })} />
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={quizForm.type} onChange={(e) => setQuizForm({ ...quizForm, type: e.target.value })}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <button
              disabled={loading}
              onClick={() => submitAction(editingQuizId ? 'updateQuiz' : 'createQuiz', { ...(editingQuizId ? { id: editingQuizId } : {}), ...quizForm }, () => {
                setQuizForm({ topic: '', type: 'free' });
                setEditingQuizId('');
              })}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingQuizId ? 'Update Quiz' : 'Save Quiz'}
            </button>
            {editingQuizId && (
              <button onClick={() => {
                setEditingQuizId('');
                setQuizForm({ topic: '', type: 'free' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className={cardClass}>
          <div className="admin-section-head">
            <div>
              <h3 className="font-bold text-gray-800">Select Quiz</h3>
              <p className="text-xs text-gray-500 mt-1">This selection controls both manual MCQ adding and JSON imports.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              {activeQuizBuilder?.topic || 'No quiz selected'}
            </div>
          </div>
          <select
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
            value={activeQuizBuilderId}
            onChange={(e) => {
              setQuestionForm({ ...questionForm, quiz_id: e.target.value });
              setQuestionImportQuizId(e.target.value);
            }}
          >
            <option value="">Select quiz</option>
            {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.topic}</option>)}
          </select>
        </div>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">{editingQuestionId ? 'Edit MCQ' : 'Add MCQ'}</h3>
            <div className="space-y-3">
              <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Question text" value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value, quiz_id: questionForm.quiz_id || activeQuizBuilderId })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Question image URL (optional)" value={questionForm.image_url} onChange={(e) => setQuestionForm({ ...questionForm, image_url: e.target.value })} />
              <label className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                <span className="block font-bold text-gray-700 mb-2">Upload question image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setQuestionImageFile(null);
                      return;
                    }
                    if (!file.type.startsWith('image/')) {
                      setMessage('Please choose a valid question image');
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setMessage('Question image must be 5 MB or smaller');
                      return;
                    }
                    setQuestionImageFile(file);
                    setQuestionForm((current) => ({ ...current, quiz_id: current.quiz_id || activeQuizBuilderId }));
                    setMessage('');
                  }}
                  className="block w-full text-sm"
                />
                <span className="block mt-2 text-xs">
                  {questionImageFile ? questionImageFile.name : 'Choose an image if this question needs a diagram or visual'}
                </span>
              </label>
              {questionImagePreviewUrl && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <img src={questionImagePreviewUrl} alt="Question preview" className="w-full max-h-56 object-contain bg-slate-50" referrerPolicy="no-referrer" />
                </div>
              )}
              <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder={'Options, one per line\nOption 1\nOption 2\nOption 3\nOption 4'} value={questionForm.optionsText} onChange={(e) => setQuestionForm({ ...questionForm, optionsText: e.target.value, quiz_id: questionForm.quiz_id || activeQuizBuilderId })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Correct answer index (0-3)" value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value.replace(/[^\d]/g, ''), quiz_id: questionForm.quiz_id || activeQuizBuilderId })} />
              <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Explanation" value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value, quiz_id: questionForm.quiz_id || activeQuizBuilderId })} />
              <button
                disabled={loading}
                onClick={submitQuestion}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold"
              >
                {loading ? 'Saving...' : editingQuestionId ? 'Update MCQ' : 'Save MCQ'}
              </button>
              {editingQuestionId && (
                <button onClick={() => {
                  setEditingQuestionId('');
                  setQuestionForm({ id: '', quiz_id: activeQuizBuilderId, text: '', optionsText: '', correctAnswer: '0', explanation: '', image_url: '' });
                  setQuestionImageFile(null);
                  setQuestionImagePreviewUrl('');
                }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">Import MCQs From JSON</h3>
            <div className="space-y-3">
              <label className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                <span className="block font-bold text-gray-700 mb-2">Upload JSON file</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    setQuestionImportQuizId(questionImportQuizId || activeQuizBuilderId);
                    setQuestionImportFile(e.target.files?.[0] || null);
                  }}
                  className="block w-full text-sm"
                />
                <span className="block mt-2 text-xs">
                  {questionImportFile ? questionImportFile.name : 'Upload a JSON file with an array of questions'}
                </span>
              </label>
              <div className="admin-soft-panel px-4 py-3 text-xs text-gray-600 whitespace-pre-wrap">
{`[
  {
    "text": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 1,
    "explanation": "Why this answer is correct"
  }
]`}
              </div>
              <button
                disabled={loading}
                onClick={submitQuestionImport}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
              >
                {loading ? 'Importing...' : 'Import MCQs'}
              </button>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Quizzes</h3>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="admin-list-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{quiz.topic}</div>
                    <div className="text-xs text-gray-500 mt-1">{quiz.questions.length} questions</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingQuizId(quiz.id);
                      setQuizForm({ topic: quiz.topic, type: (quiz as any).type || 'free' });
                      setQuestionForm((current) => ({ ...current, quiz_id: quiz.id }));
                      setQuestionImportQuizId(quiz.id);
                      setActiveTab('quiz');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => confirmDelete(
                      'Delete quiz?',
                      `This will delete "${quiz.topic}" and its questions.`,
                      () => submitAction('deleteQuiz', { id: quiz.id }, () => {})
                    )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <div className="admin-section-head">
            <div>
              <h3 className="font-bold text-gray-800">Manage MCQs</h3>
              <p className="text-xs text-gray-500 mt-1">{activeQuizBuilder ? `Showing questions for ${activeQuizBuilder.topic}` : 'Select a quiz to review questions.'}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              {activeQuizBuilderQuestions.length} total
            </div>
          </div>
          <div className="space-y-3">
            {activeQuizBuilderQuestions.map((question) => (
              <div key={question.id} className="admin-list-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-gray-800">{question.text}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {question.options.map((option, index) => (
                        <div
                          key={`${question.id}-${index}`}
                          className={`rounded-2xl px-3 py-2 text-[11px] font-bold ${index === question.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {String.fromCharCode(65 + index)}. {getQuizOptionText(option)}
                        </div>
                      ))}
                    </div>
                    {question.image_url && (
                      <img src={question.image_url} alt={question.text} className="mt-3 w-full max-w-xs rounded-2xl border border-gray-100 object-contain bg-slate-50" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingQuestionId(question.id);
                      setQuestionForm({
                        id: question.id,
                        quiz_id: activeQuizBuilder?.id || question.quiz_id || '',
                        text: question.text,
                        optionsText: question.options.join('\n'),
                        correctAnswer: String(question.correctAnswer),
                        explanation: question.explanation || '',
                        image_url: question.image_url || '',
                      });
                      setQuestionImportQuizId(activeQuizBuilder?.id || question.quiz_id || '');
                      setQuestionImageFile(null);
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => confirmDelete(
                      'Delete question?',
                      'This MCQ will be permanently removed from the quiz.',
                      () => submitAction('deleteQuestion', { id: question.id }, () => {})
                    )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {!activeQuizBuilderQuestions.length && (
              <div className="admin-empty-control">No MCQs in this quiz yet. Add one above or import a JSON question bank.</div>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'question' && (
        <div className="space-y-4">
        <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Import Questions From JSON</h3>
          <div className="space-y-3">
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={questionImportQuizId} onChange={(e) => setQuestionImportQuizId(e.target.value)}>
              <option value="">Select quiz for import</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.topic}</option>)}
            </select>
            <label className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              <span className="block font-bold text-gray-700 mb-2">Upload JSON file</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => setQuestionImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              <span className="block mt-2 text-xs">
                {questionImportFile ? questionImportFile.name : 'Upload a JSON file with an array of questions'}
              </span>
            </label>
            <textarea
              className="w-full min-h-40 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
              placeholder="Or paste existing quiz JSON here. Single object and array both work."
              value={questionImportJson}
              onChange={(event) => setQuestionImportJson(event.target.value)}
            />
            <div className="admin-soft-panel px-4 py-3 text-xs text-gray-600 whitespace-pre-wrap">
              {`Supported JSON format:
[
  {
    "subject": "Mathematics",
    "chapter": "Probability",
    "question": "What is the value of \\( P(A \\cup B) \\) ?",
    "question_type": "mcq",
    "options": [
      { "type": "text", "value": "\\( P(A)+P(B) \\)" },
      { "type": "image", "value": "https://example.com/option.png" }
    ],
    "correct_answer": 0,
    "explanation": "Optional explanation",
    "difficulty": "medium"
  }
]

Questions are read from your JSON and imported into the selected quiz subject sheet.`}
            </div>
            <button
              disabled={loading}
              onClick={submitQuestionImport}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Importing...' : 'Import Questions'}
            </button>
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
          <div className="space-y-3">
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={questionForm.quiz_id} onChange={(e) => setQuestionForm({ ...questionForm, quiz_id: e.target.value })}>
              <option value="">Select quiz</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.topic}</option>)}
            </select>
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Question text" value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Question image URL (optional)" value={questionForm.image_url} onChange={(e) => setQuestionForm({ ...questionForm, image_url: e.target.value })} />
            <label className="block rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              <span className="block font-bold text-gray-700 mb-2">Upload question image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setQuestionImageFile(null);
                    return;
                  }
                  if (!file.type.startsWith('image/')) {
                    setMessage('Please choose a valid question image');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setMessage('Question image must be 5 MB or smaller');
                    return;
                  }
                  setQuestionImageFile(file);
                  setMessage('');
                }}
                className="block w-full text-sm"
              />
              <span className="block mt-2 text-xs">
                {questionImageFile ? questionImageFile.name : 'Choose an image if this question needs a diagram or visual'}
              </span>
            </label>
            {questionImagePreviewUrl && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <img src={questionImagePreviewUrl} alt="Question preview" className="w-full max-h-56 object-contain bg-slate-50" referrerPolicy="no-referrer" />
              </div>
            )}
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder={'Options, one per line\nOption 1\nOption 2\nOption 3\nOption 4'} value={questionForm.optionsText} onChange={(e) => setQuestionForm({ ...questionForm, optionsText: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Correct answer index (0-3)" value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Explanation" value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} />
            <button
              disabled={loading}
              onClick={submitQuestion}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Save Question'}
            </button>
            {editingQuestionId && (
              <button onClick={() => {
                setEditingQuestionId('');
                setQuestionForm({ id: '', quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '', image_url: '' });
                setQuestionImageFile(null);
                setQuestionImagePreviewUrl('');
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        </div>
        <div className={cardClass}>
          <div className="admin-section-head">
            <div>
              <h3 className="font-bold text-gray-800">Manage Questions</h3>
              <p className="text-xs text-gray-500 mt-1">Review question text, images, quiz mapping, and edit actions in one place.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
              {questions.length} total
            </div>
          </div>
          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="admin-list-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-gray-800">{question.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{(question as any).topic}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {question.options.map((option, index) => (
                        <div
                          key={`${question.id}-${index}`}
                          className={`rounded-2xl px-3 py-2 text-[11px] font-bold ${index === question.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          <div>{String.fromCharCode(65 + index)}. {getQuizOptionText(option)}</div>
                          {getQuizOptionImage(option, question.option_images?.[index]) && (
                            <img
                              src={getQuizOptionImage(option, question.option_images?.[index])}
                              alt={`${getQuizOptionText(option) || `Option ${index + 1}`} option`}
                              className="mt-2 w-full max-w-[120px] rounded-xl border border-gray-100 object-contain bg-white"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {question.image_url && (
                      <img src={question.image_url} alt={question.text} className="mt-3 w-full max-w-xs rounded-2xl border border-gray-100 object-contain bg-slate-50" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingQuestionId(question.id);
                      setQuestionForm({
                        id: question.id,
                        quiz_id: question.quiz_id,
                        text: question.text,
                        optionsText: question.options.join('\n'),
                        correctAnswer: String(question.correctAnswer),
                        explanation: question.explanation || '',
                        image_url: question.image_url || '',
                      });
                      setQuestionImageFile(null);
                      setActiveTab('quiz');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => confirmDelete(
                      'Delete question?',
                      'This MCQ will be permanently removed from the quiz.',
                      () => submitAction('deleteQuestion', { id: question.id }, () => {})
                    )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#172554_0%,#1d4ed8_45%,#0f766e_100%)] p-5 text-white shadow-xl shadow-slate-300/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Live Classes</p>
                <h3 className="mt-2 text-2xl font-black">Schedule free and premium sessions</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">Create one live class, then decide who should see it: all students, only one subscribed course, or selected students only.</p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14">
                <Bell size={28} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-2xl font-black">{liveClasses.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">All Sessions</div>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-2xl font-black">{liveClasses.filter((item) => item.is_active).length}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Active</div>
              </div>
              <div className="rounded-2xl bg-white/12 p-4">
                <div className="text-2xl font-black">{liveClasses.filter((item) => item.access_type === 'premium').length}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Premium</div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="admin-section-head">
              <div>
                <h3 className="font-bold text-gray-800">{editingLiveClassId ? 'Edit Live Class' : 'Create Live Class'}</h3>
                <p className="text-xs text-gray-500 mt-1">Students will only see the session if they match the selected visibility rule.</p>
              </div>
            </div>
            <div className="space-y-3">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Live class title" value={liveClassForm.title} onChange={(e) => setLiveClassForm({ ...liveClassForm, title: e.target.value })} />
              <textarea className="w-full min-h-24 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Short class description" value={liveClassForm.description} onChange={(e) => setLiveClassForm({ ...liveClassForm, description: e.target.value })} />
              <div className="grid gap-3 md:grid-cols-2">
                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={liveClassForm.access_type} onChange={(e) => setLiveClassForm({ ...liveClassForm, access_type: e.target.value === 'premium' ? 'premium' : 'free' })}>
                  <option value="free">Free Live Class</option>
                  <option value="premium">Premium Live Class</option>
                </select>
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                  value={liveClassForm.audience_type}
                  onChange={(e) => {
                    const audienceType = e.target.value as 'all' | 'course' | 'selected';
                    setLiveClassForm({
                      ...liveClassForm,
                      audience_type: audienceType,
                      course_id: audienceType === 'course' ? liveClassForm.course_id : '',
                      selected_user_ids: audienceType === 'selected' ? liveClassForm.selected_user_ids : [],
                    });
                  }}
                >
                  <option value="all">Show to all matching students</option>
                  <option value="course">Show to one course subscribers</option>
                  <option value="selected">Show to selected students</option>
                </select>
              </div>
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Google Meet URL, for example https://meet.google.com/abc-defg-hij" value={liveClassForm.meeting_url} onChange={(e) => setLiveClassForm({ ...liveClassForm, meeting_url: e.target.value })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" type="datetime-local" value={liveClassForm.scheduled_at} onChange={(e) => setLiveClassForm({ ...liveClassForm, scheduled_at: e.target.value })} />

              {liveClassForm.audience_type === 'course' && (
                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={liveClassForm.course_id} onChange={(e) => setLiveClassForm({ ...liveClassForm, course_id: e.target.value })}>
                  <option value="">Select subscribed course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              )}
              {liveClassForm.audience_type === 'course' && !courses.length && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  No courses found. Create a course first, then schedule a course-based live class.
                </div>
              )}

              {liveClassForm.audience_type === 'selected' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Selected Students</div>
                      <div className="text-xs text-slate-500">{liveClassForm.selected_user_ids.length} students chosen</div>
                    </div>
                    <input
                      className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="Search students"
                      value={liveClassStudentSearchQuery}
                      onChange={(e) => setLiveClassStudentSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                    {liveClassStudentOptions.map((userItem) => {
                      const isSelected = liveClassForm.selected_user_ids.includes(userItem.id);
                      return (
                        <button
                          key={userItem.id}
                          type="button"
                          onClick={() => toggleLiveClassStudent(userItem.id)}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ${
                            isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          <span>
                            <strong className="block">{userItem.name}</strong>
                            <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>{userItem.email} - {getStudentClassLabel(userItem.classLevel)}</span>
                          </span>
                          <span className="text-xs font-black uppercase tracking-[0.18em]">
                            {isSelected ? 'Selected' : 'Pick'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={liveClassForm.is_active} onChange={(e) => setLiveClassForm({ ...liveClassForm, is_active: e.target.checked })} />
                Keep this live class visible to matched students
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button disabled={loading} onClick={submitLiveClassForm} className="admin-primary-button px-5 py-3 text-sm font-bold">
                  {loading ? 'Saving...' : editingLiveClassId ? 'Update Live Class' : 'Create Live Class'}
                </button>
                <button type="button" onClick={resetLiveClassForm} className="admin-secondary-button px-5 py-3 text-sm font-bold">
                  {editingLiveClassId ? 'Cancel Edit' : 'Clear'}
                </button>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">Manage Live Classes</h3>
            <div className="space-y-3">
              {liveClasses.map((liveClass) => {
                const linkedCourse = courses.find((course) => String(course.id) === String(liveClass.course_id || ''));
                const liveStatus = getLiveClassStatus(liveClass.scheduled_at);
                const hasCourseConflict = liveClass.audience_type === 'course' && !linkedCourse;
                return (
                  <div key={liveClass.id} className={`rounded-2xl border p-4 ${hasCourseConflict ? 'border-red-200 bg-red-50/60' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${liveClass.access_type === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{liveClass.access_type}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{liveClass.is_active ? 'Active' : 'Hidden'}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getLiveClassStatusClass(liveStatus.tone)}`}>{liveStatus.label}</span>
                          {hasCourseConflict && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">Fix course</span>
                          )}
                        </div>
                        <div className="mt-2 font-bold text-sm text-gray-800">{liveClass.title}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatLiveClassDate(liveClass.scheduled_at)} - {liveClass.audience_type === 'all' ? 'All matching students' : liveClass.audience_type === 'course' ? (linkedCourse?.title || 'Missing linked course') : `${liveClass.selected_user_ids.length} selected students`}
                        </div>
                        {hasCourseConflict && (
                          <div className="mt-2 text-xs font-bold text-red-700">
                            This class is linked to a deleted course. Edit it and choose All, Selected, or a valid course.
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingLiveClassId(liveClass.id);
                          setLiveClassForm({
                            title: liveClass.title,
                            description: liveClass.description || '',
                            meeting_url: liveClass.meeting_url,
                            scheduled_at: liveClass.scheduled_at ? new Date(liveClass.scheduled_at).toISOString().slice(0, 16) : '',
                            access_type: liveClass.access_type,
                            audience_type: liveClass.audience_type,
                            course_id: liveClass.course_id || '',
                            selected_user_ids: liveClass.selected_user_ids || [],
                            is_active: liveClass.is_active,
                          });
                          setActiveTab('live');
                        }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                        <button onClick={() => confirmDelete(
                          'Delete live class?',
                          `This will delete "${liveClass.title}".`,
                          () => submitAction('deleteLiveClass', { id: liveClass.id }, () => {})
                        )} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!liveClasses.length && (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                  No live classes created yet. Schedule the first session above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'user' && (
        <div className="space-y-4">
          <div className="admin-user-manager">
            <div className="admin-section-head">
              <div>
                <p className="admin-control-eyebrow">Students</p>
                <h3 className="font-bold text-gray-800">Student Management</h3>
                <p className="text-xs text-gray-500 mt-1">Open a student popup to unlock, block, or remove premium course access.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => downloadUsersCsv(users)}
                  disabled={!users.length}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700 disabled:opacity-50"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadUsersExcel(users)}
                  disabled={!users.length}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700 disabled:opacity-50"
                >
                  <Download size={14} />
                  Excel
                </button>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                  {users.length} students
                </div>
              </div>
            </div>

            <div className="admin-user-search">
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Search student by name, email, or ID"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-user-grid">
              {filteredUsers.length === 0 ? (
                <div className="admin-soft-panel px-4 py-6 text-sm text-slate-500">
                  {users.length === 0 ? 'No student data found yet.' : 'No student matched your search.'}
                </div>
              ) : (
                filteredUsers.map((userItem) => (
                  <button
                    type="button"
                    key={userItem.id}
                    className="admin-user-card"
                    onClick={() => {
                      setSelectedStudent(userItem);
                      setStudentAccessForm({ courseId: premiumCourses[0]?.id || '', durationDays: '30' });
                      setStudentAccessCode('');
                    }}
                  >
                    <div className="admin-user-card-top">
                      <div className="admin-user-avatar">{getStudentInitials(userItem.name || userItem.email || 'S')}</div>
                      <div className="min-w-0">
                        <strong>{userItem.name || 'Student'}</strong>
                        <span>{userItem.email || 'No email'}</span>
                        <em>Student ID: {userItem.id}</em>
                      </div>
                    </div>
                    <div className="admin-user-card-meta">
                      <span className={userItem.status === 'blocked' ? 'is-blocked' : ''}>
                        {userItem.status === 'blocked'
                          ? 'Platform blocked'
                          : `${userItem.grantedCourseIds?.length || 0} unlocked${userItem.blockedCourseIds?.length ? `, ${userItem.blockedCourseIds.length} blocked` : ''}`}
                      </span>
                      <b>Manage</b>
                    </div>
                    <div className="admin-user-card-tags">
                      <span>{userItem.userCategory === 'premium' ? 'Premium User' : 'Free User'}</span>
                      <span>{getStudentClassLabel(userItem.classLevel)}</span>
                        {userItem.password && (
                          <span>Password saved</span>
                        )}
                      {userItem.phone && <span>{userItem.phone}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="admin-section-head">
              <div>
                <h3 className="font-bold text-gray-800">Customer Premium Access</h3>
                <p className="text-xs text-gray-500 mt-1">Unlock premium courses for a fixed time, revoke access, or block a student from a course.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                {premiumCourses.length} premium courses
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 mb-3">
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Search student for premium access"
                value={accessStudentSearchQuery}
                onChange={(e) => setAccessStudentSearchQuery(e.target.value)}
              />
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Search premium course"
                value={accessCourseSearchQuery}
                onChange={(e) => setAccessCourseSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                value={customerAccessForm.userId}
                onChange={(e) => {
                  setCustomerAccessForm((current) => ({ ...current, userId: e.target.value }));
                  setGeneratedCustomerCode('');
                }}
              >
                <option value="">Select student</option>
                {accessUsers.map((userItem) => (
                  <option key={userItem.id} value={userItem.id}>
                    {userItem.name} ({userItem.email})
                  </option>
                ))}
              </select>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                value={customerAccessForm.courseId}
                onChange={(e) => {
                  setCustomerAccessForm((current) => ({ ...current, courseId: e.target.value }));
                  setGeneratedCustomerCode('');
                }}
              >
                <option value="">Select premium course</option>
                {filteredPremiumCourses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                value={customerAccessForm.durationDays}
                onChange={(e) => {
                  setCustomerAccessForm((current) => ({ ...current, durationDays: e.target.value }));
                  setGeneratedCustomerCode('');
                }}
              >
                <option value="7">7 days access</option>
                <option value="30">30 days access</option>
                <option value="90">90 days access</option>
                <option value="180">180 days access</option>
                <option value="365">1 year access</option>
                <option value="0">Lifetime access</option>
              </select>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <button
                type="button"
                onClick={handleGenerateCustomerAccessCode}
                disabled={loading}
                className="admin-primary-button px-5 py-3 text-sm font-bold"
              >
                {loading ? 'Working...' : 'Unlock / Generate Code'}
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(
                  'Block this course access?',
                  'This student will not be able to unlock this selected premium course until you unlock again.',
                  handleBlockCustomerAccess,
                  'Block Access'
                )}
                disabled={loading}
                className="rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600"
              >
                Block Course
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(
                  'Remove this course access?',
                  'This will remove the selected premium course access for this student.',
                  handleRevokeCustomerAccess,
                  'Remove Access'
                )}
                disabled={loading}
                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700"
              >
                Remove Access
              </button>
              {generatedCustomerCode && (
                <div className="rounded-2xl bg-slate-900 px-4 py-3 font-mono text-sm font-bold tracking-[0.18em] text-white">
                  {generatedCustomerCode}
                </div>
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
              Unlock dobara karne se blocked user active ho jayega aur selected duration reset ho jayega.
            </div>
          </div>
        </div>
      )}

      <div className={`${cardClass} mt-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Current Content Snapshot</h3>
          <button onClick={onRefresh} className="text-primary text-sm font-bold">Refresh</button>
        </div>
        <div className="admin-soft-panel px-4 py-4 text-xs text-gray-500 space-y-2">
          <p>{courses.length} courses loaded from Postgres</p>
          <p>{quizzes.length} quizzes loaded from Postgres</p>
          <p>{users.length} students loaded from Postgres</p>
          {courses.slice(0, 5).map((course) => (
            <div key={course.id} className="flex justify-between gap-3">
              <span className="truncate">{course.title}</span>
              <span className="uppercase">{course.type}</span>
            </div>
          ))}
        </div>
      </div>
            </main>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            className={`admin-toast admin-toast--${toast.tone}`}
          >
            <span className="admin-toast-icon">
              {toast.tone === 'success' ? <CheckCircle2 size={20} /> : toast.tone === 'error' ? <XCircle size={20} /> : <Info size={20} />}
            </span>
            <p>{toast.message}</p>
            <button type="button" onClick={() => setToast(null)} aria-label="Close notification">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            className="admin-student-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="admin-student-modal"
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.96 }}
            >
              <div className="admin-student-modal-head">
                <div className="admin-user-avatar admin-user-avatar--large">
                  {getStudentInitials(selectedStudent.name || selectedStudent.email || 'S')}
                </div>
                <div>
                  <p className="admin-control-eyebrow">Student Profile</p>
                  <h3>{selectedStudent.name || 'Student'}</h3>
                  <span>{selectedStudent.email || 'No email'} • ID {selectedStudent.id}</span>
                  <div className={`admin-platform-status ${selectedStudent.userCategory === 'premium' ? 'is-active' : ''}`}>
                    {selectedStudent.userCategory === 'premium' ? 'Premium User' : 'Free User'}
                  </div>
                  <div className="admin-platform-status is-active">
                    {getStudentClassLabel(selectedStudent.classLevel)}
                  </div>
                  <div className={`admin-platform-status ${selectedStudent.status === 'blocked' ? 'is-blocked' : 'is-active'}`}>
                    {selectedStudent.status === 'blocked' ? 'Platform blocked' : 'Platform active'}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedStudent(null)} aria-label="Close student popup">
                  <X size={18} />
                </button>
              </div>

              <div className="admin-student-modal-grid">
                <div className="admin-student-info-panel">
                  <strong>Platform Control</strong>
                  <div className="admin-student-actions">
                    <button
                      type="button"
                      disabled={loading || selectedStudent.status === 'blocked'}
                      className="admin-student-block-button"
                      onClick={() => confirmDelete(
                        'Block student from platform?',
                        'This student will not be able to login or use the app until unblocked.',
                        () => runStudentPlatformAction('blockUser'),
                        'Block Platform'
                      )}
                    >
                      Block Platform
                    </button>
                    <button
                      type="button"
                      disabled={loading || selectedStudent.status !== 'blocked'}
                      className="admin-primary-button"
                      onClick={() => runStudentPlatformAction('unblockUser')}
                    >
                      Unblock Platform
                    </button>
                  </div>

                  <strong>Device Lock</strong>
                  <div className="admin-student-course-list">
                    {selectedStudent.deviceId ? (
                      <span>
                        <Smartphone size={14} /> {selectedStudent.deviceLabel || `Device ${selectedStudent.deviceId.slice(-8)}`}
                        {selectedStudent.deviceBoundAt ? ` - ${new Date(selectedStudent.deviceBoundAt).toLocaleString()}` : ''}
                      </span>
                    ) : (
                      <em>No mobile bound yet. First login will lock this ID to that mobile.</em>
                    )}
                  </div>
                  <div className="admin-student-actions">
                    <button
                      type="button"
                      disabled={loading || !selectedStudent.deviceId}
                      className="admin-student-remove-button"
                      onClick={() => confirmDelete(
                        'Reset student mobile?',
                        'Use this only when the student changes phone. After reset, the next login will lock the ID to the new mobile.',
                        () => runStudentPlatformAction('resetStudentDevice'),
                        'Reset Device'
                      )}
                    >
                      Reset Device
                    </button>
                  </div>

                  <strong>Unlocked Courses</strong>
                  <div className="admin-student-course-list">
                    {(selectedStudent.grantedCourseIds || []).length ? (
                      (selectedStudent.grantedCourseIds || []).map((courseId) => {
                        const course = courses.find((item) => String(item.id) === String(courseId));
                        return (
                          <span key={`${selectedStudent.id}-${courseId}`}>
                            {course?.title || `Course ${courseId}`}
                          </span>
                        );
                      })
                    ) : (
                      <em>No premium courses unlocked yet.</em>
                    )}
                  </div>
                  <strong>Blocked Courses</strong>
                  <div className="admin-student-course-list admin-student-course-list--blocked">
                    {(selectedStudent.blockedCourseIds || []).length ? (
                      (selectedStudent.blockedCourseIds || []).map((courseId) => {
                        const course = courses.find((item) => String(item.id) === String(courseId));
                        return (
                          <span key={`${selectedStudent.id}-blocked-${courseId}`}>
                            {course?.title || `Course ${courseId}`}
                          </span>
                        );
                      })
                    ) : (
                      <em>No course blocks active.</em>
                    )}
                  </div>
                  <div className="admin-student-meta">
                    {selectedStudent.phone && <span>Phone: {selectedStudent.phone}</span>}
                    {selectedStudent.password && <span>Password: {String(selectedStudent.password)}</span>}
                  </div>
                </div>

                <div className="admin-student-access-panel">
                  <strong>Course Access Control</strong>
                  <select
                    value={studentAccessForm.courseId}
                    onChange={(event) => {
                      setStudentAccessForm((current) => ({ ...current, courseId: event.target.value }));
                      setStudentAccessCode('');
                    }}
                  >
                    <option value="">Select premium course</option>
                    {premiumCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  <select
                    value={studentAccessForm.durationDays}
                    onChange={(event) => setStudentAccessForm((current) => ({ ...current, durationDays: event.target.value }))}
                  >
                    <option value="7">7 days access</option>
                    <option value="30">30 days access</option>
                    <option value="90">90 days access</option>
                    <option value="180">180 days access</option>
                    <option value="365">1 year access</option>
                    <option value="0">Lifetime access</option>
                  </select>
                  <div className="admin-student-actions">
                    <button type="button" disabled={loading} className="admin-primary-button" onClick={() => runStudentAccessAction('grantCourseAccess')}>
                      {loading ? 'Working...' : 'Unlock Access'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="admin-student-block-button"
                      onClick={() => confirmDelete(
                        'Block student access?',
                        'This student will be blocked from the selected premium course until you unlock again.',
                        () => runStudentAccessAction('blockCourseAccess'),
                        'Block Access'
                      )}
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className="admin-student-remove-button"
                      onClick={() => confirmDelete(
                        'Remove student access?',
                        'This removes the selected premium course access from this student.',
                        () => runStudentAccessAction('revokeCourseAccess'),
                        'Remove Access'
                      )}
                    >
                      Remove
                    </button>
                  </div>
                  {studentAccessCode && (
                    <div className="admin-student-code">
                      <span>Access Code</span>
                      <b>{studentAccessCode}</b>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            className="admin-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="admin-confirm-card"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
            >
              <div className={`admin-confirm-icon admin-confirm-icon--${confirmDialog.tone || 'primary'}`}>
                {confirmDialog.tone === 'danger' ? <XCircle size={26} /> : <Info size={26} />}
              </div>
              <h3>{confirmDialog.title}</h3>
              <p>{confirmDialog.description}</p>
              <div className="admin-confirm-actions">
                <button
                  type="button"
                  className="admin-confirm-cancel"
                  onClick={() => setConfirmDialog(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`admin-confirm-submit admin-confirm-submit--${confirmDialog.tone || 'primary'}`}
                  disabled={loading}
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    await action();
                  }}
                >
                  {loading ? 'Working...' : confirmDialog.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const NoteViewerScreen = ({ 
  onBack, 
  lesson,
  protectedMode = false,
  watermark = 'Monto'
}: { 
  onBack: () => void, 
  lesson: Lesson | null,
  protectedMode?: boolean,
  watermark?: string
}) => {
  if (!lesson) return null;

  const previewUrl = getNoteHtmlPreviewUrl(lesson.note_url, lesson.title);
  const imagePreview = isImageNoteUrl(lesson.note_url, lesson.title);
  const htmlContent = isHtmlNoteContent(lesson.note_content) ? lesson.note_content : '';
  const hasFullPageHtml = Boolean(previewUrl || htmlContent);

  if (hasFullPageHtml) {
    return (
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className={`fixed inset-0 z-50 overflow-hidden bg-white ${protectedMode ? 'protected-learning-surface' : ''}`}
        onContextMenu={protectedMode ? (event) => event.preventDefault() : undefined}
      >
        {protectedMode && <div className="secure-watermark" aria-hidden="true">{watermark}</div>}
        <button
          type="button"
          onClick={onBack}
          className="absolute left-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-xl backdrop-blur-md"
          aria-label="Back"
        >
          <ArrowLeft size={21} />
        </button>
        {imagePreview ? (
          <div className="h-full w-full overflow-auto bg-slate-950">
            <img
              src={previewUrl}
              alt=""
              className="mx-auto min-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <iframe
            src={previewUrl || undefined}
            srcDoc={htmlContent || undefined}
            title="Study note"
            className="h-full w-full border-0 bg-white"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#e9eef6] ${protectedMode ? 'protected-learning-surface' : ''}`}
      onContextMenu={protectedMode ? (event) => event.preventDefault() : undefined}
    >
      {protectedMode && <div className="secure-watermark" aria-hidden="true">{watermark}</div>}
      <button
        type="button"
        onClick={onBack}
        className="absolute left-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-xl backdrop-blur-md"
        aria-label="Back"
      >
        <ArrowLeft size={21} />
      </button>
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <FileText size={28} />
          </div>
          <h2 className="text-lg font-black text-slate-950">{lesson.title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            This note needs to open from its hosted link.
          </p>
          {lesson.note_url && (
            <button
              type="button"
              onClick={() => openExternalUrl(lesson.note_url || '')}
              className="mt-5 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"
            >
              Open Note Link
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const pathname = typeof window !== 'undefined'
    ? window.location.pathname.replace(/\/+$/, '') || '/'
    : '';
  const isAppControlRoute = pathname === '/appcontrol';
  const isSuperAdminRoute = pathname === '/adminlogin/adminsachin' || pathname === '/superadmin' || isAppControlRoute;
  const isAdminRoute = pathname === '/adminlogin' || pathname === '/admin';
  const isManagementRoute = isAdminRoute || isSuperAdminRoute;
  const initialSessionUser = getStoredSessionUser();
  const cachedAppData = getCachedAppData();
  const cachedAdminUsers = getCachedAdminUsers();
  const cachedAppControlSettings = getCachedAppControlSettings();
  const [screen, setScreenState] = useState<Screen>('home');
  const screenRef = useRef<Screen>('home');
  const historyReadyRef = useRef(false);
  const restoringHistoryRef = useRef(false);
  const setScreen = (nextScreen: Screen) => {
    setScreenState((currentScreen) => currentScreen === nextScreen ? currentScreen : nextScreen);
  };
  const [sliders, setSliders] = useState<SliderItem[]>(normalizeSliders(cachedAppData?.sliders));
  const [courses, setCourses] = useState<Course[]>(filterChemistryAppData({
    courses: cachedAppData?.courses?.length ? cachedAppData.courses : fallbackCourses,
    notes: [],
    quizzes: [],
  }).courses);
  const [notes, setNotes] = useState<Note[]>(filterChemistryAppData({
    courses: [],
    notes: cachedAppData?.notes || [],
    quizzes: [],
  }).notes);
  const [quizzes, setQuizzes] = useState<Quiz[]>(filterChemistryAppData({
    courses: [],
    notes: [],
    quizzes: cachedAppData?.quizzes || fallbackQuizzes,
  }).quizzes);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>(cachedAppData?.liveClasses || []);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(cachedAdminUsers);
  const [appControlSettings, setAppControlSettings] = useState<AppControlSettings>(cachedAppControlSettings);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(() => {
    if (typeof window === 'undefined' || isManagementRoute) return false;
    return cachedAppControlSettings.welcomeEnabled && window.localStorage.getItem(APP_WELCOME_SEEN_KEY) !== cachedAppControlSettings.welcomeMessage;
  });
  const [showControlledSplash, setShowControlledSplash] = useState(() => !isManagementRoute && cachedAppControlSettings.splashEnabled);
  const [appControlLastSynced, setAppControlLastSynced] = useState(() => Date.now());
  const [loading, setLoading] = useState(!cachedAppData);
  const [user, setUser] = useState<AuthUser | null>(() => initialSessionUser);
  const [blockedAccount, setBlockedAccount] = useState<{ user: AuthUser | null; message: string } | null>(() =>
    !isManagementRoute && initialSessionUser?.status === 'blocked'
      ? { user: initialSessionUser, message: 'Your account is blocked. Contact academy admin.' }
      : null
  );
  const [sessionChecking, setSessionChecking] = useState(() =>
    !isManagementRoute && Boolean(initialSessionUser) && initialSessionUser?.status !== 'blocked'
  );
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getAdminSession());
  const [darkModeEnabled, setDarkModeEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [notificationStatus, setNotificationStatus] = useState(() => getNotificationPermissionState());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(NOTIFICATION_PREF_STORAGE_KEY) === 'true' || getNotificationPermissionState() === 'granted';
  });
  const [studentNotifications, setStudentNotifications] = useState<StudentNotificationItem[]>(() => {
    const storedNotifications = getStoredStudentNotifications();
    const latestBroadcast = (cachedAppControlSettings.notificationId || cachedAppControlSettings.notificationSentAt)
      ? normalizeStudentNotification({
          id: cachedAppControlSettings.notificationId || 'latest-admin-broadcast',
          title: cachedAppControlSettings.notificationTitle,
          body: cachedAppControlSettings.notificationBody,
          receivedAt: cachedAppControlSettings.notificationSentAt
            ? new Date(cachedAppControlSettings.notificationSentAt).getTime()
            : Date.now(),
          screen: 'home',
          type: 'admin-broadcast',
          data: {
            type: 'admin-broadcast',
            screen: 'home',
            notificationId: cachedAppControlSettings.notificationId || '',
          },
        })
      : null;
    return latestBroadcast ? mergeStudentNotification(storedNotifications, latestBroadcast) : storedNotifications;
  });
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [pushToken, setPushToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) || '';
  });
  const [coursesInitialTab, setCoursesInitialTab] = useState<'free' | 'premium'>('free');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unlockedCourseIds, setUnlockedCourseIds] = useState<string[]>(() => initialSessionUser?.grantedCourseIds || []);
  const [selectedCourseForUnlock, setSelectedCourseForUnlock] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLiveClass, setSelectedLiveClass] = useState<LiveClass | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<Quiz | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const coursesRef = useRef<Course[]>(courses);
  const unlockedCourseIdsRef = useRef<string[]>(initialSessionUser?.grantedCourseIds || []);
  const notifiedCourseUnlockIdsRef = useRef<Set<string>>(new Set(initialSessionUser?.grantedCourseIds || []));
  const liveClassAlertTimersRef = useRef<number[]>([]);
  const accessSyncReadyRef = useRef(false);
  const appControlNotificationKeyRef = useRef(`${cachedAppControlSettings.notificationId || ''}\n${cachedAppControlSettings.notificationTitle}\n${cachedAppControlSettings.notificationBody}`);
  const appControlSyncReadyRef = useRef(false);
  const isPremiumProtectionScreen = Boolean(
    (
      selectedCourse &&
      !isCourseFree(selectedCourse) &&
      ['video-player', 'note-viewer', 'course-details'].includes(screen)
    ) ||
    (
      selectedLiveClass?.access_type === 'premium' &&
      screen === 'live-class-viewer'
    )
  );
  const screenProtectionActive = !isManagementRoute &&
    appControlSettings.screenProtection &&
    (
      appControlSettings.screenProtectionScope !== 'premium' ||
      isPremiumProtectionScreen
    );
  const videoPlayerProtectionActive = !isManagementRoute &&
    appControlSettings.videoProtectionEnabled &&
    screen === 'video-player';
  const secureModeActive = screenProtectionActive || videoPlayerProtectionActive;
  const premiumSurfaceProtectionActive = screenProtectionActive &&
    appControlSettings.screenProtectionScope === 'premium';
  const videoSurfaceProtectionActive = premiumSurfaceProtectionActive || videoPlayerProtectionActive;

  const addStudentNotification = (notification: Partial<StudentNotificationItem>) => {
    setStudentNotifications((current) => mergeStudentNotification(current, notification));
  };

  const notifyCourseUnlocks = async (nextCourseIds: string[], previousCourseIds = unlockedCourseIdsRef.current) => {
    if (!appControlSettings.pushEnabled) {
      return;
    }

    const newlyUnlockedIds = nextCourseIds.filter((courseId) =>
      !previousCourseIds.includes(courseId) && !notifiedCourseUnlockIdsRef.current.has(courseId)
    );

    if (!newlyUnlockedIds.length) {
      return;
    }

    for (const courseId of newlyUnlockedIds) {
      notifiedCourseUnlockIdsRef.current.add(courseId);
      const unlockedCourse = coursesRef.current.find((course) => course.id === courseId);
      const courseTitle = unlockedCourse?.title || 'Premium course';
      addStudentNotification({
        id: `course-unlocked-${courseId}-${Date.now()}`,
        title: 'Course unlocked',
        body: `${courseTitle} is now available in your Monto app.`,
        receivedAt: Date.now(),
        screen: 'video-player',
        type: 'course-unlocked',
        data: {
          type: 'course-unlocked',
          screen: 'video-player',
          courseId,
        },
      });
      const shown = await showAppNotification(
        'Course unlocked',
        `${courseTitle} is now available in your Monto app.`,
        {
          type: 'course-unlocked',
          screen: 'video-player',
          courseId,
        },
        NOTIFICATION_CHANNEL_COURSE_ACCESS
      );
      if (shown) {
        setNotificationStatus('course-unlocked');
        setNotificationsEnabled(true);
      }
    }
  };

  const openNotificationTarget = (payload: Record<string, unknown> | undefined) => {
    if (!payload) {
      return;
    }

    const courseId = typeof payload.courseId === 'string' ? payload.courseId : '';
    if (courseId) {
      const notificationCourse = coursesRef.current.find((course) => course.id === courseId);
      if (notificationCourse) {
        setSelectedCourse(notificationCourse);
      }
    }

    const targetScreen = typeof payload.screen === 'string' ? payload.screen as Screen : undefined;
    if (targetScreen) {
      setScreen(targetScreen);
    }
  };

  const goBackOneStep = () => {
    playInteractionSound('back');

    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }

    if (screenRef.current === 'video-player') {
      const nativeWindow = window as YoutubeWindow;
      nativeWindow.Android?.exitVideoFullscreen?.();
      void lockWebOrientation('portrait');
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    setScreen(getBackScreen());
  };

  const blockCurrentStudentSession = (blockedUser: AuthUser | null, message = 'Your account is blocked. Contact academy admin.') => {
    const nextUser = blockedUser ? { ...normalizeAuthUser(blockedUser), status: 'blocked' } : null;
    setBlockedAccount({ user: nextUser, message });
    setUser(nextUser);
    saveSessionUser(nextUser);
    setUnlockedCourseIds([]);
    unlockedCourseIdsRef.current = [];
    notifiedCourseUnlockIdsRef.current = new Set();
    accessSyncReadyRef.current = false;
    setSelectedCourseForUnlock(null);
    setSelectedCourse(null);
    setSelectedLesson(null);
    setSelectedQuizTopic(null);
    setIsDrawerOpen(false);
    setScreen('home');
  };

  const fetchAppData = async () => {
    try {
      const [slidersData, coursesData, notesData, quizzesData, liveClassesData] = await Promise.all([
        withTimeout(
          loadJsonResource<SliderItem[]>('sliders', fallbackSliders),
          sliders.length ? sliders : fallbackSliders
        ),
        withTimeout(
          loadJsonResource<Course[]>('courses', cachedAppData?.courses?.length ? cachedAppData.courses : fallbackCourses),
          courses.length ? courses : (cachedAppData?.courses?.length ? cachedAppData.courses : fallbackCourses)
        ),
        withTimeout(
          loadJsonResource<Note[]>('notes', cachedAppData?.notes || []),
          notes.length ? notes : (cachedAppData?.notes || [])
        ),
        withTimeout(
          loadJsonResource<Quiz[]>('quizzes', cachedAppData?.quizzes || fallbackQuizzes),
          quizzes.length ? quizzes : (cachedAppData?.quizzes || fallbackQuizzes)
        ),
        withTimeout(
          isManagementRoute
            ? fetchAdminLiveClasses()
            : fetchStudentLiveClasses(user?.id || '', cachedAppData?.liveClasses || []),
          liveClasses.length ? liveClasses : (cachedAppData?.liveClasses || [])
        ),
      ]);

      const nextSliders = Array.isArray(slidersData) && slidersData.length
        ? normalizeSliders(slidersData)
        : sliders.length
          ? normalizeSliders(sliders)
          : fallbackSliders;
      const nextCourses = Array.isArray(coursesData) && coursesData.length
        ? coursesData
        : courses.length
          ? courses
          : (cachedAppData?.courses?.length ? cachedAppData.courses : fallbackCourses);
      const nextNotes = Array.isArray(notesData) && notesData.length
        ? notesData
        : notes.length
          ? notes
          : (cachedAppData?.notes || []);
      const nextQuizzes = Array.isArray(quizzesData) && quizzesData.length
        ? mergeQuizzes(quizzesData)
        : quizzes.length
          ? quizzes
          : mergeQuizzes(cachedAppData?.quizzes || fallbackQuizzes);

      const chemistryOnlyData = filterChemistryAppData({
        courses: nextCourses,
        notes: nextNotes,
        quizzes: nextQuizzes,
      });

      setSliders(nextSliders);
      setCourses(chemistryOnlyData.courses);
      setNotes(chemistryOnlyData.notes);
      setQuizzes(chemistryOnlyData.quizzes);
      setLiveClasses(Array.isArray(liveClassesData) ? liveClassesData : []);
      saveCachedAppData({
        sliders: nextSliders,
        courses: chemistryOnlyData.courses,
        notes: chemistryOnlyData.notes,
        quizzes: chemistryOnlyData.quizzes,
        liveClasses: isManagementRoute
          ? (cachedAppData?.liveClasses || [])
          : (Array.isArray(liveClassesData) ? liveClassesData : []),
      });
      if (isManagementRoute) {
        const nextAdminUsers = await fetchAdminUsers();
        setAdminUsers(nextAdminUsers);
        if (nextAdminUsers.length) {
          saveCachedAdminUsers(nextAdminUsers);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      const preservedCourses = courses.length ? courses : (cachedAppData?.courses?.length ? cachedAppData.courses : fallbackCourses);
      setSliders(sliders.length ? sliders : fallbackSliders);
      setCourses(filterChemistryAppData({ courses: preservedCourses, notes: [], quizzes: [] }).courses);
      setNotes(notes.length ? notes : (cachedAppData?.notes || []));
      setQuizzes(filterChemistryAppData({ courses: [], notes: [], quizzes: fallbackQuizzes }).quizzes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const refreshAppControlSettings = async () => {
      const settings = await fetchAppControlSettings(appControlSettings);
      if (cancelled) {
        return;
      }

      const nextNotificationKey = `${settings.notificationId || ''}\n${settings.notificationTitle}\n${settings.notificationBody}`;
      const shouldShowAdminNotification =
        !isManagementRoute &&
        appControlSyncReadyRef.current &&
        settings.pushEnabled &&
        nextNotificationKey !== appControlNotificationKeyRef.current &&
        Boolean(settings.notificationTitle || settings.notificationBody);

      setAppControlSettings(settings);
      setAppControlLastSynced(Date.now());
      saveCachedAppControlSettings(settings);
      if (!isManagementRoute && settings.welcomeEnabled && typeof window !== 'undefined') {
        setShowWelcomeMessage(window.localStorage.getItem(APP_WELCOME_SEEN_KEY) !== settings.welcomeMessage);
      }
      if (!isManagementRoute && !settings.splashEnabled) {
        setShowControlledSplash(false);
      }
      if (!isManagementRoute && (settings.notificationId || settings.notificationSentAt)) {
        addStudentNotification({
          id: settings.notificationId || `admin-broadcast-${settings.notificationSentAt || Date.now()}`,
          title: settings.notificationTitle || 'Monto',
          body: settings.notificationBody || 'New academy update received.',
          receivedAt: settings.notificationSentAt ? new Date(settings.notificationSentAt).getTime() : Date.now(),
          screen: 'home',
          type: 'admin-broadcast',
          data: {
            type: 'admin-broadcast',
            screen: 'home',
            notificationId: settings.notificationId || '',
          },
        });
      }
      appControlNotificationKeyRef.current = nextNotificationKey;
      appControlSyncReadyRef.current = true;

      if (shouldShowAdminNotification) {
        const shown = await showAppNotification(
          settings.notificationTitle || 'Monto',
          settings.notificationBody || 'New academy update received.',
          {
            type: 'admin-broadcast',
            screen: 'home',
            notificationId: settings.notificationId || '',
          },
          NOTIFICATION_CHANNEL_UPDATES
        );
        if (shown) {
          setNotificationStatus('admin-broadcast');
          setNotificationsEnabled(true);
        }
      }
    };

    refreshAppControlSettings();
    const intervalId = window.setInterval(refreshAppControlSettings, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isManagementRoute]);

  useEffect(() => {
    if (isManagementRoute || !appControlSettings.splashEnabled) {
      setShowControlledSplash(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setShowControlledSplash(false), 1300);
    return () => window.clearTimeout(timeoutId);
  }, [isManagementRoute, appControlSettings.splashEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || isManagementRoute) {
      return;
    }

    const state = { montoScreen: screen };
    if (!historyReadyRef.current) {
      window.history.replaceState(state, '', window.location.href);
      historyReadyRef.current = true;
      screenRef.current = screen;
      return;
    }

    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      screenRef.current = screen;
      return;
    }

    if (screenRef.current !== screen) {
      window.history.pushState(state, '', window.location.href);
      screenRef.current = screen;
    }
  }, [screen, isManagementRoute]);

  useEffect(() => {
    if (typeof window === 'undefined' || isManagementRoute) {
      return;
    }

    const handlePopState = (event: PopStateEvent) => {
      playInteractionSound('back');
      const nextScreen = (event.state as { montoScreen?: Screen } | null)?.montoScreen;
      if (nextScreen) {
        restoringHistoryRef.current = true;
        setScreenState(nextScreen);
        return;
      }

      if (screenRef.current !== 'home') {
        restoringHistoryRef.current = true;
        window.history.replaceState({ montoScreen: 'home' }, '', window.location.href);
        setScreenState('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isManagementRoute]);

  useEffect(() => {
    if (typeof window === 'undefined' || isManagementRoute) {
      return;
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (isBackTapTarget(event.target)) {
        playInteractionSound('back');
        return;
      }

      if (isInteractiveTapTarget(event.target)) {
        playInteractionSound('tap');
      }
    };

    document.addEventListener('pointerup', handlePointerUp, true);
    return () => document.removeEventListener('pointerup', handlePointerUp, true);
  }, [isManagementRoute]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(THEME_STORAGE_KEY, darkModeEnabled ? 'dark' : 'light');
  }, [darkModeEnabled]);

  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  useEffect(() => {
    if (isManagementRoute || !user?.id || !liveClasses.length) {
      liveClassAlertTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      liveClassAlertTimersRef.current = [];
      return;
    }

    scheduleNativeLiveClassAlerts(liveClasses).catch(() => {});

    liveClassAlertTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    liveClassAlertTimersRef.current = [];

    if (isNativeLocalNotificationAvailable() || !isNotificationSupported() || Notification.permission !== 'granted') {
      return;
    }

    const now = Date.now();
    liveClasses.forEach((liveClass) => {
      if (!liveClass.is_active || !liveClass.scheduled_at || !isValidMeetingUrl(liveClass.meeting_url)) {
        return;
      }

      const startsAt = new Date(liveClass.scheduled_at).getTime();
      if (!Number.isFinite(startsAt) || startsAt <= now + 30 * 1000) {
        return;
      }

      ([
        { phase: 'reminder' as const, at: startsAt - LIVE_CLASS_REMINDER_LEAD_MS, title: `Live class soon: ${liveClass.title}`, body: `Starts in 15 minutes. ${formatLiveClassDate(liveClass.scheduled_at)}` },
        { phase: 'start' as const, at: startsAt, title: `Live class starting: ${liveClass.title}`, body: 'Tap to open Live Classes and join now.' },
      ]).forEach((alert) => {
        const delay = alert.at - Date.now();
        if (delay <= 30 * 1000 || delay > 24 * 60 * 60 * 1000) {
          return;
        }

        const timerId = window.setTimeout(() => {
          showLocalNotification(alert.title, {
            body: alert.body,
            tag: `live-class-${alert.phase}-${liveClass.id}`,
            data: getLiveClassNotificationPayload(liveClass, alert.phase),
          }).catch(() => {});
        }, delay);
        liveClassAlertTimersRef.current.push(timerId);
      });
    });

    return () => {
      liveClassAlertTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      liveClassAlertTimersRef.current = [];
    };
  }, [isManagementRoute, user?.id, liveClasses]);

  useEffect(() => {
    unlockedCourseIdsRef.current = unlockedCourseIds;
  }, [unlockedCourseIds]);

  useEffect(() => {
    if (!selectedCourseForUnlock || !isCourseAccessible(selectedCourseForUnlock, unlockedCourseIds)) {
      return;
    }

    setSelectedCourse(selectedCourseForUnlock);
    setSelectedCourseForUnlock(null);
    setScreen('course-details');
  }, [selectedCourseForUnlock?.id, unlockedCourseIds]);

  useEffect(() => {
    if (!isNativePushAvailable()) {
      return;
    }

    let isMounted = true;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    const addPushListeners = async () => {
      handles.push(await PushNotifications.addListener('registration', (token) => {
        if (!isMounted) return;
        setPushToken(token.value);
        setNotificationsEnabled(true);
        setNotificationStatus('registered');
        window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token.value);
        window.localStorage.setItem(NOTIFICATION_PREF_STORAGE_KEY, 'true');
        registerPushToken(token.value, getStoredSessionUser()?.id || '').catch(() => {});
      }));

      handles.push(await PushNotifications.addListener('registrationError', (error) => {
        if (!isMounted) return;
        setNotificationsEnabled(false);
        setNotificationStatus(`error: ${error.error}`);
        window.localStorage.setItem(NOTIFICATION_PREF_STORAGE_KEY, 'false');
      }));

      handles.push(await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        if (!isMounted) return;
        const title = notification.title || 'Monto';
        const body = notification.body || 'New academy update received.';
        const payload = (notification.data || {}) as Record<string, unknown>;
        const receivedAt = Date.now();
        setNotificationStatus('received');
        window.localStorage.setItem(PUSH_LAST_MESSAGE_STORAGE_KEY, JSON.stringify({
          title,
          body,
          receivedAt,
          data: payload,
        }));
        addStudentNotification({
          id: String(payload.notificationId || `push-${receivedAt}`),
          title,
          body,
          receivedAt,
          screen: typeof payload.screen === 'string' ? payload.screen as Screen : 'home',
          type: String(payload.type || 'push'),
          data: payload,
        });
        await showAppNotification(title, body, payload, NOTIFICATION_CHANNEL_UPDATES);
      }));

      handles.push(await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        if (!isMounted) return;
        openNotificationTarget(action.notification.data as Record<string, unknown> | undefined);
      }));
    };

    addPushListeners().catch((error) => {
      setNotificationStatus(error instanceof Error ? `error: ${error.message}` : 'error');
    });

    PushNotifications.checkPermissions()
      .then((permission) => {
        if (!isMounted) return;
        setNotificationStatus(permission.receive);
        setNotificationsEnabled(permission.receive === 'granted' || Boolean(window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY)));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      handles.forEach((handle) => {
        handle.remove().catch(() => {});
      });
    };
  }, []);

  useEffect(() => {
    if (!isNativeLocalNotificationAvailable()) {
      return;
    }

    let isMounted = true;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    const addLocalNotificationListeners = async () => {
      handles.push(await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        if (!isMounted) return;
        const receivedAt = Date.now();
        const payload = (notification.extra || {}) as Record<string, unknown>;
        setNotificationStatus('received');
        window.localStorage.setItem(PUSH_LAST_MESSAGE_STORAGE_KEY, JSON.stringify({
          title: notification.title,
          body: notification.body,
          receivedAt,
          data: payload,
        }));
        addStudentNotification({
          id: String(payload.notificationId || `local-${receivedAt}`),
          title: notification.title || 'Monto',
          body: notification.body || 'New academy update received.',
          receivedAt,
          screen: typeof payload.screen === 'string' ? payload.screen as Screen : 'home',
          type: String(payload.type || 'local'),
          data: payload,
        });
      }));

      handles.push(await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        if (!isMounted) return;
        openNotificationTarget(action.notification.extra as Record<string, unknown> | undefined);
      }));
    };

    addLocalNotificationListeners().catch((error) => {
      setNotificationStatus(error instanceof Error ? `error: ${error.message}` : 'error');
    });

    LocalNotifications.checkPermissions()
      .then((permission) => {
        if (!isMounted) return;
        if (permission.display === 'granted') {
          setNotificationStatus('local-ready');
          setNotificationsEnabled(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      handles.forEach((handle) => {
        handle.remove().catch(() => {});
      });
    };
  }, []);

  useEffect(() => {
    if (!pushToken || !user?.id) {
      return;
    }

    registerPushToken(pushToken, user.id).catch(() => {});
  }, [pushToken, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isManagementRoute) {
      return;
    }

    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('App')) {
      return;
    }

    let removeBackButtonListener: (() => Promise<void>) | undefined;

    CapacitorApp.addListener('backButton', () => {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return;
      }

      if (screenRef.current !== 'home') {
        goBackOneStep();
        return;
      }

      if (window.confirm('Exit Monto?')) {
        CapacitorApp.exitApp();
      }
    }).then((handle) => {
      removeBackButtonListener = handle.remove;
    }).catch(() => {});

    return () => {
      removeBackButtonListener?.();
    };
  }, [screen, isDrawerOpen, isManagementRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setNativeSecureMode(Boolean(secureModeActive));
    return () => setNativeSecureMode(false);
  }, [secureModeActive]);

  useEffect(() => {
    const loadUserAccess = async () => {
      if (!user) {
        setSessionChecking(false);
        return;
      }

      if (user.status === 'blocked') {
        blockCurrentStudentSession(user);
        setSessionChecking(false);
        return;
      }

      try {
        setSessionChecking(true);
        const freshUser = await fetchSessionUser(user.id);
        const nextGrantedCourseIds = freshUser.grantedCourseIds || [];
        if (accessSyncReadyRef.current) {
          await notifyCourseUnlocks(nextGrantedCourseIds, unlockedCourseIdsRef.current);
        } else {
          nextGrantedCourseIds.forEach((courseId) => notifiedCourseUnlockIdsRef.current.add(courseId));
          accessSyncReadyRef.current = true;
        }
        setUnlockedCourseIds(nextGrantedCourseIds);
        const nextUser = {
          ...normalizeAuthUser(user),
          ...freshUser,
          grantedCourseIds: nextGrantedCourseIds,
        };
        setUser(nextUser);
        saveSessionUser(nextUser);
        setBlockedAccount(null);
      } catch (error) {
        if ((error as Error & { blocked?: boolean })?.blocked) {
          const message = error instanceof Error ? error.message : 'Your account is blocked. Contact academy admin.';
          blockCurrentStudentSession(user, message);
        } else {
          console.error('Error loading user access:', error);
        }
      } finally {
        setSessionChecking(false);
      }
    };

    loadUserAccess();
  }, [user?.id, user?.status]);

  useEffect(() => {
    if (!user || isManagementRoute || blockedAccount) {
      return;
    }

    let isCancelled = false;
    const checkCurrentUserStatus = async () => {
      try {
        const freshUser = await fetchSessionUser(user.id);
        if (isCancelled) {
          return;
        }
        const nextGrantedCourseIds = freshUser.grantedCourseIds || [];
        await notifyCourseUnlocks(nextGrantedCourseIds, unlockedCourseIdsRef.current);
        setUnlockedCourseIds(nextGrantedCourseIds);
        const nextUser = {
          ...normalizeAuthUser(user),
          ...freshUser,
          grantedCourseIds: nextGrantedCourseIds,
        };
        setUser(nextUser);
        saveSessionUser(nextUser);
      } catch (error) {
        if (isCancelled) {
          return;
        }
        if ((error as Error & { blocked?: boolean })?.blocked) {
          const message = error instanceof Error ? error.message : 'Your account is blocked. Contact academy admin.';
          blockCurrentStudentSession(user, message);
        } else {
          console.error('Error checking user status:', error);
        }
      }
    };

    const intervalId = window.setInterval(checkCurrentUserStatus, 12000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id, isManagementRoute, blockedAccount]);

  const handleLogin = (userData: AuthUser) => {
    const normalizedUser = normalizeAuthUser(userData);
    if (normalizedUser.status === 'blocked') {
      blockCurrentStudentSession(normalizedUser);
      return;
    }
    setBlockedAccount(null);
    setUser(normalizedUser);
    saveSessionUser(normalizedUser);
    const grantedCourseIds = normalizedUser.grantedCourseIds || [];
    setUnlockedCourseIds(grantedCourseIds);
    unlockedCourseIdsRef.current = grantedCourseIds;
    notifiedCourseUnlockIdsRef.current = new Set(grantedCourseIds);
    accessSyncReadyRef.current = false;
    setSessionChecking(true);
    setScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setBlockedAccount(null);
    setSessionChecking(false);
    saveSessionUser(null);
    setUnlockedCourseIds([]);
    unlockedCourseIdsRef.current = [];
    notifiedCourseUnlockIdsRef.current = new Set();
    accessSyncReadyRef.current = false;
    setScreen('home');
    setIsDrawerOpen(false);
  };

  const handleProfileUpdate = async ({ name, avatarUrl, classLevel, password }: { name: string; avatarUrl?: string; classLevel?: StudentClassLevel; password?: string }) => {
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const normalizedClassLevel = normalizeStudentClassLevel(classLevel || user.classLevel);
    const updatedUser = { ...user, name, avatarUrl: avatarUrl || '', classLevel: normalizedClassLevel };

    try {
      const response = await apiPost('updateProfile', {
        id: user.id,
        name,
        avatarUrl: avatarUrl || '',
        classLevel: normalizedClassLevel,
        password
      });
      const data = await response.json();

      if (!data.success) {
        if (data.blocked || response.status === 403) {
          blockCurrentStudentSession(user, data.message || 'Your account is blocked. Contact academy admin.');
        }
        return { success: false, message: data.message || 'Unable to update profile' };
      }

      const normalizedUser = normalizeAuthUser(data.user || updatedUser, updatedUser);
      setUser(normalizedUser);
      saveSessionUser(normalizedUser);
      updateStoredUserCredentials({
        id: normalizedUser.id,
        name: normalizedUser.name,
        avatarUrl: normalizedUser.avatarUrl || '',
        classLevel: normalizedUser.classLevel,
        password
      });
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      updateStoredUserCredentials({
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl || '',
        classLevel: updatedUser.classLevel,
        password
      });
      setUser(updatedUser);
      saveSessionUser(updatedUser);
      return { success: true, message: 'Profile updated locally' };
    }
  };

  const handleAdminLogin = (session: AdminSession) => {
    setAdminSession(session);
    saveAdminSession(session);
    setScreen('admin');
  };

  const handleAdminLogout = () => {
    const logoutPath = adminSession?.role === 'superadmin' || isSuperAdminRoute
      ? '/adminlogin/adminsachin'
      : '/adminlogin';
    setAdminSession(null);
    saveAdminSession(null);
    if (typeof window !== 'undefined') {
      window.location.replace(logoutPath);
    }
  };

  const handleUnlockCourse = async (code: string) => {
    if (!selectedCourseForUnlock) {
      return { success: false, message: 'No course selected' };
    }

    try {
      const response = await apiPost('verifyCourseAccess', {
        courseId: selectedCourseForUnlock.id,
        accessCode: code,
        userId: user?.id || '',
        ...getDevicePayload(),
      });
      const data = await response.json();

      if (!data.success) {
        if (data.blocked || response.status === 403 || String(data.message || '').toLowerCase().includes('account is blocked')) {
          blockCurrentStudentSession(user, data.message || 'Your account is blocked. Contact academy admin.');
        }
        return { success: false, message: data.message || 'Invalid access code' };
      }

      const unlockedCourse = selectedCourseForUnlock;
      const nextUnlockedCourseIds = unlockedCourseIds.includes(unlockedCourse.id)
        ? unlockedCourseIds
        : [...unlockedCourseIds, unlockedCourse.id];
      setUnlockedCourseIds(nextUnlockedCourseIds);
      unlockedCourseIdsRef.current = nextUnlockedCourseIds;
      if (user) {
        const nextUser = {
          ...normalizeAuthUser(user),
          grantedCourseIds: nextUnlockedCourseIds,
        };
        setUser(nextUser);
        saveSessionUser(nextUser);
      }
      notifiedCourseUnlockIdsRef.current.add(unlockedCourse.id);
      if (appControlSettings.pushEnabled) {
        const shown = await showAppNotification(
          'Course unlocked',
          `${unlockedCourse.title} is now available in your Monto app.`,
          {
            type: 'course-unlocked',
            screen: 'video-player',
            courseId: unlockedCourse.id,
          },
          NOTIFICATION_CHANNEL_COURSE_ACCESS
        );
        if (shown) {
          setNotificationStatus('course-unlocked');
          setNotificationsEnabled(true);
        }
      }
      setSelectedCourseForUnlock(null);
      setSelectedCourse(unlockedCourse);
      setScreen('video-player');
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Invalid Access Code. Please contact admin on WhatsApp.' };
    }
  };

  const handleOpenCoursesTab = (tab: 'free' | 'premium') => {
    setCoursesInitialTab(tab);
    setScreen('courses');
  };

  const handleSaveAppControlSettings = async (settings: AppControlSettings) => {
    try {
      const response = await fetch(apiUrl('/api/app-control'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ settings }),
      });
      const data = await readLenientJsonResponse(response);
      if (!response.ok) {
        return { success: false, message: data.message || `Unable to save app control settings (${response.status})` };
      }
      if (!data.success) {
        return { success: false, message: data.message || 'Unable to save app control settings' };
      }
      const normalizedSettings = normalizeAppControlSettings(data.settings || settings);
      setAppControlSettings(normalizedSettings);
      setAppControlLastSynced(Date.now());
      saveCachedAppControlSettings(normalizedSettings);
      return { success: true, message: data.message || 'App control settings saved' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unable to save app control settings',
      };
    }
  };

  const handleEnableNotifications = async () => {
    if (!appControlSettings.pushEnabled) {
      setNotificationStatus('disabled by app control');
      setNotificationsEnabled(false);
      return;
    }

    const result = await requestAppNotifications();
    setNotificationStatus(result.status);
    setNotificationsEnabled(result.success);
  };

  const handleNotificationIconClick = () => {
    setStudentNotifications(getStoredStudentNotifications());
    setIsNotificationsPanelOpen(true);
  };

  const handleOpenStudentNotification = (notification: StudentNotificationItem) => {
    setIsNotificationsPanelOpen(false);
    openNotificationTarget({
      ...(notification.data || {}),
      screen: notification.screen || notification.data?.screen || 'home',
    });
  };

  const handleClearStudentNotifications = () => {
    setStudentNotifications([]);
    saveStoredStudentNotifications([]);
  };

  const handleRequestCourseUnlock = (course: Course) => {
    setSelectedCourse(course);
    if (isCourseFree(course)) {
      setScreen('course-details');
      return;
    }
    setSelectedCourseForUnlock(course);
  };

  const renderScreen = () => {
    if (isManagementRoute) {
      const requiredRole: AdminRole = isSuperAdminRoute ? 'superadmin' : 'admin';
      if (!adminSession || adminSession.role !== requiredRole) {
        return <AdminLoginScreen mode={requiredRole} onLogin={handleAdminLogin} />;
      }
      return (
        <AdminPanelScreen
          courses={courses}
          notes={notes}
          quizzes={quizzes}
          sliders={sliders}
          liveClasses={liveClasses}
          users={adminUsers}
          authSession={adminSession}
          initialTab={isAppControlRoute ? 'app-control' : 'dashboard'}
          appControlSettings={appControlSettings}
          appControlLastSynced={appControlLastSynced}
          onSaveAppControlSettings={handleSaveAppControlSettings}
          onRefresh={fetchAppData}
          onLogout={handleAdminLogout}
        />
      );
    }

    if (loading || sessionChecking) return <Loading />;
    if (!user) return <LoginScreen onLogin={handleLogin} />;
    const studentClassLevel = normalizeStudentClassLevel(user.classLevel);
    const visibleCourses = courses.filter((course) => courseMatchesStudentClass(course, studentClassLevel));
    const visibleNotes = notes.filter((note) => noteMatchesStudentClass(note, studentClassLevel));
    const visibleQuizzes = quizzes.filter((quiz) => quizMatchesStudentClass(quiz, studentClassLevel));

    switch (screen) {
      case 'home': return (
        <HomeScreen 
          setScreen={setScreen} 
          sliders={sliders}
          courses={visibleCourses} 
          notes={visibleNotes}
          quizzes={visibleQuizzes}
          unlockedCourseIds={unlockedCourseIds}
          onOpenCoursesTab={handleOpenCoursesTab}
          onOpenLiveClasses={() => setScreen('live-classes')}
          onBuyClick={handleRequestCourseUnlock}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
      case 'courses': return (
        <CoursesScreen 
          setScreen={setScreen} 
          courses={visibleCourses} 
          unlockedCourseIds={unlockedCourseIds}
          initialTab={coursesInitialTab}
          onBuyClick={handleRequestCourseUnlock}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
      case 'live-classes': return (
        <LiveClassesScreen
          liveClasses={liveClasses}
          courses={visibleCourses}
          onJoinClass={(liveClass) => {
            setSelectedLiveClass(liveClass);
            setScreen('live-class-viewer');
          }}
        />
      );
      case 'live-class-viewer': return (
        <LiveClassViewerScreen
          liveClass={selectedLiveClass}
          onBack={() => setScreen('live-classes')}
        />
      );
      case 'binaural-beats': return <BinauralBeatsScreen />;
      case 'notes': return (
        <NotesScreen 
          notes={visibleNotes} 
          onViewNote={(note) => {
            setSelectedLesson({
              id: note.id,
              course_id: '',
              title: note.title,
              duration: '',
              note_content: note.content || 'This is a detailed study material for ' + note.title,
              note_url: note.url
            });
            setPreviousScreen('notes');
            setScreen('note-viewer');
          }}
        />
      );
      case 'quiz': return <QuizScreen quizzes={visibleQuizzes} initialQuiz={selectedQuizTopic} />;
      case 'support-chat': return <SupportChatScreen />;
      case 'about-us': return <AboutUsScreen />;
      case 'about-developer': return <AboutDeveloperScreen />;
      case 'privacy-policy': return <PrivacyPolicyScreen />;
      case 'profile': return (
        <ProfileScreen
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setScreen('settings')}
          onOpenProfileInfo={() => setScreen('profile-edit')}
          onOpenMyCourses={() => setScreen('my-courses')}
          onOpenOfflineNotes={() => setScreen('offline-notes')}
        />
      );
      case 'settings': return (
        <SettingsScreen
          user={user}
          darkModeEnabled={darkModeEnabled}
          notificationsEnabled={notificationsEnabled}
          notificationStatus={notificationStatus}
          pushToken={pushToken}
          onToggleDarkMode={() => setDarkModeEnabled((prev) => !prev)}
          onEnableNotifications={handleEnableNotifications}
          onOpenProfileInfo={() => setScreen('profile-edit')}
          onOpenHelpCenter={() => setScreen('help-center')}
        />
      );
      case 'profile-edit': return user ? <ProfileEditScreen user={user} onSave={handleProfileUpdate} /> : null;
      case 'help-center': return <HelpCenterScreen />;
      case 'my-courses': return (
        <MyCoursesScreen
          courses={visibleCourses}
          unlockedCourseIds={unlockedCourseIds}
          onCourseSelect={(course) => {
            setSelectedCourse(course);
            setScreen('course-details');
          }}
        />
      );
      case 'offline-notes': return <OfflineNotesScreen />;
      case 'admin': return <HomeScreen 
        setScreen={setScreen} 
        sliders={sliders}
        courses={visibleCourses} 
        notes={visibleNotes}
        quizzes={visibleQuizzes}
        unlockedCourseIds={unlockedCourseIds}
        onOpenCoursesTab={handleOpenCoursesTab}
        onOpenLiveClasses={() => setScreen('live-classes')}
        onBuyClick={handleRequestCourseUnlock}
        onCourseSelect={(course) => setSelectedCourse(course)}
      />;
      case 'video-player': return (
        <VideoPlayerScreen 
          onBack={() => setScreen('courses')} 
          course={selectedCourse}
          protectedMode={videoSurfaceProtectionActive}
          videoNotesEnabled={appControlSettings.videoNotesEnabled}
          videoDownloadEnabled={appControlSettings.videoDownloadEnabled}
          watermark={`${user?.name || 'Student'} - ${user?.email || 'Monto'}`}
          onLessonSelect={(lesson) => setSelectedLesson(lesson)}
          onViewNotes={(lesson) => {
            setSelectedLesson(lesson);
            setPreviousScreen('video-player');
            setScreen('note-viewer');
          }}
        />
      );
      case 'note-viewer': return (
        <NoteViewerScreen 
          onBack={() => setScreen(previousScreen)} 
          lesson={selectedLesson} 
          protectedMode={premiumSurfaceProtectionActive}
          watermark={`${user?.name || 'Student'} - ${user?.email || 'Monto'}`}
        />
      );
      case 'course-details': return (
        <CourseDetailsScreen 
          course={selectedCourse}
          onBack={() => setScreen('courses')}
          onStartLearning={() => {
            if (selectedCourse) {
              if (isCourseAccessible(selectedCourse, unlockedCourseIds)) {
                setScreen('video-player');
              } else {
                setSelectedCourseForUnlock(selectedCourse);
              }
            }
          }}
          onViewNotes={(lesson) => {
            setSelectedLesson(lesson);
            setPreviousScreen('course-details');
            setScreen('note-viewer');
          }}
          onTakeQuiz={() => {
            const quiz = visibleQuizzes.find(q => q.topic.toLowerCase().includes(selectedCourse?.category.toLowerCase() || ''));
            setSelectedQuizTopic(quiz || null);
            setScreen('quiz');
          }}
          isUnlocked={isCourseAccessible(selectedCourse, unlockedCourseIds)}
          videoNotesEnabled={appControlSettings.videoNotesEnabled}
        />
      );
      default: return (
        <HomeScreen 
          setScreen={setScreen} 
          sliders={sliders}
          courses={visibleCourses} 
          notes={visibleNotes}
          quizzes={visibleQuizzes}
          unlockedCourseIds={unlockedCourseIds}
          onOpenCoursesTab={handleOpenCoursesTab}
          onOpenLiveClasses={() => setScreen('live-classes')}
        onBuyClick={handleRequestCourseUnlock}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
    }
  };

  const getTitle = () => {
    switch (screen) {
      case 'home': return 'Monto';
      case 'courses': return 'Courses';
      case 'notes': return 'Notes';
      case 'quiz': return 'Practice Quiz';
      case 'live-classes': return 'Live Classes';
      case 'profile': return 'My Profile';
      case 'settings': return 'Settings';
      case 'profile-edit': return 'Profile Information';
      case 'help-center': return 'Help Center';
      case 'support-chat': return 'Support Chat';
      case 'about-us': return 'About Us';
      case 'about-developer': return 'About Developer';
      case 'privacy-policy': return 'Privacy Policy';
      case 'my-courses': return 'My Courses';
      case 'offline-notes': return 'Download Note Offline';
      case 'video-player': return 'Video Player';
      case 'live-class-viewer': return 'Live Class';
      case 'course-details': return 'Course Details';
      case 'binaural-beats': return 'Binaural Beats';
      default: return 'Monto';
    }
  };

  const getBackScreen = () => {
    switch (screen) {
      case 'settings':
      case 'profile':
        return 'home';
      case 'profile-edit':
      case 'help-center':
      case 'support-chat':
        return 'settings';
      case 'about-us':
      case 'about-developer':
      case 'privacy-policy':
      case 'live-classes':
        return 'home';
      case 'live-class-viewer':
        return 'live-classes';
      case 'my-courses':
      case 'offline-notes':
        return 'profile';
      default:
        return 'home';
    }
  };

  if (!isManagementRoute && blockedAccount) {
    return (
      <div className={`mobile-container ${darkModeEnabled ? 'dark-mode' : ''}`}>
        <BlockedAccountScreen
          user={blockedAccount.user}
          message={blockedAccount.message}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  if (!isManagementRoute && appControlSettings.forceUpdate) {
    return (
      <div className={`mobile-container ${darkModeEnabled ? 'dark-mode' : ''}`}>
        <AppControlStopScreen
          title="Update required"
          message={`Please update ${appControlSettings.appName} to version ${appControlSettings.latestVersion || 'latest'} to continue.`}
          actionLabel="Update App"
          actionUrl={appControlSettings.updateUrl}
        />
      </div>
    );
  }

  if (!isManagementRoute && appControlSettings.maintenanceMode) {
    return (
      <div className={`mobile-container ${darkModeEnabled ? 'dark-mode' : ''}`}>
        <AppControlStopScreen
          title="App maintenance"
          message={appControlSettings.maintenanceMessage}
        />
      </div>
    );
  }

  if (!isManagementRoute && !isOnline && appControlSettings.offlinePage) {
    return (
      <div className={`mobile-container ${darkModeEnabled ? 'dark-mode' : ''}`}>
        <NoInternetScreen
          onRetry={() => {
            setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
            if (typeof navigator !== 'undefined' && navigator.onLine) {
              fetchAppData();
            }
          }}
        />
      </div>
    );
  }

  const studentProtectionClass = !isManagementRoute && screenProtectionActive ? 'protected-learning-surface' : '';
  const studentPolishClass = !isManagementRoute && !['video-player', 'note-viewer'].includes(screen) ? 'student-ui-polish' : '';
  const studentWatermark = `${user?.name || 'Student'} - ${user?.email || 'Monto'}`;

  return (
    <div
      className={isManagementRoute ? 'admin-shell' : `mobile-container ${darkModeEnabled ? 'dark-mode' : ''} ${studentProtectionClass} ${studentPolishClass}`}
      onContextMenu={!isManagementRoute && screenProtectionActive ? (event) => event.preventDefault() : undefined}
    >
      {!isManagementRoute && screenProtectionActive && (
        <div className="secure-watermark secure-watermark--app" aria-hidden="true">{studentWatermark}</div>
      )}
      {!isManagementRoute && screen !== 'video-player' && screen !== 'note-viewer' && screen !== 'course-details' && screen !== 'live-class-viewer' && (
        <Header 
          title={getTitle()} 
          user={user}
          showBack={screen !== 'home'} 
          onBack={goBackOneStep} 
          onMenuClick={() => setIsDrawerOpen(true)}
          onNotificationClick={handleNotificationIconClick}
          notificationCount={studentNotifications.length}
        />
      )}
      
      {!isManagementRoute && (
        <SideDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          user={user}
          setScreen={setScreen}
        />
      )}

      {!isManagementRoute && (
        <StudentNotificationsPanel
          isOpen={isNotificationsPanelOpen}
          notifications={studentNotifications}
          notificationsEnabled={notificationsEnabled}
          notificationStatus={notificationStatus}
          onClose={() => setIsNotificationsPanelOpen(false)}
          onEnableNotifications={handleEnableNotifications}
          onOpenNotification={handleOpenStudentNotification}
          onClearNotifications={handleClearStudentNotifications}
        />
      )}

      <AccessCodeModal 
        isOpen={!!selectedCourseForUnlock && !isCourseFree(selectedCourseForUnlock)}
        onClose={() => setSelectedCourseForUnlock(null)}
        onUnlock={handleUnlockCourse}
        courseTitle={selectedCourseForUnlock?.title || ''}
      />

      {!isManagementRoute && showControlledSplash && (
        <div className="controlled-splash" aria-hidden="true" />
      )}

      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {!isManagementRoute && showWelcomeMessage && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-5 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm rounded-[28px] bg-white p-5 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-primary">
              <Smartphone size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900">{appControlSettings.appName}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">{appControlSettings.welcomeMessage}</p>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-black text-white"
              onClick={() => {
                window.localStorage.setItem(APP_WELCOME_SEEN_KEY, appControlSettings.welcomeMessage);
                setShowWelcomeMessage(false);
              }}
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}

      {!isManagementRoute && screen !== 'video-player' && screen !== 'note-viewer' && screen !== 'course-details' && screen !== 'live-class-viewer' && (
        <BottomNav 
          activeScreen={screen} 
          setScreen={setScreen} 
          onCoursesClick={() => setScreen('my-courses')}
          onQuizClick={() => {
            setSelectedQuizTopic(null);
            setScreen('quiz');
          }}
        />
      )}
    </div>
  );
}
