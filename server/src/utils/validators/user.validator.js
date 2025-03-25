// src/utils/validators/user.validator.js
const Joi = require("joi");

// Update profile validation schema
const updateProfile = Joi.object({
  body: Joi.object({
    profile: Joi.object({
      firstName: Joi.string().min(2).max(50).required().messages({
        "string.min": "First name must be at least 2 characters",
        "string.max": "First name must not exceed 50 characters",
        "any.required": "First name is required",
      }),
      lastName: Joi.string().min(2).max(50).allow("", null).messages({
        "string.min": "Last name must be at least 2 characters",
        "string.max": "Last name must not exceed 50 characters",
      }),
      phone: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .allow("", null)
        .messages({
          "string.pattern.base":
            "Phone number must be between 10 and 15 digits",
        }),
    }).required(),
  }),
});

// Address validation schema
const addressSchema = Joi.object({
  type: Joi.string().valid("billing", "shipping").required().messages({
    "any.only": "Address type must be either billing or shipping",
    "any.required": "Address type is required",
  }),
  isDefault: Joi.boolean().default(false),
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  street: Joi.string().min(3).max(255).required().messages({
    "string.min": "Street must be at least 3 characters",
    "string.max": "Street must not exceed 255 characters",
    "any.required": "Street is required",
  }),
  city: Joi.string().min(2).max(100).required().messages({
    "string.min": "City must be at least 2 characters",
    "string.max": "City must not exceed 100 characters",
    "any.required": "City is required",
  }),
  state: Joi.string().min(2).max(100).required().messages({
    "string.min": "State must be at least 2 characters",
    "string.max": "State must not exceed 100 characters",
    "any.required": "State is required",
  }),
  postalCode: Joi.string().min(3).max(20).required().messages({
    "string.min": "Postal code must be at least 3 characters",
    "string.max": "Postal code must not exceed 20 characters",
    "any.required": "Postal code is required",
  }),
  country: Joi.string().min(2).max(100).default("India").messages({
    "string.min": "Country must be at least 2 characters",
    "string.max": "Country must not exceed 100 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be between 10 and 15 digits",
      "any.required": "Phone number is required",
    }),
});

// Add address validation schema
const addAddress = Joi.object({
  body: Joi.object({
    address: addressSchema.required(),
  }),
});

// Update address validation schema
const updateAddress = Joi.object({
  params: Joi.object({
    addressId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid address ID format",
        "any.required": "Address ID is required",
      }),
  }),
  body: Joi.object({
    address: addressSchema.required(),
  }),
});

// Delete address validation schema
const deleteAddress = Joi.object({
  params: Joi.object({
    addressId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid address ID format",
        "any.required": "Address ID is required",
      }),
  }),
});

// Update preferences validation schema
const updatePreferences = Joi.object({
  body: Joi.object({
    preferences: Joi.object({
      marketing: Joi.boolean().optional(),
      notifications: Joi.boolean().optional(),
    }).required(),
  }),
});

// Add to wishlist validation schema
const addToWishlist = Joi.object({
  body: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
});

// Remove from wishlist validation schema
const removeFromWishlist = Joi.object({
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid product ID format",
        "any.required": "Product ID is required",
      }),
  }),
});

module.exports = {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  updatePreferences,
  addToWishlist,
  removeFromWishlist,
};
