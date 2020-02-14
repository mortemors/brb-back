import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import { utcToZonedTime } from 'date-fns-tz';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
    /**
     * Check if provider_id is a provider
     */
    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      throw new Error('You can only create appointments with providers');
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hourStart = utcToZonedTime(startOfHour(parseISO(date)), timezone);

    /** Check for past dates */
    if (isBefore(hourStart, new Date())) {
      throw new Error('Past dates are not permitted');
    }

    /** Check date availability */

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });
    if (checkAvailability) {
      throw new Error('Appointment date is not available');
    }
    if (user_id === provider_id) {
      throw new Error('Provider can not set an appointment with himself');
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date,
    });

    /** Notify appointment provider */
    const user = await User.findByPk(user_id);
    const formattedDate = format(
      subHours(hourStart, 1), // corrige a hora
      "'dia' dd 'de' MMMM', às' H:mm'h.'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return appointment;
  }
}

export default new CreateAppointmentService();
