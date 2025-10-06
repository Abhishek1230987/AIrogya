import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import pool from "./database.js";

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findByGoogleId(profile.id);

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findByEmail(profile.emails[0].value);

        if (user) {
          // Link Google account to existing user
          // Update the user with Google ID
          const client = await pool.connect();
          try {
            await client.query(
              "UPDATE users SET google_id = $1 WHERE id = $2",
              [profile.id, user.id]
            );
            user.googleId = profile.id;
          } finally {
            client.release();
          }
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: "patient",
        });

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
