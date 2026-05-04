import { describe, expect, it } from "vitest";
import { buildSlug } from "./slug";

describe("buildSlug", () => {
  it("lowercases and joins with class year", () => {
    expect(buildSlug("Daniel Jeun", 2027)).toBe("daniel-jeun-2027");
  });

  it("collapses non-alphanumerics", () => {
    expect(buildSlug("Mary  O'Connor-Smith", 2019)).toBe("mary-o-connor-smith-2019");
  });

  it("trims leading and trailing dashes", () => {
    expect(buildSlug("  ?? Foo ??  ", 2020)).toBe("foo-2020");
  });
});
