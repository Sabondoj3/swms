import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  institution: z.string().max(120).optional().or(z.literal("")),
  studentId: z.string().max(50).optional().or(z.literal("")),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

export const reportSchema = z.object({
  collectionPointId: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3).max(300),
  wasteCategory: z.enum(["PLASTIC","PAPER","FOOD_ORGANIC","METAL","GLASS","E_WASTE","MIXED","HAZARDOUS","OTHER"]),
  problemType: z.enum(["BIN_OVERFLOWING","ILLEGAL_DUMPING","BIN_DAMAGED","MISSED_COLLECTION","NO_BIN","SCATTERED","OTHER"]),
  description: z.string().max(2000).optional().or(z.literal("")),
  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).optional(),
  imageUrls: z.array(z.string()).max(5).default([]),
});

export const collectionPointSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9\-_]+$/i, "Code must be alphanumeric with dashes"),
  name: z.string().min(3).max(120),
  organizationId: z.string().optional().nullable(),
  address: z.string().min(3).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(10).max(10000).default(240),
  binType: z.string().min(2).max(60).default("General"),
  wasteCategory: z.enum(["PLASTIC","PAPER","FOOD_ORGANIC","METAL","GLASS","E_WASTE","MIXED","HAZARDOUS","OTHER"]).default("MIXED"),
  collectionFrequency: z.string().min(2).max(60).default("Daily"),
  status: z.enum(["ACTIVE","FULL","MAINTENANCE","INACTIVE"]).default("ACTIVE"),
});

export const assignSchema = z.object({
  reportId: z.string().min(1),
  collectorId: z.string().min(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["SUBMITTED","UNDER_REVIEW","VERIFIED","ASSIGNED","ACCEPTED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED"]),
  comment: z.string().max(1000).optional().or(z.literal("")),
  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).optional(),
  internalNote: z.string().max(2000).optional().or(z.literal("")),
});

export const educationSchema = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(150).regex(/^[a-z0-9\-]+$/),
  category: z.string().min(2).max(60),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(10),
  coverImage: z.string().optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
