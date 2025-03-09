namespace SmsRateLimiter.Services
{
    public interface IRateLimiter
    {
        Task CheckLimits(string phoneNumber);
    }
}