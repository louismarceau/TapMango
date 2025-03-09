namespace SmsRateLimiter.Exceptions
{
    public class RateLimitExceededException : Exception
    {
        public RateLimitExceededException(string phoneNumber)
            : base($"Rate Limit Exceeded for this number: {phoneNumber}")
        {
        }
    }
}