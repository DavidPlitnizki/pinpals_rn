import * as StoreReview from 'expo-store-review';

import { requestStoreReview, resetStoreReviewModuleCacheForTests } from '../storeReview';

jest.mock('../crashReporting', () => ({ reportError: jest.fn() }));

const mockIsAvailable = StoreReview.isAvailableAsync as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  resetStoreReviewModuleCacheForTests();
});

describe('requestStoreReview', () => {
  it('asks for a review only once the platform says it can actually show one', async () => {
    mockIsAvailable.mockResolvedValueOnce(true);

    await requestStoreReview();

    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the platform says a prompt is not available', async () => {
    mockIsAvailable.mockResolvedValueOnce(false);

    await requestStoreReview();

    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('swallows a failed availability check rather than throwing out of a fire-and-forget call', async () => {
    mockIsAvailable.mockRejectedValueOnce(new Error('native module missing'));

    await expect(requestStoreReview()).resolves.toBeUndefined();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('swallows a failed review request the same way', async () => {
    mockIsAvailable.mockResolvedValueOnce(true);
    mockRequestReview.mockRejectedValueOnce(new Error('SKStoreReviewController unavailable'));

    await expect(requestStoreReview()).resolves.toBeUndefined();
  });
});
