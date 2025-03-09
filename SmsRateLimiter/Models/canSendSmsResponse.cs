namespace SmsRateLimiter.Models
{
    public class CanSendSmsResponse
    {
        public required string AccountNumber { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Message { get; set; }
    }
}