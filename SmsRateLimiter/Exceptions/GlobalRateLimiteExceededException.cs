namespace SmsRateLimiter.Exceptions
{
    public class GlobalRateLimitExceededException : Exception
    {
        public GlobalRateLimitExceededException(string message = "Global Rate Limit Exceeded") : base(message)
        {
        }
    }
}