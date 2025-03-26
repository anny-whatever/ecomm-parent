// src/utils/validators/auth.validator.js
const Joi = require("joi");
const { SOCIAL_AUTH_PROVIDERS } = require("../constants");

// Register validation schema
const register = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "Password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your password",
      }),
    profile: Joi.object({
      firstName: Joi.string().required().messages({
        "any.required": "First name is required",
      }),
      lastName: Joi.string().allow("", null),
      phone: Joi.string().allow("", null),
    }),
  }),
});

// Login validation schema
const login = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),
});

// Forgot password validation schema
const forgotPassword = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),
});

// Reset password validation schema
const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Token is required",
    }),
    password: Joi.string()
      .min(8)
      .required()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "Password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your password",
      }),
  }),
});

// Change password validation schema
const changePassword = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .required()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "New password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "any.required": "Please confirm your new password",
      }),
  }),
});

// Link social account validation schema
const linkSocialAccount = Joi.object({
  params: Joi.object({
    provider: Joi.string()
      .valid(...Object.values(SOCIAL_AUTH_PROVIDERS))
      .required()
      .messages({
        "any.only": "Invalid social provider",
        "any.required": "Provider is required",
      }),
  }),
  body: Joi.object({
    profile: Joi.object({
      id: Joi.string().required(),
      displayName: Joi.string().required(),
      emails: Joi.array().items(
        Joi.object({
          value: Joi.string().email().required(),
        })
      ),
      photos: Joi.array().items(
        Joi.object({
          value: Joi.string().uri(),
        })
      ),
      name: Joi.object({
        givenName: Joi.string(),
        familyName: Joi.string(),
      }),
    }).required(),
    token: Joi.string().required(),
  }),
});

// Unlink social account validation schema
const unlinkSocialAccount = Joi.object({
  params: Joi.object({
    provider: Joi.string()
      .valid(...Object.values(SOCIAL_AUTH_PROVIDERS))
      .required()
      .messages({
        "any.only": "Invalid social provider",
        "any.required": "Provider is required",
      }),
  }),
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  linkSocialAccount,
  unlinkSocialAccount,
};
