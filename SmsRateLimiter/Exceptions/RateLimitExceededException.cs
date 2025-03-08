namespace SmsRateLimiter.Exceptions
{
    public class RateLimitExceededException : Exception
    {
        public RateLimitExceededException(string message = "Rate Limit Exceeded for this number") : base(message)
        {
        }
    }
}