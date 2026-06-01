import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import nodemailer from "nodemailer";
import { createHash, createSign, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { PoolConnection, RowDataPacket } from "./mysql.js";
import { execute, initDatabase, queryOne, queryRows, withTransaction } from "./mysql.js";

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
const parseCloudinaryUrl = (configuredUrl: string): CloudinaryConfig | null => {
  if (!configuredUrl) {
    return null;
  }
  try {
    const value = new URL(configuredUrl);
    if (value.protocol !== "cloudinary:") {
      return null;
    }
    return {
      cloudName: value.hostname,
      apiKey: decodeURIComponent(value.username),
      apiSecret: decodeURIComponent(value.password),
    };
  } catch {
    return null;
  }
};
const cloudinaryUrlConfig = parseCloudinaryUrl(process.env.CLOUDINARY_URL?.trim() || "");
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || cloudinaryUrlConfig?.cloudName || "",
  apiKey: process.env.CLOUDINARY_API_KEY?.trim() || cloudinaryUrlConfig?.apiKey || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || cloudinaryUrlConfig?.apiSecret || "",
};
const CLOUDINARY_PDF_CONFIG: CloudinaryConfig = parseCloudinaryUrl(process.env.CLOUDINARY_PDF_URL?.trim() || "") || {
  cloudName: "",
  apiKey: "",
  apiSecret: "",
};
const CLOUDINARY_THUMBNAIL_CONFIG: CloudinaryConfig =
  parseCloudinaryUrl(process.env.CLOUDINARY_THUMBNAIL_URL?.trim() || process.env.CLOUDINARY_ACCOUNT_2_URL?.trim() || "") ||
  CLOUDINARY_PDF_CONFIG;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER?.trim().replace(/^\/+|\/+$/g, "") || "monto";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME?.trim() || "";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";
const ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || "";
const SMTP_HOST = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false";
const SMTP_USER = process.env.GOOGLE_SMTP_USER?.trim() || process.env.SMTP_USER?.trim() || "";
const SMTP_PASS = process.env.GOOGLE_SMTP_APP_PASSWORD || process.env.SMTP_PASS || "";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL?.trim() || SMTP_USER;
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PASSWORD_PREFIX = "scrypt";
const APP_CONTROL_KEY = "app-control";
const NOTIFICATION_CHANNEL_UPDATES = "monto-updates";
const NOTIFICATION_SOUND_FILE = "rbs_wow_tone.wav";
const DEFAULT_APP_CONTROL_SETTINGS = {
  appName: "Monto",
  welcomeEnabled: true,
  welcomeMessage: "Welcome to Monto. Study smart, stay focused, and keep learning.",
  maintenanceMode: false,
  maintenanceMessage: "Monto is under maintenance. Please check back soon.",
  forceUpdate: false,
  latestVersion: "1.0.0",
  updateUrl: "",
  screenProtection: true,
  screenProtectionScope: "global",
  videoProtectionEnabled: true,
  videoNotesEnabled: true,
  videoDownloadEnabled: false,
  offlinePage: true,
  splashEnabled: true,
  pushEnabled: true,
  notificationTitle: "Monto",
  notificationBody: "New course update available.",
  notificationId: "",
  notificationSentAt: "",
};
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_NOTE_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_NOTE_BYTES = 15 * 1024 * 1024;
const uploadRoot = process.env.VERCEL
  ? path.join(os.tmpdir(), "monto-uploads")
  : path.join(process.cwd(), "uploads");

type DbUser = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  avatar_url?: string;
  class_level?: string;
  status?: string;
  user_category?: string;
  device_id?: string;
  device_label?: string;
  device_bound_at?: Date | string | null;
};
type DbCourse = RowDataPacket & { id: string; title: string; lessons: number; image: string; description?: string; price: number; oldPrice: number; type: string; category: string; access_code?: string };
type DbLesson = RowDataPacket & { id: string; course_id: string; title: string; duration: string; note_content: string; note_url?: string; video_url?: string; thumbnail_url?: string; download_url?: string; download_label?: string; download_enabled?: boolean; sort_order?: number };
type DbNote = RowDataPacket & { id: string; title: string; lessons: number; category: string; type: string; url?: string; content?: string };
type DbQuiz = RowDataPacket & { id: string; topic: string; type: string };
type DbQuestion = RowDataPacket & { id: string; quiz_id: string; text: string; options: string; correctAnswer: number; explanation: string; image_url?: string };
type DbSlider = RowDataPacket & { id: string; title: string; subtitle: string; image_url: string; drive_file_id?: string; sort_order: number; is_active: number | boolean };
type DbAppSetting = RowDataPacket & { key: string; value: string; updated_at?: Date | string };
type DbPushToken = RowDataPacket & {
  id: string;
  token: string;
  user_id?: string;
  device_id?: string;
  device_label?: string;
  platform?: string;
  created_at?: Date | string;
  last_seen_at?: Date | string;
};
type DbNotificationLog = RowDataPacket & {
  id: string;
  title: string;
  body: string;
  audience: string;
  screen: string;
  target_user_ids?: string;
  total_devices?: number;
  sent_count?: number;
  failed_count?: number;
  credential_missing?: boolean | number | string;
  errors?: string;
  sent_at?: Date | string;
};
type DbLiveClass = RowDataPacket & {
  id: string;
  title: string;
  description?: string;
  meeting_url: string;
  scheduled_at?: Date | string;
  access_type?: string;
  audience_type?: string;
  course_id?: string;
  selected_user_ids?: string;
  is_active?: number | boolean;
  created_at?: Date | string;
};
type DbAuthOtp = RowDataPacket & {
  id: string;
  email: string;
  purpose: "signup" | "password-reset";
  otp_hash: string;
  payload?: string;
  expires_at?: Date | string;
  used_at?: Date | string | null;
  attempts?: number;
};
type AdminRole = "admin" | "superadmin";
type DbAdminCredential = RowDataPacket & { id: string; role: AdminRole; username: string; password: string; created_at?: Date | string; updated_at?: Date | string };

const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(handler(req, res, next)).catch(next);

const createId = (prefix: string) => `${prefix}${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 8)}`;

const isValidStudentName = (value: string) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(value.trim());
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");
const normalizeStudentClassLevel = (value: unknown) => {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
  return normalized === "class-11" || normalized === "11" ? "class-11" : "class-12";
};
const normalizeDeviceId = (value: unknown) => String(value || "").trim().slice(0, 160);
const normalizeDeviceLabel = (value: unknown) => String(value || "Student mobile").trim().slice(0, 240);
const toBase64Url = (value: string) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");
const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${PASSWORD_PREFIX}:${salt}:${hash}`;
};
const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};
const verifyPassword = (password: string, storedPassword: string) => {
  if (!storedPassword.startsWith(`${PASSWORD_PREFIX}:`)) {
    return storedPassword === password;
  }

  const [, salt, expectedHash] = storedPassword.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(actualHash, expectedHash);
};
const createAccessCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `MONTO-${chunk()}-${chunk()}`;
};

const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));
const createTemporaryPassword = () => `MONTO${randomBytes(4).toString("hex").toUpperCase()}`;

const assertSmtpConfigured = () => {
  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
    throw new Error("Google SMTP is not configured. Set GOOGLE_SMTP_USER and GOOGLE_SMTP_APP_PASSWORD.");
  }
};

const sendEmail = async (to: string, subject: string, text: string) => {
  assertSmtpConfigured();
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Monto" <${SMTP_FROM_EMAIL}>`,
    to,
    subject,
    text,
  });
};

const saveOtp = async (
  email: string,
  purpose: DbAuthOtp["purpose"],
  otp: string,
  payload: Record<string, unknown> = {},
) => {
  await execute(
    "UPDATE auth_otps SET used_at = CURRENT_TIMESTAMP WHERE email = ? AND purpose = ? AND used_at IS NULL",
    [email, purpose],
  );
  await execute(
    "INSERT INTO auth_otps (id, email, purpose, otp_hash, payload, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)",
    [createId("otp"), email, purpose, hashValue(otp), JSON.stringify(payload), new Date(Date.now() + 10 * 60 * 1000)],
  );
};

const verifyOtp = async (email: string, purpose: DbAuthOtp["purpose"], otp: string) => {
  const record = await queryOne<DbAuthOtp>(
    "SELECT * FROM auth_otps WHERE email = ? AND purpose = ? AND used_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 1",
    [email, purpose],
  );
  if (!record) {
    return { ok: false, status: 400, message: "OTP not found. Please request a new OTP." } as const;
  }
  if (record.expires_at && new Date(record.expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 400, message: "OTP expired. Please request a new OTP." } as const;
  }
  if (Number(record.attempts || 0) >= 5) {
    return { ok: false, status: 429, message: "Too many OTP attempts. Please request a new OTP." } as const;
  }
  if (!safeEqual(String(record.otp_hash || ""), hashValue(String(otp || "").trim()))) {
    await execute("UPDATE auth_otps SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ?", [record.id]);
    return { ok: false, status: 401, message: "Invalid OTP" } as const;
  }

  await execute("UPDATE auth_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [record.id]);
  return { ok: true, record } as const;
};

const parseJsonArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(String(value || "[]"));
  } catch {
    return [];
  }
};

const normalizeMeetingUrl = (value: unknown) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isValidMeetingUrl = (value: unknown) => {
  try {
    const parsedUrl = new URL(normalizeMeetingUrl(value));
    return ["http:", "https:"].includes(parsedUrl.protocol) && parsedUrl.hostname.includes(".");
  } catch {
    return false;
  }
};

const normalizeQuestion = (question: Partial<DbQuestion> & { options?: unknown }) => ({
  ...question,
  options: parseJsonArray(question.options).map((option) => {
    if (option && typeof option === "object") {
      return option;
    }
    return String(option);
  }),
  correctAnswer: Number(question.correctAnswer || 0),
  image_url: String(question.image_url || ""),
  explanation: String(question.explanation || ""),
});

const decodeXmlEntity = (value: string) => value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&#x27;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(parseInt(code, 10)));

const extractXmlTagValue = (entry: string, tagName: string) => {
  const match = entry.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlEntity(match[1].trim()) : "";
};

const extractYoutubePlaylistId = (value: unknown) => {
  const url = String(value || "").trim();
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const listId = parsedUrl.searchParams.get("list");
    if (listId) return listId.trim();
    if (/youtube\.com$/i.test(parsedUrl.hostname) || /youtube\.com$/i.test(parsedUrl.hostname.replace(/^www\./, ""))) {
      const pathMatch = parsedUrl.pathname.match(/\/playlist\/([^/?]+)/i);
      if (pathMatch?.[1]) return pathMatch[1].trim();
    }
  } catch {}

  return /^[A-Za-z0-9_-]{10,}$/.test(url) ? url : "";
};

const youtubeEmbedUrl = (videoId: string) => `https://www.youtube-nocookie.com/embed/${videoId}`;
const youtubeThumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

const fetchYoutubePlaylistItems = async (playlistUrl: unknown) => {
  const playlistId = extractYoutubePlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error("Paste a valid YouTube playlist URL");
  }

  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`);
  if (!response.ok) {
    throw new Error("Unable to read this YouTube playlist. Make sure it is public.");
  }

  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
  const items = entries.map((entry) => {
    const videoId = extractXmlTagValue(entry, "yt:videoId");
    const title = extractXmlTagValue(entry, "media:title") || extractXmlTagValue(entry, "title") || "YouTube lesson";
    const thumbnail = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1] || "";
    return {
      videoId,
      title,
      thumbnail_url: decodeXmlEntity(thumbnail || youtubeThumbnailUrl(videoId)),
    };
  }).filter((item) => item.videoId);

  if (!items.length) {
    throw new Error("No public videos found in this playlist");
  }

  return items;
};

const normalizeSlider = (slider: Partial<DbSlider>) => ({
  ...slider,
  sort_order: Number(slider.sort_order || 0),
  is_active: typeof slider.is_active === "string"
    ? String(slider.is_active).toLowerCase() !== "false"
    : Boolean(slider.is_active),
  drive_file_id: String(slider.drive_file_id || ""),
});

const normalizeNotificationLog = (notification: Partial<DbNotificationLog>) => ({
  id: String(notification.id || ""),
  title: String(notification.title || ""),
  body: String(notification.body || ""),
  audience: String(notification.audience || "all"),
  screen: String(notification.screen || "home"),
  targetUserIds: parseJsonArray(notification.target_user_ids).map((item) => String(item)),
  totalDevices: Number(notification.total_devices || 0),
  sent: Number(notification.sent_count || 0),
  failed: Number(notification.failed_count || 0),
  credentialMissing: typeof notification.credential_missing === "string"
    ? notification.credential_missing.toLowerCase() === "true"
    : Boolean(notification.credential_missing),
  errors: parseJsonArray(notification.errors).map((item) => String(item)),
  sentAt: notification.sent_at ? new Date(notification.sent_at).toISOString() : "",
});

const normalizeAppControlSettings = (value: unknown) => {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
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
    updateUrl: String(record.updateUrl || ""),
    screenProtection: Boolean(record.screenProtection ?? DEFAULT_APP_CONTROL_SETTINGS.screenProtection),
    screenProtectionScope: String(record.screenProtectionScope || DEFAULT_APP_CONTROL_SETTINGS.screenProtectionScope) === "premium" ? "premium" : "global",
    videoProtectionEnabled: Boolean(record.videoProtectionEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoProtectionEnabled),
    videoNotesEnabled: Boolean(record.videoNotesEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoNotesEnabled),
    videoDownloadEnabled: Boolean(record.videoDownloadEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.videoDownloadEnabled),
    offlinePage: Boolean(record.offlinePage ?? DEFAULT_APP_CONTROL_SETTINGS.offlinePage),
    splashEnabled: Boolean(record.splashEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.splashEnabled),
    pushEnabled: Boolean(record.pushEnabled ?? DEFAULT_APP_CONTROL_SETTINGS.pushEnabled),
    notificationTitle: String(record.notificationTitle || DEFAULT_APP_CONTROL_SETTINGS.notificationTitle),
    notificationBody: String(record.notificationBody || DEFAULT_APP_CONTROL_SETTINGS.notificationBody),
    notificationId: String(record.notificationId || ""),
    notificationSentAt: String(record.notificationSentAt || ""),
  };
};

const getAppControlSettings = async () => {
  const row = await queryOne<DbAppSetting>("SELECT value FROM app_settings WHERE key = ?", [APP_CONTROL_KEY]);
  if (!row?.value) {
    return DEFAULT_APP_CONTROL_SETTINGS;
  }

  try {
    return normalizeAppControlSettings(JSON.parse(String(row.value)));
  } catch {
    return DEFAULT_APP_CONTROL_SETTINGS;
  }
};

const getFirebaseServiceAccount = () => {
  const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  if (!rawValue.trim()) {
    return null;
  }

  try {
    const decoded = rawValue.trim().startsWith("{")
      ? rawValue
      : Buffer.from(rawValue.trim(), "base64").toString("utf8");
    const account = JSON.parse(decoded) as { project_id?: string; client_email?: string; private_key?: string };
    if (!account.project_id || !account.client_email || !account.private_key) {
      return null;
    }
    return account;
  } catch {
    return null;
  }
};

let firebaseTokenCache: { token: string; expiresAt: number } | null = null;

const getFirebaseAccessToken = async () => {
  if (firebaseTokenCache && firebaseTokenCache.expiresAt > Date.now() + 60_000) {
    return firebaseTokenCache.token;
  }

  const serviceAccount = getFirebaseServiceAccount();
  if (!serviceAccount) {
    return "";
  }

  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const encodedClaims = toBase64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(serviceAccount.private_key.replace(/\\n/g, "\n"), "base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || "Unable to authorize Firebase Cloud Messaging.");
  }

  firebaseTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return data.access_token;
};

const sendFirebasePushToToken = async (
  token: string,
  notification: { title: string; body: string; data?: Record<string, string> },
) => {
  const serviceAccount = getFirebaseServiceAccount();
  const legacyServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || "";

  if (serviceAccount) {
    const accessToken = await getFirebaseAccessToken();
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          android: {
            priority: "HIGH",
            notification: {
              channel_id: NOTIFICATION_CHANNEL_UPDATES,
              sound: NOTIFICATION_SOUND_FILE,
            },
          },
        },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String((data as Record<string, unknown>)?.error || "FCM send failed"));
    }
    return;
  }

  if (legacyServerKey) {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${legacyServerKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        priority: "high",
        notification: {
          title: notification.title,
          body: notification.body,
          sound: NOTIFICATION_SOUND_FILE,
          channel_id: NOTIFICATION_CHANNEL_UPDATES,
        },
        data: notification.data || {},
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || Number((data as { failure?: number }).failure || 0) > 0) {
      throw new Error(String((data as Record<string, unknown>)?.error || "FCM send failed"));
    }
  }
};

const hasFirebasePushCredentials = () => Boolean(getFirebaseServiceAccount() || process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY);

const normalizeSliderForClient = (slider: Partial<DbSlider>) => {
  const normalized = normalizeSlider(slider);
  return {
    ...normalized,
    image_url: String(normalized.image_url || ""),
  };
};

const normalizeLiveClass = (liveClass: Partial<DbLiveClass>) => ({
  id: String(liveClass.id || ""),
  title: String(liveClass.title || ""),
  description: String(liveClass.description || ""),
  meeting_url: String(liveClass.meeting_url || ""),
  scheduled_at: liveClass.scheduled_at ? new Date(liveClass.scheduled_at).toISOString() : "",
  access_type: String(liveClass.access_type || "free").toLowerCase() === "premium" ? "premium" : "free",
  audience_type: ["course", "selected"].includes(String(liveClass.audience_type || "").toLowerCase())
    ? String(liveClass.audience_type).toLowerCase()
    : "all",
  course_id: String(liveClass.course_id || ""),
  selected_user_ids: parseJsonArray(liveClass.selected_user_ids).map((item) => String(item)).filter(Boolean),
  is_active: typeof liveClass.is_active === "string"
    ? String(liveClass.is_active).toLowerCase() !== "false"
    : Boolean(liveClass.is_active),
  created_at: liveClass.created_at ? new Date(liveClass.created_at).toISOString() : "",
});

const resolveLiveClassCourseId = (audienceType: string, courseId: unknown) => {
  if (audienceType !== "course") {
    return null;
  }

  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("Choose a course for course-based live class visibility");
  }

  return normalizedCourseId;
};

const resolveLiveClassAudience = async (audienceType: string, courseId: unknown, selectedUserIds: unknown) => {
  const normalizedCourseId = resolveLiveClassCourseId(audienceType, courseId);
  let normalizedSelectedUserIds: string[] = Array.from(new Set(parseJsonArray(selectedUserIds).map((item) => String(item)).filter(Boolean)));

  if (audienceType === "course") {
    const course = await queryOne<RowDataPacket>("SELECT id FROM courses WHERE id = ?", [normalizedCourseId]);
    if (!course) {
      throw new Error("Selected course was not found. Refresh courses and choose again.");
    }
    normalizedSelectedUserIds = [];
  }

  if (audienceType === "selected") {
    if (!normalizedSelectedUserIds.length) {
      throw new Error("Choose at least one student for selected live class visibility");
    }
    const existingUsers = await queryRows<RowDataPacket & { id: string }>("SELECT id FROM users WHERE id = ANY($1::text[])", [normalizedSelectedUserIds]);
    const existingIds = new Set(existingUsers.map((user) => String(user.id)));
    normalizedSelectedUserIds = normalizedSelectedUserIds.filter((userId) => existingIds.has(userId));
    if (!normalizedSelectedUserIds.length) {
      throw new Error("Selected students were not found. Refresh students and choose again.");
    }
  }

  return {
    courseId: audienceType === "course" ? normalizedCourseId : null,
    selectedUserIds: audienceType === "selected" ? normalizedSelectedUserIds : [],
  };
};

const parseImagePayload = (
  payload: Record<string, unknown>,
  options: { dataKey?: string; urlKeys?: string[] } = {},
) => {
  const dataKey = options.dataKey || "imageData";
  const urlKeys = options.urlKeys || ["image_url"];
  const imageData = typeof payload[dataKey] === "string" ? String(payload[dataKey]).trim() : "";
  const imageUrl = urlKeys
    .map((key) => (typeof payload[key] === "string" ? String(payload[key]).trim() : ""))
    .find(Boolean) || "";

  if (!imageData) {
    return { imageData: "", imageUrl, mimeType: "" };
  }

  const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    return { imageData: "", imageUrl, mimeType: "" };
  }

  return {
    imageData: matches[2],
    imageUrl,
    mimeType: matches[1].toLowerCase(),
  };
};

const assertValidImagePayload = (imageData: string, mimeType: string) => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported image type");
  }

  const byteLength = Buffer.byteLength(imageData, "base64");
  if (!byteLength || byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be smaller than 8 MB");
  }
};

const assertCloudinaryConfigured = (config: CloudinaryConfig, mediaType = "media") => {
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    if (mediaType === "PDF") {
      throw new Error("PDF Cloudinary storage is not configured. Set CLOUDINARY_PDF_URL.");
    }
    if (mediaType === "thumbnail") {
      throw new Error("Thumbnail Cloudinary storage is not configured. Set CLOUDINARY_THUMBNAIL_URL or CLOUDINARY_ACCOUNT_2_URL.");
    }
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
};

const optimizeCloudinaryImageUrl = (url: string) =>
  url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");

const getCloudinaryConfigForUpload = (mimeType: string) => {
  if (mimeType === "application/pdf") {
    assertCloudinaryConfigured(CLOUDINARY_PDF_CONFIG, "PDF");
    return CLOUDINARY_PDF_CONFIG;
  }
  assertCloudinaryConfigured(CLOUDINARY_CONFIG);
  return CLOUDINARY_CONFIG;
};

const isThumbnailUpload = (assetFolder: string, prefix: string) =>
  (assetFolder === "courses" && prefix === "course-thumbnail") ||
  (assetFolder === "lessons" && prefix === "video-thumbnail");

const getCloudinaryConfigForContentImage = (assetFolder: string, prefix: string) => {
  if (isThumbnailUpload(assetFolder, prefix)) {
    assertCloudinaryConfigured(CLOUDINARY_THUMBNAIL_CONFIG, "thumbnail");
    return CLOUDINARY_THUMBNAIL_CONFIG;
  }
  assertCloudinaryConfigured(CLOUDINARY_CONFIG);
  return CLOUDINARY_CONFIG;
};

const createCloudinaryUploadAuthorization = (
  assetFolder: string,
  prefix: string,
  resourceType: "image" | "raw",
  fileName = "",
  config = CLOUDINARY_CONFIG,
) => {
  assertCloudinaryConfigured(config);
  const timestamp = Math.floor(Date.now() / 1000);
  const extension = resourceType === "raw" ? (fileName.match(/\.[A-Za-z0-9]{1,8}$/)?.[0] || "") : "";
  const publicId = `${CLOUDINARY_FOLDER}/${assetFolder}/${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");
  return { timestamp, publicId, signature, resourceType };
};

const uploadToCloudinary = async (
  assetFolder: string,
  prefix: string,
  data: string,
  mimeType: string,
  resourceType: "image" | "raw",
  fileName = "",
  config = CLOUDINARY_CONFIG,
) => {
  const { timestamp, publicId, signature } = createCloudinaryUploadAuthorization(assetFolder, prefix, resourceType, fileName, config);
  const form = new FormData();
  form.append("file", `data:${mimeType};base64,${data}`);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(`Cloudinary upload failed: ${result.error?.message || response.statusText}`);
  }

  return resourceType === "image" ? optimizeCloudinaryImageUrl(result.secure_url) : result.secure_url;
};

const saveSliderImage = async (payload: Record<string, unknown>) => {
  const { imageData, imageUrl, mimeType } = parseImagePayload(payload);
  if (!imageData) {
    return imageUrl;
  }

  assertValidImagePayload(imageData, mimeType);
  return uploadToCloudinary("sliders", "slider", imageData, mimeType, "image");
};

const saveQuestionImage = async (payload: Record<string, unknown>) => {
  const { imageData, imageUrl, mimeType } = parseImagePayload(payload, {
    dataKey: "questionImageData",
    urlKeys: ["image_url", "imageUrl", "questionImage"],
  });

  if (!imageData) {
    return imageUrl;
  }

  assertValidImagePayload(imageData, mimeType);
  return uploadToCloudinary("questions", "question", imageData, mimeType, "image");
};

const saveContentImage = async (
  payload: Record<string, unknown>,
  assetFolder: string,
  prefix: string,
  urlKey: string,
) => {
  const { imageData, imageUrl, mimeType } = parseImagePayload(payload, { urlKeys: [urlKey] });
  if (!imageData) {
    return imageUrl;
  }

  assertValidImagePayload(imageData, mimeType);
  return uploadToCloudinary(
    assetFolder,
    prefix,
    imageData,
    mimeType,
    "image",
    "",
    getCloudinaryConfigForContentImage(assetFolder, prefix),
  );
};

const saveNoteFile = async (payload: Record<string, unknown>) => {
  const fileUrl = typeof payload.url === "string" ? payload.url.trim() : "";
  const fileData = typeof payload.fileData === "string" ? payload.fileData.trim() : "";
  if (!fileData) {
    return fileUrl;
  }

  const matches = fileData.match(/^data:([^;,]+);base64,(.+)$/);
  const mimeType = String(payload.mimeType || matches?.[1] || "").toLowerCase();
  const data = matches?.[2] || "";
  if (!data || !ALLOWED_NOTE_MIME_TYPES.has(mimeType)) {
    throw new Error("Only PDF, image, DOC, PPT, XLS, TXT, and MD note files are supported");
  }
  const byteLength = Buffer.byteLength(data, "base64");
  if (!byteLength || byteLength > MAX_NOTE_BYTES) {
    throw new Error("Note file must be 15 MB or smaller");
  }

  return uploadToCloudinary(
    "notes",
    "note",
    data,
    mimeType,
    "raw",
    String(payload.fileName || ""),
    getCloudinaryConfigForUpload(mimeType),
  );
};

const deleteStoredImage = async (imageUrl?: string, localPrefix = "/uploads/") => {
  if (!imageUrl) {
    return;
  }

  const cloudinaryMatch = String(imageUrl).match(
    /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|raw)\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/,
  );
  const cloudinaryConfig = [CLOUDINARY_CONFIG, CLOUDINARY_PDF_CONFIG, CLOUDINARY_THUMBNAIL_CONFIG]
    .find((config) => config.cloudName && config.cloudName === cloudinaryMatch?.[1]);
  if (cloudinaryMatch && cloudinaryConfig?.apiKey && cloudinaryConfig.apiSecret) {
    const resourceType = cloudinaryMatch[2];
    const publicId = resourceType === "image"
      ? cloudinaryMatch[3].replace(/\.[^/.?]+(?:\?.*)?$/, "")
      : cloudinaryMatch[3].split("?")[0];
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`)
      .digest("hex");
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", cloudinaryConfig.apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    try {
      await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryConfig.cloudName)}/${resourceType}/destroy`,
        { method: "POST", body: form },
      );
    } catch {}
    return;
  }

  if (!imageUrl.startsWith(localPrefix)) {
    return;
  }

  const filePath = path.resolve(uploadRoot, imageUrl.replace(/^\/uploads\//, ""));
  const safeRoot = path.resolve(uploadRoot);
  if (!filePath.startsWith(safeRoot + path.sep)) {
    return;
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getGrantedCourseIds = async (userId: string) => {
  const rows = await queryRows<RowDataPacket & { course_id: string }>(
    "SELECT course_id FROM enrollments WHERE user_id = ? AND COALESCE(status, 'active') = 'active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY granted_at DESC, id DESC",
    [userId],
  );
  return rows.map((item) => String(item.course_id || "").trim()).filter(Boolean);
};

const getBlockedCourseIds = async (userId: string) => {
  const rows = await queryRows<RowDataPacket & { course_id: string }>(
    "SELECT course_id FROM enrollments WHERE user_id = ? AND COALESCE(status, 'active') = 'blocked' ORDER BY granted_at DESC, id DESC",
    [userId],
  );
  return rows.map((item) => String(item.course_id || "").trim()).filter(Boolean);
};

const getComputedUserCategory = (user: Partial<DbUser>, grantedCourseIds: string[]) =>
  grantedCourseIds.length > 0 ? "premium" : String(user.user_category || "free").toLowerCase() === "premium" ? "premium" : "free";

const syncUserCategory = async (userId: string) => {
  const premiumEnrollment = await queryOne<RowDataPacket & { course_id: string }>(
    `SELECT e.course_id
     FROM enrollments e
     INNER JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ?
       AND COALESCE(e.status, 'active') = 'active'
       AND (e.expires_at IS NULL OR e.expires_at > CURRENT_TIMESTAMP)
       AND LOWER(COALESCE(c.type, 'free')) = 'premium'
     LIMIT 1`,
    [userId],
  );
  const nextCategory = premiumEnrollment ? "premium" : "free";
  await execute("UPDATE users SET user_category = ? WHERE id = ?", [nextCategory, userId]);
  return nextCategory;
};

const getFreshNormalizedUser = async (userId: string) => {
  const user = await queryOne<DbUser>("SELECT * FROM users WHERE id = ?", [userId]);
  return user ? normalizeUser(user) : null;
};

const canUserViewLiveClass = (
  liveClass: ReturnType<typeof normalizeLiveClass>,
  userId: string,
  grantedCourseIds: string[],
) => {
  if (!liveClass.is_active) {
    return false;
  }

  if (liveClass.access_type === "premium" && !grantedCourseIds.length) {
    return false;
  }

  if (liveClass.audience_type === "all") {
    return true;
  }

  if (liveClass.audience_type === "course") {
    return !!liveClass.course_id && grantedCourseIds.includes(liveClass.course_id);
  }

  return liveClass.selected_user_ids.includes(userId);
};

const normalizeUser = async (user: Pick<DbUser, "id" | "name" | "email" | "phone"> & Partial<DbUser>) => {
  const grantedCourseIds = await getGrantedCourseIds(String(user.id));
  const blockedCourseIds = await getBlockedCourseIds(String(user.id));
  const deviceBoundAt = user.device_bound_at ? new Date(user.device_bound_at).toISOString() : "";
  return {
    id: String(user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    phone: String(user.phone || ""),
    avatarUrl: String(user.avatar_url || ""),
    classLevel: normalizeStudentClassLevel(user.class_level),
    status: String((user as Partial<DbUser>).status || "active"),
    userCategory: getComputedUserCategory(user, grantedCourseIds),
    grantedCourseIds,
    blockedCourseIds,
    deviceId: String(user.device_id || ""),
    deviceLabel: String(user.device_label || ""),
    deviceBoundAt,
    deviceLocked: Boolean(user.device_id),
  };
};

const normalizeUsers = async (users: (Pick<DbUser, "id" | "name" | "email" | "phone"> & Partial<DbUser>)[]) => {
  const userIds = users.map((user) => String(user.id)).filter(Boolean);
  const enrollments = userIds.length
    ? await queryRows<RowDataPacket & { user_id: string; course_id: string; status?: string; expires_at?: Date }>(
        "SELECT user_id, course_id, status, expires_at FROM enrollments WHERE user_id = ANY($1::text[]) ORDER BY granted_at DESC, id DESC",
        [userIds],
      )
    : [];
  const courseIdsByUser = new Map<string, string[]>();
  const blockedCourseIdsByUser = new Map<string, string[]>();

  for (const enrollment of enrollments) {
    const userId = String(enrollment.user_id || "").trim();
    const courseId = String(enrollment.course_id || "").trim();
    if (!userId || !courseId) {
      continue;
    }

    if (String(enrollment.status || "active").toLowerCase() === "blocked") {
      const currentBlockedIds = blockedCourseIdsByUser.get(userId) || [];
      if (!currentBlockedIds.includes(courseId)) {
        currentBlockedIds.push(courseId);
      }
      blockedCourseIdsByUser.set(userId, currentBlockedIds);
      continue;
    }

    if (enrollment.expires_at && new Date(enrollment.expires_at).getTime() <= Date.now()) {
      continue;
    }

    const currentCourseIds = courseIdsByUser.get(userId) || [];
    if (!currentCourseIds.includes(courseId)) {
      currentCourseIds.push(courseId);
    }
    courseIdsByUser.set(userId, currentCourseIds);
  }

  return users.map((user) => ({
    id: String(user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    phone: String(user.phone || ""),
    avatarUrl: String(user.avatar_url || ""),
    classLevel: normalizeStudentClassLevel(user.class_level),
    status: String(user.status || "active"),
    userCategory: getComputedUserCategory(user, courseIdsByUser.get(String(user.id)) || []),
    grantedCourseIds: courseIdsByUser.get(String(user.id)) || [],
    blockedCourseIds: blockedCourseIdsByUser.get(String(user.id)) || [],
    deviceId: String(user.device_id || ""),
    deviceLabel: String(user.device_label || ""),
    deviceBoundAt: user.device_bound_at ? new Date(user.device_bound_at).toISOString() : "",
    deviceLocked: Boolean(user.device_id),
  }));
};

const verifyAndBindUserDevice = async (user: DbUser, deviceId: string, deviceLabel: string) => {
  const normalizedDeviceId = normalizeDeviceId(deviceId);
  const normalizedDeviceLabel = normalizeDeviceLabel(deviceLabel);
  const existingDeviceId = normalizeDeviceId(user.device_id);

  if (!normalizedDeviceId) {
    return {
      ok: false,
      status: 400,
      message: "Device verification failed. Please update the app and login again.",
    };
  }

  if (existingDeviceId && existingDeviceId !== normalizedDeviceId) {
    return {
      ok: false,
      status: 403,
      message: "This student ID is already active on another mobile. Contact admin to reset device.",
      deviceLocked: true,
    };
  }

  if (!existingDeviceId) {
    await execute(
      "UPDATE users SET device_id = ?, device_label = ?, device_bound_at = CURRENT_TIMESTAMP WHERE id = ?",
      [normalizedDeviceId, normalizedDeviceLabel, user.id],
    );
    user.device_id = normalizedDeviceId;
    user.device_label = normalizedDeviceLabel;
    user.device_bound_at = new Date();
  }

  return { ok: true, status: 200, message: "Device verified" };
};

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const checkLoginRateLimit = (req: Request, res: Response) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (current.count >= 10) {
    res.status(429).json({ success: false, message: "Too many login attempts. Try again later." });
    return false;
  }

  current.count += 1;
  return true;
};

const createAdminToken = (role: AdminRole, username: string) => {
  if (!ADMIN_AUTH_SECRET) {
    throw new Error("Admin authentication is not configured. Set ADMIN_AUTH_SECRET.");
  }

  const payload = JSON.stringify({
    role,
    username,
    exp: Date.now() + ADMIN_SESSION_TTL_MS,
    nonce: randomUUID(),
  });
  const encodedPayload = toBase64Url(payload);
  const signature = hashValue(`${encodedPayload}.${ADMIN_AUTH_SECRET}`);
  return `${encodedPayload}.${signature}`;
};

const seedAdminCredential = async (role: AdminRole, username: string, password: string) => {
  const trimmedUsername = username.trim();
  if (!trimmedUsername || !password) {
    return;
  }

  const existing = await queryOne<DbAdminCredential>(
    "SELECT id FROM admin_credentials WHERE role = ? AND LOWER(username) = LOWER(?)",
    [role, trimmedUsername],
  );
  if (existing) {
    return;
  }

  const now = new Date();
  await execute(
    "INSERT INTO admin_credentials (id, role, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [createId("ad"), role, trimmedUsername, hashPassword(password), now, now],
  );
};

const seedConfiguredAdminCredentials = async () => {
  await seedAdminCredential("admin", ADMIN_USERNAME, ADMIN_PASSWORD);
  await seedAdminCredential("superadmin", SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD);
};

const getAdminCredential = async (role: AdminRole, username: string) =>
  queryOne<DbAdminCredential>(
    "SELECT * FROM admin_credentials WHERE role = ? AND LOWER(username) = LOWER(?)",
    [role, username.trim()],
  );

const serializeAdminCredential = (credential: DbAdminCredential) => ({
  id: String(credential.id),
  role: credential.role,
  username: String(credential.username || ""),
  createdAt: credential.created_at || null,
  updatedAt: credential.updated_at || null,
});

const verifyAdminToken = (token: string) => {
  if (!ADMIN_AUTH_SECRET || !token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = hashValue(`${encodedPayload}.${ADMIN_AUTH_SECRET}`);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as {
      role?: AdminRole;
      username?: string;
      exp?: number;
    };

    if (!payload.username || !payload.role || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const requireAdmin = (roles: AdminRole[] = ["admin", "superadmin"]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = verifyAdminToken(token);

    if (!session || !roles.includes(session.role)) {
      res.status(401).json({ success: false, message: "Admin authentication required" });
      return;
    }

    next();
  };

const getImportedQuestionSource = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  const record = (payload && typeof payload === "object" ? payload : {}) as {
    questions?: unknown[];
    quiz?: { questions?: unknown[] };
    data?: { questions?: unknown[] };
    question?: unknown;
    text?: unknown;
    title?: unknown;
  };
  if (record.questions || record.quiz?.questions || record.data?.questions) {
    return record.questions || record.quiz?.questions || record.data?.questions || [];
  }
  return record.question || record.text || record.title ? [record] : [];
};

const getQuizOptionText = (option: unknown) => {
  if (option && typeof option === "object") {
    const record = option as Record<string, unknown>;
    const type = String(record.type || "").toLowerCase();
    return String(record.text || record.label || record.option || (type !== "image" ? record.value : "") || "").trim();
  }

  return String(option || "").trim();
};

const normalizeStoredQuizOption = (option: unknown) => {
  if (option && typeof option === "object") {
    const record = option as Record<string, unknown>;
    const type = String(record.type || "").trim();
    const value = String(record.value || "").trim();
    const imageUrl = String(record.image_url || record.imageUrl || record.image || (type.toLowerCase() === "image" ? value : "")).trim();
    const text = String(record.text || record.label || record.option || (type.toLowerCase() !== "image" ? value : "")).trim();
    if (imageUrl && !text) {
      return { type: "image", value: imageUrl };
    }
    if (imageUrl) {
      return { type: type || "text", value: text, image_url: imageUrl };
    }
    return text;
  }

  return String(option || "").trim();
};

const getImportedQuestionOptions = (record: Record<string, unknown>) => {
  if (Array.isArray(record.options)) {
    return record.options
      .map((option) => normalizeStoredQuizOption(option))
      .filter((option) => getQuizOptionText(option));
  }
  return [
    record.option1,
    record.option2,
    record.option3,
    record.option4,
    record.option5,
    record.a,
    record.b,
    record.c,
    record.d,
    record.e,
  ].map((value) => String(value || "").trim()).filter(Boolean);
};

const normalizeImportedQuestions = (payload: unknown) => {
  const source = getImportedQuestionSource(payload);
  if (source.length === 0) {
    throw new Error("Questions array is required");
  }

  return source.map((item, index) => {
    const record = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const text = String(record.text || record.question || record.title || "").trim();
    const options = getImportedQuestionOptions(record);
    const explanation = String(record.explanation || "").trim();
    const image_url = String(record.image_url || record.imageUrl || record.image || record.questionImage || "").trim();
    const answerValue = record.correct_answer ?? record.correctAnswer ?? record.answer ?? record.correct_option ?? record.correctOption ?? record.correct ?? 0;

    let correctAnswer = 0;
    if (typeof answerValue === "number" && Number.isFinite(answerValue)) {
      correctAnswer = answerValue;
    } else {
      const normalizedAnswer = String(answerValue).trim();
      const normalizedLetter = normalizedAnswer.toUpperCase();
      if (/^[A-E]$/.test(normalizedLetter)) {
        correctAnswer = normalizedLetter.charCodeAt(0) - 65;
      } else {
        const optionIndex = options.findIndex((option) => getQuizOptionText(option).toLowerCase() === normalizedAnswer.toLowerCase());
        correctAnswer = optionIndex >= 0 ? optionIndex : Number(normalizedAnswer) || 0;
      }
    }

    if (correctAnswer >= options.length && correctAnswer - 1 < options.length) {
      correctAnswer -= 1;
    }

    if (!text || options.length < 2 || correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`Invalid question at position ${index + 1}`);
    }

    return {
      id: createId("qn"),
      text,
      options,
      correctAnswer,
      explanation,
      image_url,
    };
  });
};

const removeQuestionById = async (id: string, connection?: PoolConnection) => {
  const current = connection
    ? await connection.query<DbQuestion>("SELECT * FROM questions WHERE id = ?", [id]).then(([rows]) => rows[0] || null)
    : await queryOne<DbQuestion>("SELECT * FROM questions WHERE id = ?", [id]);
  if (!current) {
    return false;
  }

  await deleteStoredImage(current.image_url, "/uploads/questions/");
  if (connection) {
    await connection.execute("DELETE FROM questions WHERE id = ?", [id]);
  } else {
    await execute("DELETE FROM questions WHERE id = ?", [id]);
  }
  return true;
};

const removeQuestionsForQuiz = async (quizId: string, connection?: PoolConnection) => {
  const rows = connection
    ? await connection.query<RowDataPacket>("SELECT id FROM questions WHERE quiz_id = ?", [quizId]).then(([result]) => result)
    : await queryRows<RowDataPacket>("SELECT id FROM questions WHERE quiz_id = ?", [quizId]);
  for (const question of rows) {
    await removeQuestionById(String(question.id), connection);
  }
};

export const createApiApp = async () => {
  await initDatabase();
  await seedConfiguredAdminCredentials();

  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    const scriptSrc = process.env.NODE_ENV === "production" ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'";
    res.setHeader("Content-Security-Policy", `default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; ${scriptSrc}; style-src 'self' 'unsafe-inline'; connect-src 'self' https: ws:; frame-src https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://youtu.be; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`);
    next();
  });
  app.use(express.json({ limit: "22mb" }));
  app.use("/uploads", express.static(uploadRoot));

  app.get("/api/health", asyncHandler(async (_req, res) => {
    const courseCount = await queryOne<RowDataPacket & { count: number }>("SELECT COUNT(*)::int AS count FROM courses");
    res.json({
      success: true,
      database: "connected",
      courses: Number(courseCount?.count || 0),
      appControl: await getAppControlSettings(),
    });
  }));

  app.post("/api/admin/login", asyncHandler(async (req, res) => {
    if (!checkLoginRateLimit(req, res)) {
      return;
    }

    const { username, password, mode } = req.body || {};
    const requestedRole: AdminRole = mode === "superadmin" ? "superadmin" : "admin";
    const submittedUsername = String(username || "").trim();

    if (!ADMIN_AUTH_SECRET) {
      res.status(503).json({ success: false, message: "Admin login is not configured" });
      return;
    }

    const credential = submittedUsername
      ? await getAdminCredential(requestedRole, submittedUsername)
      : null;
    const fallbackUsername = requestedRole === "superadmin" ? SUPER_ADMIN_USERNAME : ADMIN_USERNAME;
    const fallbackPassword = requestedRole === "superadmin" ? SUPER_ADMIN_PASSWORD : ADMIN_PASSWORD;
    const envCredentialMatches =
      fallbackUsername
      && fallbackPassword
      && submittedUsername.toLowerCase() === fallbackUsername.toLowerCase()
      && safeEqual(String(password || ""), fallbackPassword);

    if ((!credential || !verifyPassword(String(password || ""), credential.password)) && !envCredentialMatches) {
      res.status(401).json({ success: false, message: "Invalid admin credentials" });
      return;
    }

    if (!credential && envCredentialMatches) {
      await seedAdminCredential(requestedRole, fallbackUsername, fallbackPassword);
    }

    const authenticatedUsername = credential?.username || fallbackUsername;
    const token = createAdminToken(requestedRole, authenticatedUsername);
    res.json({
      success: true,
      session: {
        role: requestedRole,
        username: authenticatedUsername,
        token,
      },
    });
  }));

  app.get("/api/admin/accounts", requireAdmin(["superadmin"]), asyncHandler(async (_req, res) => {
    const accounts = await queryRows<DbAdminCredential>(
      "SELECT id, role, username, created_at, updated_at FROM admin_credentials ORDER BY role DESC, username ASC",
    );
    res.json({ success: true, accounts: accounts.map(serializeAdminCredential) });
  }));

  app.post("/api/createAdminAccount", requireAdmin(["superadmin"]), asyncHandler(async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const role: AdminRole = req.body?.role === "superadmin" ? "superadmin" : "admin";

    if (!username || !password) {
      res.status(400).json({ success: false, message: "Admin username and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Admin password must be at least 6 characters" });
      return;
    }

    const existing = await getAdminCredential(role, username);
    const now = new Date();
    if (existing) {
      await execute(
        "UPDATE admin_credentials SET password = ?, updated_at = ? WHERE id = ?",
        [hashPassword(password), now, existing.id],
      );
      const updated = await queryOne<DbAdminCredential>("SELECT id, role, username, created_at, updated_at FROM admin_credentials WHERE id = ?", [existing.id]);
      res.json({ success: true, message: "Admin account updated", account: updated ? serializeAdminCredential(updated) : null });
      return;
    }

    const id = createId("ad");
    await execute(
      "INSERT INTO admin_credentials (id, role, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, role, username, hashPassword(password), now, now],
    );
    const account = await queryOne<DbAdminCredential>("SELECT id, role, username, created_at, updated_at FROM admin_credentials WHERE id = ?", [id]);
    res.status(201).json({ success: true, message: "Admin account created", account: account ? serializeAdminCredential(account) : null });
  }));

  app.post("/api/deleteAdminAccount", requireAdmin(["superadmin"]), asyncHandler(async (req, res) => {
    const id = String(req.body?.id || "").trim();
    if (!id) {
      res.status(400).json({ success: false, message: "Admin account id is required" });
      return;
    }

    const current = await queryOne<DbAdminCredential>("SELECT * FROM admin_credentials WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Admin account not found" });
      return;
    }

    const roleCount = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*)::int AS count FROM admin_credentials WHERE role = ?",
      [current.role],
    );
    if (Number(roleCount?.count || 0) <= 1) {
      res.status(400).json({ success: false, message: `At least one ${current.role} account is required` });
      return;
    }

    await execute("DELETE FROM admin_credentials WHERE id = ?", [id]);
    res.json({ success: true, message: "Admin account deleted" });
  }));

  app.post("/api/request-signup-otp", asyncHandler(async (req, res) => {
    const { name, email, phone, classLevel, password, deviceId, deviceLabel } = req.body || {};
    const trimmedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(String(email || ""));
    const normalizedPhone = normalizePhoneNumber(String(phone || ""));
    const normalizedClassLevel = normalizeStudentClassLevel(classLevel);
    const normalizedDeviceId = normalizeDeviceId(deviceId);
    const normalizedDeviceLabel = normalizeDeviceLabel(deviceLabel);

    if (!trimmedName || !normalizedEmail || !password || !normalizedPhone) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    if (!normalizedDeviceId) {
      res.status(400).json({ success: false, message: "Device verification failed. Please update the app and try again." });
      return;
    }

    if (!isValidStudentName(trimmedName)) {
      res.status(400).json({ success: false, message: "Name must contain letters only" });
      return;
    }

    if (normalizedPhone.length < 10) {
      res.status(400).json({ success: false, message: "Valid phone number is required" });
      return;
    }

    const existingUser = await queryOne<DbUser>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (existingUser) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const otp = createOtpCode();
    await saveOtp(normalizedEmail, "signup", otp, {
      name: trimmedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      classLevel: normalizedClassLevel,
      passwordHash: hashPassword(String(password)),
      deviceId: normalizedDeviceId,
      deviceLabel: normalizedDeviceLabel,
    });
    await sendEmail(
      normalizedEmail,
      "Monto email verification OTP",
      `Your Monto signup OTP is ${otp}. It expires in 10 minutes.`,
    );
    res.json({ success: true, message: "OTP sent to your email" });
  }));

  app.post("/api/verify-signup-otp", asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(String(req.body?.email || ""));
    const otp = String(req.body?.otp || "").trim();
    if (!normalizedEmail || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }

    const verification = await verifyOtp(normalizedEmail, "signup", otp);
    if (!verification.ok) {
      res.status(verification.status).json({ success: false, message: verification.message });
      return;
    }

    const payload = JSON.parse(String(verification.record.payload || "{}")) as {
      name?: string;
      email?: string;
      phone?: string;
      classLevel?: string;
      passwordHash?: string;
      deviceId?: string;
      deviceLabel?: string;
    };
    const existingUser = await queryOne<DbUser>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (existingUser) {
      res.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const id = `u${Date.now()}`;
    await execute(
      "INSERT INTO users (id, name, email, phone, password, class_level, status, user_category, device_id, device_label, device_bound_at) VALUES (?, ?, ?, ?, ?, ?, 'active', 'free', ?, ?, CURRENT_TIMESTAMP)",
      [
        id,
        String(payload.name || "Student").trim(),
        normalizedEmail,
        String(payload.phone || ""),
        String(payload.passwordHash || hashPassword(createTemporaryPassword())),
        normalizeStudentClassLevel(payload.classLevel),
        normalizeDeviceId(payload.deviceId),
        normalizeDeviceLabel(payload.deviceLabel),
      ],
    );
    res.status(201).json({
      success: true,
      user: await normalizeUser({
        id,
        name: String(payload.name || "Student").trim(),
        email: normalizedEmail,
        phone: String(payload.phone || ""),
        class_level: normalizeStudentClassLevel(payload.classLevel),
        status: "active",
        user_category: "free",
        device_id: normalizeDeviceId(payload.deviceId),
        device_label: normalizeDeviceLabel(payload.deviceLabel),
        device_bound_at: new Date(),
      }),
    });
  }));

  app.post("/api/signup", asyncHandler(async (req, res) => {
    res.status(400).json({ success: false, message: "Email verification is required. Please request signup OTP first." });
  }));

  app.post("/api/request-password-reset-otp", asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(String(req.body?.email || ""));
    if (!normalizedEmail) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const user = await queryOne<DbUser>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (!user) {
      res.status(404).json({ success: false, message: "Email is not registered" });
      return;
    }

    const otp = createOtpCode();
    await saveOtp(normalizedEmail, "password-reset", otp);
    await sendEmail(
      normalizedEmail,
      "Monto password reset OTP",
      `Your Monto password reset OTP is ${otp}. It expires in 10 minutes.`,
    );
    res.json({ success: true, message: "Password reset OTP sent to your email" });
  }));

  app.post("/api/verify-password-reset-otp", asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(String(req.body?.email || ""));
    const otp = String(req.body?.otp || "").trim();
    if (!normalizedEmail || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }

    const verification = await verifyOtp(normalizedEmail, "password-reset", otp);
    if (!verification.ok) {
      res.status(verification.status).json({ success: false, message: verification.message });
      return;
    }

    const user = await queryOne<DbUser>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (!user) {
      res.status(404).json({ success: false, message: "Email is not registered" });
      return;
    }

    const temporaryPassword = createTemporaryPassword();
    await execute("UPDATE users SET password = ? WHERE id = ?", [hashPassword(temporaryPassword), user.id]);
    await sendEmail(
      normalizedEmail,
      "Monto temporary password",
      `Your Monto temporary password is ${temporaryPassword}. Login with this password and change it from Profile Information.`,
    );
    res.json({ success: true, message: "A temporary password has been sent to your email" });
  }));

  app.post("/api/login", asyncHandler(async (req, res) => {
    const { email, password, deviceId, deviceLabel } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const normalizedEmail = normalizeEmail(String(email || ""));
    const user = await queryOne<DbUser>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (!user || !verifyPassword(String(password), String(user.password || ""))) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    if (String(user.status || "active") === "blocked") {
      res.status(403).json({ success: false, message: "Your account is blocked. Contact academy admin." });
      return;
    }

    if (!String(user.password || "").startsWith(`${PASSWORD_PREFIX}:`)) {
      await execute("UPDATE users SET password = ? WHERE id = ?", [hashPassword(String(password)), user.id]);
    }

    const deviceCheck = await verifyAndBindUserDevice(user, String(deviceId || ""), String(deviceLabel || ""));
    if (!deviceCheck.ok) {
      res.status(deviceCheck.status).json({ success: false, message: deviceCheck.message, deviceLocked: deviceCheck.deviceLocked });
      return;
    }

    res.json({ success: true, user: await normalizeUser(user) });
  }));

  app.get("/api/session-user", asyncHandler(async (req, res) => {
    const userId = String(req.query.userId || "").trim();
    const deviceId = String(req.query.deviceId || "");
    const deviceLabel = String(req.query.deviceLabel || "");
    if (!userId) {
      res.status(400).json({ success: false, message: "User id is required" });
      return;
    }

    const user = await queryOne<DbUser>("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (String(user.status || "active").toLowerCase() === "blocked") {
      res.status(403).json({ success: false, blocked: true, message: "Your account is blocked. Contact academy admin." });
      return;
    }

    const deviceCheck = await verifyAndBindUserDevice(user, deviceId, deviceLabel);
    if (!deviceCheck.ok) {
      res.status(deviceCheck.status).json({
        success: false,
        blocked: deviceCheck.status === 403,
        deviceLocked: deviceCheck.deviceLocked,
        message: deviceCheck.message,
      });
      return;
    }

    res.json({ success: true, user: await normalizeUser(user) });
  }));

  app.get("/api/courses", asyncHandler(async (_req, res) => {
    const courses = await queryRows<DbCourse>("SELECT * FROM courses");
    const lessons = await queryRows<DbLesson>("SELECT * FROM lessons ORDER BY sort_order ASC, id ASC");
    const result = courses.map((course) => ({
      ...course,
      lessonList: lessons.filter((lesson) => String(lesson.course_id) === String(course.id)),
    }));
    res.json(result);
  }));

  app.get("/api/notes", asyncHandler(async (_req, res) => {
    res.json(await queryRows<DbNote>("SELECT * FROM notes"));
  }));

  app.get("/api/quizzes", asyncHandler(async (_req, res) => {
    const quizzes = await queryRows<DbQuiz>("SELECT * FROM quizzes");
    const questions = await queryRows<DbQuestion>("SELECT * FROM questions");
    res.json(
      quizzes.map((quiz) => ({
        ...quiz,
        questions: questions.filter((question) => String(question.quiz_id) === String(quiz.id)).map(normalizeQuestion),
      })),
    );
  }));

  app.get("/api/users", asyncHandler(async (_req, res) => {
    const users = await queryRows<DbUser>("SELECT * FROM users ORDER BY name ASC, id ASC");
    const normalized = await normalizeUsers(users);
    res.json(normalized);
  }));

  app.get("/api/admin-users", requireAdmin(), asyncHandler(async (_req, res) => {
    const users = await queryRows<DbUser>("SELECT * FROM users ORDER BY name ASC, id ASC");
    const normalized = await normalizeUsers(users);
    res.json(normalized);
  }));

  app.get("/api/sliders", asyncHandler(async (_req, res) => {
    const sliders = await queryRows<DbSlider>("SELECT * FROM sliders ORDER BY sort_order ASC, id ASC");
    res.json(sliders.map(normalizeSliderForClient));
  }));

  app.get("/api/app-control", asyncHandler(async (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.json({ settings: await getAppControlSettings() });
  }));

  app.post("/api/app-control", requireAdmin(["superadmin"]), asyncHandler(async (req, res) => {
    const settings = normalizeAppControlSettings((req.body || {}).settings || req.body || {});
    await execute(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [APP_CONTROL_KEY, JSON.stringify(settings), new Date()],
    );
    res.json({ success: true, message: "App control settings saved", settings });
  }));

  app.post("/api/register-push-token", asyncHandler(async (req, res) => {
    const token = String(req.body?.token || "").trim();
    const userId = String(req.body?.userId || "").trim();
    const deviceId = normalizeDeviceId(req.body?.deviceId);
    const deviceLabel = normalizeDeviceLabel(req.body?.deviceLabel);
    const platform = String(req.body?.platform || "android").trim().slice(0, 40);

    if (!token) {
      res.status(400).json({ success: false, message: "Push token is required" });
      return;
    }

    const existingUser = userId ? await queryOne<DbUser>("SELECT id FROM users WHERE id = ?", [userId]) : null;
    await execute(
      `INSERT INTO push_tokens (id, token, user_id, device_id, device_label, platform, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (token)
       DO UPDATE SET user_id = EXCLUDED.user_id, device_id = EXCLUDED.device_id, device_label = EXCLUDED.device_label, platform = EXCLUDED.platform, last_seen_at = CURRENT_TIMESTAMP`,
      [createId("pt"), token, existingUser ? userId : null, deviceId, deviceLabel, platform || "android"],
    );

    res.json({ success: true, message: "Push token registered" });
  }));

  app.get("/api/notification-history", requireAdmin(), asyncHandler(async (_req, res) => {
    const notifications = await queryRows<DbNotificationLog>(
      "SELECT * FROM notification_logs ORDER BY sent_at DESC, id DESC LIMIT 50",
    );
    res.json({ success: true, notifications: notifications.map(normalizeNotificationLog) });
  }));

  app.post("/api/sendPushNotification", requireAdmin(), asyncHandler(async (req, res) => {
    const title = String(req.body?.title || "").trim().slice(0, 120);
    const body = String(req.body?.body || "").trim().slice(0, 500);
    const audience = String(req.body?.audience || "all").toLowerCase();
    const userIds = parseJsonArray(req.body?.userIds).map((item) => String(item)).filter(Boolean);
    const screen = String(req.body?.screen || "home").trim().slice(0, 60);

    if (!title || !body) {
      res.status(400).json({ success: false, message: "Notification title and body are required" });
      return;
    }

    if (audience === "selected" && !userIds.length) {
      res.status(400).json({ success: false, message: "Select at least one student" });
      return;
    }

    const notificationId = `push-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const settings = normalizeAppControlSettings({
      ...(await getAppControlSettings()),
      pushEnabled: true,
      notificationTitle: title,
      notificationBody: body,
      notificationId,
      notificationSentAt: sentAt,
    });
    await execute(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [APP_CONTROL_KEY, JSON.stringify(settings), new Date()],
    );

    let rows: DbPushToken[] = [];
    if (audience === "selected") {
      rows = await queryRows<DbPushToken>(
        "SELECT pt.* FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.status <> 'blocked' AND pt.user_id = ANY($1::text[]) ORDER BY pt.last_seen_at DESC",
        [userIds],
      );
    } else if (audience === "premium") {
      rows = await queryRows<DbPushToken>(
        "SELECT pt.* FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.status <> 'blocked' AND u.user_category = 'premium' ORDER BY pt.last_seen_at DESC",
      );
    } else if (audience === "free") {
      rows = await queryRows<DbPushToken>(
        "SELECT pt.* FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.status <> 'blocked' AND COALESCE(u.user_category, 'free') <> 'premium' ORDER BY pt.last_seen_at DESC",
      );
    } else {
      rows = await queryRows<DbPushToken>(
        "SELECT pt.* FROM push_tokens pt LEFT JOIN users u ON u.id = pt.user_id WHERE COALESCE(u.status, 'active') <> 'blocked' ORDER BY pt.last_seen_at DESC",
      );
    }

    const tokens = Array.from(new Set(rows.map((row) => String(row.token || "").trim()).filter(Boolean)));
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    if (hasFirebasePushCredentials()) {
      for (const token of tokens) {
        try {
          await sendFirebasePushToToken(token, {
            title,
            body,
            data: {
              type: "admin-broadcast",
              screen,
              notificationId,
            },
          });
          sent += 1;
        } catch (error) {
          failed += 1;
          if (errors.length < 3) {
            errors.push(error instanceof Error ? error.message : "FCM send failed");
          }
        }
      }
    }

    const credentialMissing = !hasFirebasePushCredentials();
    const message = credentialMissing
      ? "Notification saved for app broadcast. Add Firebase service account env to send when app is closed."
      : `Push notification sent to ${sent} device${sent === 1 ? "" : "s"}${failed ? `, ${failed} failed` : ""}.`;
    await execute(
      `INSERT INTO notification_logs (id, title, body, audience, screen, target_user_ids, total_devices, sent_count, failed_count, credential_missing, errors, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificationId,
        title,
        body,
        audience,
        screen,
        JSON.stringify(userIds),
        tokens.length,
        sent,
        failed,
        credentialMissing,
        JSON.stringify(errors),
        new Date(sentAt),
      ],
    );
    const notification = normalizeNotificationLog({
      id: notificationId,
      title,
      body,
      audience,
      screen,
      target_user_ids: JSON.stringify(userIds),
      total_devices: tokens.length,
      sent_count: sent,
      failed_count: failed,
      credential_missing: credentialMissing,
      errors: JSON.stringify(errors),
      sent_at: sentAt,
    });

    res.json({
      success: true,
      message,
      notificationId,
      sentAt,
      audience,
      total: tokens.length,
      sent,
      failed,
      fallbackBroadcast: true,
      credentialMissing,
      errors,
      settings,
      notification,
    });
  }));

  app.get("/api/live-classes", asyncHandler(async (req, res) => {
    const userId = String(req.query.userId || "").trim();
    const liveClasses = await queryRows<DbLiveClass>("SELECT * FROM live_classes ORDER BY scheduled_at ASC NULLS LAST, created_at DESC, id DESC");
    const normalized = liveClasses.map(normalizeLiveClass);

    if (!userId) {
      res.json(normalized.filter((item) => item.is_active && item.audience_type === "all" && item.access_type === "free"));
      return;
    }

    const user = await queryOne<DbUser>("SELECT status FROM users WHERE id = ?", [userId]);
    if (String(user?.status || "active").toLowerCase() === "blocked") {
      res.status(403).json({ success: false, blocked: true, message: "Your account is blocked. Contact academy admin." });
      return;
    }

    const grantedCourseIds = await getGrantedCourseIds(userId);
    res.json(normalized.filter((item) => canUserViewLiveClass(item, userId, grantedCourseIds)));
  }));

  app.get("/api/admin-live-classes", requireAdmin(), asyncHandler(async (_req, res) => {
    const liveClasses = await queryRows<DbLiveClass>("SELECT * FROM live_classes ORDER BY scheduled_at ASC NULLS LAST, created_at DESC, id DESC");
    res.json(liveClasses.map(normalizeLiveClass));
  }));

  app.post("/api/media-upload-signature", requireAdmin(), asyncHandler(async (req, res) => {
    const uploadKinds: Record<string, { folder: string; prefix: string; resourceType: "image" | "raw" }> = {
      slider: { folder: "sliders", prefix: "slider", resourceType: "image" },
      course: { folder: "courses", prefix: "course-thumbnail", resourceType: "image" },
      lesson: { folder: "lessons", prefix: "video-thumbnail", resourceType: "image" },
      question: { folder: "questions", prefix: "question", resourceType: "image" },
      profile: { folder: "profiles", prefix: "profile-avatar", resourceType: "image" },
      note: { folder: "notes", prefix: "note", resourceType: "raw" },
    };
    const uploadKind = uploadKinds[String(req.body?.kind || "").trim().toLowerCase()];
    if (!uploadKind) {
      res.status(400).json({ success: false, message: "Unsupported upload kind" });
      return;
    }
    const mimeType = String(req.body?.mimeType || "").trim().toLowerCase();
    const size = Number(req.body?.size || 0);
    const allowedTypes = uploadKind.resourceType === "image" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_NOTE_MIME_TYPES;
    const maxSize = uploadKind.resourceType === "image" ? MAX_IMAGE_BYTES : MAX_NOTE_BYTES;
    if (!allowedTypes.has(mimeType) || !Number.isFinite(size) || size <= 0 || size > maxSize) {
      res.status(400).json({ success: false, message: "Unsupported file type or file is too large" });
      return;
    }

    const cloudinaryConfig = uploadKind.resourceType === "image"
      ? getCloudinaryConfigForContentImage(uploadKind.folder, uploadKind.prefix)
      : getCloudinaryConfigForUpload(mimeType);
    const authorization = createCloudinaryUploadAuthorization(
      uploadKind.folder,
      uploadKind.prefix,
      uploadKind.resourceType,
      String(req.body?.fileName || ""),
      cloudinaryConfig,
    );
    res.json({
      success: true,
      cloudName: cloudinaryConfig.cloudName,
      apiKey: cloudinaryConfig.apiKey,
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryConfig.cloudName)}/${authorization.resourceType}/upload`,
      ...authorization,
    });
  }));

  app.post("/api/createSlider", requireAdmin(), asyncHandler(async (req, res) => {
    const { title, subtitle, sort_order, is_active } = req.body || {};
    if (!title || !subtitle) {
      res.status(400).json({ success: false, message: "Title and subtitle are required" });
      return;
    }
    const imageUrl = await saveSliderImage(req.body || {});
    if (!imageUrl) {
      res.status(400).json({ success: false, message: "Slider image is required" });
      return;
    }

    const id = `sl${Date.now()}`;
    await execute(
      "INSERT INTO sliders (id, title, subtitle, image_url, drive_file_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, subtitle, imageUrl, "", Number(sort_order || 0), String(is_active) === "false" ? 0 : 1],
    );

    const slider = await queryOne<DbSlider>("SELECT * FROM sliders WHERE id = ?", [id]);
    res.status(201).json({ success: true, slider: normalizeSlider(slider || {}) });
  }));

  app.post("/api/updateSlider", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, title, subtitle, sort_order, is_active } = req.body || {};
    if (!id || !title || !subtitle) {
      res.status(400).json({ success: false, message: "Id, title and subtitle are required" });
      return;
    }

    const current = await queryOne<DbSlider>("SELECT * FROM sliders WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Slider not found" });
      return;
    }

    const imageUrl = (await saveSliderImage(req.body || {})) || current.image_url;
    if (imageUrl !== current.image_url) {
      await deleteStoredImage(current.image_url, "/uploads/sliders/");
    }

    await execute(
      "UPDATE sliders SET title = ?, subtitle = ?, image_url = ?, drive_file_id = ?, sort_order = ?, is_active = ? WHERE id = ?",
      [title, subtitle, imageUrl, "", Number(sort_order || 0), String(is_active) === "false" ? 0 : 1, id],
    );

    const slider = await queryOne<DbSlider>("SELECT * FROM sliders WHERE id = ?", [id]);
    res.json({ success: true, message: "Slider updated", slider: normalizeSlider(slider || {}) });
  }));

  app.post("/api/deleteSlider", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Slider id is required" });
      return;
    }
    const current = await queryOne<DbSlider>("SELECT * FROM sliders WHERE id = ?", [id]);
    await deleteStoredImage(current?.image_url, "/uploads/sliders/");
    await execute("DELETE FROM sliders WHERE id = ?", [id]);
    res.json({ success: true, message: "Slider deleted" });
  }));

  app.post("/api/createLiveClass", requireAdmin(), asyncHandler(async (req, res) => {
    const {
      title,
      description,
      meeting_url,
      scheduled_at,
      access_type,
      audience_type,
      course_id,
      selected_user_ids,
      is_active,
    } = req.body || {};

    if (!title || !meeting_url) {
      res.status(400).json({ success: false, message: "Title and meeting link are required" });
      return;
    }

    const normalizedMeetingUrl = normalizeMeetingUrl(meeting_url);
    if (!isValidMeetingUrl(normalizedMeetingUrl)) {
      res.status(400).json({ success: false, message: "Enter a valid live class meeting link" });
      return;
    }

    const normalizedAudienceType = ["course", "selected"].includes(String(audience_type || "").toLowerCase())
      ? String(audience_type).toLowerCase()
      : "all";
    const normalizedAccessType = String(access_type || "free").toLowerCase() === "premium" ? "premium" : "free";
    let audience;
    try {
      audience = await resolveLiveClassAudience(normalizedAudienceType, course_id, selected_user_ids);
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Invalid live class visibility" });
      return;
    }
    const id = createId("lc");

    await execute(
      "INSERT INTO live_classes (id, title, description, meeting_url, scheduled_at, access_type, audience_type, course_id, selected_user_ids, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT id FROM courses WHERE id = ?), ?, ?)",
      [
        id,
        String(title).trim(),
        String(description || "").trim(),
        normalizedMeetingUrl,
        scheduled_at ? new Date(String(scheduled_at)) : null,
        normalizedAccessType,
        normalizedAudienceType,
        audience.courseId,
        JSON.stringify(audience.selectedUserIds),
        String(is_active) === "false" ? 0 : 1,
      ],
    );

    res.status(201).json({ success: true, message: "Live class created" });
  }));

  app.post("/api/updateLiveClass", requireAdmin(), asyncHandler(async (req, res) => {
    const {
      id,
      title,
      description,
      meeting_url,
      scheduled_at,
      access_type,
      audience_type,
      course_id,
      selected_user_ids,
      is_active,
    } = req.body || {};

    if (!id || !title || !meeting_url) {
      res.status(400).json({ success: false, message: "Id, title and meeting link are required" });
      return;
    }

    const normalizedMeetingUrl = normalizeMeetingUrl(meeting_url);
    if (!isValidMeetingUrl(normalizedMeetingUrl)) {
      res.status(400).json({ success: false, message: "Enter a valid live class meeting link" });
      return;
    }

    const current = await queryOne<DbLiveClass>("SELECT * FROM live_classes WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Live class not found" });
      return;
    }

    const normalizedAudienceType = ["course", "selected"].includes(String(audience_type || "").toLowerCase())
      ? String(audience_type).toLowerCase()
      : "all";
    const normalizedAccessType = String(access_type || "free").toLowerCase() === "premium" ? "premium" : "free";
    let audience;
    try {
      audience = await resolveLiveClassAudience(normalizedAudienceType, course_id, selected_user_ids);
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Invalid live class visibility" });
      return;
    }

    await execute(
      "UPDATE live_classes SET title = ?, description = ?, meeting_url = ?, scheduled_at = ?, access_type = ?, audience_type = ?, course_id = (SELECT id FROM courses WHERE id = ?), selected_user_ids = ?, is_active = ? WHERE id = ?",
      [
        String(title).trim(),
        String(description || "").trim(),
        normalizedMeetingUrl,
        scheduled_at ? new Date(String(scheduled_at)) : null,
        normalizedAccessType,
        normalizedAudienceType,
        audience.courseId,
        JSON.stringify(audience.selectedUserIds),
        String(is_active) === "false" ? 0 : 1,
        id,
      ],
    );

    res.json({ success: true, message: "Live class updated" });
  }));

  app.post("/api/deleteLiveClass", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Live class id is required" });
      return;
    }

    await execute("DELETE FROM live_classes WHERE id = ?", [id]);
    res.json({ success: true, message: "Live class deleted" });
  }));

  app.post("/api/createCourse", requireAdmin(), asyncHandler(async (req, res) => {
    const { title, lessons, price, oldPrice, type, category, access_code, description } = req.body || {};
    if (!title || !type || !category) {
      res.status(400).json({ success: false, message: "Title, image, type, and category are required" });
      return;
    }
    const image = await saveContentImage(req.body || {}, "courses", "course-thumbnail", "image");
    if (!image) {
      res.status(400).json({ success: false, message: "Course image is required" });
      return;
    }

    const id = createId("c");
    await execute(
      "INSERT INTO courses (id, title, lessons, image, description, price, oldPrice, type, category, access_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, title, Number(lessons || 0), image, String(description || "").trim(), Number(price || 0), Number(oldPrice || 0), type, category, access_code || ""],
    );

    const course = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [id]);
    res.status(201).json({ success: true, message: "Course created", course });
  }));

  app.post("/api/updateCourse", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, title, lessons, price, oldPrice, type, category, access_code, description } = req.body || {};
    if (!id || !title || !type || !category) {
      res.status(400).json({ success: false, message: "Id, title, image, type, and category are required" });
      return;
    }

    const current = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const image = (await saveContentImage(req.body || {}, "courses", "course-thumbnail", "image")) || current.image;
    if (!image) {
      res.status(400).json({ success: false, message: "Course image is required" });
      return;
    }
    if (image !== current.image) {
      await deleteStoredImage(current.image);
    }

    await execute(
      "UPDATE courses SET title = ?, lessons = ?, image = ?, description = ?, price = ?, oldPrice = ?, type = ?, category = ?, access_code = ? WHERE id = ?",
      [title, Number(lessons || 0), image, String(description || "").trim(), Number(price || 0), Number(oldPrice || 0), type, category, access_code ?? current.access_code ?? "", id],
    );

    res.json({ success: true, message: "Course updated" });
  }));

  app.post("/api/deleteCourse", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Course id is required" });
      return;
    }

    const current = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const courseLessons = await queryRows<DbLesson>("SELECT * FROM lessons WHERE course_id = ?", [id]);
    await withTransaction(async (connection) => {
      await connection.execute("DELETE FROM lessons WHERE course_id = ?", [id]);
      await connection.execute("DELETE FROM enrollments WHERE course_id = ?", [id]);
      await connection.execute("DELETE FROM courses WHERE id = ?", [id]);
    });
    await deleteStoredImage(current.image);
    await Promise.all(courseLessons.map((lesson) => deleteStoredImage(lesson.thumbnail_url)));

    res.json({ success: true, message: "Course deleted" });
  }));

  app.post("/api/updateCourseAccess", requireAdmin(), asyncHandler(async (req, res) => {
    const { courseId, accessCode } = req.body || {};
    if (!courseId) {
      res.status(400).json({ success: false, message: "Course id is required" });
      return;
    }

    const current = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (!current) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    await execute("UPDATE courses SET access_code = ? WHERE id = ?", [String(accessCode || "").toUpperCase(), courseId]);
    res.json({ success: true, message: "Access code updated" });
  }));

  app.post("/api/grantCourseAccess", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId, courseId, accessCode, durationDays, expiresAt } = req.body || {};
    if (!userId || !courseId) {
      res.status(400).json({ success: false, message: "User id and course id are required" });
      return;
    }

    const user = await queryOne<DbUser>("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    const course = await queryOne<DbCourse>("SELECT id, type FROM courses WHERE id = ?", [courseId]);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (String(course.type || "").toLowerCase() !== "premium") {
      res.status(400).json({ success: false, message: "Only premium courses require generated access codes" });
      return;
    }

    const generatedCode = String(accessCode || createAccessCode()).trim().toUpperCase();
    const days = Number(durationDays || 0);
    const expiryDate = expiresAt
      ? new Date(String(expiresAt))
      : Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        : null;
    const existing = await queryOne<RowDataPacket & { id: string }>("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);

    if (existing) {
      await execute("UPDATE enrollments SET access_code = ?, granted_at = ?, expires_at = ?, status = 'active' WHERE id = ?", [generatedCode, new Date(), expiryDate, existing.id]);
      await syncUserCategory(String(userId));
      res.json({ success: true, message: "You are now premium member", accessCode: generatedCode, user: await getFreshNormalizedUser(String(userId)) });
      return;
    }

    await execute(
      "INSERT INTO enrollments (id, user_id, course_id, access_code, granted_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
      [createId("en"), userId, courseId, generatedCode, new Date(), expiryDate],
    );
    await syncUserCategory(String(userId));
    res.json({ success: true, message: "You are now premium member", accessCode: generatedCode, user: await getFreshNormalizedUser(String(userId)) });
  }));

  app.post("/api/revokeCourseAccess", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body || {};
    if (!userId || !courseId) {
      res.status(400).json({ success: false, message: "User id and course id are required" });
      return;
    }
    await execute("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
    await syncUserCategory(String(userId));
    res.json({ success: true, message: "Course access revoked", user: await getFreshNormalizedUser(String(userId)) });
  }));

  app.post("/api/blockCourseAccess", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body || {};
    if (!userId || !courseId) {
      res.status(400).json({ success: false, message: "User id and course id are required" });
      return;
    }
    await execute(
      `INSERT INTO enrollments (id, user_id, course_id, access_code, granted_at, expires_at, status)
       VALUES (?, ?, ?, '', ?, NULL, 'blocked')
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET access_code = '', granted_at = EXCLUDED.granted_at, expires_at = NULL, status = 'blocked'`,
      [createId("en"), userId, courseId, new Date()],
    );
    await syncUserCategory(String(userId));
    res.json({ success: true, message: "Student blocked from this course", user: await getFreshNormalizedUser(String(userId)) });
  }));

  app.post("/api/blockUser", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) {
      res.status(400).json({ success: false, message: "User id is required" });
      return;
    }
    await execute("UPDATE users SET status = 'blocked' WHERE id = ?", [userId]);
    res.json({ success: true, message: "Student blocked from platform", user: await getFreshNormalizedUser(String(userId)) });
  }));

  app.post("/api/unblockUser", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) {
      res.status(400).json({ success: false, message: "User id is required" });
      return;
    }
    await execute("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
    res.json({ success: true, message: "Student unblocked on platform", user: await getFreshNormalizedUser(String(userId)) });
  }));

  app.post("/api/resetStudentDevice", requireAdmin(), asyncHandler(async (req, res) => {
    const { userId } = req.body || {};
    if (!userId) {
      res.status(400).json({ success: false, message: "User id is required" });
      return;
    }

    await execute("UPDATE users SET device_id = '', device_label = '', device_bound_at = NULL WHERE id = ?", [userId]);
    res.json({
      success: true,
      message: "Student mobile reset. Next login will bind the new mobile.",
      user: await getFreshNormalizedUser(String(userId)),
    });
  }));

  app.post("/api/verifyCourseAccess", asyncHandler(async (req, res) => {
    const { courseId, accessCode, userId, deviceId, deviceLabel } = req.body || {};
    if (!courseId || !userId) {
      res.status(400).json({ success: false, message: "Course id and user id are required" });
      return;
    }

    const course = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const user = await queryOne<DbUser>("SELECT * FROM users WHERE id = ?", [userId]);
    if (String(user?.status || "active").toLowerCase() === "blocked") {
      res.status(403).json({ success: false, message: "Your account is blocked. Contact academy admin." });
      return;
    }

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const deviceCheck = await verifyAndBindUserDevice(user, String(deviceId || ""), String(deviceLabel || ""));
    if (!deviceCheck.ok) {
      res.status(deviceCheck.status).json({
        success: false,
        blocked: deviceCheck.status === 403,
        deviceLocked: deviceCheck.deviceLocked,
        message: deviceCheck.message,
      });
      return;
    }

    if (course.type !== "premium") {
      res.json({ success: true, message: "Course unlocked" });
      return;
    }

    if (!accessCode) {
      res.status(400).json({ success: false, message: "Access code is required for premium courses" });
      return;
    }

    const enrollment = await queryOne<RowDataPacket & { access_code: string; status?: string; expires_at?: Date }>(
      "SELECT access_code, status, expires_at FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId],
    );
    if (String(enrollment?.status || "active") === "blocked") {
      res.status(403).json({ success: false, message: "This course access is blocked by admin" });
      return;
    }
    if (enrollment?.expires_at && new Date(enrollment.expires_at).getTime() <= Date.now()) {
      res.status(403).json({ success: false, message: "This course access has expired" });
      return;
    }
    const expectedCode = String(enrollment?.access_code || "").toUpperCase();
    if (!expectedCode || expectedCode !== String(accessCode).toUpperCase()) {
      res.status(401).json({ success: false, message: "Invalid access code" });
      return;
    }

    res.json({ success: true, message: "Course unlocked" });
  }));

  app.post("/api/createLesson", requireAdmin(), asyncHandler(async (req, res) => {
    const { course_id, title, duration, note_content, note_url, video_url, download_url, download_label, download_enabled, sort_order } = req.body || {};
    if (!course_id || !title) {
      res.status(400).json({ success: false, message: "Course and lesson title are required" });
      return;
    }

    const course = await queryOne<DbCourse>("SELECT id FROM courses WHERE id = ?", [course_id]);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found. Refresh course builder and choose a valid course." });
      return;
    }

    const thumbnail_url = await saveContentImage(req.body || {}, "lessons", "video-thumbnail", "thumbnail_url");
    const id = createId("l");
    await execute(
      "INSERT INTO lessons (id, course_id, title, duration, note_content, note_url, video_url, thumbnail_url, download_url, download_label, download_enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, course_id, title, duration || "", note_content || "", note_url || "", video_url || "", thumbnail_url || "", download_url || "", download_label || "", download_enabled === false ? false : true, Number(sort_order || 0)],
    );
    res.status(201).json({ success: true, message: "Lesson created" });
  }));

  app.post("/api/importYoutubePlaylist", requireAdmin(), asyncHandler(async (req, res) => {
    const { course_id, playlist_url, start_order } = req.body || {};
    const normalizedCourseId = String(course_id || "").trim();
    if (!normalizedCourseId || !String(playlist_url || "").trim()) {
      res.status(400).json({ success: false, message: "Course and YouTube playlist URL are required" });
      return;
    }

    const course = await queryOne<DbCourse>("SELECT * FROM courses WHERE id = ?", [normalizedCourseId]);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const playlistItems = await fetchYoutubePlaylistItems(playlist_url);
    const existingLessons = await queryRows<DbLesson>("SELECT video_url, sort_order FROM lessons WHERE course_id = ?", [normalizedCourseId]);
    const existingVideoIds = new Set(
      existingLessons
        .map((lesson) => String(lesson.video_url || "").match(/(?:embed\/|watch\?v=|youtu\.be\/)([^?&/]+)/i)?.[1] || "")
        .filter(Boolean),
    );
    const maxSortOrder = existingLessons.reduce((max, lesson) => Math.max(max, Number(lesson.sort_order || 0)), 0);
    const firstSortOrder = Number(start_order || 0) > 0 ? Number(start_order) : maxSortOrder + 1;
    const importedItems = playlistItems.filter((item) => !existingVideoIds.has(item.videoId));

    if (!importedItems.length) {
      res.json({ success: true, message: "Playlist videos already exist in this course", imported: 0 });
      return;
    }

    await withTransaction(async (connection) => {
      for (const [index, item] of importedItems.entries()) {
        await connection.execute(
          "INSERT INTO lessons (id, course_id, title, duration, note_content, note_url, video_url, thumbnail_url, download_url, download_label, download_enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            createId("l"),
            normalizedCourseId,
            item.title,
            "",
            "",
            "",
            youtubeEmbedUrl(item.videoId),
            item.thumbnail_url,
            "",
            "",
            true,
            firstSortOrder + index,
          ],
        );
      }

      const [totalLessons] = await connection.query<RowDataPacket>(
        "SELECT COUNT(*)::int AS count FROM lessons WHERE course_id = ?",
        [normalizedCourseId],
      );
      await connection.execute("UPDATE courses SET lessons = ? WHERE id = ?", [Number(totalLessons[0]?.count || 0), normalizedCourseId]);
    });

    res.status(201).json({ success: true, message: `${importedItems.length} playlist videos imported`, imported: importedItems.length });
  }));

  app.post("/api/updateLesson", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, course_id, title, duration, note_content, note_url, video_url, download_url, download_label, download_enabled, sort_order } = req.body || {};
    if (!id || !course_id || !title) {
      res.status(400).json({ success: false, message: "Id, course, and lesson title are required" });
      return;
    }

    const current = await queryOne<DbLesson>("SELECT * FROM lessons WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Lesson not found" });
      return;
    }

    const course = await queryOne<DbCourse>("SELECT id FROM courses WHERE id = ?", [course_id]);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found. Refresh course builder and choose a valid course." });
      return;
    }

    const thumbnail_url = await saveContentImage(req.body || {}, "lessons", "video-thumbnail", "thumbnail_url");
    if (thumbnail_url !== current.thumbnail_url) {
      await deleteStoredImage(current.thumbnail_url);
    }

    await execute(
      "UPDATE lessons SET course_id = ?, title = ?, duration = ?, note_content = ?, note_url = ?, video_url = ?, thumbnail_url = ?, download_url = ?, download_label = ?, download_enabled = ?, sort_order = ? WHERE id = ?",
      [course_id, title, duration || "", note_content || "", note_url || "", video_url || "", thumbnail_url || "", download_url || "", download_label || "", download_enabled === false ? false : true, Number(sort_order || 0), id],
    );
    res.json({ success: true, message: "Lesson updated" });
  }));

  app.post("/api/deleteLesson", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Lesson id is required" });
      return;
    }
    const current = await queryOne<DbLesson>("SELECT * FROM lessons WHERE id = ?", [id]);
    await execute("DELETE FROM lessons WHERE id = ?", [id]);
    await deleteStoredImage(current?.thumbnail_url);
    res.json({ success: true, message: "Lesson deleted" });
  }));

  app.post("/api/createNote", requireAdmin(), asyncHandler(async (req, res) => {
    const { title, lessons, category, type, content } = req.body || {};
    if (!title || !category) {
      res.status(400).json({ success: false, message: "Title and category are required" });
      return;
    }

    const url = await saveNoteFile(req.body || {});
    const id = createId("n");
    await execute(
      "INSERT INTO notes (id, title, lessons, category, type, url, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, Number(lessons || 0), category, type || "free", url || "", content || ""],
    );
    res.status(201).json({ success: true, message: "Note created" });
  }));

  app.post("/api/updateNote", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, title, lessons, category, type, content } = req.body || {};
    if (!id || !title || !category) {
      res.status(400).json({ success: false, message: "Id, title, and category are required" });
      return;
    }

    const current = await queryOne<DbNote>("SELECT * FROM notes WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Note not found" });
      return;
    }

    const url = await saveNoteFile(req.body || {});
    if (url !== current.url) {
      await deleteStoredImage(current.url);
    }

    await execute(
      "UPDATE notes SET title = ?, lessons = ?, category = ?, type = ?, url = ?, content = ? WHERE id = ?",
      [title, Number(lessons || 0), category, type || "free", url || "", content || "", id],
    );
    res.json({ success: true, message: "Note updated" });
  }));

  app.post("/api/deleteNote", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Note id is required" });
      return;
    }
    const current = await queryOne<DbNote>("SELECT * FROM notes WHERE id = ?", [id]);
    await execute("DELETE FROM notes WHERE id = ?", [id]);
    await deleteStoredImage(current?.url);
    res.json({ success: true, message: "Note deleted" });
  }));

  app.post("/api/createQuiz", requireAdmin(), asyncHandler(async (req, res) => {
    const { topic, type } = req.body || {};
    if (!topic) {
      res.status(400).json({ success: false, message: "Quiz topic is required" });
      return;
    }
    const id = createId("q");
    await execute("INSERT INTO quizzes (id, topic, type) VALUES (?, ?, ?)", [id, topic, type || "free"]);
    res.status(201).json({ success: true, message: "Quiz created" });
  }));

  app.post("/api/updateQuiz", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, topic, type } = req.body || {};
    if (!id || !topic) {
      res.status(400).json({ success: false, message: "Id and topic are required" });
      return;
    }
    const current = await queryOne<DbQuiz>("SELECT * FROM quizzes WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Quiz not found" });
      return;
    }
    await execute("UPDATE quizzes SET topic = ?, type = ? WHERE id = ?", [topic, type || "free", id]);
    res.json({ success: true, message: "Quiz updated" });
  }));

  app.post("/api/deleteQuiz", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Quiz id is required" });
      return;
    }
    await withTransaction(async (connection) => {
      await removeQuestionsForQuiz(id, connection);
      await connection.execute("DELETE FROM quizzes WHERE id = ?", [id]);
    });
    res.json({ success: true, message: "Quiz deleted" });
  }));

  app.post("/api/createQuestion", requireAdmin(), asyncHandler(async (req, res) => {
    const { quiz_id, text, options, correctAnswer, explanation } = req.body || {};
    if (!quiz_id || !text || !Array.isArray(options) || options.length < 2) {
      res.status(400).json({ success: false, message: "Quiz, question text, and options are required" });
      return;
    }

    const normalizedOptions = options.map((option: unknown) => normalizeStoredQuizOption(option)).filter((option: unknown) => getQuizOptionText(option));
    const normalizedCorrectAnswer = Number(correctAnswer ?? 0);
    if (!Number.isInteger(normalizedCorrectAnswer) || normalizedCorrectAnswer < 0 || normalizedCorrectAnswer >= normalizedOptions.length) {
      res.status(400).json({ success: false, message: "Correct answer must match one of the provided options" });
      return;
    }

    const image_url = await saveQuestionImage(req.body || {});
    const id = createId("qn");
    await execute(
      "INSERT INTO questions (id, quiz_id, text, options, correctAnswer, explanation, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, quiz_id, String(text).trim(), JSON.stringify(normalizedOptions), normalizedCorrectAnswer, String(explanation || "").trim(), image_url || ""],
    );

    res.status(201).json({ success: true, message: "Question created" });
  }));

  app.post("/api/importQuestions", requireAdmin(), asyncHandler(async (req, res) => {
    const { quiz_id, questions } = req.body || {};
    if (!quiz_id) {
      res.status(400).json({ success: false, message: "Quiz is required" });
      return;
    }
    const currentQuiz = await queryOne<DbQuiz>("SELECT * FROM quizzes WHERE id = ?", [quiz_id]);
    if (!currentQuiz) {
      res.status(404).json({ success: false, message: "Quiz not found" });
      return;
    }

    const normalizedQuestions = normalizeImportedQuestions(questions);
    await withTransaction(async (connection) => {
      for (const question of normalizedQuestions) {
        await connection.execute(
          "INSERT INTO questions (id, quiz_id, text, options, correctAnswer, explanation, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [question.id, quiz_id, question.text, JSON.stringify(question.options), question.correctAnswer, question.explanation, question.image_url || ""],
        );
      }
    });
    res.status(201).json({ success: true, message: `${normalizedQuestions.length} questions imported` });
  }));

  app.post("/api/updateQuestion", requireAdmin(), asyncHandler(async (req, res) => {
    const { id, quiz_id, text, options, correctAnswer, explanation } = req.body || {};
    if (!id || !quiz_id || !text || !Array.isArray(options) || options.length < 2) {
      res.status(400).json({ success: false, message: "Id, quiz, question text, and options are required" });
      return;
    }

    const current = await queryOne<DbQuestion>("SELECT * FROM questions WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    const normalizedOptions = options.map((option: unknown) => normalizeStoredQuizOption(option)).filter((option: unknown) => getQuizOptionText(option));
    const normalizedCorrectAnswer = Number(correctAnswer ?? 0);
    if (!Number.isInteger(normalizedCorrectAnswer) || normalizedCorrectAnswer < 0 || normalizedCorrectAnswer >= normalizedOptions.length) {
      res.status(400).json({ success: false, message: "Correct answer must match one of the provided options" });
      return;
    }

    const imageWasProvided = Object.prototype.hasOwnProperty.call(req.body, "image_url")
      || Object.prototype.hasOwnProperty.call(req.body, "imageUrl")
      || Object.prototype.hasOwnProperty.call(req.body, "questionImage")
      || Object.prototype.hasOwnProperty.call(req.body, "questionImageData");
    const nextImageUrl = await saveQuestionImage(req.body || {});
    const image_url = imageWasProvided ? nextImageUrl : String(current.image_url || "");
    if (image_url !== current.image_url) {
      await deleteStoredImage(current.image_url, "/uploads/questions/");
    }

    await execute(
      "UPDATE questions SET quiz_id = ?, text = ?, options = ?, correctAnswer = ?, explanation = ?, image_url = ? WHERE id = ?",
      [quiz_id, String(text).trim(), JSON.stringify(normalizedOptions), normalizedCorrectAnswer, String(explanation || "").trim(), image_url || "", id],
    );
    res.json({ success: true, message: "Question updated" });
  }));

  app.post("/api/deleteQuestion", requireAdmin(), asyncHandler(async (req, res) => {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ success: false, message: "Question id is required" });
      return;
    }
    const removed = await removeQuestionById(id);
    if (!removed) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }
    res.json({ success: true, message: "Question deleted" });
  }));

  app.post("/api/updateProfile", asyncHandler(async (req, res) => {
    const { id, name, avatarUrl, classLevel, password } = req.body || {};
    const trimmedName = String(name || "").trim();
    const trimmedAvatarUrl = String(avatarUrl || "").trim();
    const normalizedClassLevel = normalizeStudentClassLevel(classLevel);
    if (!id || !trimmedName) {
      res.status(400).json({ success: false, message: "User id and name are required" });
      return;
    }

    if (!isValidStudentName(trimmedName)) {
      res.status(400).json({ success: false, message: "Name must contain letters only" });
      return;
    }

    const current = await queryOne<DbUser>("SELECT * FROM users WHERE id = ?", [id]);
    if (!current) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (String(current.status || "active").toLowerCase() === "blocked") {
      res.status(403).json({ success: false, blocked: true, message: "Your account is blocked. Contact academy admin." });
      return;
    }

    const nextPassword = password ? hashPassword(String(password)) : current.password;
    await execute("UPDATE users SET name = ?, avatar_url = ?, class_level = ?, password = ? WHERE id = ?", [trimmedName, trimmedAvatarUrl, normalizedClassLevel, nextPassword, id]);
    const updatedUser = await queryOne<DbUser>("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "Profile updated", user: updatedUser ? await normalizeUser(updatedUser) : null });
  }));

  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    const message = process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ success: false, message });
  });

  return app;
};
