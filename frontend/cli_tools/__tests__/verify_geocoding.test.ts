import { verifyGeocoding } from '../verify_geocoding';
import { searchLocation, reverseGeocode } from '../../lib/geocoding/locationiq';

jest.mock('../../lib/geocoding/locationiq', () => ({
    searchLocation: jest.fn(),
    reverseGeocode: jest.fn()
}));

export { };

describe('verify_geocoding', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.LOCATIONIQ_API_KEY = 'test';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should call geocoding functions', async () => {
        (searchLocation as jest.Mock).mockResolvedValue([]);
        (reverseGeocode as jest.Mock).mockResolvedValue({});

        await verifyGeocoding();

        expect(searchLocation).toHaveBeenCalled();
        expect(reverseGeocode).toHaveBeenCalled();
    });
});
