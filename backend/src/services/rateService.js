const { memoryDb } = require('../config/database');
const zoneService = require('./zoneService');
const { VOLUMETRIC_DIVISOR } = require('../config/constants');

class RateService {
  async getAllRateCards() {
    return memoryDb.rateCards;
  }

  async updateRateCard(id, updateData) {
    const card = memoryDb.rateCards.find(r => r.id === id);
    if (!card) throw new Error('Rate card not found');
    if (updateData.baseRate != null) card.baseRate = parseFloat(updateData.baseRate);
    if (updateData.perKgRate != null) card.perKgRate = parseFloat(updateData.perKgRate);
    if (updateData.codSurchargeRate != null) card.codSurchargeRate = parseFloat(updateData.codSurchargeRate);
    return card;
  }

  async calculateOrderCharge({
    pickupPincode,
    dropPincode,
    dimensions, // { length, width, height }
    actualWeight,
    orderType, // B2B or B2C
    paymentType // PREPAID or COD
  }) {
    const pickupZone = await zoneService.detectZoneByPincode(pickupPincode);
    const dropZone = await zoneService.detectZoneByPincode(dropPincode);

    const isIntraZone = pickupZone && dropZone && pickupZone.id === dropZone.id;

    // Volumetric weight: (L * W * H) / 5000
    const l = parseFloat(dimensions?.length || 0);
    const w = parseFloat(dimensions?.width || 0);
    const h = parseFloat(dimensions?.height || 0);
    const volumetricWeight = parseFloat(((l * w * h) / VOLUMETRIC_DIVISOR).toFixed(2));

    const actWeight = parseFloat(actualWeight || 0);
    const billableWeight = Math.max(actWeight, volumetricWeight);

    // Find rate card
    let rateCard = memoryDb.rateCards.find(
      r => r.orderType === orderType && r.isIntraZone === isIntraZone
    );

    if (!rateCard) {
      // Fallback rate card
      rateCard = {
        baseRate: isIntraZone ? 6.0 : 12.0,
        perKgRate: isIntraZone ? 1.5 : 2.5,
        codSurchargeRate: paymentType === 'COD' ? 2.5 : 0.0
      };
    }

    const baseCharge = parseFloat(rateCard.baseRate.toFixed(2));
    const weightCharge = parseFloat((billableWeight * rateCard.perKgRate).toFixed(2));
    const codSurcharge = paymentType === 'COD' ? parseFloat(rateCard.codSurchargeRate.toFixed(2)) : 0;

    const totalCharge = parseFloat((baseCharge + weightCharge + codSurcharge).toFixed(2));

    return {
      pickupZone,
      dropZone,
      isIntraZone,
      volumetricWeight,
      billableWeight,
      baseCharge,
      weightCharge,
      codSurcharge,
      totalCharge,
      appliedRateCard: rateCard
    };
  }
}

module.exports = new RateService();
