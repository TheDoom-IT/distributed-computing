import {z} from 'zod';

export const ElectionMessageSchema = z.object({
    nodeId: z.string(),
    oldHostId: z.string(),
    timestamp: z.number().positive(),
});

export const ElectionMessageResponseSchema = z.object({
    response: z.string()
});

export const ElectionResultSchema = z.object({
    nodeId: z.string(),
    oldHostId: z.string()
});

export const ElectionResultResponseSchema = z.object({
    votes: z.array(z.tuple([z.string(), z.number().nonnegative().nullable()])),
});

export type ElectionMessage = z.infer<typeof ElectionMessageSchema>;
export type ElectionMessageResponse = z.infer<typeof ElectionMessageResponseSchema>;
export type ElectionResult = z.infer<typeof ElectionResultSchema>;
export type ElectionResultResponse = z.infer<typeof ElectionResultResponseSchema>;
