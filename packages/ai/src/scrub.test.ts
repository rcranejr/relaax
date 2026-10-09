import { describe, it, expect } from "vitest";
import { scrubPii } from "./scrub";

describe("scrubPii", () => {
  it("removes emails, phones, dates and addresses", () => {
    const s = scrubPii("email me at kid@example.com or 555-123-4567, born 03/14/2012, I live at 12 Oak Street");
    expect(s).toBe("email me at [email] or [phone], born [date], I live at [address]");
  });
  it("removes known names case-insensitively", () => {
    expect(scrubPii("Coach says Jordan is fast", ["Jordan"])).toBe("Coach says [name] is fast");
  });
});
