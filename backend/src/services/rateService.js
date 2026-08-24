const { memoryDb } = require('../config/database');
const zoneService = require('./zoneService');
const { VOLUMETRIC_DIVISOR } = require('../config/constants');

class RateService {
  async getAllRateCards() {
    return memoryDb.rateCards || [];
  }

  async updateRateCard(id, updateData) {
    const card = (memoryDb.rateCards || []).find(r => r.id === id);
    if (!card) throw new Error('Rate card not found');

    if (updateData.baseRate != null) card.baseRate = parseFloat(updateData.baseRate);
    if (updateData.perKgRate != null) card.perKgRate = parseFloat(updateData.perKgRate);
    if (updateData.codSurchargeRate != null) card.codSurchargeRate = parseFloat(updateData.codSurchargeRate);
    if (updateData.orderType) card.orderType = updateData.orderType;
    if (updateData.isIntraZone != null) card.isIntraZone = Boolean(updateData.isIntraZone);

    return card;
  }

  async calculateOrderCharge({
    pickupPincode,
    dropPincode,
    dimensions,
    actualWeight,
    orderType,
    paymentType
  }) {
    const pickupZone = await zoneService.detectZoneByPincode(pickupPincode);
    const dropZone = await zoneService.detectZoneByPincode(dropPincode);

    const isIntraZone = pickupZone && dropZone && pickupZone.id === dropZone.id;

    const l = parseFloat(dimensions?.length || 0);
    const w = parseFloat(dimensions?.width || 0);
    const h = parseFloat(dimensions?.height || 0);
    const volumetricWeight = Number(((l * w * h) / VOLUMETRIC_DIVISOR).toFixed(2));

    const actWeight = parseFloat(actualWeight || 0);
    const billableWeight = Math.max(actWeight, volumetricWeight);

    const normalizedOrderType = String(orderType || '').toUpperCase();
    const normalizedPaymentType = String(paymentType || '').toUpperCase();

    let rateCard = (memoryDb.rateCards || []).find(
      r => r.orderType === normalizedOrderType && r.isIntraZone === isIntraZone
    );

    if (!rateCard) {
      throw new Error(
        `No configured rate card for ${normalizedOrderType} ${isIntraZone ? 'intra-zone' : 'inter-zone'} route`
      );
    }

    const baseCharge = parseFloat(Number(rateCard.baseRate || 0).toFixed(2));
    const weightCharge = parseFloat((billableWeight * Number(rateCard.perKgRate || 0)).toFixed(2));
    const codSurcharge = normalizedPaymentType === 'COD'
      ? parseFloat(Number(rateCard.codSurchargeRate || 0).toFixed(2))
      : 0;

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