const cartService = require("../../services/cart.service");
const logger = require("../../config/logger");
const { responseFormatter } = require("../../utils/responseFormatter");
const { NotFoundError, BadRequestError } = require("../../utils/errorTypes");

/**
 * Process abandoned carts and send recovery emails
 * @route POST /api/v1/admin/abandoned-cart/process
 * @access Private (Admin, Manager)
 */
const processAbandonedCarts = async (req, res, next) => {
  try {
    const options = req.body || {};

    const stats = await cartService.processAbandonedCarts(options);

    return res
      .status(200)
      .json(
        responseFormatter(true, "Abandoned carts processed successfully", {
          stats,
        })
      );
  } catch (error) {
    logger.error("Error processing abandoned carts:", error);
    next(error);
  }
};

/**
 * Get abandoned cart recovery analytics
 * @route GET /api/v1/admin/abandoned-cart/analytics
 * @access Private (Admin, Manager)
 */
const getCartRecoveryAnalytics = async (req, res, next) => {
  try {
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const analytics = await cartService.getCartRecoveryAnalytics(options);

    return res
      .status(200)
      .json(
        responseFormatter(
          true,
          "Cart recovery analytics retrieved successfully",
          { analytics }
        )
      );
  } catch (error) {
    logger.error("Error retrieving cart recovery analytics:", error);
    next(error);
  }
};

/**
 * Handle cart recovery URL from email
 * @route GET /api/v1/cart/recover/:cartId/:token
 * @access Public
 */
const recoverAbandonedCart = async (req, res, next) => {
  try {
    const { cartId, token } = req.params;

    if (!cartId || !token) {
      throw new BadRequestError("Invalid recovery link");
    }

    const recoveredCart = await cartService.recoverAbandonedCart(cartId, token);

    // Redirect to the cart page with recovered cart
    return res.redirect(`/cart?recovered=true&cartId=${recoveredCart._id}`);
  } catch (error) {
    logger.error(
      `Error recovering abandoned cart ${req.params.cartId}:`,
      error
    );
    next(error);
  }
};

module.exports = {
  processAbandonedCarts,
  getCartRecoveryAnalytics,
  recoverAbandonedCart,
};
