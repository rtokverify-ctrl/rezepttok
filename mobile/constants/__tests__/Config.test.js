import { getFullUrl, BASE_URL } from '../Config';

describe('Config', () => {
    it('getFullUrl returns the URL unchanged if it starts with http', () => {
        const url = 'https://example.com/video.mp4';
        expect(getFullUrl(url)).toBe(url);
    });

    it('getFullUrl prepends BASE_URL if the URL is relative', () => {
        const url = '/static/video.mp4';
        expect(getFullUrl(url)).toBe(`${BASE_URL}${url}`);
    });

    it('getFullUrl prepends BASE_URL with missing slash correctly', () => {
        const url = 'static/video.mp4';
        expect(getFullUrl(url)).toBe(`${BASE_URL}/${url}`);
    });

    it('getFullUrl returns null for empty url', () => {
        expect(getFullUrl(null)).toBeNull();
    });
});
