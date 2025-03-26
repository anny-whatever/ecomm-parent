const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const User = require('../../models/user.model');
const { SOCIAL_AUTH_PROVIDERS } = require('../../utils/constants');
const logger = require('../logger');

// JWT Strategy for token authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      
      if (!user) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      logger.error('Error in JWT strategy:', error);
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`,
        passReqToCallback: true,
        scope: ['profile', 'email'],
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({
            $or: [
              { 'socialAuth.google.id': profile.id },
              { email: profile.emails[0].value }
            ]
          });

          // If user exists, update their Google auth info
          if (user) {
            // Update the Google auth data
            user.socialAuth = user.socialAuth || {};
            user.socialAuth.google = {
              id: profile.id,
              token: accessToken,
              email: profile.emails[0].value,
              name: profile.displayName,
              photo: profile.photos[0]?.value,
            };

            // If this is a new connection but email already exists
            if (!user.emailVerified) {
              user.emailVerified = true;
            }

            await user.save();
            return done(null, user);
          }

          // If user doesn't exist, create a new one
          const newUser = new User({
            email: profile.emails[0].value,
            emailVerified: true,
            status: 'active',
            profile: {
              firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
              lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
              avatar: profile.photos[0]?.value,
            },
            socialAuth: {
              google: {
                id: profile.id,
                token: accessToken,
                email: profile.emails[0].value,
                name: profile.displayName,
                photo: profile.photos[0]?.value,
              }
            }
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          logger.error('Error in Google strategy:', error);
          return done(error, false);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.API_URL}/api/v1/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email', 'name'],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Check if user email is available (Facebook might not provide it)
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (!email) {
            return done(new Error('Email not provided by Facebook. Please try another login method.'), false);
          }

          // Check if user already exists
          let user = await User.findOne({
            $or: [
              { 'socialAuth.facebook.id': profile.id },
              { email }
            ]
          });

          // If user exists, update their Facebook auth info
          if (user) {
            // Update the Facebook auth data
            user.socialAuth = user.socialAuth || {};
            user.socialAuth.facebook = {
              id: profile.id,
              token: accessToken,
              email,
              name: profile.displayName,
              photo: profile.photos[0]?.value,
            };

            // If this is a new connection but email already exists
            if (!user.emailVerified) {
              user.emailVerified = true;
            }

            await user.save();
            return done(null, user);
          }

          // If user doesn't exist, create a new one
          const newUser = new User({
            email,
            emailVerified: true,
            status: 'active',
            profile: {
              firstName: profile.name?.givenName || profile.displayName.split(' ')[0],
              lastName: profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' '),
              avatar: profile.photos[0]?.value,
            },
            socialAuth: {
              facebook: {
                id: profile.id,
                token: accessToken,
                email,
                name: profile.displayName,
                photo: profile.photos[0]?.value,
              }
            }
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          logger.error('Error in Facebook strategy:', error);
          return done(error, false);
        }
      }
    )
  );
}

module.exports = passport; 