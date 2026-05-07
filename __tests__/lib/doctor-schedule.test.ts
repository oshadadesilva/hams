import {
  findHospitalAvailability,
  flattenHospitalAvailability,
  isValidScheduleSlot,
  normalizeHospitals,
} from '@/lib/doctor-schedule';

describe('doctor schedule helpers', () => {
  it('validates slots only when required text exists and start time is before end time', () => {
    expect(
      isValidScheduleSlot({
        hospitalName: ' City Hospital ',
        day: ' Monday ',
        startTime: '09:00',
        endTime: '11:00',
      }),
    ).toBe(true);

    expect(
      isValidScheduleSlot({
        hospitalName: 'City Hospital',
        day: 'Monday',
        startTime: '11:00',
        endTime: '09:00',
      }),
    ).toBe(false);
  });

  it('normalizes hospital schedules by trimming values, defaulting availability, and dropping invalid slots', () => {
    expect(
      normalizeHospitals([
        {
          hospitalName: ' City Hospital ',
          availability: [
            {
              hospitalName: '',
              day: ' Monday ',
              startTime: '09:00',
              endTime: '11:00',
            },
            {
              hospitalName: 'City Hospital',
              day: 'Tuesday',
              startTime: '14:00',
              endTime: '14:00',
            },
          ],
        },
      ]),
    ).toEqual([
      {
        hospitalName: 'City Hospital',
        availability: [
          {
            hospitalName: 'City Hospital',
            day: 'Monday',
            startTime: '09:00',
            endTime: '11:00',
            isAvailable: true,
          },
        ],
      },
    ]);
  });

  it('groups legacy availability by hospital and exposes lookup helpers', () => {
    const hospitals = normalizeHospitals(undefined, [
      {
        hospitalName: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
      },
      {
        hospitalName: 'City Hospital',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        isAvailable: false,
      },
      {
        hospitalName: 'City Hospital',
        day: 'Monday',
        startTime: '10:00',
        endTime: '09:00',
      },
      {
        hospitalName: 'General Hospital',
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    expect(hospitals).toHaveLength(2);
    expect(flattenHospitalAvailability(hospitals)).toHaveLength(2);
    expect(findHospitalAvailability(hospitals, 'General Hospital')).toMatchObject({
      hospitalName: 'General Hospital',
    });
  });

  it('drops hospitals without usable availability and returns null for missing hospital lookup', () => {
    expect(
      normalizeHospitals([
        {
          hospitalName: 'Empty Hospital',
          availability: [],
        },
        {
          hospitalName: 'No Availability Hospital',
        },
      ]),
    ).toEqual([]);
    expect(findHospitalAvailability(undefined, 'Missing Hospital')).toBeNull();
  });
});
