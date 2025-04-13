const {
  LoyaltyTier,
  PointsRule,
  CustomerLoyalty,
  LoyaltySettings,
} = require("../models/loyalty.model");
const { User } = require("../models/user.model");
const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { generateUniqueCode } = require("../utils/codeGenerator");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const { EventEmitter } = require("../utils/eventEmitter");

/**
 * Loyalty Service
 * Handles all loyalty program operations including points management,
 * tier progression, rule processing, and redemptions
 */
class LoyaltyService {
  /**
   * Initialize the loyalty program with default settings if not already configured
   */
  async initializeLoyaltyProgram() {
    try {
      // Check if settings already exist
      const existingSettings = await LoyaltySettings.findOne();
      if (!existingSettings) {
        logger.info("Initializing loyalty program settings");
        await LoyaltySettings.create({
          programName: "Rewards Program",
          isActive: true,
          pointsPerCurrencyUnit: 10, // 10 points per $1
          pointValue: 0.01, // 1 point = $0.01
          minimumRedemption: 500, // Minimum 500 points to redeem
          pointsExpiry: 365, // Points expire after 1 year
          autoEnroll: true,
          enablePointExpiry: true,
          enableTiers: true,
          enableReferrals: true,
          referrerPoints: 500,
          referredPoints: 250,
        });
      }

      // Check if tiers exist
      const tierCount = await LoyaltyTier.countDocuments();
      if (tierCount === 0) {
        logger.info("Creating default loyalty tiers");
        await LoyaltyTier.insertMany([
          {
            name: "Bronze",
            code: "bronze",
            pointThreshold: 0,
            benefits: [
              {
                type: "points_multiplier",
                value: 1,
                description: "Standard points earning rate",
              },
            ],
            pointsMultiplier: 1,
            color: "#CD7F32",
            isActive: true,
            displayOrder: 1,
          },
          {
            name: "Silver",
            code: "silver",
            pointThreshold: 1000,
            benefits: [
              {
                type: "points_multiplier",
                value: 1.25,
                description: "25% bonus points on all purchases",
              },
              {
                type: "free_shipping",
                value: true,
                description: "Free shipping on orders over $50",
              },
            ],
            pointsMultiplier: 1.25,
            color: "#C0C0C0",
            isActive: true,
            displayOrder: 2,
          },
          {
            name: "Gold",
            code: "gold",
            pointThreshold: 5000,
            benefits: [
              {
                type: "points_multiplier",
                value: 1.5,
                description: "50% bonus points on all purchases",
              },
              {
                type: "free_shipping",
                value: true,
                description: "Free shipping on all orders",
              },
              {
                type: "discount_percentage",
                value: 5,
                description: "5% discount on all purchases",
              },
            ],
            pointsMultiplier: 1.5,
            color: "#FFD700",
            isActive: true,
            displayOrder: 3,
          },
          {
            name: "Platinum",
            code: "platinum",
            pointThreshold: 10000,
            benefits: [
              {
                type: "points_multiplier",
                value: 2,
                description: "Double points on all purchases",
              },
              {
                type: "free_shipping",
                value: true,
                description: "Free priority shipping on all orders",
              },
              {
                type: "discount_percentage",
                value: 10,
                description: "10% discount on all purchases",
              },
              {
                type: "birthday_bonus",
                value: 1000,
                description: "1000 bonus points on your birthday",
              },
              {
                type: "priority_support",
                value: true,
                description: "Priority customer support",
              },
            ],
            pointsMultiplier: 2,
            color: "#E5E4E2",
            isActive: true,
            displayOrder: 4,
          },
        ]);
      }

      // Create default points rules if none exist
      const rulesCount = await PointsRule.countDocuments();
      if (rulesCount === 0) {
        logger.info("Creating default points rules");
        await PointsRule.insertMany([
          {
            name: "Purchase Points",
            type: "purchase",
            calculationType: "percentage",
            value: 10, // 10 points per $ spent
            minimumAmount: 0,
            eventCode: "order.completed",
            description: "Earn 10 points for every $1 spent",
            isActive: true,
          },
          {
            name: "Account Creation",
            type: "signup",
            calculationType: "fixed",
            value: 250, // 250 points for signing up
            eventCode: "user.created",
            description: "Earn 250 points when you create an account",
            isActive: true,
          },
          {
            name: "Product Review",
            type: "review",
            calculationType: "fixed",
            value: 50, // 50 points per review
            eventCode: "review.created",
            description: "Earn 50 points for each product review",
            isActive: true,
          },
          {
            name: "Referral Bonus",
            type: "referral",
            calculationType: "fixed",
            value: 500, // 500 points per referral
            eventCode: "user.referred",
            description:
              "Earn 500 points when someone signs up using your referral code",
            isActive: true,
          },
        ]);
      }

      return {
        success: true,
        message: "Loyalty program initialized successfully",
      };
    } catch (error) {
      logger.error("Error initializing loyalty program", error);
      throw new Error("Failed to initialize loyalty program");
    }
  }

  /**
   * Get loyalty program settings
   */
  async getSettings() {
    try {
      const settings = await LoyaltySettings.findOne();
      if (!settings) {
        await this.initializeLoyaltyProgram();
        return await LoyaltySettings.findOne();
      }
      return settings;
    } catch (error) {
      logger.error("Error getting loyalty settings", error);
      throw new Error("Failed to get loyalty program settings");
    }
  }

  /**
   * Update loyalty program settings
   * @param {Object} settingsData - Updated settings data
   */
  async updateSettings(settingsData) {
    try {
      const settings = await LoyaltySettings.findOne();
      if (!settings) {
        await this.initializeLoyaltyProgram();
        return await LoyaltySettings.findOneAndUpdate({}, settingsData, {
          new: true,
          runValidators: true,
        });
      }

      return await LoyaltySettings.findByIdAndUpdate(
        settings._id,
        settingsData,
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (error) {
      logger.error("Error updating loyalty settings", error);
      throw new Error("Failed to update loyalty program settings");
    }
  }

  /**
   * Enroll a user in the loyalty program
   * @param {string} userId - User ID to enroll
   */
  async enrollUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user already enrolled
      let customerLoyalty = await CustomerLoyalty.findOne({ user: userId });
      if (customerLoyalty) {
        return {
          success: false,
          message: "User already enrolled in loyalty program",
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Get default tier (lowest threshold)
      const defaultTier = await LoyaltyTier.findOne({ isActive: true }).sort(
        "pointThreshold"
      );
      if (!defaultTier) {
        throw new Error("No active loyalty tiers found");
      }

      // Generate unique referral code
      const referralCode = await generateUniqueCode("referral", 8);

      // Create customer loyalty record
      customerLoyalty = await CustomerLoyalty.create({
        user: userId,
        currentTier: defaultTier._id,
        tierHistory: [{ tier: defaultTier._id }],
        referralCode,
        enrolledAt: new Date(),
        isActive: true,
      });

      // Look for signup rule and award points if applicable
      const signupRule = await PointsRule.findOne({
        type: "signup",
        isActive: true,
      });
      if (signupRule) {
        await this.awardPoints(userId, {
          points: signupRule.value,
          type: "earn",
          source: "signup",
          description: "Welcome bonus for joining the loyalty program",
        });
      }

      // Check if user was referred
      if (user.referredBy) {
        const settings = await this.getSettings();
        if (settings.enableReferrals) {
          // Award points to referrer
          await this.awardPoints(user.referredBy, {
            points: settings.referrerPoints,
            type: "earn",
            source: "referral",
            referenceId: userId.toString(),
            description: "Bonus for referring a new customer",
          });

          // Record referral in referrer's loyalty account
          await CustomerLoyalty.findOneAndUpdate(
            { user: user.referredBy },
            {
              $push: {
                referrals: {
                  referredUser: userId,
                  pointsAwarded: settings.referrerPoints,
                },
              },
            }
          );

          // Award points to referred user
          await this.awardPoints(userId, {
            points: settings.referredPoints,
            type: "earn",
            source: "referral",
            description: "Bonus for joining through a referral",
          });
        }
      }

      await session.commitTransaction();
      session.endSession();

      EventEmitter.emit("user.enrolled.loyalty", { userId });
      return {
        success: true,
        message: "User enrolled in loyalty program successfully",
        data: customerLoyalty,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error("Error enrolling user in loyalty program", error);
      throw new Error("Failed to enroll user in loyalty program");
    }
  }

  /**
   * Get a user's loyalty program information
   * @param {string} userId - User ID
   */
  async getUserLoyalty(userId) {
    try {
      const customerLoyalty = await CustomerLoyalty.findOne({ user: userId })
        .populate("currentTier")
        .populate("tierHistory.tier");

      if (!customerLoyalty) {
        return {
          success: false,
          message: "User not enrolled in loyalty program",
        };
      }

      // Get next tier information if applicable
      let nextTier = null;
      if (customerLoyalty.currentTier) {
        nextTier = await LoyaltyTier.findOne({
          pointThreshold: { $gt: customerLoyalty.currentTier.pointThreshold },
          isActive: true,
        }).sort("pointThreshold");
      }

      // Calculate progress to next tier
      let tierProgress = 0;
      if (nextTier) {
        const currentThreshold = customerLoyalty.currentTier.pointThreshold;
        const nextThreshold = nextTier.pointThreshold;
        const pointsDifference = nextThreshold - currentThreshold;
        const userProgress =
          customerLoyalty.totalPointsEarned - currentThreshold;
        tierProgress = Math.min(
          100,
          Math.floor((userProgress / pointsDifference) * 100)
        );
      } else {
        // Already at highest tier
        tierProgress = 100;
      }

      // Get user data
      const user = await User.findById(userId, "firstName lastName email");

      return {
        success: true,
        data: {
          ...customerLoyalty.toObject(),
          user,
          nextTier,
          tierProgress,
          pointsToNextTier: nextTier
            ? nextTier.pointThreshold - customerLoyalty.totalPointsEarned
            : 0,
        },
      };
    } catch (error) {
      logger.error("Error getting user loyalty information", error);
      throw new Error("Failed to get user loyalty information");
    }
  }

  /**
   * Award points to a user
   * @param {string} userId - User ID
   * @param {Object} pointsData - Points transaction data
   */
  async awardPoints(userId, pointsData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get settings to check if program is active
      const settings = await this.getSettings();
      if (!settings.isActive) {
        return {
          success: false,
          message: "Loyalty program is currently inactive",
        };
      }

      // Find or create customer loyalty record
      let customerLoyalty = await CustomerLoyalty.findOne({ user: userId });
      if (!customerLoyalty) {
        // Auto-enroll if enabled
        if (settings.autoEnroll) {
          const enrollResult = await this.enrollUser(userId);
          if (!enrollResult.success) {
            throw new Error(enrollResult.message);
          }
          customerLoyalty = enrollResult.data;
        } else {
          return {
            success: false,
            message: "User not enrolled in loyalty program",
          };
        }
      }

      if (!customerLoyalty.isActive) {
        return { success: false, message: "User loyalty account is inactive" };
      }

      // Calculate expiry date if enabled
      let expiryDate = null;
      if (settings.enablePointExpiry && settings.pointsExpiry > 0) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + settings.pointsExpiry);
      }

      // Create transaction data
      const transaction = {
        type: pointsData.type || "earn",
        points: pointsData.points,
        source: pointsData.source,
        referenceId: pointsData.referenceId,
        referenceModel: pointsData.referenceModel,
        description: pointsData.description,
        expiryDate,
        createdAt: new Date(),
      };

      // Update customer loyalty record
      const updateData = {
        $push: { transactions: transaction },
      };

      // Update points balances
      if (transaction.type === "earn" || transaction.type === "bonus") {
        updateData.$inc = {
          pointsBalance: transaction.points,
          totalPointsEarned: transaction.points,
        };
      } else if (
        transaction.type === "redeem" ||
        transaction.type === "expire"
      ) {
        updateData.$inc = { pointsBalance: -Math.abs(transaction.points) };
      } else if (transaction.type === "adjust") {
        updateData.$inc = { pointsBalance: transaction.points };
        if (transaction.points > 0) {
          updateData.$inc.totalPointsEarned = transaction.points;
        }
      }

      const updatedLoyalty = await CustomerLoyalty.findByIdAndUpdate(
        customerLoyalty._id,
        updateData,
        { new: true, session }
      );

      // Check if user should be upgraded to a new tier
      await this.checkAndUpdateTier(updatedLoyalty._id, session);

      await session.commitTransaction();
      session.endSession();

      // Emit event
      EventEmitter.emit("loyalty.points.awarded", {
        userId,
        points: transaction.points,
        transaction,
      });

      return {
        success: true,
        message: "Points awarded successfully",
        data: transaction,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error("Error awarding points", error);
      throw new Error("Failed to award points");
    }
  }

  /**
   * Check and update a user's tier based on total points earned
   * @param {string} loyaltyId - CustomerLoyalty document ID
   * @param {Object} session - Mongoose session for transaction
   */
  async checkAndUpdateTier(loyaltyId, session) {
    try {
      const customerLoyalty = await CustomerLoyalty.findById(
        loyaltyId
      ).populate("currentTier");

      // Get all active tiers sorted by threshold
      const tiers = await LoyaltyTier.find({ isActive: true }).sort(
        "pointThreshold"
      );

      if (tiers.length === 0) {
        return { success: false, message: "No active loyalty tiers found" };
      }

      // Find the highest tier the user qualifies for
      let highestQualifyingTier = tiers[0];
      for (const tier of tiers) {
        if (customerLoyalty.totalPointsEarned >= tier.pointThreshold) {
          highestQualifyingTier = tier;
        } else {
          break;
        }
      }

      // Check if user needs a tier update
      if (
        !customerLoyalty.currentTier ||
        highestQualifyingTier._id.toString() !==
          customerLoyalty.currentTier._id.toString()
      ) {
        // Update customer's tier
        const updateOp = {
          currentTier: highestQualifyingTier._id,
          $push: {
            tierHistory: {
              tier: highestQualifyingTier._id,
              achievedAt: new Date(),
            },
          },
        };

        await CustomerLoyalty.findByIdAndUpdate(loyaltyId, updateOp, {
          session,
          new: true,
        });

        // Emit tier change event
        EventEmitter.emit("loyalty.tier.changed", {
          userId: customerLoyalty.user,
          previousTier: customerLoyalty.currentTier
            ? customerLoyalty.currentTier._id
            : null,
          newTier: highestQualifyingTier._id,
        });

        return {
          success: true,
          message: "User tier updated successfully",
          data: {
            previousTier: customerLoyalty.currentTier,
            newTier: highestQualifyingTier,
          },
        };
      }

      return { success: true, message: "No tier update needed" };
    } catch (error) {
      logger.error("Error checking and updating tier", error);
      throw new Error("Failed to check and update user tier");
    }
  }

  /**
   * Process points earned from a completed order
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   */
  async processOrderPoints(orderId, userId) {
    try {
      // Get order details
      const order = await Order.findById(orderId).populate("items.product");
      if (!order) {
        return { success: false, message: "Order not found" };
      }

      // Get purchase rule
      const purchaseRule = await PointsRule.findOne({
        type: "purchase",
        isActive: true,
      });

      if (!purchaseRule) {
        return {
          success: false,
          message: "No active purchase points rule found",
        };
      }

      // Get user's current tier for multiplier
      const customerLoyalty = await CustomerLoyalty.findOne({
        user: userId,
      }).populate("currentTier");

      if (!customerLoyalty) {
        return {
          success: false,
          message: "User not enrolled in loyalty program",
        };
      }

      const tierMultiplier = customerLoyalty.currentTier
        ? customerLoyalty.currentTier.pointsMultiplier
        : 1;

      // Calculate base points based on order total
      let basePoints = 0;
      if (purchaseRule.calculationType === "percentage") {
        // Points per currency unit (e.g., 10 points per $1)
        basePoints = Math.floor(order.totalAmount * purchaseRule.value);
      } else if (purchaseRule.calculationType === "fixed") {
        // Fixed points per order
        basePoints = purchaseRule.value;
      }

      // Apply tier multiplier
      const totalPoints = Math.floor(basePoints * tierMultiplier);

      // Award points
      const result = await this.awardPoints(userId, {
        points: totalPoints,
        type: "earn",
        source: "purchase",
        referenceId: orderId.toString(),
        referenceModel: "Order",
        description: `Points earned from order #${order.orderNumber}`,
      });

      return {
        success: true,
        message: "Order points processed successfully",
        data: {
          basePoints,
          tierMultiplier,
          totalPoints,
          transaction: result.data,
        },
      };
    } catch (error) {
      logger.error("Error processing order points", error);
      throw new Error("Failed to process order points");
    }
  }

  /**
   * Redeem points for a discount or reward
   * @param {string} userId - User ID
   * @param {Object} redemptionData - Redemption data
   */
  async redeemPoints(userId, redemptionData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get settings to check minimum redemption
      const settings = await this.getSettings();
      if (!settings.isActive) {
        return {
          success: false,
          message: "Loyalty program is currently inactive",
        };
      }

      // Validate points amount
      const pointsToRedeem = Math.abs(redemptionData.points);
      if (pointsToRedeem < settings.minimumRedemption) {
        return {
          success: false,
          message: `Minimum redemption is ${settings.minimumRedemption} points`,
        };
      }

      // Get user's loyalty record
      const customerLoyalty = await CustomerLoyalty.findOne({ user: userId });
      if (!customerLoyalty) {
        return {
          success: false,
          message: "User not enrolled in loyalty program",
        };
      }

      if (!customerLoyalty.isActive) {
        return { success: false, message: "User loyalty account is inactive" };
      }

      // Check if user has enough points
      if (customerLoyalty.pointsBalance < pointsToRedeem) {
        return {
          success: false,
          message: `Insufficient points balance. Available: ${customerLoyalty.pointsBalance}`,
        };
      }

      // Calculate the monetary value of the redemption
      const redemptionValue = pointsToRedeem * settings.pointValue;

      // Create redemption record
      const redemption = {
        type: redemptionData.type || "discount",
        pointsRedeemed: pointsToRedeem,
        value: redemptionValue,
        referenceId: redemptionData.referenceId,
        description:
          redemptionData.description || `Redeemed ${pointsToRedeem} points`,
        redeemedAt: new Date(),
      };

      // Deduct points
      await this.awardPoints(userId, {
        points: -pointsToRedeem,
        type: "redeem",
        source: "redemption",
        referenceId: redemptionData.referenceId,
        description:
          redemptionData.description || `Redeemed ${pointsToRedeem} points`,
      });

      // Add to redemption history
      await CustomerLoyalty.findOneAndUpdate(
        { user: userId },
        { $push: { redemptions: redemption } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      // Emit event
      EventEmitter.emit("loyalty.points.redeemed", {
        userId,
        pointsRedeemed: pointsToRedeem,
        redemption,
      });

      return {
        success: true,
        message: "Points redeemed successfully",
        data: {
          redemption,
          remainingBalance: customerLoyalty.pointsBalance - pointsToRedeem,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error("Error redeeming points", error);
      throw new Error("Failed to redeem points");
    }
  }

  /**
   * Clear expired points and update user balance
   */
  async clearExpiredPoints() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const settings = await this.getSettings();
      if (!settings.enablePointExpiry) {
        return { success: true, message: "Point expiry is disabled" };
      }

      const now = new Date();

      // Find all loyalty accounts with expired points
      const loyaltyAccounts = await CustomerLoyalty.find({
        "transactions.expiryDate": { $lt: now },
        "transactions.type": { $in: ["earn", "bonus"] },
      });

      let totalExpired = 0;
      let accountsUpdated = 0;

      for (const account of loyaltyAccounts) {
        let expiredPoints = 0;
        const expiredTransactions = [];

        // Find expired transactions that haven't been marked as expired
        for (const transaction of account.transactions) {
          if (
            transaction.expiryDate &&
            transaction.expiryDate < now &&
            (transaction.type === "earn" || transaction.type === "bonus")
          ) {
            expiredPoints += transaction.points;
            expiredTransactions.push(transaction._id);
          }
        }

        if (expiredPoints > 0) {
          // Create an expiration transaction
          await this.awardPoints(account.user, {
            points: -expiredPoints,
            type: "expire",
            source: "expiration",
            description: `${expiredPoints} points expired`,
          });

          totalExpired += expiredPoints;
          accountsUpdated++;
        }
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: "Expired points cleared successfully",
        data: { accountsUpdated, totalExpired },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error("Error clearing expired points", error);
      throw new Error("Failed to clear expired points");
    }
  }

  /**
   * Generate a referral link for a user
   * @param {string} userId - User ID
   */
  async generateReferralLink(userId) {
    try {
      // Get settings to check if referrals are enabled
      const settings = await this.getSettings();
      if (!settings.enableReferrals) {
        return {
          success: false,
          message: "Referral program is currently disabled",
        };
      }

      // Get user's loyalty account
      let customerLoyalty = await CustomerLoyalty.findOne({ user: userId });
      if (!customerLoyalty) {
        // Auto-enroll if enabled
        if (settings.autoEnroll) {
          const enrollResult = await this.enrollUser(userId);
          if (!enrollResult.success) {
            throw new Error(enrollResult.message);
          }
          customerLoyalty = enrollResult.data;
        } else {
          return {
            success: false,
            message: "User not enrolled in loyalty program",
          };
        }
      }

      // Generate new referral code if one doesn't exist
      if (!customerLoyalty.referralCode) {
        const referralCode = await generateUniqueCode("referral", 8);
        customerLoyalty = await CustomerLoyalty.findByIdAndUpdate(
          customerLoyalty._id,
          { referralCode },
          { new: true }
        );
      }

      // Format for the referral link - front-end will need to use this format
      const referralLink = `/signup?ref=${customerLoyalty.referralCode}`;

      return {
        success: true,
        data: {
          referralCode: customerLoyalty.referralCode,
          referralLink,
          referrerPoints: settings.referrerPoints,
          referredPoints: settings.referredPoints,
        },
      };
    } catch (error) {
      logger.error("Error generating referral link", error);
      throw new Error("Failed to generate referral link");
    }
  }

  /**
   * Get available loyalty tiers
   */
  async getLoyaltyTiers() {
    try {
      const tiers = await LoyaltyTier.find({ isActive: true }).sort(
        "displayOrder"
      );
      return { success: true, data: tiers };
    } catch (error) {
      logger.error("Error getting loyalty tiers", error);
      throw new Error("Failed to get loyalty tiers");
    }
  }

  /**
   * Get points rules
   */
  async getPointsRules() {
    try {
      const rules = await PointsRule.find({ isActive: true });
      return { success: true, data: rules };
    } catch (error) {
      logger.error("Error getting points rules", error);
      throw new Error("Failed to get points rules");
    }
  }
}

module.exports = new LoyaltyService();
