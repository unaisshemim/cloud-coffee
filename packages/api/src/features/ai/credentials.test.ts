import { describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
	ENCRYPTION_SECRET: "test-secret-with-enough-entropy",
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));

const { decryptCredential, encryptCredential, fingerprintCredential, redactEncryptedCredential } = await import(
	"./credentials"
);

describe("AI credential encryption", () => {
	it("encrypts and decrypts provider API keys without storing plaintext", () => {
		const encrypted = encryptCredential("sk-test-secret");

		expect(encrypted.encryptedApiKey).not.toContain("sk-test-secret");
		expect(encrypted.apiKeyPreview).toBe("sk-t...cret");
		expect(decryptCredential(encrypted.encryptedApiKey)).toBe("sk-test-secret");
	});

	it("generates salted non-revealable fingerprints", () => {
		const first = fingerprintCredential("sk-test-secret", "salt-a");
		const again = fingerprintCredential("sk-test-secret", "salt-a");
		const differentSalt = fingerprintCredential("sk-test-secret", "salt-b");

		expect(first).toBe(again);
		expect(first).not.toBe(differentSalt);
		expect(first).not.toContain("sk-test-secret");
	});

	it("redacts stored encrypted credential fields from API responses", () => {
		const encrypted = encryptCredential("sk-test-secret");

		const redacted = redactEncryptedCredential({
			encryptedApiKey: encrypted.encryptedApiKey,
			apiKeySalt: encrypted.apiKeySalt,
			apiKeyHash: encrypted.apiKeyHash,
			apiKeyPreview: encrypted.apiKeyPreview,
		});

		expect(redacted).toEqual({
			apiKeyFingerprint: encrypted.apiKeyHash,
			apiKeyPreview: encrypted.apiKeyPreview,
		});
		expect(JSON.stringify(redacted)).not.toContain(encrypted.encryptedApiKey);
		expect(JSON.stringify(redacted)).not.toContain(encrypted.apiKeySalt);
	});
});
