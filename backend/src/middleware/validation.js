function validateOrderCreation(req, res, next) {
  const { pickupAddress, pickupPincode, dropAddress, dropPincode, dimensions, actualWeight, orderType, paymentType } = req.body;

  if (!pickupAddress || !pickupPincode || !dropAddress || !dropPincode) {
    return res.status(400).json({ success: false, message: 'Pickup & drop addresses and pincodes are required' });
  }

  if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
    return res.status(400).json({ success: false, message: 'Package dimensions (length, width, height) are required' });
  }

  if (!actualWeight || parseFloat(actualWeight) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid actual weight is required' });
  }

  if (!['B2B', 'B2C'].includes(orderType)) {
    return res.status(400).json({ success: false, message: 'Order type must be B2B or B2C' });
  }

  if (!['PREPAID', 'COD'].includes(paymentType)) {
    return res.status(400).json({ success: false, message: 'Payment type must be PREPAID or COD' });
  }

  next();
}

module.exports = {
  validateOrderCreation
};
