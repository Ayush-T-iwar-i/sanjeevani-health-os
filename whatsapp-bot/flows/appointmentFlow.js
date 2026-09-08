const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/**
 * Text-only appointment booking for WhatsApp users (Problem 1, 6).
 * Steps: 0 = ask patient identifier, 1 = ask facility, 2 = confirm booking.
 */
async function handleAppointmentFlow(session, text) {
  switch (session.step) {
    case 0:
      session.data.identifier = text;
      session.step = 1;
      return { message: 'Which facility would you like to visit? Reply with the facility name or area (e.g. "Rampur PHC").' };

    case 1: {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/facilities/search`, {
          params: { query: text },
        });
        if (!data.results?.length) {
          return { message: 'No matching facility found. Please try another name, or reply "menu" to start over.' };
        }
        session.data.facilityId = data.results[0].facility_id;
        session.data.facilityName = data.results[0].name;
        session.step = 2;
        return { message: `Found: ${data.results[0].name}. Reply "yes" to confirm booking, or "no" to cancel.` };
      } catch (err) {
        return { message: 'Facility search failed. Please try again later.', done: true };
      }
    }

    case 2: {
      if (text.trim().toLowerCase() !== 'yes') {
        return { message: 'Booking cancelled. Reply "menu" to start over.', done: true };
      }
      try {
        const { data } = await axios.post(`${BACKEND_URL}/api/appointments/book`, {
          patientId: session.data.identifier,
          facilityId: session.data.facilityId,
          triagePriority: 'GREEN',
        });
        return {
          message: `Appointment booked at ${session.data.facilityName}.\nQueue position: ${data.queue_position}\nEstimated wait: ${data.estimated_wait_time_minutes} min.`,
          done: true,
        };
      } catch (err) {
        return { message: 'Booking failed. Please try again later or visit the facility directly.', done: true };
      }
    }

    default:
      return { message: 'Session ended. Reply "menu" to start again.', done: true };
  }
}

module.exports = { handleAppointmentFlow };
