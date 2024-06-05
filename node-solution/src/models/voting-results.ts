import {z} from 'zod';

export const VotingResultsSchema = z.object({
    votingId: z.string(),
    question: z.string(),
    voteOptions: z.array(z.string()),
    results: z.array(z.number())
});

export type VotingResults = z.infer<typeof VotingResultsSchema>;
