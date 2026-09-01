import { afterEach, describe, expect, it, vi } from "vitest";

const s3SendMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const s3ClientMock = vi.hoisted(() => vi.fn(() => ({ send: s3SendMock })));
const putObjectCommandMock = vi.hoisted(() => vi.fn((input: unknown) => input));

const envMock = vi.hoisted(() => ({
	APP_URL: "https://example.com",
	LOCAL_STORAGE_PATH: "",
	S3_ACCESS_KEY_ID: undefined as string | undefined,
	S3_SECRET_ACCESS_KEY: undefined as string | undefined,
	S3_REGION: "us-east-1",
	S3_ENDPOINT: undefined as string | undefined,
	S3_BUCKET: undefined as string | undefined,
	S3_FORCE_PATH_STYLE: false,
	S3_DISABLE_ACL: false,
	FLAG_DISABLE_IMAGE_PROCESSING: false,
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));
// sharp is exercised by processImageForUpload; keep it out of the import graph entirely
// because resolving it loads native bindings we can't rely on in CI.
vi.mock("sharp", () => {
	const chain = {
		resize: () => chain,
		jpeg: () => chain,
		rotate: () => chain,
		toBuffer: async () => Buffer.from("processed"),
		metadata: async () => ({ width: 100, height: 100 }),
	};
	return { default: () => chain };
});
vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: s3ClientMock,
	PutObjectCommand: putObjectCommandMock,
	GetObjectCommand: vi.fn(),
	DeleteObjectCommand: vi.fn(),
	ListObjectsV2Command: vi.fn(),
}));

const { getStorageService, inferContentType, isImageFile, processImageForUpload } = await import("./service");

const makeFile = (bytes: Uint8Array, type = "image/png") =>
	({
		arrayBuffer: async () => bytes.buffer,
		type,
	}) as unknown as File;

afterEach(() => {
	envMock.S3_ACCESS_KEY_ID = undefined;
	envMock.S3_SECRET_ACCESS_KEY = undefined;
	envMock.S3_BUCKET = undefined;
	envMock.S3_DISABLE_ACL = false;
	s3ClientMock.mockClear();
	putObjectCommandMock.mockClear();
	s3SendMock.mockClear();
});

describe("inferContentType", () => {
	it("maps common image extensions to their MIME types", () => {
		expect(inferContentType("photo.jpg")).toBe("image/jpeg");
		expect(inferContentType("photo.jpeg")).toBe("image/jpeg");
		expect(inferContentType("photo.png")).toBe("image/png");
		expect(inferContentType("animated.gif")).toBe("image/gif");
		expect(inferContentType("logo.svg")).toBe("image/svg+xml");
		expect(inferContentType("photo.webp")).toBe("image/webp");
	});

	it("maps .pdf to application/pdf", () => {
		expect(inferContentType("doc.pdf")).toBe("application/pdf");
	});

	it("is case-insensitive on the extension", () => {
		expect(inferContentType("PHOTO.JPG")).toBe("image/jpeg");
		expect(inferContentType("Document.PDF")).toBe("application/pdf");
	});

	it("falls back to application/octet-stream for unknown extensions", () => {
		expect(inferContentType("data.xyz")).toBe("application/octet-stream");
		expect(inferContentType("README")).toBe("application/octet-stream");
	});

	it("uses just the file extension regardless of path depth", () => {
		expect(inferContentType("/nested/dir/file.png")).toBe("image/png");
	});
});

describe("processImageForUpload", () => {
	it("returns the file untouched when image processing is disabled", async () => {
		envMock.FLAG_DISABLE_IMAGE_PROCESSING = true;
		const file = makeFile(new Uint8Array([1, 2, 3, 4]), "image/png");

		const result = await processImageForUpload(file);

		expect(result.contentType).toBe("image/png");
		expect(Array.from(result.data)).toEqual([1, 2, 3, 4]);
	});

	it("re-encodes to JPEG via sharp when processing is enabled", async () => {
		envMock.FLAG_DISABLE_IMAGE_PROCESSING = false;
		const file = makeFile(new Uint8Array([5, 6, 7, 8]), "image/png");

		const result = await processImageForUpload(file);

		expect(result.contentType).toBe("image/jpeg");
		// Sharp mock returns "processed" — ensure we got something not equal to the input.
		expect(result.data.length).toBeGreaterThan(0);
		expect(Array.from(result.data)).not.toEqual([5, 6, 7, 8]);
	});
});

describe("isImageFile", () => {
	it("returns true for supported image mime types", () => {
		for (const type of ["image/gif", "image/png", "image/jpeg", "image/webp"]) {
			expect(isImageFile(type), type).toBe(true);
		}
	});

	it("returns false for image/svg+xml (not in the upload allowlist)", () => {
		expect(isImageFile("image/svg+xml")).toBe(false);
	});

	it("returns false for application/pdf and other non-image types", () => {
		expect(isImageFile("application/pdf")).toBe(false);
		expect(isImageFile("text/plain")).toBe(false);
		expect(isImageFile("")).toBe(false);
	});
});

describe("LocalStorageService", () => {
	it("rejects private writes instead of silently storing them on the local filesystem", async () => {
		await expect(
			getStorageService().write({
				key: "uploads/user/private/file.txt",
				data: new TextEncoder().encode("private"),
				contentType: "text/plain",
				private: true,
			}),
		).rejects.toThrow("Private storage writes are not supported by the local filesystem backend.");
	});
});

describe("S3StorageService", () => {
	it("uses the AWS credential provider chain when a bucket exists without static keys", async () => {
		envMock.S3_BUCKET = "clouddcoffee-uploads";
		vi.resetModules();
		const { getStorageService: getFreshStorageService } = await import("./service");

		getFreshStorageService();

		expect(s3ClientMock).toHaveBeenCalledWith({
			region: "us-east-1",
			forcePathStyle: false,
		});
	});

	it("omits object ACLs when ACLs are disabled", async () => {
		envMock.S3_BUCKET = "clouddcoffee-uploads";
		envMock.S3_ACCESS_KEY_ID = "access-key";
		envMock.S3_SECRET_ACCESS_KEY = "secret-key";
		envMock.S3_DISABLE_ACL = true;
		vi.resetModules();
		const { getStorageService: getFreshStorageService } = await import("./service");

		await getFreshStorageService().write({
			key: "uploads/user/picture.jpg",
			data: new Uint8Array([1]),
			contentType: "image/jpeg",
		});

		expect(putObjectCommandMock).toHaveBeenCalledWith({
			Bucket: "clouddcoffee-uploads",
			Key: "uploads/user/picture.jpg",
			Body: new Uint8Array([1]),
			ContentType: "image/jpeg",
		});
	});
});
