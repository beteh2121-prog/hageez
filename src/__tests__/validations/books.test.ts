import { describe, expect, it } from 'vitest';
import { AsinSchema } from '@/lib/validations/books';

describe('AsinSchema', () => {
  it("accepts 'B08XYZ1234' (valid 10 uppercase alphanumeric)", () => {
    expect(AsinSchema.safeParse('B08XYZ1234').success).toBe(true);
  });

  it("rejects 'b08xyz1234' (lowercase)", () => {
    expect(AsinSchema.safeParse('b08xyz1234').success).toBe(false);
  });

  it("rejects 'B08XYZ123' (9 chars)", () => {
    expect(AsinSchema.safeParse('B08XYZ123').success).toBe(false);
  });

  it("rejects 'B08XYZ12345' (11 chars)", () => {
    expect(AsinSchema.safeParse('B08XYZ12345').success).toBe(false);
  });

  it("rejects 'B08XYZ!@#$' (special characters)", () => {
    expect(AsinSchema.safeParse('B08XYZ!@#$').success).toBe(false);
  });
});
