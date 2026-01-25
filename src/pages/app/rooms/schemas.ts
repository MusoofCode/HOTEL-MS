import { z } from "zod";

export const roomTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  base_rate: z.coerce.number().positive("Rate must be greater than 0"),
  max_occupancy: z.coerce.number().int().min(1, "Must be at least 1"),
});

export type RoomTypeValues = {
  name: string;
  base_rate: number;
  max_occupancy: number;
};

export const roomSchema = z.object({
  room_number: z.string().trim().min(1, "Room number is required"),
  room_type_id: z.string().uuid("Select a room type"),
  rate_override: z.union([z.coerce.number().positive(), z.nan()]).optional(),
});

export type RoomFormValues = z.infer<typeof roomSchema>;
