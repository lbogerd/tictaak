import { DateTime } from "luxon";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateNextPrintDate } from "./logic";

describe("logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(DateTime.fromISO("2025-01-01T00:00:00.000Z").toJSDate());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should correctly calculate the next print for today", () => {
    const wednesdayPattern = [3];

    const nextPrintDate = calculateNextPrintDate(wednesdayPattern);

    expect(nextPrintDate).toStrictEqual(
      DateTime.now().startOf("day").toJSDate()
    );
  });

  it("should correctly calculate the next print for tomorrow", () => {
    const thursdayPattern = [4];

    const nextPrintDate = calculateNextPrintDate(thursdayPattern);

    expect(nextPrintDate).toStrictEqual(
      DateTime.now().plus({ days: 1 }).startOf("day").toJSDate()
    );
  });

  it("should correctly calculate the next print for the next week", () => {
    const tuesdayPattern = [2];

    const nextPrintDate = calculateNextPrintDate(tuesdayPattern);

    expect(nextPrintDate).toStrictEqual(
      DateTime.now().plus({ days: 6 }).startOf("day").toJSDate()
    );
  });

  it("should throw an error if the recurrence pattern is invalid", () => {
    const invalidPattern: number[] = [];

    expect(() => calculateNextPrintDate(invalidPattern)).toThrow(
      "Recurrence pattern invalid"
    );
  });
});
