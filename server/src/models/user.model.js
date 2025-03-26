// src/models/user.model.js
const mongoose = require("mongoose");
const {
  USER_ROLES,
  USER_STATUS,
  LOYALTY_TIERS,
} = require("../utils/constants");

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["billing", "shipping"],
    default: "shipping",
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: [true, "Address name is required"],
  },
  street: {
    type: String,
    required: [true, "Street address is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  state: {
    type: String,
    required: [true, "State is required"],
  },
  postalCode: {
    type: String,
    required: [true, "Postal code is required"],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
    default: "India",
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      index: true,
    },
    password: {
      type: String,
      required: function() {
        // Password is required only if not using a social login method
        return !this.socialAuth || Object.keys(this.socialAuth).length === 0;
      },
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    socialAuth: {
      google: {
        id: String,
        token: String,
        email: String,
        name: String,
        photo: String,
      },
      facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
        photo: String,
      },
      twitter: {
        id: String,
        token: String,
        email: String,
        name: String,
        photo: String,
      },
      apple: {
        id: String,
        token: String,
        email: String,
        name: String,
        photo: String,
      },
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
    permissions: [
      {
        type: String,
      },
    ],
    profile: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String, // URL to uploaded image
      },
    },
    addresses: [addressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    recentlyViewed: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    loyalty: {
      points: {
        type: Number,
        default: 0,
      },
      tier: {
        type: String,
        enum: Object.values(LOYALTY_TIERS),
        default: LOYALTY_TIERS.BRONZE,
      },
    },
    preferences: {
      marketing: {
        type: Boolean,
        default: true,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for name search
userSchema.index({ "profile.firstName": 1, "profile.lastName": 1 });

// Virtual for full name
userSchema.virtual("profile.fullName").get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || "";
});

// Virtual for orders - will populate from Order model
userSchema.virtual("orders", {
  ref: "Order",
  localField: "_id",
  foreignField: "user",
});

// Pre-save hook to ensure only one default address per type
userSchema.pre("save", function (next) {
  if (this.isModified("addresses")) {
    // For each address type, ensure only one default
    ["shipping", "billing"].forEach((type) => {
      const addressesOfType = this.addresses.filter(
        (addr) => addr.type === type
      );

      // If there's a new default, unset previous defaults
      const newDefault = addressesOfType.find(
        (addr) => addr.isDefault === true
      );

      if (newDefault) {
        addressesOfType.forEach((addr) => {
          if (addr._id.toString() !== newDefault._id.toString()) {
            addr.isDefault = false;
          }
        });
      }
      // If no default, set the first one as default
      else if (
        addressesOfType.length > 0 &&
        !addressesOfType.some((addr) => addr.isDefault)
      ) {
        addressesOfType[0].isDefault = true;
      }
    });
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
