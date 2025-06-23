import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  bio: text("bio"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const followers = pgTable("followers", {
  id: text("id").primaryKey(),
  followerId: text("follower_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  followingId: text("following_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const post = pgTable("post", {
  id: text("id").primaryKey(),
  images: text("images").array(),
  description: text("description").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  postId: text("post_id").references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const likes = pgTable("likes", {
  id: text("id").primaryKey(),
  likes: integer("likes").notNull().default(0),
  postId: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const savedPosts = pgTable("saved_posts", {
  id: text("id").primaryKey(),
  postId: text("post_id").references(() => post.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const userRelations = relations(user, ({ many }) => ({
  posts: many(post),
  comments: many(comments),
  likes: many(likes),
  savedPosts: many(savedPosts),
  followers: many(followers, { relationName: "following" }),
  following: many(followers, { relationName: "followers" }),
  sessions: many(session),
  accounts: many(account),
}));

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(user, {
    fields: [post.userId],
    references: [user.id],
  }),
  comments: many(comments),
  likes: many(likes),
  savedPosts: many(savedPosts),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(user, {
    fields: [followers.followerId],
    references: [user.id],
    relationName: "followers",
  }),
  following: one(user, {
    fields: [followers.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [comments.postId],
    references: [post.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(user, {
    fields: [likes.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [likes.postId],
    references: [post.id],
  }),
}));

export const savedPostsRelations = relations(savedPosts, ({ one }) => ({
  user: one(user, {
    fields: [savedPosts.userId],
    references: [user.id],
  }),
  post: one(post, {
    fields: [savedPosts.postId],
    references: [post.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
