namespace SmsRateLimiter.Exceptions
{
    public class GlobalRateLimitExceededException : Exception
    {
        public GlobalRateLimitExceededException(string phoneNumber)
            : base($"Global Rate Limit Exceeded for this number: {phoneNumber}")
        {
        }
    }
}