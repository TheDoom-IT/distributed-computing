import {z} from 'zod';

export const HelloMessageSchema = z.object({
    nodeId: z.string(),
    port: z.number().positive()
});
