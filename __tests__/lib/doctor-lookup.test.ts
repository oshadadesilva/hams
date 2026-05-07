const mockFindOne = jest.fn();
class MockObjectId {
  constructor(private readonly value: string) {}

  toString() {
    return this.value;
  }
}

let findDoctorByFlexibleId: typeof import('@/lib/doctor-lookup')['findDoctorByFlexibleId'];
let getFlexibleDoctorIdFilter: typeof import('@/lib/doctor-lookup')['getFlexibleDoctorIdFilter'];

describe('doctor lookup helpers', () => {
  beforeAll(async () => {
    jest.doMock('mongoose', () => ({
      Types: {
        ObjectId: Object.assign(MockObjectId, {
          isValid: (value: string) => /^[a-f\d]{24}$/i.test(value),
        }),
      },
    }));

    jest.doMock('@/models/Doctor', () => ({
      __esModule: true,
      default: {
        collection: {
          findOne: mockFindOne,
        },
      },
    }));

    ({ findDoctorByFlexibleId, getFlexibleDoctorIdFilter } = await import(
      '@/lib/doctor-lookup'
    ));
  });

  beforeEach(() => {
    mockFindOne.mockReset();
  });

  it('builds a flexible id filter with string and ObjectId candidates for valid ObjectIds', () => {
    const id = '507f1f77bcf86cd799439011';
    const filter = getFlexibleDoctorIdFilter(` ${id} `) as {
      _id: { $in: unknown[] };
    };

    expect(filter._id.$in).toHaveLength(2);
    expect(filter._id.$in[0]).toBe(id);
    expect(filter._id.$in[1]).toBeInstanceOf(MockObjectId);
    expect(String(filter._id.$in[1])).toBe(id);
  });

  it('uses only the trimmed string candidate for non-ObjectId values', () => {
    expect(getFlexibleDoctorIdFilter(' doctor-1 ')).toEqual({
      _id: { $in: ['doctor-1'] },
    });
  });

  it('queries the doctor collection with the flexible id filter', async () => {
    const doctor = { _id: 'doctor-1', name: 'Dr Unit' };
    mockFindOne.mockResolvedValue(doctor);

    await expect(findDoctorByFlexibleId('doctor-1')).resolves.toBe(doctor);
    expect(mockFindOne).toHaveBeenCalledWith({ _id: { $in: ['doctor-1'] } });
  });
});
