import {z} from 'zod';

export const StartVotingSchema = z.object({
    nodeId: z.string(),
    votingId: z.string(),
    endTime: z.number().positive(),
    question: z.string(),
    voteOptions: z.array(z.string())
});

export type StartVoting = z.infer<typeof StartVotingSchema>;
