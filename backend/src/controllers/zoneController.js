const zoneService = require('../services/zoneService');

exports.getZones = async (req, res, next) => {
  try {
    const zones = await zoneService.getAllZones();
    res.json({ success: true, data: zones });
  } catch (err) {
    next(err);
  }
};

exports.createZone = async (req, res, next) => {
  try {
    const zone = await zoneService.createZone(req.body);
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
};

exports.updateZone = async (req, res, next) => {
  try {
    const zone = await zoneService.updateZone(req.params.id, req.body);
    res.json({ success: true, data: zone });
  } catch (err) {
    next(err);
  }
};

exports.deleteZone = async (req, res, next) => {
  try {
    await zoneService.deleteZone(req.params.id);
    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (err) {
    next(err);
  }
};
