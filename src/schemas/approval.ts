import { z } from "zod";

export const approvalSchema = z.object({
  postId: z.string().min(1),
  status: z.enum(["APPROVED", "REVISION_REQUESTED", "REJECTED"]),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export type ApprovalInput = z.infer<typeof approvalSchema>;
