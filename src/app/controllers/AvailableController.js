import AvailableService from '../services/AvailableService';

class Availablecontroller {
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ erro: 'Invalid date.' });
    }
    const searchDate = Number(date);

    const available = await AvailableService.run({
      date: searchDate,
      provider_id: req.params.providerId,
    });

    return res.json(available);
  }
}
export default new Availablecontroller();
