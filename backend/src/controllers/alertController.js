import { dbStore } from '../services/dbStore.js';

export const getAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.read !== undefined) {
      filter.read = req.query.read === 'true';
    }

    const total = await dbStore.countAlerts(filter);
    const alerts = await dbStore.findAlerts(filter, skip, limit);

    res.status(200).json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching alerts', details: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const alert = await dbStore.updateAlertRead(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.status(200).json({ message: 'Alert marked as read', alert });
  } catch (err) {
    res.status(500).json({ error: 'Server error marking alert as read', details: err.message });
  }
};

export const clearAll = async (req, res) => {
  try {
    await dbStore.markAllAlertsRead();
    res.status(200).json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error clearing alerts', details: err.message });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await dbStore.deleteAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting alert', details: err.message });
  }
};
