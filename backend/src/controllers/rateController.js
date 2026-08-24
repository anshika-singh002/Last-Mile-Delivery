const rateService = require('../services/rateService');

exports.getRateCards = async (req, res, next) => {
  try {
    const cards = await rateService.getAllRateCards();
    res.json({ success: true, data: cards });
  } catch (err) {
    next(err);
  }
};

exports.createRateCard = async (req, res, next) => {
  try {
    const card = await rateService.createRateCard(req.body);
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

exports.updateRateCard = async (req, res, next) => {
  try {
    const card = await rateService.updateRateCard(req.params.id, req.body);
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};