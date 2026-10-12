import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, parsePhone, whatsappUrl } from "./phone";

describe("parsePhone — smart paste", () => {
  it.each([
    ["+995 599 12 34 56", "995", "599123456", true],
    ["+995599123456", "995", "599123456", true],
    ["995599123456", "995", "599123456", true],
    ["00995 599-12-34-56", "995", "599123456", true],
    ["+994 50 214 77 31", "994", "502147731", true],
    ["00374 91 55 20 18", "374", "91552018", true],
    ["+90 532 123 45 67", "90", "5321234567", true],
    ["+90 0532 123 45 67", "90", "5321234567", true],
    ["+7 916 123-45-67", "7", "9161234567", true],
    ["8 916 123 45 67", "7", "9161234567", true],
    ["+998 90 123 45 67", "998", "901234567", true],
    ["+380 (67) 412 30 55", "380", "674123055", true],
    ["‪+995 577 45 21 09‬", "995", "577452109", true], // WhatsApp adds invisible direction marks
  ])("%s", (input, dial, local, detected) => {
    expect(parsePhone(input, "995")).toEqual({ dial, local, detected });
  });

  it("keeps the selected code for plain local numbers", () => {
    expect(parsePhone("599 12 34 56", "995")).toEqual({ dial: "995", local: "599123456", detected: false });
    expect(parsePhone("50 214 77 31", "994")).toEqual({ dial: "994", local: "502147731", detected: false });
  });

  it("never doubles the code", () => {
    expect(normalizePhone("+995 599 12 34 56", "995")).toBe("+995599123456");
    expect(normalizePhone("599123456", "995")).toBe("+995599123456");
    expect(normalizePhone("00995599123456", "995")).toBe("+995599123456");
  });

  it("rejects things that are not phone numbers", () => {
    expect(normalizePhone("", "995")).toBeNull();
    expect(normalizePhone("123", "995")).toBeNull();
    expect(normalizePhone("hello", "995")).toBeNull();
  });
});

describe("formatting", () => {
  it("formats for display", () => {
    expect(formatPhone("+995599123456")).toBe("+995 599 12 34 56");
    expect(formatPhone("+79161234567")).toBe("+7 916 123 45 67");
    expect(formatPhone("+37491552018")).toBe("+374 91 55 20 18");
    expect(formatPhone("+994502147731")).toBe("+994 50 214 77 31");
    expect(formatPhone("+998901234567")).toBe("+998 90 123 45 67");
  });

  it("builds WhatsApp links", () => {
    expect(whatsappUrl("+995599123456")).toBe("https://wa.me/995599123456");
  });
});
