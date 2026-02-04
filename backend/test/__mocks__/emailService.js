// Mock del servicio de email para tests
export const sendVerificationEmail = jest.fn().mockResolvedValue({
    success: true,
    messageId: "test-message-id",
    previewUrl: "https://test.com/preview",
});
