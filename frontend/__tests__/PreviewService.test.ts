// @jest-environment jsdom

import { generateVariantPreview } from '@/lib/services/PreviewService';

// Mock HTMLImageElement
const mockImage = {
  width: 100,
  height: 100,
  onload: null,
  onerror: null,
  src: '',
  crossOrigin: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any;

// Mock Image constructor
global.Image = jest.fn().mockImplementation(() => mockImage);

// Mock canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn().mockReturnValue({
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(400), // 10x10 image
    }),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(400),
    }),
    fillStyle: '',
    fillRect: jest.fn(),
    globalCompositeOperation: '',
    toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mock'),
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mock'),
};

global.document = {
  createElement: jest.fn().mockImplementation((tag) => {
    if (tag === 'canvas') return mockCanvas;
    return {};
  }),
} as any;

describe('generateVariantPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate preview using cached design image', async () => {
    const designUrl = 'http://example.com/design.png';
    const variant = {
      id: 1,
      mockup_template_url: 'http://example.com/template.png',
      mockup_print_area: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    };
    const cachedDesignImage = mockImage;

    // Mock loadImage to resolve with mockImage
    const loadImageSpy = jest.spyOn(require('@/lib/services/PreviewService'), 'loadImage');
    loadImageSpy.mockResolvedValue(mockImage);

    const result = await generateVariantPreview(designUrl, variant, cachedDesignImage);

    expect(result).toBe('data:image/jpeg;base64,mock');
    expect(loadImageSpy).toHaveBeenCalledTimes(1); // Only for template
    expect(loadImageSpy).toHaveBeenCalledWith(`/api/proxy-image?url=${encodeURIComponent(variant.mockup_template_url)}`);
  });
});