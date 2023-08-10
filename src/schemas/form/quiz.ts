import { z } from "zod";

export const quizCreationSchemas = z.object({
  topic: z
    .string()
    .min(4, { message: "Topic must be atleast 4 characters long" }),
  type: z.enum(["mcq", "open_ended"]),
  amount: z.number().min(1).max(10),
});
