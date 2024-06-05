import {z} from 'zod';

export const HelloMessageSchema = z.object({
    nodeId: z.string(),
    port: z.number().positive(),
    ip: z.string()
});

export type HelloMessage = z.infer<typeof HelloMessageSchema>;
