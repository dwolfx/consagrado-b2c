import { createApi } from './create';
import { statusApi } from './status';
import { paymentApi } from './payment';
import { splitApi } from './split';
import { _channelCache } from './channel'; // Exported for debugging/advanced usage if needed

export const orderApi = {
    ...createApi,
    ...statusApi,
    ...paymentApi,
    ...splitApi
};

export { _channelCache };
