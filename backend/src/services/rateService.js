const { memoryDb } = require('../config/database');
const zoneService = require('./zoneService');
const { VOLUMETRIC_DIVISOR } = require('../config/constants');

class RateService {
  async getAllRateCards() {
    return memoryDb.rateCards || [];
  }

  async createRateCard(rateData) {
    const orderType = String(rateData.orderType || '').toUpperCase();

    if (!['B2B', 'B2C'].includes(orderType)) {
      throw new Error('Invalid order type');
    }

    const isIntraZone = Boolean(rateData.isIntraZone);

    const existingCard = (memoryDb.rateCards || []).find(
      r => r.orderType === orderType && r.isIntraZone === isIntraZone
    );

    const payload = {
      id: existingCard ? existingCard.id : `rate-${Date.now()}`,
      orderType,
      isIntraZone,
      baseRate: parseFloat(rateData.baseRate ?? 0),
      perKgRate: parseFloat(rateData.perKgRate ?? 0),
      codSurchargeRate: parseFloat(rateData.codSurchargeRate ?? 0)
    };

    if (existingCard) {
      Object.assign(existingCard, payload);
      return existingCard;
    }

    memoryDb.rateCards.push(payload);
    return payload;
  }

  async updateRateCard(id, updateData) {
    const card = (memoryDb.rateCards || []).find(r => r.id === id);
    if (!card) throw new Error('Rate card not found');

    if (updateData.baseRate != null) card.baseRate = parseFloat(updateData.baseRate);
    if (updateData.perKgRate != null) card.perKgRate = parseFloat(updateData.perKgRate);
    if (updateData.codSurchargeRate != null) card.codSurchargeRate = parseFloat(updateData.codSurchargeRate);
    if (updateData.orderType) card.orderType = String(updateData.orderType).toUpperCase();
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
    let pickupZone = await zoneService.detectZoneByPincode(pickupPincode);
    let dropZone = await zoneService.detectZoneByPincode(dropPincode);

    if (!pickupZone && pickupPincode) {
      pickupZone = await zoneService.createZone({
        name: `Zone ${pickupPincode}`,
        code: `Z-${String(pickupPincode).slice(-3)}`,
        pincodes: [pickupPincode]
      });
    }

    if (!dropZone && dropPincode) {
      dropZone = await zoneService.createZone({
        name: `Zone ${dropPincode}`,
        code: `Z-${String(dropPincode).slice(-3)}`,
        pincodes: [dropPincode]
      });
    }

    const isIntraZone = Boolean(pickupZone && dropZone && pickupZone.id === dropZone.id);

    const l = parseFloat(dimensions?.length || 0);
    const w = parseFloat(dimensions?.width || 0);
    const h = parseFloat(dimensions?.height || 0);
    const volumetricWeight = Number(((l * w * h) / VOLUMETRIC_DIVISOR).toFixed(2));

    const actWeight = parseFloat(actualWeight || 0);
    const billableWeight = Math.max(actWeight, volumetricWeight);

    const normalizedOrderType = String(orderType || '').toUpperCase();
    const normalizedPaymentType = String(paymentType || '').toUpperCase();

    const rateCard = (memoryDb.rateCards || []).find(
      r => r.orderType === normalizedOrderType && r.isIntraZone === isIntraZone
    );

    if (!rateCard) {
      throw new Error(
        `No configured rate card for ${normalizedOrderType} ${isIntraZone ? 'intra-zone' : 'inter-zone'} route`
      );
    }

    const baseCharge = parseFloat(Number(rateCard.baseRate || 0).toFixed(2));
    const weightCharge = parseFloat((billableWeight * Number(rateCard.perKgRate || 0)).toFixed(2));
    const codSurcharge =
      normalizedPaymentType === 'COD'
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